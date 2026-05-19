package com.gamebuddy.event;

import lombok.Getter;

@Getter
public class ReadReceiptEvent {
    private final Long targetUserId;
    private final Long readerId;

    public ReadReceiptEvent(Long targetUserId, Long readerId) {
        this.targetUserId = targetUserId;
        this.readerId = readerId;
    }
}
