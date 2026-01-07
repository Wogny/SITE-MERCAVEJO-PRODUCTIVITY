import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export interface Task {
  id: string;
  taskName: string;
  company: string;
  duration: number;
  timestamp: Date;
  user_id?: string;
}

const LOCAL_STORAGE_KEY = 'mercavejo-tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar sessão do usuário
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    
    // 1. Carregar do LocalStorage (sempre disponível)
    const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
    let localTasks: Task[] = [];
    if (savedTasks) {
      try {
        localTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          timestamp: new Date(task.timestamp)
        }));
      } catch (e) {
        console.error('Erro ao ler localStorage', e);
      }
    }

    // 2. Se logado, carregar do Supabase e mesclar
    if (user) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        if (data) {
          const remoteTasks = data.map(t => ({
            id: t.id,
            taskName: t.task_name,
            company: t.company,
            duration: t.duration,
            timestamp: new Date(t.timestamp),
            user_id: t.user_id
          }));

          // Mesclar (prioridade para o que for mais recente ou remoto)
          // Para simplificar, vamos usar os dados do Supabase como fonte da verdade se logado
          setTasks(remoteTasks);
          // Atualizar localStorage com dados remotos para manter sync offline
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteTasks));
        }
      } catch (error) {
        console.error('Erro ao carregar do Supabase:', error);
        setTasks(localTasks);
      }
    } else {
      setTasks(localTasks);
    }
    
    setLoading(false);
  };

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      user_id: user?.id
    };

    // Atualizar estado local imediatamente (UI responsiva)
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));

    // Se logado, salvar no Supabase
    if (user) {
      try {
        const { error } = await supabase.from('tasks').insert([{
          task_name: newTask.taskName,
          company: newTask.company,
          duration: newTask.duration,
          timestamp: newTask.timestamp.toISOString(),
          user_id: user.id
        }]);

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao salvar no Supabase:', error);
        toast.warn('Salvo localmente, mas houve erro na sincronização com a nuvem.');
      }
    }
  };

  const clearTasks = async () => {
    if (user) {
      const { error } = await supabase.from('tasks').delete().eq('user_id', user.id);
      if (error) {
        toast.error('Erro ao limpar tarefas na nuvem');
        return;
      }
    }
    setTasks([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.success('Histórico limpo com sucesso');
  };

  return { tasks, loading, addTask, clearTasks, user };
}
