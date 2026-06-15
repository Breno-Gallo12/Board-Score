package com.boardscore.score;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, String> {
    List<Score> findByPlayerId(String playerId);
    void deleteByPlayerIdAndRoundNumber(String playerId, Integer roundNumber);
}