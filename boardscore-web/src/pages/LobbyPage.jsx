import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { api } from "../services/api";
import { connectRoomSocket } from "../services/websocket";

export default function LobbyPage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [roomStatus, setRoomStatus] = useState(null);
    const [players, setPlayers] = useState([]);

    const playerId = localStorage.getItem("playerId");

    async function loadRoomStatus() {
        const response = await api.get(`/rooms/${roomCode}/status`);
        setRoomStatus(response.data);
    }

    async function loadPlayers() {
        const response = await api.get(`/rooms/${roomCode}/players`);
        setPlayers(response.data);
    }

    async function startGame() {
        try {
            await api.post(`/rooms/${roomCode}/start`);
        } catch (error) {
            console.error(error);
            alert("Erro ao iniciar partida");
        }
    }

    useEffect(() => {
        loadRoomStatus();
        loadPlayers();

        const client = connectRoomSocket(
            roomCode,
            async (payload) => {
                setRoomStatus(payload);
                await loadPlayers();
            }
        );

        return () => client.deactivate();
    }, [roomCode]);

    useEffect(() => {
        if (roomStatus && roomStatus.gameStarted) {
            navigate(`/room/${roomCode}`);
        }
    }, [roomStatus, navigate, roomCode]);

    if (!roomStatus) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
                <div className="text-blue-400 text-xl font-bold animate-pulse">A Carregar Sala...</div>
            </div>
        );
    }

    const isHost = playerId === roomStatus.hostPlayerId;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                <div className="text-center mb-8 sm:mb-12 mt-4">
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
                        Sala de Espera
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Aguardando jogadores entrarem na partida...
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">

                    {/* COLUNA ESQUERDA: CONVITE */}
                    <div className="bg-slate-800/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-700/50 flex flex-col items-center shadow-xl text-center">
                        <h2 className="text-xl font-bold text-slate-300 mb-6 uppercase tracking-widest">
                            Convide os seus amigos
                        </h2>

                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl mb-8 transform transition-transform hover:scale-105">
                            <QRCode
                                value={`${window.location.origin}/join/${roomCode}`}
                                size={200}
                                level="H"
                            />
                        </div>

                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Código da Sala
                        </p>
                        <div className="bg-slate-900/50 px-8 py-3 rounded-2xl border border-slate-600">
                            <p className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                {roomCode}
                            </p>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: JOGADORES & START */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-slate-800/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-700/50 shadow-xl flex-grow">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-300 uppercase tracking-widest">
                                    Jogadores
                                </h2>
                                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/30">
                                    {players.length} Conectados
                                </span>
                            </div>

                            <div className="space-y-3">
                                {players.map(player => (
                                    <div
                                        key={player.id}
                                        className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-3 text-lg font-medium"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner text-sm">
                                            {player.id === roomStatus.hostPlayerId ? "👑" : "👤"}
                                        </div>
                                        <span>{player.nickname}</span>
                                        {player.id === playerId && (
                                            <span className="ml-auto text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                (Você)
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BOTÃO DE INICIAR (Apenas Host) */}
                        {isHost ? (
                            <button
                                onClick={startGame}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white p-6 rounded-3xl font-black text-2xl transition-all shadow-[0_10px_25px_rgba(16,185,129,0.4)] active:scale-95 border border-green-400/50"
                            >
                                INICIAR PARTIDA
                            </button>
                        ) : (
                            <div className="w-full bg-slate-800/50 p-6 rounded-3xl text-center border border-slate-700/50 flex flex-col items-center justify-center gap-2">
                                <span className="text-2xl animate-spin">⏳</span>
                                <span className="text-slate-400 font-bold text-lg">A aguardar que o Host inicie a partida...</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}