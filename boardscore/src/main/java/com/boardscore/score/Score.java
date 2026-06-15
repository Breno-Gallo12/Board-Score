package com.boardscore.score;

import com.boardscore.player.Player;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private Integer roundNumber;

    private Integer totalPoints;;

    @ManyToOne
    private Player player;
}
