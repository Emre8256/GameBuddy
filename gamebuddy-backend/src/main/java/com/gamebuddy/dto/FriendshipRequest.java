package com.gamebuddy.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendshipRequest {
    private Long id;
    private Long userId;
    private String username;
    private String avatarUrl;
    private boolean lookingForGroup;
    private String requestType; // "sent" or "received"
}
