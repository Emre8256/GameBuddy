package com.gamebuddy.controller;

import com.gamebuddy.dto.MessageRequest;
import com.gamebuddy.dto.MessageResponse;
import com.gamebuddy.dto.PlayerMatchResponse;
import com.gamebuddy.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendMessage(@RequestBody MessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(request));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<List<MessageResponse>> getChatHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(chatService.getChatHistory(userId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<PlayerMatchResponse>> getConversations() {
        return ResponseEntity.ok(chatService.getInteractedUsers());
    }
}
