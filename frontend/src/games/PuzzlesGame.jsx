import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GameLayout from "../components/GameLayout";
import { Button } from "../components/ui/button";
import { RotateCcw } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// 3 уровня пазлов с картинками (локальные файлы)
const puzzleLevels = [
  {
    name: 'Пирамидка',
    image: '/images/pyramid.png',
    layout: 'pyramid',
    piecesCount: 3
  },
  {
    name: 'Машинка',
    image: '/images/car.png',
    layout: 'car',
    piecesCount: 4
  },
  {
    name: 'Бабочка',
    image: '/images/butterfly.png',
    layout: 'butterfly',
    piecesCount: 5
  }
];

export default function PuzzlesGame() {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [pieces, setPieces] = useState([]);
  const [placedPieces, setPlacedPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const totalLevels = 3;
  const level = puzzleLevels[currentLevel];

  const speak = (text) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  // Конфигурации позиций для каждого layout
  const getSlotConfig = useCallback(() => {
    if (level.layout === 'pyramid') {
      return [
        { left: 4, top: 4, width: 100, height: 296, bgX: 0, bgY: 0 },
        { left: 108, top: 4, width: 192, height: 144, bgX: -100, bgY: 0 },
        { left: 108, top: 152, width: 192, height: 148, bgX: -100, bgY: -148 }
      ];
    } else if (level.layout === 'car') {
      return [
        { left: 200, top: 4, width: 96, height: 296, bgX: -196, bgY: 0 },
        { left: 4, top: 4, width: 192, height: 144, bgX: 0, bgY: 0 },
        { left: 4, top: 152, width: 96, height: 148, bgX: 0, bgY: -148 },
        { left: 104, top: 152, width: 92, height: 148, bgX: -100, bgY: -148 }
      ];
    } else if (level.layout === 'butterfly') {
      return [
        { left: 4, top: 4, width: 120, height: 140, bgX: 0, bgY: 0 },
        { left: 180, top: 4, width: 120, height: 140, bgX: -176, bgY: 0 },
        { left: 128, top: 50, width: 48, height: 200, bgX: -124, bgY: -46 },
        { left: 4, top: 148, width: 120, height: 148, bgX: 0, bgY: -144 },
        { left: 180, top: 148, width: 120, height: 148, bgX: -176, bgY: -144 }
      ];
    }
    return [];
  }, [level.layout]);

  const slotConfig = getSlotConfig();

  const initLevel = useCallback(() => {
    setImageLoaded(false);
    
    const config = getSlotConfig();
    const newPieces = Array.from({ length: level.piecesCount }, (_, i) => ({
      id: i,
      correctPos: i,
      // Сохраняем оригинальную позицию фрагмента для этой детали
      bgX: config[i].bgX,
      bgY: config[i].bgY,
      width: config[i].width,
      height: config[i].height
    }));
    
    setPieces([...newPieces].sort(() => Math.random() - 0.5));
    setPlacedPieces(Array(level.piecesCount).fill(null));
    setSelectedPiece(null);
    
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = level.image;
    
    setTimeout(() => speak(`Собери картинку: ${level.name}`), 300);
  }, [level, getSlotConfig]);

  useEffect(() => {
    initLevel();
  }, [currentLevel, initLevel]);

  const handlePieceClick = (piece) => {
    setSelectedPiece(selectedPiece?.id === piece.id ? null : piece);
  };

  const handleSlotClick = (position) => {
    if (!selectedPiece) return;
    
    const newPlaced = [...placedPieces];
    const newPieces = pieces.filter(p => p.id !== selectedPiece.id);
    
    if (newPlaced[position]) newPieces.push(newPlaced[position]);
    newPlaced[position] = selectedPiece;
    
    setPieces(newPieces.sort(() => Math.random() - 0.5));
    setPlacedPieces(newPlaced);
    setSelectedPiece(null);

    if (newPieces.length === 0) {
      const isCorrect = newPlaced.every((piece, idx) => piece && piece.correctPos === idx);
      if (isCorrect) setCompletedLevels(prev => prev + 1);
      
      setTimeout(() => {
        if (currentLevel + 1 < totalLevels) {
          setCurrentLevel(prev => prev + 1);
        } else {
          finishGame(isCorrect ? completedLevels + 1 : completedLevels);
        }
      }, 1000);
    }
  };

  const handlePlacedClick = (position) => {
    const piece = placedPieces[position];
    if (piece) {
      setPieces([...pieces, piece].sort(() => Math.random() - 0.5));
      const newPlaced = [...placedPieces];
      newPlaced[position] = null;
      setPlacedPieces(newPlaced);
    }
  };

  const finishGame = async (finalScore) => {
    const childId = localStorage.getItem('childId');
    let levelResult = finalScore >= 3 ? 'high' : finalScore >= 2 ? 'medium' : 'low';

    try {
      await axios.post(`${API}/game/result`, {
        child_id: childId,
        game_type: 'puzzles',
        score: finalScore,
        max_score: totalLevels,
        level: levelResult
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }

    navigate('/game/complete', { state: { gameName: 'Пазлы' } });
  };

  // Стиль для детали - показывает её СОБСТВЕННЫЙ фрагмент картинки
  const getPieceStyle = (piece, slot) => ({
    backgroundImage: `url(${level.image})`,
    backgroundSize: '300px 300px',
    // Используем bgX и bgY ДЕТАЛИ, а не слота!
    backgroundPosition: `${piece.bgX}px ${piece.bgY}px`
  });

  // Стиль для превью детали в панели справа
  const getPiecePreviewStyle = (piece) => ({
    backgroundImage: `url(${level.image})`,
    backgroundSize: `${300 * Math.min(piece.width, 140) / piece.width}px ${300 * Math.min(piece.height, 140) / piece.height}px`,
    backgroundPosition: `${piece.bgX * Math.min(piece.width, 140) / piece.width}px ${piece.bgY * Math.min(piece.height, 140) / piece.height}px`
  });

  const slotStyle = (placed) => `absolute cursor-pointer transition-all border-4 overflow-hidden rounded-lg
    ${placed ? 'border-green-300 bg-green-50' : selectedPiece ? 'border-blue-400 border-dashed bg-blue-50' : 'border-gray-300 border-dashed bg-white'}`;

  const renderLevel = () => (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      {/* Поле для сборки */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border-4 border-gray-300">
        <p className="text-sm text-gray-500 mb-3 text-center">Собери здесь:</p>
        <div className="relative bg-gray-100 rounded-xl" style={{ width: 308, height: 308 }}>
          {slotConfig.map((slot, idx) => (
            <div
              key={idx}
              data-testid={`puzzle-slot-${idx}`}
              onClick={() => placedPieces[idx] ? handlePlacedClick(idx) : handleSlotClick(idx)}
              className={slotStyle(placedPieces[idx])}
              style={{
                left: slot.left,
                top: slot.top,
                width: slot.width,
                height: slot.height,
                // Показываем фрагмент ДЕТАЛИ которая поставлена, а не слота
                ...(placedPieces[idx] ? getPieceStyle(placedPieces[idx], slot) : {})
              }}
            >
              {!placedPieces[idx] && (
                <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-xl">?</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Детали */}
      {pieces.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-4">
          <p className="text-sm text-gray-500 mb-3 text-center">Детали:</p>
          <div className="grid grid-cols-2 gap-3">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                data-testid={`puzzle-piece-${piece.id}`}
                onClick={() => handlePieceClick(piece)}
                className={`cursor-pointer transition-all rounded-lg border-4 overflow-hidden
                  ${selectedPiece?.id === piece.id ? 'border-blue-500 scale-105 shadow-lg' : 'border-gray-200 hover:border-blue-300'}`}
                style={{
                  width: piece.width,
                  height: piece.height,
                  ...getPieceStyle(piece)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <GameLayout
      title="Пазлы"
      voiceText={`Собери картинку: ${level.name}`}
      currentQuestion={currentLevel + 1}
      totalQuestions={totalLevels}
      onVoiceClick={() => speak(`Собери картинку: ${level.name}`)}
    >
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2">{level.name}</h2>
        <p className="text-gray-600">{level.piecesCount} {level.piecesCount < 5 ? 'части' : 'частей'}</p>
      </div>

      {!imageLoaded ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      ) : renderLevel()}

      <div className="text-center mt-6">
        <Button variant="outline" onClick={initLevel} className="border-2">
          <RotateCcw className="mr-2 h-4 w-4" />
          Начать заново
        </Button>
      </div>
    </GameLayout>
  );
}
