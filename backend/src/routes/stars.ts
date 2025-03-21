import express, { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

interface Package {
  amount: number;
  price: number;
  bonus?: number;
}

const packages: Record<string, Package> = {
  small: { amount: 100, price: 4.99 },
  medium: { amount: 500, price: 19.99, bonus: 50 },
  large: { amount: 1000, price: 34.99, bonus: 150 },
  xlarge: { amount: 2000, price: 59.99, bonus: 400 }
};

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

router.post('/purchase', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { packageId } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    const userId = req.user.id;

    const selectedPackage = packages[packageId];
    if (!selectedPackage) {
      return res.status(400).json({ error: 'Ungültiges Paket' });
    }

    // Hier würde die Integration des Zahlungsanbieters erfolgen
    // Für den Moment simulieren wir einen erfolgreichen Kauf

    const totalStars = selectedPackage.amount + (selectedPackage.bonus ?? 0);

    // Transaktion erstellen
    await prisma.starTransaction.create({
      data: {
        amount: totalStars,
        type: 'purchase',
        userId
      }
    });

    // Stars dem Benutzer gutschreiben
    await prisma.user.update({
      where: { id: userId },
      data: {
        stars: {
          increment: totalStars
        }
      }
    });

    res.json({
      message: 'Stars erfolgreich gekauft',
      stars: totalStars
    });
  } catch (error) {
    console.error('Fehler beim Kauf:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

router.get('/balance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stars: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({ stars: user.stars });
  } catch (error) {
    console.error('Fehler beim Abrufen des Kontostands:', error);
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

export default router; 