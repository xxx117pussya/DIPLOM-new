import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const shapes = [
  { id: 'circle', name: 'круг', nameAcc: 'круг' },
  { id: 'square', name: 'квадрат', nameAcc: 'квадрат' },
  { id: 'triangle', name: 'треугольник', nameAcc: 'треугольник' },
  { id: 'rectangle', name: 'прямоугольник', nameAcc: 'прямоугольник' },
  { id: 'rhombus', name: 'ромб', nameAcc: 'ромб' }
];

const colors = ['#FF5858', '#4FACFE', '#FFD200', '#20E2D7', '#C042FF'];

const ShapeSVG = ({ shape, color, size = 80 }) => {
  switch (shape) {
    case 'circle':
      return <circle cx={size/2} cy={size/2} r={size/2 - 5} fill={color} />;
    case 'square':
      return <rect x="5" y="5" width={size - 10} height={size - 10} fill={color} />;
    case 'triangle':
      return <polygon points={`${size/2},5 5,${size-5} ${size-5},${size-5}`} fill={color} />;
    case 'rectangle':
      return <rect x="5" y="15" width={size - 10} height={size - 30} fill={color} />;
    case 'rhombus':
      return <polygon points={`${size/2},5 ${size-5},${size/2} ${size/2},${size-5} 5,${size/2}`} fill={color} />;
    default:
      return null;
  }
};

export default function ShapesGame() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [targetShape, setTargetShape] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalQuestions = shapes.length; // теперь без повторов

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const generateQuestion = () => {
    // Фигура по порядку
    const target = shapes[currentQuestion];

    // Перемешиваем варианты
    const shuffledOptions = [...shapes].sort(() => Math.random() - 0.5);

    const questionOptions = shuffledOptions.map((shape, index) => ({
      ...shape,
      color: colors[index % colors.length]
    }));

    setTargetShape(target);
    setOptions(questionOptions);
    setSelectedOption(null);
    setIsProcessing(false);

    setTimeout(() => {
      speak(`Найди ${target.nameAcc}`);
    }, 300);
  };

  useEffect(() => {
    generateQuestion();
  }, [currentQuestion]);

  const handleOptionClick = (option) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setSelectedOption(option.id);

    const correct = option.id === targetShape.id;

    if (correct) {
      setScore(prev => prev + 1);
    }

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
        game_type: 'shapes',
        score: finalScore,
        max_score: totalQuestions,
        level: level
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', {
      state: { gameName: 'Выбери фигуру' }
    });
  };

  return (
    <GameLayout
      title="Выбери фигуру"
      voiceText={targetShape ? `Найди ${targetShape.nameAcc}` : 'Найди фигуру'}
      currentQuestion={currentQuestion + 1}
      totalQuestions={totalQuestions}
      onVoiceClick={() => targetShape && speak(`Найди ${targetShape.nameAcc}`)}
    >
      {/* Вопрос */}
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800">
          Найди {targetShape?.nameAcc}
        </h2>
      </div>

      {/* Варианты */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option)}
            disabled={isProcessing}
            className={`
              aspect-square bg-white rounded-2xl shadow-lg p-6 flex items-center justify-center
              transition-all duration-300 border-4
              ${selectedOption === option.id 
                ? 'border-blue-400 scale-105' 
                : 'border-transparent hover:border-blue-300 hover:scale-105'
              }
            `}
          >
            <svg width="100" height="100" viewBox="0 0 100 100">
              <ShapeSVG shape={option.id} color={option.color} size={100} />
            </svg>
          </button>
        ))}
      </div>
    </GameLayout>
  );
}