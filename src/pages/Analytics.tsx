import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRatings, usePromptAnalytics, useDashboardAnalytics } from "@/lib/api";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { 
  Star, 
  TrendingDown, 
  BarChart3, 
  PieChartIcon,
  AlertTriangle 
} from "lucide-react";
import type { RatingDistribution, PromptAnalytics } from "@backend/types";

const COLORS = [
  "hsl(var(--chart-1))", 
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))", 
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

const CHANNEL_COLORS: Record<string, string> = {
  WEB: "hsl(var(--chart-1))",
  WHATSAPP: "hsl(var(--chart-2))",
  INSTAGRAM: "hsl(var(--chart-3))",
  TELEGRAM: "hsl(var(--chart-4))",
};

export default function Analytics() {
  const { data: ratingsData = [], isLoading: ratingsLoading } = useRatings();
  const { data: promptsData = [], isLoading: promptsLoading } = usePromptAnalytics();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardAnalytics();

  const isLoading = ratingsLoading || promptsLoading || dashboardLoading;

  // Build lookup map for O(1) access instead of O(n) find in loop
  const ratingsMap = new Map(ratingsData.map(item => [item.rating, item.count]));
  const total = ratingsData.reduce((sum, item) => sum + item.count, 0) || 1;
  
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
    const count = ratingsMap.get(rating) || 0;
    return {
      rating: `${rating} ⭐`,
      ratingValue: rating,
      count,
      percentage: Math.round((count / total) * 100),
    };
  });

  // Transform channel data from dashboard analytics
  const totalChannelConversations = dashboardData?.byChannel.reduce((sum, item) => sum + item.count, 0) || 1;
  const channelDistribution = dashboardData?.byChannel.map((item) => ({
    name: item.channel,
    value: item.count,
    percentage: Math.round((item.count / totalChannelConversations) * 100),
    fill: CHANNEL_COLORS[item.channel] || COLORS[0],
  })) || [];

  // Transform prompts data for the worst prompts table
  const topWorstPrompts = promptsData
    .filter((item: PromptAnalytics) => item.conversationCount > 0)
    .map((item: PromptAnalytics) => ({
      name: item.promptName,
      avgRating: item.avgRating,
      count: item.conversationCount,
    }))
    .sort((a, b) => a.avgRating - b.avgRating)
    .slice(0, 5);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600 dark:text-green-400";
    if (rating >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4) return "default";
    if (rating >= 3) return "secondary";
    return "destructive";
  };

  const formatRating = (rating: number) => {
    return new Intl.NumberFormat("es-CL", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(rating);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Métricas clave para evaluar el rendimiento y calidad del agente de IA
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ratings Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Distribución de Calificaciones</CardTitle>
              </div>
            </div>
            <CardDescription>
              Histograma de satisfacción del usuario (1-5 estrellas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : ratingDistribution.every(item => item.count === 0) ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Star className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Sin calificaciones aún</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Las calificaciones aparecerán aquí cuando los usuarios evalúen las conversaciones
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="rating" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: '% de conversaciones', angle: -90, position: 'insideLeft', fontSize: 12 }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">{payload[0].payload.rating}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">Porcentaje:</span>
                                  <span className="text-sm font-bold">{payload[0].value}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">Cantidad:</span>
                                  <span className="text-sm">{payload[0].payload.count}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="percentage" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Distribución por Canal</CardTitle>
              </div>
            </div>
            <CardDescription>
              Volumen de conversaciones según el canal de origen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : channelDistribution.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-full bg-muted p-3">
                  <PieChartIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Sin datos de canales</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Los datos aparecerán cuando haya conversaciones registradas
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {channelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium">{payload[0].name}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">Conversaciones:</span>
                                  <span className="text-sm font-bold">{payload[0].value}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">Porcentaje:</span>
                                  <span className="text-sm">{payload[0].payload.percentage}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Worst Prompts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Agentes con Menor Rendimiento</CardTitle>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              Top 5
            </Badge>
          </div>
          <CardDescription>
            Identifica los prompts que requieren optimización basándose en calificaciones bajas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Nombre del Agente</TableHead>
                    <TableHead className="text-center">Rating Promedio</TableHead>
                    <TableHead className="text-right">Conversaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topWorstPrompts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                          <div>
                            <p className="text-sm font-medium">No hay datos suficientes</p>
                            <p className="text-xs text-muted-foreground">
                              Se necesitan conversaciones con calificaciones para generar este análisis
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    topWorstPrompts.map((prompt, index) => (
                      <TableRow key={prompt.name}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{prompt.name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant={getRatingBadge(prompt.avgRating)}>
                              <Star className="mr-1 h-3 w-3" />
                              {formatRating(prompt.avgRating)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-medium">{prompt.count}</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {prompt.count === 1 ? 'conversación' : 'conversaciones'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}