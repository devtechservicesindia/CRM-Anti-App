import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const calculateTier = (totalSpent: number) => {
  if (totalSpent >= 10000) return 'Platinum';
  if (totalSpent >= 5000) return 'Gold';
  if (totalSpent >= 2000) return 'Silver';
  return 'Bronze';
};

export const sweepExpiredPoints = async (userId: string) => {
  const now = new Date();
  
  // Find all unhandled expired points (EARN transactions that passed expiration)
  // For simplicity since we don't have a linked ledger, we map this out:
  // Instead of a complex ledger, we'll just check if any exist, and sum them up, 
  // then create an EXPIRE transaction.
  const expiredEarns = await prisma.loyaltyTransaction.findMany({
    where: {
      userId,
      type: 'EARN',
      expiresAt: { lt: now },
      notes: { not: { contains: '[EXPIRED]' } } // hacky way without schema change
    }
  });

  if (expiredEarns.length > 0) {
    let totalExpired = 0;
    for (const earn of expiredEarns) {
      totalExpired += earn.points;
      await prisma.loyaltyTransaction.update({
        where: { id: earn.id },
        data: { notes: earn.notes + ' [EXPIRED]' }
      });
    }

    if (totalExpired > 0) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { decrement: totalExpired } }
        }),
        prisma.loyaltyTransaction.create({
          data: {
             userId,
             points: -totalExpired,
             type: 'EXPIRE',
             notes: `Sweep removed ${totalExpired} expired points.`
          }
        })
      ]);
    }
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role as Role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        select: {
          id: true, email: true, name: true, role: true,
          avatar: true, phone: true, loyaltyPoints: true,
          totalSpent: true, staffNotes: true,
          isActive: true, createdAt: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const mappedUsers = users.map(u => ({ ...u, tier: calculateTier(u.totalSpent) }));
    res.json({ users: mappedUsers, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: String(err) });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Sweep before fetch
    await sweepExpiredPoints(id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true,
        avatar: true, phone: true, loyaltyPoints: true,
        totalSpent: true, staffNotes: true,
        isActive: true, createdAt: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { station: true, payment: true },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        }
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ ...user, tier: calculateTier(user.totalSpent) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: String(err) });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, phone, role, isActive, loyaltyPoints, staffNotes } = req.body as {
      name?: string; phone?: string; role?: string; isActive?: boolean; loyaltyPoints?: number; staffNotes?: string;
    };

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name             && { name }),
        ...(phone !== undefined && { phone }),
        ...(role             && { role: role as Role }),
        ...(isActive !== undefined && { isActive }),
        ...(loyaltyPoints !== undefined && { loyaltyPoints }),
        ...(staffNotes !== undefined && { staffNotes }),
      },
      select: { id: true, email: true, name: true, role: true, phone: true, loyaltyPoints: true, totalSpent: true, staffNotes: true, isActive: true },
    });

    res.json({ ...user, tier: calculateTier(user.totalSpent) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: String(err) });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.update({ where: { id: req.params.id as string }, data: { isActive: false } });
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: String(err) });
  }
};
