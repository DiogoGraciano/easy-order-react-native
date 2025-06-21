import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Product } from '../../types/models';
import { apiService } from '../../services/apiService';
import { Card, CardHeader, CardTitle, CardSubtitle, CardContent } from '../../components/ui/Card';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o produto ${product.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteProduct(product);
              setProducts(prev => prev.filter(p => p.id !== product.id));
              Alert.alert('Sucesso', 'Produto excluído com sucesso!');
            } catch (err) {
              Alert.alert('Erro', 'Erro ao excluir produto');
            }
          },
        },
      ]
    );
  };

  const handleProductPress = (productId: number) => {
    router.push(`/products/${productId}` as any);
  };

  const handleNewProduct = () => {
    router.push('/products/new' as any);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Sem estoque', color: '#ff6384' };
    if (stock <= 10) return { text: 'Estoque baixo', color: '#ffce56' };
    return { text: 'Em estoque', color: '#36a2eb' };
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (error) {
    Alert.alert('Erro', error);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewProduct}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadProducts} />
        }
      >
        {products.length > 0 ? (
          products.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            return (
              <Card key={product.id} style={styles.productCard}>
                <TouchableOpacity onPress={() => handleProductPress(product.id!)}>
                  <CardHeader>
                    <View style={styles.productHeader}>
                      <View style={styles.productInfo}>
                        {product.photo ? (
                          <Image source={{ uri: product.photo }} style={styles.productImage} />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Ionicons name="cube-outline" size={24} color="#666" />
                          </View>
                        )}
                        <View style={styles.productDetails}>
                          <CardTitle>{product.name}</CardTitle>
                          <CardSubtitle>
                            {product.description}
                          </CardSubtitle>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteProduct(product)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ff6384" />
                      </TouchableOpacity>
                    </View>
                  </CardHeader>
                  <CardContent>
                    <View style={styles.productMetrics}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Preço</Text>
                        <Text style={styles.priceValue}>
                          {formatCurrency(product.price)}
                        </Text>
                      </View>
                      <View style={styles.stockContainer}>
                        <Text style={styles.stockLabel}>Estoque</Text>
                        <View style={styles.stockInfo}>
                          <Text style={styles.stockValue}>{product.stock}</Text>
                          <View
                            style={[
                              styles.stockBadge,
                              { backgroundColor: stockStatus.color },
                            ]}
                          >
                            <Text style={styles.stockBadgeText}>
                              {stockStatus.text}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </TouchableOpacity>
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleNewProduct}>
              <Text style={styles.emptyButtonText}>Cadastrar Primeiro Produto</Text>
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
    backgroundColor: '#FF9500',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  productCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  stockContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    backgroundColor: '#FF9500',
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