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
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants';
import { useThemeStore } from '../../stores';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const FloatingChatButton: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you with your child\'s health today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I understand your question. This is a placeholder response. In the production version, this will be connected to an AI assistant that can help you with health advice, vaccination schedules, and more.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
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
                  { backgroundColor: inputText.trim() === '' ? colors.gray[300] : colors.primary },
                ]}
                onPress={handleSend}
                disabled={inputText.trim() === ''}
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
