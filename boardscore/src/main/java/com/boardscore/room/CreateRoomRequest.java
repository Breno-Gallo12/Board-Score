package com.boardscore.room;

import com.boardscore.game.GameType;

public record CreateRoomRequest(
        GameType gameType
) {
}