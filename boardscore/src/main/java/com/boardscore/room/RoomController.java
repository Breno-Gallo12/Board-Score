package com.boardscore.room;

import com.boardscore.player.JoinRoomRequest;
import com.boardscore.player.Player;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public Room createRoom(@RequestBody CreateRoomRequest request) {
        return roomService.createRoom(request);
    }

    @GetMapping
    public List<Room> getRooms() {
        return roomService.getRooms();
    }

    @PostMapping("/{code}/join")
    public Player joinRoom(@PathVariable String code, @RequestBody JoinRoomRequest request) {
        return roomService.joinRoom(code, request);
    }

    @GetMapping("/{code}/players")
    public List<Player> getPlayers(@PathVariable String code) {
        return roomService.getPlayers(code);
    }

    @GetMapping("/{code}/ranking")
    public List<?> getRanking(@PathVariable String code) {
        return roomService.getRanking(code);
    }

    @PostMapping("/{code}/start")
    public Room startGame(@PathVariable String code) {
        return roomService.startGame(code);
    }

    @PostMapping("/{code}/next-round")
    public Room nextRound(@PathVariable String code) {
        return roomService.nextRound(code);
    }

    @PostMapping("/{code}/finish")
    public Room finishGame(@PathVariable String code) {
        return roomService.finishGame(code);
    }

    @PostMapping("/{code}/resume")
    public Room resumeGame(@PathVariable String code) {
        return roomService.resumeGame(code);
    }

    @GetMapping("/{code}/status")
    public RoomStatusResponse getRoomStatus(@PathVariable String code) {
        return roomService.getRoomStatus(code);
    }

    @PostMapping("/{code}/players/{playerId}/ready")
    public void setPlayerReady(@PathVariable String code, @PathVariable String playerId, @RequestBody(required = false) boolean[][] wall) {
        roomService.setPlayerReady(code, playerId, wall);
    }

    @PostMapping("/{code}/players/{playerId}/unready")
    public void setPlayerUnready(@PathVariable String code, @PathVariable String playerId, @RequestBody(required = false) boolean[][] oldWall) {
        roomService.setPlayerUnready(code, playerId, oldWall);
    }

    @PostMapping("/{code}/finish-scoring")
    public Room finishScoring(@PathVariable String code) {
        return roomService.finishScoring(code);
    }

    @DeleteMapping("/rooms/all")
    public ResponseEntity<String> deleteAllRooms() {
        roomService.deleteAllRooms();
        return ResponseEntity.ok("Todas as salas foram limpas com sucesso.");
    }
}