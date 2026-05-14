package com.gamebuddy.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String username;
    private String bio;
    private String favoriteGames;
    private String avatarUrl;
    private String topThreeGames;
}
