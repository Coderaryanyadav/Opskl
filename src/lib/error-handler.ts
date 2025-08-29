import { toast } from '@/components/ui/use-toast';
import { ZodError } from 'zod';

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(error: unknown, defaultMessage: string = 'An error occurred') {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return {
      error: error.message || defaultMessage,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      error: 'Validation failed',
      status: 400,
      details: error.errors,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message || defaultMessage,
      status: 500,
    };
  }

  return {
    error: defaultMessage,
    status: 500,
  };
}

export function showErrorToast(error: unknown, defaultMessage: string = 'An error occurred') {
  const { error: message, details } = handleApiError(error, defaultMessage);
  
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
  
  return { message, details };
}
