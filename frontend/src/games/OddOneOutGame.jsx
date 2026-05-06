import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Уникальные категории БЕЗ дубликатов
const categories = [
  {
    name: 'Фрукты',
    items: ['🍎', '🍊', '🍋', '🥕'],
    oddIndex: 3,
    oddReason: 'морковь - это овощ'
  },
  {
    name: 'Овощи',
    items: ['🥒', '🍅', '🌽', '🍇'],
    oddIndex: 3,
    oddReason: 'виноград - это фрукт'
  },
  {
    name: 'Мебель',
    items: ['🪑', '🛋️', '🛏️', '🚗'],
    oddIndex: 3,
    oddReason: 'машина - это транспорт'
  },
  {
    name: 'Транспорт',
    items: ['🚌', '🚂', '✈️', '🏠'],
    oddIndex: 3,
    oddReason: 'дом - это здание'
  },
  {
    name: 'Одежда',
    items: ['👕', '👗', '🧥', '🏠'],
    oddIndex: 3,
    oddReason: 'телефон - это техника'
  },
  {
    name: 'Животные',
    items: ['🐶', '🐱', '🐰', '🌳'],
    oddIndex: 3,
    oddReason: 'дерево - это растение'
  }
];

export default function OddOneOutGame() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [shuffledItems, setShuffledItems] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalQuestions = 6;

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const generateQuestion = () => {
    const category = categories[currentQuestion % categories.length];
    
    const itemsWithIndex = category.items.map((item, idx) => ({
      item,
      isOdd: idx === category.oddIndex
    }));
    
    const shuffled = [...itemsWithIndex].sort(() => Math.random() - 0.5);
    const newCorrectIndex = shuffled.findIndex(i => i.isOdd);
    
    setCurrentCategory(category);
    setShuffledItems(shuffled);
    setCorrectIndex(newCorrectIndex);
    setSelectedOption(null);
    setIsProcessing(false);
    
    setTimeout(() => {
      speak('Найди лишнюю картинку');
    }, 300);
  };

  useEffect(() => {
    generateQuestion();
  }, [currentQuestion]);

  const handleOptionClick = (index) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedOption(index);
    const correct = index === correctIndex;
    
    if (correct) {
      setScore(prev => prev + 1);
    }

    // Переход без показа результата
    setTimeout(() => {
      if (currentQuestion + 1 < totalQuestions) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        finishGame(correct ? score + 1 : score);
      }
    }, 800);
  };

  const finishGame = async (finalScore) => {
    const childId = localStorage.getItem('childId');
    let level = 'low';
    if (finalScore >= 5) level = 'high';
    else if (finalScore >= 4) level = 'medium';

    try {
      await axios.post(`${API}/game/result`, {
        child_id: childId,
        game_type: 'odd_one_out',
        score: finalScore,
        max_score: totalQuestions,
        level: level
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', {
      state: { gameName: '4 лишний' }
    });
  };

  return (
    <GameLayout
      title="4 лишний"
      voiceText="Найди лишнюю картинку"
      currentQuestion={currentQuestion + 1}
      totalQuestions={totalQuestions}
      onVoiceClick={() => speak('Найди лишнюю картинку')}
    >
      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Найди лишнюю картинку
        </h2>
        <p className="text-gray-600">Какая картинка не подходит к остальным?</p>
      </div>

      {/* Options - БЕЗ показа правильно/неправильно */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-lg mx-auto">
        {shuffledItems.map((item, index) => (
          <button
            key={index}
            data-testid={`odd-option-${index}`}
            onClick={() => handleOptionClick(index)}
            disabled={isProcessing}
            className={`
              aspect-square bg-white rounded-2xl shadow-lg flex items-center justify-center
              transition-all duration-300 border-4
              ${selectedOption === index 
                ? 'border-blue-400 scale-105' 
                : 'border-transparent hover:border-blue-300 hover:scale-105'
              }
            `}
          >
            <span className="text-6xl md:text-7xl">{item.item}</span>
          </button>
        ))}
      </div>
    </GameLayout>
  );
}
