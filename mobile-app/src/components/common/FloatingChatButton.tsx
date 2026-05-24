/**
 * Floating Chat Button Component
 * 
 * A floating action button positioned at the bottom-right corner
 * that opens an AI chat interface
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants';
import { useThemeStore } from '../../stores';
import { sendChatMessage } from '../../services';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const FloatingChatButton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (trimmed === '' || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: trimmed,
      isUser: true,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText('');
    setIsSending(true);

    try {
      const aiMessages = nextMessages.map((message) => ({
        role: message.isUser ? 'user' : 'assistant',
        content: message.text,
      }));

      const aiResponse = await sendChatMessage(aiMessages);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to reach the AI assistant. Please try again.';

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: message,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { bottom: insets.bottom + 20, backgroundColor: colors.primary }]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[styles.chatHeader, { paddingTop: insets.top + SPACING.sm, backgroundColor: colors.white, borderBottomColor: colors.gray[200] }]}>
            <View style={styles.chatHeaderContent}>
              <View style={styles.chatHeaderLeft}>
                <View style={[styles.aiIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.chatTitle, { color: colors.textPrimary }]}>AI Assistant</Text>
                  <Text style={[styles.chatSubtitle, { color: colors.success }]}>Online</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.aiMessage,
                ]}
              >
                {!message.isUser && (
                  <View style={[styles.aiAvatar, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                  </View>
                )}
                <View style={styles.messageContent}>
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser 
                        ? [styles.userMessageText, { backgroundColor: colors.primary, color: colors.white }] 
                        : [styles.aiMessageText, { backgroundColor: colors.gray[100], color: colors.textPrimary }],
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SPACING.sm, backgroundColor: colors.white, borderTopColor: colors.gray[200] }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.gray[100], color: colors.textPrimary }]}
                placeholder="Type a message..."
                placeholderTextColor={colors.gray[400]}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: inputText.trim() === '' || isSending ? colors.gray[300] : colors.primary },
                ]}
                onPress={handleSend}
                disabled={inputText.trim() === '' || isSending}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() === '' ? colors.gray[400] : colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
  },
  chatHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  chatSubtitle: {
    fontSize: FONT_SIZE.xs,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  messageBubble: {
    flexDirection: 'row',
    gap: SPACING.sm,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  userMessageText: {
    borderBottomRightRadius: 4,
  },
  aiMessageText: {
    borderBottomLeftRadius: 4,
  },
  messageTime: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
