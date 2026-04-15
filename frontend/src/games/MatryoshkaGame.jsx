import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import { Button } from "../components/ui/button";
import { RotateCcw } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const levels = [
  { count: 3, items: ['🧍‍♀️', '🧍‍♀️', '🧍‍♀️'] },
  { count: 4, items: ['🚗', '🚗', '🚗', '🚗'] },
  { count: 5, items: ['🧸', '🧸', '🧸', '🧸', '🧸'] }
];

const generateSizes = (count) => {
  const baseSizes = [];
  for (let i = 0; i < count; i++) {
    baseSizes.push(50 + i * 20);
  }
  return baseSizes;
};

export default function MatryoshkaGame() {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [completedLevels, setCompletedLevels] = useState(0);

  const totalLevels = 3;
  const level = levels[currentLevel];

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const initLevel = useCallback(() => {
    const sizes = generateSizes(level.count);
    const newItems = sizes.map((size, idx) => ({
      id: idx,
      size: size,
      emoji: level.items[idx],
      correctOrder: idx
    })).sort(() => Math.random() - 0.5);
    
    setItems(newItems);
    setSelectedItems([]);
    
    setTimeout(() => {
      speak('Расставь предметы от маленького к большому');
    }, 300);
  }, [level]);

  useEffect(() => {
    initLevel();
  }, [currentLevel, initLevel]);

  const handleItemClick = (item) => {
    // Если уже выбран - убрать из выбранных
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
      setItems([...items, item].sort(() => Math.random() - 0.5));
    } else {
      // Добавить в выбранные
      setSelectedItems([...selectedItems, item]);
      setItems(items.filter(i => i.id !== item.id));
      
      // Проверка завершения - все выбраны
      if (selectedItems.length + 1 === level.count) {
        const newSelected = [...selectedItems, item];
        const isCorrect = newSelected.every((item, idx) => item.correctOrder === idx);
        
        if (isCorrect) {
          setCompletedLevels(prev => prev + 1);
        }

        // Переход к следующему уровню БЕЗ повторения
        setTimeout(() => {
          if (currentLevel + 1 < totalLevels) {
            setCurrentLevel(prev => prev + 1);
          } else {
            finishGame(isCorrect ? completedLevels + 1 : completedLevels);
          }
        }, 800);
      }
    }
  };

  const finishGame = async (finalScore) => {
    const childId = localStorage.getItem('childId');
    let levelResult = 'low';
    if (finalScore >= 3) levelResult = 'high';
    else if (finalScore >= 2) levelResult = 'medium';

    try {
      await axios.post(`${API}/game/result`, {
        child_id: childId,
        game_type: 'matryoshka',
        score: finalScore,
        max_score: totalLevels,
        level: levelResult
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', {
      state: { gameName: 'Матрёшка' }
    });
  };

  return (
    <GameLayout
      title="Матрёшка"
      voiceText="Расставь предметы от маленького к большому"
      currentQuestion={currentLevel + 1}
      totalQuestions={totalLevels}
      onVoiceClick={() => speak('Расставь предметы от маленького к большому')}
    >
      {/* Instruction */}
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Уровень {currentLevel + 1}
        </h2>
        <p className="text-gray-600">Нажимай на предметы от маленького к большому</p>
      </div>

      {/* Selected items (answer area) */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[120px] border-4 border-dashed border-gray-200">
          <p className="text-sm text-gray-500 mb-4 text-center">Твой ответ:</p>
          <div className="flex items-end justify-center gap-2">
            {selectedItems.map((item, idx) => (
              <button
                key={item.id}
                data-testid={`selected-item-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="transition-all hover:scale-110 cursor-pointer animate-bounce-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <span style={{ fontSize: `${item.size}px` }}>{item.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Available items */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-sm text-gray-500 mb-4 text-center">Выбери предметы:</p>
          <div className="flex items-end justify-center gap-4 flex-wrap">
            {items.map((item) => (
              <button
                key={item.id}
                data-testid={`available-item-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="transition-all hover:scale-110 cursor-pointer hover:-translate-y-2"
              >
                <span style={{ fontSize: `${item.size}px` }}>{item.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <div className="text-center mt-6">
        <Button
          variant="outline"
          onClick={initLevel}
          className="border-2"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Начать заново
        </Button>
      </div>
    </GameLayout>
  );
}
