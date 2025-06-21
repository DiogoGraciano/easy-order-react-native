import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { ChartData, Customer, DashboardMetrics, Enterprise, Order, Product } from '../types/models';

export const useDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalSales: 0,
    pendingOrders: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    labels: ['Pendente', 'Confirmado', 'Preparando', 'Pronto', 'Entregue', 'Cancelado'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: ['#ffce56', '#007AFF', '#FF9500', '#34C759', '#36a2eb', '#ff6384']
    }]
  });

  const calculateMetrics = useCallback((ordersData: Order[], customersData: Customer[], productsData: Product[]) => {
    // Basic counts
    const totalOrders = ordersData.length;
    const totalCustomers = customersData.length;
    const totalProducts = productsData.length;
    
    // Total sales amount
    const totalSales = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Count by status
    const pendingCount = ordersData.filter(order => order.status === 'pending').length;
    const completedCount = ordersData.filter(order => order.status === 'completed').length;
    const cancelledCount = ordersData.filter(order => order.status === 'cancelled').length;
    
    setMetrics({
      totalOrders,
      totalCustomers,
      totalProducts,
      totalSales,
      pendingOrders: pendingCount,
    });

    // Update chart data
    setChartData({
      labels: ['Pendente', 'Completo', 'Cancelado'],
      datasets: [{
        data: [pendingCount, completedCount, cancelledCount],
        backgroundColor: ['#ffce56', '#36a2eb', '#ff6384']
      }]
    });
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, customersData, productsData, enterprisesData] = await Promise.all([
        apiService.getOrders(),
        apiService.getCustomers(),
        apiService.getProducts(),
        apiService.getEnterprises(),
      ]);

      setOrders(ordersData);
      setCustomers(customersData);
      setProducts(productsData);
      setEnterprises(enterprisesData);

      calculateMetrics(ordersData, customersData, productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [calculateMetrics]);

  const getRecentOrders = useCallback((limit: number = 5) => {
    return orders
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, limit);
  }, [orders]);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'pending': return '#ffce56';
      case 'completed': return '#36a2eb';
      case 'cancelled': return '#ff6384';
      default: return '#666';
    }
  }, []);

  const getStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'completed': return 'Completo';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    orders,
    customers,
    products,
    enterprises,
    loading,
    error,
    metrics,
    chartData,
    loadDashboardData,
    getRecentOrders,
    getStatusColor,
    getStatusText,
  };
}; 