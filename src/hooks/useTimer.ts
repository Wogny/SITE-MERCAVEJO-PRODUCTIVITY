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

const initialState: TimerState = {
  time: 0,
  isRunning: false,
  taskName: '',
  company: '',
  startTime: null,
  accumulatedTime: 0,
  lastUpdate: Date.now()
};

export function useTimer() {
  const [state, setState] = useState<TimerState>(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // CORREÇÃO: Ao dar F5, sempre pausa o timer e mantém o tempo acumulado
        // Não recalcula o tempo se estava rodando
        if (parsed.isRunning) {
          return {
            ...parsed,
            isRunning: false, // Força pausar ao recarregar
            time: parsed.accumulatedTime, // Usa apenas o tempo acumulado
            startTime: null, // Remove o startTime
            lastUpdate: Date.now()
          };
        }
        return parsed;
      } catch (e) {
        return initialState;
      }
    }
    return initialState;
  });

  const intervalRef = useRef<any>(null);

  // Salva o estado no localStorage sempre que mudar, exceto se for o estado inicial limpo
  useEffect(() => {
    if (state.time === 0 && !state.isRunning && !state.taskName && !state.company) {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } else {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
        ...state,
        lastUpdate: Date.now()
      }));
    }
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
        time: prev.accumulatedTime + elapsed, // Atualiza o time também
        accumulatedTime: prev.accumulatedTime + elapsed,
        startTime: null,
        lastUpdate: now
      }));
    }
  };

  const stopTimer = () => {
    const finalState = { ...state };
    // Força a limpeza imediata do localStorage e do estado
    localStorage.removeItem(TIMER_STORAGE_KEY);
    setState(initialState);
    return finalState;
  };

  const resetTimer = () => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
    setState(initialState);
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
