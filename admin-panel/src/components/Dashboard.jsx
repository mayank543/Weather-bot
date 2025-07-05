import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Activity, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  Calendar,
  BarChart3
} from 'lucide-react';

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    recentUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch stats');
      }
    } catch (err) {
      setError('Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
    >
      <div className="flex items-start">
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')} mr-3`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin dashboard. Here's an overview of your bot's performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-blue-600"
          description="All registered users"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={UserCheck}
          color="text-green-600"
          description="Currently active users"
        />
        <StatCard
          title="Blocked Users"
          value={stats.blockedUsers}
          icon={UserX}
          color="text-red-600"
          description="Blocked or suspended users"
        />
        <StatCard
          title="New This Week"
          value={stats.recentUsers}
          icon={TrendingUp}
          color="text-purple-600"
          description="Users joined this week"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickAction
          title="Manage Users"
          description="View, edit, block, or delete user accounts"
          icon={Users}
          color="text-blue-600"
          onClick={() => window.location.hash = '#users'}
        />
        <QuickAction
          title="Bot Settings"
          description="Configure API keys and bot parameters"
          icon={Settings}
          color="text-green-600"
          onClick={() => window.location.hash = '#settings'}
        />
        <QuickAction
          title="Activity Logs"
          description="View recent bot activity and interactions"
          icon={Activity}
          color="text-purple-600"
          onClick={() => console.log('Activity logs coming soon')}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Tracking</h3>
            <p className="text-gray-600">
              Activity logging will be available soon. This will show recent user interactions,
              bot responses, and system events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;