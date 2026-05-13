import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers';
import Ionicons from 'react-native-vector-icons/Ionicons';
import notificationApi, { NotificationItem } from '@/api/notification.api';
import { formatDate } from '@/utils/formatters';

const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.getMyNotifications(50, 0);
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
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

  const handleNotificationPress = async (item: NotificationItem) => {
    // Đánh dấu đã đọc
    if (!item.isRead) {
      try {
        await notificationApi.markAsRead(item._id);
        setNotifications(prev => 
          prev.map(n => n._id === item._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Điều hướng dựa trên type và referenceId
    if (item.type === 'LOAN' && item.referenceId) {
      navigation.navigate('LoanDetail' as any, { loanId: item.referenceId });
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'LOAN': return 'cash-outline';
      case 'TRANSACTION': return 'swap-horizontal-outline';
      case 'SYSTEM': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        { backgroundColor: item.isRead ? colors.darkBackground : colors.darkSurface }
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[
        styles.iconContainer, 
        { backgroundColor: item.isRead ? colors.darkBorder : colors.accentBlue + '20' }
      ]}>
        <Ionicons 
          name={getIconForType(item.type)} 
          size={24} 
          color={item.isRead ? colors.textGray : colors.accentBlue} 
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[
          styles.title, 
          { color: item.isRead ? colors.textGray : colors.textWhite, fontWeight: item.isRead ? 'normal' : 'bold' }
        ]}>
          {item.title}
        </Text>
        <Text style={[styles.message, { color: colors.textGray }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: colors.textGray }]}>
          {formatDate(new Date(item.createdAt))}
        </Text>
      </View>
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.accentBlue }]} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
          Thông báo {unreadCount > 0 && `(${unreadCount})`}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
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
          <Text style={[styles.emptyText, { color: colors.textGray }]}>Bạn chưa có thông báo nào</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});

export default NotificationScreen;
