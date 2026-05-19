package com.gamebuddy.service;

import com.gamebuddy.dto.MessageRequest;
import com.gamebuddy.dto.MessageResponse;
import com.gamebuddy.dto.PlayerMatchResponse;
import com.gamebuddy.entity.Friendship;
import com.gamebuddy.entity.Message;
import com.gamebuddy.entity.User;
import com.gamebuddy.repository.FriendshipRepository;
import com.gamebuddy.repository.MessageRepository;
import com.gamebuddy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.gamebuddy.event.ReadReceiptEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final ApplicationEventPublisher eventPublisher;

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("Unauthenticated user");
    }

    private void checkFriendship(User user1, User user2) {
        java.util.Optional<Friendship> f1 = friendshipRepository.findByUser1AndUser2(user1, user2);
        java.util.Optional<Friendship> f2 = friendshipRepository.findByUser1AndUser2(user2, user1);

        String status = null;
        if (f1.isPresent()) {
            status = f1.get().getStatus();
        } else if (f2.isPresent()) {
            status = f2.get().getStatus();
        }

        if (status == null) {
            throw new RuntimeException("You can only message users who are your friends. Send a friend request first.");
        }
        if (!"ACCEPTED".equals(status)) {
            throw new RuntimeException(
                    "You can only message users who are your friends. Waiting for friend request to be accepted.");
        }
    }

    public MessageResponse sendMessage(MessageRequest request) {
        if (request.getContent() == null || request.getContent().length() > 500) {
            throw new IllegalArgumentException("Message content must be between 1 and 500 characters.");
        }

        User sender = getAuthenticatedUser();
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Arkadaş kontrolü
        checkFriendship(sender, receiver);

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(request.getContent());
        message.setTimestamp(LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);

        return MessageResponse.builder()
                .id(savedMessage.getId())
                .senderId(sender.getId())
                .receiverId(receiver.getId())
                .content(savedMessage.getContent())
                .timestamp(savedMessage.getTimestamp())
                .isRead(savedMessage.isRead())
                .build();
    }

    public MessageResponse sendMessage(Long senderId, Long receiverId, String content) {
        if (content == null || content.length() > 500) {
            throw new IllegalArgumentException("Message content must be between 1 and 500 characters.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Arkadaş kontrolü
        checkFriendship(sender, receiver);

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());

        Message savedMessage = messageRepository.save(message);

        return MessageResponse.builder()
                .id(savedMessage.getId())
                .senderId(sender.getId())
                .receiverId(receiver.getId())
                .content(savedMessage.getContent())
                .timestamp(savedMessage.getTimestamp())
                .isRead(savedMessage.isRead())
                .build();
    }

    public List<MessageResponse> getChatHistory(Long targetUserId) {
        User currentUser = getAuthenticatedUser();
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        // Arkadaş kontrolü
        checkFriendship(currentUser, targetUser);

        List<Message> messages = messageRepository.findChatHistory(currentUser, targetUser);

        // Mesajları okundu olarak işaretle
        boolean markedAnyAsRead = false;
        for (Message m : messages) {
            if (m.getReceiver().getId().equals(currentUser.getId()) && !m.isRead()) {
                m.setRead(true);
                messageRepository.save(m);
                markedAnyAsRead = true;
            }
        }

        if (markedAnyAsRead) {
            eventPublisher.publishEvent(new ReadReceiptEvent(targetUser.getId(), currentUser.getId()));
        }

        return messages.stream().map(m -> MessageResponse.builder()
                .id(m.getId())
                .senderId(m.getSender().getId())
                .receiverId(m.getReceiver().getId())
                .content(m.getContent())
                .timestamp(m.getTimestamp())
                .isRead(m.isRead())
                .build()).collect(Collectors.toList());
    }

    public List<PlayerMatchResponse> getInteractedUsers() {
        User currentUser = getAuthenticatedUser();
        List<User> users = messageRepository.findInteractedUsers(currentUser);

        // Sadece arkadaş olan kullanıcıları filtrele
        List<User> friends = users.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> {
                    java.util.Optional<Friendship> f1 = friendshipRepository.findByUser1AndUser2(currentUser, u);
                    java.util.Optional<Friendship> f2 = friendshipRepository.findByUser1AndUser2(u, currentUser);
                    String status = f1.map(Friendship::getStatus)
                            .orElseGet(() -> f2.map(Friendship::getStatus).orElse(null));
                    return "ACCEPTED".equals(status);
                })
                .collect(Collectors.toList());

        return friends.stream().map(u -> {
            Message lastMsg = messageRepository.findLastMessage(currentUser, u);
            int unread = messageRepository.countUnreadMessages(u, currentUser);

            return PlayerMatchResponse.builder()
                    .userId(u.getId())
                    .username(u.getUsername())
                    .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                    .lookingForGroup(u.getProfile() != null && u.getProfile().isLookingForGroup())
                    .lastMessage(lastMsg != null ? lastMsg.getContent() : null)
                    .lastMessageTime(lastMsg != null ? lastMsg.getTimestamp() : null)
                    .unreadCount(unread)
                    .build();
        }).collect(Collectors.toList());
    }
}
