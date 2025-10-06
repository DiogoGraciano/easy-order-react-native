import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearError } from '../store/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { Colors } from '../constants/Colors';


export default function LoginScreen() {
  const [showRegister, setShowRegister] = useState(false);

  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.auth);

  const clearErrors = () => {
    dispatch(clearError());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>EasyOrder</Text>
          <Text style={styles.subtitle}>
            {showRegister ? 'Crie sua conta' : 'Faça login em sua conta'}
          </Text>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle size="large" style={styles.cardTitle}>
              {showRegister ? 'Registrar' : 'Entrar'}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearErrors} style={styles.clearErrorButton}>
                  <Text style={styles.clearErrorText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {showRegister ? (
              <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
            ) : (
              <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 0,
  },
  cardTitle: {
    textAlign: 'center',
    color: Colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    flex: 1,
  },
  clearErrorButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearErrorText: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
