import React from 'react';
import Header from '../components/Header';
import Timer from '../components/Timer';
import { useTasks } from '../hooks/useTasks';

export default function Home() {
  const { tasks, addTask, loading } = useTasks();

  const handleTaskComplete = (taskData: any) => {
    addTask(taskData);
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
        
        {loading ? (
          <div className="mt-8 text-center text-gray-500">Carregando tarefas...</div>
        ) : (
          tasks.length > 0 && (
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
          )
        )}
      </main>
    </div>
  );
}
