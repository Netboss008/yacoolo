import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  id: string;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        isAdmin: boolean;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden' });
    }

    req.user = {
      id: user.id,
      isAdmin: user.isAdmin
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Ungültiger Token' });
  }
};

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Keine Admin-Berechtigung' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Keine Admin-Berechtigung' });
  }
}; 