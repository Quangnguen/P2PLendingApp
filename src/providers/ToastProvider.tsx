import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useToasts, hideToast } from '../store';
import { useTheme } from './ThemeProvider';
import { Toast, ToastType } from '../types/toast.types';

const getToastIcon = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return 'ℹ️';
  }
};

interface ToastItemProps {
  toast: Toast;
  onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getBackgroundColor = useCallback(() => {
    switch (toast.type) {
      case 'success':
        return colors.greenSuccess;
      case 'error':
        return colors.redError;
      case 'warning':
        return colors.yellowWarning;
      case 'info':
        return colors.accentBlue;
      default:
        return colors.accentBlue;
    }
  }, [toast.type, colors]);

  const handleHide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  }, [translateY, opacity, onHide, toast.id]);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      handleHide();
    }, duration);

    return () => clearTimeout(timer);
  }, [translateY, opacity, toast.duration, handleHide]);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={handleHide}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{getToastIcon(toast.type)}</Text>
        <View style={styles.textContainer}>
          {toast.title && <Text style={styles.title}>{toast.title}</Text>}
          <Text style={styles.message}>{toast.message}</Text>
        </View>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const toasts = useToasts();

  const handleHide = (id: string) => {
    dispatch(hideToast(id));
  };

  return (
    <>
      {children}
      {toasts.length > 0 && (
        <View style={[styles.container, { top: insets.top + 10 }]}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onHide={handleHide} />
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toastContainer: {
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    opacity: 0.8,
  },
});

export default ToastProvider;
