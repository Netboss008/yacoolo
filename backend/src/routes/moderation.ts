import express, { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import {
  analyzeLegalContent,
  moderateChat,
  learnFromModeration
} from '../services/moderation';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Streamer-Einstellungen aktualisieren
router.put('/settings', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { legalAnalysis, chatModeration, sensitivityLevel } = req.body;

    const settings = await prisma.streamerSettings.upsert({
      where: { streamerId: req.user.id },
      update: {
        legalAnalysis,
        chatModeration,
        sensitivityLevel
      },
      create: {
        streamerId: req.user.id,
        legalAnalysis,
        chatModeration,
        sensitivityLevel
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Blockierte Wörter verwalten
router.post('/blocked-words', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { word } = req.body;

    const blockedWord = await prisma.blockedWord.create({
      data: {
        word,
        streamerId: req.user.id
      }
    });

    res.json(blockedWord);
  } catch (error) {
    console.error('Fehler beim Hinzufügen blockierter Wörter:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

router.delete('/blocked-words/:wordId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { wordId } = req.params;

    await prisma.blockedWord.delete({
      where: { id: wordId }
    });

    res.json({ message: 'Wort erfolgreich entfernt' });
  } catch (error) {
    console.error('Fehler beim Entfernen blockierter Wörter:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Rechtliche Analyse für einen Stream
router.post('/legal-analysis/:streamId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { streamId } = req.params;
    const { transcription } = req.body;

    const analysis = await analyzeLegalContent(streamId, transcription, req.user.id);
    res.json(analysis);
  } catch (error) {
    console.error('Fehler bei der rechtlichen Analyse:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Chat-Nachricht moderieren
router.post('/moderate-chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { streamId, message, userId } = req.body;

    const moderation = await moderateChat(streamId, message, userId, req.user.id);
    res.json(moderation);
  } catch (error) {
    console.error('Fehler bei der Chat-Moderation:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Aus Moderations-Logs lernen
router.post('/learn', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { streamId } = req.body;

    const logs = await prisma.chatModerationLog.findMany({
      where: { streamId }
    });

    const learnings = await learnFromModeration(streamId, req.user.id, logs);
    res.json(learnings);
  } catch (error) {
    console.error('Fehler beim Lernen aus der Moderation:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Moderations-Logs abrufen
router.get('/logs/:streamId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { streamId } = req.params;

    const logs = await prisma.chatModerationLog.findMany({
      where: { streamId },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error('Fehler beim Abrufen der Moderations-Logs:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Get moderation statistics
router.get('/stats/:streamId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { streamId } = req.params;
    const { timeRange = 'day' } = req.query;

    // Get time range filter
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default: // day
        startDate.setHours(now.getHours() - 24);
    }

    // Get moderation logs
    const moderationLogs = await prisma.chatModerationLog.findMany({
      where: {
        streamId,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Get legal analyses
    const legalAnalyses = await prisma.legalAnalysis.findMany({
      where: {
        streamId,
        timestamp: {
          gte: startDate
        }
      }
    });

    // Get blocked words count
    const blockedWords = await prisma.blockedWord.count({
      where: {
        streamerSettings: {
          streamId
        }
      }
    });

    // Calculate statistics
    const stats = {
      totalModerations: moderationLogs.length,
      warnings: moderationLogs.filter(log => log.action === 'warn').length,
      timeouts: moderationLogs.filter(log => log.action === 'timeout').length,
      bans: moderationLogs.filter(log => log.action === 'ban').length,
      blockedWords,
      legalAnalyses: legalAnalyses.length,
      moderationHistory: moderationLogs.reduce((acc: any[], log) => {
        const date = log.timestamp.toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [])
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Moderations-Statistiken' });
  }
});

// Rechtliche Analyse
router.get('/legal-analysis/:streamId', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const analyses = await prisma.legalAnalysis.findMany({
      where: { streamId },
      orderBy: { timestamp: 'desc' },
    });
    res.json(analyses);
  } catch (error) {
    console.error('Fehler beim Abrufen der rechtlichen Analysen:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Chat-Moderation
router.get('/chat/:streamId', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { streamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    console.error('Fehler beim Abrufen der Chat-Nachrichten:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Chat-Nachricht moderieren
router.post('/chat/:streamId/moderate', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { messageId, action, duration } = req.body;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { user: true },
    });

    if (!message) {
      return res.status(404).json({ error: 'Nachricht nicht gefunden' });
    }

    // Erstelle Moderations-Log
    const moderationLog = await prisma.chatModerationLog.create({
      data: {
        messageId,
        streamId,
        userId: message.userId,
        action,
        duration: action === 'timeout' ? duration : null,
        reason: 'Verstoß gegen Chatregeln',
      },
    });

    // Aktualisiere die Nachricht
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isModerated: true,
        moderationAction: action,
        moderationReason: 'Verstoß gegen Chatregeln',
      },
    });

    // Lerne aus der Moderation
    await learnFromModeration(streamId, message.userId, [moderationLog]);

    res.json({ success: true, moderationLog });
  } catch (error) {
    console.error('Fehler bei der Chat-Moderation:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Streamer-Einstellungen abrufen
router.get('/settings/:streamId', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        streamer: {
          include: {
            settings: {
              include: {
                blockedWords: true,
              },
            },
          },
        },
      },
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream nicht gefunden' });
    }

    res.json(stream.streamer.settings);
  } catch (error) {
    console.error('Fehler beim Abrufen der Streamer-Einstellungen:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Streamer-Einstellungen aktualisieren
router.put('/settings/:streamId', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const {
      legalAnalysisEnabled,
      chatModerationEnabled,
      sensitivityLevel,
      blockedWords,
    } = req.body;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        streamer: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream nicht gefunden' });
    }

    // Aktualisiere die Einstellungen
    const updatedSettings = await prisma.streamerSettings.update({
      where: { userId: stream.streamerId },
      data: {
        legalAnalysisEnabled,
        chatModerationEnabled,
        sensitivityLevel,
      },
    });

    // Aktualisiere die blockierten Wörter
    if (blockedWords) {
      await prisma.blockedWord.deleteMany({
        where: { streamerId: stream.streamerId },
      });

      await prisma.blockedWord.createMany({
        data: blockedWords.map((word: string) => ({
          word,
          streamerId: stream.streamerId,
        })),
      });
    }

    res.json(updatedSettings);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Streamer-Einstellungen:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

export default router; 