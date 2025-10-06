import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Colors } from '../../constants/Colors';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => dispatch(logoutUser()),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <Card style={styles.card}>
        <CardHeader>
          <CardTitle size="large">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{user?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email || 'N/A'}</Text>
          </View>
          
          {user?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Telefone:</Text>
              <Text style={styles.value}>{user.phone}</Text>
            </View>
          )}
          
          {user?.cpf && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>CPF:</Text>
              <Text style={styles.value}>{user.cpf}</Text>
            </View>
          )}
          
          {user?.address && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Endereço:</Text>
              <Text style={styles.value}>{user.address}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Função:</Text>
            <Text style={styles.value}>{user?.role || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, styles.status]}>
              {user?.isActive ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    margin: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  status: {
    color: Colors.primary,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
