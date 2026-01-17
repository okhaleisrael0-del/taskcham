import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Truck, Shield, MessageCircle, X, Zap, Paperclip, Image as ImageIcon, FileText, CheckCheck } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const QUICK_REPLIES = [
  "Jag är på väg!",
  "Jag har kommit fram",
  "Väntar utanför",
  "Var ska jag lämna paketet?",
  "Kan du komma ner?",
  "Tack för idag!",
  "Upphämtning klar",
  "Allt gick bra!",
  "Kommer inom 10 min",
  "Försenad ca 5 min"
];

export default function ChatBox({ 
  booking, 
  currentUser, 
  userType, // 'driver', 'admin', 'customer'
  isMinimized = false,
  onToggleMinimize
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const scrollRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      return await base44.entities.ChatMessage.filter(
        { booking_id: booking.id },
        '-created_date',
        100
      );
    },
    enabled: !!booking?.id
  });

  // Real-time subscription for messages
  useEffect(() => {
    if (!booking?.id) return;

    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data.booking_id === booking.id) {
        queryClient.invalidateQueries(['chat-messages', booking.id]);
        
        // Auto-scroll on new message
        if (scrollRef.current && !isMinimized) {
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    });

    return () => unsubscribe();
  }, [booking?.id, queryClient, isMinimized]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await base44.entities.ChatMessage.create(messageData);

      // Send push notification to recipient
      if (userType === 'driver' && booking.customer_email) {
        await base44.integrations.Core.SendEmail({
          to: booking.customer_email,
          subject: `Nytt meddelande från runner - #${booking.booking_number}`,
          body: `
Hej ${booking.customer_name}!

Du har fått ett nytt meddelande om din bokning #${booking.booking_number}.

Från: ${messageData.sender_name}
Meddelande: "${messageData.message}"

Logga in för att svara.

Vänliga hälsningar,
TaskCham
          `
        });
      } else if (userType === 'customer' && booking.assigned_driver_id) {
        const drivers = await base44.entities.Driver.filter({ id: booking.assigned_driver_id });
        if (drivers.length > 0) {
          await base44.integrations.Core.SendEmail({
            to: drivers[0].email,
            subject: `Nytt meddelande från kund - #${booking.booking_number}`,
            body: `
Hej ${drivers[0].name}!

Du har fått ett nytt meddelande om bokning #${booking.booking_number}.

Från: ${booking.customer_name}
Meddelande: "${messageData.message}"

Logga in för att svara.

Vänliga hälsningar,
TaskCham
            `
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages', booking?.id]);
      setMessage('');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId) => {
      const msg = messages.find(m => m.id === messageId);
      if (msg && !msg.read_by?.includes(currentUser.id || currentUser.email)) {
        await base44.entities.ChatMessage.update(messageId, {
          is_read: true,
          read_by: [...(msg.read_by || []), currentUser.id || currentUser.email]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages', booking?.id]);
    }
  });

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  useEffect(() => {
    // Mark messages as read when chat is visible
    if (!isMinimized && messages.length > 0) {
      messages.forEach(msg => {
        if (msg.sender_id !== (currentUser.id || currentUser.email) && 
            !msg.read_by?.includes(currentUser.id || currentUser.email)) {
          markAsReadMutation.mutate(msg.id);
        }
      });
    }
  }, [messages, isMinimized, currentUser]);

  useEffect(() => {
    // Calculate unread count
    const unread = messages.filter(
      msg => msg.sender_id !== (currentUser.id || currentUser.email) && 
             !msg.read_by?.includes(currentUser.id || currentUser.email)
    ).length;
    setUnreadCount(unread);
  }, [messages, currentUser]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => r.file_url);
      const fileTypes = files.map(file => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.includes('pdf')) return 'pdf';
        return 'document';
      });

      // Send message with files
      const senderName = userType === 'admin' 
        ? 'Admin' 
        : currentUser.name || currentUser.full_name || 'User';

      await sendMessageMutation.mutateAsync({
        booking_id: booking.id,
        booking_number: booking.booking_number,
        sender_type: userType,
        sender_name: senderName,
        sender_id: currentUser.id || currentUser.email,
        message: message.trim() || `Skickade ${files.length} fil(er)`,
        file_urls: fileUrls,
        file_types: fileTypes,
        is_read: false,
        read_by: [currentUser.id || currentUser.email]
      });

      setMessage('');
      toast.success('Filer uppladdade');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Kunde inte ladda upp filer');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !booking) return;

    const senderName = userType === 'admin' 
      ? 'Admin' 
      : currentUser.name || currentUser.full_name || 'User';

    sendMessageMutation.mutate({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: userType,
      sender_name: senderName,
      sender_id: currentUser.id || currentUser.email,
      message: message.trim(),
      is_read: false,
      read_by: [currentUser.id || currentUser.email]
    });
  };

  const getSenderIcon = (senderType) => {
    switch (senderType) {
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'driver':
        return <Truck className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderColor = (senderType) => {
    switch (senderType) {
      case 'customer':
        return 'bg-purple-100 text-purple-700';
      case 'driver':
        return 'bg-blue-100 text-blue-700';
      case 'admin':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isOwnMessage = (msg) => {
    return msg.sender_id === (currentUser.id || currentUser.email);
  };

  // Render minimized view
  const minimizedView = (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={onToggleMinimize}
        className="relative bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full h-14 w-14 shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-6 w-6 flex items-center justify-center rounded-full p-0">
            {unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );

  // Render expanded view
  const expandedView = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
    >
      <Card className="shadow-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-[#4A90A4] to-[#7FB069] text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle className="text-base">
                Booking #{booking?.booking_number}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMinimize}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-white/80 mt-1">
            {userType === 'admin' ? 'Admin Support Chatt' : 
             userType === 'driver' ? 'Chatt med Kund' : 
             'Chatt med Förare'}
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-96 p-4">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Laddar meddelanden...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Inga meddelanden än</p>
                <p className="text-xs text-gray-400 mt-1">Starta konversationen</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2",
                        isOwnMessage(msg) ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwnMessage(msg) && (
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          getSenderColor(msg.sender_type)
                        )}>
                          {getSenderIcon(msg.sender_type)}
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[75%]",
                        isOwnMessage(msg) ? "items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {msg.sender_name}
                          </span>
                          <Badge variant="outline" className="text-xs py-0 px-1.5">
                            {msg.sender_type === 'customer' ? 'kund' : msg.sender_type === 'driver' ? 'förare' : 'admin'}
                          </Badge>
                        </div>
                        
                        <div className={cn(
                          "rounded-2xl px-4 py-2 break-words",
                          isOwnMessage(msg)
                            ? "bg-[#4A90A4] text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-900 rounded-bl-sm"
                        )}>
                          {msg.message && <p className="text-sm">{msg.message}</p>}
                          
                          {/* Display uploaded files */}
                          {msg.file_urls && msg.file_urls.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {msg.file_urls.map((url, idx) => {
                                const fileType = msg.file_types?.[idx] || 'document';
                                
                                if (fileType === 'image') {
                                  return (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <img
                                        src={url}
                                        alt="Uploaded"
                                        className="max-w-full rounded-lg max-h-64 object-cover"
                                      />
                                    </a>
                                  );
                                }
                                
                                return (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded border",
                                      isOwnMessage(msg)
                                        ? "bg-white/20 border-white/30 text-white"
                                        : "bg-white border-gray-200 text-gray-900"
                                    )}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="text-xs">
                                      {fileType === 'pdf' ? 'PDF-fil' : 'Dokument'}
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(msg.created_date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isOwnMessage(msg) && msg.read_by && msg.read_by.length > 1 && (
                            <CheckCheck className="h-3 w-3 text-blue-500" title="Läst" />
                          )}
                        </div>
                      </div>

                      {isOwnMessage(msg) && (
                        <div className="w-8 h-8 rounded-full bg-[#4A90A4]/20 flex items-center justify-center flex-shrink-0">
                          {getSenderIcon(msg.sender_type)}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          {/* Quick Replies */}
          {showQuickReplies && (
            <div className="px-4 py-2 border-t bg-gray-50 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {QUICK_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMessage(reply);
                    setShowQuickReplies(false);
                  }}
                  className="text-xs text-left p-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles}
                title="Bifoga filer"
              >
                {uploadingFiles ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
              <div className="relative flex-1">
                <Input
                  placeholder="Skriv ett meddelande..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Zap className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-[#4A90A4] hover:bg-[#3d7a8c]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return isMinimized ? minimizedView : expandedView;
}