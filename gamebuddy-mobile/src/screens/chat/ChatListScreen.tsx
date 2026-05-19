import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getConversations } from '../../services/chatService';
import { webSocketService } from '../../services/webSocketService';

const ChatListScreen = ({ navigation }: any) => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const fetchConversations = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getConversations();
            setConversations(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        const handleEvent = () => {
            fetchConversations(true);
        };
        webSocketService.addEventListener('message', handleEvent);
        webSocketService.addEventListener('status_update', handleEvent);
        webSocketService.addEventListener('read_receipt', handleEvent);

        return () => {
            webSocketService.removeEventListener('message', handleEvent);
            webSocketService.removeEventListener('status_update', handleEvent);
            webSocketService.removeEventListener('read_receipt', handleEvent);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchConversations();
        });
        return unsubscribe;
    }, [navigation]);

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffHours < 48) {
            return 'Dün';
        } else {
            return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
        }
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <TouchableOpacity
            style={styles.chatCard}
            onPress={() => navigation.navigate('ChatRoom', {
                userId: item.userId,
                username: item.username,
                avatarUrl: item.avatarUrl,
                lookingForGroup: item.lookingForGroup
            })}
            activeOpacity={0.7}
        >
            <View style={styles.chatInfo}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: (item.avatarUrl && item.avatarUrl.length > 0) ? item.avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username.toLowerCase()}` }}
                        style={styles.avatar}
                    />
                    {item.lookingForGroup && (
                        <View style={styles.onlineWrapper}>
                            <Animated.View style={[styles.onlinePulse, { transform: [{ scale: pulseAnim }] }]} />
                            <View style={styles.onlineDot} />
                        </View>
                    )}
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
                        <Text style={[styles.timeText, item.unreadCount > 0 && styles.timeTextUnread]}>
                            {formatTime(item.lastMessageTime)}
                        </Text>
                    </View>

                    <View style={styles.messageRow}>
                        <Text
                            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessageText]}
                            numberOfLines={1}
                        >
                            {item.lastMessage || 'Mesajlaşmaya başlayın...'}
                        </Text>
                        {item.unreadCount > 0 && (
                            <LinearGradient
                                colors={['#818CF8', '#6366F1']}
                                style={styles.unreadBadge}
                            >
                                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                            </LinearGradient>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                    <Text style={styles.headerSubtitle}>
                        {conversations.length > 0
                            ? `${conversations.length} sohbet`
                            : 'Sohbetleriniz burada görünür'}
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#818CF8" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.userId.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconWrapper}>
                                <LinearGradient
                                    colors={['rgba(129,140,248,0.15)', 'rgba(99,102,241,0.05)']}
                                    style={styles.emptyIconBg}
                                >
                                    <Ionicons name="chatbubbles-outline" size={48} color="#818CF8" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.emptyText}>Henüz bir mesajlaşma yok</Text>
                            <Text style={styles.emptySubtext}>
                                Arkadaşlar sayfasından bir arkadaşını seçip mesaj gönderebilirsin!
                            </Text>
                        </View>
                    }
                    refreshing={loading}
                    onRefresh={fetchConversations}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerTitle: { fontSize: 32, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.3 },
    headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '500' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
    separator: { height: 2 },

    // Chat Card
    chatCard: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    chatInfo: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { position: 'relative', marginRight: 14 },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0F172A',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    onlineWrapper: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlinePulse: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(16,185,129,0.35)',
    },
    onlineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#1E293B',
    },

    contentContainer: { flex: 1 },
    nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    username: { fontSize: 16, fontWeight: '800', color: '#F8FAFC', flex: 1, marginRight: 8 },
    timeText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    timeTextUnread: { color: '#818CF8', fontWeight: '700' },

    messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMessage: { fontSize: 14, color: '#64748B', flex: 1, marginRight: 10, fontWeight: '400' },
    unreadMessageText: { color: '#CBD5E1', fontWeight: '600' },

    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },

    // Empty State
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconWrapper: { marginBottom: 20 },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    emptySubtext: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

export default ChatListScreen;