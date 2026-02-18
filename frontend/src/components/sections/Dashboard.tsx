import { useEffect } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { BudgetChart } from '@/components/dashboard/BudgetChart';
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { useBackend } from '@/context/BackendContext';
import { formatTokenAmount } from '@/lib/dataTransformers';
import { 
  Wallet, 
  ArrowLeftRight, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileSearch
} from 'lucide-react';

export function Dashboard() {
  const { systemStats, isConnected, isLoading, error: backendError, securityOverview, fetchSecurityOverview } = useBackend();

  useEffect(() => {
    if (isConnected) {
      fetchSecurityOverview();
    }
  }, [isConnected, fetchSecurityOverview]);

  // Helper to safely get stats
  const getStat = (key: keyof NonNullable<typeof systemStats>): bigint => {
    if (!systemStats) return 0n;
    return systemStats[key] ?? 0n;
  };

  // Calculate utilization based on confirmed vs total transactions
  const totalTx = Number(getStat('totalTransactions'));
  const confirmedTx = Number(getStat('confirmedTransactions'));
  const utilizationPercent = totalTx > 0 ? ((confirmedTx / totalTx) * 100).toFixed(1) : '0';

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-fade-in space-y-2">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-5 w-72 rounded-lg" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Connection Warning */}
      {!isConnected && (
        <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-warning/5 p-4 animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warning via-warning/50 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Offline Mode</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {backendError || "Not connected to the ICP backend. Live data unavailable."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="animate-fade-in space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {isConnected && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-flow/10 text-flow text-xs font-medium">
              <Zap className="w-3 h-3" />
              <span>Live</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          {isConnected 
            ? 'Real-time data from eSihagBa blockchain' 
            : 'Connect to the backend to view live data.'
          }
        </p>
      </div>

      {/* Stats Grid - Primary Metrics */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Volume"
          value={formatTokenAmount(Number(getStat('totalVolume')), 'ICP') + ' ICP'}
          subtitle="Confirmed transactions"
          icon={Wallet}
          variant="flow"
          delay={0}
        />
        <StatsCard
          title="Transaction Rate"
          value={`${utilizationPercent}%`}
          subtitle={`${confirmedTx} of ${totalTx} confirmed`}
          icon={TrendingUp}
          trend={confirmedTx > 0 ? { value: parseFloat(utilizationPercent), isPositive: true } : undefined}
          variant="accent"
          delay={50}
        />
        <StatsCard
          title="Total Transactions"
          value={Number(getStat('totalTransactions')).toLocaleString()}
          icon={ArrowLeftRight}
          delay={100}
        />
        <StatsCard
          title="Active Users"
          value={Number(getStat('totalUsers')).toLocaleString()}
          subtitle={`${Number(getStat('totalWallets'))} wallets`}
          icon={Users}
          variant="success"
          delay={150}
        />
      </div>

      {/* Transaction Status Row */}
      <div className="grid gap-5 md:grid-cols-3">
        <StatsCard
          title="Pending Transactions"
          value={Number(getStat('pendingTransactions')).toLocaleString()}
          icon={Clock}
          variant="warning"
          delay={200}
        />
        <StatsCard
          title="Confirmed Transactions"
          value={Number(getStat('confirmedTransactions')).toLocaleString()}
          icon={CheckCircle2}
          variant="success"
          delay={250}
        />
        <StatsCard
          title="Failed Transactions"
          value={Number(getStat('failedTransactions')).toLocaleString()}
          icon={XCircle}
          variant={Number(getStat('failedTransactions')) > 0 ? 'default' : 'success'}
          delay={300}
        />
      </div>

      {/* Security Metrics Row */}
      {isConnected && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-flow" />
            Security Overview
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Pending Approvals"
              value={(securityOverview?.pendingHighValueRequests ?? 0).toLocaleString()}
              subtitle="High-value requests awaiting multi-sig"
              icon={ShieldAlert}
              variant={(securityOverview?.pendingHighValueRequests ?? 0) > 0 ? 'warning' : 'success'}
              delay={350}
            />
            <StatsCard
              title="Wallet Changes"
              value={(securityOverview?.pendingWalletChanges ?? 0).toLocaleString()}
              subtitle="Pending wallet recovery requests"
              icon={KeyRound}
              variant={(securityOverview?.pendingWalletChanges ?? 0) > 0 ? 'warning' : 'success'}
              delay={400}
            />
            <StatsCard
              title="Security Score"
              value={
                (securityOverview?.pendingHighValueRequests ?? 0) === 0 &&
                (securityOverview?.pendingWalletChanges ?? 0) === 0
                  ? 'Healthy'
                  : 'Attention'
              }
              subtitle={
                (securityOverview?.pendingHighValueRequests ?? 0) === 0 &&
                (securityOverview?.pendingWalletChanges ?? 0) === 0
                  ? 'No pending security items'
                  : `${(securityOverview?.pendingHighValueRequests ?? 0) + (securityOverview?.pendingWalletChanges ?? 0)} items need review`
              }
              icon={ShieldCheck}
              variant={
                (securityOverview?.pendingHighValueRequests ?? 0) === 0 &&
                (securityOverview?.pendingWalletChanges ?? 0) === 0
                  ? 'success'
                  : 'warning'
              }
              delay={450}
            />
            <StatsCard
              title="Recent Audit"
              value={(securityOverview?.recentAuditCount ?? 0).toLocaleString()}
              subtitle="Audit log entries in last 24h"
              icon={FileSearch}
              delay={500}
            />
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetChart />
        <CategoryDistribution />
      </div>

      {/* Activity and Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <UpcomingEvents />
      </div>
    </div>
  );
}
