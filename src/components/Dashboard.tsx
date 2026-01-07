import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, Building2, CheckCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  taskName: string;
  company: string;
  duration: number;
  timestamp: Date;
}

interface DashboardProps {
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const todayTasks = tasks.filter(task => 
    format(task.timestamp, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  const weekTasks = tasks.filter(task =>
    isWithinInterval(task.timestamp, { start: weekStart, end: weekEnd })
  );

  const companyData = tasks.reduce((acc, task) => {
    acc[task.company] = (acc[task.company] || 0) + task.duration;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(companyData).map(([company, duration]) => ({
    name: company,
    value: duration,
    hours: Math.round(duration / 3600 * 10) / 10
  }));

  const taskFrequency = tasks.reduce((acc, task) => {
    acc[task.taskName] = (acc[task.taskName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTasks = Object.entries(taskFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([task, count]) => ({ task, count }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const totalTodayTime = todayTasks.reduce((sum, task) => sum + task.duration, 0);
  const totalWeekTime = weekTasks.reduce((sum, task) => sum + task.duration, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hoje</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(totalTodayTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(totalWeekTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Building2 className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Empresas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.keys(companyData).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tarefas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tasks.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Time Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempo por Empresa</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, hours }) => `${name}: ${hours}h`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatDuration(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </div>

        {/* Top Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarefas Mais Frequentes</h3>
          {topTasks.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTasks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="task" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.slice(-5).reverse().map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{task.taskName}</p>
                  <p className="text-sm text-gray-600">{task.company}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-blue-600">{formatDuration(task.duration)}</p>
                  <p className="text-xs text-gray-500">
                    {format(task.timestamp, 'dd/MM HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma atividade registrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;