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

          setTasks(remoteTasks);
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

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));

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

  const deleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));

    if (user) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
        toast.success('Tarefa removida');
      } catch (error) {
        console.error('Erro ao deletar no Supabase:', error);
        toast.error('Erro ao remover da nuvem');
      }
    } else {
      toast.success('Tarefa removida localmente');
    }
  };

  const updateTask = async (taskId: string, updates: { taskName: string, company: string }) => {
    // Atualizar estado local
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));

    // Se logado, atualizar no Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            task_name: updates.taskName,
            company: updates.company
          })
          .eq('id', taskId);
        
        if (error) throw error;
        toast.success('Tarefa atualizada');
      } catch (error) {
        console.error('Erro ao atualizar no Supabase:', error);
        toast.error('Erro ao atualizar na nuvem');
      }
    } else {
      toast.success('Tarefa atualizada localmente');
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

  return { tasks, loading, addTask, deleteTask, updateTask, clearTasks, user };
}
