import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

export default function Analytics() {
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<any[]>([]);
  const [topWorstPrompts, setTopWorstPrompts] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Get all conversations with ratings
    const { data: conversations } = await supabase
      .from("conversations")
      .select("rating, channel, prompt_id, prompts(name)")
      .eq("user_id", user.user.id);

    if (!conversations) return;

    // Rating distribution
    const ratingCounts = [0, 0, 0, 0, 0];
    conversations.forEach((conv) => {
      if (conv.rating) {
        ratingCounts[conv.rating - 1]++;
      }
    });
    
    const total = ratingCounts.reduce((a, b) => a + b, 0) || 1;
    const ratingData = ratingCounts.map((count, i) => ({
      rating: i + 1,
      count,
      percentage: Math.round((count / total) * 100),
    }));
    setRatingDistribution(ratingData);

    // Channel distribution
    const channelCounts: any = {};
    conversations.forEach((conv) => {
      channelCounts[conv.channel] = (channelCounts[conv.channel] || 0) + 1;
    });
    
    const channelData = Object.entries(channelCounts).map(([channel, count]) => ({
      name: channel,
      value: count as number,
      percentage: Math.round(((count as number) / conversations.length) * 100),
    }));
    setChannelDistribution(channelData);

    // Top 5 worst prompts by rating
    const promptRatings: any = {};
    conversations.forEach((conv) => {
      if (conv.rating && conv.prompt_id) {
        const promptData: any = conv.prompts;
        const promptName = promptData?.name || 'Unknown';
        if (!promptRatings[promptName]) {
          promptRatings[promptName] = { total: 0, count: 0 };
        }
        promptRatings[promptName].total += conv.rating;
        promptRatings[promptName].count++;
      }
    });

    const promptData = Object.entries(promptRatings).map(([name, data]: any) => ({
      name,
      avgRating: (data.total / data.count).toFixed(1),
      count: data.count,
    }));

    promptData.sort((a, b) => parseFloat(a.avgRating) - parseFloat(b.avgRating));
    setTopWorstPrompts(promptData.slice(0, 5));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Análisis detallado de las conversaciones</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Ratings</CardTitle>
            <CardDescription>Porcentaje de cada puntuación (1-5)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Canal</CardTitle>
            <CardDescription>Porcentaje de conversaciones por canal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Prompts con Peor Rating</CardTitle>
          <CardDescription>Prompts que generaron las calificaciones más bajas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Rating Promedio</TableHead>
                  <TableHead>N° Conversaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topWorstPrompts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No hay datos suficientes
                    </TableCell>
                  </TableRow>
                ) : (
                  topWorstPrompts.map((prompt) => (
                    <TableRow key={prompt.name}>
                      <TableCell className="font-medium">{prompt.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {prompt.avgRating}
                          <span className="text-warning">⭐</span>
                        </div>
                      </TableCell>
                      <TableCell>{prompt.count}</TableCell>
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