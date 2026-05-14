import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import type { TrainingDataset, TrainingExample } from "../types/api.js";

interface Props {
  onClose: () => void;
}

export function TrainingDataPanel({ onClose }: Props) {
  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    void api.listExamples(selected ?? undefined).then(setExamples);
  }, [selected]);

  const refresh = async () => {
    const all = await api.listDatasets();
    setDatasets(all);
  };

  const create = async () => {
    if (!newName.trim()) return;
    await api.createDataset(newName.trim());
    setNewName("");
    await refresh();
  };

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full w-[360px] max-w-[100vw] flex-col overflow-y-auto border-l-2 border-[#1e3a8a] bg-[#141824] p-6 text-foreground shadow-[-4px_0_12px_rgba(0,0,0,0.4)]"
      style={{ borderRadius: "0px" }}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[15px] font-semibold">Training data</h2>
        <button
          type="button"
          onClick={onClose}
          className="border border-[#334155] bg-transparent px-3 py-1 text-sm text-foreground transition-colors hover:border-[#1e3a8a]"
          style={{ borderRadius: "0px" }}
        >
          Close
        </button>
      </header>

      <div className="mb-4 flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Datasets</label>
        <select
          value={selected ?? ""}
          onChange={(e) => setSelected(e.target.value || null)}
          className="border-2 border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-foreground focus:border-[#1e3a8a] focus:outline-none"
          style={{ borderRadius: "0px" }}
        >
          <option value="">All examples</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Create dataset</label>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Dataset name"
          className="border-2 border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#1e3a8a] focus:outline-none"
          style={{ borderRadius: "0px" }}
        />
        <button
          type="button"
          onClick={() => void create()}
          className="mt-1 bg-[#1e3a8a] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1e40af]"
          style={{ borderRadius: "0px" }}
        >
          Create
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Examples ({examples.length})</label>
        <a
          className="inline-block bg-[#1e3a8a] px-3 py-2 text-center text-sm font-semibold text-white no-underline transition-colors hover:bg-[#1e40af]"
          style={{ borderRadius: "0px" }}
          href={api.exportJsonlUrl(selected ?? undefined)}
          download
        >
          Export JSONL
        </a>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {examples.map((ex) => (
          <div
            key={ex.id}
            className="border border-[#334155] bg-[#1e293b] p-2 text-xs text-foreground"
            style={{
              borderRadius: "0px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="mb-1 text-muted-foreground">{new Date(ex.createdAt).toLocaleString()}</div>
            <div>
              <strong>Input:</strong> {ex.inputText.slice(0, 200)}
            </div>
            <div>
              <strong>Output:</strong> {ex.expectedOutputText.slice(0, 200)}
            </div>
          </div>
        ))}
        {examples.length === 0 && <p className="text-sm text-muted-foreground">No examples saved yet.</p>}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Storing examples here does not fine-tune a model. Export the JSONL and feed it into your fine-tuning or
        evaluation pipeline.
      </p>
    </div>
  );
}
