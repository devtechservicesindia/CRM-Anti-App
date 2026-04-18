import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getStationTypeIcon(type: string): string {
  switch (type) {
    case 'PC': return '🖥️';
    case 'CONSOLE': return '🎮';
    case 'VR': return '🥽';
    case 'SIMULATOR': return '🏎️';
    default: return '🎮';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'AVAILABLE': return 'status-available';
    case 'OCCUPIED': return 'status-occupied';
    case 'MAINTENANCE': return 'status-maintenance';
    case 'ACTIVE': return 'status-occupied';
    case 'COMPLETED': return 'status-available';
    case 'CANCELLED': return 'status-maintenance';
    default: return '';
  }
}
