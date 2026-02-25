/**
 * =================================================================
 * COLLATERAL INFO COMPONENT
 * =================================================================
 * 
 * Component hiển thị thông tin tài sản thế chấp
 * Bao gồm: số ETH, giá trị, tỷ lệ thế chấp
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateCollateralRatio, formatCurrency } from '../../utils/loanCalculations';
import { LOAN_CONFIG } from '../../utils/constants';

interface CollateralInfoProps {
  /** Số ETH thế chấp */
  collateralEth: string;
  
  /** Giá ETH hiện tại (USDT) */
  ethPrice: string;
  
  /** Số tiền vay (USDT) */
  loanAmount: string;
  
  /** Hiển thị chi tiết hay rút gọn */
  detailed?: boolean;
}

const CollateralInfo: React.FC<CollateralInfoProps> = ({
  collateralEth,
  ethPrice,
  loanAmount,
  detailed = true,
}) => {
  // Tính giá trị thế chấp (USDT)
  const collateralValue = (parseFloat(collateralEth) * parseFloat(ethPrice)).toFixed(2);
  
  // Tính tỷ lệ thế chấp
  const ratio = calculateCollateralRatio(collateralEth, ethPrice, loanAmount);
  
  // Xác định màu theo mức độ an toàn
  // >= 150%: An toàn (xanh)
  // 120-150%: Cảnh báo (vàng)
  // < 120%: Nguy hiểm (đỏ)
  const getRatioColor = () => {
    if (ratio >= LOAN_CONFIG.MIN_COLLATERAL_RATIO) return '#10b981';
    if (ratio >= LOAN_CONFIG.LIQUIDATION_THRESHOLD) return '#f59e0b';
    return '#ef4444';
  };
  
  const getRatioStatus = () => {
    if (ratio >= LOAN_CONFIG.MIN_COLLATERAL_RATIO) return 'An toàn';
    if (ratio >= LOAN_CONFIG.LIQUIDATION_THRESHOLD) return 'Cảnh báo';
    return 'Nguy hiểm';
  };

  if (!detailed) {
    // Phiên bản rút gọn
    return (
      <View style={styles.compact}>
        <Text style={styles.compactLabel}>Thế chấp:</Text>
        <Text style={styles.compactValue}>{collateralEth} ETH</Text>
        <View style={[styles.ratioMini, { backgroundColor: `${getRatioColor()}20` }]}>
          <Text style={[styles.ratioMiniText, { color: getRatioColor() }]}>
            {ratio}%
          </Text>
        </View>
      </View>
    );
  }

  // Phiên bản chi tiết
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Tài sản thế chấp</Text>
      
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>Số ETH</Text>
          <Text style={styles.value}>{collateralEth} ETH</Text>
        </View>
        
        <View style={styles.item}>
          <Text style={styles.label}>Giá trị</Text>
          <Text style={styles.value}>${formatCurrency(collateralValue)}</Text>
        </View>
      </View>
      
      {/* Thanh progress tỷ lệ thế chấp */}
      <View style={styles.ratioContainer}>
        <View style={styles.ratioHeader}>
          <Text style={styles.ratioLabel}>Tỷ lệ thế chấp</Text>
          <Text style={[styles.ratioValue, { color: getRatioColor() }]}>
            {ratio}% - {getRatioStatus()}
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            {/* Vùng nguy hiểm (0-120%) */}
            <View style={[styles.progressZone, styles.dangerZone, { width: '40%' }]} />
            {/* Vùng cảnh báo (120-150%) */}
            <View style={[styles.progressZone, styles.warningZone, { width: '10%' }]} />
            {/* Vùng an toàn (>150%) */}
            <View style={[styles.progressZone, styles.safeZone, { width: '50%' }]} />
          </View>
          
          {/* Indicator vị trí hiện tại */}
          <View
            style={[
              styles.indicator,
              {
                left: `${Math.min(ratio / 3, 100)}%`,
                backgroundColor: getRatioColor(),
              },
            ]}
          />
        </View>
        
        <View style={styles.thresholds}>
          <Text style={styles.thresholdText}>0%</Text>
          <Text style={styles.thresholdText}>120%</Text>
          <Text style={styles.thresholdText}>150%</Text>
          <Text style={styles.thresholdText}>300%+</Text>
        </View>
      </View>
      
      {/* Cảnh báo nếu tỷ lệ thấp */}
      {ratio < LOAN_CONFIG.MIN_COLLATERAL_RATIO && (
        <View style={[styles.warning, { backgroundColor: `${getRatioColor()}15` }]}>
          <Text style={[styles.warningText, { color: getRatioColor() }]}>
            ⚠️ {ratio < LOAN_CONFIG.LIQUIDATION_THRESHOLD
              ? 'Tài sản có thể bị thanh lý!'
              : 'Cần thêm tài sản thế chấp'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  item: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  
  // Ratio progress bar
  ratioContainer: {
    marginTop: 8,
  },
  ratioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratioLabel: {
    fontSize: 12,
    color: '#666',
  },
  ratioValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    position: 'relative',
  },
  progressTrack: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressZone: {
    height: '100%',
  },
  dangerZone: {
    backgroundColor: '#fee2e2',
  },
  warningZone: {
    backgroundColor: '#fef3c7',
  },
  safeZone: {
    backgroundColor: '#d1fae5',
  },
  indicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    marginLeft: -8,
  },
  thresholds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  thresholdText: {
    fontSize: 10,
    color: '#999',
  },
  
  // Warning
  warning: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Compact version
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  compactValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    marginRight: 8,
  },
  ratioMini: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratioMiniText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default CollateralInfo;