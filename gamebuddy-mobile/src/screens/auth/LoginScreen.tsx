import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { login } from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { setUserToken } = useContext(AuthContext);

    const handleLogin = async () => {
        setErrorMessage('');
        if (!email || !password) {
            setErrorMessage('Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        setLoading(true);
        try {
            const data = await login(email, password);
            setUserToken(data.token);
        } catch (error: any) {
            let msg = error.toString();
            if (msg.includes('Invalid') || msg.includes('401')) {
                msg = 'E-posta veya şifre hatalı.';
            }
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

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
                        
                        <View style={styles.titleContainer}>
                            <Text style={styles.titleGame}>GAME</Text>
                            <Text style={styles.titleBuddy}>BUDDY</Text>
                        </View>
                        <Text style={styles.subtitle}>Savaş alanına geri dön!</Text>

                        {errorMessage ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#F87171" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        <View style={styles.inputContainer}>
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

                        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Giriş Yap</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Hesabın yok mu? <Text style={styles.linkTextBold}>Hemen Katıl</Text></Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: { flex: 1, width: '100%', height: '100%' },
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)' }, // Opaklığı 0.6'dan 0.3'e düşürdüm
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25 },
    glassContainer: {
        backgroundColor: 'rgba(15, 23, 42, 0.55)', // Şeffaflığı %85'ten %55'e düşürerek cam efektini artırdım
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
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
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
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    titleBuddy: {
        fontSize: 32,
        fontWeight: '900',
        color: '#3B82F6',
        letterSpacing: 2,
        textShadowColor: 'rgba(59, 130, 246, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: { fontSize: 16, color: '#94A3B8', marginBottom: 35 },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(248, 113, 113, 0.2)',
    },
    errorText: {
        color: '#F87171',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '600',
    },
    inputContainer: { width: '100%', marginBottom: 30 },
    inputWrapper: {
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    input: { color: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 15, fontSize: 16 },
    button: {
        backgroundColor: '#3B82F6',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
    linkButton: { marginTop: 25 },
    linkText: { color: '#94A3B8', fontSize: 14 },
    linkTextBold: { color: '#3B82F6', fontWeight: 'bold' }
});

export default LoginScreen;
