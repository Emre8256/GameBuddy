import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { discoverPlayers } from '../../services/profileService';
import { sendFriendRequest, getFriendshipStatus, acceptFriendRequest } from '../../services/friendshipService';
import { webSocketService } from '../../services/webSocketService';

const GamePlayersScreen = ({ route, navigation }: any) => {
    const { gameName, gameImage } = route.params;
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

    const fetchPlayers = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await discoverPlayers(gameName);
            setPlayers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPlayers(players.length > 0);
        }, [gameName])
    );

    useEffect(() => {
        const handleStatusUpdate = () => {
            fetchPlayers(true);
        };
        webSocketService.addEventListener('status_update', handleStatusUpdate);
        return () => {
            webSocketService.removeEventListener('status_update', handleStatusUpdate);
        };
    }, [gameName]);

    const handleSendRequest = async (userId: number) => {
        setActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await sendFriendRequest(userId);
            setPlayers(prev =>
                prev.map(p =>
                    p.userId === userId ? { ...p, friendshipStatus: 'PENDING' } : p
                )
            );
        } catch (err: any) {
            Alert.alert('Hata', err.toString());
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleAcceptRequest = async (userId: number) => {
        setActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await acceptFriendRequest(userId);
            setPlayers(prev =>
                prev.map(p =>
                    p.userId === userId ? { ...p, friendshipStatus: 'ACCEPTED' } : p
                )
            );
        } catch (err: any) {
            Alert.alert('Hata', err.toString());
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const renderActionButton = (item: any) => {
        const status = item.friendshipStatus;
        const userId = item.userId;
        const isLoading = actionLoading[userId];

        if (status === 'SELF') {
            return (
                <View style={styles.actionButtonDisabled}>
                    <Ionicons name="person" size={18} color="#64748B" />
                </View>
            );
        }

        if (status === 'ACCEPTED') {
            return (
                <TouchableOpacity
                    style={styles.actionButtonSuccess}
                    onPress={() => navigation.navigate('ChatRoom', { userId: item.userId, username: item.username, avatarUrl: item.avatarUrl, lookingForGroup: item.lookingForGroup })}
                >
                    <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            );
        }

        if (status === 'PENDING') {
            return (
                <View style={styles.actionButtonPending}>
                    <Text style={styles.pendingText}>İstek Gönderildi</Text>
                </View>
            );
        }

        if (status === 'PENDING_RECEIVED') {
            return (
                <TouchableOpacity
                    style={styles.actionButtonAccept}
                    onPress={() => handleAcceptRequest(userId)}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                style={styles.actionButtonAdd}
                onPress={() => handleSendRequest(userId)}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                )}
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardContent}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PublicProfile', { userId: item.userId })}
            >
                <Image 
                    source={{ uri: (item.avatarUrl && item.avatarUrl.length > 0) ? item.avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username.toLowerCase()}` }} 
                    style={styles.avatar} 
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    {item.lookingForGroup && (
                        <View style={styles.lfgBadge}>
                            <View style={styles.miniDot} />
                            <Text style={styles.lfgText}>Takım Arkadaşı Arıyor</Text>
                        </View>
                    )}
                    <Text style={styles.subText}>Ortak Oyunlar: {item.commonGames?.length || 0}</Text>
                </View>
            </TouchableOpacity>
            <View style={styles.actionContainer}>
                {renderActionButton(item)}
            </View>
        </View>
    );

    return (
        <ImageBackground 
            source={{ uri: gameImage }} 
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.container} edges={['top']}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={28} color="#F8FAFC" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>{gameName}</Text>
                            <Text style={styles.headerSubtitle}>Oyuncuları Keşfet</Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>
                    ) : (
                        <FlatList
                            data={players}
                            keyExtractor={(item) => item.userId.toString()}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="game-controller-outline" size={60} color="#334155" />
                                    <Text style={styles.emptyText}>Bu oyunu oynayan kimse bulunamadı.</Text>
                                </View>
                            }
                            refreshing={loading}
                            onRefresh={() => fetchPlayers(true)}
                        />
                    )}
                </SafeAreaView>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    backButton: { marginRight: 15 },
    headerTitle: { 
        fontSize: 24, 
        fontWeight: '900', 
        color: '#F8FAFC',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerSubtitle: { fontSize: 14, color: '#CBD5E1', marginTop: 2, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#1E293B', // Daha belirgin yaptık
        borderRadius: 22, 
        padding: 16, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        // Gölge efekti
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatar: { 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: '#0F172A', 
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    userInfo: { flex: 1 },
    username: { 
        fontSize: 18, 
        fontWeight: '900', 
        color: '#F8FAFC', 
        marginBottom: 2,
    },
    lfgBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 2 },
    miniDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
    lfgText: { fontSize: 11, color: '#10B981', fontWeight: '800', textTransform: 'uppercase' },
    subText: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
    actionContainer: { marginLeft: 10 },
    actionButtonAdd: {
        backgroundColor: '#3B82F6',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    actionButtonSuccess: {
        backgroundColor: '#10B981',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    actionButtonAccept: {
        backgroundColor: '#10B981',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3
    },
    actionButtonPending: {
        backgroundColor: '#334155',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
        height: 44
    },
    actionButtonDisabled: {
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    },
    pendingText: { fontSize: 10, color: '#CBD5E1', fontWeight: '700', textAlign: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#F8FAFC', marginTop: 15, fontSize: 15, textAlign: 'center', fontWeight: '600' }
});

export default GamePlayersScreen;
