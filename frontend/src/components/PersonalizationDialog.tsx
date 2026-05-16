import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
}

const SUGGESTION_CHIPS = [
  "I love mountains and hiking",
  "I prefer beaches and swimming",
  "I enjoy local cuisine and tavernas",
  "I travel with my pet",
  "I don't like crowded tourist spots",
  "I like historical sites and museums",
  "I prefer warm sunny weather",
  "I enjoy water sports",
  "I like camping and nature",
  "I travel with kids",
];

const BOT_RESPONSES = [
  "Great choice! What else do you enjoy when traveling?",
  "Nice! Any other preferences I should know about?",
  "Got it! Tell me more about your ideal trip.",
  "Wonderful! Anything else that makes a trip special for you?",
  "Perfect! Keep going if there's more to share.",
];

interface PersonalizationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PersonalizationDialog({ open, onClose }: PersonalizationDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Welcome to Local Host! I'd love to get to know you better so I can personalize your travel recommendations. Tell me about your travel preferences — what do you love, what do you avoid?",
    },
  ]);
  const [input, setInput] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addPreference = (text: string) => {
    const newId = messages.length;
    const botResponse = BOT_RESPONSES[preferences.length % BOT_RESPONSES.length];

    setMessages((prev) => [
      ...prev,
      { id: newId, role: "user", text },
      { id: newId + 1, role: "assistant", text: botResponse },
    ]);
    setPreferences((prev) => [...prev, text]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    addPreference(trimmed);
  };

  const handleChipClick = (chip: string) => {
    if (preferences.includes(chip)) return;
    addPreference(chip);
  };

  const handleSave = async () => {
    if (preferences.length === 0) return;
    setSaving(true);
    try {
      await api.savePreferences(preferences);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const availableChips = SUGGESTION_CHIPS.filter((c) => !preferences.includes(c));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleSkip(); }}>
      <DialogContent className="flex h-[min(85vh,640px)] max-w-lg flex-col gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-lg">Personalize your experience</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Share your travel preferences so I can tailor recommendations just for you.
          </DialogDescription>
        </DialogHeader>

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Suggestion chips */}
          {availableChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {availableChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:bg-primary/5"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your own preference..."
              className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none ring-primary/40 transition placeholder:text-muted-foreground focus:border-primary focus:ring-2"
            />
            <Button type="submit" size="sm" disabled={!input.trim()}>
              Add
            </Button>
          </form>

          {/* Action buttons */}
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              Skip for now
            </button>
            {preferences.length > 0 && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? "Saving..." : `Save & Continue (${preferences.length})`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
