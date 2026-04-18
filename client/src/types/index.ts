export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  loyaltyPoints: number;
  totalSpent: number;
  staffNotes?: string;
  tier?: string;
  isActive: boolean;
  createdAt: string;
  bookings?: Booking[];
  payments?: Payment[];
  loyaltyTransactions?: LoyaltyTransaction[];
  _count?: {
    bookings: number;
  };
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  notes?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Station {
  id: string;
  name: string;
  type: 'PC' | 'CONSOLE' | 'VR' | 'SIMULATOR';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  hourlyRate: number;
  specs?: Record<string, string | number>;
  imageUrl?: string;
  isActive?: boolean;
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  userId: string;
  stationId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalAmount?: number;
  notes?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  station?: Pick<Station, 'id' | 'name' | 'type' | 'hourlyRate'>;
  payment?: Payment;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'UPI' | 'WALLET';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  reference?: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  booking?: Booking;
}

export interface Game {
  id: string;
  name: string;
  genre: string;
  platform: string;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  rating?: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  description?: string;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  status: 'PENDING' | 'FULFILLED' | 'REJECTED';
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  reward?: Reward;
}

export interface DashboardStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeBookings: number;
  todayRevenue: number;
  totalRevenue: number;
  availableStations: number;
  occupiedStations: number;
  maintenanceStations: number;
  totalStations: number;
  stations: Pick<Station, 'id' | 'name' | 'type' | 'status' | 'hourlyRate'>[];
  recentBookings: Booking[];
}

export interface StationUsage {
  name: string;
  type: string;
  status: string;
  hourlyRate: number;
  totalBookings: number;
}

export interface HeatmapCell {
  day: string;
  dayIndex: number;
  hour: number;
  count: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
