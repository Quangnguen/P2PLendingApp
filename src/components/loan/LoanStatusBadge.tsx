/**
 * =================================================================
 * LOAN STATUS BADGE COMPONENT
 * =================================================================
 * 
 * Component hiển thị badge trạng thái khoản vay
 * Dùng lại ở nhiều nơi
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoanStatus } from '../../types/loan.types';
import { LOAN_STATUS_COLORS, LOAN_STATUS_TEXT } from '../../utils/constants';

interface LoanStatusBadgeProps {
  status: LoanStatus;
  size?: 'small' | 'medium' | 'large';
}

const LoanStatusBadge: React.FC<LoanStatusBadgeProps> = ({ 
  status, 
  size = 'medium' 
}) => {
  const color = LOAN_STATUS_COLORS[status];
  const text = LOAN_STATUS_TEXT[status];
  
  // Kích thước theo size
  const sizeStyles = {
    small: { padding: 4, fontSize: 10, dotSize: 6 },
    medium: { padding: 8, fontSize: 12, dotSize: 8 },
    large: { padding: 10, fontSize: 14, dotSize: 10 },
  };
  
  const s = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}20`,
          paddingHorizontal: s.padding * 1.5,
          paddingVertical: s.padding,
        },
      ]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: s.dotSize / 2,
          },
        ]}
      />
      <Text style={[styles.text, { color, fontSize: s.fontSize }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
  },
  dot: {
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
});

export default LoanStatusBadge;