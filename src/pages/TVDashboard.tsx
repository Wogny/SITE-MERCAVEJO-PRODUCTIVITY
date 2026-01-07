import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, Users, Building2 } from 'lucide-react';

export default function TVDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTime: 0, totalTasks: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. Efeito para o Relógio (Atualiza a cada segundo)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Efeito para buscar dados e configurar Realtime
  useEffect(() => {
    fetchGlobalData();

    // Configuração do canal Realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Mudança detectada no banco:', payload);
          fetchGlobalData(); // Recarrega os dados automaticamente
        }
      )
      .subscribe((status) => {
        console.log('Status da conexão Realtime:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGlobalData = async () => {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) {
      console.error('Erro ao buscar dados globais:', error);
      return;
    }

    if (tasks) {
      // Processar dados por empresa
      const companyMap = tasks.reduce((acc: any, task: any) => {
        acc[task.company] = (acc[task.company] || 0) + task.duration;
        return acc;
      }, {});

      const chartData = Object.keys(companyMap).map(name => ({
        name,
        value: Number((companyMap[name] / 3600).toFixed(2)), // Horas com 2 casas decimais
        originalValue: companyMap[name]
      })).sort((a, b) => b.value - a.value);

      setData(chartData);

      // Estatísticas Gerais
      const totalTime = tasks.reduce((acc, t) => acc + t.duration, 0);
      const uniqueUsers = new Set(tasks.map(t => t.user_id)).size;
      
      setStats({
        totalTime,
        totalTasks: tasks.length,
        activeUsers: uniqueUsers
      });
    }
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans overflow-hidden">
      {/* Header Estilo Bloomberg */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            MERCAVEJO <span className="text-blue-500">LIVE DATA</span>
          </h1>
          <p className="text-slate-400 font-mono uppercase tracking-widest text-sm mt-1">Monitoramento de Produtividade em Tempo Real</p>
        </div>
        <div className="text-right font-mono">
          <div className="text-3xl text-white font-bold">{currentTime.toLocaleTimeString()}</div>
          <div className="text-slate-500">{currentTime.toLocaleDateString()}</div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-2">
            <Clock className="text-blue-500 w-8 h-8" />
            <span className="text-slate-400 font-bold uppercase text-xs">Tempo Total</span>
          </div>
          <div className="text-4xl font-bold">{formatDuration(stats.totalTime)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-2">
            <TrendingUp className="text-emerald-500 w-8 h-8" />
            <span className="text-slate-400 font-bold uppercase text-xs">Tarefas Concluídas</span>
          </div>
          <div className="text-4xl font-bold">{stats.totalTasks}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-2">
            <Users className="text-amber-500 w-8 h-8" />
            <span className="text-slate-400 font-bold uppercase text-xs">Usuários Ativos</span>
          </div>
          <div className="text-4xl font-bold">{stats.activeUsers}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl">
          <div className="flex items-center gap-4 mb-2">
            <Building2 className="text-purple-500 w-8 h-8" />
            <span className="text-slate-400 font-bold uppercase text-xs">Empresas Atendidas</span>
          </div>
          <div className="text-4xl font-bold">{data.length}</div>
        </div>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-3 gap-8 h-[500px]">
        <div className="col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-500" /> DISTRIBUIÇÃO DE HORAS POR CLIENTE
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#94a3b8" 
                fontSize={14} 
                width={150}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#3b82f6' }}
                formatter={(value: any) => [`${value} Horas`, 'Tempo']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col">
          <h3 className="text-xl font-bold mb-6">RANKING DE IMPACTO</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500 font-mono text-lg">#{index + 1}</span>
                  <span className="font-bold text-slate-200">{item.name}</span>
                </div>
                <span className="text-blue-400 font-mono font-bold">{item.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticker estilo Bolsa no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-600 h-10 flex items-center overflow-hidden">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-12 text-white font-bold text-sm uppercase">
          {data.map(item => (
            <span key={item.name} className="flex items-center gap-2">
              {item.name} <span className="text-blue-200">{formatDuration(item.originalValue)}</span>
              <span className="text-emerald-300">▲</span>
            </span>
          ))}
          {/* Repetir para efeito infinito */}
          {data.map(item => (
            <span key={`${item.name}-2`} className="flex items-center gap-2">
              {item.name} <span className="text-blue-200">{formatDuration(item.originalValue)}</span>
              <span className="text-emerald-300">▲</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
