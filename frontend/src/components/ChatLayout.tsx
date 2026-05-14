import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import type { AppConfigResponse, Chat, Message } from "../types/api.js";
import { useChats } from "../hooks/useChats.js";
import { useStreamingChat } from "../hooks/useStreamingChat.js";
import { ChatSidebar } from "./ChatSidebar.js";
import { MessageList } from "./MessageList.js";
import { MessageComposer } from "./MessageComposer.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { TrainingDataPanel } from "./TrainingDataPanel.js";

const STARTER_PROMPTS = [
  "Explain Azure Container Apps cold starts in two paragraphs.",
  "Outline a SQL schema for a feedback feature.",
  "Review this snippet of TypeScript and suggest improvements.",
  "Summarise the differences between Azure SQL serverless and provisioned.",
];

export function ChatLayout() {
  const { chats, error: chatsError, create, rename, remove } = useChats();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<AppConfigResponse | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const { turn, send } = useStreamingChat();
  const skipNextFetchRef = useRef<Set<string>>(new Set());

  const chromeTitle = config?.appName ?? "RAFINAI";

  useEffect(() => {
    void api.getConfig().then(setConfig).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!activeChatId && chats.length > 0) setActiveChatId(chats[0].id);
  }, [chats, activeChatId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    if (skipNextFetchRef.current.has(activeChatId)) {
      skipNextFetchRef.current.delete(activeChatId);
      return;
    }
    void api.listMessages(activeChatId).then(setMessages);
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) return;
    if (turn.isStreaming) return;
    if (turn.assistantMessageId || turn.error) {
      void api.listMessages(activeChatId).then(setMessages);
    }
  }, [turn.isStreaming, turn.assistantMessageId, turn.error, activeChatId]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, turn.isStreaming, turn.content]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((v) => !v);
  }, []);

  const handleNew = useCallback(async () => {
    const chat = await create("New chat");
    setActiveChatId(chat.id);
    setMessages([]);
  }, [create]);

  const handleSend = useCallback(
    async (content: string) => {
      let chatId = activeChatId;
      let chat: Chat | null = null;
      if (!chatId) {
        chat = await create(content.slice(0, 60));
        chatId = chat.id;
        skipNextFetchRef.current.add(chatId);
        setActiveChatId(chatId);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `optimistic-${Date.now()}`,
          chatId: chatId!,
          role: "user",
          content,
          tokenCount: null,
          provider: null,
          model: null,
          latencyMs: null,
          errorCode: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ]);
      await send(chatId, content);
    },
    [activeChatId, create, send],
  );

  const handleSaveExample = useCallback(
    async (userMessage: Message, assistantContent: string, assistantMessageId: string | null) => {
      await api.createExample({
        sourceChatId: userMessage.chatId,
        sourceUserMessageId: userMessage.id,
        sourceAssistantMessageId: assistantMessageId,
        inputText: userMessage.content,
        expectedOutputText: assistantContent,
        tags: ["from-chat"],
      });
      setShowTraining(true);
    },
    [],
  );

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const showEmptyState = !activeChat && messages.length === 0;

  return (
    <div className="flex size-full min-h-0 min-w-0 flex-1">
      {isSidebarVisible && (
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          appName={chromeTitle}
          onSelect={setActiveChatId}
          onNew={handleNew}
          onRename={rename}
          onDelete={async (id) => {
            await remove(id);
            if (id === activeChatId) setActiveChatId(null);
          }}
          onToggleSidebar={toggleSidebar}
        />
      )}

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="flex h-24 shrink-0 items-center justify-between border-b border-[#1e293b] bg-[#141824] px-8"
          style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)" }}
        >
          <div className="flex items-center gap-4">
            {!isSidebarVisible && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="bg-[#1e3a8a] p-3 text-white transition-colors hover:bg-[#1e40af]"
                style={{
                  boxShadow: "0 4px 8px rgba(30, 58, 138, 0.6)",
                  borderRadius: "0px",
                }}
                aria-label="Open sidebar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            )}
            <h2 className="text-3xl text-foreground" style={{ fontWeight: 600 }}>
              {chromeTitle}
            </h2>
          </div>
          <div className="flex gap-6">
            <button
              type="button"
              className="text-foreground transition-colors hover:text-[#60a5fa]"
              onClick={() => setShowTraining((v) => !v)}
            >
              Training data
            </button>
            <button
              type="button"
              className="text-foreground transition-colors hover:text-[#60a5fa]"
              onClick={() => setShowSettings((v) => !v)}
            >
              Settings
            </button>
          </div>
        </div>

        {chatsError && (
          <div
            className="mx-8 mt-4 border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-200"
            style={{ borderRadius: "0px" }}
          >
            {chatsError}
          </div>
        )}
        {turn.error && (
          <div
            className="mx-8 mt-4 border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm text-red-200"
            style={{ borderRadius: "0px" }}
          >
            Provider error: {turn.error}
          </div>
        )}

        <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto p-6">
          {showEmptyState ? (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center space-y-8">
              <h3 className="text-4xl text-foreground" style={{ fontWeight: 600 }}>
                Start a new conversation
              </h3>
              <p className="text-muted-foreground">Using the {config?.aiProvider ?? "mock"} provider.</p>
              <div className="mt-8 grid w-full max-w-4xl grid-cols-2 gap-4">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => void handleSend(p)}
                    className="cursor-pointer border border-[#334155] bg-[#1e293b] p-6 text-left text-foreground transition-colors hover:border-[#1e3a8a]"
                    style={{
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
                      borderRadius: "0px",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MessageList messages={messages} streaming={turn} onSaveExample={handleSaveExample} />
          )}
        </div>

        <MessageComposer disabled={turn.isStreaming} onSend={handleSend} />
      </main>

      {showSettings && <SettingsPanel config={config} onClose={() => setShowSettings(false)} />}
      {showTraining && <TrainingDataPanel onClose={() => setShowTraining(false)} />}
    </div>
  );
}
