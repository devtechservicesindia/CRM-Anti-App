import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (req.user!.role === 'CUSTOMER') where.userId = req.user!.userId;
    if (status) where.status = status as PaymentStatus;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          user: { select: { id: true, name: true, email: true } },
          booking: { include: { station: { select: { id: true, name: true, type: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({ payments, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments', error: String(err) });
  }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, method, reference } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    if (booking.payment) {
      res.status(400).json({ message: 'Payment already recorded for this booking' });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId: booking.userId,
        amount: booking.totalAmount || 0,
        method: method as PaymentMethod,
        status: 'COMPLETED',
        reference,
      },
      include: {
        user: { select: { id: true, name: true } },
        booking: { include: { station: { select: { name: true } } } },
      },
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment', error: String(err) });
  }
};

export const getPaymentStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayRevenue, monthRevenue, totalRevenue, methodBreakdown] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    res.json({
      today: todayRevenue._sum.amount || 0,
      month: monthRevenue._sum.amount || 0,
      total: totalRevenue._sum.amount || 0,
      byMethod: methodBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payment stats', error: String(err) });
  }
};
