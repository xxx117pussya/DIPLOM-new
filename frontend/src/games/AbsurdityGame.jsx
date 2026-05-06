import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const rounds = [
  {
    images: [
      { id: 1, isAbsurd: false, image: '/images/absurd/norm_1.png' },
      { id: 2, isAbsurd: false, image: '/images/absurd/norm_2.png' },
      { id: 3, isAbsurd: false, image: '/images/absurd/norm_3.png' },
      { id: 4, isAbsurd: false, image: '/images/absurd/norm_4.png' },
      { id: 5, isAbsurd: true, image: '/images/absurd/absurd_1.png' },
      { id: 6, isAbsurd: true, image: '/images/absurd/absurd_2.png' }
    ]
  },
  {
    images: [
      { id: 1, isAbsurd: false, image: '/images/absurd/norm_5.png' },
      { id: 2, isAbsurd: false, image: '/images/absurd/norm_6.png' },
      { id: 3, isAbsurd: false, image: '/images/absurd/norm_7.png' },
      { id: 4, isAbsurd: false, image: '/images/absurd/norm_8.png' },
      { id: 5, isAbsurd: true, image: '/images/absurd/absurd_3.png' },
      { id: 6, isAbsurd: true, image: '/images/absurd/absurd_4.png' }
    ]
  },
  {
    images: [
      { id: 1, isAbsurd: false, image: '/images/absurd/norm_9.png' },
      { id: 2, isAbsurd: false, image: '/images/absurd/norm_10.png' },
      { id: 3, isAbsurd: false, image: '/images/absurd/norm_11.png' },
      { id: 4, isAbsurd: false, image: '/images/absurd/norm_12.png' },
      { id: 5, isAbsurd: true, image: '/images/absurd/absurd_5.png' },
      { id: 6, isAbsurd: true, image: '/images/absurd/absurd_6.png' }
    ]
  },
  {
    images: [
      { id: 1, isAbsurd: false, image: '/images/absurd/norm_13.png' },
      { id: 2, isAbsurd: false, image: '/images/absurd/norm_14.png' },
      { id: 3, isAbsurd: false, image: '/images/absurd/norm_15.png' },
      { id: 4, isAbsurd: false, image: '/images/absurd/norm_16.png' },
      { id: 5, isAbsurd: true, image: '/images/absurd/absurd_7.png' },
      { id: 6, isAbsurd: true, image: '/images/absurd/absurd_8.png' }
    ]
  }
];

export default function AbsurdityGame() {
  const navigate = useNavigate();
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffledImages, setShuffledImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalRounds = 4;

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const initRound = () => {
    const round = rounds[currentRound];
    const shuffled = [...round.images].sort(() => Math.random() - 0.5);

    setShuffledImages(shuffled);
    setSelectedImages([]);
    setIsProcessing(false);

    setTimeout(() => {
      speak('Найди две нелепые, странные картинки');
    }, 300);
  };

  useEffect(() => {
    initRound();
  }, [currentRound]);

  const handleImageClick = (image) => {
    if (isProcessing) return;

    const isSelected = selectedImages.includes(image.id);
    let newSelected;

    if (isSelected) {
      newSelected = selectedImages.filter(id => id !== image.id);
    } else {
      if (selectedImages.length >= 2) return;
      newSelected = [...selectedImages, image.id];
    }

    setSelectedImages(newSelected);

    if (newSelected.length === 2) {
      setIsProcessing(true);

      let correct = 0;
      newSelected.forEach(id => {
        const img = shuffledImages.find(i => i.id === id);
        if (img && img.isAbsurd) correct++;
      });

      setScore(prev => prev + correct);

      setTimeout(() => {
        if (currentRound + 1 < totalRounds) {
          setCurrentRound(prev => prev + 1);
        } else {
          finishGame(score + correct);
        }
      }, 800);
    }
  };

  const finishGame = async (finalScore) => {
    const childId = localStorage.getItem('childId');
    const maxScore = totalRounds * 2;

    let level = 'low';
    if (finalScore >= 7) level = 'high';
    else if (finalScore >= 5) level = 'medium';

    try {
      await axios.post(`${API}/game/result`, {
        child_id: childId,
        game_type: 'absurdity',
        score: finalScore,
        max_score: maxScore,
        level: level
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', {
      state: { gameName: 'Нелепица' }
    });
  };

  return (
    <GameLayout
      title="Нелепица"
      voiceText="Найди две нелепые, странные картинки"
      currentQuestion={currentRound + 1}
      totalQuestions={totalRounds}
      onVoiceClick={() => speak('Найди две нелепые, странные картинки')}
    >
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Найди 2 нелепицы
        </h2>
        <p className="text-gray-600">Какие картинки странные и невозможные?</p>
        <p className="text-sm text-blue-600 mt-2">
          Выбрано: {selectedImages.length} из 2
        </p>
      </div>

      {/* КАРТИНКИ */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-lg mx-auto">
        {shuffledImages.map((image) => {
          const isSelected = selectedImages.includes(image.id);

          return (
            <button
              key={image.id}
              onClick={() => handleImageClick(image)}
              disabled={isProcessing}
              className={`
                aspect-square bg-white rounded-2xl shadow-lg overflow-hidden
                transition-all duration-300 border-4
                ${isSelected 
                  ? 'border-blue-500 scale-105'
                  : 'border-transparent hover:border-blue-300 hover:scale-105'
                }
              `}
            >
              <img
                src={image.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </GameLayout>
  );
}