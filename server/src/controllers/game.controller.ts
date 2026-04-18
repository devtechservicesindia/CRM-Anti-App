import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getGames = async (_req: Request, res: Response): Promise<void> => {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch games', error: String(err) });
  }
};

export const createGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, genre, platform, imageUrl, description, rating } = req.body as {
      name: string; genre: string; platform: string; imageUrl?: string; description?: string; rating?: string | number;
    };
    const game = await prisma.game.create({
      data: { name, genre, platform, imageUrl, description, rating: rating != null ? parseFloat(String(rating)) : null },
    });
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create game', error: String(err) });
  }
};

export const updateGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, genre, platform, imageUrl, description, rating, isActive } = req.body as {
      name?: string; genre?: string; platform?: string; imageUrl?: string;
      description?: string; rating?: string | number; isActive?: boolean;
    };

    const game = await prisma.game.update({
      where: { id },
      data: {
        ...(name        && { name }),
        ...(genre       && { genre }),
        ...(platform    && { platform }),
        ...(imageUrl   !== undefined && { imageUrl }),
        ...(description !== undefined && { description }),
        ...(rating     !== undefined && { rating: parseFloat(String(rating)) }),
        ...(isActive   !== undefined && { isActive }),
      },
    });
    res.json(game);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update game', error: String(err) });
  }
};

export const deleteGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.game.update({ where: { id: req.params.id as string }, data: { isActive: false } });
    res.json({ message: 'Game removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete game', error: String(err) });
  }
};
