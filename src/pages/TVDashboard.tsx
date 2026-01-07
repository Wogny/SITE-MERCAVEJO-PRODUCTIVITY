import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, Users, Building2, Wifi, WifiOff } from 'lucide-react';

export default function TVDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTime: 0, totalTasks: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);

  // 1. Relógio Dinâmico
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Busca de Dados e Realtime
  useEffect(() => {
    fetchGlobalData();

    // Polling de Segurança (Busca a cada 30s caso o Realtime falhe)
    const polling = setInterval(fetchGlobalData, 30000);

    const channel = supabase
      .channel('tv-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          console.log('Realtime: Atualizando dados...');
          fetchGlobalData();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      clearInterval(polling);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGlobalData = async () => {
    try {
      const { data: tasks, error } = await supabase.from('tasks').select('*');
      if (error) throw error;

      if (tasks) {
        const companyMap = tasks.reduce((acc: any, task: any) => {
          acc[task.company] = (acc[task.company] || 0) + task.duration;
          return acc;
        }, {});

        const chartData = Object.keys(companyMap).map(name => ({
          name,
          value: Number((companyMap[name] / 3600).toFixed(1)),
          originalValue: companyMap[name]
        })).sort((a, b) => b.value - a.value).slice(0, 8); // Top 8 para não quebrar o layout

        setData(chartData);

        const totalTime = tasks.reduce((acc, t) => acc + t.duration, 0);
        const uniqueUsers = new Set(tasks.map(t => t.user_id)).size;
        
        setStats({
          totalTime,
          totalTasks: tasks.length,
          activeUsers: uniqueUsers
        });
      }
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 p-6 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-black animate-pulse">LIVE</div>
          <h1 className="text-3xl font-black tracking-tighter">MERCAVEJO <span className="text-blue-500">PRODUCTIVITY</span></h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'REALTIME ACTIVE' : 'RECONNECTING...'}
          </div>
        </div>
        <div className="text-right font-mono">
          <div className="text-3xl font-bold leading-none">{currentTime.toLocaleTimeString()}</div>
          <div className="text-slate-500 text-sm uppercase tracking-widest">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tempo Total', val: formatDuration(stats.totalTime), icon: Clock, color: 'text-blue-500' },
          { label: 'Tarefas', val: stats.totalTasks, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Usuários', val: stats.activeUsers, icon: Users, color: 'text-amber-500' },
          { label: 'Clientes', val: data.length, icon: Building2, color: 'text-purple-500' }
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-1">
              <s.icon className={`${s.color} w-5 h-5`} />
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{s.label}</span>
            </div>
            <div className="text-3xl font-black">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0 mb-12">
        {/* Chart Container */}
        <div className="col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-slate-400 uppercase tracking-widest">Horas por Cliente (Top 8)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  formatter={(v: any) => [`${v}h`, 'Tempo']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={35}>
                  {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking Container */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-slate-400 uppercase tracking-widest">Ranking</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 font-mono font-bold">0{index + 1}</span>
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-mono font-bold text-sm">{item.value}h</div>
                  <div className="text-[10px] text-slate-500 uppercase">{Math.round((item.originalValue / stats.totalTime) * 100)}% do total</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-700 h-8 flex items-center overflow-hidden border-t border-blue-500 shadow-[0_-10px_40px_rgba(37,99,235,0.2)]">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-16 text-white font-black text-[10px] uppercase tracking-widest">
          {data.concat(data).map((item, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="text-blue-200">●</span> {item.name} <span className="bg-blue-800 px-2 py-0.5 rounded">{formatDuration(item.originalValue)}</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}
