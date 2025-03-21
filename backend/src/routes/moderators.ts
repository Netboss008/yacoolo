import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Moderator hinzufügen
router.post('/:streamId/moderators', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { userId, rank, permissions } = req.body;

    // Prüfe, ob der Stream existiert und der User der Host ist
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true }
    });

    if (!stream || stream.streamerId !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const moderator = await prisma.moderator.create({
      data: {
        streamId,
        userId,
        rank,
        permissions
      }
    });

    res.json(moderator);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Moderators:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Moderator-Berechtigungen aktualisieren
router.put('/:streamId/moderators/:moderatorId', authenticateToken, async (req, res) => {
  try {
    const { streamId, moderatorId } = req.params;
    const { rank, permissions } = req.body;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true }
    });

    if (!stream || stream.streamerId !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const moderator = await prisma.moderator.update({
      where: { id: moderatorId },
      data: { rank, permissions }
    });

    res.json(moderator);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Moderators:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Moderator entfernen
router.delete('/:streamId/moderators/:moderatorId', authenticateToken, async (req, res) => {
  try {
    const { streamId, moderatorId } = req.params;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { streamer: true }
    });

    if (!stream || stream.streamerId !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    await prisma.moderator.delete({
      where: { id: moderatorId }
    });

    res.json({ message: 'Moderator erfolgreich entfernt' });
  } catch (error) {
    console.error('Fehler beim Entfernen des Moderators:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Stream-Übernahme starten
router.post('/:streamId/takeover', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;
    const { reason } = req.body;

    // Prüfe, ob der User ein Gold-Moderator ist
    const moderator = await prisma.moderator.findFirst({
      where: {
        streamId,
        userId: req.user.id,
        rank: 'gold'
      }
    });

    if (!moderator) {
      return res.status(403).json({ error: 'Keine Berechtigung für Stream-Übernahme' });
    }

    // Prüfe, ob bereits eine aktive Übernahme existiert
    const activeTakeover = await prisma.streamTakeover.findFirst({
      where: {
        streamId,
        status: 'active'
      }
    });

    if (activeTakeover) {
      return res.status(400).json({ error: 'Stream wird bereits übernommen' });
    }

    const takeover = await prisma.streamTakeover.create({
      data: {
        streamId,
        moderatorId: moderator.id,
        reason
      }
    });

    // Hier würde die technische Stream-Übernahme implementiert
    // z.B. Wechsel der Stream-Key, Übergabe der Kontrolle

    res.json(takeover);
  } catch (error) {
    console.error('Fehler bei der Stream-Übernahme:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Stream-Übernahme beenden
router.put('/:streamId/takeover/:takeoverId/end', authenticateToken, async (req, res) => {
  try {
    const { streamId, takeoverId } = req.params;

    const takeover = await prisma.streamTakeover.findUnique({
      where: { id: takeoverId },
      include: { stream: true }
    });

    if (!takeover || takeover.streamId !== streamId) {
      return res.status(404).json({ error: 'Übernahme nicht gefunden' });
    }

    // Nur der Host oder der übernehmende Moderator kann die Übernahme beenden
    if (takeover.stream.streamerId !== req.user.id && takeover.moderatorId !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const updatedTakeover = await prisma.streamTakeover.update({
      where: { id: takeoverId },
      data: {
        status: 'completed',
        endTime: new Date()
      }
    });

    // Hier würde die technische Rückgabe der Stream-Kontrolle implementiert

    res.json(updatedTakeover);
  } catch (error) {
    console.error('Fehler beim Beenden der Stream-Übernahme:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

// Moderator-Liste abrufen
router.get('/:streamId/moderators', authenticateToken, async (req, res) => {
  try {
    const { streamId } = req.params;

    const moderators = await prisma.moderator.findMany({
      where: { streamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json(moderators);
  } catch (error) {
    console.error('Fehler beim Abrufen der Moderatoren:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

export default router; 