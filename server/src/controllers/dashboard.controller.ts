import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── Stats: KPIs ──────────────────────────────────────────────────────────────
export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      newCustomersThisMonth,
      activeBookings,
      todayRevenue,
      totalRevenue,
      stations,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER', isActive: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.station.findMany({
        where: { isActive: true },
        select: { id: true, name: true, type: true, status: true, hourlyRate: true },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          station: { select: { id: true, name: true, type: true, hourlyRate: true } },
          payment: true,
        },
      }),
    ]);

    const availableStations = stations.filter(s => s.status === 'AVAILABLE').length;
    const occupiedStations = stations.filter(s => s.status === 'OCCUPIED').length;
    const maintenanceStations = stations.filter(s => s.status === 'MAINTENANCE').length;

    res.json({
      totalCustomers,
      newCustomersThisMonth,
      activeBookings,
      todayRevenue: todayRevenue._sum.amount || 0,
      totalRevenue: totalRevenue._sum.amount || 0,
      availableStations,
      occupiedStations,
      maintenanceStations,
      totalStations: stations.length,
      stations,
      recentBookings,
    });
  } catch (err) {
    console.error('[getDashboardStats]', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// ─── Revenue Chart (last N days) ─────────────────────────────────────────────
export const getRevenueChart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [revenue, bookings] = await Promise.all([
        prisma.payment.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: date, lt: nextDate } },
          _sum: { amount: true },
        }),
        prisma.booking.count({ where: { createdAt: { gte: date, lt: nextDate } } }),
      ]);

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round((revenue._sum.amount || 0) * 100) / 100,
        bookings,
      });
    }

    res.json(data);
  } catch (err) {
    console.error('[getRevenueChart]', err);
    res.status(500).json({ message: 'Failed to fetch revenue chart' });
  }
};

// ─── Station Usage: top 5 by booking count ───────────────────────────────────
export const getStationUsage = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { bookings: true } },
      },
      orderBy: { bookings: { _count: 'desc' } },
    });

    res.json(
      stations.map((s) => ({
        name: s.name,
        type: s.type,
        status: s.status,
        hourlyRate: s.hourlyRate,
        totalBookings: s._count.bookings,
      }))
    );
  } catch (err) {
    console.error('[getStationUsage]', err);
    res.status(500).json({ message: 'Failed to fetch station usage' });
  }
};

// ─── Heatmap: bookings per hour × day of week ────────────────────────────────
export const getHeatmap = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: last30Days }, status: { not: 'CANCELLED' } },
      select: { startTime: true },
    });

    // Build a day×hour matrix (0=Sun..6=Sat, hours 0..23)
    const matrix: Record<string, number> = {};
    for (const b of bookings) {
      const d = new Date(b.startTime);
      const day = d.getDay();   // 0=Sun, 6=Sat
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      matrix[key] = (matrix[key] || 0) + 1;
    }

    // Flatten to array format for frontend consumption
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        result.push({
          day: days[day],
          dayIndex: day,
          hour,
          count: matrix[`${day}-${hour}`] || 0,
        });
      }
    }

    // Compute max for normalization
    const maxCount = Math.max(...result.map(r => r.count), 1);
    res.json({ cells: result, maxCount });
  } catch (err) {
    console.error('[getHeatmap]', err);
    res.status(500).json({ message: 'Failed to fetch heatmap data' });
  }
};
