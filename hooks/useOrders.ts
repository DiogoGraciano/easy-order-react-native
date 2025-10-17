import { useCallback, useState } from 'react';
import { apiService } from '../services/apiService';
import { Order } from '../types/models';
import { useApiError } from './useApiError';

export const useOrders = () => {
  const { executeWithErrorHandling } = useApiError();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await executeWithErrorHandling(
      () => apiService.getOrders(),
      'Erro ao carregar pedidos'
    );

    if (result) {
      setOrders(result);
    }
    
    setLoading(false);
  }, []);

  const getOrderById = async (id: string): Promise<Order | null> => {
    const result = await executeWithErrorHandling(
      () => apiService.getOrderById(id),
      'Erro ao carregar pedido'
    );

    return result || null;
  };

  const saveOrder = async (order: Order): Promise<boolean> => {
    const result = await executeWithErrorHandling(
      () => apiService.saveOrder(order),
      'Erro ao salvar pedido'
    );

    if (result) {
      if (order.id) {
        // Update existing order
        setOrders(prev => prev.map(o => o.id === order.id ? result : o));
      } else {
        // Add new order
        setOrders(prev => [...prev, result]);
      }
      return true;
    }
    
    return false;
  };

  const deleteOrder = async (order: Order): Promise<boolean> => {
    const result = await executeWithErrorHandling(
      () => apiService.deleteOrder(order),
      'Erro ao excluir pedido'
    );

    if (result !== null) {
      // Remove o pedido da lista local imediatamente
      setOrders(prev => prev.filter(o => o.id !== order.id));
      // Recarrega a lista para garantir consistência com o servidor
      await loadOrders();
      return true;
    }
    
    return false;
  };

  // Função para remover um pedido da lista local (para uso direto nas telas)
  const removeOrderFromList = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  return {
    orders,
    loading,
    error,
    loadOrders,
    getOrderById,
    saveOrder,
    deleteOrder,
    removeOrderFromList,
  };
}; 