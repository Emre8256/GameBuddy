package com.gamebuddy.controller;

import com.gamebuddy.dto.FriendshipRequest;
import com.gamebuddy.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friendship")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService friendshipService;

    @PostMapping("/request/{userId}")
    public ResponseEntity<Map<String, String>> sendFriendRequest(@PathVariable Long userId) {
        friendshipService.sendFriendRequest(userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Friend request sent successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/accept/{userId}")
    public ResponseEntity<Map<String, String>> acceptFriendRequest(@PathVariable Long userId) {
        friendshipService.acceptFriendRequest(userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Friend request accepted");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/decline/{userId}")
    public ResponseEntity<Map<String, String>> declineFriendRequest(@PathVariable Long userId) {
        friendshipService.declineFriendRequest(userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Friend request declined");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FriendshipRequest>> getPendingRequests() {
        return ResponseEntity.ok(friendshipService.getPendingRequests());
    }

    @GetMapping("/list")
    public ResponseEntity<List<FriendshipRequest>> getFriends() {
        return ResponseEntity.ok(friendshipService.getAcceptedFriends());
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<Map<String, String>> getFriendshipStatus(@PathVariable Long userId) {
        String status = friendshipService.getFriendshipStatus(userId);
        Map<String, String> response = new HashMap<>();
        response.put("status", status);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/remove/{userId}")
    public ResponseEntity<Map<String, String>> removeFriend(@PathVariable Long userId) {
        friendshipService.removeFriend(userId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Friend removed successfully");
        return ResponseEntity.ok(response);
    }
}
