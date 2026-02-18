import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBackend } from '@/context/BackendContext';
import {
  LayoutDashboard,
  BarChart3,
  ArrowLeftRight,
  ClipboardList,
  Calendar,
  Users,
  User,
  Settings,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Blocks,
  PiggyBank,
  Building2,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  currentSection: string;
  onNavigate: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'flow' },
  { id: 'analytics', label: 'Budget Analytics', icon: BarChart3, color: 'accent' },
  { id: 'budget', label: 'Budget', icon: PiggyBank, color: 'warning' },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, color: 'flow' },
  { id: 'wallets', label: 'Wallets', icon: Wallet, color: 'success' },
  { id: 'barangays', label: 'Barangays', icon: Building2, color: 'accent' },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck, color: 'warning' },
  { id: 'walletrecovery', label: 'Wallet Recovery', icon: KeyRound, color: 'success' },
  { id: 'audit', label: 'Audit Trail', icon: ClipboardList, color: 'accent' },
  { id: 'events', label: 'Events', icon: Calendar, color: 'warning' },
  { id: 'citizen', label: 'Citizen Portal', icon: Users, color: 'success' },
  { id: 'profile', label: 'Profile', icon: User, color: 'flow' },
];

export function Sidebar({ currentSection, onNavigate, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { securityOverview } = useBackend();

  const pendingApprovals = securityOverview?.pendingHighValueRequests ?? 0;
  const pendingWalletChanges = securityOverview?.pendingWalletChanges ?? 0;

  const getBadgeCount = (id: string): number => {
    if (id === 'approvals') return pendingApprovals;
    if (id === 'walletrecovery') return pendingWalletChanges;
    return 0;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar z-40 transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="relative h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-sidebar-primary rounded-xl blur-lg opacity-40" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-flow flex items-center justify-center">
              <Blocks className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">eSihagBa</h1>
              <p className="text-[10px] text-sidebar-foreground/50 -mt-0.5 font-medium">City Budget Tracker</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {/* Section Label */}
        {!isCollapsed && (
          <p className="px-3 mb-4 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
            Navigation
          </p>
        )}

        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              className={cn(
                "relative w-full flex items-center gap-3 rounded-xl transition-all duration-200",
                isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
              )}
              onClick={() => onNavigate(item.id)}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-flow rounded-r-full" />
              )}

              <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
                isActive
                  ? "bg-sidebar-primary/20"
                  : "bg-transparent group-hover:bg-sidebar-accent/20"
              )}>
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive && "text-sidebar-primary"
                )} />
              </div>

              {!isCollapsed && (
                <span className={cn(
                  "text-sm font-medium animate-fade-in flex-1 text-left",
                  isActive && "text-sidebar-foreground"
                )}>
                  {item.label}
                </span>
              )}

              {/* Pending count badge */}
              {(() => {
                const count = getBadgeCount(item.id);
                if (count <= 0) return null;
                return (
                  <span className={cn(
                    "flex items-center justify-center text-[10px] font-bold text-white rounded-full bg-warning shrink-0",
                    isCollapsed ? "absolute -top-1 -right-1 w-4 h-4" : "w-5 h-5"
                  )}>
                    {count > 9 ? '9+' : count}
                  </span>
                );
              })()}

              {/* Hover glow effect */}
              {isActive && !isCollapsed && getBadgeCount(item.id) === 0 && (
                <div className="absolute right-3 w-2 h-2 rounded-full bg-sidebar-primary animate-glow-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="relative p-3 border-t border-sidebar-border/50">
        {/* Flow accent line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-sidebar-primary/30 to-transparent" />

        <button
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all",
            isCollapsed ? "justify-center p-3" : "px-3 py-2.5"
          )}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <Settings className="h-5 w-5 shrink-0" />
          </div>
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </button>

        {/* Version badge */}
        {!isCollapsed && (
          <div className="mt-3 px-3">
            <div className="flex items-center gap-2 text-[10px] text-sidebar-foreground/30">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span>v1.0.0 — ICP Mainnet</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
