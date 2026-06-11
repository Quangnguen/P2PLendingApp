import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/providers';
import { useNotification } from '@/providers/NotificationProvider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import notificationApi, { NotificationItem } from '@/api/notification.api';
import { formatDate } from '@/utils/formatters';

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const { unreadCount, setUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  const fetchNotifications = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const result = await notificationApi.getMyNotifications(50, 0);
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount ?? 0); // sync về provider
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Dùng useFocusEffect thay cho useEffect để tự động refresh khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        fetchNotifications(true); // lần đầu hiện spinner
      } else {
        fetchNotifications(false); // lần sau fetch ngầm, không block UI
      }
    }, [fetchNotifications]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = (item: NotificationItem) => {
    Alert.alert('Xóa thông báo', 'Bạn có chắc muốn xóa thông báo này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            await notificationApi.deleteNotification(item._id);
            setNotifications(prev => prev.filter(n => n._id !== item._id));
            if (!item.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
          } catch (e) {
            console.error('Delete failed:', e);
          }
        },
      },
    ]);
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await notificationApi.markAsRead(item._id);
        setNotifications(prev =>
          prev.map(n => n._id === item._id ? { ...n, isRead: true } : n),
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        console.error('markAsRead failed:', e);
      }
    }

    // Điều hướng đến LoanDetail nếu có loanId (trong metadata hoặc referenceId)
    const loanId = item.metadata?.loanId || item.referenceId;
    const isLoanType = [
      'LOAN', 'LOAN_FUNDED', 'LOAN_REPAID',
      'LOAN_DUE_SOON', 'LOAN_LIQUIDATED', 'LOAN_OVERDUE',
    ].includes(item.type);

    if (isLoanType && loanId) {
      navigation.navigate('LoanDetail' as any, { loanId });
    }
  };

  const getIconForType = (type: string): { name: string; color: string } => {
    switch (type) {
      case 'LOAN_FUNDED':
        return { name: 'cash-outline', color: colors.accentBlue };
      case 'LOAN_REPAID':
        return { name: 'checkmark-circle-outline', color: '#22c55e' };
      case 'LOAN_DUE_SOON':
        return { name: 'time-outline', color: '#f59e0b' };
      case 'LOAN_LIQUIDATED':
        return { name: 'warning-outline', color: '#ef4444' };
      case 'LOAN_OVERDUE':
        return { name: 'alert-circle-outline', color: '#ef4444' };
      case 'ADMIN_MESSAGE':
        return { name: 'megaphone-outline', color: '#8b5cf6' };
      case 'LOAN':
        return { name: 'cash-outline', color: colors.accentBlue };
      case 'TRANSACTION':
        return { name: 'swap-horizontal-outline', color: '#06b6d4' };
      case 'SYSTEM':
      default:
        return { name: 'information-circle-outline', color: colors.textGray };
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = getIconForType(item.type);
    const iconColor = item.isRead ? colors.textGray : icon.color;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: item.isRead ? colors.darkBackground : colors.darkSurface },
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: item.isRead ? colors.darkBorder : icon.color + '20' },
        ]}>
          <Ionicons name={icon.name} size={22} color={iconColor} />
        </View>

        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.title,
              { color: item.isRead ? colors.textGray : colors.textWhite,
                fontWeight: item.isRead ? 'normal' : 'bold' },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.message, { color: colors.textGray }]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={[styles.time, { color: colors.textGray }]}>
            {formatDate(new Date(item.createdAt))}
          </Text>
        </View>

        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: colors.accentBlue }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
          Thông báo{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllAsRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="checkmark-done-outline" size={24} color={colors.accentBlue} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.textGray} />
          <Text style={[styles.emptyText, { color: colors.textGray }]}>
            Bạn chưa có thông báo nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accentBlue}
            />
          }
        />
      )}

      {/* Hint giữ để xóa */}
      {notifications.length > 0 && (
        <Text style={[styles.hint, { color: colors.textGray }]}>
          Giữ lâu vào thông báo để xóa
        </Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, marginTop: 16 },
  listContent: { paddingBottom: 32 },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  contentContainer: { flex: 1 },
  title: { fontSize: 15, marginBottom: 3, lineHeight: 20 },
  message: { fontSize: 13, lineHeight: 19, marginBottom: 5 },
  time: { fontSize: 11 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    marginTop: 6, marginLeft: 8, flexShrink: 0,
  },
  hint: { textAlign: 'center', fontSize: 11, paddingVertical: 8 },
});

export default NotificationScreen;
