"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquareIcon, 
  BotIcon, 
  SparklesIcon, 
  UsersIcon, 
  ZapIcon, 
  ShieldIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  DownloadIcon,
  FileTextIcon
} from "lucide-react";
import Link from "next/link";
import { GeneratedAvatar } from "@/components/generated-avatar";

export const HomeView = () => {
  const features = [
    {
      icon: <BotIcon className="w-6 h-6" />,
      title: "AI Agents",
      description: "Create personalized AI agents with custom instructions, personalities, and expertise areas.",
      color: "bg-blue-500"
    },
    {
      icon: <MessageSquareIcon className="w-6 h-6" />,
      title: "Smart Chat",
      description: "Engage in natural conversations with your AI agents using advanced language models.",
      color: "bg-green-500"
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: "AI Summaries",
      description: "Automatically generate concise summaries of your conversations for quick reference.",
      color: "bg-purple-500"
    },
    {
      icon: <DownloadIcon className="w-6 h-6" />,
      title: "Export Transcripts",
      description: "Download complete chat transcripts for documentation and analysis.",
      color: "bg-orange-500"
    },
    {
      icon: <UsersIcon className="w-6 h-6" />,
      title: "Multi-Provider",
      description: "Support for multiple AI providers including OpenRouter, Gemini, Claude, and Llama.",
      color: "bg-pink-500"
    },
    {
      icon: <ZapIcon className="w-6 h-6" />,
      title: "Real-time",
      description: "Instant responses with real-time typing indicators and seamless conversation flow.",
      color: "bg-yellow-500"
    }
  ];

  const aiProviders = [
    { name: "OpenRouter", model: "Mistral 7B", color: "bg-blue-100 text-blue-800" },
    { name: "Google Gemini", model: "Gemini Pro", color: "bg-purple-100 text-purple-800" },
    { name: "Anthropic", model: "Claude 3", color: "bg-green-100 text-green-800" },
    { name: "Meta", model: "Llama 2", color: "bg-orange-100 text-orange-800" }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Create Your AI Agent",
      description: "Define your agent's personality, expertise, and instructions. Choose from multiple AI providers and models.",
      icon: <BotIcon className="w-8 h-8" />,
      color: "bg-blue-500"
    },
    {
      step: "02",
      title: "Start a Conversation",
      description: "Begin chatting with your AI agent. Ask questions, brainstorm ideas, or get expert advice on any topic.",
      icon: <MessageSquareIcon className="w-8 h-8" />,
      color: "bg-green-500"
    },
    {
      step: "03",
      title: "Get Intelligent Responses",
      description: "Receive context-aware responses powered by advanced language models. Your agent remembers conversation history.",
      icon: <SparklesIcon className="w-8 h-8" />,
      color: "bg-purple-500"
    },
    {
      step: "04",
      title: "Export & Summarize",
      description: "Generate AI-powered summaries of your conversations and download complete transcripts for reference.",
      icon: <FileTextIcon className="w-8 h-8" />,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI-Powered Conversations
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Chat with Your
              <span className="text-green-700 block">Personal AI Agents</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create personalized AI agents, engage in meaningful conversations, and get intelligent summaries. 
              Experience the future of AI-powered communication.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Chatting
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/agents">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <BotIcon className="w-5 h-5 mr-2" />
                  Create Agents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create meaningful AI conversations and boost your productivity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Providers Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Multiple AI Providers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from the best AI models and providers to power your conversations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiProviders.map((provider, index) => (
              <Card key={index} className="text-center border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <GeneratedAvatar
                      seed={provider.name}
                      variant="botttsNeutral"
                      className="w-16 h-16 mx-auto"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{provider.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{provider.model}</p>
                  <Badge variant="secondary" className={provider.color}>
                    Available
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Learn how to create and use AI agents to enhance your workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardContent className="pt-6">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-white mx-auto mb-4 ${step.color}`}>
                    {step.icon}
                  </div>
                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">{step.step}</Badge>
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Create your first AI agent and experience the power of intelligent conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Chat
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/agents">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-black hover:bg-white hover:text-blue-600">
                <BotIcon className="w-5 h-5 mr-2" />
                Create Agent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">MeetAI</h3>
              <p className="text-gray-400">
                Empowering conversations with intelligent AI agents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>AI Agents</li>
                <li>Smart Chat</li>
                <li>AI Summaries</li>
                <li>Export Transcripts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Chat</li>
                <li>Agents</li>
                <li>Meetings</li>
                <li>Dashboard</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MeetAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
