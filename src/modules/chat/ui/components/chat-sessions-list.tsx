"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { PlusIcon, MessageSquareIcon, TrashIcon, MoreVerticalIcon, SearchIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Props {
  onNewChat: () => void;
}

export const ChatSessionsList = ({ onNewChat }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { data, isLoading } = useQuery(
    trpc.chat.getSessions.queryOptions({
      pageSize: 20,
      search: activeSearch || undefined,
    })
  );

  const deleteSession = useMutation(
    trpc.chat.deleteSession.mutationOptions({
      onSuccess: () => {
        setDeleteSessionId(null);
        queryClient.invalidateQueries(trpc.chat.getSessions.queryOptions({ pageSize: 20 }));
      },
    })
  );

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    await deleteSession.mutateAsync({ id: deleteSessionId });
  };

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat Sessions</h2>
          <Button onClick={onNewChat} size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            size="sm" 
            variant="outline"
            disabled={!searchQuery.trim()}
          >
            <SearchIcon className="w-4 h-4 mr-1" />
            Search
          </Button>
          {activeSearch && (
            <Button 
              onClick={handleClearSearch} 
              size="sm" 
              variant="ghost"
            >
              Clear
            </Button>
          )}
        </div>

        {data?.items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 px-4">
              <MessageSquareIcon className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                {activeSearch ? "No chats found" : "No chat sessions yet"}
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {activeSearch 
                  ? "Try adjusting your search terms"
                  : "Start a conversation with one of your AI agents"
                }
              </p>
              {!activeSearch && (
                <Button onClick={onNewChat}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {data?.items.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <Link href={`/chat/${session.id}`} className="flex items-center space-x-3 min-w-0 flex-1">
                      <GeneratedAvatar
                        seed={session.agent.name}
                        variant="botttsNeutral"
                        className="w-8 h-8 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">{session.title}</CardTitle>
                        <p className="text-sm text-gray-500 truncate">{session.agent.name}</p>
                      </div>
                    </Link>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.messageCount} messages
                        </p>
                      </div>
                      
                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setDeleteSessionId(session.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete Chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone and will permanently remove all messages and the chat session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={deleteSession.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 