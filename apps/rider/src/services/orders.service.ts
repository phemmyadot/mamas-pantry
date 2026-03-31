import { api } from '@/lib/api';
import { Order } from '@/types';

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/riders/me/orders');
    return data;
  },

  getById: async (orderId: string): Promise<Order> => {
    const { data } = await api.get<Order[]>('/riders/me/orders');
    const order = data.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return order;
  },

  markDelivered: async (orderId: string): Promise<Order> => {
    const { data } = await api.patch<Order>(`/riders/me/orders/${orderId}/delivered`);
    return data;
  },
};
