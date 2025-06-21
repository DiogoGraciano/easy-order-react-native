import { useState, useEffect } from 'react';
import { Order } from '../types/models';
import { apiService } from '../services/apiService';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getOrderById = async (id: string): Promise<Order | null> => {
    try {
      return await apiService.getOrderById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedido');
      return null;
    }
  };

  const saveOrder = async (order: Order): Promise<boolean> => {
    try {
      const savedOrder = await apiService.saveOrder(order);
      if (order.id) {
        // Update existing order
        setOrders(prev => prev.map(o => o.id === order.id ? savedOrder : o));
      } else {
        // Add new order
        setOrders(prev => [...prev, savedOrder]);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pedido');
      return false;
    }
  };

  const deleteOrder = async (order: Order): Promise<boolean> => {
    try {
      await apiService.deleteOrder(order);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir pedido');
      return false;
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    loadOrders,
    getOrderById,
    saveOrder,
    deleteOrder,
  };
}; 