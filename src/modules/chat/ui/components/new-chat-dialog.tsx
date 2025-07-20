"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderIcon, PlusIcon, BotIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  children: React.ReactNode;
}

export const NewChatDialog = ({ children }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] = useState("select");

  // Agent creation form state
  const [agentName, setAgentName] = useState("");
  const [agentInstructions, setAgentInstructions] = useState("");
  const [aiProvider, setAiProvider] = useState("openrouter");
  const [aiModel, setAiModel] = useState("mistralai/mistral-7b-instruct");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("1000");

  const { data: agents, isLoading } = useQuery(
    trpc.agents.getMany.queryOptions({
      pageSize: 100,
    })
  );

  const createSession = useMutation(
    trpc.chat.createSession.mutationOptions({
      onSuccess: (session) => {
        setOpen(false);
        setSelectedAgentId("");
        setTitle("");
        queryClient.invalidateQueries(trpc.chat.getSessions.queryOptions({}));
        router.push(`/chat/${session.id}`);
      },
      onError: (error) => {
        console.error("Create session error:", error);
        alert(`Failed to create chat session: ${error.message}`);
      },
    })
  );

  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: (newAgent) => {
        // Switch to select tab and select the new agent
        setActiveTab("select");
        setSelectedAgentId(newAgent.id);
        queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({}));
        // Reset form
        setAgentName("");
        setAgentInstructions("");
        setAiProvider("openrouter");
        setAiModel("mistralai/mistral-7b-instruct");
        setTemperature("0.7");
        setMaxTokens("1000");
      },
      onError: (error) => {
        console.error("Create agent error:", error);
        alert(`Failed to create agent: ${error.message}`);
      },
    })
  );

  const handleCreateAgent = async () => {
    if (!agentName.trim() || !agentInstructions.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await createAgent.mutateAsync({
        name: agentName.trim(),
        instructions: agentInstructions.trim(),
        aiProvider,
        aiModel,
        temperature: Number(temperature),
        maxTokens: Number(maxTokens),
      });
    } catch (error) {
      console.error("Failed to create agent:", error);
    }
  };

  const handleCreateSession = async () => {
    if (!selectedAgentId) {
      alert("Please select an agent");
      return;
    }

    const selectedAgent = agents?.items.find((agent) => agent.id === selectedAgentId);
    const sessionTitle = title.trim() || `Chat with ${selectedAgent?.name || "Agent"}`;

    try {
      await createSession.mutateAsync({
        agentId: selectedAgentId,
        title: sessionTitle,
      });
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[95vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Select Agent</TabsTrigger>
            <TabsTrigger value="create">Create Agent</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            <div>
              <Label htmlFor="title">Chat Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this chat..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Select an Agent</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                  </div>
                ) : agents?.items.length === 0 ? (
                  <div className="text-center py-4">
                    <BotIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">No agents available</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("create")}
                    >
                      Create Your First Agent
                    </Button>
                  </div>
                ) : (
                  agents?.items.map((agent) => (
                    <Card
                      key={agent.id}
                      className={`cursor-pointer transition-colors ${
                        selectedAgentId === agent.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedAgentId(agent.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <GeneratedAvatar
                            seed={agent.name}
                            variant="botttsNeutral"
                            className="w-8 h-8 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{agent.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {agent.instructions}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={!selectedAgentId || createSession.isPending}
              >
                {createSession.isPending ? (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PlusIcon className="w-4 h-4 mr-2" />
                )}
                Start Chat
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div>
              <Label htmlFor="agentName">Agent Name</Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter agent name..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="agentInstructions">Instructions</Label>
              <Textarea
                id="agentInstructions"
                value={agentInstructions}
                onChange={(e) => setAgentInstructions(e.target.value)}
                placeholder="Describe what this agent should do..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aiProvider">AI Provider</Label>
                <select
                  id="aiProvider"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="meta">Meta Llama</option>
                </select>
              </div>

              <div>
                <Label htmlFor="aiModel">Model</Label>
                <Input
                  id="aiModel"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="Model name..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setActiveTab("select")}>
                Back
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={!agentName.trim() || !agentInstructions.trim() || createAgent.isPending}
              >
                {createAgent.isPending ? (
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BotIcon className="w-4 h-4 mr-2" />
                )}
                Create Agent
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 