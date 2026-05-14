import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile } from '../../services/profileService';
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '../../services/friendshipService';

const PublicProfileScreen = ({ route, navigation }: any) => {
    const { userId } = route.params;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [unfriendModalVisible, setUnfriendModalVisible] = useState(false);

    const fetchProfile = async () => {
        try {
            const data = await getUserProfile(userId);
            setProfile(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchProfile();
    }, [userId]);

    const handleSendRequest = async () => {
        setActionLoading(true);
        try {
            await sendFriendRequest(userId);
            await fetchProfile();
        } catch (err: any) {
            Alert.alert('Hata', err.toString());
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptRequest = async () => {
        setActionLoading(true);
        try {
            await acceptFriendRequest(userId);
            await fetchProfile();
        } catch (err: any) {
            Alert.alert('Hata', err.toString());
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeclineRequest = async () => {
        setActionLoading(true);
        try {
            await declineFriendRequest(userId);
            await fetchProfile();
        } catch (err: any) {
            Alert.alert('Hata', err.toString());
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnfriend = async () => {
        setUnfriendModalVisible(false);
        setActionLoading(true);
        try {
            console.log("Unfriend confirmed for userId:", userId);
            const res = await removeFriend(userId);
            console.log("Unfriend success:", res);
            await fetchProfile();
        } catch (err: any) {
            console.error("Unfriend error:", err);
            Alert.alert('Hata', err.toString());
        } finally {
            setActionLoading(false);
        }
    };

    const renderActionButtons = () => {
        const status = profile?.friendshipStatus;

        if (status === 'SELF') {
            return (
                <View style={[styles.actionButton, { backgroundColor: '#64748B' }]}>
                    <Ionicons name="person" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.actionButtonText}>Kendin</Text>
                </View>
            );
        }

        if (status === 'ACCEPTED') {
            return (
                <View style={styles.multiActionContainer}>
                    <TouchableOpacity
                        style={[styles.multiActionButton, { backgroundColor: '#3B82F6', flex: 0.7 }]}
                        onPress={() => navigation.navigate('ChatRoom', { userId: profile.userId, username: profile.username, avatarUrl: profile.avatarUrl, status: profile.status })}
                        disabled={actionLoading}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.multiActionButtonText}>Mesaj</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.multiActionButton, { backgroundColor: '#334155', flex: 0.3 }]}
                        onPress={() => setUnfriendModalVisible(true)}
                        disabled={actionLoading}
                        activeOpacity={0.7}
                    >
                        {actionLoading ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Ionicons name="person-remove" size={24} color="#EF4444" />
                        )}
                    </TouchableOpacity>
                </View>
            );
        }

        if (status === 'PENDING') {
            return (
                <View style={[styles.actionButton, { backgroundColor: '#64748B' }]}>
                    <Ionicons name="hourglass" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.actionButtonText}>İstek Gönderildi</Text>
                </View>
            );
        }

        if (status === 'PENDING_RECEIVED') {
            return (
                <View style={styles.multiActionContainer}>
                    <TouchableOpacity
                        style={[styles.multiActionButton, { backgroundColor: '#10B981' }]}
                        onPress={handleAcceptRequest}
                        disabled={actionLoading}
                    >
                        <Ionicons name="checkmark" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.multiActionButtonText}>Kabul Et</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.multiActionButton, { backgroundColor: '#EF4444' }]}
                        onPress={handleDeclineRequest}
                        disabled={actionLoading}
                    >
                        <Ionicons name="close" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.multiActionButtonText}>Reddet</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                onPress={handleSendRequest}
                disabled={actionLoading}
            >
                {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <>
                        <Ionicons name="person-add" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
                        <Text style={styles.actionButtonText}>Arkadaş Ekle</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    if (loading || !profile) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    const gamesList = profile.favoriteGames ? profile.favoriteGames.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0) : [];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#F8FAFC" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileSection}>
                    <Image
                        source={{ uri: (profile.avatarUrl && profile.avatarUrl.length > 0) ? profile.avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username.toLowerCase()}` }}
                        style={styles.avatar}
                    />
                    <Text style={styles.usernameText}>{profile.username}</Text>

                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, profile.status === 'Online' ? styles.dotOnline : profile.status === 'In-Game' ? styles.dotInGame : styles.dotOffline]} />
                        <Text style={styles.statusBadgeText}>
                            {profile.status === 'Online' ? 'Müsait' : profile.status === 'In-Game' ? 'Oyunda' : 'Çevrimdışı'}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.sectionTitle}>Biyografi</Text>
                    <Text style={styles.bioText}>{profile.bio || 'Bu oyuncu henüz bir biyografi eklemedi.'}</Text>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.sectionTitle}>Oynadığı Oyunlar</Text>
                    <View style={styles.tagsContainer}>
                        {gamesList.map((game: string, index: number) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{game}</Text>
                            </View>
                        ))}
                        {gamesList.length === 0 && (
                            <Text style={styles.bioText}>Henüz oyun eklenmemiş.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {renderActionButtons()}
            </View>
            <Modal animationType="slide" transparent={true} visible={unfriendModalVisible} onRequestClose={() => setUnfriendModalVisible(false)}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Ionicons name="warning" size={24} color="#F59E0B" style={{ marginRight: 8 }} />
                            <Text style={styles.modalTitle}>Arkadaşlıktan Çıkar</Text>
                        </View>
                        <Text style={styles.modalText}>{profile?.username || 'Bu'} kişisini arkadaşlıktan çıkarmak istediğine emin misin?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.buttonCancel]} onPress={() => setUnfriendModalVisible(false)} disabled={actionLoading}>
                                <Text style={styles.textStyle}>Vazgeç</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.buttonConfirm]} onPress={handleUnfriend} disabled={actionLoading}>
                                <Text style={styles.textStyle}>Evet, Çıkar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
    header: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 10 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
    profileSection: { alignItems: 'center', marginBottom: 30 },
    avatar: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#1E293B', borderWidth: 4, borderColor: '#3B82F6', marginBottom: 15 },
    usernameText: { fontSize: 32, fontWeight: '900', color: '#F8FAFC', marginBottom: 10 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    dotOnline: { backgroundColor: '#10B981' },
    dotInGame: { backgroundColor: '#F59E0B' },
    dotOffline: { backgroundColor: '#64748B' },
    statusBadgeText: { color: '#94A3B8', fontSize: 14, fontWeight: 'bold' },
    infoBox: { backgroundColor: '#1E293B', borderRadius: 20, padding: 25, marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#F8FAFC', marginBottom: 15 },
    bioText: { fontSize: 16, color: '#94A3B8', lineHeight: 24 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    tag: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginRight: 10, marginBottom: 10 },
    tagText: { color: '#60A5FA', fontSize: 14, fontWeight: 'bold' },
    footer: { 
        padding: 20, 
        backgroundColor: '#0F172A', 
        borderTopWidth: 1, 
        borderTopColor: '#1E293B',
        zIndex: 10,
        elevation: 10,
    },
    actionButton: { borderRadius: 30, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 56 },
    actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    multiActionContainer: { flexDirection: 'row', width: '100%' },
    multiActionButton: { flex: 1, borderRadius: 30, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, minHeight: 56 },
    multiActionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
    modalView: { margin: 20, backgroundColor: "#1E293B", borderRadius: 20, padding: 30, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: "900", color: "#F8FAFC", marginBottom: 10 },
    modalText: { color: "#94A3B8", fontSize: 16, textAlign: "center", marginBottom: 25 },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
    modalButton: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 25, elevation: 2 },
    buttonCancel: { backgroundColor: "#64748B", marginRight: 10 },
    buttonConfirm: { backgroundColor: "#EF4444" },
    textStyle: { color: "#FFFFFF", fontWeight: "900", textAlign: "center" }
});

export default PublicProfileScreen;