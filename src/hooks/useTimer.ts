import { useState, useEffect, useRef } from 'react';

const TIMER_STORAGE_KEY = 'mercavejo-timer-state';

interface TimerState {
  time: number;
  isRunning: boolean;
  taskName: string;
  company: string;
  startTime: number | null;
  accumulatedTime: number;
  lastUpdate: number;
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Se estava rodando, calcula o tempo decorrido desde a última atualização
      if (parsed.isRunning && parsed.startTime) {
        const now = Date.now();
        const elapsedSinceLastUpdate = Math.floor((now - parsed.lastUpdate) / 1000);
        const totalElapsed = Math.floor((now - parsed.startTime) / 1000);
        return {
          ...parsed,
          time: parsed.accumulatedTime + totalElapsed,
          lastUpdate: now
        };
      }
      return parsed;
    }
    return {
      time: 0,
      isRunning: false,
      taskName: '',
      company: '',
      startTime: null,
      accumulatedTime: 0,
      lastUpdate: Date.now()
    };
  });

  const intervalRef = useRef<any>(null);

  // Salva o estado no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
      ...state,
      lastUpdate: Date.now()
    }));
  }, [state]);

  useEffect(() => {
    if (state.isRunning && state.startTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - state.startTime!) / 1000);
        setState(prev => ({
          ...prev,
          time: prev.accumulatedTime + elapsed,
          lastUpdate: now
        }));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.startTime]);

  const startTimer = (taskName: string, company: string) => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isRunning: true,
      taskName,
      company,
      startTime: now,
      lastUpdate: now
    }));
  };

  const pauseTimer = () => {
    if (state.startTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - state.startTime) / 1000);
      setState(prev => ({
        ...prev,
        isRunning: false,
        accumulatedTime: prev.accumulatedTime + elapsed,
        startTime: null,
        lastUpdate: now
      }));
    }
  };

  const stopTimer = () => {
    const finalState = { ...state };
    setState({
      time: 0,
      isRunning: false,
      taskName: '',
      company: '',
      startTime: null,
      accumulatedTime: 0,
      lastUpdate: Date.now()
    });
    localStorage.removeItem(TIMER_STORAGE_KEY);
    return finalState;
  };

  const resetTimer = () => {
    setState({
      time: 0,
      isRunning: false,
      taskName: '',
      company: '',
      startTime: null,
      accumulatedTime: 0,
      lastUpdate: Date.now()
    });
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const setTaskName = (name: string) => setState(prev => ({ ...prev, taskName: name }));
  const setCompany = (company: string) => setState(prev => ({ ...prev, company }));

  return {
    ...state,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    setTaskName,
    setCompany
  };
}
