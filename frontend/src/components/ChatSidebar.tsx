import { useState } from "react";
import type { Chat } from "../types/api.js";

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onNew: () => void;
  onRename: (chatId: string, title: string) => void;
  onDelete: (chatId: string) => void;
  appName: string;
  onToggleSidebar: () => void;
}

export function ChatSidebar({
  chats,
  activeChatId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  appName,
  onToggleSidebar,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  return (
    <aside
      className="flex w-64 shrink-0 flex-col border-r-2 border-[#1e3a8a] bg-[#0f1419]"
      style={{ boxShadow: "4px 0 12px rgba(30, 58, 138, 0.3)" }}
    >
      <div className="flex items-center justify-between border-b-2 border-[#1e3a8a] px-6 py-8">
        <h1 className="text-4xl tracking-wide text-white" style={{ fontWeight: 700 }}>
          {appName}
        </h1>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="bg-[#1e293b] p-2 text-white transition-colors hover:bg-[#334155]"
          style={{
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
            borderRadius: "0px",
          }}
          aria-label="Collapse sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <button
          type="button"
          onClick={onNew}
          className="w-full bg-[#1e3a8a] px-4 py-3 text-white transition-colors hover:bg-[#1e40af]"
          style={{
            boxShadow: "0 4px 8px rgba(30, 58, 138, 0.6)",
            borderRadius: "0px",
            fontWeight: 600,
          }}
        >
          + New chat
        </button>

        <ul className="min-h-0 flex-1 list-none space-y-1 overflow-y-auto p-0">
          {chats.map((chat) => (
            <li key={chat.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(chat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(chat.id);
                  }
                }}
                className={`flex cursor-pointer items-center gap-1 border border-transparent px-3 py-2 text-sm text-white transition-colors ${
                  chat.id === activeChatId
                    ? "border-[#1e3a8a] bg-[#1e293b]"
                    : "hover:border-[#334155] hover:bg-[#1a2332]"
                }`}
                style={{ borderRadius: "0px" }}
              >
                {renamingId === chat.id ? (
                  <input
                    className="min-w-0 flex-1 border-2 border-[#334155] bg-[#0f1419] px-2 py-1 text-white focus:border-[#1e3a8a] focus:outline-none"
                    style={{ borderRadius: "0px" }}
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      if (draftTitle.trim() && draftTitle !== chat.title) onRename(chat.id, draftTitle.trim());
                      setRenamingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{chat.title}</span>
                )}
                <button
                  type="button"
                  title="Rename"
                  className="shrink-0 bg-transparent px-1 text-white/60 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(chat.id);
                    setDraftTitle(chat.title);
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  title="Delete"
                  className="shrink-0 bg-transparent px-1 text-white/60 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chat.id);
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
