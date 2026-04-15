import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export default function GameLayout({ 
  children, 
  title, 
  voiceText,
  currentQuestion,
  totalQuestions,
  onVoiceClick
}) {
  const navigate = useNavigate();

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const handleVoice = () => {
    if (onVoiceClick) {
      onVoiceClick();
    } else if (voiceText) {
      speak(voiceText);
    }
  };

  const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 text-yellow-400/20 animate-float">
        <Star size={60} />
      </div>
      <div className="absolute top-40 right-10 text-pink-400/20 animate-float" style={{ animationDelay: '1s' }}>
        <Star size={40} />
      </div>
      <div className="absolute bottom-20 left-20 text-purple-400/20 animate-float" style={{ animationDelay: '2s' }}>
        <Star size={50} />
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            data-testid="game-back-button"
            variant="ghost"
            onClick={() => navigate('/child/games')}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <ArrowLeft className="mr-2" />
            Назад
          </Button>

          <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">
            {title}
          </h1>

          <Button
            data-testid="game-voice-button"
            variant="outline"
            onClick={handleVoice}
            className="border-2 border-yellow-400 hover:bg-yellow-50"
          >
            <Volume2 className="h-5 w-5 text-yellow-600" />
          </Button>
        </div>

        {/* Progress */}
        {totalQuestions > 0 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Вопрос {currentQuestion} из {totalQuestions}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
