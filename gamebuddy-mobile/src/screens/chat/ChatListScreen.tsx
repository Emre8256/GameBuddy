import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFriends } from '../../services/friendshipService';

const ChatListScreen = ({ navigation }: any) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const data = await getFriends();
            setFriends(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFriends();
        });
        return unsubscribe;
    }, [navigation]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatCard}
            onPress={() => navigation.navigate('ChatRoom', {
                userId: item.userId,
                username: item.username,
                avatarUrl: item.avatarUrl,
                status: item.status
            })}
            activeOpacity={0.8}
        >
            <View style={styles.chatInfo}>
                <Image
                    source={{ uri: (item.avatarUrl && item.avatarUrl.length > 0) ? item.avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username.toLowerCase()}` }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, item.status === 'Online' ? styles.dotOnline : item.status === 'In-Game' ? styles.dotInGame : styles.dotOffline]} />
                        <Text style={styles.statusText}>
                            {item.status === 'Online' ? 'Müsait' : item.status === 'In-Game' ? 'Oyunda' : 'Çevrimdışı'}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mesajlar</Text>
            </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={friends}
                    keyExtractor={(item) => item.userId.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color="#334155" />
                            <Text style={styles.emptyText}>Henüz arkadaşın yok.</Text>
                            <Text style={styles.emptySubtext}>Keşfet sekmesinden oyuncuları bul, arkadaşlık isteği gönder ve mesajlaşmaya başla!</Text>
                        </View>
                    }
                    refreshing={loading}
                    onRefresh={fetchFriends}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    chatCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 18, marginBottom: 16 },
    chatInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F172A', marginRight: 15 },
    userInfo: { flex: 1 },
    username: { fontSize: 18, fontWeight: '900', color: '#F8FAFC', marginBottom: 4 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    dotOnline: { backgroundColor: '#10B981' },
    dotInGame: { backgroundColor: '#F59E0B' },
    dotOffline: { backgroundColor: '#64748B' },
    statusText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
    emptyText: { color: '#64748B', marginTop: 15, fontSize: 15, textAlign: 'center' },
    emptySubtext: { color: '#475569', marginTop: 8, fontSize: 13, textAlign: 'center', lineHeight: 20 }
});

export default ChatListScreen;