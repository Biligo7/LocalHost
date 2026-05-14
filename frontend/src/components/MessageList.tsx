import { useState } from "react";
import { api } from "../api/client.js";
import type { Message } from "../types/api.js";

interface Props {
  messages: Message[];
  streaming?: { assistantMessageId: string | null; content: string; isStreaming: boolean };
  onSaveExample?: (userMessage: Message, assistantContent: string, assistantMessageId: string | null) => void;
}

const bubbleClass =
  "max-w-3xl border border-[#334155] bg-[#1e293b] p-4 text-foreground whitespace-pre-wrap";

const bubbleStyle = {
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
  borderRadius: "0px",
} as const;

export function MessageList({ messages, streaming, onSaveExample }: Props) {
  const [feedbackById, setFeedbackById] = useState<Record<string, -1 | 1>>({});

  const sendFeedback = async (messageId: string, rating: -1 | 1) => {
    setFeedbackById((m) => ({ ...m, [messageId]: rating }));
    try {
      await api.sendFeedback(messageId, rating);
    } catch {
      setFeedbackById((m) => {
        const next = { ...m };
        delete next[messageId];
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((m, idx) => {
        const previous = messages[idx - 1];
        const showSaveExample = m.role === "assistant" && previous?.role === "user";
        return (
          <div key={m.id} className={bubbleClass} style={bubbleStyle}>
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{m.role}</span>
              <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
            </div>
            <div>{m.content}</div>
            {m.role === "assistant" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`border px-2 py-0.5 text-xs transition-colors ${
                    feedbackById[m.id] === 1
                      ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                      : "border-[#334155] bg-transparent text-foreground hover:border-[#1e3a8a]"
                  }`}
                  style={{ borderRadius: "0px" }}
                  onClick={() => sendFeedback(m.id, 1)}
                  aria-label="Thumbs up"
                >
                  👍
                </button>
                <button
                  type="button"
                  className={`border px-2 py-0.5 text-xs transition-colors ${
                    feedbackById[m.id] === -1
                      ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                      : "border-[#334155] bg-transparent text-foreground hover:border-[#1e3a8a]"
                  }`}
                  style={{ borderRadius: "0px" }}
                  onClick={() => sendFeedback(m.id, -1)}
                  aria-label="Thumbs down"
                >
                  👎
                </button>
                {showSaveExample && onSaveExample && previous && (
                  <button
                    type="button"
                    className="border border-[#334155] bg-transparent px-2 py-0.5 text-xs text-foreground hover:border-[#1e3a8a]"
                    style={{ borderRadius: "0px" }}
                    onClick={() => onSaveExample(previous, m.content, m.id)}
                  >
                    Save as example
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {streaming?.isStreaming && (
        <div className={bubbleClass} style={bubbleStyle}>
          <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>assistant</span>
            <span>streaming…</span>
          </div>
          <div>{streaming.content || "…"}</div>
        </div>
      )}
    </div>
  );
}
