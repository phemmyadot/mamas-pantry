import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getById(orderId),
    enabled: !!orderId,
  });
}

interface UseMarkDeliveredOptions {
  onSuccess?: () => void;
  onError?: (detail: string) => void;
}

export function useMarkDelivered(orderId: string, options?: UseMarkDeliveredOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ordersService.markDelivered(orderId),
    onSuccess: () => {
      // Only invalidate the list — don't refetch the detail since the order
      // will no longer appear in /riders/me/orders after delivery.
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      options?.onSuccess?.();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? 'Could not mark order as delivered.';
      options?.onError?.(detail);
    },
  });
}
