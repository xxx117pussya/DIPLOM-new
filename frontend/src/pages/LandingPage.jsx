import { useNavigate } from "react-router-dom";
import { Baby, GraduationCap, Sparkles, Star, Heart, Cloud } from "lucide-react";
import { useState } from "react";

const BackgroundShapes = () => (
  <div className="bg-shapes">
    <div className="bg-shape circle bg-yellow-400" style={{ width: 200, height: 200, top: '10%', left: '5%' }} />
    <div className="bg-shape circle bg-pink-400" style={{ width: 150, height: 150, top: '60%', left: '10%' }} />
    <div className="bg-shape circle bg-blue-400" style={{ width: 100, height: 100, top: '20%', right: '15%' }} />
    <div className="bg-shape circle bg-green-400" style={{ width: 180, height: 180, bottom: '10%', right: '5%' }} />
    <div className="bg-shape circle bg-purple-400" style={{ width: 120, height: 120, bottom: '30%', left: '30%' }} />
  </div>
);

const FloatingIcon = ({ children, className, delay = 0 }) => (
  <div 
    className={`absolute animate-float ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    {children}
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundShapes />
      
      <div className="landing-split relative z-10">
        {/* Child Section */}
        <div 
          data-testid="child-role-card"
          className="role-card child relative"
          onClick={() => navigate('/child/name')}
          onMouseEnter={() => setHoveredCard('child')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <FloatingIcon className="top-10 left-10 text-white/30" delay={0}>
            <Star size={40} />
          </FloatingIcon>
          <FloatingIcon className="top-20 right-20 text-white/30" delay={0.5}>
            <Heart size={30} />
          </FloatingIcon>
          <FloatingIcon className="bottom-20 left-20 text-white/30" delay={1}>
            <Sparkles size={35} />
          </FloatingIcon>
          <FloatingIcon className="bottom-10 right-10 text-white/30" delay={1.5}>
            <Cloud size={45} />
          </FloatingIcon>
          
          <div className={`transition-transform duration-500 ${hoveredCard === 'child' ? 'scale-110' : ''}`}>
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border-4 border-white/30">
              <Baby className="w-16 h-16 md:w-20 md:h-20 text-white" />
            </div>
          </div>
          
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 text-center">
            Я Ребёнок
          </h2>
          <p className="text-white/80 text-lg md:text-xl text-center max-w-md">
            Нажми сюда, чтобы начать играть!
          </p>
          
          <div className={`mt-8 px-8 py-4 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/40 transition-all duration-300 ${hoveredCard === 'child' ? 'bg-white/30 scale-105' : ''}`}>
            <span className="text-white font-bold text-lg">Играть</span>
          </div>
        </div>

        {/* Psychologist Section */}
        <div 
          data-testid="psychologist-role-card"
          className="role-card psychologist relative"
          onClick={() => navigate('/psychologist/login')}
          onMouseEnter={() => setHoveredCard('psych')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <FloatingIcon className="top-10 right-10 text-white/20" delay={0.3}>
            <Star size={35} />
          </FloatingIcon>
          <FloatingIcon className="bottom-20 right-20 text-white/20" delay={0.8}>
            <Sparkles size={30} />
          </FloatingIcon>
          
          <div className={`transition-transform duration-500 ${hoveredCard === 'psych' ? 'scale-110' : ''}`}>
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border-4 border-white/30">
              <GraduationCap className="w-16 h-16 md:w-20 md:h-20 text-white" />
            </div>
          </div>
          
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 text-center">
            Я Психолог
          </h2>
          <p className="text-white/80 text-lg md:text-xl text-center max-w-md">
            Войдите для просмотра результатов диагностики
          </p>
          
          <div className={`mt-8 px-8 py-4 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/40 transition-all duration-300 ${hoveredCard === 'psych' ? 'bg-white/30 scale-105' : ''}`}>
            <span className="text-white font-bold text-lg">Войти</span>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      <div className="fixed top-0 left-0 right-0 text-center py-6 bg-gradient-to-b from-black/20 to-transparent z-20 pointer-events-none">
        <h1 className="font-heading text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
          Волшебный Сад Знаний
        </h1>
      </div>
    </div>
  );
}
