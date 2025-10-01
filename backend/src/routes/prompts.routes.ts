import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createPromptSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  text: z.string().min(1),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  text: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// Get all prompts
router.get('/', async (req: AuthRequest, res) => {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
    });

    res.json(prompts);
  } catch (error) {
    console.error('Get prompts error:', error);
    res.status(500).json({ error: 'Error al obtener prompts' });
  }
});

// Get active prompt
router.get('/active', async (req: AuthRequest, res) => {
  try {
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

    if (!activePrompt) {
      return res.status(404).json({ error: 'No hay prompt activo' });
    }

    res.json(activePrompt);
  } catch (error) {
    console.error('Get active prompt error:', error);
    res.status(500).json({ error: 'Error al obtener prompt activo' });
  }
});

// Get prompt by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt no encontrado' });
    }

    res.json(prompt);
  } catch (error) {
    console.error('Get prompt error:', error);
    res.status(500).json({ error: 'Error al obtener prompt' });
  }
});

// Create prompt
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createPromptSchema.parse(req.body);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.prompt.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const prompt = await prisma.prompt.create({
      data,
    });

    res.status(201).json(prompt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Create prompt error:', error);
    res.status(500).json({ error: 'Error al crear prompt' });
  }
});

// Update prompt
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updatePromptSchema.parse(req.body);

    // Check if prompt exists
    const existing = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Prompt no encontrado' });
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.prompt.updateMany({
        where: { 
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data,
    });

    res.json(prompt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Update prompt error:', error);
    res.status(500).json({ error: 'Error al actualizar prompt' });
  }
});

// Activate/deactivate prompt
router.patch('/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Prompt no encontrado' });
    }

    // If activating, deactivate all others (only one active at a time)
    if (!existing.isActive) {
      await prisma.prompt.updateMany({
        where: { 
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    res.json(prompt);
  } catch (error) {
    console.error('Toggle prompt error:', error);
    res.status(500).json({ error: 'Error al cambiar estado del prompt' });
  }
});

// Delete prompt
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Prompt no encontrado' });
    }

    // Don't allow deleting the default prompt
    if (existing.isDefault) {
      return res.status(400).json({ error: 'No se puede eliminar el prompt por defecto' });
    }

    await prisma.prompt.delete({
      where: { id },
    });

    res.json({ message: 'Prompt eliminado exitosamente' });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({ error: 'Error al eliminar prompt' });
  }
});

export default router;
