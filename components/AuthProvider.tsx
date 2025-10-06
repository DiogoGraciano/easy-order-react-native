import React, { useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { initializeAuth, clearServerError } from '../store/authSlice';
import { ConnectionError } from './ConnectionError';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isLoading, isInitialized, error } = useAppSelector((state) => state.auth);
  const hasInitialized = useRef(false);

  // Inicializar apenas uma vez, sem useEffect
  if (!hasInitialized.current && !isInitialized) {
    hasInitialized.current = true;
    dispatch(initializeAuth());
  }

  const handleRetryConnection = () => {
    dispatch(clearServerError());
    dispatch(initializeAuth());
  };

  // Mostrar loading enquanto não inicializou
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Mostrar erro de conexão se servidor estiver indisponível
  if (error === 'Servidor indisponível') {
    return (
      <ConnectionError 
        onRetry={handleRetryConnection}
        message="Não foi possível conectar ao servidor. Verifique se o backend está rodando e tente novamente."
      />
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
