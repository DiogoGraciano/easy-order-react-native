import { useCallback } from 'react';
import { Alert } from 'react-native';

interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export const useApiError = () => {
  const showErrorAlert = useCallback((error: any, title: string = 'Erro') => {
    let message = 'Ocorreu um erro inesperado';
    
    if (error?.message) {
      if (Array.isArray(error.message)) {
        message = error.message.join('\n');
      } else {
        message = error.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }
    setTimeout(() => {
      Alert.alert(title, message);
    }, 100);
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    errorTitle: string = 'Erro'
  ): Promise<T | null> => {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      showErrorAlert(error, errorTitle);
      return null;
    }
  }, [showErrorAlert]);

  const executeDeleteWithListUpdate = useCallback(async <T>(
    deleteOperation: () => Promise<void>,
    item: T,
    updateList: (updateFn: (prevList: T[]) => T[]) => void,
    getItemId: (item: T) => string,
    errorTitle: string = 'Erro ao excluir'
  ): Promise<boolean> => {
    const result = await executeWithErrorHandling(
      deleteOperation,
      errorTitle
    );

    if (result !== null) {
      updateList(prevList => prevList.filter(listItem => 
        getItemId(listItem) !== getItemId(item)
      ));
      return true;
    }
    
    return false;
  }, [executeWithErrorHandling]);

  return {
    showErrorAlert,
    executeWithErrorHandling,
    executeDeleteWithListUpdate,
  };
}; 