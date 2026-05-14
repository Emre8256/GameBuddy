package com.gamebuddy.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DiscoverPlayerResponse {
    private Long userId;
    private String username;
    private List<String> commonGames;
    private String status;
    private String avatarUrl;
    private String friendshipStatus; // NONE, PENDING, PENDING_RECEIVED, ACCEPTED, SELF
}
