"use client";

import { ChatSessionsList } from "../components/chat-sessions-list";
import { NewChatDialog } from "../components/new-chat-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, BotIcon } from "lucide-react";
import Link from "next/link";

export const ChatView = () => {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Chat with AI Agents</h1>
          <p className="text-gray-600">
            Start conversations with your personalized AI agents
          </p>
        </div>

        <div className="flex items-center space-x-2 mb-6">
          <NewChatDialog>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </NewChatDialog>
          
          <Link href="/agents">
            <Button variant="outline">
              <BotIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Manage Agents</span>
            </Button>
          </Link>
        </div>

        <ChatSessionsList
          onNewChat={() => {
            // This will be handled by the NewChatDialog
          }}
        />
      </div>
    </div>
  );
}; 