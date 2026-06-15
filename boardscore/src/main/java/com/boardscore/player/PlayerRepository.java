package com.boardscore.player;


import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerRepository extends JpaRepository<Player, String> {
    List<Player> findByRoomCode(String code);
}