import React from 'react';
import Header from '../components/Header';
import DashboardComponent from '../components/Dashboard';
import { useTasks } from '../hooks/useTasks';

export default function Dashboard() {
  const { tasks, loading } = useTasks();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-mercavejo-dark">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualize suas estatísticas de produtividade</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando estatísticas...</div>
        ) : (
          <DashboardComponent tasks={tasks} />
        )}
      </main>
    </div>
  );
}
