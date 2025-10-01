import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Star, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalToday: 0,
    satisfaction: 0,
    avgResponseTime: 0,
    totalWeek: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, []);

  const loadStats = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Get today's conversations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayConvs } = await supabase
      .from("conversations")
      .select("id, rating")
      .eq("user_id", user.user.id)
      .gte("created_at", today.toISOString());

    // Get week's conversations
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weekConvs } = await supabase
      .from("conversations")
      .select("id, rating")
      .eq("user_id", user.user.id)
      .gte("created_at", weekAgo.toISOString());

    // Calculate satisfaction (conversations with rating >= 4)
    const satisfactoryConvs = weekConvs?.filter(c => c.rating && c.rating >= 4).length || 0;
    const totalWithRating = weekConvs?.filter(c => c.rating).length || 1;
    
    setStats({
      totalToday: todayConvs?.length || 0,
      satisfaction: Math.round((satisfactoryConvs / totalWithRating) * 100 * 10) / 10,
      avgResponseTime: 1.3, // Simulated
      totalWeek: weekConvs?.length || 0,
    });
  };

  const loadChartData = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: conversations } = await supabase
      .from("conversations")
      .select("created_at")
      .eq("user_id", user.user.id)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at");

    // Group by day
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const counts = new Array(7).fill(0);
    
    conversations?.forEach(conv => {
      const date = new Date(conv.created_at);
      const dayIndex = (date.getDay() + 6) % 7; // Convert to Mon-Sun
      counts[dayIndex]++;
    });

    const data = days.map((day, i) => ({
      name: day,
      conversaciones: counts[i],
    }));

    setChartData(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resumen</h1>
        <p className="mt-1 text-muted-foreground">Vista general del rendimiento de las conversaciones con IA</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Conversaciones Hoy"
          value={stats.totalToday}
          description="Total de conversaciones iniciadas"
          trend="+12% vs ayer"
          trendDirection="up"
          icon={MessageSquare}
        />
        <StatCard
          title="Satisfacción"
          value={`${stats.satisfaction}%`}
          description="Conversaciones con rating ≥4"
          trend="+2.1% vs semana pasada"
          trendDirection="up"
          icon={Star}
        />
        <StatCard
          title="Tiempo Respuesta"
          value={`${stats.avgResponseTime}s`}
          description="Promedio de respuesta de IA"
          trend="-0.2s mejora"
          trendDirection="up"
          icon={Clock}
        />
        <StatCard
          title="Conversaciones Semana"
          value={stats.totalWeek}
          description="Total semanal"
          trend="Estable"
          trendDirection="neutral"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volumen de Conversaciones</CardTitle>
          <CardDescription>Conversaciones por día en la última semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="conversaciones" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}