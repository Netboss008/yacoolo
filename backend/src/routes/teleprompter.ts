import express, { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import {
  generateScriptSections,
  analyzeStreamProgress,
  generateScriptSuggestions,
  learnFromStream
} from '../services/teleprompter';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

// Skript erstellen
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { title, content } = req.body;

    // Erstelle Skript
    const script = await prisma.teleprompterScript.create({
      data: {
        title,
        content,
        streamerId: req.user.id
      }
    });

    // Generiere Abschnitte mit KI
    const sections = await generateScriptSections(content);

    // Speichere Abschnitte
    await Promise.all(
      sections.map(async (section: any, index: number) => {
        await prisma.teleprompterSection.create({
          data: {
            scriptId: script.id,
            title: section.title,
            content: section.content,
            order: index,
            keywords: section.keywords
          }
        });
      })
    );

    res.json(script);
  } catch (error) {
    console.error('Fehler beim Erstellen des Skripts:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Skript-Fortschritt analysieren
router.post('/:scriptId/analyze', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { scriptId } = req.params;
    const { streamId, transcription } = req.body;

    const progress = await analyzeStreamProgress(streamId, scriptId, transcription);
    const suggestions = await generateScriptSuggestions(streamId, scriptId, progress);

    res.json({ progress, suggestions });
  } catch (error) {
    console.error('Fehler bei der Skript-Analyse:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Aus Stream lernen
router.post('/:scriptId/learn', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { scriptId } = req.params;
    const { streamId, transcription, viewerEngagement } = req.body;

    const learnings = await learnFromStream(streamId, scriptId, transcription, viewerEngagement);
    res.json(learnings);
  } catch (error) {
    console.error('Fehler beim Lernen aus dem Stream:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Skript abrufen
router.get('/:scriptId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { scriptId } = req.params;

    const script = await prisma.teleprompterScript.findUnique({
      where: { id: scriptId },
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!script) {
      return res.status(404).json({ error: 'Skript nicht gefunden' });
    }

    res.json(script);
  } catch (error) {
    console.error('Fehler beim Abrufen des Skripts:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Alle Skripte des Streamers abrufen
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const scripts = await prisma.teleprompterScript.findMany({
      where: { streamerId: req.user.id },
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json(scripts);
  } catch (error) {
    console.error('Fehler beim Abrufen der Skripte:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

export default router; 