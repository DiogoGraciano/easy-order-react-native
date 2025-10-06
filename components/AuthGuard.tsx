import React from 'react';
import { Redirect, usePathname } from 'expo-router';
import { useAppSelector } from '../store/hooks';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);
  const pathname = usePathname();

  // Se ainda não inicializou, não renderizar nada (AuthProvider já mostra o loading)
  if (!isInitialized) {
    return null;
  }

  // Se não está autenticado e não está na página de login, redirecionar para login
  if (!isAuthenticated && pathname !== '/login') {
    return <Redirect href="/login" />;
  }

  // Se está autenticado e está na página de login, redirecionar para home
  if (isAuthenticated && pathname === '/login') {
    return <Redirect href="/(tabs)" />;
  }

  // Renderizar os children
  return <>{children}</>;
};
