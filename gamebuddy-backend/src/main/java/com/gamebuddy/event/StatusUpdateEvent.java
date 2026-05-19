package com.gamebuddy.event;

import lombok.Getter;

@Getter
public class StatusUpdateEvent {
    private final Long userId;
    private final String username;
    private final String avatarUrl;
    private final boolean lookingForGroup;
    private final String favoriteGames;

    public StatusUpdateEvent(Long userId, String username, String avatarUrl, boolean lookingForGroup, String favoriteGames) {
        this.userId = userId;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.lookingForGroup = lookingForGroup;
        this.favoriteGames = favoriteGames;
    }
}
