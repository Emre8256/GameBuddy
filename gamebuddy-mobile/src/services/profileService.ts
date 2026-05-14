import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.105:8080/api/profile';

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const updateProfile = async (bio: string, favoriteGames: string, avatarUrl: string, status: string, playStyle?: string | null, topThreeGames?: string): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.put(API_URL, { bio, favoriteGames, avatarUrl, status, playStyle, topThreeGames }, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Profil güncellenirken bir hata oluştu.';
    }
};

export const getMyProfile = async (): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/me`, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Profil alınamadı.';
    }
};

export const getUserProfile = async (userId: number): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/${userId}`, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Kullanıcı profili alınamadı.';
    }
};

export const discoverPlayers = async (game?: string): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const url = game && game.trim() !== '' ? `${API_URL}/discover?game=${encodeURIComponent(game)}` : `${API_URL}/discover`;
        const response = await axios.get(url, config);
        return response.data; // List<PlayerMatchResponse>
    } catch (error: any) {
        throw error.response?.data?.error || 'Oyuncular getirilirken bir hata oluştu.';
    }
};
