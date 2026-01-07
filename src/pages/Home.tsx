import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Timer from '../components/Timer';
import { toast } from 'react-toastify';

interface Task {
  id: string;
  taskName: string;
  company: string;
  duration: number;
  timestamp: Date;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const savedTasks = localStorage.getItem('mercavejo-tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          timestamp: new Date(task.timestamp)
        }));
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, []);

  const handleTaskComplete = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString()
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    
    try {
      localStorage.setItem('mercavejo-tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Timer de Produtividade</h1>
          <p className="text-gray-600">Gerencie seu tempo de trabalho de forma eficiente</p>
        </div>
        
        <Timer onTaskComplete={handleTaskComplete} />
        
        {tasks.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Última Tarefa Registrada</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{tasks[tasks.length - 1].taskName}</h3>
              <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                <span>{tasks[tasks.length - 1].company}</span>
                <span className="font-mono">
                  {Math.floor(tasks[tasks.length - 1].duration / 3600).toString().padStart(2, '0')}:
                  {Math.floor((tasks[tasks.length - 1].duration % 3600) / 60).toString().padStart(2, '0')}:
                  {(tasks[tasks.length - 1].duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}