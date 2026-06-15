package com.boardscore.room;

import com.boardscore.config.websocket.WebSocketService;
import com.boardscore.player.JoinRoomRequest;
import com.boardscore.player.Player;
import com.boardscore.player.PlayerRepository;
import com.boardscore.score.RankingResponse;
import com.boardscore.score.Score;
import com.boardscore.score.ScoreRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final PlayerRepository playerRepository;
    private final ScoreRepository scoreRepository;
    private final WebSocketService webSocketService;

    public RoomService(
            RoomRepository roomRepository,
            PlayerRepository playerRepository,
            ScoreRepository scoreRepository,
            WebSocketService webSocketService
    ) {
        this.roomRepository = roomRepository;
        this.playerRepository = playerRepository;
        this.scoreRepository = scoreRepository;
        this.webSocketService = webSocketService;
    }

    public Room createRoom(CreateRoomRequest request) {
        Room room = new Room();
        room.setCode(generateCode());
        room.setGameType(request.gameType());
        return roomRepository.save(room);
    }

    public List<Room> getRooms() {
        return roomRepository.findAll();
    }

    public Player joinRoom(String code, JoinRoomRequest request) {
        Room room = roomRepository.findByCode(code).orElseThrow();
        Player player = new Player();
        player.setNickname(request.nickname());
        player.setRoom(room);
        player.setReadyForNextRound(false);
        Player savedPlayer = playerRepository.save(player);

        if (room.getHostPlayerId() == null) {
            room.setHostPlayerId(savedPlayer.getId());
            roomRepository.save(room);
        }

        webSocketService.sendRoomUpdate(room.getCode(), getRoomStatus(room.getCode()));
        return savedPlayer;
    }

    public List<Player> getPlayers(String code) {
        return playerRepository.findByRoomCode(code);
    }

    public List<RankingResponse> getRanking(String code) {
        List<Player> players = playerRepository.findByRoomCode(code);
        List<RankingResponse> ranking = new ArrayList<>();

        for (Player player : players) {
            Integer totalScore = scoreRepository.findByPlayerId(player.getId())
                    .stream()
                    .mapToInt(Score::getTotalPoints)
                    .sum();

            ranking.add(new RankingResponse(player.getNickname(), totalScore));
        }

        ranking.sort(Comparator.comparing(RankingResponse::totalPoints).reversed());
        return ranking;
    }

    public Room startGame(String code) {
        Room room = roomRepository.findByCode(code).orElseThrow();
        room.setGameStarted(true);
        Room savedRoom = roomRepository.save(room);
        webSocketService.sendRoomUpdate(room.getCode(), getRoomStatus(room.getCode()));
        return savedRoom;
    }

    public Room nextRound(String code) {
        Room room = roomRepository.findByCode(code).orElseThrow();
        room.setCurrentRound(room.getCurrentRound() + 1);
        Room savedRoom = roomRepository.save(room);

        List<Player> players = playerRepository.findByRoomCode(code);
        for (Player player : players) {
            player.setReadyForNextRound(false);
        }
        playerRepository.saveAll(players);

        webSocketService.sendRoomUpdate(room.getCode(), getRoomStatus(room.getCode()));
        return savedRoom;
    }

    public Room finishGame(String code) {
        Room room = roomRepository.findByCode(code).orElseThrow();
        room.setGameFinished(true);
        webSocketService.sendRoomUpdate(room.getCode(), getRoomStatus(room.getCode()));
        return roomRepository.save(room);
    }

    public void setPlayerReady(String code, String playerId, boolean[][] wall) {
        Player player = playerRepository.findById(playerId).orElseThrow();
        player.setReadyForNextRound(true);
        if (wall != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                player.setWallState(mapper.writeValueAsString(wall));
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
        playerRepository.save(player);
        webSocketService.sendRoomUpdate(code, getRoomStatus(code));
    }

    public void setPlayerUnready(String code, String playerId, boolean[][] oldWall) {
        Player player = playerRepository.findById(playerId).orElseThrow();
        player.setReadyForNextRound(false);
        if (oldWall != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                player.setWallState(mapper.writeValueAsString(oldWall));
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
        playerRepository.save(player);
        webSocketService.sendRoomUpdate(code, getRoomStatus(code));
    }

    public Room finishScoring(String code) {
        Room room = roomRepository.findByCode(code).orElseThrow();
        room.setEndgameCalculated(true);
        webSocketService.sendRoomUpdate(code, getRoomStatus(code));
        return roomRepository.save(room);
    }

    public Room resumeGame(String code) {
        Room room = roomRepository.findByCode(code).orElseThrow();
        room.setGameFinished(false);
        room.setEndgameCalculated(false); // NOVO AQUI
        webSocketService.sendRoomUpdate(room.getCode(), getRoomStatus(room.getCode()));
        return roomRepository.save(room);
    }

    public RoomStatusResponse getRoomStatus(String code) {
        Room room = roomRepository.findByCode(code).orElseThrow();
        List<Player> players = playerRepository.findByRoomCode(code);
        return new RoomStatusResponse(
                room.getCode(),
                room.getGameType().name(),
                room.getCurrentRound(),
                room.getGameStarted(),
                room.getGameFinished(),
                room.getEndgameCalculated(), // NOVO AQUI
                room.getHostPlayerId(),
                room.getTargetScore(),
                room.getWinnerPlayerId(),
                players
        );
    }

    private String generateCode() {
        return "AZUL" + (int) (Math.random() * 1000);
    }
}