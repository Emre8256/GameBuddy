import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { POPULAR_GAMES } from '../../utils/games';
import { getGameCounts } from '../../services/profileService';

const DiscoverScreen = ({ navigation }: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gameCounts, setGameCounts] = useState<Record<string, number>>({});

    const fetchCounts = async () => {
        const counts = await getGameCounts();
        setGameCounts(counts);
    };

    useFocusEffect(
        useCallback(() => {
            fetchCounts();
        }, [])
    );

    const filteredGames = POPULAR_GAMES.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPlayerCount = (gameName: string, baseCount: number) => {
        // Veritabanından gelen verilerde büyük/küçük harf duyarlılığını ortadan kaldıralım
        const realCount = Object.entries(gameCounts).find(
            ([key]) => key.toLowerCase() === gameName.toLowerCase()
        )?.[1] || 0;
        
        return realCount;
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.cardWrapper}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('GamePlayers', { gameName: item.name, gameImage: item.image })}
        >
            <ImageBackground 
                source={{ uri: item.image }} 
                style={styles.cardImage}
                imageStyle={{ borderRadius: 20 }}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                    style={styles.gradientOverlay}
                >
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{item.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.gameName}>{item.name}</Text>
                    <View style={styles.playerCountRow}>
                        <Ionicons name="people" size={12} color="#10B981" />
                        <Text style={styles.playerCountText}>
                            {getPlayerCount(item.name, item.activePlayers)} Oyuncu Hazır
                        </Text>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Oyun Keşfet</Text>
                <Text style={styles.headerSubtitle}>Favori oyununu seç ve takım arkadaşı bul</Text>
            </View>
            
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Oyun ara (Örn: CS2, Valorant)"
                    placeholderTextColor="#A0A0A0"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#64748B" style={styles.clearIcon} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={filteredGames}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="game-controller-outline" size={60} color="#334155" />
                        <Text style={styles.emptyText}>Aradığınız oyun bulunamadı.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: '#F8FAFC' },
    headerSubtitle: { fontSize: 16, color: '#94A3B8', marginTop: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 20, borderRadius: 20, paddingHorizontal: 15, marginBottom: 20 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: '#F8FAFC', paddingVertical: 14, fontSize: 15 },
    clearIcon: { marginLeft: 10 },
    listContainer: { paddingHorizontal: 10, paddingBottom: 20 },
    columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 10 },
    cardWrapper: { width: '48%', aspectRatio: 0.75, marginBottom: 15 },
    cardImage: { flex: 1, justifyContent: 'flex-end', borderRadius: 20, overflow: 'hidden' },
    gradientOverlay: { padding: 12, paddingTop: 40, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    badgeContainer: { 
        alignSelf: 'flex-start', 
        backgroundColor: 'rgba(187, 134, 252, 0.8)', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 6, 
        marginBottom: 6 
    },
    badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    gameName: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    playerCountRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 4 
    },
    playerCountText: { color: '#10B981', fontSize: 12, marginLeft: 4, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#64748B', marginTop: 15, fontSize: 15, textAlign: 'center' }
});

export default DiscoverScreen;
