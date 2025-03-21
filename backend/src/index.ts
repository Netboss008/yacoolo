import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { setupStreamingServer } from './streaming';
import { setupAIService } from './ai';
import starsRouter from './routes/stars';
import adminRouter from './routes/admin';
import teamsRouter from './routes/teams';
import teleprompterRouter from './routes/teleprompter';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/streams', require('./routes/streams'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/stars', starsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/teleprompter', teleprompterRouter);

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinStream', async (streamId: string) => {
    socket.join(`stream:${streamId}`);
    const stream = await prisma.stream.update({
      where: { id: streamId },
      data: { viewerCount: { increment: 1 } }
    });
    io.to(`stream:${streamId}`).emit('viewerCount', stream.viewerCount);
  });

  socket.on('leaveStream', async (streamId: string) => {
    socket.leave(`stream:${streamId}`);
    const stream = await prisma.stream.update({
      where: { id: streamId },
      data: { viewerCount: { decrement: 1 } }
    });
    io.to(`stream:${streamId}`).emit('viewerCount', stream.viewerCount);
  });

  socket.on('sendMessage', async (data: { streamId: string; content: string; userId: string }) => {
    const message = await prisma.chatMessage.create({
      data: {
        content: data.content,
        userId: data.userId,
        streamId: data.streamId
      }
    });
    io.to(`stream:${data.streamId}`).emit('newMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize services
setupStreamingServer();
setupAIService();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 