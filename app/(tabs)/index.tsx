import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { useDashboard } from '../../hooks/useDashboard';

export default function DashboardScreen() {
  const {
    loading,
    error,
    metrics,
    loadDashboardData,
    getRecentOrders,
    getStatusColor,
    getStatusText,
  } = useDashboard();

  const formatCurrency = (value: number) => {
    if (typeof value === 'string' && value !== '') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(parseFloat(value));
    }
    else {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const recentOrders = getRecentOrders();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDashboardData} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bem-vindo ao Easy Order</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={loadDashboardData}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Total de Pedidos"
              value={metrics.totalOrders}
              icon="cart-outline"
              backgroundColor="#007AFF"
            />
            <MetricCard
              title="Total de Vendas"
              value={formatCurrency(metrics.totalSales)}
              icon="cash-outline"
              backgroundColor="#34C759"
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              title="Clientes"
              value={metrics.totalCustomers}
              icon="people-outline"
              backgroundColor="#FF9500"
            />
            <MetricCard
              title="Produtos"
              value={metrics.totalProducts}
              icon="cube-outline"
              backgroundColor="#8E8E93"
            />
          </View>
        </View>

        <Card style={styles.recentOrdersCard}>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardSubtitle>{metrics.pendingOrders} pedidos pendentes</CardSubtitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderItem}
                  onPress={() => handleQuickAction(`/orders/${order.id}`)}
                >
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>
                      Pedido #{order.orderNumber}
                    </Text>
                    <Text style={styles.orderDate}>
                      Data: {formatDate(order.orderDate)}
                    </Text>
                    <Text style={styles.orderAmount}>
                      Valor: {formatCurrency(order.totalAmount || 0)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => handleQuickAction('/orders')}
            >
              <Text style={styles.viewAllText}>Ver Todos os Pedidos</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Card style={styles.quickActionsCard}>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#007AFF' }]}
                onPress={() => handleQuickAction('/orders/new')}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Novo Pedido</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#34C759' }]}
                onPress={() => handleQuickAction('/customers/new')}
              >
                <Ionicons name="person-add-outline" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Novo Cliente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#FF9500' }]}
                onPress={() => handleQuickAction('/products/new')}
              >
                <Ionicons name="cube-outline" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Novo Produto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#8E8E93' }]}
                onPress={() => handleQuickAction('/enterprises/new')}
              >
                <Ionicons name="business-outline" size={24} color="#fff" />
                <Text style={styles.quickActionText}>Nova Empresa</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricsContainer: {
    paddingHorizontal: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentOrdersCard: {
    marginTop: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  viewAllButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  viewAllText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsCard: {
    marginTop: 16,
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    height: 70,
    aspectRatio: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
