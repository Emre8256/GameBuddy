import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile, getMyProfile } from '../../services/profileService';
import { AuthContext } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { POPULAR_GAMES } from '../../utils/games';

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer4',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Adv1',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Adv2',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Emoji1',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Emoji2',
];

const ProfileScreen = () => {
    const { setUserToken } = useContext(AuthContext);
    
    const [username, setUsername] = useState('Yükleniyor...');
    const [bio, setBio] = useState('');
    const [selectedGames, setSelectedGames] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [status, setStatus] = useState('Online');
    const [gameSearch, setGameSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await getMyProfile();
                setUsername(data.username);
                setBio(data.bio || '');
                if (data.favoriteGames) {
                    setSelectedGames(data.favoriteGames.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0));
                }
                setAvatarUrl(data.avatarUrl || '');
                setStatus(data.status || 'Online');
            } catch (error) {
                console.log("Profile load error", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const toggleGame = (gameName: string) => {
        if (selectedGames.includes(gameName)) {
            setSelectedGames(selectedGames.filter(g => g !== gameName));
        } else {
            setSelectedGames([...selectedGames, gameName]);
            setGameSearch('');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const favoriteGamesStr = selectedGames.join(', ');
            await updateProfile(bio, favoriteGamesStr, avatarUrl, status, null, favoriteGamesStr);
            Alert.alert("Başarılı", "Profiliniz başarıyla güncellendi.");
        } catch (error: any) {
            Alert.alert("Hata", error as string);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        setUserToken(null);
    };

    const filteredSearchGames = gameSearch.length > 0 
        ? POPULAR_GAMES.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()) && !selectedGames.includes(g.name))
        : [];

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                <View style={styles.headerSection}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: (avatarUrl && avatarUrl.length > 0) ? avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username.toLowerCase()}` }} 
                            style={styles.mainAvatar} 
                        />
                        <View style={[styles.statusDotHeader, { backgroundColor: status === 'Online' ? '#10B981' : status === 'In-Game' ? '#F59E0B' : '#64748B' }]} />
                    </View>
                    <Text style={styles.usernameText}>{username}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                            {status === 'Online' ? 'Müsait' : status === 'In-Game' ? 'Oyunda' : 'Çevrimdışı'}
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle-outline" size={24} color="#3B82F6" />
                        <Text style={styles.cardTitle}>Hesap Bilgileri</Text>
                    </View>

                    <Text style={styles.label}>Profil Resmi Seç</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
                        {AVATAR_OPTIONS.map((url, idx) => (
                            <TouchableOpacity key={idx} onPress={() => setAvatarUrl(url)} activeOpacity={0.8}>
                                <Image 
                                    source={{ uri: url }} 
                                    style={[styles.avatarOption, avatarUrl === url && styles.avatarOptionSelected]} 
                                />
                                {avatarUrl === url && (
                                    <View style={styles.checkIcon}>
                                        <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Biyografi</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.bioInput}
                            placeholder="Kendinden bahset..."
                            placeholderTextColor="#64748B"
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <Text style={styles.label}>Durumunu Belirle</Text>
                    <View style={styles.statusRow}>
                        {[
                            { id: 'Online', label: 'Müsait', color: '#10B981' },
                            { id: 'In-Game', label: 'Oyunda', color: '#F59E0B' },
                            { id: 'Offline', label: 'Çevrimdışı', color: '#64748B' }
                        ].map((item) => (
                            <TouchableOpacity 
                                key={item.id}
                                style={[
                                    styles.statusBtn, 
                                    status === item.id && { borderColor: item.color, backgroundColor: `${item.color}15` }
                                ]}
                                onPress={() => setStatus(item.id)}
                            >
                                <View style={[styles.miniDot, { backgroundColor: item.color }]} />
                                <Text style={[styles.statusBtnText, status === item.id && { color: '#F8FAFC' }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="game-controller-outline" size={24} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Oyun Kütüphanen</Text>
                    </View>

                    <Text style={styles.label}>Oyun Ekle</Text>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Oyun ara..."
                            placeholderTextColor="#64748B"
                            value={gameSearch}
                            onChangeText={setGameSearch}
                        />
                    </View>

                    {gameSearch.length > 0 && (
                        <View style={styles.searchResults}>
                            {filteredSearchGames.length > 0 ? (
                                filteredSearchGames.map((game) => (
                                    <TouchableOpacity 
                                        key={game.id} 
                                        style={styles.searchResultItem}
                                        onPress={() => toggleGame(game.name)}
                                    >
                                        <Image source={{ uri: game.image }} style={styles.searchResultImage} />
                                        <Text style={styles.searchResultName}>{game.name}</Text>
                                        <Ionicons name="add-circle" size={24} color="#3B82F6" />
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noResultText}>Oyun bulunamadı.</Text>
                            )}
                        </View>
                    )}

                    <Text style={styles.label}>Favori Oyunların ({selectedGames.length})</Text>
                    <View style={styles.chipsContainer}>
                        {selectedGames.map((gameName) => {
                            const gameData = POPULAR_GAMES.find(g => g.name === gameName);
                            return (
                                <View key={gameName} style={styles.gameChip}>
                                    {gameData && <Image source={{ uri: gameData.image }} style={styles.chipImage} />}
                                    <Text style={styles.gameChipText}>{gameName}</Text>
                                    <TouchableOpacity onPress={() => toggleGame(gameName)}>
                                        <Ionicons name="close-circle" size={20} color="#EF4444" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                        {selectedGames.length === 0 && (
                            <Text style={styles.emptyGamesText}>Henüz oyun eklemedin.</Text>
                        )}
                    </View>
                </View>

                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                            <>
                                <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>Profilini Güncelle</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    contentContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
    
    // Header
    headerSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    avatarContainer: { position: 'relative' },
    mainAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E293B', borderWidth: 4, borderColor: '#3B82F6' },
    statusDotHeader: { position: 'absolute', bottom: 5, right: 5, width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderColor: '#0F172A' },
    usernameText: { fontSize: 28, fontWeight: '900', color: '#F8FAFC', marginTop: 15 },
    statusBadge: { backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    statusBadgeText: { color: '#94A3B8', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
    
    // Stats
    statsGrid: { backgroundColor: '#1E293B', borderRadius: 24, paddingVertical: 20, marginBottom: 25, alignItems: 'center', elevation: 2 },
    statBox: { alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: '900', color: '#F8FAFC', marginTop: 5 },
    statLabel: { fontSize: 13, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    
    // Cards
    card: { backgroundColor: '#1E293B', padding: 20, borderRadius: 24, marginBottom: 20, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 18, fontWeight: '900', color: '#F8FAFC', marginLeft: 10 },
    label: { color: '#94A3B8', fontSize: 14, marginBottom: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    
    // Avatar Selection
    avatarScroll: { marginBottom: 25 },
    avatarOption: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0F172A', marginRight: 15, borderWidth: 2, borderColor: 'transparent' },
    avatarOptionSelected: { borderColor: '#3B82F6' },
    checkIcon: { position: 'absolute', top: -5, right: 10, backgroundColor: '#1E293B', borderRadius: 10 },
    
    // Bio
    inputWrapper: { backgroundColor: '#0F172A', borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: '#334155' },
    bioInput: { color: '#F8FAFC', padding: 15, fontSize: 15, minHeight: 100, textAlignVertical: 'top' },
    
    // Status Row
    statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#0F172A', borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: '#334155' },
    miniDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusBtnText: { color: '#64748B', fontSize: 12, fontWeight: '800' },
    
    // Top Games
    topGamesScroll: { marginBottom: 25 },
    topGameCard: { width: 100, marginRight: 15, alignItems: 'center', borderRadius: 16, padding: 8, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155' },
    topGameCardActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.05)' },
    topGameImage: { width: 84, height: 84, borderRadius: 12, marginBottom: 8 },
    topGameName: { color: '#64748B', fontSize: 11, fontWeight: '800', textAlign: 'center' },
    topGameNameActive: { color: '#F8FAFC' },
    rankBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#F59E0B', borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0F172A' },
    rankText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
    
    // Chips
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    gameChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    chipImage: {
        width: 20,
        height: 20,
        borderRadius: 4,
        marginRight: 8,
    },
    gameChipText: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        paddingVertical: 12,
        fontSize: 15,
    },
    searchResults: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        marginBottom: 20,
        maxHeight: 200,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    searchResultImage: {
        width: 32,
        height: 32,
        borderRadius: 6,
        marginRight: 12,
    },
    searchResultName: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '600',
    },
    noResultText: {
        color: '#94A3B8',
        padding: 15,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    emptyGamesText: {
        color: '#64748B',
        fontStyle: 'italic',
        fontSize: 14,
        marginTop: 5,
    },
    actionSection: { marginTop: 10 },
    saveButton: { backgroundColor: '#3B82F6', paddingVertical: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 4 },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    logoutButton: { paddingVertical: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    logoutButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '700' }
});

export default ProfileScreen;


