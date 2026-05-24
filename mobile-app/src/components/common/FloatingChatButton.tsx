/**
 * Floating Chat Button Component
 * 
 * A floating action button positioned at the bottom-right corner
 * that opens an AI chat interface
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Animated,
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

type TextPart = {
  text: string;
  bold: boolean;
};

const parseBoldSegments = (text: string): TextPart[] => {
  const parts: TextPart[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(text)) !== null) {
    const [fullMatch, boldText] = match;
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push({ text: text.slice(lastIndex, matchIndex), bold: false });
    }

    if (boldText) {
      parts.push({ text: boldText, bold: true });
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  return parts.length ? parts : [{ text, bold: false }];
};

const parseMessageLines = (text: string) =>
  text.split(/\r?\n/).map((line) => line.trimEnd());

const getBulletMarker = (line: string) => {
  const match = line.match(/^(\d+\.|[-*•])\s+/);
  return match ? match[1] : null;
};

const stripBulletMarker = (line: string) => line.replace(/^(\d+\.|[-*•])\s+/, '');

const TypingIndicator: React.FC<{ color: string }> = ({ color }) => {
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const createPulse = (animatedValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.2,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      );

    const animation = Animated.parallel([
      createPulse(dot1, 0),
      createPulse(dot2, 120),
      createPulse(dot3, 240),
    ]);

    animation.start();
    return () => {
      animation.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, { backgroundColor: color, opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: color, opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: color, opacity: dot3 }]} />
    </View>
  );
};

export const FloatingChatButton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const renderedMessages = useMemo(() => messages, [messages]);
  const canSend = inputText.trim() !== '' && !isSending;
  const keyboardOffset = Platform.OS === 'ios' ? insets.top + 12 : 0;

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
          keyboardVerticalOffset={keyboardOffset}
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {renderedMessages.map((message) => (
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
                  <View
                    style={[
                      styles.messageText,
                      message.isUser
                        ? [styles.userMessageText, { backgroundColor: colors.primary }]
                        : [styles.aiMessageText, { backgroundColor: colors.gray[100] }],
                    ]}
                  >
                    {message.isUser ? (
                      <Text style={[styles.inlineText, { color: colors.white }]}>{message.text}</Text>
                    ) : (
                      <View style={styles.richMessage}>
                        {parseMessageLines(message.text).map((line, index) => {
                          if (!line.trim()) {
                            return <View key={`${message.id}-line-${index}`} style={styles.paragraphSpacer} />;
                          }

                          const bulletMarker = getBulletMarker(line);
                          const content = bulletMarker ? stripBulletMarker(line) : line;
                          const parts = parseBoldSegments(content);

                          return (
                            <View
                              key={`${message.id}-line-${index}`}
                              style={[styles.lineRow, bulletMarker ? styles.bulletRow : styles.paragraphRow]}
                            >
                              {bulletMarker && (
                                <Text style={[styles.bulletSymbol, { color: colors.textPrimary }]}>
                                  {bulletMarker === '-' || bulletMarker === '*' ? '•' : bulletMarker}
                                </Text>
                              )}
                              <Text style={[styles.inlineText, { color: colors.textPrimary }]}>
                                {parts.map((part, partIndex) => (
                                  <Text
                                    key={`${message.id}-part-${index}-${partIndex}`}
                                    style={part.bold ? styles.boldText : undefined}
                                  >
                                    {part.text}
                                  </Text>
                                ))}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                  <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))}
            {isSending && (
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <View style={[styles.aiAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                </View>
                <View style={styles.messageContent}>
                  <View
                    style={[
                      styles.messageText,
                      styles.aiMessageText,
                      { backgroundColor: colors.gray[100] },
                    ]}
                  >
                    <TypingIndicator color={colors.primary} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SPACING.sm, backgroundColor: colors.white, borderTopColor: colors.gray[200] }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.gray[50], borderColor: colors.gray[200] }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
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
                  canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
                  { backgroundColor: canSend ? colors.primary : colors.gray[300] },
                ]}
                onPress={handleSend}
                disabled={!canSend}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={canSend ? colors.white : colors.gray[400]}
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
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  inlineText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  richMessage: {
    gap: SPACING.xs,
  },
  paragraphSpacer: {
    height: SPACING.xs,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paragraphRow: {
    paddingVertical: 2,
  },
  bulletRow: {
    paddingVertical: 2,
  },
  bulletSymbol: {
    marginRight: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
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
    flexShrink: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
