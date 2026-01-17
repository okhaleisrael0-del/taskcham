import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function SupportChatbot({ driverProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const quickQuestions = [
    { q: "Hur får jag betalt?", icon: "💰" },
    { q: "När kommer mina pengar?", icon: "⏰" },
    { q: "Hur uppdaterar jag status?", icon: "📱" },
    { q: "Vad gör jag om kunden inte är hemma?", icon: "🚪" },
    { q: "Hur fungerar betyg?", icon: "⭐" },
    { q: "Kan jag avboka ett uppdrag?", icon: "❌" }
  ];

  // Initialize conversation
  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [conversation?.id]);

  const initConversation = async () => {
    try {
      const newConversation = await base44.agents.createConversation({
        agent_name: 'driver_support',
        metadata: {
          name: `Support för ${driverProfile?.name}`,
          driver_id: driverProfile?.id,
          driver_email: driverProfile?.email
        }
      });
      setConversation(newConversation);
      setMessages(newConversation.messages || []);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation) return;

    setInputMessage('');
    setIsLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: text
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-[#4A90A4] to-[#7FB069] text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all hover:scale-110"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-2 border-white">
          AI
        </Badge>
      </motion.button>
    );
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="w-80 shadow-2xl border-2 border-[#4A90A4]">
          <CardHeader className="p-4 bg-gradient-to-r from-[#4A90A4] to-[#7FB069] text-white cursor-pointer" onClick={() => setIsMinimized(false)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">AI Support</span>
                <Badge className="bg-white/20 text-white">Live</Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(false);
                  }}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Card className="w-96 h-[600px] shadow-2xl border-2 border-[#4A90A4] flex flex-col">
        <CardHeader className="p-4 bg-gradient-to-r from-[#4A90A4] to-[#7FB069] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="font-semibold">AI Support</p>
                <p className="text-xs opacity-90">Här för att hjälpa dig 24/7</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-16 w-16 mx-auto mb-4 text-[#4A90A4]" />
                <h3 className="font-semibold text-gray-900 mb-2">Välkommen till AI Support!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Jag kan hjälpa dig med frågor om uppdrag, betalningar och regler.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.slice(0, 4).map((item, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3"
                      onClick={() => handleQuickQuestion(item.q)}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#4A90A4] to-[#7FB069] flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-[#4A90A4] text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <ReactMarkdown 
                        className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"
                        components={{
                          p: ({ children }) => <p className="text-gray-900 leading-relaxed my-1">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc ml-4 my-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 my-1">{children}</ol>,
                          li: ({ children }) => <li className="my-0.5 text-gray-900">{children}</li>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}

                    {msg.tool_calls && msg.tool_calls.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.tool_calls.map((call, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            🔍 {call.name?.split('.').pop()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#4A90A4] to-[#7FB069] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {messages.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <div className="flex gap-2 flex-wrap mb-2">
              {quickQuestions.slice(0, 3).map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-2"
                  onClick={() => handleQuickQuestion(item.q)}
                  disabled={isLoading}
                >
                  {item.icon} {item.q}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputMessage);
                }
              }}
              placeholder="Skriv din fråga här..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            För brådskande frågor, kontakta admin direkt
          </p>
        </div>
      </Card>
    </motion.div>
  );
}