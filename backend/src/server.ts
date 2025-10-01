import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import conversationsRoutes from './routes/conversations.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import chatRoutes from './routes/chat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import promptsRoutes from './routes/prompts.routes.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO setup for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/prompts', promptsRoutes);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-conversation', (conversationId: string) => {
    socket.join(`conversation-${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(`conversation-${conversationId}`);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in routes
export { io };

// Error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 Conversatron Backend Server       ║
╠═══════════════════════════════════════╣
║   Port: ${config.port}                ║
║   Environment: ${config.nodeEnv}      ║
║   Frontend: ${config.frontendUrl}     ║
╚═══════════════════════════════════════╝
  `);
});

httpServer.on('error', (error) => {
  console.error('HTTP server error:', error);
});

httpServer.on('close', () => {
  console.log('HTTP server closed');
});
