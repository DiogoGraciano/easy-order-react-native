import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DatePicker } from '../../components/ui/DatePicker';
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Customer, Enterprise, Order, OrderItem, Product, formatPrice } from '../../types/models';

// Schema de validação
const orderSchema = yup.object().shape({
  orderDate: yup
    .date()
    .required('Data do pedido é obrigatória')
    .max(new Date(), 'Data do pedido não pode ser no futuro'),
  customerId: yup
    .string()
    .required('Cliente é obrigatório'),
  enterpriseId: yup
    .string()
    .required('Empresa é obrigatória'),
  status: yup
    .string()
    .required('Status é obrigatório')
    .oneOf(['pending', 'completed', 'cancelled'], 'Status inválido'),
  notes: yup
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres'),
});

// Tipo
type OrderFormData = {
  orderDate: Date;
  customerId: string;
  enterpriseId: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
};

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { executeWithErrorHandling } = useApiError();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<OrderFormData>({
    resolver: yupResolver(orderSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      orderDate: new Date(),
      customerId: '',
      enterpriseId: '',
      status: 'pending' as 'pending' | 'completed' | 'cancelled',
      notes: '',
    },
  });

  const watchedValues = watch();

  const loadOrder = async () => {
    if (!id) return;
    
    setLoadingData(true);
    const result = await executeWithErrorHandling(
      () => apiService.getOrderById(id),
      'Erro ao carregar pedido'
    );

    if (result) {
      // Atualizar valores do formulário
      setValue('orderDate', new Date(result.orderDate));
      setValue('customerId', result.customerId || '');
      setValue('enterpriseId', result.enterpriseId || '');
      setValue('status', result.status as 'pending' | 'completed' | 'cancelled');
      setValue('notes', result.notes || '');
      
      const formattedItems = (result.items || []).map(item => ({
        ...item,
        unitPrice: formatPrice(item.unitPrice),
        subtotal: formatPrice(item.subtotal),
      }));
      
      setOrderItems(formattedItems);
      
      // Carregar cliente se existe
      if (result.customerId) {
        const customerResult = await executeWithErrorHandling(
          () => apiService.getCustomerById(result.customerId!),
          'Erro ao carregar cliente'
        );
        if (customerResult) {
          setSelectedCustomer(customerResult);
        }
      }

      if (result.enterpriseId) {
        const enterpriseResult = await executeWithErrorHandling(
          () => apiService.getEnterpriseById(result.enterpriseId!),
          'Erro ao carregar empresa'
        );
        if (enterpriseResult) {
          setSelectedEnterprise(enterpriseResult);
        }
      }
    } else {
      router.back();
    }
    setLoadingData(false);
  };

  const loadData = async () => {
    const [customersResult, productsResult, enterprisesResult] = await Promise.all([
      executeWithErrorHandling(
        () => apiService.getCustomers(),
        'Erro ao carregar clientes'
      ),
      executeWithErrorHandling(
        () => apiService.getProducts(),
        'Erro ao carregar produtos'
      ),
      executeWithErrorHandling(
        () => apiService.getEnterprises(),
        'Erro ao carregar empresas'
      )
    ]);

    if (customersResult) setCustomers(customersResult);
    if (productsResult) setProducts(productsResult);
    if (enterprisesResult) setEnterprises(enterprisesResult);
  };

  useEffect(() => {
    loadOrder();
    loadData();
  }, [id]);

  const calculateTotal = (items: OrderItem[]) => {
    const total = items.reduce((total, item) => total + item.subtotal, 0);
    return formatPrice(total);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id!);
    setShowCustomerModal(false);
  };

  const handleSelectEnterprise = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setValue('enterpriseId', enterprise.id!);
    setShowEnterpriseModal(false);
  };

  const handleAddProduct = (product: Product, quantity: number = 1) => {
    const existingItemIndex = orderItems.findIndex(item => item.productId === product.id);
    
    const unitPrice = formatPrice(product.price);
    const subtotal = formatPrice(quantity * unitPrice);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].subtotal = 
        formatPrice(updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice);
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        productId: product.id!,
        productName: product.name,
        quantity,
        unitPrice,
        subtotal,
      };
      setOrderItems([...orderItems, newItem]);
    }
    
    setShowProductModal(false);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].subtotal = formatPrice(quantity * updatedItems[index].unitPrice);
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };

  const handleDateChange = (date: Date) => {
    setValue('orderDate', date);
  };

  const handleStatusChange = (status: 'pending' | 'completed' | 'cancelled') => {
    setValue('status', status);
  };

  const handleSave = async (data: OrderFormData) => {
    if (orderItems.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um produto ao pedido');
      return;
    }

    const totalAmount = calculateTotal(orderItems);
    
    const items = orderItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: formatPrice(item.unitPrice),
      subtotal: formatPrice(item.subtotal),
    }));

    const orderData = {
      orderDate: data.orderDate.toISOString(),
      customerId: data.customerId,
      enterpriseId: data.enterpriseId,
      totalAmount: formatPrice(totalAmount),
      notes: data.notes || undefined,
      items: items,
    };

    setLoading(true);
    
    const result = await executeWithErrorHandling(
      () => apiService.saveOrder({ ...orderData, id } as Order),
      'Erro ao atualizar pedido'
    );

    if (result) {
      Alert.alert('Sucesso', 'Pedido atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const result = await executeWithErrorHandling(
              () => apiService.deleteOrder({ id } as Order),
              'Erro ao excluir pedido'
            );

            if (result !== null) {
              Alert.alert('Sucesso', 'Pedido excluído com sucesso!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return cnpj;
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
      case 'completed': return 'Confirmado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const statusOptions = ['pending', 'completed', 'cancelled'];

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando pedido...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Pedido</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#ff6384" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSubmit(handleSave as any)}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Card style={styles.formCard}>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.inputGroup}>
                <Controller
                  control={control}
                  name="orderDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      value={value}
                      onChange={onChange}
                      label="Data do Pedido"
                      placeholder="Selecionar data do pedido"
                    />
                  )}
                />
                {errors.orderDate && (
                  <Text style={styles.errorText}>{errors.orderDate.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cliente *</Text>
                <TouchableOpacity
                  style={[styles.customerButton, errors.customerId && styles.inputError]}
                  onPress={() => setShowCustomerModal(true)}
                >
                  {selectedCustomer ? (
                    <View style={styles.selectedCustomer}>
                      <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                      <Text style={styles.customerEmail}>{selectedCustomer.email}</Text>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>Selecionar cliente</Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.customerId && (
                  <Text style={styles.errorText}>{errors.customerId.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Empresa *</Text>
                <TouchableOpacity
                  style={[styles.enterpriseButton, errors.enterpriseId && styles.inputError]}
                  onPress={() => setShowEnterpriseModal(true)}
                >
                  {selectedEnterprise ? (
                    <View style={styles.selectedEnterprise}>
                      <Text style={styles.enterpriseName}>{selectedEnterprise.tradeName}</Text>
                      <Text style={styles.enterpriseDetail}>
                        CNPJ: {formatCNPJ(selectedEnterprise.cnpj)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>Selecionar empresa</Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.enterpriseId && (
                  <Text style={styles.errorText}>{errors.enterpriseId.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Status</Text>
                <Controller
                  control={control}
                  name="status"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.statusContainer}>
                      {statusOptions.map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            value === status && styles.statusOptionSelected,
                            { backgroundColor: value === status ? getStatusColor(status) : '#f0f0f0' }
                          ]}
                          onPress={() => onChange(status as 'pending' | 'completed' | 'cancelled')}
                        >
                          <Text style={[
                            styles.statusOptionText,
                            value === status && styles.statusOptionTextSelected
                          ]}>
                            {getStatusText(status)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
                {errors.status && (
                  <Text style={styles.errorText}>{errors.status.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações</Text>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, styles.textArea, errors.notes && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Observações sobre o pedido"
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                    />
                  )}
                />
                {errors.notes && (
                  <Text style={styles.errorText}>{errors.notes.message}</Text>
                )}
              </View>
            </CardContent>
          </Card>

          <Card style={styles.formCard}>
            <CardHeader>
              <View style={styles.cardHeaderWithButton}>
                <CardTitle>Itens do Pedido</CardTitle>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => setShowProductModal(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addItemText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </CardHeader>
            <CardContent>
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemPrice}>
                        {formatCurrency(item.unitPrice)} cada
                      </Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleUpdateQuantity(index, item.quantity - 1)}
                      >
                        <Ionicons name="remove" size={16} color="#666" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleUpdateQuantity(index, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.itemTotalContainer}>
                      <Text style={styles.itemTotal}>
                        {formatCurrency(item.subtotal)}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveItem(index)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ff6384" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Nenhum item adicionado</Text>
                </View>
              )}
            </CardContent>
          </Card>

          {orderItems.length > 0 && (
            <Card style={styles.totalCard}>
              <CardContent>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total do Pedido:</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(calculateTotal(orderItems))}
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}
        </ScrollView>

        <Modal
          visible={showCustomerModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.customerItem}
                  onPress={() => handleSelectCustomer(item)}
                >
                  <Text style={styles.customerItemName}>{item.name}</Text>
                  <Text style={styles.customerItemEmail}>{item.email}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showEnterpriseModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Empresa</Text>
              <TouchableOpacity onPress={() => setShowEnterpriseModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={enterprises}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.enterpriseItem}
                  onPress={() => handleSelectEnterprise(item)}
                >
                  <View style={styles.enterpriseItemInfo}>
                    <Text style={styles.enterpriseItemName}>{item.tradeName}</Text>
                    <Text style={styles.enterpriseItemDetail}>{item.legalName}</Text>
                    <Text style={styles.enterpriseItemCnpj}>
                      CNPJ: {formatCNPJ(item.cnpj)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="business-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Nenhuma empresa encontrada</Text>
                </View>
              }
            />
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showProductModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Produto</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => handleAddProduct(item)}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productDescription}>{item.description}</Text>
                    <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                  <Text style={styles.productStock}>Estoque: {item.stock}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formCard: {
    marginBottom: 20,
  },
  totalCard: {
    marginBottom: 50,
    backgroundColor: '#f8f9fa',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  customerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCustomer: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  statusOptionSelected: {
    backgroundColor: '#007AFF',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusOptionTextSelected: {
    color: '#fff',
  },
  cardHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addItemButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemTotalContainer: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  removeButton: {
    marginTop: 4,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  customerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerItemEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  enterpriseButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedEnterprise: {
    flex: 1,
  },
  enterpriseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  enterpriseDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  enterpriseItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enterpriseItemInfo: {
    flex: 1,
  },
  enterpriseItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  enterpriseItemDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  enterpriseItemCnpj: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
  },
  productItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#999',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
}); 