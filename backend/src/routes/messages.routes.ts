import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { MessageRole } from '../../generated/index.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
  role: z.enum(['USER', 'AI', 'SYSTEM']),
});

// Get messages for a conversation
router.get('/conversation/:conversationId', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = '100', offset = '0' } = req.query;

    // Check if conversation exists
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        prompt: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// Get single message
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
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

    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Error al obtener mensaje' });
  }
});

// Create message
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { conversationId, content, role } = createMessageSchema.parse(req.body);

    // Check if conversation exists
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    if (conversation.status === 'CLOSED') {
      return res.status(400).json({ error: 'No se pueden agregar mensajes a una conversación cerrada' });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        role: role as MessageRole,
      },
    });

    // Update conversation's updatedAt (Prisma does this automatically)

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Error al crear mensaje' });
  }
});

// Delete message
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if message exists
    const message = await prisma.message.findFirst({
      where: {
        id,
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    await prisma.message.delete({
      where: { id },
    });

    res.json({ message: 'Mensaje eliminado exitosamente' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
});

export default router;
