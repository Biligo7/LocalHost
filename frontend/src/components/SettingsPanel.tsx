import type { AppConfigResponse } from "../types/api.js";

interface Props {
  config: AppConfigResponse | null;
  onClose: () => void;
}

export function SettingsPanel({ config, onClose }: Props) {
  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full w-[360px] max-w-[100vw] flex-col overflow-y-auto border-l-2 border-[#1e3a8a] bg-[#141824] p-6 text-foreground shadow-[-4px_0_12px_rgba(0,0,0,0.4)]"
      style={{ borderRadius: "0px" }}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[15px] font-semibold">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="border border-[#334155] bg-transparent px-3 py-1 text-sm text-foreground transition-colors hover:border-[#1e3a8a]"
          style={{ borderRadius: "0px" }}
        >
          Close
        </button>
      </header>

      {!config ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">App name</label>
            <code className="break-all rounded-none border border-[#334155] bg-[#1e293b] px-2 py-1 text-sm">
              {config.appName}
            </code>
          </div>
          <div className="mb-4 flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Environment</label>
            <code className="break-all rounded-none border border-[#334155] bg-[#1e293b] px-2 py-1 text-sm">
              {config.environment}
            </code>
          </div>
          <div className="mb-4 flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">AI provider</label>
            <code className="break-all rounded-none border border-[#334155] bg-[#1e293b] px-2 py-1 text-sm">
              {config.aiProvider}
            </code>
          </div>
          <div className="mb-4 flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Model</label>
            <code className="break-all rounded-none border border-[#334155] bg-[#1e293b] px-2 py-1 text-sm">
              {config.model}
            </code>
          </div>
          <div className="mb-4 flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Streaming</label>
            <code className="break-all rounded-none border border-[#334155] bg-[#1e293b] px-2 py-1 text-sm">
              {config.streamingEnabled ? "enabled" : "disabled"}
            </code>
          </div>
          <div className="mb-4 flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Authentication</label>
            <code className="break-all rounded-none border border-[#334155] bg-[#1e293b] px-2 py-1 text-sm">
              {config.authEnabled ? "enabled" : "placeholder"}
            </code>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            This panel only ever shows safe values. API keys, SQL connection strings, and other secrets are never sent
            to the browser. Change provider settings via Terraform variables and redeploy.
          </p>
        </>
      )}
    </div>
  );
}
