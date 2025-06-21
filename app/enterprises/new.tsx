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
import { DatePicker } from '../../components/ui/DatePicker';
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Enterprise, validateCNPJ } from '../../types/models';

export default function NewEnterpriseScreen() {
  const { executeWithErrorHandling } = useApiError();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Enterprise>>({
    legalName: '',
    tradeName: '',
    cnpj: '',
    foundationDate: new Date().toISOString(),
    address: '',
  });

  const handleInputChange = (field: keyof Enterprise, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const handleCNPJChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      handleInputChange('cnpj', cleaned);
    }
  };

  const handleDateChange = (date: Date) => {
    setFormData(prev => ({
      ...prev,
      foundationDate: date.toISOString(),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.legalName?.trim()) {
      Alert.alert('Erro', 'Razão Social é obrigatória');
      return false;
    }
    if (!formData.tradeName?.trim()) {
      Alert.alert('Erro', 'Nome Fantasia é obrigatório');
      return false;
    }
    
    const cnpjValidation = validateCNPJ(formData.cnpj || '');
    if (!cnpjValidation.isValid) {
      Alert.alert('Erro', cnpjValidation.message);
      return false;
    }
    
    if (!formData.address?.trim()) {
      Alert.alert('Erro', 'Endereço é obrigatório');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    const result = await executeWithErrorHandling(
      () => apiService.saveEnterprise(formData as Enterprise),
      'Erro ao cadastrar empresa'
    );

    if (result) {
      Alert.alert('Sucesso', 'Empresa cadastrada com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    router.back();
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
          <Text style={styles.headerTitle}>Nova Empresa</Text>
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
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Razão Social */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Razão Social *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.legalName}
                  onChangeText={(text) => handleInputChange('legalName', text)}
                  placeholder="Digite a razão social"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Nome Fantasia */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Fantasia *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.tradeName}
                  onChangeText={(text) => handleInputChange('tradeName', text)}
                  placeholder="Digite o nome fantasia"
                  placeholderTextColor="#999"
                />
              </View>

              {/* CNPJ */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CNPJ *</Text>
                <TextInput
                  style={styles.input}
                  value={formatCNPJ(formData.cnpj || '')}
                  onChangeText={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              {/* Data de Fundação */}
              <View style={styles.inputGroup}>
                <DatePicker
                  value={formData.foundationDate ? new Date(formData.foundationDate) : new Date()}
                  onChange={handleDateChange}
                  label="Data de Fundação"
                  placeholder="Selecionar data de fundação"
                />
              </View>

              {/* Endereço */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Endereço *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                  placeholder="Digite o endereço completo"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
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

}); 