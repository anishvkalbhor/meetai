"use client";

import { useState, useRef, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { SendIcon, DownloadIcon, LoaderIcon, SparklesIcon, XIcon, EditIcon, TrashIcon, MoreVerticalIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useRouter } from "next/navigation";

interface Props {
  sessionId: string;
}

export const ChatInterface = ({ sessionId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery(
    trpc.chat.getSession.queryOptions({ id: sessionId })
  );

  const sendMessage = useMutation(
    trpc.chat.sendMessage.mutationOptions({
      onSuccess: () => {
        setMessage("");
        queryClient.invalidateQueries(trpc.chat.getSession.queryOptions({ id: sessionId }));
      },
    })
  );

  const generateSummary = useMutation(
    trpc.chat.generateSummary.mutationOptions({
      onSuccess: (data) => {
        setSummaryContent(data.summary);
        setShowSummary(true);
      },
    })
  );

  const updateSession = useMutation(
    trpc.chat.updateSession.mutationOptions({
      onSuccess: () => {
        setShowEditDialog(false);
        queryClient.invalidateQueries(trpc.chat.getSession.queryOptions({ id: sessionId }));
        queryClient.invalidateQueries(trpc.chat.getSessions.queryOptions({ pageSize: 20 }));
      },
    })
  );

  const deleteSession = useMutation(
    trpc.chat.deleteSession.mutationOptions({
      onSuccess: () => {
        router.push("/chat");
      },
    })
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.messages]);

  useEffect(() => {
    if (data?.session && showEditDialog) {
      setEditTitle(data.session.title);
    }
  }, [data?.session, showEditDialog]);

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;

    setIsTyping(true);
    try {
      await sendMessage.mutateAsync({
        sessionId,
        content: message.trim(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const downloadTranscript = () => {
    if (!data?.messages) return;

    const transcript = data.messages
      .map((msg) => `${msg.role === "user" ? "You" : data.session.agent.name}: ${msg.content}`)
      .join("\n\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-transcript-${sessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditSession = async () => {
    if (!editTitle.trim()) return;
    
    await updateSession.mutateAsync({
      id: sessionId,
      title: editTitle.trim(),
    });
  };

  const handleDeleteSession = async () => {
    await deleteSession.mutateAsync({ id: sessionId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderIcon className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Chat session not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <CardHeader className="border-b px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <GeneratedAvatar
                seed={data.session.agent.name}
                variant="botttsNeutral"
                className="w-8 h-8 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg truncate">{data.session.title}</CardTitle>
                <p className="text-sm text-gray-500 truncate">{data.session.agent.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  generateSummary.mutate({ sessionId });
                }}
                disabled={generateSummary.isPending}
                className="hidden sm:flex"
              >
                {generateSummary.isPending ? (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <SparklesIcon className="w-4 h-4 mr-2" />
                )}
                Summarize
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  generateSummary.mutate({ sessionId });
                }}
                disabled={generateSummary.isPending}
                className="sm:hidden"
              >
                {generateSummary.isPending ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SparklesIcon className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTranscript} className="hidden sm:flex">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTranscript} className="sm:hidden">
                <DownloadIcon className="w-4 h-4" />
              </Button>
              
              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreVerticalIcon className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <EditIcon className="w-4 h-4 mr-2" />
                    Edit Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {data.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <GeneratedAvatar
                seed={data.session.agent.name}
                variant="botttsNeutral"
                className="w-16 h-16 mb-4"
              />
              <h3 className="text-lg font-medium mb-2">Start chatting with {data.session.agent.name}</h3>
              <p className="text-gray-500 max-w-md">
                {data.session.agent.instructions}
              </p>
            </div>
          ) : (
            data.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-[85%] sm:max-w-[70%] ${
                    msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <GeneratedAvatar
                      seed={data.session.agent.name}
                      variant="botttsNeutral"
                      className="w-8 h-8 flex-shrink-0"
                    />
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm sm:text-base ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <GeneratedAvatar
                  seed={data.session.agent.name}
                  variant="botttsNeutral"
                  className="w-8 h-8"
                />
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1 text-sm sm:text-base"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping}
              size="icon"
              className="flex-shrink-0"
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Chat Summary</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(false)}
                className="h-8 w-8 p-0"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {summaryContent}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium mb-2">
                Chat Title
              </label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter chat title..."
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditSession}
                disabled={!editTitle.trim() || updateSession.isPending}
              >
                {updateSession.isPending ? (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <EditIcon className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              {deleteSession.isPending ? (
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrashIcon className="w-4 h-4 mr-2" />
              )}
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 