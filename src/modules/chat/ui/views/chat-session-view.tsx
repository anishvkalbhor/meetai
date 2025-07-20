"use client";

import { ChatInterface } from "../components/chat-interface";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

interface Props {
  sessionId: string;
}

export const ChatSessionView = ({ sessionId }: Props) => {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Chats</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface sessionId={sessionId} />
      </div>
    </div>
  );
}; 