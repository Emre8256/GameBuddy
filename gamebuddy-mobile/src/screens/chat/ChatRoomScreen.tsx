import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChatHistory, sendMessage } from '../../services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ChatRoomScreen = ({ route, navigation }: any) => {
    const { userId, username, status, avatarUrl } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const flatListRef = useRef<FlatList>(null);


    const quickReplies = ["Geliyorum!", "Hangi oyun?", "DC var mı?", "1 dk", "Sonra konuşalım", "GG WP"];

    useEffect(() => {
        const init = async () => {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setCurrentUserId(userData.userId);
            }
            fetchHistory();
        };
        init();
        
        const interval = setInterval(() => {
            fetchHistory(false);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getChatHistory(userId);
            setMessages(data);
        } catch (error) {
            // Error handled silently
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!content.trim()) return;
        const msgText = content.trim();
        setContent(''); 
        
        try {
            await sendMessage(userId, msgText);
            fetchHistory(false); 
        } catch (error) {
            // Send error handled silently
        }
    };

    const handleQuickReply = async (reply: string) => {
        try {
            await sendMessage(userId, reply);
            fetchHistory(false);
        } catch (error) {
            // Quick reply error handled silently
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isMe = item.senderId === currentUserId;
        const isRead = item.isRead || item.read;
        
        return (
            <View style={[styles.messageWrapper, isMe ? styles.wrapperMe : styles.wrapperThem]}>
                <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.messageText, isMe ? styles.textMe : styles.textThem]}>
                        {item.content}
                    </Text>
                    <View style={styles.messageFooter}>
                        {isMe && (
                            <Ionicons 
                                name={isRead ? "checkmark-done" : "checkmark"} 
                                size={14} 
                                color={isRead ? "#60A5FA" : "#94A3B8"} 
                                style={styles.readIcon}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.headerContainer} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#F8FAFC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.userInfo}
                        onPress={() => navigation.navigate('PublicProfile', { userId })}
                        activeOpacity={0.7}
                    >
                        <Image 
                            source={{ uri: (avatarUrl && avatarUrl.length > 0) ? avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username.toLowerCase()}` }} 
                            style={styles.headerAvatar} 
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>{username}</Text>
                            <View style={styles.statusContainer}>
                                <View style={[styles.statusDot, { backgroundColor: status === 'Online' ? '#10B981' : status === 'In-Game' ? '#F59E0B' : '#64748B' }]} />
                                <Text style={styles.statusText}>
                                    {status === 'Online' ? 'Müsait' : status === 'In-Game' ? 'Oyunda' : 'Çevrimdışı'}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.headerAction}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView 
                style={styles.chatContainer} 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                <View style={styles.bottomSection}>
                    <View style={styles.quickRepliesSection}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.quickRepliesContent}
                        >
                            {quickReplies.map((reply, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.quickReplyButton}
                                    onPress={() => handleQuickReply(reply)}
                                >
                                    <Text style={styles.quickReplyText}>{reply}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.inputWrapper}>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Bir mesaj yazın..."
                                placeholderTextColor="#64748B"
                                value={content}
                                onChangeText={setContent}
                                multiline
                            />
                            <TouchableOpacity 
                                style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]} 
                                onPress={handleSend}
                                disabled={!content.trim()}
                            >
                                <Ionicons name="send" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    headerContainer: {
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0F172A',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    headerAction: {
        padding: 4,
    },
    chatContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    messageWrapper: {
        width: '100%',
        marginVertical: 4,
    },
    wrapperMe: {
        alignItems: 'flex-end',
    },
    wrapperThem: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '85%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleMe: {
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        backgroundColor: '#1E293B',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    textMe: {
        color: '#FFFFFF',
    },
    textThem: {
        color: '#F8FAFC',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    readIcon: {
        marginLeft: 4,
    },
    bottomSection: {
        backgroundColor: '#1E293B',
        borderTopWidth: 1,
        borderTopColor: '#334155',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    quickRepliesSection: {
        paddingVertical: 12,
    },
    quickRepliesContent: {
        paddingHorizontal: 16,
    },
    quickReplyButton: {
        backgroundColor: '#0F172A',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    quickReplyText: {
        color: '#3B82F6',
        fontSize: 13,
        fontWeight: '700',
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 15,
        paddingVertical: 10,
        maxHeight: 100,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#334155',
    },
});

export default ChatRoomScreen;

