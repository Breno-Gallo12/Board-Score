package com.boardscore.room;

import com.boardscore.game.GameType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String code;
    private LocalDateTime lastActivity = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private GameType gameType;

    private Integer currentRound = 1;
    private Boolean gameStarted = false;
    private Boolean gameFinished = false;

    private Boolean endgameCalculated = false;

    private String hostPlayerId;
    private Integer targetScore;
    private String winnerPlayerId;

    @PreUpdate
    public void setLastActivity() {
        this.lastActivity = LocalDateTime.now();
    }
}