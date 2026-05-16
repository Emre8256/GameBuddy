package com.gamebuddy.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String bio;
    private String favoriteGames; // Virgülle ayrılmış oyun isimleri (örn: "CS2,Valorant,LoL")
    private String avatarUrl;
    private boolean lookingForGroup;
}
