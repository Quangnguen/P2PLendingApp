import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.container];

    // Size
    switch (size) {
      case 'small':
        baseStyle.push(styles.sizeSmall);
        break;
      case 'large':
        baseStyle.push(styles.sizeLarge);
        break;
      default:
        baseStyle.push(styles.sizeMedium);
    }

    // Variant
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      default:
        baseStyle.push(styles.primary);
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseTextStyle: TextStyle[] = [styles.text];

    switch (size) {
      case 'small':
        baseTextStyle.push(styles.textSmall);
        break;
      case 'large':
        baseTextStyle.push(styles.textLarge);
        break;
      default:
        baseTextStyle.push(styles.textMedium);
    }

    switch (variant) {
      case 'outline':
      case 'ghost':
        baseTextStyle.push(styles.textOutline);
        break;
      default:
        baseTextStyle.push(styles.textPrimary);
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[...getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.accentBlue : Colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  // Sizes
  sizeSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sizeMedium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sizeLarge: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  // Variants
  primary: {
    backgroundColor: Colors.accentBlue,
  },
  secondary: {
    backgroundColor: Colors.cardBackground,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accentBlue,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  // Text
  text: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  textPrimary: {
    color: Colors.white,
  },
  textOutline: {
    color: Colors.accentBlue,
  },
});

export default Button;
