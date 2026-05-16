package com.gamebuddy.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PlayerMatchResponse {
    private Long userId;
    private String username;
    private List<String> commonGames;
    private boolean lookingForGroup;
    private String avatarUrl;
    private String lastMessage;
    private java.time.LocalDateTime lastMessageTime;
    private Integer unreadCount;
}
