import React from 'react';
import Header from '../components/Header';
import Timer from '../components/Timer';
import { useTasks } from '../hooks/useTasks';

export default function Home() {
  const { tasks, addTask, loading } = useTasks();

  const handleTaskComplete = (taskData: any) => {
    addTask(taskData);
  };

  // A lista de tarefas já vem ordenada por timestamp decrescente do hook useTasks
  const lastTask = tasks.length > 0 ? tasks[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-mercavejo-dark">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Timer de Produtividade</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie seu tempo de trabalho de forma eficiente</p>
        </div>
        
        <Timer onTaskComplete={handleTaskComplete} />
        
        {loading ? (
          <div className="mt-8 text-center text-gray-500">Carregando tarefas...</div>
        ) : (
          lastTask && (
            <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Última Tarefa Registrada</h2>
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{lastTask.taskName}</h3>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{lastTask.company}</span>
                  <span className="font-mono">
                    {Math.floor(lastTask.duration / 3600).toString().padStart(2, '0')}:
                    {Math.floor((lastTask.duration % 3600) / 60).toString().padStart(2, '0')}:
                    {(lastTask.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
