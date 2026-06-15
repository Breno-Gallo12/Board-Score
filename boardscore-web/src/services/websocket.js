import { Client } from "@stomp/stompjs";

const RAILWAY_DOMAIN = "board-score-production.up.railway.app";

export function connectRoomSocket(
  roomCode,
  onMessage
) {
  const client = new Client({
    brokerURL: `wss://${RAILWAY_DOMAIN}/ws`,
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(
        `/topic/room/${roomCode}`,
        message => {
          onMessage(JSON.parse(message.body));
        }
      );
    }
  });

  client.activate();
  return client;
}

export function connectRankingSocket(
  roomCode,
  onMessage
) {
  const client = new Client({
    brokerURL: `wss://${RAILWAY_DOMAIN}/ws`,
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(
        `/topic/ranking/${roomCode}`,
        message => {
          onMessage(JSON.parse(message.body));
        }
      );
    }
  });

  client.activate();
  return client;
}