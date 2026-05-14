import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { register } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';
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

const RegisterScreen = ({ navigation }: any) => {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [selectedGames, setSelectedGames] = useState<string[]>([]);
    const [topThreeGames, setTopThreeGames] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const { setUserToken } = useContext(AuthContext);

    const handleRegister = async () => {
        setErrorMessage('');
        
        // Adım doğrulamaları
        if (step === 1) {
            if (!username.trim()) {
                setErrorMessage('Lütfen bir kullanıcı adı belirleyin.');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.trim() || !emailRegex.test(email)) {
                setErrorMessage('Geçerli bir e-posta adresi giriniz.');
                return;
            }
            if (password.length < 6) {
                setErrorMessage('Şifre en az 6 karakter olmalıdır.');
                return;
            }
            setErrorMessage('');
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!avatarUrl) {
                setErrorMessage('Lütfen bir avatar seçin.');
                return;
            }
            if (!bio.trim()) {
                setErrorMessage('Lütfen bir biyografi yazın.');
                return;
            }
            setErrorMessage('');
            setStep(3);
            return;
        }

        if (step === 3) {
            if (selectedGames.length === 0) {
                setErrorMessage('Lütfen en az bir favori oyun seçin.');
                return;
            }
        }

        setLoading(true);
        try {
            const favoriteGamesStr = selectedGames.join(', ');
            // Backend hala topThreeStr bekliyor olabilir, boş gönderebiliriz veya favorilerden ilk 3'ü verebiliriz
            const topThreeStr = selectedGames.slice(0, 3).join(', ');
            const data = await register(
                email,
                username,
                password,
                bio,
                favoriteGamesStr,
                avatarUrl,
                topThreeStr
            );
            setUserToken(data.token);
        } catch (error: any) {
            let msg = error.toString();
            if (msg.includes('Username is already in use')) {
                msg = 'Bu kullanıcı adı zaten alınmış.';
            } else if (msg.includes('Email is already in use')) {
                msg = 'Bu e-posta adresi zaten kullanımda.';
            } else if (msg.includes('Invalid') || msg.includes('fail')) {
                msg = 'Kayıt işlemi sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';
            }
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.length > 0) {
            const filtered = POPULAR_GAMES.filter(game => 
                game.name.toLowerCase().includes(text.toLowerCase())
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    };

    const addGame = (game: any) => {
        if (!selectedGames.includes(game.name)) {
            setSelectedGames([...selectedGames, game.name]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeGame = (gameName: string) => {
        setSelectedGames(selectedGames.filter(g => g !== gameName));
    };

    const renderStep1 = () => (
        <>
            <View style={styles.titleContainer}>
                <Text style={styles.titleGame}>GAME</Text>
                <Text style={styles.titleBuddy}>BUDDY</Text>
            </View>
            <Text style={styles.subtitle}>GameBuddy topluluğuna katıl!</Text>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Kullanıcı Adı"
                        placeholderTextColor="#94A3B8"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="E-posta Adresi"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Şifre"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>
            </View>
        </>
    );

    const renderStep2 = () => (
        <>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Profilini Oluştur</Text>
                <Text style={styles.stepSubtitle}>Kendini tanıt ve bir avatar seç</Text>
            </View>

            <Text style={styles.label}>Avatar Seçimi *</Text>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.avatarScroll}
                contentContainerStyle={styles.avatarScrollContent}
            >
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

            <Text style={styles.label}>Biyografi *</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, styles.bioInput]}
                    placeholder="Kendinden bahset..."
                    placeholderTextColor="#94A3B8"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>
        </>
    );

    const renderStep3 = () => (
        <>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Oyun Kütüphanen</Text>
                <Text style={styles.stepSubtitle}>Favori oyunlarını arat ve ekle</Text>
            </View>

            <Text style={styles.label}>Oyun Ara *</Text>
            <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Oyun ismi yazın..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                    <ScrollView showsVerticalScrollIndicator={true}>
                        {searchResults.map((game) => (
                            <TouchableOpacity 
                                key={game.id} 
                                style={styles.searchResultItem}
                                onPress={() => addGame(game)}
                            >
                                <Image source={{ uri: game.image }} style={styles.searchResultImage} />
                                <Text style={styles.searchResultName}>{game.name}</Text>
                                <Ionicons name="add-circle" size={24} color="#3B82F6" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Text style={styles.label}>Eklenen Oyunlar ({selectedGames.length})</Text>
            <View style={styles.chipsContainer}>
                {selectedGames.map((gameName) => {
                    const gameData = POPULAR_GAMES.find(g => g.name === gameName);
                    return (
                        <View key={gameName} style={styles.gameChip}>
                            {gameData && <Image source={{ uri: gameData.image }} style={styles.chipImage} />}
                            <Text style={styles.gameChipText}>{gameName}</Text>
                            <TouchableOpacity onPress={() => removeGame(gameName)} style={{ marginLeft: 8 }}>
                                <Ionicons name="close-circle" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    );
                })}
                {selectedGames.length === 0 && (
                    <Text style={styles.emptyGamesText}>Henüz oyun eklemediniz.</Text>
                )}
            </View>
        </>
    );

    return (
        <ImageBackground 
            source={require('../../../assets/images/login_bg.jpeg')} 
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.glassContainer}>
                        <View style={styles.logoContainer}>
                            <Image 
                                source={require('../../../assets/images/logo.png')} 
                                style={styles.logoImage} 
                                resizeMode="cover"
                            />
                        </View>
                        
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}

                        {errorMessage ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#F87171" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        <View style={styles.buttonRow}>
                            {step > 1 && (
                                <TouchableOpacity 
                                    style={[styles.button, styles.backButton]} 
                                    onPress={() => setStep(step - 1)}
                                    disabled={loading}
                                >
                                    <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                                    <Text style={styles.buttonText}>Geri</Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity 
                                style={[
                                    styles.button, 
                                    step === 3 ? styles.finishButton : styles.nextButton,
                                    step > 1 && step < 3 && { flex: 1 }
                                ]} 
                                onPress={handleRegister} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>
                                            {step === 3 ? 'Kaydı Tamamla' : 'Devam Et'}
                                        </Text>
                                        {step < 3 && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {step === 1 && (
                            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.linkText}>Zaten bir hesabın var mı? <Text style={styles.linkTextBold}>Giriş Yap</Text></Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25 },
    glassContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    logoImage: {
        width: '130%',
        height: '130%',
    },
    titleContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    titleGame: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    titleBuddy: {
        fontSize: 28,
        fontWeight: '900',
        color: '#3B82F6',
        letterSpacing: 2,
        textShadowColor: 'rgba(59, 130, 246, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 25 },
    stepHeader: { alignItems: 'center', marginBottom: 20 },
    stepTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
    stepSubtitle: { fontSize: 14, color: '#94A3B8' },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.2)',
    },
    errorText: {
        color: '#F87171',
        fontSize: 13,
        marginLeft: 8,
        fontWeight: '600',
        flex: 1,
        flexWrap: 'wrap',
    },
    inputContainer: { width: '100%', marginBottom: 10 },
    inputWrapper: {
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        width: '100%',
    },
    input: { color: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 15, fontSize: 16 },
    bioInput: { minHeight: 100, textAlignVertical: 'top' },
    label: { 
        color: '#94A3B8', 
        fontSize: 14, 
        marginBottom: 10, 
        fontWeight: '800', 
        textTransform: 'uppercase', 
        letterSpacing: 0.5,
        alignSelf: 'flex-start',
        width: '100%',
    },
    avatarScroll: { 
        width: '100%',
        marginBottom: 20, 
    },
    avatarScrollContent: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    avatarOption: { 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        backgroundColor: '#0F172A', 
        marginRight: 15, 
        borderWidth: 2, 
        borderColor: 'transparent' 
    },
    avatarOptionSelected: { borderColor: '#3B82F6' },
    checkIcon: { position: 'absolute', top: -5, right: 10, backgroundColor: '#1E293B', borderRadius: 10 },
    chipsContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        width: '100%', 
        marginBottom: 10 
    },
    gameChip: { 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.4)', 
        borderRadius: 12, 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        marginRight: 8, 
        marginBottom: 8, 
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.1)' 
    },
    chipImage: {
        width: 18,
        height: 18,
        borderRadius: 4,
        marginRight: 8,
    },
    gameChipText: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 16,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        width: '100%',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        paddingVertical: 12,
        fontSize: 16,
    },
    searchResults: {
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 16,
        marginBottom: 20,
        maxHeight: 180,
        borderWidth: 1,
        borderColor: '#3B82F6',
        overflow: 'hidden',
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
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    emptyGamesText: {
        color: '#64748B',
        fontStyle: 'italic',
        fontSize: 13,
        marginTop: 5,
        width: '100%',
    },
    buttonRow: { 
        flexDirection: 'row', 
        width: '100%', 
        marginTop: 15,
        gap: 10 
    },
    button: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    nextButton: {
        backgroundColor: '#3B82F6',
        flex: 1,
        gap: 8,
    },
    finishButton: {
        backgroundColor: '#10B981',
        flex: 1,
        gap: 8,
    },
    backButton: {
        backgroundColor: '#64748B',
        paddingHorizontal: 20,
        gap: 8,
    },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    linkButton: { marginTop: 20 },
    linkText: { color: '#94A3B8', fontSize: 14 },
    linkTextBold: { color: '#3B82F6', fontWeight: 'bold' }
});

export default RegisterScreen;
