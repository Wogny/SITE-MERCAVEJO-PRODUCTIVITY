import React, { useState, useEffect } from 'react';
import { Menu, X, Clock, BarChart3, History, Settings, LogIn, LogOut, User, Monitor, Calendar } from 'lucide-react';
import { useTimerContext } from '../contexts/TimerContext';
import ThemeToggle from './ThemeToggle';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const { isRunning, time } = useTimerContext(); // CORREÇÃO: Usa o contexto global

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) {
      toast.error('Erro ao conectar com Google');
    }
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

  const navigation = [
    { name: 'Timer', href: '/', icon: Clock },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Histórico', href: '/historico', icon: History },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
    { name: 'Agendas', href: '/agendas', icon: Calendar },
    { name: 'TV Mode', href: '/tv', icon: Monitor },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <header className="bg-white dark:bg-mercavejo-dark border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mercavejo-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Monitor className="w-6 h-6 text-mercavejo-gold" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black text-mercavejo-blue dark:text-white tracking-tighter uppercase">Mercavejo</span>
                <span className="text-[10px] font-bold text-mercavejo-gold tracking-[0.2em] uppercase">Productivity</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {isRunning && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-mercavejo-gold/10 border border-mercavejo-gold/20 rounded-full mr-2 animate-pulse">
                <div className="w-2 h-2 bg-mercavejo-gold rounded-full"></div>
                <span className="text-xs font-mono font-bold text-mercavejo-gold">{formatTime(time)}</span>
              </div>
            )}
            <ThemeToggle />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isTimerActive = isRunning && location.pathname === '/';
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  target={isTimerActive && item.href !== '/' ? "_blank" : undefined}
                  rel={isTimerActive && item.href !== '/' ? "noopener noreferrer" : undefined}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-black transition-all uppercase tracking-wider ${
                    isActive(item.href)
                      ? 'text-white bg-mercavejo-blue shadow-md'
                      : 'text-mercavejo-blue dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm font-bold text-mercavejo-blue dark:text-gray-300">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-mercavejo-gold" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-mercavejo-gold/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-mercavejo-gold" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 bg-mercavejo-blue text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-mercavejo-dark transition-all shadow-md"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-mercavejo-blue dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
              </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-4 pb-6 bg-white dark:bg-mercavejo-dark">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isTimerActive = isRunning && location.pathname === '/';
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    target={isTimerActive && item.href !== '/' ? "_blank" : undefined}
                    rel={isTimerActive && item.href !== '/' ? "noopener noreferrer" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-black uppercase tracking-widest transition-all ${
                      isActive(item.href)
                        ? 'text-white bg-mercavejo-blue'
                        : 'text-mercavejo-blue dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                {user ? (
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair da Conta</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { handleLogin(); setIsMenuOpen(false); }}
                    className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-black uppercase tracking-widest bg-mercavejo-blue text-white shadow-lg"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Entrar com Google</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
