import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type ChatDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChatDetail'>;
  route: RouteProp<RootStackParamList, 'ChatDetail'>;
};

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: Date;
}

const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { name } = route.params;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      sender: 'other',
      timestamp: new Date('2024-01-20T10:00:00'),
    },
    {
      id: '2',
      text: 'Tôi muốn hỏi về khoản vay của mình',
      sender: 'me',
      timestamp: new Date('2024-01-20T10:05:00'),
    },
    {
      id: '3',
      text: 'Vâng, bạn có thể cho tôi biết mã khoản vay không?',
      sender: 'other',
      timestamp: new Date('2024-01-20T10:06:00'),
    },
    {
      id: '4',
      text: 'Mã khoản vay của tôi là #001',
      sender: 'me',
      timestamp: new Date('2024-01-20T10:10:00'),
    },
    {
      id: '5',
      text: 'Cảm ơn bạn. Tôi kiểm tra và thấy khoản vay của bạn đang trong trạng thái "Đang xử lý". Dự kiến sẽ được duyệt trong 24h tới.',
      sender: 'other',
      timestamp: new Date('2024-01-20T10:15:00'),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'me',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.messageContainerMe : styles.messageContainerOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe 
              ? [styles.messageBubbleMe, { backgroundColor: colors.accentBlue }] 
              : [styles.messageBubbleOther, { backgroundColor: colors.darkSurface }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: colors.textWhite },
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text style={[styles.messageTime, { color: colors.textGray }]}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.darkBorder }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerName, { color: colors.textWhite }]}>{name}</Text>
          <Text style={[styles.headerStatus, { color: colors.greenSuccess }]}>Đang hoạt động</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={[styles.moreButtonText, { color: colors.textGray }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.inputContainer, { borderTopColor: colors.darkBorder, backgroundColor: colors.darkBackground }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.darkSurface, color: colors.textWhite }]}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.textGray}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? colors.accentBlue : colors.darkSurface },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={[styles.sendButtonText, { color: colors.textWhite }]}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 20,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageContainerOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleMe: {
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    fontSize: 18,
  },
});

export default ChatDetailScreen;
