import { BrowserRouter, Routes, Route } from "react-router-dom";

import GameSelectionPage from "./pages/GameSelectionPage";
import RoomPage from "./pages/RoomPage";
import LobbyPage from "./pages/LobbyPage";
import JoinRoomPage from "./pages/JoinRoomPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelectionPage />} />
        
        <Route path="/games/azul" element={<JoinRoomPage />} />
        <Route path="/join" element={<JoinRoomPage />} />
        <Route path="/join/:roomCode" element={<JoinRoomPage />} />
        
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;