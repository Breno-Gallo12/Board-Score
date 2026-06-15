package com.boardscore.score;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/scores")
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @PostMapping
    public Score createScore(@RequestBody CreateScoreRequest request) {
        return scoreService.createScore(request);
    }

    @PostMapping("/azul-grid")
    public Score calculateFromGrid(
            @RequestParam("playerId") String playerId,
            @RequestParam("roundNumber") Integer roundNumber,
            @RequestParam("row") int row,
            @RequestParam("col") int col,
            @RequestBody boolean[][] wall
    ) {
        return scoreService.calculateAzulWallScore(playerId, roundNumber, wall, row, col);
    }

    @PostMapping("/floor-line")
    public Score applyFloorLine(
            @RequestParam("playerId") String playerId,
            @RequestParam("roundNumber") Integer roundNumber,
            @RequestParam("tilesCount") int tilesCount
    ) {
        return scoreService.applyFloorLine(playerId, roundNumber, tilesCount);
    }

    @PostMapping("/endgame")
    public Score applyEndgame(
            @RequestParam("playerId") String playerId,
            @RequestBody boolean[][] wall
    ) {
        return scoreService.applyEndGameBonuses(playerId, wall);
    }

    @PostMapping("/rollback")
    public void rollbackRound(
            @RequestParam("playerId") String playerId,
            @RequestParam("roundNumber") Integer roundNumber
    ) {
        scoreService.rollbackRound(playerId, roundNumber);
    }
}