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
import { DatePicker } from '../../components/ui/DatePicker';
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Enterprise } from '../../types/models';

// Schema de validação
const enterpriseEditSchema = yup.object().shape({
  legalName: yup
    .string()
    .required('Razão Social é obrigatória')
    .min(2, 'Razão Social deve ter no mínimo 2 caracteres')
    .max(200, 'Razão Social deve ter no máximo 200 caracteres'),
  tradeName: yup
    .string()
    .required('Nome Fantasia é obrigatório')
    .min(2, 'Nome Fantasia deve ter no mínimo 2 caracteres')
    .max(100, 'Nome Fantasia deve ter no máximo 100 caracteres'),
  cnpj: yup
    .string()
    .required('CNPJ é obrigatório')
    .length(14, 'CNPJ deve ter exatamente 14 dígitos'),
  foundationDate: yup
    .date()
    .required('Data de fundação é obrigatória')
    .max(new Date(), 'Data de fundação não pode ser no futuro'),
  address: yup
    .string()
    .required('Endereço é obrigatório')
    .min(10, 'Endereço deve ter no mínimo 10 caracteres')
    .max(300, 'Endereço deve ter no máximo 300 caracteres'),
});

// Tipo
type EnterpriseEditFormData = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  foundationDate: Date;
  address: string;
};

export default function EditEnterpriseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { executeWithErrorHandling } = useApiError();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EnterpriseEditFormData>({
    resolver: yupResolver(enterpriseEditSchema),
    mode: 'onBlur',
    defaultValues: {
      legalName: '',
      tradeName: '',
      cnpj: '',
      foundationDate: new Date(),
      address: '',
    },
  });

  const loadEnterprise = async () => {
    if (!id) return;
    
    setLoadingData(true);
    const result = await executeWithErrorHandling(
      () => apiService.getEnterpriseById(id),
      'Erro ao carregar empresa'
    );

    if (result) {
      reset({
        legalName: result.legalName || '',
        tradeName: result.tradeName || '',
        cnpj: result.cnpj || '',
        foundationDate: result.foundationDate ? new Date(result.foundationDate) : new Date(),
        address: result.address || '',
      });
    } else {
      router.back();
    }
    setLoadingData(false);
  };

  useEffect(() => {
    loadEnterprise();
  }, [id]);

  const formatCNPJ = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
    }
    return text;
  };

  const handleSave = async (data: EnterpriseEditFormData) => {
    setLoading(true);
    
    const enterpriseData = {
      ...data,
      foundationDate: data.foundationDate.toISOString(),
    };
    
    const result = await executeWithErrorHandling(
      () => apiService.saveEnterprise({ ...enterpriseData, id } as Enterprise),
      'Erro ao atualizar empresa'
    );

    if (result) {
      Alert.alert('Sucesso', 'Empresa atualizada com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir esta empresa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const result = await executeWithErrorHandling(
              () => apiService.deleteEnterprise({ id } as Enterprise),
              'Erro ao excluir empresa'
            );

            if (result !== null) {
              Alert.alert('Sucesso', 'Empresa excluída com sucesso!', [
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
          <Text style={styles.loadingText}>Carregando empresa...</Text>
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
          <Text style={styles.headerTitle}>Editar Empresa</Text>
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
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Razão Social */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Razão Social *</Text>
                <Controller
                  control={control}
                  name="legalName"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.legalName && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite a razão social"
                      placeholderTextColor="#999"
                    />
                  )}
                />
                {errors.legalName && (
                  <Text style={styles.errorText}>{errors.legalName.message}</Text>
                )}
              </View>

              {/* Nome Fantasia */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Fantasia *</Text>
                <Controller
                  control={control}
                  name="tradeName"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.tradeName && styles.inputError]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite o nome fantasia"
                      placeholderTextColor="#999"
                    />
                  )}
                />
                {errors.tradeName && (
                  <Text style={styles.errorText}>{errors.tradeName.message}</Text>
                )}
              </View>

              {/* CNPJ */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CNPJ *</Text>
                <Controller
                  control={control}
                  name="cnpj"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.cnpj && styles.inputError]}
                      value={formatCNPJ(value || '')}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '');
                        if (cleaned.length <= 14) {
                          onChange(cleaned);
                        }
                      }}
                      placeholder="00.000.000/0000-00"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.cnpj && (
                  <Text style={styles.errorText}>{errors.cnpj.message}</Text>
                )}
              </View>

              {/* Data de Fundação */}
              <View style={styles.inputGroup}>
                <Controller
                  control={control}
                  name="foundationDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      value={value}
                      onChange={onChange}
                      label="Data de Fundação"
                      placeholder="Selecionar data de fundação"
                    />
                  )}
                />
                {errors.foundationDate && (
                  <Text style={styles.errorText}>{errors.foundationDate.message}</Text>
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
    backgroundColor: '#8E8E93',
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