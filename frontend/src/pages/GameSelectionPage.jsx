import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Shapes, Palette, Puzzle, Trophy, Brain, 
  Search, Image, HelpCircle, LogOut, Volume2, Star
} from "lucide-react";
import { Button } from "../components/ui/button";

const games = [
  {
    id: 'shapes',
    name: 'Выбери фигуру',
    icon: Shapes,
    color: 'from-blue-400 to-cyan-400',
    borderColor: 'border-blue-200',
    path: '/game/shapes',
    voiceText: 'Выбери фигуру. В этой игре нужно выбрать правильную фигуру.'
  },
  {
    id: 'colors',
    name: 'Выбери цвет',
    icon: Palette,
    color: 'from-pink-400 to-rose-400',
    borderColor: 'border-pink-200',
    path: '/game/colors',
    voiceText: 'Выбери цвет. В этой игре нужно выбрать правильный цвет.'
  },
  {
    id: 'puzzles',
    name: 'Пазлы',
    icon: Puzzle,
    color: 'from-purple-400 to-violet-400',
    borderColor: 'border-purple-200',
    path: '/game/puzzles',
    voiceText: 'Пазлы. В этой игре нужно собрать картинку из частей.'
  },
  {
    id: 'matryoshka',
    name: 'Матрёшка',
    icon: Trophy,
    color: 'from-orange-400 to-amber-400',
    borderColor: 'border-orange-200',
    path: '/game/matryoshka',
    voiceText: 'Матрёшка. Расставь фигуры от маленькой к большой.'
  },
  {
    id: 'odd-one-out',
    name: '4 лишний',
    icon: Brain,
    color: 'from-green-400 to-emerald-400',
    borderColor: 'border-green-200',
    path: '/game/odd-one-out',
    voiceText: 'Четыре лишний. Найди картинку, которая не подходит к остальным.'
  },
  {
    id: 'find-pair',
    name: 'Найди пару',
    icon: Search,
    color: 'from-teal-400 to-cyan-400',
    borderColor: 'border-teal-200',
    path: '/game/find-pair',
    voiceText: 'Найди пару. Найди две одинаковые картинки.'
  },
  {
    id: 'memory',
    name: 'Память',
    icon: Image,
    color: 'from-indigo-400 to-blue-400',
    borderColor: 'border-indigo-200',
    path: '/game/memory',
    voiceText: 'Память. Запомни картинки и найди их потом.'
  },
  {
    id: 'absurdity',
    name: 'Нелепица',
    icon: HelpCircle,
    color: 'from-red-400 to-pink-400',
    borderColor: 'border-red-200',
    path: '/game/absurdity',
    voiceText: 'Нелепица. Найди странные и смешные картинки.'
  }
];

export default function GameSelectionPage() {
  const navigate = useNavigate();
  const [childName, setChildName] = useState("");
  const [hoveredGame, setHoveredGame] = useState(null);

  useEffect(() => {
    const name = localStorage.getItem('childName');
    const childId = localStorage.getItem('childId');
    
    if (!childId) {
      navigate('/child/name');
      return;
    }
    
    setChildName(name || 'Друг');
  }, [navigate]);

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const handleGameClick = (game) => {
    speak(game.voiceText);
    setTimeout(() => {
      navigate(game.path);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('childId');
    localStorage.removeItem('childName');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 text-yellow-400/20 animate-float">
        <Star size={80} />
      </div>
      <div className="absolute top-40 right-10 text-pink-400/20 animate-float" style={{ animationDelay: '1s' }}>
        <Star size={60} />
      </div>
      <div className="absolute bottom-20 left-20 text-purple-400/20 animate-float" style={{ animationDelay: '2s' }}>
        <Star size={50} />
      </div>
      <div className="absolute bottom-40 right-40 text-green-400/20 animate-float" style={{ animationDelay: '0.5s' }}>
        <Star size={70} />
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-4xl font-bold text-gray-800">
              Привет, {childName}! 
            </h1>
            <p className="text-gray-600 mt-1">Выбери игру, в которую хочешь поиграть</p>
          </div>
          <Button
            data-testid="logout-button"
            variant="outline"
            onClick={handleLogout}
            className="border-2 border-gray-300 hover:border-red-300 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>

        {/* Voice instruction */}
        <Button
          data-testid="voice-games-instruction"
          variant="outline"
          className="w-full max-w-md mx-auto mb-8 h-14 border-2 border-yellow-400 hover:bg-yellow-50 text-lg flex items-center justify-center"
          onClick={() => speak("Выбери игру, нажав на картинку. Я расскажу тебе, что нужно делать!")}
        >
          <Volume2 className="mr-2 h-5 w-5 text-yellow-600" />
          Нажми, чтобы услышать подсказку
        </Button>

        {/* Games grid */}
        <div className="game-grid max-w-5xl mx-auto">
          {games.map((game, index) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                data-testid={`game-card-${game.id}`}
                className={`game-card ${game.borderColor} animate-bounce-in stagger-${index + 1}`}
                style={{ opacity: 0, animationFillMode: 'forwards' }}
                onClick={() => handleGameClick(game)}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                {/* Animated background */}
                <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${game.color} opacity-0 transition-opacity duration-300 ${hoveredGame === game.id ? 'opacity-10' : ''}`} />
                
                {/* Icon */}
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 shadow-lg transform transition-transform duration-300 ${hoveredGame === game.id ? 'scale-110 rotate-3' : ''}`}>
                  <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                
                {/* Name */}
                <h3 className={`font-heading text-lg md:text-xl font-bold text-gray-700 text-center transition-colors duration-300 ${hoveredGame === game.id ? 'text-blue-600' : ''}`}>
                  {game.name}
                </h3>

                {/* Voice indicator */}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center transition-transform duration-300 ${hoveredGame === game.id ? 'scale-110' : ''}`}>
                  <Volume2 className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
