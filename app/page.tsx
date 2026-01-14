import { Header } from "@/components/header";
import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Header />
      <ChatInterface />
    </main>
  );
}
