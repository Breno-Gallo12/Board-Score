package com.boardscore.player;

import com.boardscore.room.Room;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String nickname;

    @ManyToOne
    @JsonIgnore
    private Room room;

    private Boolean readyForNextRound = false;

    @Column(columnDefinition = "TEXT")
    private String wallState = "[[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]]";
}