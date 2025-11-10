import React, { useState, useEffect } from 'react';
import useStablePolling from '../../hooks/useStablePolling';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, History, BookOpen, Package } from 'lucide-react';
import { disposalsAPI, pickupsAPI } from '../../services/api';

export default function Dashboard() {
  const [disposals, setDisposals] = useState([]);
  const [pickups, setPickups] = useState([]);
  // Use initialLoading/refreshing so background polls don't show big loader
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = user?.name || user?.fullName || user?.username || '';
  const greetingName = displayName || 'Neighbor';
  const greetingInitial = (displayName || 'U').toString().trim().charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    if (!user?.id) return;
    const storageKey = `userDashboardSeen:${user.id}`;
    const hasSeen = localStorage.getItem(storageKey) === 'true';
    setIsReturningVisitor(hasSeen);
    if (!hasSeen) {
      localStorage.setItem(storageKey, 'true');
    }
  }, [user?.id]);

  // Use centralized polling hook; fetchData will be invoked with { background }
  useStablePolling(async ({ background = false } = {}) => {
    try {
      if (background) setRefreshing(true);
      else setInitialLoading(true);

      const [disposalsResult, pickupsResult] = await Promise.all([
        disposalsAPI.getAll(),
        pickupsAPI.getAll()
      ]);

      // Update disposals only when changed during background refresh
      if (disposalsResult?.success) {
        if (background) {
          try {
            const existing = JSON.stringify(disposals || []);
            const incoming = JSON.stringify(disposalsResult.data || []);
            if (existing !== incoming) setDisposals(disposalsResult.data);
          } catch (e) {
            setDisposals(disposalsResult.data);
          }
        } else {
          setDisposals(disposalsResult.data);
        }
      }

      // Update pickups only when changed during background refresh
      if (pickupsResult?.success) {
        if (background) {
          try {
            const existingP = JSON.stringify(pickups || []);
            const incomingP = JSON.stringify(pickupsResult.data || []);
            if (existingP !== incomingP) setPickups(pickupsResult.data);
          } catch (e) {
            setPickups(pickupsResult.data);
          }
        } else {
          setPickups(pickupsResult.data);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      if (background) setRefreshing(false);
      else setInitialLoading(false);
    }
  }, 10000);

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      const [disposalsResult, pickupsResult] = await Promise.all([
        disposalsAPI.getAll(),
        pickupsAPI.getAll()
      ]);

      if (disposalsResult.success) {
        setDisposals(disposalsResult.data);
      }
      if (pickupsResult.success) {
        setPickups(pickupsResult.data);
      }
      // Debug info to help track mismatches between pickups and disposals
      try {
        // eslint-disable-next-line no-console
        console.debug('Dashboard fetchData results', {
          disposalsCount: disposalsResult?.data?.length,
          pickupsCount: pickupsResult?.data?.length,
          disposalsSample: (disposalsResult?.data || []).slice(0, 3).map(d => ({ id: d.id, status: d.status, pickupRequestId: d.pickupRequestId })),
          pickupsSample: (pickupsResult?.data || []).slice(0, 3).map(p => ({ id: p.id, status: p.status, userId: p.userId }))
        });
      } catch (e) {
        // ignore logging errors
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setInitialLoading(false);
    }
  };

  // Determine if a dashboard card should be visually "active" based on current location
  const location = useLocation();
  const getActiveFor = (filterName) => {
    // Read ?filter= from location.search
    try {
      const params = new URLSearchParams(location.search);
      const f = params.get('filter') || 'all';
      if (filterName === 'all') return f === 'all' || !f;
      if (filterName === 'highRisk') return f === 'highRisk';
      return f === filterName;
    } catch (e) {
      return false;
    }
  };

  const totalDisposed = disposals.length;

  // Align Dashboard pickup count with the Disposal History filter which shows
  // disposals whose `status === 'pickup_requested'`. This ensures the card and
  // the History page display the same number.
  const pickupsRequested = disposals.filter(d => d.status === 'pickup_requested').length;
  const highRiskItems = disposals.filter(d => d.riskLevel === 'HIGH').length;

  const heroStats = [
    { label: 'Total Disposals', value: totalDisposed },
    { label: 'Pickup Requested', value: pickupsRequested },
    { label: 'High Risk Items', value: highRiskItems }
  ];

  // Ensure recent disposals are sorted by createdAt (most recent first) before slicing
  const recentDisposals = [...disposals]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const statusColors = {
    completed: 'success',
    pending_review: 'warning',
    pickup_requested: 'info',
  };

  if (initialLoading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary-blue to-primary-green px-8 py-8 text-white shadow-md">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              <div className="hidden sm:flex w-14 h-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-semibold">
                {greetingInitial}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                  {isReturningVisitor ? 'Welcome back' : 'Welcome'}
                </p>
                <h1 className="text-4xl font-bold leading-tight">
                  {greetingName}
                </h1>
                <p className="mt-2 text-base text-white/85">
                  Track your disposals, follow personalized guidance, and make informed decisions to keep your household safe from expired and unused medicines.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 text-center text-sm sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/15 px-5 py-4">
                  <div className="text-xs uppercase tracking-wide text-white/70">{stat.label}</div>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/user/add-disposal"
          className="card hover:scale-105 transition-transform bg-primary-blue text-white"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <PlusCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Add New Disposal</h3>
              <p className="text-sm text-white text-opacity-90">
                Classify your medicine
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/user/history"
          className={`card hover:scale-105 transition-transform bg-primary-green text-white ${getActiveFor('all') ? 'ring-2 ring-accent-cta' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <History className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">View History</h3>
              <p className="text-sm text-white text-opacity-90">
                See past disposals
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/user/education"
          className="card hover:scale-105 transition-transform bg-accent-cta text-white"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Education Tips</h3>
              <p className="text-sm text-white text-opacity-90">
                Learn safe practices
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-dark dark:text-text-light">
            Recent Disposals
          </h2>
          <Link
            to="/user/history"
            className={`text-sm text-primary-blue dark:text-accent-cta hover:underline font-medium ${getActiveFor('all') ? 'underline font-semibold' : ''}`}
          >
            View All
          </Link>
        </div>

        {recentDisposals.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No disposals yet. Start by adding your first medicine disposal.
            </p>
            <Link to="/user/add-disposal" className="btn-primary inline-block">
              Add Your First Disposal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentDisposals.map((disposal) => (
              <div
                key={disposal.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-text-dark dark:text-text-light mb-1">
                      {disposal.genericName}
                      {disposal.brandName && (
                        <span className="text-gray-600 dark:text-gray-400 font-normal">
                          {' '}
                          ({disposal.brandName})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {disposal.dosageForm} • {disposal.packagingType}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`badge badge-${
                          disposal.riskLevel === 'HIGH'
                            ? 'danger'
                            : disposal.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                        }`}
                      >
                        {disposal.riskLevel} Risk
                      </span>
                      <span className={`badge badge-${statusColors[disposal.status]}`}>
                        {disposal.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {disposal.createdAt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
