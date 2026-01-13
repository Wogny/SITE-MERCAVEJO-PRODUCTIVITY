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
  user_name?: string;
  user_avatar?: string;
}

const LOCAL_STORAGE_KEY = 'mercavejo-tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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
    const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
    let localTasks: Task[] = [];
    if (savedTasks) {
      try {
        localTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          timestamp: new Date(task.timestamp)
        }));
      } catch (e) { console.error(e); }
    }

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
            user_id: t.user_id,
            user_name: t.user_name,
            user_avatar: t.user_avatar
          }));
          setTasks(remoteTasks);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remoteTasks));
        }
      } catch (error) {
        console.error(error);
        setTasks(localTasks);
      }
    } else {
      setTasks(localTasks);
    }
    setLoading(false);
  };

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (user) {
      try {
        const { data, error } = await supabase.from('tasks').insert([{
          task_name: taskData.taskName,
          company: taskData.company,
          duration: taskData.duration,
          timestamp: taskData.timestamp.toISOString(),
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          user_avatar: user.user_metadata?.avatar_url
        }]).select();

        if (error) throw error;
        
        if (data && data[0]) {
          const newTask = {
            id: data[0].id,
            ...taskData,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            user_avatar: user.user_metadata?.avatar_url
          };
          const updated = [newTask, ...tasks];
          setTasks(updated);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (error) {
        console.error(error);
        toast.error('Erro ao salvar na nuvem');
      }
    } else {
      const newTask = { ...taskData, id: Date.now().toString() };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const deleteTask = async (taskId: string) => {
    if (user) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
      } catch (error) {
        console.error(error);
        toast.error('Erro ao deletar na nuvem');
        return;
      }
    }
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    toast.success('Tarefa removida');
  };

  const updateTask = async (taskId: string, updates: { taskName: string, company: string }) => {
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
      } catch (error) {
        console.error(error);
        toast.error('Erro ao atualizar na nuvem');
        return;
      }
    }
    
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    setTasks(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    toast.success('Tarefa atualizada');
  };

  const clearTasks = async () => {
    if (user) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('user_id', user.id);
        if (error) throw error;
      } catch (error) {
        console.error(error);
        toast.error('Erro ao limpar nuvem');
        return;
      }
    }
    setTasks([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.success('Histórico limpo');
  };

  return { tasks, loading, addTask, deleteTask, updateTask, clearTasks, user };
}
