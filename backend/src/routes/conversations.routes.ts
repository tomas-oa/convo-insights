import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { ConversationStatus, ChannelType } from '../../generated/index.js';

const router = Router();

router.use(authenticateToken);
const createConversationSchema = z.object({
  channel: z.enum(['WEB', 'WHATSAPP', 'INSTAGRAM', 'TELEGRAM']).default('WEB'),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
});

const updateConversationSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  rating: z.number().min(1).max(5).optional(),
  endDate: z.string().datetime().optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, channel, limit = '50', offset = '0' } = req.query;
    
    const where: any = {};

    if (status) {
      where.status = status as ConversationStatus;
    }

    if (channel) {
      where.channel = channel as ChannelType;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        prompt: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
      },
      include: {
        prompt: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Error al obtener conversación' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { channel, status } = createConversationSchema.parse(req.body);
    const activePrompt = await prisma.prompt.findFirst({
      where: {
        OR: [
          { isDefault: true },
          { isActive: true },
        ],
      },
      orderBy: {
        isDefault: 'desc',
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        userId: req.userId,
        channel: channel as ChannelType,
        status: status as ConversationStatus,
        promptId: activePrompt?.id,
      },
      include: {
        prompt: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Error al crear conversación' });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = updateConversationSchema.parse(req.body);
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    const updateData: any = {};
    
    if (updates.status) {
      updateData.status = updates.status as ConversationStatus;
      
      // Auto-calculate duration when closing a conversation
      if (updates.status === 'CLOSED' && !existing.endDate) {
        updateData.endDate = new Date();
        const duration = Math.floor((new Date().getTime() - existing.startDate.getTime()) / 1000);
        updateData.duration = duration;
      }
    }

    if (updates.rating !== undefined) {
      updateData.rating = updates.rating;
    }

    if (updates.endDate) {
      updateData.endDate = new Date(updates.endDate);
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        prompt: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(conversation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Error al actualizar conversación' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.conversation.findFirst({
      where: {
        id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    await prisma.conversation.delete({
      where: { id },
    });

    res.json({ message: 'Conversación eliminada exitosamente' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
});

router.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if conversation exists
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
      },
      include: {
        messages: {
          select: {
            role: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Single pass message counting - O(n) instead of O(2n)
    let userMessages = 0;
    let aiMessages = 0;
    for (const msg of conversation.messages) {
      if (msg.role === 'USER') userMessages++;
      else if (msg.role === 'AI') aiMessages++;
    }

    const stats = {
      totalMessages: conversation.messages.length,
      userMessages,
      aiMessages,
      firstMessageAt: conversation.messages[0]?.timestamp || null,
      lastMessageAt: conversation.messages[conversation.messages.length - 1]?.timestamp || null,
      duration: conversation.duration,
    };

    res.json(stats);
  } catch (error) {
    console.error('Get conversation stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
