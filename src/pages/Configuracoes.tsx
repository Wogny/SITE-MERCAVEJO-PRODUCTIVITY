import React from 'react';
import Header from '../components/Header';
import { Settings, User, Bell, Download, Trash2, LogIn, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTasks } from '../hooks/useTasks';
import { supabase } from '../lib/supabase';

export default function Configuracoes() {
  const { tasks, clearTasks, user } = useTasks();

  const handleClearData = async () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      await clearTasks();
    }
  };

  const handleExportData = () => {
    if (tasks.length === 0) {
      toast.warning('Nenhum dado para exportar');
      return;
    }

    const blob = new Blob([JSON.stringify(tasks)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mercavejo-backup-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Backup exportado com sucesso!');
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) toast.error('Erro ao conectar com Google');
  };

  const handleEmailLogin = async () => {
    const email = window.prompt('Digite seu email para o link de login:');
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        toast.error('Erro ao enviar link de login');
      } else {
        toast.success('Link de login enviado para seu email!');
      }
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair');
    } else {
      toast.success('Sessão encerrada');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Gerencie suas preferências e dados</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Perfil</h2>
            </div>
            <div className="space-y-4">
              {user ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">Logado como:</p>
                  <p className="text-lg text-blue-900">{user.email}</p>
                  <button 
                    onClick={handleLogout}
                    className="mt-4 flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Encerrar Sessão</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">Você não está logado. Seus dados estão sendo salvos apenas localmente.</p>
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={handleGoogleLogin}
                      className="flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                      <span>Entrar com Google</span>
                    </button>
                    <button 
                      onClick={handleEmailLogin}
                      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Entrar com Email</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Management Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Dados</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <p className="font-medium text-gray-900">Exportar dados</p>
                  <p className="text-sm text-gray-600">Faça backup dos seus dados em formato JSON</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <p className="font-medium text-gray-900">Limpar todos os dados</p>
                  <p className="text-sm text-gray-600">Remove permanentemente todos os registros {user ? 'da nuvem e localmente' : 'localmente'}</p>
                </div>
                <button
                  onClick={handleClearData}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Dados</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
