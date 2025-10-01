import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadConversation();
      loadMessages();
      subscribeToMessages();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadConversation = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error: any) {
      toast.error("Error al cargar conversación");
      console.error(error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Error al cargar mensajes");
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    const messageText = newMessage;
    setNewMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          conversationId: id,
          message: messageText,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Error al enviar mensaje");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateRating = async (rating: number) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ rating })
        .eq("id", id);

      if (error) throw error;
      setConversation({ ...conversation, rating });
      toast.success("Calificación actualizada");
    } catch (error: any) {
      toast.error("Error al actualizar calificación");
      console.error(error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!conversation) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/conversations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Chat</h1>
          <p className="mt-1 text-muted-foreground">ID: {conversation.id.slice(0, 8)}...</p>
        </div>
        <Badge>{conversation.channel}</Badge>
        <Badge variant={conversation.status === "open" ? "default" : "secondary"}>
          {conversation.status === "open" ? "Abierta" : "Cerrada"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="flex flex-col" style={{ height: "600px" }}>
          <CardHeader>
            <CardTitle>Conversación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-6">
            <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border bg-muted/20 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No hay mensajes aún. ¡Envía el primero!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground border"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="mt-1 text-xs opacity-70">{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading || conversation.status === "closed"}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !newMessage.trim() || conversation.status === "closed"}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={conversation.rating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateRating(rating)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                ))}
              </div>
              {conversation.rating && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Calificación actual: {conversation.rating}/5
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Canal:</span> {conversation.channel}
              </div>
              <div>
                <span className="font-medium">Estado:</span> {conversation.status}
              </div>
              <div>
                <span className="font-medium">Creada:</span>{" "}
                {new Date(conversation.created_at).toLocaleString("es-ES")}
              </div>
              <div>
                <span className="font-medium">Mensajes:</span> {messages.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}