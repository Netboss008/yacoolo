import express, { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    isAdmin: boolean;
  };
}

// Admin in einen Stream einblenden
router.post('/intervene/:streamId', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { streamId } = req.params;
    const { reason } = req.body;

    // Stream existiert und ist live
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { adminInterventions: true }
    });

    if (!stream || !stream.isLive) {
      return res.status(404).json({ error: 'Stream nicht gefunden oder nicht live' });
    }

    // Prüfe ob bereits eine aktive Intervention läuft
    const activeIntervention = stream.adminInterventions.find(
      intervention => intervention.status === 'active'
    );

    if (activeIntervention) {
      return res.status(400).json({ error: 'Bereits eine aktive Intervention vorhanden' });
    }

    // Erstelle neue Intervention
    const intervention = await prisma.adminIntervention.create({
      data: {
        adminId: req.user.id,
        streamId,
        reason,
        status: 'active'
      }
    });

    // Benachrichtige alle Zuschauer über Socket.IO
    req.app.get('io').to(streamId).emit('adminIntervention', {
      type: 'start',
      adminId: req.user.id,
      reason
    });

    res.json(intervention);
  } catch (error) {
    console.error('Fehler bei Admin-Intervention:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Admin-Intervention beenden
router.post('/intervention/:interventionId/end', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { interventionId } = req.params;

    const intervention = await prisma.adminIntervention.findUnique({
      where: { id: interventionId },
      include: { stream: true }
    });

    if (!intervention || intervention.status !== 'active') {
      return res.status(404).json({ error: 'Intervention nicht gefunden oder nicht aktiv' });
    }

    // Beende Intervention
    const updatedIntervention = await prisma.adminIntervention.update({
      where: { id: interventionId },
      data: {
        status: 'ended',
        endTime: new Date()
      }
    });

    // Benachrichtige alle Zuschauer
    req.app.get('io').to(intervention.streamId).emit('adminIntervention', {
      type: 'end',
      interventionId
    });

    res.json(updatedIntervention);
  } catch (error) {
    console.error('Fehler beim Beenden der Intervention:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

export default router; 