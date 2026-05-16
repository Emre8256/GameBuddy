import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './apiConfig';

const API_URL = `${BASE_URL}/friendship`;

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// Arkadaşlık isteği gönder
export const sendFriendRequest = async (userId: number): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/request/${userId}`, {}, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Arkadaşlık isteği gönderilirken bir hata oluştu.';
    }
};

// Arkadaşlık isteğini kabul et
export const acceptFriendRequest = async (userId: number): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/accept/${userId}`, {}, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Arkadaşlık isteği kabul edilirken bir hata oluştu.';
    }
};

// Arkadaşlık isteğini reddet
export const declineFriendRequest = async (userId: number): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/decline/${userId}`, {}, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Arkadaşlık isteği reddedilirken bir hata oluştu.';
    }
};

// Bekleyen istekleri listele
export const getPendingRequests = async (): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/pending`, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Bekleyen istekler alınamadı.';
    }
};

// Onaylı arkadaşları listele
export const getFriends = async (): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/list`, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Arkadaşlar alınamadı.';
    }
};

// Kullanıcı ile arkadaşlık durumunu kontrol et
export const getFriendshipStatus = async (userId: number): Promise<string> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/status/${userId}`, config);
        return response.data.status;
    } catch (error: any) {
        return 'NONE';
    }
};
// Arkadaşlıktan çıkar
export const removeFriend = async (userId: number): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/remove/${userId}`, {}, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Arkadaşlıktan çıkarılırken bir hata oluştu.';
    }
};
