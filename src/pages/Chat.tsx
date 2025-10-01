import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Send, 
  Star, 
  Bot, 
  User, 
  Calendar,
  MessageSquare,
  Loader2,
  XCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (id) {
      loadConversation();
      loadMessages();
      connectWebSocket();
      return () => {
        disconnectWebSocket();
      };
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const connectWebSocket = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    socketRef.current = io(API_URL, {
      auth: {
        token: api.getToken(),
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      if (id) {
        socketRef.current?.emit('join-conversation', id);
      }
    });

    socketRef.current.on('ai-typing', (data: { conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === id) {
        setIsTyping(data.isTyping);
      }
    });

    socketRef.current.on('new-message', (data: { message: any }) => {
      setMessages(prev => [...prev, data.message]);
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      if (id) {
        socketRef.current.emit('leave-conversation', id);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const loadConversation = async () => {
    try {
      const data = await api.getConversation(id!);
      setConversation(data);
    } catch (error: any) {
      toast.error("No se pudo cargar la conversación");
      console.error(error);
      navigate("/conversations");
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMessages = async (silent = false) => {
    try {
      const data = await api.getMessages(id!);
      setMessages(data || []);
    } catch (error: any) {
      if (!silent) {
        toast.error("Error al cargar los mensajes");
        console.error(error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    const messageText = newMessage;
    setNewMessage("");

    // Create optimistic user message to show immediately
    const optimisticUserMessage = {
      id: `temp-${Date.now()}`,
      content: messageText,
      role: 'USER',
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately (optimistic update)
    setMessages(prev => [...prev, optimisticUserMessage]);

    try {
      const response = await api.sendChatMessage(id!, messageText);
      // Replace optimistic message with real one from backend
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticUserMessage.id ? response.userMessage : msg
        )
      );
      // AI message will be added via WebSocket when ready
    } catch (error: any) {
      toast.error("No se pudo enviar el mensaje");
      console.error(error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id));
      setNewMessage(messageText);
      setIsTyping(false);
    } finally {
      setLoading(false);
    }
  };


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const isOpen = status === "OPEN";
    return (
      <Badge 
        variant={isOpen ? "default" : "secondary"}
        className={cn(
          "font-medium",
          isOpen && "bg-green-500/10 text-green-700 dark:text-green-400"
        )}
      >
        {isOpen ? "Activa" : "Cerrada"}
      </Badge>
    );
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/conversations")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Conversación
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            ID: <span className="font-mono">{conversation.id.slice(0, 16)}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Chat Area */}
        <Card className="flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Historial de Mensajes
                </CardTitle>
                <CardDescription className="mt-1">
                  Interacción en tiempo real con el agente de IA
                </CardDescription>
              </div>
              <Badge variant="outline" className="hidden sm:flex">
                {messages.length} {messages.length === 1 ? "mensaje" : "mensajes"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-0">
            {/* Messages Container */}
            <div 
              className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
              style={{ minHeight: "400px", maxHeight: "calc(100vh - 400px)" }}
            >
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No hay mensajes aún</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Envía el primer mensaje para iniciar la conversación con el agente
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={cn(
                        "flex gap-3",
                        msg.role === "USER" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          msg.role === "USER"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.role === "USER" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "flex max-w-[75%] flex-col gap-1",
                          msg.role === "USER" ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5",
                            msg.role === "USER"
                              ? "bg-primary text-primary-foreground"
                              : "border bg-muted"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                        <span className="px-1 text-xs text-muted-foreground">
                          {formatTime(msg.createdAt || msg.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-1 rounded-2xl border bg-muted px-4 py-2.5">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t bg-muted/30 p-4">
              {conversation.status === "CLOSED" ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  Esta conversación está cerrada. No se pueden enviar más mensajes.
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe un mensaje de prueba..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    size="icon"
                    className="shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de la Conversación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground">Agente</span>
                {conversation.prompt ? (
                  <span className="text-sm font-medium">{conversation.prompt.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Sin agente asignado</span>
                )}
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground">Canal</span>
                <Badge variant="outline">{conversation.channel}</Badge>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground">Estado</span>
                {getStatusBadge(conversation.status)}
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground">Calificación</span>
                {conversation.rating ? (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: conversation.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-sm font-medium">{conversation.rating}/5</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Sin calificar</span>
                )}
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground">Creada</span>
                <div className="flex items-center gap-1 text-right">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    {formatFullDate(conversation.createdAt || conversation.created_at)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground">Total mensajes</span>
                <span className="text-sm font-medium">{messages.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}