import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTimer } from '../hooks/useTimer';

interface TimerContextType {
  time: number;
  isRunning: boolean;
  taskName: string;
  company: string;
  startTimer: (taskName: string, company: string) => void;
  pauseTimer: () => void;
  stopTimer: () => any;
  resetTimer: () => void;
  setTaskName: (name: string) => void;
  setCompany: (company: string) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const timerState = useTimer();

  return (
    <TimerContext.Provider value={timerState}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};
