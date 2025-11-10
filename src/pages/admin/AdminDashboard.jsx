import React, { useEffect, useState } from 'react';
import { Users, Heart, Package, TrendingUp, UserCheck, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize various possible backend shapes into a consistent frontend shape
  const normalizeStats = (raw) => {
    if (!raw) return null;
    // sometimes backend returns { data: { ... } } or { data: { stats: { ... } } }
    const outer = raw.data || raw;
    const src = outer.stats || outer.data || outer;

    const total_users = src.total_users ?? src.totalUsers ?? src.users_count ?? 0;
    const total_chws = src.total_chws ?? src.totalChws ?? src.chw_count ?? 0;
    const total_disposals = src.total_disposals ?? src.totalDisposals ?? src.disposals_count ?? 0;
  const completed_this_month = src.completed_this_month ?? src.completedThisMonth ?? src.completed ?? 0;
    const previous_month = src.previous_month ?? src.previousMonth ?? 0;

    // Risk distribution: allow keys in any case
    const rawRisk = src.risk_distribution || src.riskDistribution || src.risk || {};
    const risk_distribution = {};
    Object.keys(rawRisk).forEach((k) => {
      if (k == null) return;
      risk_distribution[String(k).toUpperCase()] = rawRisk[k] ?? 0;
    });

    // Monthly trend: accept multiple shapes
    const monthly_trend = Array.isArray(src.monthly_trend)
      ? src.monthly_trend
      : Array.isArray(src.monthlyTrend)
      ? src.monthlyTrend
      : [];

    const top_medicines = Array.isArray(src.top_medicines)
      ? src.top_medicines
      : Array.isArray(src.topMedicines)
      ? src.topMedicines
      : [];

    return {
      ...src,
      total_users,
      total_chws,
      total_disposals,
      completed_this_month,
      previous_month,
      risk_distribution,
      monthly_trend,
      top_medicines
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Extracted fetchData so we can refresh manually
  async function fetchData() {
    try {
      setLoading(true);
      const [statsResult, pendingResult] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingUsers()
      ]);

      if (statsResult && statsResult.success) {
        setStats(normalizeStats(statsResult.data));
      }

      if (pendingResult && pendingResult.success) {
        setPendingUsers(pendingResult.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">Failed to load dashboard data</p>
      </div>
    );
  }

  // Prepare risk distribution safely (keys normalized to uppercase in normalizeStats)
  const riskDist = (stats && stats.risk_distribution) || { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const riskData = [
    { name: 'Low Risk', value: riskDist.LOW || 0, color: '#2E8B57' },
    { name: 'Medium Risk', value: riskDist.MEDIUM || 0, color: '#F59E0B' },
    { name: 'High Risk', value: riskDist.HIGH || 0, color: '#E03E2D' },
  ];

  // Monthly trend: use last 5 months of backend data (backend should return an ordered array)
  // Build a 3-month window ending with current month and fill zeros for missing months
  const buildLastNMonths = (n) => {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      months.push({ label, year: d.getFullYear(), monthIndex: d.getMonth() });
    }
    return months;
  };

  const last3 = buildLastNMonths(3);
  const backendTrend = (stats && Array.isArray(stats.monthly_trend)) ? stats.monthly_trend : [];
  // backendTrend expected items like { month: 'YYYY-MM' or 'Mon' or monthIndex: number, count: number }
  const monthlyTrend = last3.map((m) => {
    const found = backendTrend.find((bt) => {
      if (!bt) return false;
      const candidate = bt.month ?? bt.label ?? bt.month_label ?? bt.month_label_short ?? bt;

      // If backend uses YYYY-MM format
      if (typeof candidate === 'string' && /^\d{4}-\d{2}$/.test(candidate)) {
        const [y, mm] = candidate.split('-');
        const monthLabel = new Date(Number(y), Number(mm) - 1, 1).toLocaleString('default', { month: 'short' });
        return monthLabel === m.label;
      }

      // If candidate is a string label like 'Sep' or 'September'
      if (typeof candidate === 'string') {
        try {
          const parsed = new Date(candidate);
          if (!isNaN(parsed)) {
            const parsedLabel = parsed.toLocaleString('default', { month: 'short' });
            if (parsedLabel === m.label) return true;
          }
        } catch (e) { /* ignore */ }
        // direct compare
        if (candidate === m.label || candidate.startsWith(m.label)) return true;
      }

      // If backend provides numeric month index (1-12)
      const monthIndex = bt.monthIndex ?? bt.month_index ?? bt.m;
      if (typeof monthIndex === 'number') {
        return monthIndex === (m.monthIndex + 1) || monthIndex === m.monthIndex;
      }

      return false;
    });

    const count = found ? (found.count ?? found.value ?? found.total ?? 0) : 0;
    return { month: m.label, count };
  });

  // Top medicines from backend
  const topMedicines = (stats && Array.isArray(stats.top_medicines)) ? stats.top_medicines : (stats && Array.isArray(stats.topMedicines) ? stats.topMedicines : []);

  // Determine completed this month value consistently with monthlyTrend when possible
  const currentMonthLabel = last3[last3.length - 1].label;
  const monthlyEntryForCurrent = monthlyTrend.find((m) => m.month === currentMonthLabel);
  const completedThisMonth = (stats && (stats.completed_this_month ?? stats.completed ?? null)) ?? (monthlyEntryForCurrent ? monthlyEntryForCurrent.count : 0);

  // Compute trend percentage if previous_month_count provided, otherwise omit
  const computeTrend = () => {
    const current = completedThisMonth || 0;
    const previous = stats.previous_month || 0;
    if (!previous) return '';
    const pct = ((current - previous) / Math.max(1, previous)) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(0)}% this month`;
  };

  const trendText = computeTrend();

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
         Admin Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-600 dark:text-gray-400">
            Monitor community system-wide medicine disposal activities
          </p>
          <button onClick={fetchData} className="btn-outline ml-auto">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total_users || 0}
          color="blue"
        />
        <StatCard
          icon={Heart}
          label="Community Health Workers"
          value={stats.total_chws || 0}
          color="green"
        />
        <Link to="/admin/disposals" className="block">
          <StatCard
            icon={Package}
            label="Total Disposals"
            value={stats.total_disposals || 0}
            color="blue"
          />
        </Link>
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={completedThisMonth || 0}
          color="green"
          trend={trendText}
        />
      </div>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <div className="card mb-8 border-l-4 border-warning">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pending User Approvals</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
            </div>
            <Link
              to="/admin/users"
              className="btn-primary text-sm"
            >
              <UserCheck className="w-4 h-4" />
              Manage Users
            </Link>
          </div>
          <div className="space-y-2">
            {pendingUsers.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-xs font-medium">
                  {user.role.toUpperCase()}
                </span>
              </div>
            ))}
            {pendingUsers.length > 3 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center pt-2">
                +{pendingUsers.length - 3} more pending approval
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Monthly Disposal Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
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
          {topMedicines.length === 0 ? (
            <div className="p-4 text-gray-600">No data available</div>
          ) : (
            topMedicines.map((med, index) => {
              const maxCount = topMedicines[0]?.count || 1;
              const widthPercent = maxCount ? (med.count / maxCount) * 100 : 0;
              return (
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
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-16 text-right">
                      {med.count}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
