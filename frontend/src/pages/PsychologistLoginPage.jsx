import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn, UserPlus, GraduationCap, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PsychologistLoginPage() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    name: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Register
        if (!formData.name.trim()) {
          toast.error("Введите ваше имя");
          setIsLoading(false);
          return;
        }
        
        await axios.post(`${API}/psychologist/register`, {
          login: formData.login,
          password: formData.password,
          name: formData.name
        });
        
        toast.success("Регистрация успешна! Теперь войдите в систему.");
        setIsRegistering(false);
        setFormData({ ...formData, password: "" });
      } else {
        // Login
        const response = await axios.post(`${API}/psychologist/login`, {
          login: formData.login,
          password: formData.password
        });
        
        localStorage.setItem('psychToken', response.data.access_token);
        localStorage.setItem('psychName', response.data.psychologist_name);
        
        toast.success(`Добро пожаловать, ${response.data.psychologist_name}!`);
        navigate('/psychologist/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      const message = error.response?.data?.detail || "Произошла ошибка. Попробуйте снова.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button 
          data-testid="back-to-landing"
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
        >
          <ArrowLeft className="mr-2" />
          На главную
        </Button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-gray-800">
              {isRegistering ? "Регистрация" : "Вход для психолога"}
            </h1>
            <p className="text-gray-500 mt-2">
              {isRegistering 
                ? "Создайте аккаунт для доступа к результатам" 
                : "Войдите для просмотра результатов диагностики"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваше имя
                </label>
                <Input
                  data-testid="register-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Иванова Мария Петровна"
                  className="h-12"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Логин
              </label>
              <Input
                data-testid="login-input"
                type="text"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                placeholder="psychologist"
                className="h-12"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Input
                  data-testid="password-input"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              data-testid="submit-button"
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isLoading ? (
                <span className="animate-pulse">Загрузка...</span>
              ) : isRegistering ? (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Зарегистрироваться
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Войти
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode"
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {isRegistering 
                ? "Уже есть аккаунт? Войти" 
                : "Нет аккаунта? Зарегистрироваться"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
