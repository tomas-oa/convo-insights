import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard analytics
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const { period = 'all' } = req.query; // 'today', 'week', 'month', 'all'
    
    // Calculate date range based on period
    let startDate: Date | undefined;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate = undefined;
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;

    // Total conversations
    const totalConversations = await prisma.conversation.count({
      where: { 
        ...(dateFilter && { startDate: dateFilter }),
      },
    });

    // Open conversations
    const openConversations = await prisma.conversation.count({
      where: {
        status: 'OPEN',
        ...(dateFilter && { startDate: dateFilter }),
      },
    });

    // Total messages
    const totalMessages = await prisma.message.count({
      where: {
        conversation: {
          ...(dateFilter && { startDate: dateFilter }),
        },
      },
    });

    // Average rating
    const avgRatingResult = await prisma.conversation.aggregate({
      where: {
        rating: { not: null },
        ...(dateFilter && { startDate: dateFilter }),
      },
      _avg: {
        rating: true,
      },
    });

    // Satisfaction percentage (conversations with rating >= 4)
    const totalRatedConversations = await prisma.conversation.count({
      where: {
        rating: { not: null },
        ...(dateFilter && { startDate: dateFilter }),
      },
    });

    const satisfactoryConversations = await prisma.conversation.count({
      where: {
        rating: { gte: 4 },
        ...(dateFilter && { startDate: dateFilter }),
      },
    });

    const satisfactionPercentage = totalRatedConversations > 0 
      ? (satisfactoryConversations / totalRatedConversations) * 100 
      : 0;

    // Average AI response time
    const avgResponseTimeResult = await prisma.message.aggregate({
      where: {
        role: 'AI',
        responseTime: { not: null },
        conversation: {
          ...(dateFilter && { startDate: dateFilter }),
        },
      },
      _avg: {
        responseTime: true,
      },
    });

    // Conversations by channel
    const channelStats = await prisma.conversation.groupBy({
      by: ['channel'],
      where: { 
        ...(dateFilter && { startDate: dateFilter }),
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Conversations by status
    const statusStats = await prisma.conversation.groupBy({
      by: ['status'],
      where: { 
        ...(dateFilter && { startDate: dateFilter }),
      },
      _count: {
        id: true,
      },
    });

    // Recent conversations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentConversations = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT date(startDate) as date, COUNT(*) as count
      FROM conversations
      WHERE datetime(startDate) >= datetime(${sevenDaysAgo.toISOString()})
      GROUP BY date(startDate)
      ORDER BY date ASC
    `;

    res.json({
      totals: {
        conversations: totalConversations,
        openConversations: openConversations,
        messages: totalMessages,
        averageRating: avgRatingResult._avg.rating || 0,
        satisfactionPercentage: Math.round(satisfactionPercentage * 10) / 10,
        avgResponseTime: avgResponseTimeResult._avg.responseTime || 0,
      },
      byChannel: channelStats.map(s => ({
        channel: s.channel,
        count: s._count.id,
      })),
      byStatus: statusStats.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      recentActivity: recentConversations.map(r => ({
        date: r.date,
        count: Number(r.count),
      })),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Error al obtener analíticas' });
  }
});

// Get conversation trends
router.get('/trends', async (req: AuthRequest, res) => {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    daysAgo.setUTCHours(0, 0, 0, 0);

    // Get all conversations in the date range
    const conversations = await prisma.conversation.findMany({
      where: {
        startDate: {
          gte: daysAgo,
        },
      },
      select: {
        startDate: true,
        status: true,
        rating: true,
      },
    });

    // Group by date in local timezone
    const trendsMap = new Map<string, {
      conversations: number;
      open: number;
      closed: number;
      ratings: number[];
    }>();

    conversations.forEach(conv => {
      // Convert to local date string (YYYY-MM-DD)
      const localDate = new Date(conv.startDate).toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
      
      if (!trendsMap.has(localDate)) {
        trendsMap.set(localDate, {
          conversations: 0,
          open: 0,
          closed: 0,
          ratings: [],
        });
      }

      const dayData = trendsMap.get(localDate)!;
      dayData.conversations++;
      
      if (conv.status === 'OPEN') {
        dayData.open++;
      } else {
        dayData.closed++;
      }

      if (conv.rating !== null) {
        dayData.ratings.push(conv.rating);
      }
    });

    // Convert to array and calculate averages
    const result = Array.from(trendsMap.entries())
      .map(([date, data]) => ({
        date,
        conversations: data.conversations,
        open: data.open,
        closed: data.closed,
        avg_rating: data.ratings.length > 0
          ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
          : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Error al obtener tendencias' });
  }
});

// Get rating distribution
router.get('/ratings', async (req: AuthRequest, res) => {
  try {
    const ratings = await prisma.conversation.groupBy({
      by: ['rating'],
      where: {
        rating: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        rating: 'asc',
      },
    });

    res.json(ratings.map(r => ({
      rating: r.rating,
      count: r._count.id,
    })));
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Error al obtener distribución de calificaciones' });
  }
});

// Get prompt analytics (Top 5 worst prompts by rating)
router.get('/prompts', async (req: AuthRequest, res) => {
  try {
    const promptStats = await prisma.conversation.groupBy({
      by: ['promptId'],
      where: {
        promptId: { not: null },
        rating: { not: null },
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // Get prompt details
    const promptIds = promptStats.map(s => s.promptId).filter(Boolean) as string[];
    const prompts = await prisma.prompt.findMany({
      where: {
        id: { in: promptIds },
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    const promptMap = new Map(prompts.map(p => [p.id, p]));

    const results = promptStats
      .map(s => {
        const prompt = promptMap.get(s.promptId!);
        return {
          promptId: s.promptId,
          promptName: prompt?.name || 'Unknown',
          promptDescription: prompt?.description,
          avgRating: s._avg.rating || 0,
          conversationCount: s._count.id,
        };
      })
      .sort((a, b) => a.avgRating - b.avgRating)
      .slice(0, 5);

    res.json(results);
  } catch (error) {
    console.error('Get prompt analytics error:', error);
    res.status(500).json({ error: 'Error al obtener analíticas de prompts' });
  }
});

export default router;
