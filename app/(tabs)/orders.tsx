import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrders } from '../../hooks/useOrders';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export default function OrdersScreen() {
  const { orders, loading, error, loadOrders, deleteOrder } = useOrders();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#ffce56';
      case 'completed': return '#36a2eb';
      case 'cancelled': return '#ff6384';
      default: return '#666';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'completed': return 'Completo';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleOrderPress = (orderId: number) => {
    router.push(`/orders/${orderId}` as any);
  };

  const handleDeleteOrder = (order: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o pedido #${order.orderNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteOrder(order);
            if (success) {
              Alert.alert('Sucesso', 'Pedido excluído com sucesso!');
            }
          },
        },
      ]
    );
  };

  const handleNewOrder = () => {
    router.push('/orders/new' as any);
  };

  if (error) {
    Alert.alert('Erro', error);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewOrder}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadOrders} />
        }
      >
        {orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <TouchableOpacity onPress={() => handleOrderPress(order.id!)}>
                <CardHeader>
                  <View style={styles.orderHeader}>
                    <CardTitle>Pedido #{order.orderNumber}</CardTitle>
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
                  </View>
                </CardHeader>
                <CardContent>
                  <View style={styles.orderDetails}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderDate}>
                        Data: {formatDate(order.orderDate)}
                      </Text>
                      <Text style={styles.orderAmount}>
                        Valor: {formatCurrency(order.totalAmount)}
                      </Text>
                      <Text style={styles.orderItems}>
                        Itens: {order.items?.length || 0}
                      </Text>
                      {order.notes && (
                        <Text style={styles.orderNotes}>
                          Obs: {order.notes}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteOrder(order)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff6384" />
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </TouchableOpacity>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleNewOrder}>
              <Text style={styles.emptyButtonText}>Criar Primeiro Pedido</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  orderCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 