package com.gamebuddy.service;

import com.gamebuddy.dto.FriendshipRequest;
import com.gamebuddy.entity.Friendship;
import com.gamebuddy.entity.User;
import com.gamebuddy.repository.FriendshipRepository;
import com.gamebuddy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("Unauthenticated user");
    }

    // Arkadaşlık isteği gönder
    public void sendFriendRequest(Long targetUserId) {
        User currentUser = getAuthenticatedUser();
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (currentUser.getId().equals(targetUserId)) {
            throw new RuntimeException("You cannot send a friend request to yourself");
        }

        // Zaten bir kayıt var mı kontrol et (her iki yönde)
        if (friendshipRepository.findByUser1AndUser2(currentUser, targetUser).isPresent()) {
            throw new RuntimeException("Friend request already sent or you are already friends");
        }
        if (friendshipRepository.findByUser1AndUser2(targetUser, currentUser).isPresent()) {
            throw new RuntimeException("Friend request already exists or you are already friends");
        }

        Friendship friendship = Friendship.builder()
                .user1(currentUser)
                .user2(targetUser)
                .status("PENDING")
                .build();

        friendshipRepository.save(friendship);
    }

    // Gelen isteği kabul et
    public void acceptFriendRequest(Long requesterId) {
        User currentUser = getAuthenticatedUser();
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        Friendship friendship = friendshipRepository.findByUser1AndUser2(requester, currentUser)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!"PENDING".equals(friendship.getStatus())) {
            throw new RuntimeException("Friend request is not pending");
        }

        friendship.setStatus("ACCEPTED");
        friendshipRepository.save(friendship);
    }

    // İsteği reddet
    public void declineFriendRequest(Long requesterId) {
        User currentUser = getAuthenticatedUser();
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        Friendship friendship = friendshipRepository.findByUser1AndUser2(requester, currentUser)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        friendshipRepository.delete(friendship);
    }

    // Bekleyen istekleri listele (kullanıcıya gelen)
    public List<FriendshipRequest> getPendingRequests() {
        User currentUser = getAuthenticatedUser();

        List<Friendship> pendingFriendships = friendshipRepository.findByUser2AndStatus(currentUser, "PENDING");

        return pendingFriendships.stream().map(f -> {
            User requester = f.getUser1();
            return FriendshipRequest.builder()
                    .id(f.getId())
                    .userId(requester.getId())
                    .username(requester.getUsername())
                    .avatarUrl(requester.getProfile() != null ? requester.getProfile().getAvatarUrl() : null)
                    .lookingForGroup(requester.getProfile() != null && requester.getProfile().isLookingForGroup())
                    .requestType("received")
                    .build();
        }).collect(Collectors.toList());
    }

    // Onaylı arkadaşları listele
    public List<FriendshipRequest> getAcceptedFriends() {
        User currentUser = getAuthenticatedUser();

        List<Friendship> sentAccepted = friendshipRepository.findByUser1AndStatus(currentUser, "ACCEPTED");
        List<Friendship> receivedAccepted = friendshipRepository.findByUser2AndStatus(currentUser, "ACCEPTED");

        List<FriendshipRequest> friends = new ArrayList<>();

        for (Friendship f : sentAccepted) {
            User friend = f.getUser2();
            friends.add(FriendshipRequest.builder()
                    .id(f.getId())
                    .userId(friend.getId())
                    .username(friend.getUsername())
                    .avatarUrl(friend.getProfile() != null ? friend.getProfile().getAvatarUrl() : null)
                    .lookingForGroup(friend.getProfile() != null && friend.getProfile().isLookingForGroup())
                    .requestType("accepted")
                    .build());
        }

        for (Friendship f : receivedAccepted) {
            User friend = f.getUser1();
            friends.add(FriendshipRequest.builder()
                    .id(f.getId())
                    .userId(friend.getId())
                    .username(friend.getUsername())
                    .avatarUrl(friend.getProfile() != null ? friend.getProfile().getAvatarUrl() : null)
                    .lookingForGroup(friend.getProfile() != null && friend.getProfile().isLookingForGroup())
                    .requestType("accepted")
                    .build());
        }

        return friends;
    }

    // İki kullanıcı arasındaki ilişki durumunu kontrol et
    public String getFriendshipStatus(Long otherUserId) {
        User currentUser = getAuthenticatedUser();
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Kendi kendine
        if (currentUser.getId().equals(otherUserId)) {
            return "SELF";
        }

        // Her iki yönde kontrol
        java.util.Optional<Friendship> f1 = friendshipRepository.findByUser1AndUser2(currentUser, otherUser);
        java.util.Optional<Friendship> f2 = friendshipRepository.findByUser1AndUser2(otherUser, currentUser);

        if (f1.isPresent()) {
            return f1.get().getStatus();
        }
        if (f2.isPresent()) {
            String status = f2.get().getStatus();
            if ("PENDING".equals(status)) {
                return "PENDING_RECEIVED"; // Diğeri bana istek atmış
            }
            return status;
        }

        return "NONE";
    }

    // Arkadaşlıktan çıkar / İstek iptal et
    public void removeFriend(Long otherUserId) {
        User currentUser = getAuthenticatedUser();
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Yeni eklediğimiz atomik silme sorgusunu kullan
        friendshipRepository.deleteRelationship(currentUser.getId(), otherUser.getId());
    }
}
