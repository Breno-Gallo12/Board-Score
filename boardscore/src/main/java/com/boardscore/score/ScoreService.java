package com.boardscore.score;

import com.boardscore.config.websocket.WebSocketService;
import com.boardscore.player.Player;
import com.boardscore.player.PlayerRepository;
import com.boardscore.room.RoomService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final PlayerRepository playerRepository;
    private final WebSocketService webSocketService;
    private final RoomService roomService;

    public ScoreService(
            ScoreRepository scoreRepository,
            PlayerRepository playerRepository,
            WebSocketService webSocketService,
            RoomService roomService
    ) {
        this.scoreRepository = scoreRepository;
        this.playerRepository = playerRepository;
        this.webSocketService = webSocketService;
        this.roomService = roomService;
    }

    public Score createScore(CreateScoreRequest request) {
        return saveScoreWithFloorCheck(request.playerId(), request.roundNumber(), request.totalPoints());
    }

    private Score saveScoreWithFloorCheck(String playerId, Integer roundNumber, int pointsDelta) {
        Player player = playerRepository.findById(playerId).orElseThrow();

        int currentTotal = scoreRepository.findByPlayerId(playerId).stream()
                .mapToInt(Score::getTotalPoints).sum();

        int finalDelta = pointsDelta;
        if (currentTotal + pointsDelta < 0) {
            finalDelta = -currentTotal;
        }

        Score score = new Score();
        score.setPlayer(player);
        score.setRoundNumber(roundNumber);
        score.setTotalPoints(finalDelta);

        Score savedScore = scoreRepository.save(score);

        String roomCode = player.getRoom().getCode();
        webSocketService.sendRankingUpdate(roomCode, roomService.getRanking(roomCode));

        return savedScore;
    }

    public Score calculateAzulWallScore(String playerId, Integer roundNumber, boolean[][] wall, int row, int col) {
        if (!wall[row][col]) {
            return saveScoreWithFloorCheck(playerId, roundNumber, 0);
        }

        int hCount = 1;
        int c = col - 1;
        while (c >= 0 && wall[row][c]) { hCount++; c--; }
        c = col + 1;
        while (c < 5 && wall[row][c]) { hCount++; c++; }

        int vCount = 1;
        int r = row - 1;
        while (r >= 0 && wall[r][col]) { vCount++; r--; }
        r = row + 1;
        while (r < 5 && wall[r][col]) { vCount++; r++; }

        int points = 0;
        if (hCount == 1 && vCount == 1) {
            points = 1;
        } else if (hCount > 1 && vCount == 1) {
            points = hCount;
        } else if (hCount == 1 && vCount > 1) {
            points = vCount;
        } else {
            points = hCount + vCount;
        }

        return saveScoreWithFloorCheck(playerId, roundNumber, points);
    }

    public Score applyFloorLine(String playerId, Integer roundNumber, int tilesCount) {
        int[] penalties = {0, -1, -2, -4, -6, -8, -11, -14};
        int penalty = (tilesCount >= 0 && tilesCount <= 7) ? penalties[tilesCount] : -14;
        return saveScoreWithFloorCheck(playerId, roundNumber, penalty);
    }

    public Score applyEndGameBonuses(String playerId, boolean[][] wall) {
        int bonus = 0;

        for (int r = 0; r < 5; r++) {
            boolean complete = true;
            for (int c = 0; c < 5; c++) {
                if (!wall[r][c]) complete = false;
            }
            if (complete) bonus += 2;
        }

        for (int c = 0; c < 5; c++) {
            boolean complete = true;
            for (int r = 0; r < 5; r++) {
                if (!wall[r][c]) complete = false;
            }
            if (complete) bonus += 7;
        }

        for (int color = 0; color < 5; color++) {
            boolean complete = true;
            for (int r = 0; r < 5; r++) {
                for (int c = 0; c < 5; c++) {
                    if ((c - r + 5) % 5 == color) {
                        if (!wall[r][c]) complete = false;
                    }
                }
            }
            if (complete) bonus += 10;
        }

        return saveScoreWithFloorCheck(playerId, 999, bonus);
    }

    @Transactional
    public void rollbackRound(String playerId, Integer roundNumber) {
        scoreRepository.deleteByPlayerIdAndRoundNumber(playerId, roundNumber);
        Player player = playerRepository.findById(playerId).orElseThrow();
        String roomCode = player.getRoom().getCode();
        webSocketService.sendRankingUpdate(roomCode, roomService.getRanking(roomCode));
    }
}