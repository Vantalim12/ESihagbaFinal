import { useNavigate } from 'react-router-dom';
import { Bell, Search, Wifi, WifiOff, Loader2, LogOut, ChevronDown, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useBackend } from '@/context/BackendContext';

interface HeaderProps {
  connectionStatus: 'connecting' | 'connected' | 'error';
  sidebarCollapsed: boolean;
}

export function Header({ connectionStatus, sidebarCollapsed }: HeaderProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { principal } = useBackend();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const displayPrincipal = principal
    ? principal.length > 12
      ? `${principal.slice(0, 6)}...${principal.slice(-6)}`
      : principal
    : 'User';

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 h-16 bg-background/70 backdrop-blur-xl border-b border-border/50 z-30 transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-64"
      )}
    >
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="h-full flex items-center justify-between px-6">
        {/* Search */}
        <div className="relative w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-flow" />
          <Input 
            placeholder="Search transactions, wallets..." 
            className="pl-11 h-11 bg-muted/30 border-transparent rounded-xl focus:border-flow/30 focus:bg-background focus:ring-2 focus:ring-flow/10 transition-all"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-6 items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-2 font-mono text-[10px] text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center">
            {connectionStatus === 'connecting' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
                <Loader2 className="h-3.5 w-3.5 text-warning animate-spin" />
                <span className="text-xs font-medium text-warning">Connecting</span>
              </div>
            )}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <div className="relative">
                  <Wifi className="h-3.5 w-3.5 text-success" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-pulse" />
                </div>
                <span className="text-xs font-medium text-success hidden md:inline">Connected to ICP</span>
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                <WifiOff className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs font-medium text-destructive">Offline</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border/50" />

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-10 w-10 rounded-xl hover:bg-muted/50"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-flow rounded-full" />
          </Button>

          {/* User menu with logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-xl hover:bg-muted/50 px-3 py-2 transition-all group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-flow rounded-full opacity-0 group-hover:opacity-50 blur transition-opacity" />
                  <div className="relative h-9 w-9 rounded-full bg-gradient-flow flex items-center justify-center text-flow-foreground font-bold text-sm">
                    {displayPrincipal.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-foreground leading-tight">{displayPrincipal}</p>
                  <p className="text-[11px] text-muted-foreground">ICP Identity</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
              {/* User Info Header */}
              <div className="px-2 py-3 mb-2 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold">{displayPrincipal}</p>
                <p className="text-xs text-muted-foreground">Connected via Internet Identity</p>
              </div>
              
              <DropdownMenuItem className="gap-3 py-2.5 rounded-lg cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-2.5 rounded-lg cursor-pointer">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="gap-3 py-2.5 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
