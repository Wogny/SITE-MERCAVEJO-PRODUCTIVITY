import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, Users, Building2, Wifi, WifiOff, Calendar, ListTodo } from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, isAfter, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilterType = 'day' | 'week' | 'month' | 'all';

export default function TVDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTime: 0, totalTasks: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchGlobalData();
    const polling = setInterval(fetchGlobalData, 30000);
    const channel = supabase
      .channel('tv-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchGlobalData())
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));

    return () => {
      clearInterval(polling);
      supabase.removeChannel(channel);
    };
  }, [filter]); // Recarrega quando o filtro muda

  const fetchGlobalData = async () => {
    try {
      const { data: tasks, error } = await supabase.from('tasks').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      
      if (tasks) {
        // Aplicar Filtro de Data
        let filteredTasks = tasks;
        const now = new Date();
        
        if (filter === 'day') {
          const start = startOfDay(now);
          filteredTasks = tasks.filter(t => isAfter(new Date(t.timestamp), start));
        } else if (filter === 'week') {
          const start = startOfWeek(now, { weekStartsOn: 1 });
          filteredTasks = tasks.filter(t => isAfter(new Date(t.timestamp), start));
        } else if (filter === 'month') {
          const start = startOfMonth(now);
          filteredTasks = tasks.filter(t => isAfter(new Date(t.timestamp), start));
        }

        setRawTasks(filteredTasks);

        const companyMap = filteredTasks.reduce((acc: any, task: any) => {
          acc[task.company] = (acc[task.company] || 0) + task.duration;
          return acc;
        }, {});

        const chartData = Object.keys(companyMap).map(name => ({
          name,
          value: Number((companyMap[name] / 3600).toFixed(1)),
          originalValue: companyMap[name]
        })).sort((a, b) => b.value - a.value).slice(0, 8);

        setData(chartData);

        const totalTime = filteredTasks.reduce((acc, t) => acc + t.duration, 0);
        const uniqueUsers = new Set(filteredTasks.map(t => t.user_id)).size;
        setStats({ totalTime, totalTasks: filteredTasks.length, activeUsers: uniqueUsers });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatFullDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const COLORS = ['#C5A267', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 p-6 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-black animate-pulse">LIVE</div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              MERCAVEJO <span className="text-mercavejo-gold">PRODUCTIVITY</span>
            </h1>
          </div>
          
          {/* Filtros de Tempo */}
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
            {[
              { id: 'day', label: 'Hoje' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
              { id: 'all', label: 'Tudo' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as FilterType)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  filter === f.id 
                    ? 'bg-mercavejo-gold text-slate-950 shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'REALTIME ACTIVE' : 'RECONNECTING...'}
          </div>
        </div>
        <div className="text-right font-mono">
          <div className="text-4xl font-black leading-none text-white">{currentTime.toLocaleTimeString()}</div>
          <div className="text-mercavejo-gold text-sm uppercase tracking-widest font-bold">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: `Tempo (${filter})`, val: formatDuration(stats.totalTime), icon: Clock, color: 'text-mercavejo-gold' },
          { label: 'Tarefas', val: stats.totalTasks, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Usuários', val: stats.activeUsers, icon: Users, color: 'text-amber-500' },
          { label: 'Clientes', val: data.length, icon: Building2, color: 'text-purple-500' }
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/80 border border-slate-700 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-1">
              <s.icon className={`${s.color} w-6 h-6`} />
              <span className="text-slate-400 font-black uppercase text-xs tracking-widest">{s.label}</span>
            </div>
            <div className="text-4xl font-black text-white">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0 mb-12">
        {/* Chart Container */}
        <div className="col-span-2 bg-slate-900/80 border border-slate-700 p-8 rounded-3xl flex flex-col shadow-2xl">
          <h3 className="text-xl font-black mb-6 text-mercavejo-gold uppercase tracking-[0.2em]">Horas por Cliente</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 40, right: 60, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#f8fafc" 
                  fontSize={18} 
                  fontWeight="900"
                  width={180}
                  tick={{ fill: '#f8fafc' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '2px solid #3b82f6', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(v: any) => [`${v} Horas`, 'Tempo']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={45}>
                  {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking & History Container */}
        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Ranking */}
          <div className="flex-1 bg-slate-900/80 border border-slate-700 p-6 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            <h3 className="text-lg font-black mb-4 text-mercavejo-gold uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Ranking
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <Calendar className="w-10 h-10 mb-2 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Sem dados</p>
                </div>
              ) : (
                data.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-600/50">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-500 font-black text-lg italic">#{index + 1}</span>
                      <span className="font-black text-sm text-white tracking-tight truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-black text-lg">{item.value}h</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Task History */}
          <div className="flex-1 bg-slate-900/80 border border-slate-700 p-6 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            <h3 className="text-lg font-black mb-4 text-mercavejo-gold uppercase tracking-[0.2em] flex items-center gap-2">
              <ListTodo className="w-5 h-5" /> Histórico
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {rawTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <ListTodo className="w-10 h-10 mb-2 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs text-center">Nenhuma tarefa recente</p>
                </div>
              ) : (
                rawTasks.slice(0, 20).map((task, index) => (
                  <div key={task.id || index} className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-mercavejo-gold/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-xs text-mercavejo-gold uppercase truncate max-w-[150px]">{task.company}</span>
                      <span className="text-[10px] font-mono text-slate-500">{format(new Date(task.timestamp), 'HH:mm', { locale: ptBR })}</span>
                    </div>
                    <p className="text-sm font-bold text-white line-clamp-1 mb-1">{task.taskName}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {format(new Date(task.timestamp), 'dd MMM', { locale: ptBR })}
                      </span>
                      <span className="text-xs font-black text-emerald-400 font-mono">{formatFullDuration(task.duration)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-mercavejo-blue h-12 flex items-center overflow-hidden border-t-2 border-mercavejo-gold shadow-[0_-10px_50px_rgba(0,43,69,0.4)]">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-20 text-white font-black text-sm uppercase tracking-[0.1em]">
          {data.length > 0 ? data.concat(data).map((item, i) => (
            <span key={i} className="flex items-center gap-4">
              <span className="text-mercavejo-gold text-xl">★</span> 
              <span className="text-white">{item.name}</span> 
              <span className="bg-mercavejo-dark/50 px-3 py-1 rounded-full border border-mercavejo-gold/30">
                {formatDuration(item.originalValue)}
              </span>
            </span>
          )) : (
            <span className="text-blue-200">Aguardando novos registros para o período selecionado...</span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
}
