import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AxiosError } from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { ordersService } from '@/services/orders.service';

export function useOrders() {
  const router = useRouter();
  const { logout } = useAuth();

  const query = useQuery({
    queryKey: ['my-orders'],
    queryFn: ordersService.getAll,
  });

  // Force sign-out if rider role is revoked mid-session
  if (query.isError) {
    const err = query.error as AxiosError;
    if (err?.response?.status === 403) {
      logout().catch(() => null);
      router.replace('/(auth)/login');
    }
  }

  return query;
}
