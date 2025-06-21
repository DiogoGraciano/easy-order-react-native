import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { apiService } from '../../services/apiService';
import { Customer, Order, OrderItem, Product } from '../../types/models';

export default function NewOrderScreen() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [notes, setNotes] = useState('');

  const [formData, setFormData] = useState<Partial<Order>>({
    orderDate: new Date().toISOString(),
    status: 'PENDING',
    totalAmount: 0,
    customerId: '',
    enterpriseId: '', // Será definido conforme a empresa selecionada
    items: [],
    notes: '',
  });

  const loadData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts(),
      ]);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar dados');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id!,
    }));
    setShowCustomerModal(false);
  };

  const handleAddProduct = (product: Product, quantity: number = 1) => {
    const existingItemIndex = orderItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Se o produto já existe, aumenta a quantidade
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].subtotal = 
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setOrderItems(updatedItems);
    } else {
      // Se é um novo produto, adiciona à lista
      const newItem: OrderItem = {
        productId: product.id!,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: quantity * product.price,
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
    updatedItems[index].subtotal = quantity * updatedItems[index].unitPrice;
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
  };

  const validateForm = (): boolean => {
    if (!selectedCustomer) {
      Alert.alert('Erro', 'Selecione um cliente');
      return false;
    }
    if (orderItems.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um produto ao pedido');
      return false;
    }
    if (!formData.enterpriseId?.trim()) {
      Alert.alert('Erro', 'Enterprise ID é obrigatório (será implementado seletor de empresa)');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const totalAmount = calculateTotal(orderItems);
    const orderData: Order = {
      ...formData,
      totalAmount,
      items: orderItems,
      notes,
    } as Order;

    setLoading(true);
    try {
      await apiService.saveOrder(orderData);
      Alert.alert('Sucesso', 'Pedido cadastrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao cadastrar pedido');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Pedido</Text>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Informações do Pedido */}
          <Card style={styles.formCard}>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Data do Pedido */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data do Pedido</Text>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateText}>
                    {formatDate(new Date(formData.orderDate as string))}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </View>
              </View>

              {/* Cliente */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cliente *</Text>
                <TouchableOpacity
                  style={styles.customerButton}
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
              </View>

              {/* Enterprise ID temporário */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID da Empresa *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.enterpriseId}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, enterpriseId: text }))}
                  placeholder="Digite o ID da empresa"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Observações */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observações</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Observações sobre o pedido"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </CardContent>
          </Card>

          {/* Itens do Pedido */}
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

          {/* Total do Pedido */}
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

        {/* Modal de Seleção de Cliente */}
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

        {/* Modal de Seleção de Produto */}
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
    marginBottom: 20,
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
  dateDisplay: {
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
  dateText: {
    fontSize: 16,
    color: '#333',
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
});