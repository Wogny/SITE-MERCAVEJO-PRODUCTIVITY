import React, { useState, useEffect, useRef } from 'react';
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
  Trello,
  AlertCircle,
  Users,
  Power
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Configurações do Trello (Devem ser configuradas no .env)
const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY || '';
const TRELLO_TOKEN = import.meta.env.VITE_TRELLO_TOKEN || '';
const TRELLO_BOARD_ID = import.meta.env.VITE_TRELLO_BOARD_ID || '';
const TRELLO_STUDIO_LIST_ID = import.meta.env.VITE_TRELLO_STUDIO_LIST_ID || '';
const TRELLO_COMPLETED_LIST_ID = import.meta.env.VITE_TRELLO_COMPLETED_LIST_ID || '';
const TRELLO_HORARIOS_LIST_ID = import.meta.env.VITE_TRELLO_HORARIOS_LIST_ID || '';

export default function Agendas() {
  const [loadingFluxo, setLoadingFluxo] = useState(true);
  const [loadingEstudio, setLoadingEstudio] = useState(true);
  const [loadingEntregas, setLoadingEntregas] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(true);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [studioCards, setStudioCards] = useState<any[]>([]);
  const [completedCards, setCompletedCards] = useState<any[]>([]);
  const [horariosCards, setHorariosCards] = useState<any[]>([]);
  const [studioStatus, setStudioStatus] = useState({ isUsed: false, isRecording: false });
  const [manualStudioMode, setManualStudioMode] = useState(false);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Verificar status do estúdio baseado no horário atual
  useEffect(() => {
    const checkStudioStatus = () => {
      if (manualStudioMode) return; // Se modo manual está ativo, não sobrescreve

      const now = new Date();
      const isUsed = studioCards.some(card => {
        if (!card.due) return false;
        const cardTime = new Date(card.due);
        // Considerar que o agendamento está "em uso" se for nos próximos 30 minutos ou se já passou há menos de 30 minutos
        const timeDiff = Math.abs(now.getTime() - cardTime.getTime()) / (1000 * 60);
        return timeDiff <= 30;
      });

      const isRecording = studioCards.some((c: any) => c.labels?.some((l: any) => l.name === 'Gravando'));

      setStudioStatus({
        isUsed: isUsed,
        isRecording: isRecording
      });
    };

    checkStudioStatus();
    const statusInterval = setInterval(checkStudioStatus, 60000); // Verifica a cada minuto
    return () => clearInterval(statusInterval);
  }, [studioCards, manualStudioMode]);

  const fetchAllData = async () => {
    fetchFluxoData();
    fetchEstudioData();
    fetchEntregasData();
    fetchHorariosData();
  };

  const fetchFluxoData = async () => {
    setLoadingFluxo(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
    } finally {
      setLoadingFluxo(false);
    }
  };

  const fetchEstudioData = async () => {
    setLoadingEstudio(true);
    try {
      if (TRELLO_API_KEY && TRELLO_TOKEN && TRELLO_STUDIO_LIST_ID) {
        const response = await fetch(
          `https://api.trello.com/1/lists/${TRELLO_STUDIO_LIST_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name,idList,labels,members,due&member_fields=fullName`
        );
        if (response.ok) {
          const cards = await response.json();
          setStudioCards(cards);
        } else {
          console.error('Erro ao buscar cards do Trello:', response.status);
        }
      } else {
        console.warn('Variáveis de configuração do Trello não definidas para estúdio');
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos do Trello:', err);
    } finally {
      setLoadingEstudio(false);
    }
  };

  const fetchEntregasData = async () => {
    setLoadingEntregas(true);
    try {
      if (TRELLO_API_KEY && TRELLO_TOKEN && TRELLO_COMPLETED_LIST_ID) {
        const response = await fetch(
          `https://api.trello.com/1/lists/${TRELLO_COMPLETED_LIST_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name,idList,labels,members,due&member_fields=fullName`
        );
        if (response.ok) {
          const cards = await response.json();
          setCompletedCards(cards);
        } else {
          console.error('Erro ao buscar cards concluídos:', response.status);
        }
      } else {
        console.warn('Variáveis de configuração do Trello não definidas para entregas');
      }
    } catch (err) {
      console.error('Erro ao buscar entregas do Trello:', err);
    } finally {
      setLoadingEntregas(false);
    }
  };

  const fetchHorariosData = async () => {
    setLoadingHorarios(true);
    try {
      if (!TRELLO_API_KEY || !TRELLO_TOKEN || !TRELLO_HORARIOS_LIST_ID) {
        console.warn('Variáveis de configuração do Trello não definidas para horários:', {
          hasKey: !!TRELLO_API_KEY,
          hasToken: !!TRELLO_TOKEN,
          hasListId: !!TRELLO_HORARIOS_LIST_ID
        });
        setLoadingHorarios(false);
        return;
      }

      const url = `https://api.trello.com/1/lists/${TRELLO_HORARIOS_LIST_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name,idList,labels,members,due&member_fields=fullName`;
      console.log('Buscando horários de:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Erro ao buscar cards de horários. Status:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Resposta de erro:', errorText);
        setLoadingHorarios(false);
        return;
      }

      const cards = await response.json();
      console.log('Horários carregados com sucesso:', cards);
      
      // Ordenar por data/hora se disponível
      const sortedCards = cards.sort((a: any, b: any) => {
        if (a.due && b.due) {
          return new Date(a.due).getTime() - new Date(b.due).getTime();
        }
        return 0;
      });
      
      setHorariosCards(sortedCards);
    } catch (err) {
      console.error('Erro ao buscar horários do Trello:', err);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const toggleManualStudio = () => {
    setManualStudioMode(!manualStudioMode);
    if (!manualStudioMode) {
      // Ao ativar modo manual, inverte o status de "Em Uso"
      setStudioStatus(prev => ({
        ...prev,
        isUsed: !prev.isUsed
      }));
    }
  };

  const ScrollableList = ({ items, renderItem, emptyMessage, emptyIcon: EmptyIcon }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);

    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <EmptyIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className="h-full overflow-hidden relative"
        style={{
          perspective: '1000px'
        }}
      >
        <style>{`
          @keyframes smoothScroll {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(calc(-100% / 2));
            }
          }
          
          .scroll-list {
            animation: smoothScroll ${Math.max(items.length * 3, 12)}s linear infinite;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .scroll-list:hover {
            animation-play-state: paused;
          }
        `}</style>
        
        <div className="scroll-list">
          {items.map((item: any, idx: number) => (
            <div key={`${item.id}-original-${idx}`}>
              {renderItem(item)}
            </div>
          ))}
          {items.map((item: any, idx: number) => (
            <div key={`${item.id}-loop-${idx}`}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEstudio = () => (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-mercavejo-blue" /> Estúdio
        </h3>
        <button
          onClick={toggleManualStudio}
          className={`p-2 rounded-lg transition-all ${manualStudioMode ? 'bg-red-100 text-red-600 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          title={manualStudioMode ? 'Modo manual ativo - clique para desativar' : 'Clique para ativar modo manual'}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
        <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${studioStatus.isUsed ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</p>
            <h3 className={`text-xl font-black uppercase ${studioStatus.isUsed ? 'text-amber-700' : 'text-emerald-700'}`}>
              {studioStatus.isUsed ? 'Em Uso' : 'Disponível'}
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${studioStatus.isUsed ? 'bg-amber-200 text-amber-700' : 'bg-emerald-200 text-emerald-700'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${studioStatus.isRecording ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-gray-50 border-gray-200'}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Gravação</p>
            <h3 className={`text-xl font-black uppercase ${studioStatus.isRecording ? 'text-red-700' : 'text-gray-400'}`}>
              {studioStatus.isRecording ? 'Gravando' : 'Inativo'}
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${studioStatus.isRecording ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-400'}`}>
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Agendamentos</p>
          {loadingEstudio ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-mercavejo-gold animate-spin" />
            </div>
          ) : (
            <ScrollableList
              items={studioCards}
              renderItem={(card: any) => (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-bold text-sm text-gray-900 uppercase line-clamp-2">{card.name}</h4>
                  {card.due && (
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(card.due), 'HH:mm')}</p>
                  )}
                </div>
              )}
              emptyMessage="Nenhum agendamento"
              emptyIcon={AlertCircle}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderFluxo = () => (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
          <History className="w-5 h-5 text-mercavejo-blue" /> Fluxo
        </h3>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        {loadingFluxo ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-mercavejo-gold animate-spin" />
          </div>
        ) : (
          <ScrollableList
            items={tasks}
            renderItem={(task: any) => (
              <div className="p-3 bg-gradient-to-r from-mercavejo-blue/5 to-transparent rounded-lg border border-gray-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-mercavejo-gold uppercase tracking-widest truncate">{task.company}</p>
                    <h4 className="text-sm font-black text-gray-900 uppercase leading-tight line-clamp-2">{task.task_name || task.taskName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-2.5 h-2.5 text-gray-500" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 uppercase truncate">{task.user_name || 'Usuário'}</span>
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-100 flex-shrink-0">
                    <span className="text-[10px] font-black font-mono">
                      {Math.floor(task.duration / 3600).toString().padStart(2, '0')}:
                      {Math.floor((task.duration % 3600) / 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            )}
            emptyMessage="Nenhuma tarefa recente"
            emptyIcon={History}
          />
        )}
      </div>
    </div>
  );

  const renderEntregas = () => (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Entregas
        </h3>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        {loadingEntregas ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-mercavejo-gold animate-spin" />
          </div>
        ) : (
          <ScrollableList
            items={completedCards}
            renderItem={(card: any) => (
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg border-l-4 border-l-emerald-500 border border-emerald-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-gray-900 uppercase leading-tight line-clamp-2">{card.name}</h4>
                    {card.members && card.members.length > 0 && (
                      <p className="text-[10px] font-bold text-gray-600 uppercase mt-1 truncate">
                        Por: {card.members[0].fullName}
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}
            emptyMessage="Nenhuma entrega concluída"
            emptyIcon={CheckCircle2}
          />
        )}
      </div>
    </div>
  );

  const renderHorarios = () => (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" /> Horários
        </h3>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        {loadingHorarios ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-mercavejo-gold animate-spin" />
          </div>
        ) : (
          <ScrollableList
            items={horariosCards}
            renderItem={(card: any) => (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg border border-purple-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-gray-900 uppercase leading-tight line-clamp-2">{card.name}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      {card.due && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{format(new Date(card.due), 'HH:mm')}</span>
                        </div>
                      )}
                      {card.members && card.members.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold truncate">{card.members[0].fullName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}
            emptyMessage="Nenhum horário agendado"
            emptyIcon={Clock}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6 h-[calc(100vh-80px)]">
        <div className="mb-6">
          <h1 className="text-4xl font-black text-mercavejo-blue uppercase tracking-tighter">
            Agendas e <span className="text-mercavejo-gold">Horários</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Monitoramento em tempo real</p>
        </div>

        {/* Grid de 4 colunas */}
        <div className="grid grid-cols-4 gap-6 h-[calc(100%-80px)]">
          {renderHorarios()}
          {renderEstudio()}
          {renderFluxo()}
          {renderEntregas()}
        </div>
      </main>
    </div>
  );
}
