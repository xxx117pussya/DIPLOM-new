import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, Users, Trophy, TrendingUp, Filter, 
  Calendar, Search, BarChart3, Download, RefreshCw, Trash2, AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import axios from "axios";
import * as XLSX from "xlsx";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const gameTypeNames = {
  shapes: "Выбери фигуру",
  colors: "Выбери цвет",
  puzzles: "Пазлы",
  matryoshka: "Матрёшка",
  odd_one_out: "4 лишний",
  find_pair: "Найди пару",
  memory: "Память",
  absurdity: "Нелепица"
};

const levelColors = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-red-100 text-red-800"
};

const levelNames = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий"
};

export default function PsychologistDashboard() {
  const navigate = useNavigate();
  const [psychName, setPsychName] = useState("");
  const [results, setResults] = useState([]);
  const [children, setChildren] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [selectedChild, setSelectedChild] = useState("all");
  const [selectedGame, setSelectedGame] = useState("all");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'all', 'child', 'game', 'single'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('psychToken');
    const name = localStorage.getItem('psychName');
    
    if (!token) {
      navigate('/psychologist/login');
      return;
    }
    
    setPsychName(name || 'Психолог');
    fetchData();
  }, [navigate]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('psychToken')}`
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resultsRes, childrenRes, statsRes] = await Promise.all([
        axios.get(`${API}/game/results`, { 
          headers: getAuthHeaders(),
          params: {
            child_id: selectedChild !== 'all' ? selectedChild : undefined,
            game_type: selectedGame !== 'all' ? selectedGame : undefined,
            date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
            date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined
          }
        }),
        axios.get(`${API}/children`),
        axios.get(`${API}/statistics`, { headers: getAuthHeaders() })
      ]);
      
      setResults(resultsRes.data);
      setChildren(childrenRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      if (error.response?.status === 401) {
        toast.error("Сессия истекла. Войдите снова.");
        handleLogout();
      } else {
        toast.error("Ошибка загрузки данных");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('psychToken')) {
      fetchData();
    }
  }, [selectedChild, selectedGame, dateFrom, dateTo]);

  const handleLogout = () => {
    localStorage.removeItem('psychToken');
    localStorage.removeItem('psychName');
    navigate('/psychologist/login');
  };

  const filteredResults = results.filter(result => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return result.child_name?.toLowerCase().includes(search) ||
             gameTypeNames[result.game_type]?.toLowerCase().includes(search);
    }
    return true;
  });

  // Delete handlers
  const openDeleteDialog = (type, target = null, name = "") => {
    setDeleteType(type);
    setDeleteTarget(target);
    setDeleteTargetName(name);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      let endpoint = '';
      switch (deleteType) {
        case 'all':
          endpoint = `${API}/game/results/all`;
          break;
        case 'child':
          endpoint = `${API}/game/results/child/${deleteTarget}`;
          break;
        case 'game':
          endpoint = `${API}/game/results/game/${deleteTarget}`;
          break;
        case 'single':
          endpoint = `${API}/game/result/${deleteTarget}`;
          break;
        default:
          return;
      }

      await axios.delete(endpoint, { headers: getAuthHeaders() });
      toast.success("Результаты удалены");
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Ошибка удаления");
    }
  };

  const getDeleteMessage = () => {
    switch (deleteType) {
      case 'all':
        return "Вы уверены, что хотите удалить ВСЕ результаты диагностики? Это действие нельзя отменить.";
      case 'child':
        return `Вы уверены, что хотите удалить все результаты ребёнка "${deleteTargetName}"?`;
      case 'game':
        return `Вы уверены, что хотите удалить все результаты игры "${deleteTargetName}"?`;
      case 'single':
        return "Вы уверены, что хотите удалить этот результат?";
      default:
        return "";
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredResults.map(r => ({
      'Дата': format(new Date(r.created_at), 'dd.MM.yyyy HH:mm'),
      'Ребёнок': r.child_name,
      'Игра': gameTypeNames[r.game_type] || r.game_type,
      'Баллы': r.score,
      'Макс. баллы': r.max_score,
      'Процент': Math.round((r.score / r.max_score) * 100) + '%',
      'Уровень': levelNames[r.level]
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ширина колонок
    worksheet['!cols'] = [
      { wch: 18 }, // Дата
      { wch: 25 }, // Ребёнок
      { wch: 18 }, // Игра
      { wch: 8 },  // Баллы
      { wch: 12 }, // Макс. баллы
      { wch: 10 }, // Процент
      { wch: 12 }  // Уровень
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Результаты");

    // Добавим лист со статистикой
    if (statistics) {
      const statsData = [
        { 'Показатель': 'Всего детей', 'Значение': statistics.total_children },
        { 'Показатель': 'Всего сессий', 'Значение': statistics.total_sessions },
        { 'Показатель': 'Высокий уровень', 'Значение': statistics.by_level?.high || 0 },
        { 'Показатель': 'Средний уровень', 'Значение': statistics.by_level?.medium || 0 },
        { 'Показатель': 'Низкий уровень', 'Значение': statistics.by_level?.low || 0 }
      ];
      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      statsSheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, statsSheet, "Статистика");
    }

    const fileName = `Результаты_диагностики_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Excel файл скачан");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-gray-800">
              Волшебный Сад Знаний
            </h1>
            <p className="text-sm text-gray-500">Панель психолога</p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Здравствуйте, {psychName}</span>
            <Button
              data-testid="logout-psych-button"
              variant="outline"
              onClick={handleLogout}
              className="border-gray-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего детей</p>
                <p className="text-2xl font-bold text-gray-800">
                  {statistics?.total_children || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего сессий</p>
                <p className="text-2xl font-bold text-gray-800">
                  {statistics?.total_sessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Высокий уровень</p>
                <p className="text-2xl font-bold text-gray-800">
                  {statistics?.by_level?.high || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Средний уровень</p>
                <p className="text-2xl font-bold text-gray-800">
                  {statistics?.by_level?.medium || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Фильтры</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="search-input"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Child filter */}
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger data-testid="child-filter">
                <SelectValue placeholder="Все дети" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все дети</SelectItem>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.last_name} {child.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Game filter */}
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger data-testid="game-filter">
                <SelectValue placeholder="Все игры" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все игры</SelectItem>
                {Object.entries(gameTypeNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date from */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start" data-testid="date-from-filter">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd.MM.yyyy') : 'Дата от'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>

            {/* Date to */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start" data-testid="date-to-filter">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'dd.MM.yyyy') : 'Дата до'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedChild("all");
                setSelectedGame("all");
                setDateFrom(null);
                setDateTo(null);
                setSearchTerm("");
              }}
            >
              Сбросить фильтры
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
            <Button variant="outline" onClick={exportToExcel} className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
              <Download className="mr-2 h-4 w-4" />
              Экспорт Excel
            </Button>
            
            {/* Delete buttons */}
            <div className="flex gap-2 ml-auto">
              {selectedChild !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const child = children.find(c => c.id === selectedChild);
                    openDeleteDialog('child', selectedChild, `${child?.last_name} ${child?.first_name}`);
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить результаты ребёнка
                </Button>
              )}
              {selectedGame !== 'all' && (
                <Button 
                  variant="outline" 
                  onClick={() => openDeleteDialog('game', selectedGame, gameTypeNames[selectedGame])}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить результаты игры
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => openDeleteDialog('all')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить все
              </Button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">
              Результаты диагностики ({filteredResults.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
              Загрузка данных...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Результаты не найдены</p>
              <p className="text-sm mt-2">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Дата</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ребёнок</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Игра</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Баллы</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Уровень</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(result.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {result.child_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {gameTypeNames[result.game_type] || result.game_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="font-semibold">{result.score}</span>
                        <span className="text-gray-400">/{result.max_score}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[result.level]}`}>
                          {levelNames[result.level]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog('single', result.id, '')}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Подтверждение удаления
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
