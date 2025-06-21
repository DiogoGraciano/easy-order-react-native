import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
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
import { Product } from '../../types/models';

export default function NewProductScreen() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    photo: '',
    enterpriseId: '', // Será definido conforme a empresa selecionada
  });

  const handleInputChange = (field: keyof Product, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
    if (!formData.enterpriseId?.trim()) {
      Alert.alert('Erro', 'Enterprise ID é obrigatório (será implementado seletor de empresa)');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiService.saveProduct(formData as Product);
      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao cadastrar produto');
    } finally {
      setLoading(false);
    }
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
              {/* Nome */}
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

              {/* Descrição */}
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

              {/* Preço */}
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

              {/* Estoque */}
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

              {/* Enterprise ID temporário */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID da Empresa *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.enterpriseId}
                  onChangeText={(text) => handleInputChange('enterpriseId', text)}
                  placeholder="Digite o ID da empresa"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Foto */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Foto do Produto</Text>
                <TouchableOpacity style={styles.photoButton}>
                  <Ionicons name="camera-outline" size={24} color="#666" />
                  <Text style={styles.photoButtonText}>Adicionar Foto</Text>
                </TouchableOpacity>
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
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>
                    {formData.name || 'Nome do produto'}
                  </Text>
                  <Text style={styles.previewDescription}>
                    {formData.description || 'Descrição do produto'}
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
  photoButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#666',
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
}); 