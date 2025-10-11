import React, { useEffect, useState } from 'react';
import { Users, Heart, Package, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../../components/StatCard';
import { getSystemStats } from '../../utils/apiMocks';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getSystemStats();
      if (result.success) {
        setStats(result.data);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  const riskData = [
    { name: 'Low Risk', value: stats.risk_distribution.LOW, color: '#2E8B57' },
    { name: 'Medium Risk', value: stats.risk_distribution.MEDIUM, color: '#F59E0B' },
    { name: 'High Risk', value: stats.risk_distribution.HIGH, color: '#E03E2D' },
  ];

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor system-wide medicine disposal activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total_users}
          color="blue"
          trend="+12% this month"
        />
        <StatCard
          icon={Heart}
          label="Community Health Workers"
          value={stats.total_chws}
          color="green"
        />
        <StatCard
          icon={Package}
          label="Total Disposals"
          value={stats.total_disposals}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={stats.completed_this_month}
          color="green"
          trend="+8% from last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Monthly Disposal Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0B6FA7" name="Disposals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Risk Level Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Top Disposed Medicines</h2>
        <div className="space-y-3">
          {stats.top_medicines.map((med, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <span className="font-medium">{med.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-green h-2 rounded-full"
                    style={{ width: `${(med.count / stats.top_medicines[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-16 text-right">
                  {med.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
