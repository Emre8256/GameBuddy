import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './apiConfig';

const API_URL = `${BASE_URL}/auth`; 

export const login = async (email: string, password: string): Promise<any> => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        const { token, userId, username } = response.data;
        if (token) {
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify({ userId, username, email }));
        }
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edip tekrar deneyin.';
    }
};

export const register = async (
    email: string,
    username: string,
    password: string,
    bio?: string,
    favoriteGames?: string,
    avatarUrl?: string,
    topThreeGames?: string
): Promise<any> => {
    try {
        const response = await axios.post(`${API_URL}/register`, {
            email, username, password, bio, favoriteGames, avatarUrl, topThreeGames
        });
        const { token, userId } = response.data;
        if (token) {
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify({ userId, username, email }));
        }
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Kayıt başarısız. Bu e-posta veya kullanıcı adı zaten kullanılıyor olabilir.';
    }
};

export const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
};

export const getToken = async () => {
    return await AsyncStorage.getItem('userToken');
};
