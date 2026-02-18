import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { useBackend } from '@/context/BackendContext';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-loaded section components for code splitting
const Dashboard = React.lazy(() => import('@/components/sections/Dashboard').then(m => ({ default: m.Dashboard })));
const Analytics = React.lazy(() => import('@/components/sections/Analytics').then(m => ({ default: m.Analytics })));
const BudgetManagement = React.lazy(() => import('@/components/sections/BudgetManagement').then(m => ({ default: m.BudgetManagement })));
const Transactions = React.lazy(() => import('@/components/sections/Transactions').then(m => ({ default: m.Transactions })));
const Wallets = React.lazy(() => import('@/components/sections/Wallets').then(m => ({ default: m.Wallets })));
const BarangayManagement = React.lazy(() => import('@/components/sections/BarangayManagement').then(m => ({ default: m.BarangayManagement })));
const HighValueApprovals = React.lazy(() => import('@/components/sections/HighValueApprovals').then(m => ({ default: m.HighValueApprovals })));
const WalletRecovery = React.lazy(() => import('@/components/sections/WalletRecovery').then(m => ({ default: m.WalletRecovery })));
const AuditTrail = React.lazy(() => import('@/components/sections/AuditTrail').then(m => ({ default: m.AuditTrail })));
const Events = React.lazy(() => import('@/components/sections/Events').then(m => ({ default: m.Events })));
const CitizenPortal = React.lazy(() => import('@/components/sections/CitizenPortal').then(m => ({ default: m.CitizenPortal })));
const Profile = React.lazy(() => import('@/components/sections/Profile').then(m => ({ default: m.Profile })));

function SectionFallback() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-5 w-72 rounded-lg" />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

type ConnectionStatus = 'connecting' | 'connected' | 'error';

const SHORTCUT_LABELS: Record<string, string> = {
  '1': 'Dashboard',
  '2': 'Analytics',
  '3': 'Budget',
  '4': 'Transactions',
  '5': 'Wallets',
  '6': 'Barangays',
  '7': 'Approvals',
  '8': 'Wallet Recovery',
  '9': 'Audit Trail',
};

const Index = () => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isConnected, error, refreshStats } = useBackend();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const handleRefresh = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts({
    onNavigate: setCurrentSection,
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else if (error) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('connecting');
    }
  }, [isConnected, error]);

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'budget':
        return <BudgetManagement />;
      case 'transactions':
        return <Transactions />;
      case 'wallets':
        return <Wallets />;
      case 'barangays':
        return <BarangayManagement />;
      case 'approvals':
        return <HighValueApprovals />;
      case 'walletrecovery':
        return <WalletRecovery />;
      case 'audit':
        return <AuditTrail />;
      case 'events':
        return <Events />;
      case 'citizen':
        return <CitizenPortal />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle background gradient mesh */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none opacity-50" />

      <Sidebar
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header
        connectionStatus={connectionStatus}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main
        className={cn(
          "relative pt-24 pb-12 px-6 lg:px-8 transition-all duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-64"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<SectionFallback />}>
            {renderSection()}
          </Suspense>
        </div>
      </main>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                ESC
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(shortcuts).map(([key]) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">{SHORTCUT_LABELS[key] || key}</span>
                  <kbd className="px-2 py-1 rounded-lg bg-muted text-xs font-mono font-semibold">{key}</kbd>
                </div>
              ))}
              <div className="border-t border-border mt-3 pt-3 space-y-2">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Refresh data</span>
                  <kbd className="px-2 py-1 rounded-lg bg-muted text-xs font-mono font-semibold">r</kbd>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Toggle this help</span>
                  <kbd className="px-2 py-1 rounded-lg bg-muted text-xs font-mono font-semibold">?</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
