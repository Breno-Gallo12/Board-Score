package com.boardscore.room;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class RoomCleanupScheduler {

    @Autowired
    private RoomRepository roomRepository;

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanOldRooms() {
        LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);

        System.out.println("🧹 A iniciar limpeza de memória: Procurando salas inativas desde " + twoHoursAgo);
        roomRepository.findAll().forEach(room -> {
            if (room.getLastActivity() != null && room.getLastActivity().isBefore(twoHoursAgo)) {
                System.out.println("🗑️ Sala apagada por inatividade: " + room.getCode());
                roomRepository.delete(room);
            }
        });

        System.out.println("✨ Limpeza concluída!");
    }
}