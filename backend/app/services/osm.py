"""Fetch hiking trails in Greece from OpenStreetMap via the Overpass API."""

from __future__ import annotations

import hashlib
import json
import math
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings
from app.logging import get_logger

logger = get_logger("services.osm")

# Greece bounding box (covers mainland + islands)
_GREECE_BBOX = "(34.5,19.3,42.0,30.0)"

_OVERPASS_QUERY = f"""
[out:json][timeout:60];
(
  relation["route"="hiking"]["name"]{_GREECE_BBOX};
  way["highway"="path"]["sac_scale"]{_GREECE_BBOX};
);
out center tags;
"""

_DIFFICULTY_MAP = {
    "hiking": "Easy",
    "mountain_hiking": "Moderate",
    "demanding_mountain_hiking": "Strenuous",
    "alpine_hiking": "Strenuous",
    "demanding_alpine_hiking": "Strenuous",
    "difficult_alpine_hiking": "Strenuous",
}

# Naismith's rule: ~4 km/h + 1 h per 600 m elevation
_SPEED_KMH = 4.0
_ELEVATION_PENALTY_H_PER_M = 1.0 / 600


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _stable_id(osm_type: str, osm_id: int) -> str:
    raw = f"{osm_type}/{osm_id}"
    return hashlib.sha256(raw.encode()).hexdigest()[:12]


def _region_from_tags(tags: dict[str, str]) -> str:
    parts: list[str] = []
    for key in ("place", "is_in", "is_in:region", "addr:state"):
        val = tags.get(key)
        if val:
            parts.append(val)
            break
    return parts[0] if parts else "Greece"


def _parse_element(el: dict[str, Any]) -> dict[str, Any] | None:
    tags = el.get("tags", {})
    name = tags.get("name") or tags.get("name:en")
    if not name:
        return None

    center = el.get("center", {})
    lat = center.get("lat") or el.get("lat")
    lng = center.get("lon") or el.get("lon")
    if lat is None or lng is None:
        return None

    osm_type = el.get("type", "way")
    osm_id = el.get("id", 0)

    sac = tags.get("sac_scale", "hiking")
    difficulty = _DIFFICULTY_MAP.get(sac, "Moderate")

    length_km = 0.0
    dist_tag = tags.get("distance")
    if dist_tag:
        try:
            length_km = float(dist_tag.replace("km", "").strip())
        except ValueError:
            pass

    elevation_m = 0.0
    for key in ("ele", "ascent", "elevation"):
        val = tags.get(key)
        if val:
            try:
                elevation_m = float(val.replace("m", "").strip())
                break
            except ValueError:
                pass

    duration_h = 0.0
    if length_km > 0:
        duration_h = round(length_km / _SPEED_KMH + elevation_m * _ELEVATION_PENALTY_H_PER_M, 1)

    blurb = tags.get("description") or tags.get("description:en") or ""

    return {
        "id": _stable_id(osm_type, osm_id),
        "osm_id": osm_id,
        "name": name,
        "region": _region_from_tags(tags),
        "lat": float(lat),
        "lng": float(lng),
        "difficulty": difficulty,
        "length_km": length_km,
        "elevation_m": elevation_m,
        "duration_h": duration_h,
        "blurb": blurb,
        "tags": list(tags.keys()),
    }


async def fetch_trails_from_osm() -> list[dict[str, Any]]:
    """Query the Overpass API and return parsed trail dicts."""
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            settings.overpass_url,
            data={"data": _OVERPASS_QUERY},
        )
        resp.raise_for_status()

    data = resp.json()
    elements = data.get("elements", [])
    await logger.ainfo("Overpass returned elements", count=len(elements))

    trails: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for el in elements:
        parsed = _parse_element(el)
        if parsed and parsed["id"] not in seen_ids:
            seen_ids.add(parsed["id"])
            trails.append(parsed)

    await logger.ainfo("Parsed unique trails", count=len(trails))
    return trails


async def upsert_cached_trails(pool, trails: list[dict[str, Any]]) -> None:
    """Insert or update trail rows in cached_trails."""
    now = datetime.now(timezone.utc)
    for t in trails:
        await pool.execute(
            """INSERT INTO cached_trails
                 (id, osm_id, name, region, lat, lng, difficulty,
                  length_km, elevation_m, duration_h, blurb, tags, fetched_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
               ON CONFLICT (id) DO UPDATE SET
                 name=EXCLUDED.name, region=EXCLUDED.region,
                 lat=EXCLUDED.lat, lng=EXCLUDED.lng,
                 difficulty=EXCLUDED.difficulty, length_km=EXCLUDED.length_km,
                 elevation_m=EXCLUDED.elevation_m, duration_h=EXCLUDED.duration_h,
                 blurb=EXCLUDED.blurb, tags=EXCLUDED.tags, fetched_at=EXCLUDED.fetched_at""",
            t["id"], t["osm_id"], t["name"], t["region"],
            t["lat"], t["lng"], t["difficulty"],
            t["length_km"], t["elevation_m"], t["duration_h"],
            t["blurb"], json.dumps(t["tags"]), now,
        )


async def get_cached_trails(pool) -> list[dict[str, Any]]:
    """Return all cached trails, ordered by name."""
    rows = await pool.fetch(
        "SELECT * FROM cached_trails ORDER BY name"
    )
    return [dict(r) for r in rows]


async def get_cached_trail(pool, trail_id: str) -> dict[str, Any] | None:
    row = await pool.fetchrow("SELECT * FROM cached_trails WHERE id = $1", trail_id)
    return dict(row) if row else None
