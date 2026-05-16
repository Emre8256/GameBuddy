import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserProfile } from '../../services/profileService';
import { getChatHistory, sendMessage } from '../../services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ChatRoomScreen = ({ route, navigation }: any) => {
    const { userId, username, lookingForGroup: initialLfg, avatarUrl: initialAvatarUrl } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [targetUser, setTargetUser] = useState<any>({
        lookingForGroup: initialLfg,
        avatarUrl: initialAvatarUrl
    });
    const flatListRef = useRef<FlatList>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sendBtnScale = useRef(new Animated.Value(1)).current;

    const quickReplies = ["Geliyorum!", "Hangi oyun?", "DC var mı?", "1 dk", "Sonra konuşalım", "GG WP"];

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const fetchTargetUser = async () => {
        try {
            const profile = await getUserProfile(userId);
            if (profile) {
                setTargetUser({
                    lookingForGroup: profile.lookingForGroup,
                    avatarUrl: profile.avatarUrl
                });
            }
        } catch (error) {
            console.error('Error fetching target user profile:', error);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setCurrentUserId(userData.userId);
            }
            fetchHistory();
            fetchTargetUser();
        };
        init();

        const interval = setInterval(() => {
            fetchHistory(false);
            fetchTargetUser();
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getChatHistory(userId);
            setMessages(data);
        } catch (error) {
            // Error handled silently
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!content.trim()) return;
        const msgText = content.trim();
        setContent('');

        // Button press animation
        Animated.sequence([
            Animated.timing(sendBtnScale, { toValue: 0.85, duration: 60, useNativeDriver: true }),
            Animated.timing(sendBtnScale, { toValue: 1, duration: 60, useNativeDriver: true }),
        ]).start();

        try {
            await sendMessage(userId, msgText);
            fetchHistory(false);
        } catch (error) {
            // Send error handled silently
        }
    };

    const handleQuickReply = async (reply: string) => {
        try {
            await sendMessage(userId, reply);
            fetchHistory(false);
        } catch (error) {
            // Quick reply error handled silently
        }
    };

    const formatMessageTime = (timeStr: string) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMe = item.senderId === currentUserId;
        const isRead = item.isRead || item.read;

        return (
            <View style={[styles.messageWrapper, isMe ? styles.wrapperMe : styles.wrapperThem]}>
                {isMe ? (
                    <LinearGradient
                        colors={['#818CF8', '#6366F1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.messageBubble, styles.bubbleMe]}
                    >
                        <Text style={[styles.messageText, styles.textMe]}>
                            {item.content}
                        </Text>
                        <View style={styles.messageFooter}>
                            <Text style={styles.messageTimeMe}>
                                {formatMessageTime(item.sentAt || item.timestamp)}
                            </Text>
                            <Ionicons
                                name={isRead ? "checkmark-done" : "checkmark"}
                                size={14}
                                color={isRead ? "#C7D2FE" : "rgba(255,255,255,0.5)"}
                                style={styles.readIcon}
                            />
                        </View>
                    </LinearGradient>
                ) : (
                    <View style={[styles.messageBubble, styles.bubbleThem]}>
                        <Text style={[styles.messageText, styles.textThem]}>
                            {item.content}
                        </Text>
                        <View style={styles.messageFooter}>
                            <Text style={styles.messageTimeThem}>
                                {formatMessageTime(item.sentAt || item.timestamp)}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* ── HEADER ── */}
            <SafeAreaView style={styles.headerContainer} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color="#F8FAFC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.userInfo}
                        onPress={() => navigation.navigate('PublicProfile', { userId })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.headerAvatarWrap}>
                            <Image
                                source={{ uri: (targetUser.avatarUrl && targetUser.avatarUrl.length > 0) ? targetUser.avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username.toLowerCase()}` }}
                                style={styles.headerAvatar}
                            />
                            {targetUser.lookingForGroup && (
                                <View style={styles.headerOnlineWrap}>
                                    <Animated.View style={[styles.headerPulse, { transform: [{ scale: pulseAnim }] }]} />
                                    <View style={styles.headerOnlineDot} />
                                </View>
                            )}
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle} numberOfLines={1}>{username}</Text>
                            <Text style={[styles.statusText, targetUser.lookingForGroup && styles.statusTextActive]}>
                                {targetUser.lookingForGroup ? 'Takım Arkadaşı Arıyor' : 'Sohbet Modu'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerAction}
                        onPress={() => navigation.navigate('PublicProfile', { userId })}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="person-circle-outline" size={26} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* ── CHAT BODY ── */}
            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#818CF8" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        ListEmptyComponent={
                            <View style={styles.emptyChatContainer}>
                                <View style={styles.emptyChatIconBg}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={36} color="#818CF8" />
                                </View>
                                <Text style={styles.emptyChatTitle}>Sohbete Başla</Text>
                                <Text style={styles.emptyChatSub}>
                                    {username} ile mesajlaşmaya başlamak için bir mesaj gönder veya hızlı yanıt kullan.
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* ── BOTTOM INPUT ── */}
                <View style={styles.bottomSection}>
                    {/* Quick Replies */}
                    <View style={styles.quickRepliesSection}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.quickRepliesContent}
                        >
                            {quickReplies.map((reply, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.quickReplyButton}
                                    onPress={() => handleQuickReply(reply)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.quickReplyText}>{reply}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Input Row */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Bir mesaj yazın..."
                                placeholderTextColor="#475569"
                                value={content}
                                onChangeText={setContent}
                                multiline
                            />
                            <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
                                <TouchableOpacity
                                    onPress={handleSend}
                                    disabled={!content.trim()}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={content.trim() ? ['#818CF8', '#6366F1'] : ['#1E293B', '#1E293B']}
                                        style={styles.sendButton}
                                    >
                                        <Ionicons
                                            name="send"
                                            size={18}
                                            color={content.trim() ? '#FFFFFF' : '#475569'}
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },

    // ── Header ──
    headerContainer: {
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
            android: { elevation: 6 },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatarWrap: {
        position: 'relative',
        marginRight: 12,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#0F172A',
        borderWidth: 2,
        borderColor: 'rgba(129,140,248,0.3)',
    },
    headerOnlineWrap: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerPulse: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(16,185,129,0.35)',
    },
    headerOnlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#1E293B',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#F8FAFC',
    },
    statusText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 1,
    },
    statusTextActive: {
        color: '#10B981',
    },
    headerAction: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Chat ──
    chatContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexGrow: 1,
    },

    // Empty Chat
    emptyChatContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 80,
    },
    emptyChatIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(129,140,248,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyChatTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptyChatSub: {
        color: '#475569',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    // ── Messages ──
    messageWrapper: {
        width: '100%',
        marginVertical: 3,
    },
    wrapperMe: {
        alignItems: 'flex-end',
    },
    wrapperThem: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleMe: {
        borderBottomRightRadius: 6,
    },
    bubbleThem: {
        backgroundColor: '#1E293B',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    textMe: {
        color: '#FFFFFF',
    },
    textThem: {
        color: '#E2E8F0',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    messageTimeMe: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },
    messageTimeThem: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    readIcon: {
        marginLeft: 4,
    },

    // ── Bottom Section ──
    bottomSection: {
        backgroundColor: '#1E293B',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.04)',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    quickRepliesSection: {
        paddingVertical: 10,
    },
    quickRepliesContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    quickReplyButton: {
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: 'rgba(129,140,248,0.15)',
    },
    quickReplyText: {
        color: '#818CF8',
        fontSize: 13,
        fontWeight: '700',
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 15,
        paddingVertical: 10,
        maxHeight: 100,
    },
    sendButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default ChatRoomScreen;
