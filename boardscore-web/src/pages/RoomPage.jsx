import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { connectRankingSocket, connectRoomSocket } from "../services/websocket";

const AZUL_BOARD = [
  ["blue", "yellow", "red", "black", "white"],
  ["white", "blue", "yellow", "red", "black"],
  ["black", "white", "blue", "yellow", "red"],
  ["red", "black", "white", "blue", "yellow"],
  ["yellow", "red", "black", "white", "blue"]
];

const TILE_COLORS = {
  "blue": "bg-blue-500",
  "yellow": "bg-amber-400",
  "red": "bg-red-500",
  "black": "bg-slate-800",
  "white": "bg-slate-200"
};

const FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

export default function RoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [ranking, setRanking] = useState([]);
  const [roomStatus, setRoomStatus] = useState(null);
  
  const [wallState, setWallState] = useState(Array(5).fill(null).map(() => Array(5).fill(false)));
  const [stagedWall, setStagedWall] = useState(Array(5).fill(null).map(() => Array(5).fill(false)));
  const [stagedFloorCount, setStagedFloorCount] = useState(0);

  const [backupWall, setBackupWall] = useState(null);
  const [backupStaged, setBackupStaged] = useState(null);
  const [backupFloor, setBackupFloor] = useState(0);
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasAutoFinished, setHasAutoFinished] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 4000);
  };

  const playerId = localStorage.getItem("playerId");
  const hasPlayerId = !!playerId;

  async function loadRoomStatus() {
    try {
      const response = await api.get(`/rooms/${roomCode}/status`);
      setRoomStatus(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadRanking() {
    try {
      const response = await api.get(`/rooms/${roomCode}/ranking`);
      setRanking(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function joinRoom() {
    if (!nickname.trim()) {
      showError("⚠️ Por favor, digite o seu nome para entrar na sala.");
      return;
    }

    try {
      const response = await api.post(`/rooms/${roomCode}/join`, { nickname });
      localStorage.setItem("playerId", response.data.id);
      localStorage.setItem("nickname", response.data.nickname);
      await loadRoomStatus();
      setNickname("");
    } catch (error) {
      console.error(error);
      showError("❌ Erro ao entrar. Verifique se a sala ainda existe.");
    }
  }

  function toggleStagedTile(row, col) {
    if (!playerId || roomStatus?.gameFinished || wallState[row][col] || isLocalPlayerReady) return;
    const newStaged = [...stagedWall.map(r => [...r])];
    if (!newStaged[row][col]) {
      for (let c = 0; c < 5; c++) newStaged[row][c] = false;
      newStaged[row][col] = true;
    } else {
      newStaged[row][col] = false;
    }
    setStagedWall(newStaged);
  }

  function handleFloorClick(index) {
    if (!playerId || roomStatus?.gameFinished || isLocalPlayerReady) return;
    if (stagedFloorCount === index + 1) setStagedFloorCount(0);
    else setStagedFloorCount(index + 1);
  }

  async function confirmRoundPlays() {
    setIsConfirming(true);
    setBackupWall(JSON.parse(JSON.stringify(wallState)));
    setBackupStaged(JSON.parse(JSON.stringify(stagedWall)));
    setBackupFloor(stagedFloorCount);

    let currentWall = JSON.parse(JSON.stringify(wallState));

    try {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (stagedWall[r][c]) {
            currentWall[r][c] = true;
            await api.post(`/scores/azul-grid`, currentWall, {
              params: { playerId, roundNumber: roomStatus?.currentRound || 1, row: r, col: c }
            });
          }
        }
      }

      if (stagedFloorCount > 0) {
        await api.post(`/scores/floor-line`, null, {
          params: { playerId, roundNumber: roomStatus?.currentRound || 1, tilesCount: stagedFloorCount }
        });
      }

      await api.post(`/rooms/${roomCode}/players/${playerId}/ready`, currentWall);

      setWallState(currentWall);
      setStagedWall(Array(5).fill(null).map(() => Array(5).fill(false)));
      setStagedFloorCount(0);
      
    } catch (error) {
      console.error(error);
      showError("❌ Ocorreu um erro ao confirmar a sua jogada. Tente novamente.");
    } finally {
      setIsConfirming(false);
    }
  }

  async function cancelConfirmation() {
    setIsConfirming(true);
    try {
      await api.post(`/scores/rollback`, null, {
        params: { playerId, roundNumber: roomStatus?.currentRound || 1 }
      });
      
      await api.post(`/rooms/${roomCode}/players/${playerId}/unready`, backupWall || wallState);
      
      if (backupWall) setWallState(backupWall);
      if (backupStaged) setStagedWall(backupStaged);
      setStagedFloorCount(backupFloor);
      
    } catch (error) {
      console.error(error);
      showError("❌ Não foi possível cancelar a jogada no servidor.");
    } finally {
      setIsConfirming(false);
    }
  }

  // NOVO: Calcula de forma automática os pontos para todos na sala de uma só vez
  async function applyAllEndGameBonuses() {
    if (!isHost || roomStatus?.endgameCalculated) return;
    try {
      const promises = roomStatus.players.map(player => {
        let pWall = Array(5).fill(null).map(() => Array(5).fill(false));
        try {
          if (player.wallState) pWall = JSON.parse(player.wallState);
        } catch(e) {}
        
        return api.post(`/scores/endgame`, pWall, { params: { playerId: player.id } });
      });

      await Promise.all(promises);
      await api.post(`/rooms/${roomCode}/finish-scoring`);
    } catch (error) {
      console.error(error);
      showError("❌ Erro ao calcular bônus finais para a sala.");
    }
  }

  async function nextRound() {
    try {
      await api.post(`/rooms/${roomCode}/next-round`);
    } catch (error) {
      console.error(error);
      showError("❌ Erro ao avançar para a próxima rodada.");
    }
  }

  async function executeFinishGame() {
    setShowFinishConfirm(false);
    try {
      await api.post(`/rooms/${roomCode}/finish`);
    } catch (error) {
      console.error(error);
      showError("❌ Erro ao tentar encerrar a partida.");
    }
  }

  async function resumeGame() {
    try {
      await api.post(`/rooms/${roomCode}/resume`);
    } catch (error) {
      console.error(error);
    }
  }

  function handleExitToMainPage() {
    localStorage.removeItem("playerId");
    localStorage.removeItem("nickname");
    navigate("/");
  }

  useEffect(() => {
    loadRanking();
    loadRoomStatus();
    const rankingClient = connectRankingSocket(roomCode, (novoRanking) => setRanking(novoRanking));
    const roomClient = connectRoomSocket(roomCode, (novoStatus) => setRoomStatus(novoStatus));
    return () => {
      rankingClient.deactivate();
      roomClient.deactivate();
    };
  }, [roomCode]);

  const isHost = roomStatus && playerId === roomStatus.hostPlayerId;
  const localPlayer = roomStatus?.players?.find(p => p.id === playerId);
  const isLocalPlayerReady = localPlayer?.readyForNextRound;
  
  const allPlayersReady = roomStatus?.players?.length > 0 && roomStatus.players.every(p => p.readyForNextRound);
  const hasCompletedRow = wallState.some(row => row.every(cell => cell === true));
  const hasPendingPlays = stagedWall.some(row => row.some(cell => cell)) || stagedFloorCount > 0;

  useEffect(() => {
    if (hasCompletedRow && roomStatus && !roomStatus.gameFinished && !hasAutoFinished) {
      setHasAutoFinished(true);
      api.post(`/rooms/${roomCode}/finish`).catch(console.error);
    }
  }, [hasCompletedRow, roomStatus, hasAutoFinished, roomCode]);

  useEffect(() => {
    let interval;
    if (allPlayersReady && !roomStatus?.gameFinished) {
      setCountdown(10);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev !== null && prev > 1) return prev - 1;
          return 0;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
    return () => clearInterval(interval);
  }, [allPlayersReady, roomStatus?.gameFinished]);

  useEffect(() => {
    if (isHost && allPlayersReady && !roomStatus?.gameFinished) {
      const timer = setTimeout(() => {
        nextRound();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isHost, allPlayersReady, roomStatus?.gameFinished]);

  const winnerData = ranking.length > 0 ? ranking[0] : null;
  const winnerPlayerObj = winnerData ? roomStatus?.players?.find(p => p.nickname === winnerData.nickname) : null;
  let winnerWall = Array(5).fill(null).map(() => Array(5).fill(false));
  try {
    if (winnerPlayerObj?.wallState) winnerWall = JSON.parse(winnerPlayerObj.wallState);
  } catch (e) {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 p-4 sm:p-8 pb-24 relative">
      
      {error && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] w-11/12 max-w-md animate-[bounce_0.3s_ease-out]">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-[0_15px_40px_rgba(239,68,68,0.4)] border border-red-400 font-bold text-center">
            {error}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE ENCERRAMENTO (Apenas Host) */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-600 p-6 sm:p-8 rounded-3xl w-full max-w-sm flex flex-col items-center shadow-2xl animate-[scale-in_0.2s_ease-out]">
            <div className="text-5xl mb-4 drop-shadow-lg">🛑</div>
            <h3 className="text-2xl font-black text-white mb-2 text-center">Encerrar Partida?</h3>
            <p className="text-slate-400 text-center mb-8 font-medium">Tem a certeza que deseja finalizar o jogo para todos os jogadores agora?</p>
            
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all active:scale-95 border border-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={executeFinishGame}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95"
              >
                Sim, Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DA TELA DE VITÓRIA E RANKING FINAL */}
      {roomStatus?.gameFinished && roomStatus?.endgameCalculated && winnerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-700/50 p-6 sm:p-10 rounded-3xl shadow-2xl space-y-8 my-8 text-center max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 animate-pulse tracking-tight mb-2">
                🏆 FIM DE JOGO 🏆
              </h2>
              <p className="text-slate-400 font-medium">A pontuação final foi calculada com sucesso!</p>
            </div>

            <div className="bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 p-6 sm:p-8 rounded-3xl shadow-lg shadow-amber-500/5 max-w-md mx-auto space-y-5">
              <div>
                <span className="text-sm font-extrabold text-amber-400 uppercase tracking-widest">Grande Vencedor</span>
                <h3 className="text-4xl font-black text-white mt-1">{winnerData.nickname}</h3>
                <p className="text-amber-400/90 font-black text-3xl mt-1 tabular-nums">{winnerData.totalPoints} <span className="text-base text-slate-400 font-medium">pontos</span></p>
              </div>

              <div className="flex flex-col items-center gap-3 pt-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">A Parede de {winnerData.nickname}</span>
                <div className="bg-[#d2c9b4] p-3 sm:p-4 rounded-2xl border-b-8 border-slate-800 shadow-inner w-full flex justify-center">
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full max-w-[240px] sm:max-w-[280px]">
                    {AZUL_BOARD.map((row, rIdx) =>
                      row.map((color, cIdx) => {
                        const isFilled = winnerWall[rIdx][cIdx];
                        return (
                          <div
                            key={`winner-mini-${rIdx}-${cIdx}`}
                            style={isFilled ? { backgroundImage: `url('/tiles/${color}.png')`, backgroundSize: 'cover' } : {}}
                            className={`aspect-square rounded-md transition-all ${isFilled ? 'border border-white/60 shadow-md opacity-100' : `border border-black/10 opacity-30 ${TILE_COLORS[color]}`}`}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-w-md mx-auto text-left">
              <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-2 text-center">Classificação Final</h4>
              {ranking.map((player, index) => (
                <div 
                  key={`final-rank-${player.nickname}`} 
                  className={`flex justify-between items-center p-4 rounded-2xl border ${
                    index === 0 ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold' : 
                    index === 1 ? 'bg-slate-400/5 border-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-900/10 border-orange-800/20 text-orange-300' :
                    'bg-slate-800/30 border-slate-700/30 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl w-6 text-center">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                    <span className="text-lg">{player.nickname}</span>
                  </span>
                  <span className="text-2xl font-black tabular-nums">{player.totalPoints}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleExitToMainPage}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-blue-950/50 transition-all active:scale-95 text-lg"
              >
                Voltar ao Início
              </button>
              {isHost && (
                <button 
                  onClick={resumeGame}
                  className="px-6 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 font-bold text-base transition-colors"
                >
                  Rever Partida
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL (TABULEIROS) */}
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Sala {roomCode}
            </h1>
            {roomStatus && (
              <div className="flex items-center gap-3 mt-1">
                <p className="text-slate-400 font-medium">
                  {roomStatus.gameFinished ? "Partida Encerrada" : `Rodada ${roomStatus.currentRound}`}
                </p>
                {allPlayersReady && !roomStatus.gameFinished && countdown !== null && (
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 border border-green-500/20 px-3 py-1 rounded-md animate-pulse">
                    🚀 Passando para próxima rodada em {countdown}s
                  </span>
                )}
              </div>
            )}
          </div>

          {/* BOTÃO DE FINALIZAR DO HOST */}
          {isHost && !roomStatus?.gameFinished && (
            <button 
              onClick={() => setShowFinishConfirm(true)} 
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-600 text-slate-400 hover:text-white border border-slate-700/50 hover:border-red-500 font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95"
            >
              <span>🛑</span> Finalizar Partida
            </button>
          )}
        </div>

        {/* ALERTA DE FIM DE JOGO (ANTES DO HOST CALCULAR OS BÓNUS) */}
        {roomStatus?.gameFinished && !roomStatus?.endgameCalculated && hasPlayerId && (
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 sm:p-8 rounded-3xl text-center shadow-2xl border border-amber-400/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/tiles/yellow.png')] opacity-10 mix-blend-overlay"></div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 relative z-10">Fim de Jogo!</h2>
            <p className="text-amber-100 mb-8 text-base sm:text-lg relative z-10">A partida terminou. A aguardar que os bónus finais sejam processados.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              {isHost ? (
                <button onClick={applyAllEndGameBonuses} className="bg-white text-amber-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 shadow-xl transition-transform hover:scale-105 active:scale-95">
                    Calcular Bônus para Todos (+2 Linhas, +7 Colunas, +10 Cores)
                </button>
              ) : (
                <div className="bg-white/10 border border-white/20 text-amber-100 px-8 py-4 rounded-xl font-bold flex items-center justify-center animate-pulse">
                    ⏳ Aguardando o Host revelar o vencedor...
                </div>
              )}
              
              {isHost && (
                <button onClick={resumeGame} className="bg-amber-900/40 border border-amber-400/30 text-amber-50 px-8 py-4 rounded-xl font-bold hover:bg-amber-900/60 transition-colors">
                    Voltar e Continuar Jogando
                </button>
              )}
            </div>
          </div>
        )}

        {!hasPlayerId && (
          <div className="bg-slate-800/80 backdrop-blur-lg p-6 sm:p-8 rounded-3xl border border-slate-700/50 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Junte-se à Partida</h2>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="O seu nome..."
              className="w-full p-4 rounded-xl bg-slate-900/50 text-white border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all mb-4 text-center font-bold text-lg"
            />
            <button onClick={joinRoom} className="w-full bg-blue-600 p-4 rounded-xl hover:bg-blue-500 font-bold text-lg shadow-lg shadow-blue-900/50 transition-all active:scale-95">
              Entrar na Sala
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-800/60 backdrop-blur-md p-4 sm:p-8 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Sua Parede</h2>
                  <p className="text-sm text-slate-400">Marque o que preencheu nesta rodada.</p>
                </div>
              </div>
              
              <div className="relative max-w-[400px] mx-auto w-full">
                {isLocalPlayerReady && (
                  <div className="absolute inset-0 bg-slate-900/70 z-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-green-500 text-white font-bold px-6 py-3 rounded-full shadow-lg text-lg flex items-center gap-2">
                      ✅ Aguardando os outros
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 bg-[#d2c9b4] p-2.5 sm:p-4 rounded-2xl shadow-inner border-b-8 border-slate-800 mb-6">
                  {AZUL_BOARD.map((row, rowIndex) =>
                    row.map((color, colIndex) => {
                      const isConfirmed = wallState[rowIndex][colIndex];
                      const isStaged = stagedWall[rowIndex][colIndex];
                      const fallbackColor = TILE_COLORS[color];
                      
                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => toggleStagedTile(rowIndex, colIndex)}
                          disabled={isConfirmed || roomStatus?.gameFinished || isLocalPlayerReady}
                          style={{ backgroundImage: `url('/tiles/${color}.png')`, backgroundSize: 'cover' }}
                          className={`w-full aspect-square rounded-md sm:rounded-lg transition-all relative flex items-center justify-center border-2 shadow-sm
                            ${isConfirmed ? 'opacity-100 border-white scale-95 shadow-inner' 
                            : isStaged ? 'opacity-100 border-green-400 scale-105 sm:scale-110 shadow-[0_0_15px_rgba(74,222,128,0.8)] z-10 ring-2 ring-green-400 ring-offset-1 ring-offset-[#d2c9b4]' 
                            : `opacity-40 border-black/10 hover:opacity-70 hover:scale-105 ${fallbackColor}`}`}
                        >
                          {isConfirmed && <div className="absolute inset-0 bg-black/20 rounded-md sm:rounded-lg flex items-center justify-center"><span className="text-white text-lg sm:text-xl font-black drop-shadow-md">✓</span></div>}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="w-full bg-[#d2c9b4] p-2.5 sm:p-4 rounded-2xl shadow-inner border-b-8 border-slate-800 relative mt-4">
                  {isLocalPlayerReady && <div className="absolute inset-0 z-20"></div>}
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-800/60 mb-2 text-center uppercase tracking-widest">Peças Caídas (Floor Line)</h3>
                  <div className="flex gap-1 sm:gap-1.5 justify-between">
                    {FLOOR_PENALTIES.map((penalty, idx) => {
                      const isSelected = idx < stagedFloorCount;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleFloorClick(idx)}
                          disabled={roomStatus?.gameFinished || isLocalPlayerReady}
                          className={`flex-1 aspect-[3/4] rounded-t-full flex items-center justify-center font-bold text-sm sm:text-lg border-b-4 transition-all
                            ${isSelected ? 'bg-red-500 text-white border-red-800 shadow-inner scale-105 -translate-y-1' : 'bg-slate-200 text-slate-400 border-slate-300 hover:bg-white'}`}
                        >
                          {penalty}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {hasPlayerId && !roomStatus?.gameFinished && (
                <div className="mt-8">
                  {isLocalPlayerReady ? (
                    <button onClick={cancelConfirmation} disabled={isConfirming} className="w-full py-4 rounded-2xl font-bold text-lg transition-all bg-slate-700 hover:bg-slate-600 text-white shadow-lg flex items-center justify-center gap-2 active:scale-95">
                      {isConfirming ? 'A Cancelar...' : '❌ Corrigir Jogada'}
                    </button>
                  ) : (
                    <button onClick={confirmRoundPlays} disabled={isConfirming} className={`w-full py-5 rounded-2xl font-extrabold text-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${hasPendingPlays ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-[0_10px_25px_rgba(16,185,129,0.4)]' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                      {isConfirming ? 'A Enviar...' : hasPendingPlays ? 'Confirmar Jogada ✓' : 'Passar a vez (Sem jogadas)'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-700/50">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">🏆 Ranking</h2>
              {ranking.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Nenhuma pontuação.</p>
              ) : (
                <div className="space-y-3">
                  {ranking.map((player, index) => (
                    <div key={player.nickname} className={`flex justify-between items-center p-4 rounded-2xl transition-all ${index === 0 ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400' : index === 1 ? 'bg-slate-400/10 text-slate-300 border border-slate-400/20' : index === 2 ? 'bg-orange-900/20 text-orange-300 border border-orange-800/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'}`}>
                      <span className="flex items-center gap-3">
                        <span className="text-2xl w-8 text-center drop-shadow-md">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-sm text-slate-500 font-bold">#{index + 1}</span>}</span>
                        <span className={`font-bold ${index === 0 ? 'text-lg' : ''}`}>{player.nickname}</span>
                      </span>
                      <span className={`text-2xl font-black tabular-nums ${index === 0 ? 'text-amber-400' : 'text-white'}`}>{player.totalPoints}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-700/30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-300">Tabuleiros & Status</h2>
                <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full border border-blue-500/30">{roomStatus?.players?.filter(p => p.readyForNextRound).length || 0} / {roomStatus?.players?.length || 0} Prontos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {roomStatus?.players?.map((player) => {
                  const isMe = player.id === playerId;
                  let pWall = Array(5).fill(null).map(() => Array(5).fill(false));
                  try { if (player.wallState) pWall = JSON.parse(player.wallState); } catch(e) {}
                  return (
                    <div key={player.id} className="bg-slate-900/50 p-4 rounded-2xl flex flex-col gap-4 border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-slate-200">
                          {roomStatus?.hostPlayerId === player.id && <span title="Host">👑</span>}
                          {player.nickname}
                          {isMe && <span className="text-xs text-slate-500 font-bold tracking-wider">(Você)</span>}
                        </div>
                        <div>
                          {player.readyForNextRound ? (
                            <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded-lg text-xs font-bold border border-green-400/20">Pronto</span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium flex items-center gap-1"><span className="animate-pulse">⏳</span> A pensar</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center bg-[#d2c9b4] p-1.5 rounded-xl border-b-4 border-slate-800">
                         <div className="grid grid-cols-5 gap-[2px] w-full max-w-[120px]">
                           {AZUL_BOARD.map((row, rIdx) =>
                             row.map((color, cIdx) => {
                               const isFilled = pWall[rIdx][cIdx];
                               return (
                                 <div
                                   key={`mini-${player.id}-${rIdx}-${cIdx}`}
                                   style={isFilled ? { backgroundImage: `url('/tiles/${color}.png')`, backgroundSize: 'cover' } : {}}
                                   className={`aspect-square rounded-sm transition-all ${isFilled ? 'border border-white/50 shadow-sm opacity-100' : `border border-black/10 opacity-40 ${TILE_COLORS[color]}`}`}
                                 />
                               );
                             })
                           )}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}