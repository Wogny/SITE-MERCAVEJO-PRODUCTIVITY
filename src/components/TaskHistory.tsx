import React, { useState } from 'react';
import { Search, Download, Calendar, Building2, Clock, Trash2, Edit2, Check, X } from 'lucide-react';
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
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, updates: { taskName: string, company: string }) => void;
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ tasks, onExport, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // Estado para edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');

  const companiesList = [
    'Fundmax', 'Boni Livros', 'Vox FM', 'Netflex', 'RioFibras', 
    'Mauricio Moraes', 'Café com Zakia', 'Antes da Consulta', 
    'Sai do Raso', 'Marcela Beauty', 'Santo Antonio', 
    'Treina que Sara', 'Luciana Magazine', 'Projeto Pessoal', 'Outro'
  ];

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

  const uniqueCompanies = Array.from(new Set(tasks.map(task => task.company)));

  const getTotalTime = () => {
    return filteredTasks.reduce((total, task) => total + task.duration, 0);
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditName(task.taskName);
    setEditCompany(task.company);
  };

  const handleSave = (id: string) => {
    onUpdate(id, { taskName: editName, company: editCompany });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-black text-mercavejo-blue uppercase tracking-tight mb-4 sm:mb-0">Histórico de Tarefas</h2>
        <button
          onClick={onExport}
          className="flex items-center space-x-2 bg-mercavejo-blue hover:bg-mercavejo-dark text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md"
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
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mercavejo-gold outline-none"
          />
        </div>

        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mercavejo-gold outline-none appearance-none"
          >
            <option value="">Todas as empresas</option>
            {uniqueCompanies.map(company => (
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
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mercavejo-gold outline-none"
          />
        </div>
      </div>

      {filteredTasks.length > 0 && (
        <div className="mb-6 p-4 bg-mercavejo-blue/5 rounded-xl border border-mercavejo-blue/10">
          <div className="flex items-center space-x-2 text-mercavejo-blue">
            <Clock className="w-5 h-5 text-mercavejo-gold" />
            <span className="font-black uppercase text-sm tracking-widest">
              Tempo total filtrado: <span className="text-mercavejo-gold">{formatDuration(getTotalTime())}</span>
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">Nenhuma tarefa encontrada</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50 transition-all shadow-sm">
              {editingId === task.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-mercavejo-blue mb-1 uppercase">Tarefa</label>
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mercavejo-gold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-mercavejo-blue mb-1 uppercase">Empresa</label>
                      <select 
                        value={editCompany} 
                        onChange={(e) => setEditCompany(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mercavejo-gold outline-none"
                      >
                        {companiesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleSave(task.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-black text-mercavejo-blue uppercase tracking-tight text-lg">{task.taskName}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 mt-2 uppercase tracking-wider">
                      <span className="flex items-center">
                        <Building2 className="w-3 h-3 mr-1 text-mercavejo-gold" />
                        {task.company}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-mercavejo-gold" />
                        {format(task.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-mercavejo-gold" />
                      <span className="font-mono font-black text-mercavejo-blue text-lg">
                        {formatDuration(task.duration)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="p-2 text-gray-400 hover:text-mercavejo-blue hover:bg-gray-100 rounded-xl transition-all"
                        title="Editar tarefa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Deseja realmente excluir esta tarefa?')) {
                            onDelete(task.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskHistory;
