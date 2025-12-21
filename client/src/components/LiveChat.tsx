import { useState, useEffect, useRef } from "react";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "../../../server/_core/translation";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Loader2,
  User,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface LiveChatProps {
  departmentType?: "customer_support" | "technical" | "billing" | "kyc" | "investment" | "internal";
}

export default function LiveChat({ departmentType = "customer_support" }: LiveChatProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user's preferred language from context or default to current language
  const userLanguage = (language === "en" ? "en" : "ar") as LanguageCode;

  // Start or get conversation
  const startConversation = trpc.helpDesk.chat.startConversation.useMutation({
    onSuccess: (data) => {
      setConversationId(data.id);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Get messages
  const { data: messages, refetch: refetchMessages } = trpc.helpDesk.chat.getMessages.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId, refetchInterval: 3000 } // Poll every 3 seconds
  );

  // Send message mutation
  const sendMessage = trpc.helpDesk.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMessages();
      scrollToBottom();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mark as read mutation
  const markAsRead = trpc.helpDesk.chat.markAsRead.useMutation();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
      if (conversationId) {
        markAsRead.mutate({ conversationId });
      }
    }
  }, [messages]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!conversationId && user) {
      startConversation.mutate({ departmentType });
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !conversationId) return;

    sendMessage.mutate({
      conversationId,
      message: message.trim(),
      messageType: "text",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return null; // Don't show chat widget if not logged in
  }

  // Floating chat button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all"
          onClick={handleOpen}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Chat window
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-96 shadow-2xl transition-all ${isMinimized ? "h-16" : "h-[600px]"} flex flex-col`}>
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === "en" ? "Live Support" : "الدعم المباشر"}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === "en" ? "We typically reply in minutes" : "نرد عادة في دقائق"}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {startConversation.isPending ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Welcome message */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm">
                          {language === "en"
                            ? "Hi! How can we help you today?"
                            : "مرحبًا! كيف يمكننا مساعدتك اليوم؟"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {language === "en" ? "Support Team" : "فريق الدعم"}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  {messages?.map((msg: any) => {
                    const isMe = msg.sender?.id === user.id;
                    return (
                      <div key={msg.message.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={isMe ? "bg-primary text-primary-foreground" : "bg-muted"}>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${isMe ? "items-end" : ""}`}>
                      <div className={`rounded-lg p-3 max-w-[80%] ${
                        isMe ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                      }`}>
                        {/* Show translation if available and different from user's language */}
                        {!showOriginal && msg.message.translations && msg.message.detectedLanguage !== userLanguage && msg.message.translations[userLanguage] ? (
                          <>
                            <p className="text-sm whitespace-pre-wrap">{msg.message.translations[userLanguage]}</p>
                            {msg.message.detectedLanguage && (
                              <div className="mt-2 pt-2 border-t border-current/20">
                                <button
                                  onClick={() => setShowOriginal(true)}
                                  className="text-xs opacity-70 hover:opacity-100 underline"
                                >
                                  {language === "en" ? "View original" : "عرض الأصلي"} ({SUPPORTED_LANGUAGES[msg.message.detectedLanguage as LanguageCode]})
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap">{msg.message.message}</p>
                            {msg.message.detectedLanguage && msg.message.translations && msg.message.detectedLanguage !== userLanguage && (
                              <div className="mt-2 pt-2 border-t border-current/20">
                                <button
                                  onClick={() => setShowOriginal(false)}
                                  className="text-xs opacity-70 hover:opacity-100 underline"
                                >
                                  {language === "en" ? "View translation" : "عرض الترجمة"}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                          <div className={`flex items-center gap-2 mt-1 ${isMe ? "justify-end" : ""}`}>
                            <span className="text-xs text-muted-foreground">
                              {msg.sender?.name || (language === "en" ? "You" : "أنت")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={language === "en" ? "Type your message..." : "اكتب رسالتك..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!conversationId || sendMessage.isPending}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !conversationId || sendMessage.isPending}
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {language === "en"
                  ? "Press Enter to send, Shift+Enter for new line"
                  : "اضغط Enter للإرسال، Shift+Enter لسطر جديد"}
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
