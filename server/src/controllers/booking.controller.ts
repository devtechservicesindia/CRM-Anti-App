import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../lib/socket';

export const getBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (req.user!.role === 'CUSTOMER') where.userId = req.user!.userId;
    if (status) where.status = status as string;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          station: { select: { id: true, name: true, type: true, hourlyRate: true } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ bookings, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: String(err) });
  }
};

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, stationId, notes, startTime, duration } = req.body as { 
      userId?: string; stationId: string; notes?: string; startTime?: string; duration?: number 
    };

    const targetStartTime = startTime ? new Date(startTime) : new Date();
    const parsedDuration = duration ? parseInt(String(duration), 10) : null;
    const targetEndTime = parsedDuration ? new Date(targetStartTime.getTime() + parsedDuration * 60000) : null;

    // Check for overlapping active bookings on this station using transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      const station = await tx.station.findUnique({ where: { id: stationId } });
      if (!station || station.status === 'MAINTENANCE' || !station.isActive) {
        throw new Error('Station is not available');
      }

      // Conflict logic: overlap means (A.start < B.end) AND (A.end > B.start) or A is unbounded
      const conflicts = await tx.booking.findMany({
        where: {
          stationId,
          status: 'ACTIVE',
        },
      });

      for (const existing of conflicts) {
        // If existing is open ended, and target is in future, it's a conflict since we don't know when it ends.
        if (!existing.endTime) {
          if (!targetEndTime || existing.startTime < targetEndTime) throw new Error('Station currently has an open-ended active session');
        } else {
          // If neither are open-ended, check standard overlap
          if (targetEndTime) {
            if (existing.startTime < targetEndTime && existing.endTime > targetStartTime) {
              throw new Error('Station is already booked for this time slot');
            }
          } else {
            // Target is open ended. Conflict if target starts before existing ends.
            if (targetStartTime < existing.endTime) {
              throw new Error('Cannot start an open-ended session; there are upcoming bookings.');
            }
          }
        }
      }

      const booking = await tx.booking.create({
        data: {
          userId: userId || req.user!.userId,
          stationId,
          notes,
          startTime: targetStartTime,
          endTime: targetEndTime,
          duration: parsedDuration,
          status: 'ACTIVE',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          station: true,
        },
      });

      // If it's starting right now (within 5 minutes), update station status
      const now = new Date();
      if (Math.abs(targetStartTime.getTime() - now.getTime()) < 5 * 60000) {
        await tx.station.update({
          where: { id: stationId },
          data: { status: 'OCCUPIED' },
        });
      }

      return booking;
    });

    getIO().emit('booking-created', result);
    getIO().emit('station-updated', { id: stationId });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to create booking' });
  }
};

export const endBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: req.params.id as string },
        include: { station: true },
      });

      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'ACTIVE') throw new Error('Booking is not active');

      const endTime = new Date();
      const durationMinutes = Math.ceil((endTime.getTime() - booking.startTime.getTime()) / 60000);
      const totalAmount = parseFloat(((durationMinutes / 60) * booking.station.hourlyRate).toFixed(2));

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { endTime, duration: durationMinutes, totalAmount, status: 'COMPLETED' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          station: true,
          payment: true,
        },
      });

      await tx.station.update({ where: { id: booking.stationId }, data: { status: 'AVAILABLE' } });
      
      const earnedPoints = Math.floor(totalAmount / 10);
      if (earnedPoints > 0) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 6);

        await tx.user.update({
          where: { id: booking.userId },
          data: { 
            loyaltyPoints: { increment: earnedPoints },
            totalSpent: { increment: totalAmount }
          },
        });

        await tx.loyaltyTransaction.create({
          data: {
            userId: booking.userId,
            points: earnedPoints,
            type: 'EARN',
            notes: 'Points earned from booking session',
            expiresAt,
          }
        });
      }

      return updated;
    });

    getIO().emit('booking-ended', result);
    getIO().emit('station-updated', { id: result.stationId, status: 'AVAILABLE' });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to end booking' });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: req.params.id as string } });
      if (!booking || booking.status !== 'ACTIVE') throw new Error('Cannot cancel this booking');

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' }
      });

      await tx.station.update({ where: { id: booking.stationId }, data: { status: 'AVAILABLE' } });
      
      return updated;
    });

    getIO().emit('booking-cancelled', { id: result.id, stationId: result.stationId });
    getIO().emit('station-updated', { id: result.stationId, status: 'AVAILABLE' });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to cancel booking' });
  }
};

export const extendBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { addMinutes } = req.body as { addMinutes: number };
    if (!addMinutes || addMinutes <= 0) {
      res.status(400).json({ message: 'addMinutes is required and must be positive' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: req.params.id as string } });
      if (!booking || booking.status !== 'ACTIVE') throw new Error('Cannot extend a non-active booking');

      let newDuration = null;
      let newEndTime = null;

      if (booking.endTime && booking.duration) {
        newDuration = booking.duration + addMinutes;
        newEndTime = new Date(booking.endTime.getTime() + addMinutes * 60000);

        // Check conflicts again for the new extended time
        const conflicts = await tx.booking.findMany({
          where: {
            stationId: booking.stationId,
            status: 'ACTIVE',
            id: { not: booking.id }
          },
        });

        for (const existing of conflicts) {
          if (!existing.endTime) {
             throw new Error('Station currently has an open-ended active session blocking extension');
          } else {
             if (existing.startTime < newEndTime && existing.endTime > booking.endTime) {
               throw new Error('Cannot extend due to a conflicting upcoming booking');
             }
          }
        }
      } else {
        // If it was open ended, we just set the end time? Or just ignore extending an open ended one?
        throw new Error('Cannot extend an open-ended booking. Edit it directly or end it.');
      }

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          duration: newDuration,
          endTime: newEndTime,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          station: true,
        }
      });

      return updated;
    });

    getIO().emit('booking-extended', result);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to extend booking' });
  }
};
