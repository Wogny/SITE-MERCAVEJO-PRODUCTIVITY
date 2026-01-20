import React from 'react';
import Header from '../components/Header';
import TaskHistory from '../components/TaskHistory';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '../hooks/useTasks';

export default function Historico() {
  const { tasks, loading, deleteTask, updateTask } = useTasks();

  const handleExport = () => {
    if (tasks.length === 0) {
      toast.warning('Nenhuma tarefa para exportar');
      return;
    }

    const formatDuration = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const csvHeaders = ['Data', 'Empresa', 'Tarefa', 'Tempo', 'Timestamp'];
    const csvData = tasks.map(task => [
      format(task.timestamp, 'dd/MM/yyyy', { locale: ptBR }),
      task.company,
      task.taskName,
      formatDuration(task.duration),
      format(task.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mercavejo-historico-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Histórico exportado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-mercavejo-dark">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-mercavejo-blue dark:text-white uppercase tracking-tight mb-2">Histórico</h1>
          <p className="text-gray-600 dark:text-gray-400 font-bold uppercase text-xs tracking-widest">Visualize e gerencie seu histórico de tarefas</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Carregando histórico...</div>
        ) : (
          <TaskHistory 
            tasks={tasks} 
            onExport={handleExport} 
            onDelete={deleteTask} 
            onUpdate={updateTask}
          />
        )}
      </main>
    </div>
  );
}
