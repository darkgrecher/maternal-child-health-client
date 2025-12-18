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

import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const FloatingChatButton: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
        style={[styles.floatingButton, { bottom: insets.bottom + 20 }]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[styles.chatHeader, { paddingTop: insets.top + SPACING.sm }]}>
            <View style={styles.chatHeaderContent}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.aiIconContainer}>
                  <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.chatTitle}>AI Assistant</Text>
                  <Text style={styles.chatSubtitle}>Online</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
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
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.messageContent}>
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.userMessageText : styles.aiMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                  <Text style={styles.messageTime}>
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
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SPACING.sm }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim() === '' && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={inputText.trim() === ''}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() === '' ? COLORS.gray[400] : COLORS.white}
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatHeader: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
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
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  chatSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
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
    backgroundColor: COLORS.primaryLight,
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
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    borderBottomRightRadius: 4,
  },
  aiMessageText: {
    backgroundColor: COLORS.gray[100],
    color: COLORS.textPrimary,
    borderBottomLeftRadius: 4,
  },
  messageTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
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
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    maxHeight: 100,
    color: COLORS.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
});
