package com.gamebuddy.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gamebuddy.dto.MessageResponse;
import com.gamebuddy.entity.User;
import com.gamebuddy.repository.UserRepository;
import com.gamebuddy.security.JwtUtil;
import com.gamebuddy.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    // Map: userId -> WebSocketSession
    private static final Map<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            String token = getQueryParam(session.getUri(), "token");
            if (token == null || token.isEmpty()) {
                session.close(CloseStatus.BAD_DATA.withReason("Token query parameter is required"));
                return;
            }

            String email = jwtUtil.extractUsername(token);
            if (email == null) {
                session.close(CloseStatus.POLICY_VIOLATION.withReason("Invalid JWT token"));
                return;
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                session.close(CloseStatus.POLICY_VIOLATION.withReason("User not found"));
                return;
            }

            Long userId = user.getId();
            session.getAttributes().put("userId", userId);
            sessions.put(userId, session);
            log.info("WebSocket connection established for user: {}", userId);
        } catch (Exception e) {
            log.error("Error establishing WebSocket connection", e);
            session.close(CloseStatus.SERVER_ERROR.withReason("Internal server error"));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long senderId = (Long) session.getAttributes().get("userId");
        if (senderId == null) {
            session.close(CloseStatus.POLICY_VIOLATION.withReason("Session not authenticated"));
            return;
        }

        try {
            IncomingMessage payload = objectMapper.readValue(message.getPayload(), IncomingMessage.class);
            if (payload == null || payload.getReceiverId() == null || payload.getContent() == null || payload.getContent().trim().isEmpty()) {
                sendError(session, "Invalid message content or receiverId");
                return;
            }

            // Save message to DB
            MessageResponse response = chatService.sendMessage(senderId, payload.getReceiverId(), payload.getContent().trim());
            com.fasterxml.jackson.databind.node.ObjectNode responseNode = (com.fasterxml.jackson.databind.node.ObjectNode) objectMapper.valueToTree(response);
            responseNode.put("type", "MESSAGE");
            String responseJson = objectMapper.writeValueAsString(responseNode);

            // Send back to sender
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(responseJson));
            }

            // Send to receiver if online
            WebSocketSession receiverSession = sessions.get(payload.getReceiverId());
            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.sendMessage(new TextMessage(responseJson));
            }
        } catch (Exception e) {
            log.error("Error processing message from sender: {}", senderId, e);
            sendError(session, "Failed to send message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            sessions.remove(userId);
            log.info("WebSocket connection closed for user: {}", userId);
        }
    }

    @org.springframework.context.event.EventListener
    public void handleStatusUpdate(com.gamebuddy.event.StatusUpdateEvent event) {
        try {
            Map<String, Object> update = Map.of(
                "type", "STATUS_UPDATE",
                "userId", event.getUserId(),
                "username", event.getUsername(),
                "avatarUrl", event.getAvatarUrl() != null ? event.getAvatarUrl() : "",
                "lookingForGroup", event.isLookingForGroup(),
                "favoriteGames", event.getFavoriteGames() != null ? event.getFavoriteGames() : ""
            );
            String json = objectMapper.writeValueAsString(update);
            TextMessage message = new TextMessage(json);
            
            sessions.values().forEach(session -> {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(message);
                    }
                } catch (IOException e) {
                    log.error("Error sending status update broadcast to session: {}", session.getId(), e);
                }
            });
        } catch (Exception e) {
            log.error("Error preparing status update broadcast", e);
        }
    }

    @org.springframework.context.event.EventListener
    public void handleReadReceipt(com.gamebuddy.event.ReadReceiptEvent event) {
        try {
            WebSocketSession session = sessions.get(event.getTargetUserId());
            if (session != null && session.isOpen()) {
                Map<String, Object> payload = Map.of(
                    "type", "READ_RECEIPT",
                    "readerId", event.getReaderId()
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            }
        } catch (Exception e) {
            log.error("Error sending read receipt to user: {}", event.getTargetUserId(), e);
        }
    }

    private void sendError(WebSocketSession session, String errorMsg) {
        try {
            if (session.isOpen()) {
                Map<String, String> error = Map.of("error", errorMsg);
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(error)));
            }
        } catch (IOException e) {
            log.error("Error sending error message", e);
        }
    }

    private String getQueryParam(URI uri, String paramName) {
        if (uri == null || uri.getQuery() == null) {
            return null;
        }
        String[] pairs = uri.getQuery().split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0 && pair.substring(0, idx).equals(paramName)) {
                return pair.substring(idx + 1);
            }
        }
        return null;
    }

    public static class IncomingMessage {
        private Long receiverId;
        private String content;

        public Long getReceiverId() { return receiverId; }
        public void setReceiverId(Long receiverId) { this.receiverId = receiverId; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
