import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Prisma 7: use pg adapter
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gaming_crm').replace(/%40/g, '@'),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash('admin123', 12);
  const staffPw = await bcrypt.hash('staff123', 12);
  const custPw  = await bcrypt.hash('customer123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gameparlour.com' },
    update: {},
    create: { email: 'admin@gameparlour.com', name: 'Admin User',   password: adminPw, role: 'ADMIN', phone: '+91-9876543210' },
  });

  await prisma.user.upsert({
    where: { email: 'staff@gameparlour.com' },
    update: {},
    create: { email: 'staff@gameparlour.com', name: 'Rahul Staff',  password: staffPw, role: 'STAFF', phone: '+91-9876543211' },
  });

  const customers = await Promise.all([
    prisma.user.upsert({ where: { email: 'arjun@example.com'  }, update: {}, create: { email: 'arjun@example.com',  name: 'Arjun Sharma', password: custPw, role: 'CUSTOMER', phone: '+91-9876543212', loyaltyPoints: 350 } }),
    prisma.user.upsert({ where: { email: 'priya@example.com'  }, update: {}, create: { email: 'priya@example.com',  name: 'Priya Patel',  password: custPw, role: 'CUSTOMER', phone: '+91-9876543213', loyaltyPoints: 120 } }),
    prisma.user.upsert({ where: { email: 'dev@example.com'    }, update: {}, create: { email: 'dev@example.com',    name: 'Dev Mehta',    password: custPw, role: 'CUSTOMER', phone: '+91-9876543214', loyaltyPoints: 750 } }),
    prisma.user.upsert({ where: { email: 'sneha@example.com'  }, update: {}, create: { email: 'sneha@example.com',  name: 'Sneha Verma',  password: custPw, role: 'CUSTOMER', loyaltyPoints: 200 } }),
    prisma.user.upsert({ where: { email: 'karan@example.com'  }, update: {}, create: { email: 'karan@example.com',  name: 'Karan Singh',  password: custPw, role: 'CUSTOMER', phone: '+91-9876543215', loyaltyPoints: 500 } }),
    prisma.user.upsert({ where: { email: 'meera@example.com'  }, update: {}, create: { email: 'meera@example.com',  name: 'Meera Joshi',  password: custPw, role: 'CUSTOMER', phone: '+91-9876543216', loyaltyPoints: 80  } }),
    prisma.user.upsert({ where: { email: 'rohan@example.com'  }, update: {}, create: { email: 'rohan@example.com',  name: 'Rohan Desai',  password: custPw, role: 'CUSTOMER', phone: '+91-9876543217', loyaltyPoints: 430 } }),
  ]);
  console.log(`✅ Created ${customers.length + 2} users`);

  // ── Stations ───────────────────────────────────────────────────────────────
  const stationDefs = [
    { id: 'station-pc-01', name: 'Alpha-1 (PC)',       type: 'PC'        as const, status: 'AVAILABLE'   as const, hourlyRate: 80,  specs: { cpu: 'Intel i9-13900K',   gpu: 'RTX 4090',  ram: '32GB DDR5', monitor: '27" 165Hz' } },
    { id: 'station-pc-02', name: 'Alpha-2 (PC)',       type: 'PC'        as const, status: 'AVAILABLE'   as const, hourlyRate: 80,  specs: { cpu: 'AMD Ryzen 9 7900X', gpu: 'RTX 4080',  ram: '32GB DDR5', monitor: '27" 165Hz' } },
    { id: 'station-pc-03', name: 'Beta-1 (PC)',        type: 'PC'        as const, status: 'OCCUPIED'    as const, hourlyRate: 60,  specs: { cpu: 'Intel i7-13700K',   gpu: 'RTX 4070',  ram: '16GB DDR4', monitor: '24" 144Hz' } },
    { id: 'station-pc-04', name: 'Beta-2 (PC)',        type: 'PC'        as const, status: 'AVAILABLE'   as const, hourlyRate: 60,  specs: { cpu: 'AMD Ryzen 7 7700X', gpu: 'RTX 4070',  ram: '16GB DDR4', monitor: '24" 144Hz' } },
    { id: 'station-con-01', name: 'Console-1 (PS5)',   type: 'CONSOLE'   as const, status: 'AVAILABLE'   as const, hourlyRate: 50,  specs: { console: 'PlayStation 5', tv: '65" 4K OLED', controllers: 2 } },
    { id: 'station-con-02', name: 'Console-2 (Xbox)',  type: 'CONSOLE'   as const, status: 'AVAILABLE'   as const, hourlyRate: 50,  specs: { console: 'Xbox Series X',  tv: '55" 4K OLED', controllers: 2 } },
    { id: 'station-vr-01',  name: 'VR Zone-1',         type: 'VR'        as const, status: 'AVAILABLE'   as const, hourlyRate: 150, specs: { headset: 'Meta Quest Pro',  controllers: 2, playArea: '3x3m' } },
    { id: 'station-vr-02',  name: 'VR Zone-2',         type: 'VR'        as const, status: 'AVAILABLE'   as const, hourlyRate: 150, specs: { headset: 'Sony PSVR2',      controllers: 2, playArea: '3x3m' } },
    { id: 'station-sim-01', name: 'Racing Sim-1',      type: 'SIMULATOR' as const, status: 'MAINTENANCE' as const, hourlyRate: 120, specs: { wheel: 'Logitech G Pro',    pedals: 'Fanatec Elite', seat: 'Racing Cockpit' } },
  ];

  const stations = await Promise.all(
    stationDefs.map((s) =>
      prisma.station.upsert({ where: { id: s.id }, update: {}, create: s })
    )
  );
  console.log(`✅ Created ${stations.length} stations`);

  // ── Games ──────────────────────────────────────────────────────────────────
  const gameDefs = [
    { id: 'game-01', name: 'Valorant',         genre: 'FPS',            platform: 'PC',              rating: 4.8 },
    { id: 'game-02', name: 'FIFA 24',          genre: 'Sports',         platform: 'PC, Console',     rating: 4.5 },
    { id: 'game-03', name: 'GTA V',            genre: 'Action',         platform: 'PC, Console',     rating: 4.9 },
    { id: 'game-04', name: 'Call of Duty MW3', genre: 'FPS',            platform: 'PC, Console',     rating: 4.6 },
    { id: 'game-05', name: 'Fortnite',         genre: 'Battle Royale',  platform: 'PC, Console',     rating: 4.4 },
    { id: 'game-06', name: 'PUBG',             genre: 'Battle Royale',  platform: 'PC',              rating: 4.3 },
    { id: 'game-07', name: 'Spider-Man 2',     genre: 'Action-Adventure', platform: 'Console',       rating: 4.9 },
    { id: 'game-08', name: 'Beat Saber',        genre: 'Rhythm',         platform: 'VR',              rating: 4.7 },
    { id: 'game-09', name: 'Forza Horizon 5',  genre: 'Racing',         platform: 'PC, Console',     rating: 4.8 },
    { id: 'game-10', name: 'Minecraft',         genre: 'Sandbox',        platform: 'PC, Console',     rating: 4.7 },
    { id: 'game-11', name: 'Apex Legends',     genre: 'Battle Royale',  platform: 'PC, Console',     rating: 4.5 },
    { id: 'game-12', name: 'Cyberpunk 2077',   genre: 'RPG',            platform: 'PC, Console',     rating: 4.6 },
  ];

  await Promise.all(
    gameDefs.map((g) =>
      prisma.game.upsert({ where: { id: g.id }, update: {}, create: g })
    )
  );
  console.log(`✅ Created ${gameDefs.length} games`);

  // ── Historical Bookings (30 days) ──────────────────────────────────────────
  const availableStationIds = ['station-pc-01', 'station-pc-02', 'station-pc-04', 'station-con-01', 'station-con-02', 'station-vr-01', 'station-vr-02'];
  const methods = ['CASH', 'CARD', 'UPI', 'WALLET'] as const;
  let bookingCount = 0;

  for (let i = 29; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const numBookings = Math.floor(Math.random() * 6) + 3;

    for (let j = 0; j < numBookings; j++) {
      const startHour = Math.floor(Math.random() * 12) + 10;
      const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, 0, 0);
      const durationMinutes = (Math.floor(Math.random() * 4) + 1) * 60;
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const stationId = availableStationIds[Math.floor(Math.random() * availableStationIds.length)];
      const station = stationDefs.find((s) => s.id === stationId)!;
      const totalAmount = parseFloat(((durationMinutes / 60) * station.hourlyRate).toFixed(2));

      const booking = await prisma.booking.create({
        data: { userId: customer.id, stationId, startTime, endTime, duration: durationMinutes, status: 'COMPLETED', totalAmount },
      });

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId: customer.id,
          amount: totalAmount,
          method: methods[Math.floor(Math.random() * methods.length)],
          status: 'COMPLETED',
          createdAt: endTime,
        },
      });

      bookingCount++;
    }
  }
  console.log(`✅ Created ${bookingCount} historical bookings with payments`);

  // ── Active Booking ─────────────────────────────────────────────────────────
  await prisma.booking.create({
    data: { userId: customers[0].id, stationId: 'station-pc-03', status: 'ACTIVE' },
  });
  console.log('✅ Created 1 active booking on Beta-1');

  console.log('\n🎮 Seed complete!');
  console.log('   Admin    → admin@gameparlour.com  / admin123');
  console.log('   Staff    → staff@gameparlour.com  / staff123');
  console.log('   Customer → arjun@example.com      / customer123');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
