import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import { Button } from "../components/ui/button";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// 6 уровней сложности для игры "Найди пару"
const levels = [
  {
    difficulty: 'easy',
    description: 'Найди двух одинаковых котиков',
    items: [
      { id: 1, emoji: '🐱', variant: 'sitting' },
      { id: 2, emoji: '😺', variant: 'happy' },
      { id: 3, emoji: '😸', variant: 'grinning' },
      { id: 4, emoji: '🐱', variant: 'sitting' },
      { id: 5, emoji: '😻', variant: 'hearts' },
      { id: 6, emoji: '😼', variant: 'smirk' }
    ],
    pairIds: [1, 4]
  },
  {
    difficulty: 'easy',
    description: 'Найди двух одинаковых собачек',
    items: [
      { id: 1, emoji: '🐕', variant: 'standing' },
      { id: 2, emoji: '🐶', variant: 'face' },
      { id: 3, emoji: '🦮', variant: 'guide' },
      { id: 4, emoji: '🐕‍🦺', variant: 'service' },
      { id: 5, emoji: '🐶', variant: 'face' },
      { id: 6, emoji: '🐩', variant: 'poodle' }
    ],
    pairIds: [2, 5]
  },
  {
    difficulty: 'medium',
    description: 'Найди два сердечка одинакового цвета',
    items: [
      { id: 1, emoji: '❤️', variant: 'red' },
      { id: 2, emoji: '🧡', variant: 'orange' },
      { id: 3, emoji: '💛', variant: 'yellow' },
      { id: 4, emoji: '💚', variant: 'green' },
      { id: 5, emoji: '❤️', variant: 'red' },
      { id: 6, emoji: '💜', variant: 'purple' }
    ],
    pairIds: [1, 5]
  },
  {
    difficulty: 'medium',
    description: 'Найди два одинаковых цветка',
    items: [
      { id: 1, emoji: '🌸', variant: 'cherry' },
      { id: 2, emoji: '🌺', variant: 'hibiscus' },
      { id: 3, emoji: '🌻', variant: 'sunflower' },
      { id: 4, emoji: '🌷', variant: 'tulip' },
      { id: 5, emoji: '🌺', variant: 'hibiscus' },
      { id: 6, emoji: '🌼', variant: 'blossom' }
    ],
    pairIds: [2, 5]
  },
  {
    difficulty: 'hard',
    description: 'Найди два одинаковых домика',
    items: [
      { id: 1, emoji: '🏠', variant: 'house' },
      { id: 2, emoji: '🏡', variant: 'garden' },
      { id: 3, emoji: '🏘️', variant: 'houses' },
      { id: 4, emoji: '🏠', variant: 'house' },
      { id: 5, emoji: '🏚️', variant: 'derelict' },
      { id: 6, emoji: '🛖', variant: 'hut' }
    ],
    pairIds: [1, 4]
  },
  {
    difficulty: 'hard',
    description: 'Найди двое одинаковых часов',
    items: [
      { id: 1, emoji: '⏰', variant: 'alarm' },
      { id: 2, emoji: '🕐', variant: 'one' },
      { id: 3, emoji: '🕑', variant: 'two' },
      { id: 4, emoji: '⌚', variant: 'watch' },
      { id: 5, emoji: '🕐', variant: 'one' },
      { id: 6, emoji: '🕰️', variant: 'mantel' }
    ],
    pairIds: [2, 5]
  }
];

export default function FindPairGame() {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledItems, setShuffledItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalLevels = 6;
  const level = levels[currentLevel];

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const initLevel = useCallback(() => {
    const shuffled = [...level.items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setSelectedItems([]);
    setIsProcessing(false);
    
    setTimeout(() => {
      speak(level.description);
    }, 300);
  }, [level]);

  useEffect(() => {
    initLevel();
  }, [currentLevel, initLevel]);

  const handleItemClick = (item) => {
    if (isProcessing || selectedItems.find(i => i.id === item.id)) return;
    
    const newSelected = [...selectedItems, item];
    setSelectedItems(newSelected);
    
    if (newSelected.length === 2) {
      setIsProcessing(true);
      
      const [first, second] = newSelected;
      const isCorrectPair = level.pairIds.includes(first.id) && 
                           level.pairIds.includes(second.id) && 
                           first.id !== second.id;
      
      if (isCorrectPair) {
        setScore(prev => prev + 1);
      }

      // Переход к следующему уровню без показа результата
      setTimeout(() => {
        if (currentLevel + 1 < totalLevels) {
          setCurrentLevel(prev => prev + 1);
        } else {
          finishGame(isCorrectPair ? score + 1 : score);
        }
      }, 800);
    }
  };

  const finishGame = async (finalScore) => {
    const childId = localStorage.getItem('childId');
    let levelResult = 'low';
    if (finalScore >= 5) levelResult = 'high';
    else if (finalScore >= 4) levelResult = 'medium';

    try {
      await axios.post(`${API}/game/result`, {
        child_id: childId,
        game_type: 'find_pair',
        score: finalScore,
        max_score: totalLevels,
        level: levelResult
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', {
      state: { gameName: 'Найди пару' }
    });
  };

  return (
    <GameLayout
      title="Найди пару"
      voiceText={level.description}
      currentQuestion={currentLevel + 1}
      totalQuestions={totalLevels}
      onVoiceClick={() => speak(level.description)}
    >
      {/* Question */}
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          {level.description}
        </h2>
        <p className="text-gray-600">
          Выбрано: {selectedItems.length} из 2
        </p>
      </div>

      {/* Items grid - БЕЗ подписей */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-lg mx-auto mb-6">
        {shuffledItems.map((item) => {
          const isSelected = selectedItems.find(i => i.id === item.id);
          
          return (
            <button
              key={item.id}
              data-testid={`pair-item-${item.id}`}
              onClick={() => handleItemClick(item)}
              disabled={isProcessing}
              className={`
                aspect-square bg-white rounded-2xl shadow-lg flex items-center justify-center
                transition-all duration-300 border-4
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-transparent hover:border-blue-300 hover:scale-105'
                }
              `}
            >
              <span className="text-5xl md:text-6xl">{item.emoji}</span>
            </button>
          );
        })}
      </div>
    </GameLayout>
  );
}
