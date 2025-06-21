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
import { Card, CardContent, CardHeader, CardSubtitle, CardTitle } from '../../components/ui/Card';
import { useApiError } from '../../hooks/useApiError';
import { apiService } from '../../services/apiService';
import { Enterprise } from '../../types/models';

export default function EnterprisesScreen() {
  const { executeWithErrorHandling, executeDeleteWithListUpdate } = useApiError();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnterprises = async () => {
    setLoading(true);
    setError(null);
    
    const result = await executeWithErrorHandling(
      () => apiService.getEnterprises(),
      'Erro ao carregar empresas'
    );

    if (result) {
      setEnterprises(result);
    }
    
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadEnterprises();
    }, [])
  );

  const handleDeleteEnterprise = (enterprise: Enterprise) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a empresa ${enterprise.tradeName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await executeDeleteWithListUpdate(
              () => apiService.deleteEnterprise(enterprise),
              enterprise,
              setEnterprises,
              (item) => item.id!,
              'Erro ao excluir empresa'
            );

            if (success) {
              Alert.alert('Sucesso', 'Empresa excluída com sucesso!');
            }
          },
        },
      ]
    );
  };

  const handleEnterprisePress = (enterpriseId: string) => {
    router.push(`/enterprises/${enterpriseId}` as any);
  };

  const handleNewEnterprise = () => {
    router.push('/enterprises/new' as any);
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return cnpj;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Empresas</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewEnterprise}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadEnterprises} />
        }
      >
        {enterprises.length > 0 ? (
          enterprises.map((enterprise) => (
            <Card key={enterprise.id} style={styles.enterpriseCard}>
              <TouchableOpacity onPress={() => handleEnterprisePress(enterprise.id!)}>
                <CardHeader>
                  <View style={styles.enterpriseHeader}>
                    <View style={styles.enterpriseInfo}>
                      {enterprise.logo ? (
                        <Image source={{ uri: enterprise.logo }} style={styles.logo} />
                      ) : (
                        <View style={styles.logoPlaceholder}>
                          <Ionicons name="business" size={24} color="#666" />
                        </View>
                      )}
                      <View style={styles.enterpriseDetails}>
                        <CardTitle>{enterprise.tradeName}</CardTitle>
                        <CardSubtitle>{enterprise.legalName}</CardSubtitle>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEnterprise(enterprise)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff6384" />
                    </TouchableOpacity>
                  </View>
                </CardHeader>
                <CardContent>
                  <View style={styles.enterpriseData}>
                    <View style={styles.dataItem}>
                      <Ionicons name="card-outline" size={16} color="#666" />
                      <Text style={styles.dataText}>
                        CNPJ: {formatCNPJ(enterprise.cnpj)}
                      </Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.dataText}>
                        Fundação: {formatDate(enterprise.foundationDate)}
                      </Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.dataText} numberOfLines={2}>
                        {enterprise.address}
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </TouchableOpacity>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma empresa encontrada</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleNewEnterprise}>
              <Text style={styles.emptyButtonText}>Cadastrar Primeira Empresa</Text>
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
    backgroundColor: '#8E8E93',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  enterpriseCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  enterpriseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  enterpriseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enterpriseDetails: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  enterpriseData: {
    marginTop: 8,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataText: {
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
    backgroundColor: '#8E8E93',
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