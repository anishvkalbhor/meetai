import { ChatSessionView } from "@/modules/chat/ui/views/chat-session-view";

interface Props {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function ChatSessionPage({ params }: Props) {
  const { sessionId } = await params;
  return <ChatSessionView sessionId={sessionId} />;
} 