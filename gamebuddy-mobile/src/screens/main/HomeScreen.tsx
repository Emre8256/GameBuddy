import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { logout } from '../../services/authService';

const HomeScreen = () => {
    const { setUserToken } = useContext(AuthContext);

    const handleLogout = async () => {
        await logout();
        setUserToken(null);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>GameBuddy</Text>
            <Text style={styles.subtitle}>Ana Sayfa ekranına ulaştınız!</Text>
            <Text style={styles.description}>Diğer oyuncular ve eşleşmeler burada listelenecek.</Text>
            
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#BB86FC',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#FFFFFF',
        marginBottom: 10,
    },
    description: {
        color: '#A0A0A0',
        marginBottom: 40,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#CF6679',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default HomeScreen;
