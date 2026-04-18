import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { StationType, StationStatus, Prisma } from '@prisma/client';
import { getIO } from '../lib/socket';

export const getStations = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      include: {
        bookings: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(stations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stations', error: String(err) });
  }
};

export const createStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, hourlyRate, specs, imageUrl } = req.body as {
      name: string; type: string; hourlyRate: string | number; specs?: Record<string, unknown>; imageUrl?: string;
    };

    const station = await prisma.station.create({
      data: {
        name,
        type: type as StationType,
        hourlyRate: parseFloat(String(hourlyRate)),
        specs: specs as Prisma.InputJsonValue,
        imageUrl,
      },
    });
    getIO().emit('station-created', station);
    res.status(201).json(station);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create station', error: String(err) });
  }
};

export const updateStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, type, status, hourlyRate, specs, imageUrl } = req.body as {
      name?: string; type?: string; status?: string; hourlyRate?: string | number;
      specs?: Record<string, unknown>; imageUrl?: string;
    };

    const station = await prisma.station.update({
      where: { id },
      data: {
        ...(name    && { name }),
        ...(type    && { type: type as StationType }),
        ...(status  && { status: status as StationStatus }),
        ...(hourlyRate !== undefined && { hourlyRate: parseFloat(String(hourlyRate)) }),
        ...(specs   !== undefined   && { specs: specs as Prisma.InputJsonValue }),
        ...(imageUrl !== undefined  && { imageUrl }),
      },
    });
    getIO().emit('station-updated', station);
    res.json(station);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update station', error: String(err) });
  }
};

export const deleteStation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.station.update({ where: { id: req.params.id as string }, data: { isActive: false } });
    getIO().emit('station-deleted', { id: req.params.id });
    res.json({ message: 'Station removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete station', error: String(err) });
  }
};
