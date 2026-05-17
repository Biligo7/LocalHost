import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ThreadSidebar } from "@/components/ThreadSidebar";
import {
  PersonalizationDialog,
  type PersonalizationDialogMode,
} from "@/components/PersonalizationDialog";
import { api } from "@/api/client";
import {
  personalizeGateKey,
  personalizeSkipKey,
} from "@/lib/personalizationSession";
import { getTrailById, type Trail } from "@/lib/trails";

type PersonalizeState =
  | { open: false }
  | { open: true; mode: PersonalizationDialogMode };

type SelectedSavedTrail = { id: string; nonce: number } | null;

export type SaveTrailResult = "added" | "exists" | "missing";

export type AppOutletContext = {
  savedTrailIds: string[];
  onSaveTrail: (id: string) => SaveTrailResult;
  selectedSavedTrail: SelectedSavedTrail;
};

const SAVED_TRAILS_KEY_PREFIX = "local-host:saved-trails";

function savedTrailsKey(userId: string) {
  return `${SAVED_TRAILS_KEY_PREFIX}:${userId}`;
}

function readSavedTrailIds(userId: string): string[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(savedTrailsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id): id is string => typeof id === "string" && Boolean(getTrailById(id)),
    );
  } catch {
    return [];
  }
}

function writeSavedTrailIds(userId: string, ids: string[]) {
  if (!userId || typeof window === "undefined") return;
  localStorage.setItem(savedTrailsKey(userId), JSON.stringify(ids));
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [personalize, setPersonalize] = useState<PersonalizeState>({ open: false });
  const [savedTrailIds, setSavedTrailIds] = useState<string[]>([]);
  const [selectedSavedTrail, setSelectedSavedTrail] =
    useState<SelectedSavedTrail>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
      } else {
        setSession(session);
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/login", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const userId = session?.user?.id ?? "";

  useEffect(() => {
    if (!userId) {
      setSavedTrailIds([]);
      setSelectedSavedTrail(null);
      return;
    }

    setSavedTrailIds(readSavedTrailIds(userId));
    setSelectedSavedTrail(null);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const gate = personalizeGateKey(userId);
    const skip = personalizeSkipKey(userId);

    if (sessionStorage.getItem(gate) === "done") return;
    if (sessionStorage.getItem(gate) === "pending") return;

    if (sessionStorage.getItem(skip)) {
      sessionStorage.setItem(gate, "done");
      return;
    }

    sessionStorage.setItem(gate, "pending");
    let cancelled = false;

    api
      .getPreferences()
      .then((res) => {
        if (cancelled) return;
        sessionStorage.setItem(gate, "done");
        if (res.onboardingCompleted) return;
        if (sessionStorage.getItem(skip)) return;
        setPersonalize({ open: true, mode: "onboarding" });
      })
      .catch(() => {
        if (!cancelled) sessionStorage.setItem(gate, "done");
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!ready || !session) {
    return (
      <div className="grid h-screen place-items-center bg-[var(--gradient-horizon)] text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const savedTrails = savedTrailIds
    .map((id) => getTrailById(id))
    .filter((trail): trail is Trail => Boolean(trail));

  const persistSavedTrailIds = (ids: string[]) => {
    setSavedTrailIds(ids);
    writeSavedTrailIds(userId, ids);
  };

  const saveTrail = (id: string): SaveTrailResult => {
    if (!getTrailById(id)) return "missing";
    if (savedTrailIds.includes(id)) return "exists";
    persistSavedTrailIds([id, ...savedTrailIds]);
    return "added";
  };

  const removeSavedTrail = (id: string) => {
    persistSavedTrailIds(savedTrailIds.filter((savedId) => savedId !== id));
  };

  const selectSavedTrail = (id: string) => {
    if (!getTrailById(id)) return;
    setSelectedSavedTrail({ id, nonce: Date.now() });
    if (!location.pathname.startsWith("/chat/")) navigate("/");
  };

  const outletContext: AppOutletContext = {
    savedTrailIds,
    onSaveTrail: saveTrail,
    selectedSavedTrail,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ThreadSidebar
        email={session.user.email ?? null}
        userId={userId}
        savedTrails={savedTrails}
        onSelectSavedTrail={selectSavedTrail}
        onRemoveSavedTrail={removeSavedTrail}
        onOpenProfileSettings={() => setPersonalize({ open: true, mode: "settings" })}
      />
      <main className="flex-1 overflow-hidden">
        <Outlet context={outletContext} />
      </main>

      {personalize.open && (
        <PersonalizationDialog
          open={personalize.open}
          mode={personalize.mode}
          userId={userId}
          onClose={() => setPersonalize({ open: false })}
        />
      )}
    </div>
  );
}
