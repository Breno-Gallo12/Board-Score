package com.boardscore.room;

import com.boardscore.player.Player;
import java.util.List;

public record RoomStatusResponse(
        String code,
        String gameType,
        Integer currentRound,
        Boolean gameStarted,
        Boolean gameFinished,
        Boolean endgameCalculated, // NOVO CAMPO
        String hostPlayerId,
        Integer targetScore,
        String winnerPlayerId,
        List<Player> players
) {}