import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Alle aktiven Streams abrufen
router.get('/', async (req, res) => {
  try {
    const streams = await prisma.stream.findMany({
      where: { isLive: true },
      include: {
        streamer: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { viewerCount: 'desc' }
    });
    res.json(streams);
  } catch (error) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Neuen Stream erstellen
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const userId = req.user.id;

    const stream = await prisma.stream.create({
      data: {
        title,
        description,
        category,
        tags,
        streamerId: userId,
        streamKey: Math.random().toString(36).substring(2, 15)
      }
    });

    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Stream-Details abrufen
router.get('/:id', async (req, res) => {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: req.params.id },
      include: {
        streamer: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        guests: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream nicht gefunden' });
    }

    res.json(stream);
  } catch (error) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Stream aktualisieren
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const stream = await prisma.stream.findUnique({
      where: { id: req.params.id }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream nicht gefunden' });
    }

    if (stream.streamerId !== req.user.id) {
      return res.status(403).json({ error: 'Nicht autorisiert' });
    }

    const updatedStream = await prisma.stream.update({
      where: { id: req.params.id },
      data: { title, description, category, tags }
    });

    res.json(updatedStream);
  } catch (error) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Stream beenden
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: req.params.id }
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream nicht gefunden' });
    }

    if (stream.streamerId !== req.user.id) {
      return res.status(403).json({ error: 'Nicht autorisiert' });
    }

    await prisma.stream.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Stream erfolgreich beendet' });
  } catch (error) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

export default router; 