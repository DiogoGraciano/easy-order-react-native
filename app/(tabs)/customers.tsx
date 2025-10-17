import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Customer } from '../../types/models';

export default function CustomersScreen() {
  const { executeWithErrorHandling, executeDeleteWithListUpdate } = useApiError();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    const result = await executeWithErrorHandling(
      () => apiService.getCustomers(),
      'Erro ao carregar clientes'
    );

    if (result) {
      setCustomers(result);
    }
    
    setLoading(false);
  };

  // Recarrega a lista sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  const handleDeleteCustomer = (customer: Customer) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o cliente ${customer.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await executeDeleteWithListUpdate(
              () => apiService.deleteCustomer(customer),
              customer,
              setCustomers,
              (item) => item.id!,
              'Erro ao excluir cliente'
            );

            if (success) {
              await loadCustomers();
              Alert.alert('Sucesso', 'Cliente excluído com sucesso!');
            }
          },
        },
      ]
    );
  };

  const handleCustomerPress = (customerId: string) => {
    router.push(`/customers/${customerId}` as any);
  };

  const handleNewCustomer = () => {
    router.push('/customers/new' as any);
  };

  const formatPhone = (phone: string) => {
    // Format phone number (11) 99999-9999
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatCPF = (cpf: string) => {
    // Format CPF 999.999.999-99
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
    return cpf;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewCustomer}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCustomers} />
        }
      >
        {customers.length > 0 ? (
          customers.map((customer) => (
            <Card key={customer.id} style={styles.customerCard}>
              <TouchableOpacity onPress={() => handleCustomerPress(customer.id!)}>
                <CardHeader>
                  <View style={styles.customerHeader}>
                    <View style={styles.customerInfo}>
                      {customer.photo ? (
                        <Image source={{ uri: customer.photo }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person" size={24} color="#666" />
                        </View>
                      )}
                      <View style={styles.customerDetails}>
                        <CardTitle>{customer.name}</CardTitle>
                        <Text style={styles.customerEmail}>{customer.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteCustomer(customer)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff6384" />
                    </TouchableOpacity>
                  </View>
                </CardHeader>
                <CardContent>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactItem}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.contactText}>{formatPhone(customer.phone)}</Text>
                    </View>
                    <View style={styles.contactItem}>
                      <Ionicons name="card-outline" size={16} color="#666" />
                      <Text style={styles.contactText}>{formatCPF(customer.cpf)}</Text>
                    </View>
                    <View style={styles.contactItem}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.contactText} numberOfLines={2}>
                        {customer.address}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </TouchableOpacity>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleNewCustomer}>
              <Text style={styles.emptyButtonText}>Cadastrar Primeiro Cliente</Text>
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
    backgroundColor: '#34C759',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  customerCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
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
    backgroundColor: '#34C759',
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