import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Conversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast.error("Error al cargar conversaciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get active prompt
      const { data: activePrompt } = await supabase
        .from("prompts")
        .select("id")
        .eq("is_active", true)
        .single();

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.user.id,
          channel: "web",
          status: "open",
          prompt_id: activePrompt?.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Nueva conversación creada");
      navigate(`/chat/${data.id}`);
    } catch (error: any) {
      toast.error("Error al crear conversación");
      console.error(error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (statusFilter !== "all" && conv.status !== statusFilter) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChannelBadge = (channel: string) => {
    const colors: any = {
      web: "bg-primary/10 text-primary",
      whatsapp: "bg-success/10 text-success",
      instagram: "bg-warning/10 text-warning",
    };
    return <Badge className={colors[channel] || ""}>{channel}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conversaciones</h1>
          <p className="mt-1 text-muted-foreground">Gestiona y revisa todas las conversaciones</p>
        </div>
        <Button onClick={createConversation} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Conversación
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abierta</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filteredConversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay conversaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConversations.map((conv) => (
                    <TableRow key={conv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/chat/${conv.id}`)}>
                      <TableCell className="font-mono text-sm">{conv.id.slice(0, 8)}...</TableCell>
                      <TableCell>{formatDate(conv.created_at)}</TableCell>
                      <TableCell>{getChannelBadge(conv.channel)}</TableCell>
                      <TableCell>
                        <Badge variant={conv.status === "open" ? "default" : "secondary"}>
                          {conv.status === "open" ? "Abierta" : "Cerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {conv.rating ? (
                          <div className="flex items-center gap-1">
                            {"⭐".repeat(conv.rating)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin calificar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/chat/${conv.id}`); }}>
                          Ver Chat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}