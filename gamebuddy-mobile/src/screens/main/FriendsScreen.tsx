import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFriends, getPendingRequests, acceptFriendRequest, declineFriendRequest } from '../../services/friendshipService';
import { webSocketService } from '../../services/webSocketService';

const FriendsScreen = ({ navigation }: any) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
    const pulseAnim = new Animated.Value(1);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [friendsData, pendingData] = await Promise.all([
                getFriends(),
                getPendingRequests()
            ]);
            setFriends(friendsData || []);
            setPendingRequests(pendingData || []);
        } catch (error) {
            console.error(error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        const handleStatusUpdate = () => {
            fetchData(true);
        };
        webSocketService.addEventListener('status_update', handleStatusUpdate);
        return () => {
            webSocketService.removeEventListener('status_update', handleStatusUpdate);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });
        return unsubscribe;
    }, [navigation]);

    const handleAccept = async (userId: number) => {
        setActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await acceptFriendRequest(userId);
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleDecline = async (userId: number) => {
        setActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await declineFriendRequest(userId);
            setPendingRequests(prev => prev.filter(req => req.userId !== userId));
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const renderStoryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.storyItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.userId })}
        >
            <View style={styles.storyAvatarContainer}>
                <Image
                    source={{ uri: item.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.username }}
                    style={styles.storyAvatar}
                />
                {item.lookingForGroup && (
                    <View style={styles.onlineIndicator}>
                        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={styles.onlineDot} />
                    </View>
                )}
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>{item.username}</Text>
        </TouchableOpacity>
    );

    const renderRequestItem = ({ item }: { item: any }) => (
        <View style={styles.requestCard}>
            <TouchableOpacity
                style={styles.requestUserInfo}
                onPress={() => navigation.navigate('PublicProfile', { userId: item.userId })}
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: item.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.username }}
                    style={styles.requestAvatar}
                />
                <View>
                    <Text style={styles.requestUsername}>{item.username}</Text>
                    <Text style={styles.requestSubtext}>Sana arkadaşlık isteği gönderdi</Text>
                </View>
            </TouchableOpacity>
            <View style={styles.requestActions}>
                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item.userId)}
                    disabled={actionLoading[item.userId]}
                >
                    {actionLoading[item.userId] ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(item.userId)}
                    disabled={actionLoading[item.userId]}
                >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFriendItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.userId })}
        >
            <Image
                source={{ uri: item.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.username }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                {item.lookingForGroup && (
                    <View style={styles.lfgFriendBadge}>
                        <View style={styles.miniDotFriend} />
                        <Text style={styles.lfgFriendText}>Takım Arıyor</Text>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Arkadaşlar</Text>
                <Text style={styles.headerSubtitle}>Toplulukla etkileşimde kal</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={friends}
                    keyExtractor={(item) => item.userId.toString()}
                    renderItem={renderFriendItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color="#334155" />
                            <Text style={styles.emptyText}>Henüz hiç arkadaşın yok.</Text>
                            <Text style={styles.emptySubtext}>Keşfet sekmesinden oyuncuları bul ve arkadaşlık isteği gönder!</Text>
                        </View>
                    }
                    ListHeaderComponent={
                        <View>
                            {/* Bekleyen İstekler Paneli */}
                            {pendingRequests.length > 0 && (
                                <View style={styles.requestsSection}>
                                    <Text style={styles.requestsTitle}>
                                        İstekler <Text style={styles.requestsCount}>({pendingRequests.length})</Text>
                                    </Text>
                                    <FlatList
                                        data={pendingRequests}
                                        keyExtractor={(item) => item.id?.toString() || item.userId.toString()}
                                        renderItem={renderRequestItem}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}

                            {/* Yeni Eşleşenler Hikayeleri - Sadece Takım Arayanlar */}
                            {friends.filter(f => f.lookingForGroup).length > 0 && (
                                <View style={styles.storiesSection}>
                                    <Text style={styles.storiesTitle}>Takım Arıyor</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.storiesScroll}
                                        contentContainerStyle={styles.storiesContent}
                                    >
                                        {friends.filter(f => f.lookingForGroup).slice(0, 10).map((item, index) => (
                                            <View key={item.userId || index} style={styles.storyWrapper}>
                                                {renderStoryItem({ item })}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Arkadaşlar Bölümü Başlığı */}
                            {friends.length > 0 && (
                                <Text style={styles.sectionTitle}>Tüm Arkadaşların</Text>
                            )}
                        </View>
                    }
                    refreshing={loading}
                    onRefresh={fetchData}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: '#F8FAFC' },
    headerSubtitle: { fontSize: 16, color: '#94A3B8', marginTop: 4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingBottom: 20 },
    // İstekler Bölümü
    requestsSection: { marginBottom: 20, paddingHorizontal: 20 },
    requestsTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 12 },
    requestsCount: { color: '#3B82F6', fontSize: 16 },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10
    },
    requestUserInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    requestAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0F172A', marginRight: 12 },
    requestUsername: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
    requestSubtext: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    requestActions: { flexDirection: 'row', alignItems: 'center' },
    acceptButton: {
        backgroundColor: '#10B981',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    declineButton: {
        backgroundColor: '#EF4444',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    // Hikayeler Bölümü
    storiesSection: { marginBottom: 20 },
    storiesTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 12, paddingHorizontal: 20 },
    storiesScroll: { paddingLeft: 20 },
    storiesContent: { paddingRight: 20 },
    storyWrapper: { marginRight: 16 },
    storyItem: { alignItems: 'center' },
    storyAvatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#BB86FC',
        padding: 2,
        marginBottom: 6
    },
    storyAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#0F172A'
    },
    storyUsername: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 70,
        textAlign: 'center'
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pulseRing: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(16, 185, 129, 0.4)'
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981'
    },
    // Bölüm Başlığı
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F8FAFC',
        marginBottom: 12,
        paddingHorizontal: 20
    },
    // Arkadaş Kartı
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 20, padding: 16, marginHorizontal: 20, marginBottom: 16 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F172A', marginRight: 15 },
    userInfo: { flex: 1 },
    username: { fontSize: 18, fontWeight: '900', color: '#F8FAFC', marginBottom: 4 },
    lfgFriendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
    miniDotFriend: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
    lfgFriendText: { fontSize: 10, color: '#10B981', fontWeight: '800' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
    emptyText: { color: '#64748B', marginTop: 15, fontSize: 15, textAlign: 'center' },
    emptySubtext: { color: '#475569', marginTop: 8, fontSize: 13, textAlign: 'center' }
});

export default FriendsScreen;
