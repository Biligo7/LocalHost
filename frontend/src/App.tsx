import { ChatLayout } from "./components/ChatLayout.js";

export default function App() {
  return (
    <div className="dark flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <ChatLayout />
    </div>
  );
}
