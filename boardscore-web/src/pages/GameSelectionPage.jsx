import { useNavigate } from "react-router-dom";

export default function GameSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 p-8 flex flex-col items-center">
      
      <div className="text-center mt-10 mb-16">
        <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4 tracking-tight">
          BoardScore
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl font-medium">
          Escolha um jogo para começar a partida
        </p>
      </div>

      {/* GRELHA DE JOGOS (Catálogo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        
        {/* CARD DO JOGO AZUL */}
        <div 
          onClick={() => navigate("/games/azul")}
          className="group cursor-pointer bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:-translate-y-2 transition-all duration-300 flex flex-col"
        >
          {/* ESPAÇO PARA A IMAGEM (CAPA DO JOGO) */}
          <div className="w-full aspect-square bg-slate-900 relative overflow-hidden">
            {/* 
              Coloque a imagem do jogo na pasta: public/games/azul-cover.png 
              Se a imagem não existir, ele vai mostrar o fundo azul com o texto de fallback.
            */}
            <img 
              src="/tiles/azul-cover.png" 
              alt="Capa do jogo Azul" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* FALLBACK (Caso a imagem ainda não tenha sido adicionada) */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-700 hidden items-center justify-center">
              <span className="text-white font-black text-4xl tracking-widest drop-shadow-lg">AZUL</span>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Azul
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Gerencie a sua parede com seus amigos, e calcule os pontos em tempo real.
            </p>
            <button className="w-full bg-blue-600/20 text-blue-400 font-bold py-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              Jogar Agora
            </button>
          </div>
        </div>

        {/* EM BREVE (Exemplo de espaço para futuros jogos) */}
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/50 overflow-hidden shadow-inner flex flex-col opacity-60 grayscale">
          <div className="w-full aspect-square bg-slate-800 flex items-center justify-center">
            <span className="text-6xl">🎲</span>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-500 mb-2">
              Em Breve...
            </h2>
            <p className="text-slate-500 text-sm">
              Mais jogos de tabuleiro serão adicionados em breve à plataforma.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}