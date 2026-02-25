import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatDate } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';

type MessagesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Messages'>;
};

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();

  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'Hỗ trợ khách hàng',
      avatar: '🎧',
      lastMessage: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm.',
      timestamp: new Date('2024-01-20T10:30:00'),
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Nguyễn Văn A',
      avatar: '👤',
      lastMessage: 'Tôi đã chuyển tiền rồi, bạn kiểm tra giúp nhé.',
      timestamp: new Date('2024-01-19T15:45:00'),
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: '3',
      name: 'Trần Thị B',
      avatar: '👩',
      lastMessage: 'Khoản vay của tôi đã được duyệt chưa?',
      timestamp: new Date('2024-01-18T09:00:00'),
      unreadCount: 1,
      isOnline: true,
    },
    {
      id: '4',
      name: 'Thông báo hệ thống',
      avatar: '🔔',
      lastMessage: 'Khoản vay #001 đã được thanh toán thành công.',
      timestamp: new Date('2024-01-17T12:00:00'),
      unreadCount: 5,
      isOnline: false,
    },
  ];

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return formatDate(date);
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() =>
        navigation.navigate('ChatDetail', {
          conversationId: item.id,
          name: item.name,
        })
      }
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.darkSurface }]}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        {item.isOnline && <View style={[styles.onlineIndicator, { backgroundColor: colors.greenSuccess, borderColor: colors.darkBackground }]} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, { color: colors.textWhite }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.conversationTime, { color: colors.textGray }]}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={styles.conversationFooter}>
          <Text
            style={[
              styles.lastMessage,
              { color: colors.textGray },
              item.unreadCount > 0 && { color: colors.textWhite, fontWeight: '500' },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.accentBlue }]}>
              <Text style={[styles.unreadCount, { color: colors.textWhite }]}>
                {item.unreadCount > 9 ? '9+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.darkBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Tin nhắn</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Conversations List */}
      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyTitle, { color: colors.textWhite }]}>Chưa có tin nhắn</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
            Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây
          </Text>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {},
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MessagesScreen;
