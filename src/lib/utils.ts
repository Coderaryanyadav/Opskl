import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function getFileUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `/uploads/${path}`;
}

export function formatPhoneNumber(phoneNumber: string) {
  // Remove all non-digit characters
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  
  // Check if the number has 10 digits
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `+91 ${match[1]}-${match[2]}-${match[3]}`;
  }
  
  // If it doesn't match the expected format, return the original
  return phoneNumber;
}

export function getWhatsAppLink(phoneNumber: string, message = '') {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  const text = encodeURIComponent(message);
  return `https://wa.me/91${cleaned}?text=${text}`;
}

export function getJobPayDisplay(amount: number, payType: string) {
  switch (payType) {
    case 'HOUR':
      return `${formatCurrency(amount)}/hr`;
    case 'DAY':
      return `${formatCurrency(amount)}/day`;
    case 'WEEK':
      return `${formatCurrency(amount)}/week`;
    case 'MONTH':
      return `${formatCurrency(amount)}/month`;
    case 'PROJECT':
      return `${formatCurrency(amount)} total`;
    default:
      return formatCurrency(amount);
  }
}

export function getJobCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'Event Management': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Hospitality': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Photography': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Catering': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Security': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Cleaning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Technical Support': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'Customer Service': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };
  
  return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}
