import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getRewards = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' },
    });
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch rewards', error: String(err) });
  }
};

export const createReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, pointsCost, description, imageUrl, stock } = req.body;
    const reward = await prisma.reward.create({
      data: {
        name,
        pointsCost: parseInt(pointsCost as string, 10),
        description,
        imageUrl,
        stock: stock ? parseInt(stock as string, 10) : 999,
      },
    });
    res.status(201).json(reward);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create reward', error: String(err) });
  }
};

export const updateReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, pointsCost, description, imageUrl, stock, isActive } = req.body;
    const reward = await prisma.reward.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(pointsCost && { pointsCost: parseInt(pointsCost as string, 10) }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(stock !== undefined && { stock: parseInt(stock as string, 10) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update reward', error: String(err) });
  }
};

export const redeemReward = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const [user, reward] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.reward.findUnique({ where: { id } }),
    ]);

    if (!user || !reward) {
      res.status(404).json({ message: 'User or Reward not found' });
      return;
    }

    if (!reward.isActive || reward.stock <= 0) {
      res.status(400).json({ message: 'Reward is out of stock or unavailable' });
      return;
    }

    if (user.loyaltyPoints < reward.pointsCost) {
      res.status(400).json({ message: `Insufficient points. You need ${reward.pointsCost} points.` });
      return;
    }

    // Process redemption in a transaction
    const [redemption] = await prisma.$transaction([
      prisma.rewardRedemption.create({
        data: { userId, rewardId: id, status: 'PENDING' },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { decrement: reward.pointsCost } },
      }),
      prisma.reward.update({
        where: { id },
        data: { stock: { decrement: 1 } },
      }),
    ]);

    res.status(201).json(redemption);
  } catch (err) {
    res.status(500).json({ message: 'Failed to redeem reward', error: String(err) });
  }
};

export const getRedemptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const redemptions = await prisma.rewardRedemption.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(redemptions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch redemptions', error: String(err) });
  }
};

export const updateRedemptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body; // PENDING, FULFILLED, REJECTED
    const redemption = await prisma.rewardRedemption.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        reward: true,
      },
    });
    
    // If rejected, refund the points!
    if (status === 'REJECTED') {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: redemption.userId },
          data: { loyaltyPoints: { increment: (redemption as any).reward.pointsCost } }
        }),
        prisma.reward.update({
          where: { id: redemption.rewardId },
          data: { stock: { increment: 1 } }
        })
      ]);
    }

    res.json(redemption);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update redemption', error: String(err) });
  }
};
