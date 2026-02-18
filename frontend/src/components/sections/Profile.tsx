import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useBackend } from '@/context/BackendContext';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Shield,
  Mail,
  Calendar,
  Key,
  Copy,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  ExternalLink
} from 'lucide-react';
import { CANISTER_ID } from '@/lib/icp';
import { cn } from '@/lib/utils';

const ICP_EXPLORER_CANISTER_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

export function Profile() {
  const {
    principal,
    isConnected,
    isLoading,
    systemStats,
    registerUser,
    error: backendError
  } = useBackend();
  const { toast } = useToast();

  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Principal ID copied to clipboard",
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    const result = await registerUser(
      formData.role as 'SuperAdmin' | 'LGU' | 'BarangayTreasury' | 'Auditor',
      formData.name,
      formData.email
    );

    setIsRegistering(false);

    if (result.success) {
      toast({
        title: "Registration Successful",
        description: (
          <span className="flex flex-col gap-2">
            <span>Your account has been created on the blockchain.</span>
            <a
              href={ICP_EXPLORER_CANISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80 font-medium text-sm underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Audit on ICP Explorer
            </a>
          </span>
        ),
      });
      setFormData({ name: '', email: '', role: '' });
    } else {
      toast({
        title: "Registration Failed",
        description: result.error || "Failed to register user",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'default';
      case 'LGU': return 'default';
      case 'BarangayTreasury': return 'secondary';
      case 'Auditor': return 'secondary';
      default: return 'outline';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Connection Status Card */}
      <Card className={cn(
        "animate-slide-up",
        isConnected ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center",
              isConnected ? "bg-success/20" : "bg-warning/20"
            )}>
              {isConnected ? (
                <Wifi className="h-7 w-7 text-success" />
              ) : (
                <WifiOff className="h-7 w-7 text-warning" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">
                  {isConnected ? 'Connected to ICP Blockchain' : 'Offline Mode'}
                </h3>
                <Badge variant={isConnected ? 'confirmed' : 'pending'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? `Backend canister is operational. ${systemStats ? `${Number(systemStats.totalUsers)} users registered.` : ''}`
                  : backendError || 'Unable to connect to backend. Some features are disabled.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Principal ID Card */}
      <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5 text-accent" />
            ICP Identity
          </CardTitle>
          <CardDescription>
            Your Principal ID on the Internet Computer blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
            <code className="text-sm font-mono flex-1 break-all">
              {principal || 'Not connected - Principal ID unavailable'}
            </code>
            {principal && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(principal)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isConnected && (
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Identity verified on ICP blockchain</span>
              </div>
              <a
                href={ICP_EXPLORER_CANISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View backend canister on ICP Explorer
              </a>
            </div>
          )}
          {!isConnected && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span>Connect to ICP network to view your Principal ID</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Form */}
      <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            User Registration
          </CardTitle>
          <CardDescription>
            Register your identity to access system features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newName">Full Name *</Label>
                <Input
                  id="newName"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isConnected}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email Address *</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isConnected}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newRole">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                disabled={!isConnected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BarangayTreasury">Barangay Treasury - Budget management</SelectItem>
                  {systemStats && Number(systemStats.totalUsers) === 0 && (
                    <SelectItem value="SuperAdmin">Super Admin - Full access (First user only)</SelectItem>
                  )}
                  <SelectItem value="LGU">LGU - Local Government Unit</SelectItem>
                  <SelectItem value="Auditor">Auditor - Read-only access</SelectItem>
                </SelectContent>
              </Select>
              {systemStats && Number(systemStats.totalUsers) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  SuperAdmin role is only available for the first user. Contact an administrator to create additional admin accounts.
                </p>
              )}
            </div>

            {!isConnected && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Connect to the ICP network to register your account
                </p>
              </div>
            )}

            <Button
              variant="accent"
              type="submit"
              className="w-full md:w-auto"
              disabled={!isConnected || isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Register Account'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
          <CardDescription>Overview of access levels for each role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                role: 'SuperAdmin',
                description: 'Full system access',
                permissions: ['Manage users', 'Manage barangays', 'Budget allocation', 'System administration']
              },
              {
                role: 'LGU',
                description: 'Local Government Unit',
                permissions: ['Allocate budgets', 'Manage barangays', 'View all data', 'Create events']
              },
              {
                role: 'BarangayTreasury',
                description: 'Barangay budget management',
                permissions: ['Create transactions', 'View own data', 'Create wallets', 'Track spending']
              },
              {
                role: 'Auditor',
                description: 'Read-only access',
                permissions: ['View all transactions', 'View all wallets', 'Cannot create', 'Cannot modify']
              }
            ].map((roleInfo) => (
              <div
                key={roleInfo.role}
                className="p-4 rounded-lg border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getRoleBadgeVariant(roleInfo.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {roleInfo.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{roleInfo.description}</p>
                <ul className="space-y-1">
                  {roleInfo.permissions.map((perm, i) => (
                    <li key={i} className="text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Stats (visible when connected) */}
      {isConnected && systemStats && (
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-lg">System Statistics</CardTitle>
            <CardDescription>Current state of the eSihagBa blockchain system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{Number(systemStats.totalUsers)}</p>
                <p className="text-xs text-muted-foreground">Registered Users</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{Number(systemStats.totalWallets)}</p>
                <p className="text-xs text-muted-foreground">Wallets</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{Number(systemStats.totalTransactions)}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{Number(systemStats.pendingTransactions)}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
