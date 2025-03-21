import express, { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { generateTeamLogo } from '../services/ai';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Team erstellen
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { name } = req.body;

    // Generiere Team-Logo mit KI
    const logo = await generateTeamLogo(name);

    const team = await prisma.team.create({
      data: {
        name,
        logo,
        hostId: req.user.id
      }
    });

    res.json(team);
  } catch (error) {
    console.error('Fehler beim Erstellen des Teams:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Team-Raum erstellen
router.post('/:teamId/room', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { teamId } = req.params;

    // Prüfe ob User Team-Host ist
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { teamRooms: true }
    });

    if (!team || team.hostId !== req.user.id) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    // Prüfe Zeitbeschränkungen
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRooms = team.teamRooms.filter(room => 
      room.startTime >= today && room.startTime < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    );

    if (todayRooms.length >= 2) {
      return res.status(400).json({ error: 'Maximale Anzahl an Team-Räumen für heute erreicht' });
    }

    if (todayRooms.length === 1) {
      const lastRoom = todayRooms[0];
      const hoursSinceLastRoom = (new Date().getTime() - lastRoom.startTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRoom < 3) {
        return res.status(400).json({ 
          error: 'Mindestens 3 Stunden Abstand zwischen Team-Räumen erforderlich' 
        });
      }
    }

    // Erstelle Team-Raum
    const room = await prisma.teamRoom.create({
      data: {
        teamId,
        endTime: new Date(Date.now() + 30 * 60 * 1000) // 30 Minuten
      }
    });

    res.json(room);
  } catch (error) {
    console.error('Fehler beim Erstellen des Team-Raums:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Team-Mitgliedschaft beantragen
router.post('/:teamId/join', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { teamId } = req.params;
    const { giftId } = req.body; // ID des Geschenks, das die Mitgliedschaft beantragt

    // Prüfe ob das Geschenk gültig ist
    const gift = await prisma.gift.findUnique({
      where: { id: giftId }
    });

    if (!gift || gift.type !== 'TEAM_MEMBERSHIP') {
      return res.status(400).json({ error: 'Ungültiges Geschenk' });
    }

    // Erstelle Team-Mitgliedschaft
    const membership = await prisma.teamMember.create({
      data: {
        teamId,
        userId: req.user.id
      }
    });

    // Aktualisiere User-Bio
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        bio: `@${req.user.username} | ${req.user.firstName} | Team ${team.name}`
      }
    });

    res.json(membership);
  } catch (error) {
    console.error('Fehler beim Beitreten des Teams:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

export default router; 