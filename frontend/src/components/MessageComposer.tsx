import { useState, type KeyboardEvent } from "react";

interface Props {
  disabled: boolean;
  onSend: (content: string) => void;
  placeholder?: string;
}

export function MessageComposer({ disabled, onSend, placeholder }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="flex h-24 shrink-0 items-center gap-4 border-t border-[#1e293b] bg-[#141824] px-8"
      style={{ boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.4)" }}
    >
      <textarea
        value={value}
        placeholder={placeholder ?? "Send a message. Shift+Enter for newline."}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={1}
        className="min-h-14 max-h-40 flex-1 resize-y border-2 border-[#334155] bg-[#1e293b] px-5 py-3 text-foreground placeholder:text-muted-foreground focus:border-[#1e3a8a] focus:outline-none disabled:opacity-50"
        style={{
          boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.4)",
          borderRadius: "0px",
        }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="h-14 shrink-0 bg-[#1e3a8a] px-8 text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          boxShadow: "0 4px 8px rgba(30, 58, 138, 0.6)",
          borderRadius: "0px",
          fontWeight: 600,
        }}
      >
        Send
      </button>
    </div>
  );
}
