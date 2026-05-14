package com.gamebuddy.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileResponse {
    private Long userId;
    private String username;
    private String bio;
    private String favoriteGames;
    private String avatarUrl;
    private String status;
    private String friendshipStatus;
}
