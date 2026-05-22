/**
 * =================================================================
 * LOAN CARD COMPONENT
 * =================================================================
 * 
 * Component hiển thị thông tin tóm tắt của một khoản vay
 * Dùng trong danh sách khoản vay (MyLoans, LoanMarket)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LoanSummary, LoanStatus } from '../../types/loan.types';
import { LOAN_STATUS_COLORS, LOAN_STATUS_TEXT } from '../../utils/constants';
import {
  formatCurrency,
  calculateDaysRemaining,
  formatDaysRemaining,
} from '../../utils/loanCalculations';

// =====================
// PROPS INTERFACE
// =====================

interface LoanCardProps {
  /** Thông tin khoản vay */
  loan: LoanSummary;
  
  /** Callback khi nhấn vào card */
  onPress: (loanId: string) => void;
  
  /** Hiển thị ở chế độ nào: borrower hay lender */
  mode: 'borrower' | 'lender';
}

// =====================
// COMPONENT
// =====================

const LoanCard: React.FC<LoanCardProps> = ({ loan, onPress, mode }) => {
  // Tính số ngày còn lại (nếu có dueDate)
  const daysRemaining = loan.dueDate ? calculateDaysRemaining(loan.dueDate) : null;
  
  // Lấy màu theo trạng thái
  const statusColor = LOAN_STATUS_COLORS[loan.status];
  
  // Lấy text trạng thái
  const statusText = LOAN_STATUS_TEXT[loan.status];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(loan.id)}
      activeOpacity={0.7}>
      
      {/* Header: Số tiền & Trạng thái */}
      <View style={styles.header}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Số tiền vay</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(loan.amount)} <Text style={styles.currency}>USDT</Text>
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      {/* Body: Thông tin chi tiết */}
      <View style={styles.body}>
        {/* Lãi suất */}
        <View style={styles.infoItem}>
          <View style={styles.infoLabelRow}>
            <Ionicons name="trending-up-outline" size={12} color="#888" />
            <Text style={styles.infoLabel}>Lãi suất</Text>
          </View>
          <Text style={styles.infoValue}>{loan.interestRate}%/năm</Text>
        </View>

        {/* Thời hạn */}
        <View style={styles.infoItem}>
          <View style={styles.infoLabelRow}>
            <Ionicons name="time-outline" size={12} color="#888" />
            <Text style={styles.infoLabel}>Thời hạn</Text>
          </View>
          <Text style={styles.infoValue}>{loan.duration} ngày</Text>
        </View>

        {/* Điểm tín dụng (chỉ hiện ở mode lender) */}
        {mode === 'lender' && (
          <View style={styles.infoItem}>
            <View style={styles.infoLabelRow}>
              <Ionicons name="star-outline" size={12} color="#888" />
              <Text style={styles.infoLabel}>Tín dụng</Text>
            </View>
            <Text style={[
              styles.infoValue,
              { color: loan.creditScore >= 650 ? '#10b981' : '#f59e0b' }
            ]}>
              {loan.creditScore}
            </Text>
          </View>
        )}
      </View>

      {/* Footer: Thời gian còn lại hoặc ngày tạo */}
      <View style={styles.footer}>
        {loan.status === LoanStatus.ACTIVE && daysRemaining !== null ? (
          <View style={styles.footerLeft}>
            <Ionicons name="alarm-outline" size={13} color={daysRemaining < 0 ? '#ef4444' : '#666'} />
            <Text style={[styles.footerText, daysRemaining < 0 && styles.overdueText]}>
              {' '}{formatDaysRemaining(daysRemaining)}
            </Text>
          </View>
        ) : (
          <View style={styles.footerLeft}>
            <Ionicons name="calendar-outline" size={13} color="#666" />
            <Text style={styles.footerText}>
              {' '}{new Date(loan.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        )}

        <View style={styles.viewDetailRow}>
          <Text style={styles.viewDetail}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={14} color="#667eea" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// =====================
// STYLES
// =====================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  amountContainer: {},
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  currency: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Body
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetail: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
});

export default LoanCard;