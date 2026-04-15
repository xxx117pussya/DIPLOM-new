import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import { Button } from "../components/ui/button";
import { Check, Timer } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const allImages = [
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🎳',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑'
];

export default function MemoryGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('memorize'); // memorize, recall
  const [memorizeImages, setMemorizeImages] = useState([]);
  const [recallImages, setRecallImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);

  const memorizeCount = 8;
  const totalImages = 15;

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const initGame = useCallback(() => {
    const shuffled = [...allImages].sort(() => Math.random() - 0.5);
    const toMemorize = shuffled.slice(0, memorizeCount);
    
    const additionalCount = totalImages - memorizeCount;
    const additional = shuffled.slice(memorizeCount, memorizeCount + additionalCount);
    const allRecall = [...toMemorize, ...additional].sort(() => Math.random() - 0.5);
    
    setMemorizeImages(toMemorize);
    setRecallImages(allRecall.map((img, idx) => ({
      id: idx,
      emoji: img,
      wasShown: toMemorize.includes(img)
    })));
    setSelectedImages([]);
    setPhase('memorize');
    setTimeLeft(30);
    
    setTimeout(() => {
      speak('Запомни все картинки за 30 секунд');
    }, 300);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer for memorize phase
  useEffect(() => {
    if (phase !== 'memorize') return;
    
    if (timeLeft === 0) {
      setPhase('recall');
      speak('Теперь выбери картинки, которые ты запомнил');
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const handleImageClick = (image) => {
    if (phase !== 'recall') return;
    
    const isSelected = selectedImages.includes(image.id);
    if (isSelected) {
      setSelectedImages(selectedImages.filter(id => id !== image.id));
    } else {
      setSelectedImages([...selectedImages, image.id]);
    }
  };

  const handleSubmit = () => {
    let correct = 0;
    selectedImages.forEach(id => {
      const image = recallImages.find(img => img.id === id);
      if (image && image.wasShown) correct++;
    });
    
    const wrongSelections = selectedImages.filter(id => {
      const image = recallImages.find(img => img.id === id);
      return image && !image.wasShown;
    }).length;
    
    const finalScore = Math.max(0, correct - wrongSelections);
    setScore(finalScore);
    
    // Сразу завершаем игру БЕЗ показа результата
    finishGame(finalScore);
  };

  const finishGame = async (finalScore) => {
    const childId = localStorage.getItem('childId');
    let level = 'low';
    if (finalScore >= 7) level = 'high';
    else if (finalScore >= 5) level = 'medium';

    try {
      await axios.post(`${API}/game/result`, {
        child_id: childId,
        game_type: 'memory',
        score: finalScore,
        max_score: memorizeCount,
        level: level
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', {
      state: { gameName: 'Память' }
    });
  };

  return (
    <GameLayout
      title="Память"
      voiceText={phase === 'memorize' ? 'Запомни все картинки' : 'Выбери картинки, которые ты запомнил'}
      currentQuestion={1}
      totalQuestions={1}
      onVoiceClick={() => speak(phase === 'memorize' ? 'Запомни все картинки' : 'Выбери картинки, которые ты запомнил')}
    >
      {/* Phase indicator */}
      <div className="text-center mb-6">
        {phase === 'memorize' ? (
          <>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Запомни картинки!
            </h2>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              <Timer className={`w-6 h-6 ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}`} />
              <span className={timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-500'}>
                {timeLeft}
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Выбери картинки, которые ты видел
            </h2>
            <p className="text-gray-600">
              Выбрано: {selectedImages.length}
            </p>
          </>
        )}
      </div>

      {/* Memorize phase */}
      {phase === 'memorize' && (
        <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
          {memorizeImages.map((emoji, idx) => (
            <div
              key={idx}
              className="aspect-square bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <span className="text-4xl md:text-5xl">{emoji}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recall phase - БЕЗ показа результата */}
      {phase === 'recall' && (
        <>
          <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto mb-6">
            {recallImages.map((image) => {
              const isSelected = selectedImages.includes(image.id);
              return (
                <button
                  key={image.id}
                  data-testid={`recall-image-${image.id}`}
                  onClick={() => handleImageClick(image)}
                  className={`
                    aspect-square bg-white rounded-xl shadow-md flex items-center justify-center
                    transition-all duration-200 border-4
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 scale-105' 
                      : 'border-transparent hover:border-blue-300 hover:scale-105'
                    }
                  `}
                >
                  <span className="text-3xl md:text-4xl">{image.emoji}</span>
                </button>
              );
            })}
          </div>
          
          <div className="text-center">
            <Button
              data-testid="submit-memory-button"
              onClick={handleSubmit}
              className="h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
              disabled={selectedImages.length === 0}
            >
              <Check className="mr-2" />
              Готово
            </Button>
          </div>
        </>
      )}
    </GameLayout>
  );
}
