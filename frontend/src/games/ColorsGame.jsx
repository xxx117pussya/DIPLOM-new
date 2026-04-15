import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const colorsData = [
  { id: 'red', name: 'красный', nameAcc: 'красный', hex: '#ff0000' },
  { id: 'orange', name: 'оранжевый', nameAcc: 'оранжевый', hex: '#f79438' },
  { id: 'yellow', name: 'жёлтый', nameAcc: 'жёлтый', hex: '#fbff00' },
  { id: 'green', name: 'зелёный', nameAcc: 'зелёный', hex: '#00ff15' },
  { id: 'lightblue', name: 'голубой', nameAcc: 'голубой', hex: '#67dbff' },
  { id: 'blue', name: 'синий', nameAcc: 'синий', hex: '#0088ff' },
  { id: 'purple', name: 'фиолетовый', nameAcc: 'фиолетовый', hex: '#a200ff' },
  { id: 'black', name: 'чёрный', nameAcc: 'чёрный', hex: '#000000' },
  { id: 'white', name: 'белый', nameAcc: 'белый', hex: '#FFFFFF' }
];

export default function ColorsGame() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [targetColor, setTargetColor] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalQuestions = colorsData.length;

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const generateQuestion = () => {
    // ✅ Берём цвет по порядку (БЕЗ повторов)
    const target = colorsData[currentQuestion];

    // ✅ Перемешиваем все цвета
    let shuffled = [...colorsData].sort(() => Math.random() - 0.5);

    // ✅ Берём 6 вариантов
    let questionOptions = shuffled.slice(0, 6);

    // ✅ Гарантируем, что правильный цвет есть в вариантах
    if (!questionOptions.find(c => c.id === target.id)) {
      questionOptions[0] = target;
    }

    // ✅ Перемешиваем ещё раз, чтобы правильный не был всегда первым
    questionOptions = questionOptions.sort(() => Math.random() - 0.5);

    setTargetColor(target);
    setOptions(questionOptions);
    setSelectedOption(null);
    setIsProcessing(false);

    setTimeout(() => {
      speak(`Найди ${target.nameAcc} цвет`);
    }, 300);
  };

  useEffect(() => {
    generateQuestion();
  }, [currentQuestion]);

  const handleOptionClick = (option) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setSelectedOption(option.id);

    const correct = option.id === targetColor.id;

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
    if (finalScore >= 7) level = 'high';
    else if (finalScore >= 5) level = 'medium';

    try {
      await axios.post(`${API}/game/result`, {
        child_id: childId,
        game_type: 'colors',
        score: finalScore,
        max_score: totalQuestions,
        level: level
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', {
      state: { gameName: 'Выбери цвет' }
    });
  };

  return (
    <GameLayout
      title="Выбери цвет"
      voiceText={targetColor ? `Найди ${targetColor.nameAcc} цвет` : 'Найди цвет'}
      currentQuestion={currentQuestion + 1}
      totalQuestions={totalQuestions}
      onVoiceClick={() => targetColor && speak(`Найди ${targetColor.nameAcc} цвет`)}
    >
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800">
          Найди {targetColor?.nameAcc} цвет
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option)}
            disabled={isProcessing}
            className={`
              aspect-square rounded-2xl shadow-lg transition-all duration-300 border-4
              ${selectedOption === option.id 
                ? 'border-blue-400 scale-105' 
                : 'border-gray-200 hover:border-blue-300 hover:scale-105'
              }
              ${option.id === 'white' ? 'border-gray-300' : ''}
            `}
            style={{ backgroundColor: option.hex }}
          />
        ))}
      </div>
    </GameLayout>
  );
}