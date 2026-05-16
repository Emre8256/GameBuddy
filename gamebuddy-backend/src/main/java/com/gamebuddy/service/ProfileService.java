package com.gamebuddy.service;

import com.gamebuddy.dto.DiscoverPlayerResponse;
import com.gamebuddy.dto.ProfileResponse;
import com.gamebuddy.dto.ProfileUpdateRequest;
import com.gamebuddy.entity.Friendship;
import com.gamebuddy.entity.Profile;
import com.gamebuddy.entity.User;
import com.gamebuddy.repository.FriendshipRepository;
import com.gamebuddy.repository.ProfileRepository;
import com.gamebuddy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final FriendshipRepository friendshipRepository;

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("Unauthenticated user");
    }

    public void updateProfile(ProfileUpdateRequest request) {
        User user = getAuthenticatedUser();
        Profile profile = user.getProfile();
        
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
        }

        profile.setBio(request.getBio());
        profile.setFavoriteGames(request.getFavoriteGames());
        profile.setAvatarUrl(request.getAvatarUrl());
        profile.setLookingForGroup(request.isLookingForGroup());

        profileRepository.save(profile);
    }

    public ProfileResponse getMyProfile() {
        User user = getAuthenticatedUser();
        return buildProfileResponse(user, user, user.getProfile());
    }

    public ProfileResponse getUserProfile(Long userId) {
        User currentUser = getAuthenticatedUser();
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildProfileResponse(currentUser, targetUser, targetUser.getProfile());
    }

    private ProfileResponse buildProfileResponse(User currentUser, User targetUser, Profile profile) {
        String friendshipStatus = getFriendshipStatus(currentUser, targetUser);
        
        return ProfileResponse.builder()
                .userId(targetUser.getId())
                .username(targetUser.getUsername())
                .bio(profile != null ? profile.getBio() : "")
                .favoriteGames(profile != null ? profile.getFavoriteGames() : "")
                .avatarUrl(profile != null ? profile.getAvatarUrl() : "")
                .lookingForGroup(profile != null && profile.isLookingForGroup())
                .friendshipStatus(friendshipStatus)
                .build();
    }

    // Arkadaşlık durumunu kontrol eden yardımcı metod
    private String getFriendshipStatus(User currentUser, User otherUser) {
        if (currentUser.getId().equals(otherUser.getId())) {
            return "SELF";
        }

        java.util.Optional<Friendship> f1 = friendshipRepository.findByUser1AndUser2(currentUser, otherUser);
        java.util.Optional<Friendship> f2 = friendshipRepository.findByUser1AndUser2(otherUser, currentUser);

        if (f1.isPresent()) {
            return f1.get().getStatus(); // PENDING veya ACCEPTED (kullanıcı tarafından gönderilmiş)
        }
        if (f2.isPresent()) {
            String status = f2.get().getStatus();
            if ("PENDING".equals(status)) {
                return "PENDING_RECEIVED"; // Diğer kullanıcıdan gelen bekleyen istek
            }
            return status; // ACCEPTED
        }

        return "NONE";
    }

    public List<DiscoverPlayerResponse> discoverPlayers(String targetGame) {
        User currentUser = getAuthenticatedUser();
        String currentGamesStr = currentUser.getProfile() != null && currentUser.getProfile().getFavoriteGames() != null 
                ? currentUser.getProfile().getFavoriteGames().toLowerCase() : "";
        
        List<String> currentUserGames = Arrays.stream(currentGamesStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        List<User> allUsers = userRepository.findAll();
        List<DiscoverPlayerResponse> matchResponses = new ArrayList<>();

        for (User otherUser : allUsers) {
            // Kendisini eşleşme listesine koyma
            if (otherUser.getId().equals(currentUser.getId())) continue;

            Profile otherProfile = otherUser.getProfile();
            // Sadece takım arkadaşı arayanları göster
            if (otherProfile == null || !otherProfile.isLookingForGroup() || otherProfile.getFavoriteGames() == null) continue;

            String otherGamesStr = otherProfile.getFavoriteGames().toLowerCase();
            List<String> otherUserGames = Arrays.stream(otherGamesStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            // Eğer spesifik bir oyun aratılmışsa, o oyuna sahip olmayanları filtrele
            if (targetGame != null && !targetGame.trim().isEmpty()) {
                if (!otherUserGames.contains(targetGame.toLowerCase().trim())) {
                    continue;
                }
            }

            // Ortak oyunları hesapla
            List<String> commonGames = new ArrayList<>(currentUserGames);
            commonGames.retainAll(otherUserGames);

            // SDD kuralı: "Sadece aranan oyuna sahip olan veya ortak oyunu en çok olan oyuncuları listeleyen bir mantık kur."
            // Eğer spesifik oyun aranmıyorsa ve hiç ortak oyunları yoksa listeye dahil etmeyebiliriz
            if ((targetGame == null || targetGame.trim().isEmpty()) && commonGames.isEmpty()) {
                continue; 
            }

            String friendshipStatus = getFriendshipStatus(currentUser, otherUser);

            // Eşleşen oyunun orijinal casing'i için otherUserGames yerine orijinal oyun isimlerini kullanabiliriz
            // Ancak basitlik için küçük harfli halini dönüyoruz
            matchResponses.add(DiscoverPlayerResponse.builder()
                    .userId(otherUser.getId())
                    .username(otherUser.getUsername())
                    .commonGames(commonGames)
                    .lookingForGroup(otherProfile.isLookingForGroup())
                    .avatarUrl(otherProfile.getAvatarUrl())
                    .friendshipStatus(friendshipStatus)
                    .build());
        }

        // Ortak oyun sayısına göre çoktan aza doğru sırala
        matchResponses.sort((m1, m2) -> Integer.compare(m2.getCommonGames().size(), m1.getCommonGames().size()));

        return matchResponses;
    }

    public Map<String, Long> getGameCounts() {
        User currentUser = getAuthenticatedUser();
        List<Profile> profiles = profileRepository.findAll();
        Map<String, Long> counts = new HashMap<>();

        for (Profile profile : profiles) {
            // Kendisini sayma
            if (profile.getUser() != null && profile.getUser().getId().equals(currentUser.getId())) {
                continue;
            }

            // Sadece 'Takım Arkadaşı Arıyorum' (true) olanları say
            if (profile.isLookingForGroup()) {
                if (profile.getFavoriteGames() != null && !profile.getFavoriteGames().isEmpty()) {
                    String[] games = profile.getFavoriteGames().split(",");
                    for (String game : games) {
                        String trimmedGame = game.trim();
                        if (!trimmedGame.isEmpty()) {
                            counts.put(trimmedGame, counts.getOrDefault(trimmedGame, 0L) + 1);
                        }
                    }
                }
            }
        }
        return counts;
    }
}
