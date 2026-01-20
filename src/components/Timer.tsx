import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';

interface TimerProps {
  onTaskComplete: (taskData: {
    taskName: string;
    company: string;
    duration: number;
    timestamp: Date;
  }) => void;
}

const Timer: React.FC<TimerProps> = ({ onTaskComplete }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [company, setCompany] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const intervalRef = useRef<any>(null);

  const companies = [
    'Fundmax',
    'Boni Livros',
    'Vox FM',
    'Netflex',
    'RioFibras',
    'Mauricio Moraes',
    'Café com Zakia',
    'Antes da Consulta',
    'Sai do Raso',
    'Marcela Beauty',
    'Santo Antonio',
    'Treina que Sara',
    'Luciana Magazine',
    'Projeto Pessoal',
    'Outro'
  ];

  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTime(accumulatedTime + elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTime, accumulatedTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!taskName.trim()) {
      toast.error('Por favor, insira o nome da tarefa');
      return;
    }
    if (!company.trim()) {
      toast.error('Por favor, selecione ou insira a empresa/cliente');
      return;
    }
    setStartTime(Date.now());
    setIsRunning(true);
    toast.success('Timer iniciado!');
  };

  const handlePause = () => {
    if (startTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setAccumulatedTime(prev => prev + elapsed);
    }
    setIsRunning(false);
    setStartTime(null);
    toast.info('Timer pausado');
  };

  const handleStop = () => {
    let finalTime = time;
    if (isRunning && startTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      finalTime = accumulatedTime + elapsed;
    }

    if (finalTime > 0 && taskName.trim() && company.trim()) {
      onTaskComplete({
        taskName: taskName.trim(),
        company: company.trim(),
        duration: finalTime,
        timestamp: new Date()
      });
      toast.success('Tarefa salva com sucesso!');
    }
    setIsRunning(false);
    setStartTime(null);
    setAccumulatedTime(0);
    setTime(0);
    setTaskName('');
    setCompany('');
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
    setAccumulatedTime(0);
    setTime(0);
    toast.info('Timer resetado');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl sm:text-6xl font-mono font-bold text-mercavejo-blue dark:text-mercavejo-gold mb-6 tracking-tighter">
          {formatTime(time)}
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center justify-center space-x-2 bg-mercavejo-blue hover:bg-mercavejo-dark text-white px-5 py-3 sm:px-6 sm:py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-900/20 flex-1 sm:flex-none min-w-[120px]"
            >
              <Play className="w-5 h-5" />
              <span>Iniciar</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center justify-center space-x-2 bg-mercavejo-gold hover:opacity-90 text-white px-5 py-3 sm:px-6 sm:py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-amber-900/20 flex-1 sm:flex-none min-w-[120px]"
            >
              <Pause className="w-5 h-5" />
              <span>Pausar</span>
            </button>
          )}
          
          <button
            onClick={handleStop}
            disabled={time === 0}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 sm:px-6 sm:py-3 rounded-xl font-bold transition-all flex-1 sm:flex-none min-w-[120px] disabled:bg-gray-200"
          >
            <Square className="w-5 h-5" />
            <span>Parar</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-5 py-3 sm:px-6 sm:py-3 rounded-xl font-bold transition-all flex-1 sm:flex-none min-w-[120px]"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black text-mercavejo-blue dark:text-mercavejo-gold mb-1 uppercase tracking-widest">
            O que você está fazendo?
          </label>
          <input
            type="text"
            placeholder="Ex: Reunião de Planejamento"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mercavejo-gold focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-mercavejo-blue dark:text-mercavejo-gold mb-1 uppercase tracking-widest">
            Empresa / Cliente
          </label>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-mercavejo-gold focus:border-transparent outline-none transition-all appearance-none"
          >
            <option value="">Selecione um cliente</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Timer;
