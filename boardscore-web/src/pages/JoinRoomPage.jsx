import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { Html5Qrcode } from "html5-qrcode";

export default function JoinRoomPage() {
  const { roomCode: paramRoomCode } = useParams();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState(paramRoomCode || "");
  const [isScanning, setIsScanning] = useState(false);
  
  // NOVO: Estado para gerir o nosso Alerta visual
  const [error, setError] = useState(null);

  // NOVO: Função que mostra o erro e o esconde após 4 segundos
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 4000);
  };

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      showError("⚠️ Por favor, digite o seu nome para criar uma sala.");
      return;
    }

    try {
      const roomResponse = await api.post("/rooms", { gameType: "AZUL" });
      const code = roomResponse.data.code;

      const joinResponse = await api.post(`/rooms/${code}/join`, { nickname });
      localStorage.setItem("playerId", joinResponse.data.id);
      localStorage.setItem("nickname", joinResponse.data.nickname);

      navigate(`/lobby/${code}`);
    } catch (error) {
      console.error(error);
      showError("❌ Ocorreu um erro no servidor ao tentar criar a sala.");
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim() && !roomCode.trim()) {
      showError("⚠️ Precisa preencher o seu nome e o código da sala.");
      return;
    }
    if (!nickname.trim()) {
      showError("⚠️ Digite o seu nome para poder entrar.");
      return;
    }
    if (!roomCode.trim()) {
      showError("⚠️ Falta preencher o código da sala.");
      return;
    }

    try {
      const codeToJoin = roomCode.trim().toUpperCase();
      const response = await api.post(`/rooms/${codeToJoin}/join`, { nickname });

      localStorage.setItem("playerId", response.data.id);
      localStorage.setItem("nickname", response.data.nickname);

      navigate(`/lobby/${codeToJoin}`);
    } catch (error) {
      console.error(error);
      showError("❌ Sala não encontrada! Verifique o código e tente novamente.");
    }
  };

  useEffect(() => {
    let html5QrCode;
    let timer;

    if (isScanning) {
      timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("qr-reader");

          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              const code = decodedText.split("/").pop().toUpperCase();
              setRoomCode(code);
              setIsScanning(false);
              
              if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
              }
            },
            (errorMessage) => {
            }
          ).catch((err) => {
            console.error("Erro ao iniciar a câmara:", err);
            showError("📷 Câmara bloqueada! Aceda via HTTPS ou dê permissão.");
            setIsScanning(false);
          });
        } catch (e) {
          console.error("Erro na inicialização da câmara:", e);
          setIsScanning(false);
        }
      }, 200);
    }

    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex items-center justify-center p-4 relative">
      
      {/* NOVO: TOAST FLUTUANTE DE ERRO */}
      {error && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] w-11/12 max-w-md animate-[bounce_0.3s_ease-out]">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-[0_15px_40px_rgba(239,68,68,0.4)] border border-red-400 font-bold text-center">
            {error}
          </div>
        </div>
      )}

      {/* MODAL DO LEITOR DE QR CODE */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-600 p-6 rounded-3xl w-full max-w-sm flex flex-col items-center shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Escaneie o Código</h3>
            <p className="text-slate-400 text-sm mb-6 text-center">Aponte a câmara para o QR Code na tela do Host.</p>
            
            <div className="w-full aspect-square rounded-2xl overflow-hidden border-4 border-blue-500/50 mb-8 bg-black shadow-inner relative flex items-center justify-center">
              <div id="qr-reader" className="w-full h-full object-cover"></div>
              <div className="absolute inset-0 border-2 border-blue-400/30 rounded-2xl pointer-events-none"></div>
            </div>
            
            <button
              onClick={() => setIsScanning(false)}
              className="w-full py-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-bold transition-colors active:scale-95"
            >
              Cancelar Leitura
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL DA PÁGINA */}
      <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-700/50">
        
        <h1 className="text-3xl font-black mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          BoardScore
        </h1>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
            O seu Perfil
          </label>
          <input
            type="text"
            placeholder="Como quer ser chamado?"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-900/50 text-white border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-medium text-lg"
          />
        </div>

        <div>
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white p-4 rounded-xl font-bold transition-all shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95 mb-8 text-lg"
          >
            Criar Nova Sala (Azul)
          </button>
        </div>

        <div className="relative flex py-5 items-center mb-4">
          <div className="flex-grow border-t border-slate-700/80"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 font-bold text-sm uppercase tracking-widest">Ou entrar numa existente</span>
          <div className="flex-grow border-t border-slate-700/80"></div>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Código da Sala
            </label>
            
            <div className="relative group">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: AZUL123"
                className="w-full p-4 pr-16 rounded-xl bg-slate-900/50 text-white border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none uppercase font-black tracking-widest text-lg transition-all"
              />
              
              <button
                onClick={() => setIsScanning(true)}
                title="Escanear QR Code"
                className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-800 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all duration-300 flex items-center justify-center border border-slate-700 hover:border-blue-500 shadow-sm active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7V4h3"></path><path d="M20 7V4h-3"></path><path d="M4 17v3h3"></path><path d="M20 17v3h-3"></path><line x1="7" y1="12" x2="17" y2="12" className="opacity-60"></line>
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={handleJoinRoom}
            className="w-full bg-slate-700 hover:bg-blue-600 text-white p-4 rounded-xl font-bold transition-all active:scale-95 text-lg shadow-md"
          >
            Entrar na Sala
          </button>
        </div>
      </div>
    </div>
  );
}