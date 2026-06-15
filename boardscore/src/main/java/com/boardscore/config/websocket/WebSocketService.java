package com.boardscore.config.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(
            SimpMessagingTemplate messagingTemplate
    ) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendRankingUpdate(
            String roomCode,
            Object ranking
    ) {

        System.out.println(
                "Enviando ranking para sala: "
                        + roomCode
        );
        messagingTemplate.convertAndSend(
                "/topic/ranking/" + roomCode,
                ranking
        );
    }

    public void sendRoomUpdate(
            String roomCode,
            Object payload
    ) {

        messagingTemplate.convertAndSend(
                "/topic/room/" + roomCode,
                payload
        );
    }
}