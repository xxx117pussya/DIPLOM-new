import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Star, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";

export default function GameCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { gameName } = location.state || { gameName: "Игра" };

  useEffect(() => {
    // Просто поздравление без результатов
    const utterance = new SpeechSynthesisUtterance("Молодец! Ты справился!");
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute top-10 left-10 text-yellow-400/30 animate-float">
        <Star size={60} fill="currentColor" />
      </div>
      <div className="absolute top-20 right-20 text-pink-400/30 animate-float" style={{ animationDelay: '1s' }}>
        <Sparkles size={50} />
      </div>
      <div className="absolute bottom-20 left-20 text-purple-400/30 animate-float" style={{ animationDelay: '2s' }}>
        <Star size={40} fill="currentColor" />
      </div>

      {/* Main content - NO RESULTS SHOWN */}
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 max-w-md w-full text-center border-b-8 border-blue-200 animate-bounce-in relative z-10">
        {/* Happy emoji */}
        <div className="text-8xl mb-6 animate-pop">
          🎉
        </div>

        {/* Title - только поздравление, БЕЗ результатов */}
        <h1 className="font-heading text-4xl font-bold text-gray-800 mb-4">
          Молодец!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Ты справился с игрой "{gameName}"!
        </p>

        {/* Stars decoration */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((star) => (
            <Star
              key={star}
              size={40}
              className="text-yellow-400 fill-yellow-400 animate-pop"
              style={{ animationDelay: `${star * 0.2}s` }}
            />
          ))}
        </div>

        {/* Button - только продолжить играть */}
        <Button
          data-testid="back-to-games-button"
          onClick={() => navigate('/child/games')}
          className="w-full h-14 text-lg font-bold rounded-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600"
        >
          Играть дальше!
        </Button>
      </div>
    </div>
  );
}
