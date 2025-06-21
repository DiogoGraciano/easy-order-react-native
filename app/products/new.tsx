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
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Enterprise, Product } from '../../types/models';

export default function NewProductScreen() {
  const { executeWithErrorHandling } = useApiError();
  const [loading, setLoading] = useState(false);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    enterpriseId: '',
  });

  const loadEnterprises = async () => {
    const result = await executeWithErrorHandling(
      () => apiService.getEnterprises(),
      'Erro ao carregar empresas'
    );

    if (result) {
      setEnterprises(result);
    }
  };

  useEffect(() => {
    loadEnterprises();
  }, []);

  const handleInputChange = (field: keyof Product, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectEnterprise = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setFormData(prev => ({
      ...prev,
      enterpriseId: enterprise.id!,
    }));
    setShowEnterpriseModal(false);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toFixed(2);
    return formattedValue;
  };

  const handlePriceChange = (text: string) => {
    const formatted = formatCurrency(text);
    handleInputChange('price', parseFloat(formatted));
  };

  const handleStockChange = (text: string) => {
    const numericValue = text.replace(/\D/g, '');
    handleInputChange('stock', parseInt(numericValue) || 0);
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      Alert.alert('Erro', 'Nome do produto é obrigatório');
      return false;
    }
    if (!formData.description?.trim()) {
      Alert.alert('Erro', 'Descrição é obrigatória');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      Alert.alert('Erro', 'Preço deve ser maior que zero');
      return false;
    }
    if (formData.stock === undefined || formData.stock < 0) {
      Alert.alert('Erro', 'Estoque deve ser um número válido');
      return false;
    }
    if (!selectedEnterprise) {
      Alert.alert('Erro', 'Selecione uma empresa');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    const result = await executeWithErrorHandling(
      () => apiService.saveProduct(formData as Product),
      'Erro ao cadastrar produto'
    );

    if (result) {
      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    router.back();
  };

  const formatDisplayPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return cnpj;
  };

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
          <Text style={styles.headerTitle}>Novo Produto</Text>
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
          <Card style={styles.formCard}>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Digite o nome do produto"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  placeholder="Digite a descrição do produto"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Empresa *</Text>
                <TouchableOpacity
                  style={styles.enterpriseButton}
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
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preço *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price ? formatDisplayPrice(formData.price) : ''}
                  onChangeText={handlePriceChange}
                  placeholder="R$ 0,00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estoque *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stock?.toString() || ''}
                  onChangeText={handleStockChange}
                  placeholder="Quantidade em estoque"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>


            </CardContent>
          </Card>

          <Card style={styles.previewCard}>
            <CardHeader>
              <CardTitle>Prévia do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.previewContent}>
                <View style={styles.previewImagePlaceholder}>
                  <Ionicons name="cube-outline" size={32} color="#666" />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>
                    {formData.name || 'Nome do produto'}
                  </Text>
                  <Text style={styles.previewDescription}>
                    {formData.description || 'Descrição do produto'}
                  </Text>
                  <Text style={styles.previewEnterprise}>
                    🏢 {selectedEnterprise?.tradeName || 'Empresa não selecionada'}
                  </Text>
                  <Text style={styles.previewPrice}>
                    {formData.price ? formatDisplayPrice(formData.price) : 'R$ 0,00'}
                  </Text>
                  <Text style={styles.previewStock}>
                    Estoque: {formData.stock || 0} unidades
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </ScrollView>

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
    backgroundColor: '#FF9500',
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
  previewCard: {
    marginBottom: 20,
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
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },

  previewContent: {
    flexDirection: 'row',
    gap: 12,
  },
  previewImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewEnterprise: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 4,
  },
  previewStock: {
    fontSize: 14,
    color: '#666',
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
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
}); 