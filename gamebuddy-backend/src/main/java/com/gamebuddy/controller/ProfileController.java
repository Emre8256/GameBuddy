package com.gamebuddy.controller;

import com.gamebuddy.dto.DiscoverPlayerResponse;
import com.gamebuddy.dto.ProfileResponse;
import com.gamebuddy.dto.ProfileUpdateRequest;
import com.gamebuddy.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PutMapping
    public ResponseEntity<String> updateProfile(@RequestBody ProfileUpdateRequest request) {
        profileService.updateProfile(request);
        return ResponseEntity.ok("Profile updated successfully");
    }

    @GetMapping("/discover")
    public ResponseEntity<List<DiscoverPlayerResponse>> discoverPlayers(@RequestParam(required = false) String game) {
        return ResponseEntity.ok(profileService.discoverPlayers(game));
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile() {
        return ResponseEntity.ok(profileService.getMyProfile());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileResponse> getUserProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getUserProfile(userId));
    }

    @GetMapping("/game-counts")
    public ResponseEntity<Map<String, Long>> getGameCounts() {
        return ResponseEntity.ok(profileService.getGameCounts());
    }
}
