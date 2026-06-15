package com.boardscore.room;

public record RoomEvent(
        String type,
        Object data
) {
}