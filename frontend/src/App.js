import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import "@/App.css";

// Pages
import LandingPage from "./pages/LandingPage";
import ChildNamePage from "./pages/ChildNamePage";
import GameSelectionPage from "./pages/GameSelectionPage";
import PsychologistLoginPage from "./pages/PsychologistLoginPage";
import PsychologistDashboard from "./pages/PsychologistDashboard";

// Games
import ShapesGame from "./games/ShapesGame";
import ColorsGame from "./games/ColorsGame";
import PuzzlesGame from "./games/PuzzlesGame";
import MatryoshkaGame from "./games/MatryoshkaGame";
import OddOneOutGame from "./games/OddOneOutGame";
import FindPairGame from "./games/FindPairGame";
import MemoryGame from "./games/MemoryGame";
import AbsurdityGame from "./games/AbsurdityGame";
import GameCompletePage from "./pages/GameCompletePage";

function App() {
  return (
    <div className="App min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/child/name" element={<ChildNamePage />} />
          <Route path="/child/games" element={<GameSelectionPage />} />
          <Route path="/psychologist/login" element={<PsychologistLoginPage />} />
          <Route path="/psychologist/dashboard" element={<PsychologistDashboard />} />
          
          {/* Games */}
          <Route path="/game/shapes" element={<ShapesGame />} />
          <Route path="/game/colors" element={<ColorsGame />} />
          <Route path="/game/puzzles" element={<PuzzlesGame />} />
          <Route path="/game/matryoshka" element={<MatryoshkaGame />} />
          <Route path="/game/odd-one-out" element={<OddOneOutGame />} />
          <Route path="/game/find-pair" element={<FindPairGame />} />
          <Route path="/game/memory" element={<MemoryGame />} />
          <Route path="/game/absurdity" element={<AbsurdityGame />} />
          <Route path="/game/complete" element={<GameCompletePage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
