import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { geminiService } from '../services/gemini.service.js';
import { io } from '../server.js';

const router = Router();

router.use(authenticateToken);

// Validation schema
const chatMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1),
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { conversationId, message } = chatMessageSchema.parse(req.body);
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: req.userId,
      },
      include: {
        prompt: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    if (conversation.status === 'CLOSED') {
      return res.status(400).json({ error: 'La conversación está cerrada' });
    }
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        content: message,
        role: 'USER',
      },
    });

    io.to(`conversation-${conversationId}`).emit('ai-typing', { conversationId, isTyping: true });

    const startTime = Date.now();
    let aiResponse: string;

    try {
      // Retrieve last 10 messages for context (excluding SYSTEM role - not supported by Gemini)
      const previousMessages = await prisma.message.findMany({
        where: {
          conversationId,
          id: { not: userMessage.id },
          role: { not: 'SYSTEM' },
        },
        orderBy: {
          timestamp: 'asc',
        },
        take: 10,
      });

      const conversationHistory = previousMessages
        .map(msg => ({
          role: msg.role === 'USER' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.content }],
        }));
      const systemPrompt = conversation.prompt?.text || 'Eres un asistente útil y amigable. Responde de manera clara y concisa.';
      if (geminiService.isAvailable()) {
        aiResponse = await geminiService.generateResponse(
          message,
          systemPrompt,
          conversationHistory
        );
      } else {
        aiResponse = `[Gemini AI no configurado] Respuesta simulada al mensaje: "${message}". Por favor, configura GEMINI_API_KEY en las variables de entorno.`;
      }
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      console.error('Error details:', error.message || error);
      console.error('Error stack:', error.stack);
      
      // Provide user-friendly error messages based on error type
      if (error.message?.includes('API key')) {
        aiResponse = 'Error: La API key de Gemini no es válida o ha expirado.';
      } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        aiResponse = 'Lo siento, se ha excedido el límite de uso de la API. Por favor, intenta más tarde.';
      } else if (error.message?.includes('safety') || error.message?.includes('blocked')) {
        aiResponse = 'Lo siento, no puedo responder a ese mensaje debido a restricciones de contenido.';
      } else {
        aiResponse = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';
      }
    }

    const responseTime = Math.floor((Date.now() - startTime) / 1000);
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        content: aiResponse,
        role: 'AI',
        responseTime,
        promptId: conversation.promptId,
      },
    });

    io.to(`conversation-${conversationId}`).emit('ai-typing', { conversationId, isTyping: false });
    io.to(`conversation-${conversationId}`).emit('new-message', { message: aiMessage });

    res.json({
      userMessage,
      aiMessage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Error al procesar mensaje' });
  }
});

export default router;
