import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
    ActivityIndicator, Image, TextInput, Animated, Dimensions,
    ImageBackground, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { updateProfile, getMyProfile } from '../../services/profileService';
import { AuthContext } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { POPULAR_GAMES } from '../../utils/games';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    const [lookingForGroup, setLookingForGroup] = useState(false);
    const [gameSearch, setGameSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const headerFade = useRef(new Animated.Value(0)).current;
    const saveScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

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
                setLookingForGroup(data.lookingForGroup || false);
            } catch (error) {
                console.log("Profile load error", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const saveProfileFields = async (
        newBio: string,
        newGames: string[],
        newAvatar: string,
        newLfg: boolean,
        silent = true
    ) => {
        try {
            const favoriteGamesStr = newGames.join(', ');
            await updateProfile(newBio, favoriteGamesStr, newAvatar, newLfg, null, favoriteGamesStr);
            if (!silent) {
                Alert.alert("Başarılı", "Biyografiniz başarıyla güncellendi.");
            }
        } catch (error: any) {
            if (!silent) {
                Alert.alert("Hata", error as string);
            } else {
                console.log("Auto-save error:", error);
            }
        }
    };

    const selectAvatar = async (url: string) => {
        setAvatarUrl(url);
        await saveProfileFields(bio, selectedGames, url, lookingForGroup);
    };

    const toggleGame = async (gameName: string) => {
        let nextGames: string[];
        if (selectedGames.includes(gameName)) {
            nextGames = selectedGames.filter(g => g !== gameName);
        } else {
            nextGames = [...selectedGames, gameName];
            setGameSearch('');
        }
        setSelectedGames(nextGames);
        await saveProfileFields(bio, nextGames, avatarUrl, lookingForGroup);
    };

    const handleSaveBio = async () => {
        Animated.sequence([
            Animated.timing(saveScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.timing(saveScale, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();
        setSaving(true);
        try {
            await saveProfileFields(bio, selectedGames, avatarUrl, lookingForGroup, false);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        setUserToken(null);
    };

    const toggleLFG = async () => {
        const nextLfg = !lookingForGroup;
        setLookingForGroup(nextLfg);
        await saveProfileFields(bio, selectedGames, avatarUrl, nextLfg);
    };

    const filteredSearchGames = gameSearch.length > 0
        ? POPULAR_GAMES.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()) && !selectedGames.includes(g.name))
        : [];

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#818CF8" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── HEADER ── */}
                <Animated.View style={[styles.headerSection, { opacity: headerFade }]}>
                    <LinearGradient
                        colors={['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.03)', 'transparent']}
                        style={styles.headerGradient}
                    />
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#818CF8', '#6366F1', '#4F46E5']}
                            style={styles.avatarRing}
                        >
                            <Image
                                source={{ uri: (avatarUrl && avatarUrl.length > 0) ? avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username.toLowerCase()}` }}
                                style={styles.mainAvatar}
                            />
                        </LinearGradient>
                        {lookingForGroup && (
                            <View style={styles.statusDotWrapper}>
                                <Animated.View style={[styles.statusPulse, { transform: [{ scale: pulseAnim }] }]} />
                                <View style={styles.statusDotHeader} />
                            </View>
                        )}
                    </View>
                    <Text style={styles.usernameText}>{username}</Text>
                    {lookingForGroup && (
                        <View style={styles.lfgBadge}>
                            <View style={styles.lfgDot} />
                            <Text style={styles.lfgBadgeText}>Takım Arkadaşı Arıyor</Text>
                        </View>
                    )}
                </Animated.View>

                {/* ── LFG TOGGLE ── */}
                <View style={styles.card}>
                    <TouchableOpacity style={styles.lfgToggleRow} onPress={toggleLFG} activeOpacity={0.7}>
                        <View style={styles.lfgToggleInfo}>
                            <View style={styles.lfgIconBox}>
                                <Ionicons name="people" size={20} color="#818CF8" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.lfgToggleTitle}>Takım Arkadaşı Arıyorum</Text>
                                <Text style={styles.lfgToggleSub}>Keşfet sayfasında görünürsün</Text>
                            </View>
                        </View>
                        <View style={[styles.customToggle, lookingForGroup && styles.customToggleActive]}>
                            <Animated.View style={[styles.toggleKnob, lookingForGroup && styles.toggleKnobActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── AVATAR SEÇİMİ ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <LinearGradient colors={['#818CF8', '#6366F1']} style={styles.cardIconBg}>
                            <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Profil Resmi</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll} contentContainerStyle={{ paddingRight: 10 }}>
                        {AVATAR_OPTIONS.map((url, idx) => (
                            <TouchableOpacity key={idx} onPress={() => selectAvatar(url)} activeOpacity={0.8}>
                                <View style={[styles.avatarOptionWrap, avatarUrl === url && styles.avatarOptionWrapSelected]}>
                                    <Image source={{ uri: url }} style={styles.avatarOption} />
                                </View>
                                {avatarUrl === url && (
                                    <View style={styles.checkIcon}>
                                        <Ionicons name="checkmark-circle" size={22} color="#818CF8" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── BİYOGRAFİ ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <LinearGradient colors={['#F472B6', '#EC4899']} style={styles.cardIconBg}>
                            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Biyografi</Text>
                        <Text style={styles.charCount}>{bio.length}/200</Text>
                    </View>
                    <View style={styles.bioInputWrapper}>
                        <TextInput
                            style={styles.bioInput}
                            placeholder="Kendinden bahset..."
                            placeholderTextColor="#475569"
                            value={bio}
                            onChangeText={(t) => setBio(t.slice(0, 200))}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                    <Animated.View style={{ transform: [{ scale: saveScale }], marginTop: 12 }}>
                        <TouchableOpacity onPress={handleSaveBio} disabled={saving} activeOpacity={0.85}>
                            <LinearGradient
                                colors={['#F472B6', '#EC4899']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveBioButton}
                            >
                                {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                                    <>
                                        <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.saveBioButtonText}>Biyografiyi Kaydet</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* ── OYUN KÜTÜPHANESİ ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <LinearGradient colors={['#FBBF24', '#F59E0B']} style={styles.cardIconBg}>
                            <Ionicons name="game-controller" size={16} color="#FFFFFF" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Oyun Kütüphanen</Text>
                        <View style={styles.gameCountBadge}>
                            <Text style={styles.gameCountText}>{selectedGames.length}</Text>
                        </View>
                    </View>

                    {/* Search */}
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search" size={18} color="#64748B" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Oyun ara..."
                            placeholderTextColor="#475569"
                            value={gameSearch}
                            onChangeText={setGameSearch}
                        />
                        {gameSearch.length > 0 && (
                            <TouchableOpacity onPress={() => setGameSearch('')}>
                                <Ionicons name="close-circle" size={20} color="#64748B" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Search Results */}
                    {gameSearch.length > 0 && (
                        <View style={styles.searchResults}>
                            {filteredSearchGames.length > 0 ? (
                                filteredSearchGames.slice(0, 5).map((game) => (
                                    <TouchableOpacity
                                        key={game.id}
                                        style={styles.searchResultItem}
                                        onPress={() => toggleGame(game.name)}
                                        activeOpacity={0.7}
                                    >
                                        <Image source={{ uri: game.image }} style={styles.searchResultImage} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.searchResultName}>{game.name}</Text>
                                            <Text style={styles.searchResultCategory}>{game.category}</Text>
                                        </View>
                                        <View style={styles.addBadge}>
                                            <Ionicons name="add" size={18} color="#FFFFFF" />
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.noResultContainer}>
                                    <Ionicons name="search-outline" size={28} color="#334155" />
                                    <Text style={styles.noResultText}>Oyun bulunamadı.</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Selected Games */}
                    <View style={styles.chipsContainer}>
                        {selectedGames.map((gameName) => {
                            const gameData = POPULAR_GAMES.find(g => g.name === gameName);
                            return (
                                <View key={gameName} style={styles.gameChip}>
                                    {gameData && <Image source={{ uri: gameData.image }} style={styles.chipImage} />}
                                    <Text style={styles.gameChipText} numberOfLines={1}>{gameName}</Text>
                                    <TouchableOpacity onPress={() => toggleGame(gameName)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Ionicons name="close-circle" size={18} color="#EF4444" style={{ marginLeft: 6 }} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                        {selectedGames.length === 0 && (
                            <View style={styles.emptyGamesContainer}>
                                <Ionicons name="game-controller-outline" size={32} color="#334155" />
                                <Text style={styles.emptyGamesText}>Henüz oyun eklemedin</Text>
                                <Text style={styles.emptyGamesSub}>Yukarıdaki arama kutusundan oyun ekle</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── ACTIONS ── */}
                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    contentContainer: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40 },

    // ── Header ──
    headerSection: { alignItems: 'center', marginBottom: 24, paddingTop: 20, paddingBottom: 10 },
    headerGradient: { position: 'absolute', top: 0, left: -20, right: -20, height: 220, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarRing: { width: 128, height: 128, borderRadius: 64, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }, android: { elevation: 8 } }) },
    mainAvatar: { width: 118, height: 118, borderRadius: 59, backgroundColor: '#1E293B', borderWidth: 3, borderColor: '#0F172A' },
    statusDotWrapper: { position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
    statusPulse: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.3)' },
    statusDotHeader: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#0F172A' },
    usernameText: { fontSize: 28, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.3 },
    lfgBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 8, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
    lfgDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
    lfgBadgeText: { color: '#10B981', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

    // ── LFG Toggle ──
    lfgToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    lfgToggleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    lfgIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(129,140,248,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    lfgToggleTitle: { fontSize: 15, fontWeight: '800', color: '#F8FAFC', marginBottom: 2 },
    lfgToggleSub: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    customToggle: { width: 52, height: 30, borderRadius: 15, backgroundColor: '#334155', justifyContent: 'center', paddingHorizontal: 3 },
    customToggleActive: { backgroundColor: '#818CF8' },
    toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#64748B' },
    toggleKnobActive: { backgroundColor: '#FFFFFF', alignSelf: 'flex-end' },

    // ── Cards ──
    card: { backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: '#F8FAFC', flex: 1 },
    charCount: { color: '#475569', fontSize: 12, fontWeight: '600' },

    // ── Avatar Selection ──
    avatarScroll: { marginTop: 4 },
    avatarOptionWrap: { width: 64, height: 64, borderRadius: 32, marginRight: 14, borderWidth: 2.5, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
    avatarOptionWrapSelected: { borderColor: '#818CF8', ...Platform.select({ ios: { shadowColor: '#818CF8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8 }, android: { elevation: 6 } }) },
    avatarOption: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F172A' },
    checkIcon: { position: 'absolute', top: -4, right: 8, backgroundColor: '#1E293B', borderRadius: 11 },

    // ── Bio ──
    bioInputWrapper: { backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    bioInput: { color: '#F8FAFC', padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: 'top', lineHeight: 22 },

    // ── Game Library ──
    gameCountBadge: { backgroundColor: 'rgba(251,191,36,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    gameCountText: { color: '#FBBF24', fontSize: 13, fontWeight: '800' },

    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 14, paddingHorizontal: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 10 },
    searchInput: { flex: 1, color: '#F8FAFC', paddingVertical: 12, fontSize: 15 },

    searchResults: { backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 14, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)' },
    searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    searchResultImage: { width: 40, height: 40, borderRadius: 10, marginRight: 12 },
    searchResultName: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
    searchResultCategory: { color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 2 },
    addBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#818CF8', justifyContent: 'center', alignItems: 'center' },
    noResultContainer: { alignItems: 'center', paddingVertical: 20 },
    noResultText: { color: '#475569', marginTop: 6, fontSize: 14, fontWeight: '500' },

    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
    gameChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    chipImage: { width: 22, height: 22, borderRadius: 6, marginRight: 8 },
    gameChipText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600', maxWidth: 120 },

    emptyGamesContainer: { alignItems: 'center', paddingVertical: 20, width: '100%' },
    emptyGamesText: { color: '#475569', fontSize: 14, fontWeight: '600', marginTop: 8 },
    emptyGamesSub: { color: '#334155', fontSize: 12, marginTop: 4 },

    // ── Actions ──
    actionSection: { marginTop: 8, marginBottom: 10 },
    saveBioButton: { paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#EC4899', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }, android: { elevation: 4 } }) },
    saveBioButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
    logoutButton: { paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)' },
    logoutButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
