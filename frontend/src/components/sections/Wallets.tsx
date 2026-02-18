import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBackend } from '@/context/BackendContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Wallet as WalletIcon,
  Copy,
  ExternalLink,
  ArrowUpRight,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Wallet } from '@/types';
import { CANISTER_ID } from '@/lib/icp';

const ICP_EXPLORER_CANISTER_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

const walletTypeIcons: Record<string, string> = {
  InternetIdentity: '🔐',
  Plug: '🔌',
  Stoic: '🏛️',
  Ledger: '📟',
  Custom: '⚙️',
};

export function Wallets() {
  const { 
    wallets: backendWallets, 
    isConnected, 
    isLoading,
    fetchWallets,
    createWallet,
    error: backendError 
  } = useBackend();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    address: '',
    walletType: 'InternetIdentity',
    label: ''
  });

  // Fetch wallets on mount when connected
  useEffect(() => {
    if (isConnected) {
      fetchWallets();
    }
  }, [isConnected, fetchWallets]);

  // Use backend data only - no mock data fallback
  const wallets: Wallet[] = backendWallets;

  const filteredWallets = wallets.filter(wallet => 
    wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wallet.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWallets();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Wallet list updated",
    });
  };

  const handleCreateWallet = async () => {
    if (!formData.address) {
      toast({
        title: "Validation Error",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const result = await createWallet(
      formData.address,
      formData.walletType,
      formData.label || undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Wallet Created",
        description: (
          <span className="flex flex-col gap-2">
            <span>Your wallet has been registered on the blockchain.</span>
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
      setIsDialogOpen(false);
      setFormData({
        address: '',
        walletType: 'InternetIdentity',
        label: ''
      });
    } else {
      toast({
        title: "Creation Failed",
        description: result.error || "Failed to create wallet",
        variant: "destructive",
      });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Warning */}
      {!isConnected && (
        <Card className="border-warning bg-warning/5 animate-fade-in">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Not Connected</p>
              <p className="text-xs text-muted-foreground">
                {backendError || "Connect to the backend to view and manage wallets."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-muted-foreground">
            {isConnected 
              ? `${wallets.length} wallet${wallets.length !== 1 ? 's' : ''} connected`
              : 'Manage connected blockchain wallets'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {isConnected && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent" className="gap-2" disabled={!isConnected}>
                <Plus className="h-4 w-4" />
                Create Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Create New Wallet</DialogTitle>
                <DialogDescription>
                  Connect a new wallet to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="walletAddress">Wallet Address *</Label>
                  <Input 
                    id="walletAddress" 
                    placeholder="Enter wallet address..."
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="walletType">Wallet Type</Label>
                  <Select 
                    value={formData.walletType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, walletType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="InternetIdentity">🔐 Internet Identity</SelectItem>
                      <SelectItem value="Plug">🔌 Plug Wallet</SelectItem>
                      <SelectItem value="Stoic">🏛️ Stoic Wallet</SelectItem>
                      <SelectItem value="Ledger">📟 Ledger</SelectItem>
                      <SelectItem value="Custom">⚙️ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="walletLabel">Label (Optional)</Label>
                  <Input 
                    id="walletLabel" 
                    placeholder="e.g., City Treasury"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="accent" 
                  onClick={handleCreateWallet}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Wallet'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="animate-slide-up">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by address or label..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Wallets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWallets.map((wallet, index) => (
          <Card 
            key={wallet.id}
            className="hover:shadow-md transition-all animate-slide-up group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                    {walletTypeIcons[wallet.walletType] || '💰'}
                  </div>
                  <div>
                    <h3 className="font-semibold">{wallet.label || 'Unnamed Wallet'}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {wallet.walletType}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <code className="text-xs font-mono flex-1 truncate">{wallet.address}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0"
                    onClick={() => copyToClipboard(wallet.address)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Transactions:</span>
                    <span className="font-medium">{wallet.totalTransactions}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last:</span>
                    <span className="font-medium">
                      {wallet.lastTransactionAt 
                        ? new Date(wallet.lastTransactionAt).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Badge variant={wallet.active ? 'confirmed' : 'secondary'}>
                  {wallet.active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(wallet.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWallets.length === 0 && (
        <Card className="animate-fade-in">
          <CardContent className="py-12 text-center">
            <WalletIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {!isConnected
                ? 'Connect to the backend to view wallets.'
                : searchQuery 
                  ? 'No wallets found matching your search.' 
                  : 'No wallets yet. Create your first wallet to get started.'
              }
            </p>
            {isConnected && !searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Wallet
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
