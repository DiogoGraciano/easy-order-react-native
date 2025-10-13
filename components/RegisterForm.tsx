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
import { registerUser } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

// Schema de validação
const registerSchema = yup.object().shape({
  name: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email inválido'),
  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: yup
    .string()
    .required('Confirmação de senha é obrigatória')
    .oneOf([yup.ref('password')], 'As senhas não coincidem'),
});

// Tipos
type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  // Formulário de Registro
  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema) as any,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleRegister = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...userData } = data;
      await dispatch(registerUser(userData)).unwrap();
      onSwitchToLogin();
    } catch (error) {
      // Error is handled by Redux
    }
  };

  return (
    <>
      <Controller
        control={registerControl}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, registerErrors.name && styles.inputError]}
            placeholder="Nome completo *"
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
          />
        )}
      />
      {registerErrors.name && (
        <Text style={styles.errorText}>{registerErrors.name.message}</Text>
      )}

      <Controller
        control={registerControl}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, registerErrors.email && styles.inputError]}
            placeholder="Email *"
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
      {registerErrors.email && (
        <Text style={styles.errorText}>{registerErrors.email.message}</Text>
      )}

      <Controller
        control={registerControl}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, registerErrors.password && styles.inputError]}
            placeholder="Senha *"
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCorrect={false}
            returnKeyType="next"
          />
        )}
      />
      {registerErrors.password && (
        <Text style={styles.errorText}>{registerErrors.password.message}</Text>
      )}

      <Controller
        control={registerControl}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, registerErrors.confirmPassword && styles.inputError]}
            placeholder="Confirmar senha *"
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCorrect={false}
            returnKeyType="next"
          />
        )}
      />
      {registerErrors.confirmPassword && (
        <Text style={styles.errorText}>{registerErrors.confirmPassword.message}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleRegisterSubmit(handleRegister as any)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={onSwitchToLogin}
      >
        <Text style={styles.linkText}>
          Já tem uma conta? <Text style={styles.linkTextBold}>Faça login</Text>
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
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
});
