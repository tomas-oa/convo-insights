import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Filter, 
  Calendar,
  Star,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConversationFilters {
  status: string;
  minRating: string;
  dateFrom: string;
  dateTo: string;
}

export default function Conversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState<ConversationFilters>({
    status: "all",
    minRating: "all",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data || []);
    } catch (error: any) {
      toast.error("Error al cargar las conversaciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    try {
      const data = await api.createConversation({ channel: "WEB" });
      toast.success("Conversación iniciada correctamente");
      navigate(`/chat/${data.id}`);
    } catch (error: any) {
      toast.error("No se pudo crear la conversación");
      console.error(error);
    }
  };

  // Memoized filtering to avoid recalculation on every render
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      if (filters.status !== "all" && conv.status !== filters.status.toUpperCase()) {
        return false;
      }

      if (filters.minRating !== "all") {
        const minRating = parseInt(filters.minRating);
        if (!conv.rating || conv.rating < minRating) {
          return false;
        }
      }

      const convDate = new Date(conv.startDate || conv.createdAt);
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (convDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (convDate > toDate) return false;
      }

      return true;
    });
  }, [conversations, filters]);

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const paginatedConversations = filteredConversations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    try {
      // Use Intl.DurationFormat for localized duration formatting (Stage 3 proposal)
      // @ts-ignore - Not yet in TypeScript types
      const formatter = new Intl.DurationFormat("es-CL", {
        style: "narrow",
        hoursDisplay: hours > 0 ? "always" : "auto",
        minutesDisplay: "always",
        secondsDisplay: "always",
      });
      
      return formatter.format({ hours, minutes: mins, seconds: secs });
    } catch {
      // Fallback for browsers without DurationFormat support
      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0) parts.push(`${mins}m`);
      if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
      return parts.join(" ");
    }
  };

  const getRatingDisplay = (rating?: number) => {
    if (!rating) {
      return (
        <span className="text-xs text-muted-foreground">Sin calificar</span>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const isOpen = status === "OPEN";
    return (
      <Badge 
        variant={isOpen ? "default" : "secondary"}
        className={cn(
          "font-medium",
          isOpen && "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
        )}
      >
        {isOpen ? "Activa" : "Cerrada"}
      </Badge>
    );
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      minRating: "all",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = 
    filters.status !== "all" || 
    filters.minRating !== "all" || 
    filters.dateFrom || 
    filters.dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Conversaciones</h1>
          <p className="text-muted-foreground">
            Monitorea el rendimiento y calidad de las interacciones con tu agente de IA
          </p>
        </div>
        <Button onClick={createConversation} className="gap-2 sm:w-auto">
          <Plus className="h-4 w-4" />
          Iniciar Conversación
        </Button>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Historial de Conversaciones</CardTitle>
              <CardDescription>
                Analiza el detalle de cada interacción para identificar oportunidades de mejora
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Ocultar Filtros" : "Filtros Avanzados"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid gap-4 rounded-lg border bg-muted/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-xs font-medium">
                  Estado
                </Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="open">Activas</SelectItem>
                    <SelectItem value="closed">Cerradas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating-filter" className="text-xs font-medium">
                  Rating Mínimo
                </Label>
                <Select 
                  value={filters.minRating} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value }))}
                >
                  <SelectTrigger id="rating-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier rating</SelectItem>
                    <SelectItem value="4">⭐ 4+ estrellas</SelectItem>
                    <SelectItem value="3">⭐ 3+ estrellas</SelectItem>
                    <SelectItem value="2">⭐ 2+ estrellas</SelectItem>
                    <SelectItem value="1">⭐ 1+ estrella</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-xs font-medium">
                  Desde
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-xs font-medium">
                  Hasta
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-end sm:col-span-2 lg:col-span-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead className="hidden sm:table-cell">Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedConversations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                          <div className="text-sm font-medium">
                            {filteredConversations.length === 0 && conversations.length > 0
                              ? "No se encontraron conversaciones con estos filtros"
                              : "Aún no hay conversaciones registradas"}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {filteredConversations.length === 0 && conversations.length > 0
                              ? "Intenta ajustar los criterios de búsqueda"
                              : "Inicia una nueva conversación para comenzar"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedConversations.map((conv) => (
                      <TableRow 
                        key={conv.id} 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => navigate(`/chat/${conv.id}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          {conv.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(conv.startDate || conv.createdAt)}
                        </TableCell>
                        <TableCell className="hidden text-sm sm:table-cell">
                          {formatDuration(conv.duration)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(conv.status)}
                        </TableCell>
                        <TableCell>
                          {getRatingDisplay(conv.rating)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredConversations.length)} de{" "}
                {filteredConversations.length} conversaciones
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Simplified pagination calculation
                    const pageNum = totalPages <= 5 ? i + 1 :
                      currentPage <= 3 ? i + 1 :
                      currentPage >= totalPages - 2 ? totalPages - 4 + i :
                      currentPage - 2 + i;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}