package com.boardscore.score;

public record CreateScoreRequest(
        String playerId,
        Integer roundNumber,
        Integer totalPoints
) {
}