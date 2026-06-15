import { Client } from "@stomp/stompjs";

export function connectRoomSocket(
  roomCode,
  onMessage
) {
  const client = new Client({
    brokerURL: "ws://192.168.1.143:8080/ws",
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
    brokerURL: "ws://localhost:8080/ws",
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