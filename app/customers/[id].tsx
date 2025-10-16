import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Customer } from '../../types/models';

// Schema de validação
const customerEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: yup
    .string()
    .required('E-mail é obrigatório')
    .email('E-mail inválido')
    .max(100, 'E-mail deve ter no máximo 100 caracteres'),
  phone: yup
    .string()
    .required('Telefone é obrigatório')
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos'),
  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .length(11, 'CPF deve ter exatamente 11 dígitos'),
  address: yup
    .string()
    .required('Endereço é obrigatório')
    .min(10, 'Endereço deve ter no mínimo 10 caracteres')
    .max(200, 'Endereço deve ter no máximo 200 caracteres'),
});

// Tipo
type CustomerEditFormData = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
};

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { executeWithErrorHandling } = useApiError();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerEditFormData>({
    resolver: yupResolver(customerEditSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      address: '',
    },
  });

  const loadCustomer = async () => {
    if (!id) return;
    
    setLoadingData(true);
    const result = await executeWithErrorHandling(
      () => apiService.getCustomerById(id),
      'Erro ao carregar cliente'
    );

    if (result) {
      reset({
        name: result.name || '',
        email: result.email || '',
        phone: result.phone || '',
        cpf: result.cpf || '',
        address: result.address || '',
      });
    } else {
      router.back();
    }
    setLoadingData(false);
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return text;
  };

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    } else if (cleaned.length <= 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return text;
  };

  const handleSave = async (data: CustomerEditFormData) => {
    setLoading(true);
    
    const result = await executeWithErrorHandling(
      () => apiService.saveCustomer({ ...data, id } as Customer),
      'Erro ao atualizar cliente'
    );

    if (result) {
      Alert.alert('Sucesso', 'Cliente atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const result = await executeWithErrorHandling(
              () => apiService.deleteCustomer({ id } as Customer),
              'Erro ao excluir cliente'
            );

            if (result !== null) {
              Alert.alert('Sucesso', 'Cliente excluído com sucesso!', [
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

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando cliente...</Text>
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
          <Text style={styles.headerTitle}>Editar Cliente</Text>
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
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Nome */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo *</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite o nome completo"
                      placeholderTextColor="#999"
                    />
                  )}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                )}
              </View>

              {/* E-mail */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail *</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite o e-mail"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </View>

              {/* CPF */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CPF *</Text>
                <Controller
                  control={control}
                  name="cpf"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.cpf && styles.inputError]}
                      value={formatCPF(value || '')}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '');
                        if (cleaned.length <= 11) {
                          onChange(cleaned);
                        }
                      }}
                      placeholder="000.000.000-00"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.cpf && (
                  <Text style={styles.errorText}>{errors.cpf.message}</Text>
                )}
              </View>

              {/* Telefone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone *</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.phone && styles.inputError]}
                      value={formatPhone(value || '')}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '');
                        if (cleaned.length <= 11) {
                          onChange(cleaned);
                        }
                      }}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                    />
                  )}
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone.message}</Text>
                )}
              </View>

              {/* Endereço */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Endereço *</Text>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, styles.textArea, errors.address && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite o endereço completo"
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                    />
                  )}
                />
                {errors.address && (
                  <Text style={styles.errorText}>{errors.address.message}</Text>
                )}
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
    backgroundColor: '#34C759',
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