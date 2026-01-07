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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const companies = [
    'Treina que Sara',
    'Luciana Magazine',
    'Projeto Pessoal',
    'Outro'
  ];

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
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
  }, [isRunning]);

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
    setIsRunning(true);
    toast.success('Timer iniciado!');
  };

  const handlePause = () => {
    setIsRunning(false);
    toast.info('Timer pausado');
  };

  const handleStop = () => {
    if (time > 0 && taskName.trim() && company.trim()) {
      onTaskComplete({
        taskName: taskName.trim(),
        company: company.trim(),
        duration: time,
        timestamp: new Date()
      });
      toast.success('Tarefa salva com sucesso!');
    }
    setIsRunning(false);
    setTime(0);
    setTaskName('');
    setCompany('');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    toast.info('Timer resetado');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
          {formatTime(time)}
        </div>
        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Play className="w-5 h-5" />
              <span>Iniciar</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <Pause className="w-5 h-5" />
              <span>Pausar</span>
            </button>
          )}
          <button
            onClick={handleStop}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <Square className="w-5 h-5" />
            <span>Parar</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Tarefa
          </label>
          <input
            type="text"
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Ex: Editar Episódio"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            Empresa/Cliente
          </label>
          <select
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione uma empresa</option>
            {companies.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
          {company === 'Outro' && (
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Digite o nome da empresa"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Timer;