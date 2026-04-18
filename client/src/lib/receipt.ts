import jsPDF from 'jspdf';
import { Booking } from '../types';
import { formatCurrency, formatDuration, formatDateTime } from './utils';

export const generateThermalReceipt = (booking: Booking) => {
  // Thermal receipt dimensions (typically 80mm width = ~3.15 inches)
  // Let's create an 80mm wide slip with dynamic height.
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150], // Start small, can add logic for dynamic depending on items
  });

  let y = 10;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GAMEZONE', 40, y, { align: 'center' });
  
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PREMIUM ESPORTS ARENA', 40, y, { align: 'center' });

  y += 6;
  doc.setFontSize(8);
  doc.text('Receipt for Session', 40, y, { align: 'center' });

  y += 4;
  doc.setLineWidth(0.2);
  doc.line(5, y, 75, y); // Divider

  // Details
  y += 6;
  doc.text(`Booking ID: ${booking.id.slice(-8).toUpperCase()}`, 5, y);
  y += 5;
  doc.text(`Date: ${formatDateTime(booking.createdAt)}`, 5, y);
  y += 5;
  doc.text(`Customer: ${booking.user?.name || 'Guest'}`, 5, y);
  y += 5;
  doc.text(`Station: ${booking.station?.name || 'N/A'}`, 5, y);

  y += 4;
  doc.line(5, y, 75, y); // Divider

  // Charges
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 5, y);
  doc.text('AMOUNT', 75, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  y += 6;
  doc.text('Session Duration', 5, y);
  y += 4;
  doc.setFontSize(7);
  doc.text(`${formatDuration(booking.duration || 0)} @ ${formatCurrency(booking.station?.hourlyRate || 0)}/hr`, 5, y);
  
  doc.setFontSize(8);
  doc.text(`${formatCurrency(booking.totalAmount || 0)}`, 75, y, { align: 'right' });

  y += 6;
  doc.line(5, y, 75, y); // Divider

  // Totals
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 5, y);
  doc.setFontSize(10);
  doc.text(`${formatCurrency(booking.totalAmount || 0)}`, 75, y, { align: 'right' });

  // Loyalty points
  y += 6;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  const pointsEarned = Math.floor((booking.totalAmount || 0) / 10);
  doc.text(`Points Earned this session: +${pointsEarned}`, 40, y, { align: 'center' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for playing!', 40, y, { align: 'center' });
  y += 4;
  doc.text('www.gamezone.gg', 40, y, { align: 'center' });

  // Open PDF in a new tab + trigger print
  doc.autoPrint();
  const blobURL = doc.output('bloburl');
  window.open(blobURL);
};
