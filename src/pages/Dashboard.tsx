import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Star, Clock, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";

type TimePeriod = 'today' | 'week' | 'month';

export default function Dashboard() {
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [stats, setStats] = useState({
    totalConversations: 0,
    satisfaction: 0,
    avgResponseTime: 0,
    totalWeek: 0,
    totalMonth: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadChartData()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load stats for current period
      const analytics = await api.getDashboardAnalytics(period);
      
      // Also load week and month totals for display
      const weekAnalytics = await api.getDashboardAnalytics('week');
      const monthAnalytics = await api.getDashboardAnalytics('month');
      
      setStats({
        totalConversations: analytics.totals.conversations,
        satisfaction: analytics.totals.satisfactionPercentage,
        avgResponseTime: analytics.totals.avgResponseTime,
        totalWeek: weekAnalytics.totals.conversations,
        totalMonth: monthAnalytics.totals.conversations,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadChartData = async () => {
    try {
      // Show last 7 days including today
      const days = 7;
      const trends = await api.getTrends(days);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day
      
      // Create data for last 7 days (6 days ago + today)
      const data = Array.from({ length: days }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - 1 - i));
        
        // Format date as YYYY-MM-DD in local timezone (not UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const trend = trends.find((t: any) => {
          if (!t.date) return false;
          // Compare just the date part (handle both ISO timestamps and date strings)
          const trendDate = t.date.includes('T') ? t.date.split('T')[0] : t.date;
          const match = trendDate === dateStr;
          return match;
        });
        
        // Format label using Intl API for better localization
        const label = new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'short'
        }).format(date);
        
        const dataPoint = {
          name: label,
          conversaciones: trend?.conversations || 0,
          date: dateStr,
          fullDate: date.toLocaleDateString('es-AR'),
        };
        
        return dataPoint;
      });

      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  // Get the appropriate title and description based on period
  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return { title: 'Hoy', desc: 'Conversaciones iniciadas hoy', badge: 'Últimas 24h' };
      case 'week':
        return { title: 'Esta semana', desc: 'Últimos 7 días', badge: '7 días' };
      case 'month':
        return { title: 'Este mes', desc: 'Últimos 30 días', badge: '30 días' };
    }
  };

  const periodLabel = getPeriodLabel();

  // Calculate satisfaction status
  const getSatisfactionStatus = () => {
    if (stats.satisfaction >= 80) return { color: 'text-green-600 dark:text-green-400', label: 'Excelente' };
    if (stats.satisfaction >= 60) return { color: 'text-yellow-600 dark:text-yellow-400', label: 'Bueno' };
    return { color: 'text-red-600 dark:text-red-400', label: 'Requiere atención' };
  };

  const satisfactionStatus = getSatisfactionStatus();

  // Calculate response time status
  const getResponseTimeStatus = () => {
    if (stats.avgResponseTime === 0) return { color: 'text-muted-foreground', label: 'Sin datos' };
    if (stats.avgResponseTime <= 2) return { color: 'text-green-600 dark:text-green-400', label: 'Óptimo' };
    if (stats.avgResponseTime <= 5) return { color: 'text-yellow-600 dark:text-yellow-400', label: 'Aceptable' };
    return { color: 'text-red-600 dark:text-red-400', label: 'Lento' };
  };

  const responseTimeStatus = getResponseTimeStatus();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Panel de Control</h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Monitorea el rendimiento de tus agentes de IA en tiempo real
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Period Selector */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Período de análisis</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">{periodLabel.title}</p>
                  </div>
                </div>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)} className="w-full sm:w-auto">
                  <TabsList className="grid w-full grid-cols-3 sm:w-auto h-9">
                    <TabsTrigger value="today" className="text-xs sm:text-sm">Hoy</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs sm:text-sm">7 días</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs sm:text-sm">30 días</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Conversations */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Volumen de conversaciones</p>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{stats.totalConversations.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{periodLabel.desc}</p>
                  </div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {periodLabel.badge}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Satisfaction Rate */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Tasa de satisfacción</p>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <p className="text-3xl sm:text-4xl font-bold text-foreground">{stats.satisfaction}%</p>
                      <span className={clsx("text-xs sm:text-sm font-medium", satisfactionStatus.color)}>
                        {satisfactionStatus.label}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Conversaciones con rating ≥4 estrellas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Tiempo de respuesta</p>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <p className="text-3xl sm:text-4xl font-bold text-foreground">
                        {stats.avgResponseTime > 0 ? `${stats.avgResponseTime.toFixed(1)}s` : 'N/A'}
                      </p>
                      {stats.avgResponseTime > 0 && (
                        <span className={clsx("text-xs sm:text-sm font-medium", responseTimeStatus.color)}>
                          {responseTimeStatus.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Promedio de primera respuesta del agente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Tendencia de volumen
                  </CardTitle>
                  <CardDescription className="mt-1 sm:mt-1.5 text-xs sm:text-sm">
                    Evolución diaria de conversaciones en los últimos 7 días
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      allowDecimals={false}
                      label={{ value: 'Conversaciones', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
                      formatter={(value: any) => [`${value} conversaciones`, 'Total']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversaciones" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                      name="Conversaciones"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Quick insights */}
              {chartData.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      <span className="font-medium text-foreground">Insight:</span> Utiliza esta tendencia para identificar patrones de uso y planificar recursos de soporte.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}