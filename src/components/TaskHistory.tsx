import React, { useState } from 'react';
import { Search, Download, Calendar, Building2, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  taskName: string;
  company: string;
  duration: number;
  timestamp: Date;
}

interface TaskHistoryProps {
  tasks: Task[];
  onExport: () => void;
  onDelete?: (taskId: string) => void;
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ tasks, onExport, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !filterCompany || task.company === filterCompany;
    const matchesDate = !filterDate || format(task.timestamp, 'yyyy-MM-dd') === filterDate;
    
    return matchesSearch && matchesCompany && matchesDate;
  });

  const companies = Array.from(new Set(tasks.map(task => task.company)));

  const getTotalTime = (companyFilter?: string) => {
    const relevantTasks = companyFilter 
      ? filteredTasks.filter(task => task.company === companyFilter)
      : filteredTasks;
    
    return relevantTasks.reduce((total, task) => total + task.duration, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Histórico de Tarefas</h2>
        <button
          onClick={onExport}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="">Todas as empresas</option>
            {companies.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredTasks.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              Tempo total: {formatDuration(getTotalTime())}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 mb-2 sm:mb-0">
                  <h3 className="font-medium text-gray-900">{task.taskName}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3 h-3" />
                      <span>{task.company}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(task.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-mono font-medium text-blue-600">
                      {formatDuration(task.duration)}
                    </span>
                  </div>
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (window.confirm('Deseja realmente excluir esta tarefa?')) {
                          onDelete(task.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskHistory;