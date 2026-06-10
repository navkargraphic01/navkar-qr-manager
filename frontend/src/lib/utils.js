import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind merge utility
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date
export const formatDate = (date, format = 'short') => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (format === 'time') {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toISOString();
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
};

// Format number with commas (Indian number system)
export const formatNumber = (n) => {
  if (n === null || n === undefined) return '0';
  return Number(n).toLocaleString('en-IN');
};

// Truncate text
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}…` : str;
};

// Generate QR URL
export const getQRUrl = (qrId) => {
  const base = import.meta.env.VITE_QR_BASE_URL || 'https://qr.navkarplywood.com';
  return `${base}/p/${qrId}`;
};

// Status color classes
export const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

// Device icons
export const deviceIcon = (type) => {
  const icons = { mobile: '📱', tablet: '📟', desktop: '🖥️', unknown: '❓' };
  return icons[type] || '❓';
};

// Download file from URL
export const downloadFile = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Download blob
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// Parse Excel columns helper
export const parseExcelHeaders = (headers) => {
  const normalized = headers.map(h => String(h).toLowerCase().trim());
  return {
    name: normalized.findIndex(h => h.includes('name') || h.includes('product')),
    code: normalized.findIndex(h => h.includes('code') || h.includes('sku')),
    url: normalized.findIndex(h => h.includes('url') || h.includes('link') || h.includes('destination'))
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};

// Validate URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// QR ID color (consistent per ID)
export const getQRIdColor = (qrId) => {
  const colors = [
    '#C62828', '#1565C0', '#2E7D32', '#6A1B9A',
    '#E65100', '#00695C', '#AD1457', '#0277BD'
  ];
  if (!qrId) return colors[0];
  const index = qrId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[index];
};
