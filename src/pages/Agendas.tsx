import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  LayoutDashboard, 
  Video, 
  History, 
  Building2, 
  User as UserIcon,
  Loader2,
  Trello
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Configurações do Trello (Devem ser configuradas no .env ou via UI)
const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY || '';
const TRELLO_TOKEN = import.meta.env.VITE_TRELLO_TOKEN || '';
const TRELLO_BOARD_ID = import.meta.env.VITE_TRELLO_BOARD_ID || '';

type TabType = 'estudio' | 'fluxo' | 'entregas';

export default function Agendas() {
  const [activeTab, setActiveTab] = useState<TabType>('estudio');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [trelloCards, setTrelloCards] = useState<any[]>([]);
  const [studioStatus, setStudioStatus] = useState({ isUsed: false, isRecording: false });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'fluxo') {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(5);
        if (error) throw error;
        setTasks(data || []);
      } else if (activeTab === 'estudio' || activeTab === 'entregas') {
        // Aqui buscaríamos do Trello se tivéssemos as chaves
        if (TRELLO_API_KEY && TRELLO_TOKEN && TRELLO_BOARD_ID) {
          const response = await fetch(`https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name,idList,labels,members&member_fields=fullName`);
          const cards = await response.json();
          setTrelloCards(cards);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderEstudio = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-6 rounded-2xl border-2 flex items-center justify-between ${studioStatus.isUsed ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Status do Estúdio</p>
            <h3 className={`text-2xl font-black uppercase ${studioStatus.isUsed ? 'text-amber-700' : 'text-emerald-700'}`}>
              {studioStatus.isUsed ? 'Em Uso' : 'Disponível'}
            </h3>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${studioStatus.isUsed ? 'bg-amber-200 text-amber-700' : 'bg-emerald-200 text-emerald-700'}`}>
            <LayoutDashboard className="w-6 h-6" />
          </div>
        </div>
        <div className={`p-6 rounded-2xl border-2 flex items-center justify-between ${studioStatus.isRecording ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-gray-50 border-gray-200'}`}>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Gravação</p>
            <h3 className={`text-2xl font-black uppercase ${studioStatus.isRecording ? 'text-red-700' : 'text-gray-400'}`}>
              {studioStatus.isRecording ? 'Gravando Agora' : 'Inativo'}
            </h3>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${studioStatus.isRecording ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-400'}`}>
            <Video className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-mercavejo-blue" /> Agendamentos (Trello)
          </h3>
        </div>
        <div className="p-0">
          {trelloCards.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Trello className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="font-bold uppercase text-xs">Nenhum agendamento encontrado ou API não configurada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {trelloCards.map(card => (
                <div key={card.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 uppercase">{card.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">Agendado via Trello</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase">Pendente</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFluxo = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
          <History className="w-5 h-5 text-mercavejo-blue" /> Últimas 5 Tarefas
        </h3>
      </div>
      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400">
            <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin opacity-20" />
            <p className="font-bold uppercase text-xs">Buscando tarefas...</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-mercavejo-gold transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-mercavejo-blue/5 rounded-xl flex items-center justify-center group-hover:bg-mercavejo-blue group-hover:text-white transition-colors">
                    <Building2 className="w-6 h-6 text-mercavejo-blue group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-mercavejo-gold uppercase tracking-[0.2em] mb-1">{task.company}</p>
                    <h4 className="text-lg font-black text-gray-900 uppercase leading-tight">{task.task_name || task.taskName}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-xs font-bold text-gray-600 uppercase">{task.user_name || 'Usuário'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono font-bold">{format(new Date(task.timestamp), 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg border border-emerald-100">
                  <span className="text-xs font-black font-mono">
                    {Math.floor(task.duration / 3600).toString().padStart(2, '0')}:
                    {Math.floor((task.duration % 3600) / 60).toString().padStart(2, '0')}:
                    {(task.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderEntregas = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Entregas do Dia (Concluídos)
        </h3>
      </div>
      <div className="grid gap-4">
        {trelloCards.filter(c => c.idList === 'concluido_id_placeholder').length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="font-bold uppercase text-xs">Nenhuma entrega concluída hoje no Trello</p>
          </div>
        ) : (
          trelloCards.map((card) => (
            <div key={card.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-emerald-500">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-black text-gray-900 uppercase">{card.name}</h4>
                  <p className="text-xs font-bold text-gray-500 uppercase mt-1">Lista: {card.listName || 'Concluído'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Concluído por</p>
                    <p className="text-xs font-bold text-gray-700 uppercase">{card.members?.[0]?.fullName || 'Equipe'}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-mercavejo-blue uppercase tracking-tighter">Agendas e <span className="text-mercavejo-gold">Horários</span></h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Monitoramento em tempo real</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('estudio')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'estudio' ? 'bg-mercavejo-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Estúdio
            </button>
            <button 
              onClick={() => setActiveTab('fluxo')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'fluxo' ? 'bg-mercavejo-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Fluxo
            </button>
            <button 
              onClick={() => setActiveTab('entregas')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'entregas' ? 'bg-mercavejo-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Entregas
            </button>
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-12 h-12 text-mercavejo-gold animate-spin mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Carregando dados...</p>
            </div>
          ) : (
            <>
              {activeTab === 'estudio' && renderEstudio()}
              {activeTab === 'fluxo' && renderFluxo()}
              {activeTab === 'entregas' && renderEntregas()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
