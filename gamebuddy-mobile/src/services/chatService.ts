import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.0.105:8080/api/chat';

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const sendMessage = async (receiverId: number, content: string): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/send`, { receiverId, content }, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Mesaj gönderilemedi.';
    }
};

export const getChatHistory = async (userId: number): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/history/${userId}`, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Mesaj geçmişi alınamadı.';
    }
};

export const getConversations = async (): Promise<any> => {
    try {
        const config = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/conversations`, config);
        return response.data;
    } catch (error: any) {
        throw error.response?.data?.error || 'Sohbet listesi alınamadı.';
    }
};
