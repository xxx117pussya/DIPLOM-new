import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, User, Sparkles, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChildNamePage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Пожалуйста, введи имя и фамилию!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/child/register`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim()
      });
      
      localStorage.setItem('childId', response.data.id);
      localStorage.setItem('childName', `${firstName} ${lastName}`);
      
      navigate('/child/games');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Ой, что-то пошло не так. Попробуй ещё раз!");
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 text-yellow-400/30 animate-float">
        <Star size={60} />
      </div>
      <div className="absolute top-20 right-20 text-pink-400/30 animate-float" style={{ animationDelay: '1s' }}>
        <Sparkles size={50} />
      </div>
      <div className="absolute bottom-20 left-20 text-purple-400/30 animate-float" style={{ animationDelay: '2s' }}>
        <Star size={40} />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back button */}
        <Button 
          data-testid="back-button"
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
        >
          <ArrowLeft className="mr-2" />
          Назад
        </Button>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 border-b-8 border-blue-200">
            {/* Icon */}
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-12 h-12 text-white" />
            </div>

            {/* Title */}
            <h1 className="font-heading text-3xl font-bold text-center text-gray-800 mb-2">
              Как тебя зовут?
            </h1>
            <p className="text-center text-gray-500 mb-8">
              Введи своё имя, чтобы начать игру
            </p>

            {/* Voice button */}
            <Button
              data-testid="voice-instruction-button"
              type="button"
              variant="outline"
              className="w-full mb-6 h-14 border-2 border-yellow-400 hover:bg-yellow-50 text-lg"
              onClick={() => speak("Привет! Напиши своё имя и фамилию в окошках, чтобы начать играть!")}
            >
              <span className="mr-2">🔊</span>
              Нажми, чтобы услышать подсказку
            </Button>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фамилия *
                </label>
                <Input
                  data-testid="last-name-input"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                  className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя *
                </label>
                <Input
                  data-testid="first-name-input"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ваня"
                  className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отчество
                </label>
                <Input
                  data-testid="middle-name-input"
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Петрович"
                  className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-400"
                />
              </div>

              <Button
                data-testid="start-games-button"
                type="submit"
                disabled={isLoading}
                className="w-full h-16 text-xl font-bold rounded-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all mt-6"
              >
                {isLoading ? (
                  <span className="animate-pulse">Загрузка...</span>
                ) : (
                  <>
                    Начать играть!
                    <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
