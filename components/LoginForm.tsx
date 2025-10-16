import { yupResolver } from '@hookform/resolvers/yup';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import * as yup from 'yup';
import { Colors } from '../constants/Colors';
import { loginUser } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

// Schema de validação
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email inválido'),
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Tipos
type LoginFormData = {
  email: string;
  password: string;
};

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  // Formulário de Login
  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      await dispatch(loginUser({ email: data.email.trim(), password: data.password })).unwrap();
    } catch (error) {
      // Error is handled by Redux
    }
  };

  return (
    <>
      <Controller
        control={loginControl}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, loginErrors.email && styles.inputError]}
            placeholder="Email"
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        )}
      />
      {loginErrors.email && (
        <Text style={styles.errorText}>{loginErrors.email.message}</Text>
      )}

      <Controller
        control={loginControl}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, loginErrors.password && styles.inputError]}
            placeholder="Senha"
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCorrect={false}
            returnKeyType="done"
          />
        )}
      />
      {loginErrors.password && (
        <Text style={styles.errorText}>{loginErrors.password.message}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleLoginSubmit(handleLogin)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={onSwitchToRegister}
      >
        <Text style={styles.linkText}>
          Não tem uma conta? <Text style={styles.linkTextBold}>Registre-se</Text>
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: '600',
    color: Colors.primary,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
});
