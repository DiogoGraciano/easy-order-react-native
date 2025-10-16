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
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Enterprise, Product } from '../../types/models';

// Schema de validação
const productEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome do produto é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: yup
    .string()
    .required('Descrição é obrigatória')
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  price: yup
    .number()
    .required('Preço é obrigatório')
    .positive('Preço deve ser maior que zero')
    .max(999999.99, 'Preço deve ser menor que R$ 999.999,99'),
  stock: yup
    .number()
    .required('Estoque é obrigatório')
    .integer('Estoque deve ser um número inteiro')
    .min(0, 'Estoque não pode ser negativo')
    .max(99999, 'Estoque deve ser menor que 100.000'),
  enterpriseId: yup
    .string()
    .required('Empresa é obrigatória'),
});

// Tipo
type ProductEditFormData = {
  name: string;
  description: string;
  price: number;
  stock: number;
  enterpriseId: string;
};

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { executeWithErrorHandling } = useApiError();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductEditFormData>({
    resolver: yupResolver(productEditSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      enterpriseId: '',
    },
  });

  const loadProduct = async () => {
    if (!id) return;
    
    setLoadingData(true);
    const result = await executeWithErrorHandling(
      () => apiService.getProductById(id),
      'Erro ao carregar produto'
    );

    if (result) {
      reset({
        name: result.name || '',
        description: result.description || '',
        price: result.price || 0,
        stock: result.stock || 0,
        enterpriseId: result.enterpriseId || '',
      });
      
      // Carregar empresa se existe
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
    loadProduct();
    loadEnterprises();
  }, [id]);

  const handleSelectEnterprise = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setValue('enterpriseId', enterprise.id!);
    setShowEnterpriseModal(false);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toFixed(2);
    return formattedValue;
  };

  const handleSave = async (data: ProductEditFormData) => {
    setLoading(true);
    
    const result = await executeWithErrorHandling(
      () => apiService.saveProduct({ ...data, id } as Product),
      'Erro ao atualizar produto'
    );

    if (result) {
      Alert.alert('Sucesso', 'Produto atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const result = await executeWithErrorHandling(
              () => apiService.deleteProduct({ id } as Product),
              'Erro ao excluir produto'
            );

            if (result !== null) {
              Alert.alert('Sucesso', 'Produto excluído com sucesso!', [
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

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando produto...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Produto</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={20} color="#ff6384" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSubmit(handleSave)}
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
              <CardTitle>Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Nome */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome *</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite o nome do produto"
                      placeholderTextColor="#999"
                    />
                  )}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                )}
              </View>

              {/* Descrição */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição *</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite a descrição do produto"
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                    />
                  )}
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description.message}</Text>
                )}
              </View>

              {/* Empresa */}
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

              {/* Preço */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preço *</Text>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.price && styles.inputError]}
                      value={value ? formatDisplayPrice(value) : ''}
                      onChangeText={(text) => {
                        const formatted = formatCurrency(text);
                        onChange(parseFloat(formatted));
                      }}
                      placeholder="R$ 0,00"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.price && (
                  <Text style={styles.errorText}>{errors.price.message}</Text>
                )}
              </View>

              {/* Estoque */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estoque *</Text>
                <Controller
                  control={control}
                  name="stock"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.stock && styles.inputError]}
                      value={value?.toString() || ''}
                      onChangeText={(text) => {
                        const numericValue = text.replace(/\D/g, '');
                        onChange(parseInt(numericValue) || 0);
                      }}
                      placeholder="Quantidade em estoque"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.stock && (
                  <Text style={styles.errorText}>{errors.stock.message}</Text>
                )}
              </View>


            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card style={styles.previewCard}>
            <CardHeader>
              <CardTitle>Prévia do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.previewContent}>
                <View style={styles.previewImagePlaceholder}>
                  <Ionicons name="cube-outline" size={32} color="#666" />
                </View>
                <Controller
                  control={control}
                  render={({ field: { value: formValues } }) => {
                    const values = formValues as unknown as ProductEditFormData;
                    return (
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewName}>
                          {values.name || 'Nome do produto'}
                        </Text>
                        <Text style={styles.previewDescription}>
                          {values.description || 'Descrição do produto'}
                        </Text>
                        <Text style={styles.previewEnterprise}>
                          🏢 {selectedEnterprise?.tradeName || 'Empresa não selecionada'}
                        </Text>
                        <Text style={styles.previewPrice}>
                          {values.price ? formatDisplayPrice(values.price) : 'R$ 0,00'}
                        </Text>
                        <Text style={styles.previewStock}>
                          Estoque: {values.stock || 0} unidades
                        </Text>
                      </View>
                    );
                  }}
                  name="name"
                />
              </View>
            </CardContent>
          </Card>
        </ScrollView>

        {/* Modal de Seleção de Empresa */}
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
    marginBottom: 50,
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