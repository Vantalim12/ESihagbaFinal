import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useBackend } from '@/context/BackendContext';
import { useToast } from '@/hooks/use-toast';
import { formatTokenAmount } from '@/lib/dataTransformers';
import { 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransactionStatus, Transaction } from '@/types';
import { CANISTER_ID } from '@/lib/icp';

const BUDGET_CATEGORIES = [
  'Infrastructure',
  'Healthcare',
  'Education',
  'SocialWelfare',
  'PublicSafety',
  'Administration',
  'Environment',
  'Other',
] as const;

const ICP_EXPLORER_CANISTER_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

export function Transactions() {
  const { 
    transactions: backendTransactions, 
    isConnected, 
    isLoading,
    pagination,
    budgets,
    fetchTransactions,
    fetchBudgets,
    recordTransaction,
    confirmTransaction,
    failTransaction,
    error: backendError 
  } = useBackend();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingTxId, setProcessingTxId] = useState<number | null>(null);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const [failReason, setFailReason] = useState('');
  const pageSize = 20;
  
  // Form state
  const [formData, setFormData] = useState({
    fromAddress: '',
    toAddress: '',
    amount: '',
    tokenType: 'ICP',
    transactionType: 'Transfer',
    memo: '',
    category: '' as string,
    budgetId: '' as string,
  });

  // Fetch budgets when dialog opens
  useEffect(() => {
    if (isDialogOpen && isConnected) {
      const currentYear = new Date().getFullYear();
      fetchBudgets(currentYear);
    }
  }, [isDialogOpen, isConnected, fetchBudgets]);

  // Use backend data only - no mock data fallback
  const transactions: Transaction[] = backendTransactions;

  const filteredTransactions = transactions.filter(tx => {
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesSearch = 
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.memo?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatAmount = (value: number, tokenType: string) => {
    return formatTokenAmount(value, tokenType as any);
  };

  const getStatusVariant = (status: TransactionStatus) => {
    switch (status) {
      case 'Confirmed': return 'confirmed';
      case 'Pending': return 'pending';
      case 'Failed': return 'failed';
      default: return 'secondary';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Hash copied to clipboard",
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions(currentPage, pageSize);
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Transaction list updated",
    });
  };

  const handlePageChange = async (newPage: number) => {
    setIsRefreshing(true);
    setCurrentPage(newPage);
    await fetchTransactions(newPage, pageSize);
    setIsRefreshing(false);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  const handleSubmitTransaction = async () => {
    if (!formData.fromAddress || !formData.toAddress || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const result = await recordTransaction(
      formData.fromAddress,
      formData.toAddress,
      amount,
      formData.tokenType,
      formData.transactionType,
      formData.memo || undefined,
      formData.budgetId && formData.budgetId !== '_none' ? Number(formData.budgetId) : undefined,
      formData.category && formData.category !== '_none' ? formData.category : undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Transaction Recorded",
        description: (
          <span className="flex flex-col gap-2">
            <span>Your transaction has been submitted to the blockchain.</span>
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
        fromAddress: '',
        toAddress: '',
        amount: '',
        tokenType: 'ICP',
        transactionType: 'Transfer',
        memo: '',
        category: '',
        budgetId: '',
      });
    } else {
      toast({
        title: "Transaction Failed",
        description: result.error || "Failed to record transaction",
        variant: "destructive",
      });
    }
  };

  const handleConfirmTransaction = async (txId: number) => {
    setProcessingTxId(txId);
    
    // Use a default block height (in production, this would come from actual blockchain)
    const result = await confirmTransaction(txId, 0);
    
    setProcessingTxId(null);

    if (result.success) {
      toast({
        title: "Transaction Confirmed",
        description: (
          <span className="flex flex-col gap-2">
            <span>Transaction status updated to Confirmed.</span>
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
    } else {
      toast({
        title: "Confirmation Failed",
        description: result.error || "Failed to confirm transaction. You may not have permission.",
        variant: "destructive",
      });
    }
  };

  const handleFailTransaction = async () => {
    if (!selectedTxId || !failReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for failure",
        variant: "destructive",
      });
      return;
    }

    setProcessingTxId(selectedTxId);
    
    const result = await failTransaction(selectedTxId, failReason);
    
    setProcessingTxId(null);
    setFailDialogOpen(false);
    setSelectedTxId(null);
    setFailReason('');

    if (result.success) {
      toast({
        title: "Transaction Failed",
        description: (
          <span className="flex flex-col gap-2">
            <span>Transaction status updated to Failed.</span>
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
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update transaction. You may not have permission.",
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
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-16 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
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
                {backendError || "Connect to the backend to view and manage transactions."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            {isConnected 
              ? `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} on blockchain`
              : 'View and manage all budget transactions'
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
                Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Record New Transaction</DialogTitle>
                <DialogDescription>
                  Create a new budget transaction on the blockchain.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fromAddress">From Address *</Label>
                  <Input 
                    id="fromAddress" 
                    placeholder="Enter sender address..." 
                    value={formData.fromAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, fromAddress: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="toAddress">To Address *</Label>
                  <Input 
                    id="toAddress" 
                    placeholder="Enter recipient address..."
                    value={formData.toAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, toAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (ICP) *</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="0.00"
                      step="0.0001"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tokenType">Token Type</Label>
                    <Select 
                      value={formData.tokenType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tokenType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICP">ICP</SelectItem>
                        <SelectItem value="ICRC1">ICRC-1</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select 
                    value={formData.transactionType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Mint">Mint</SelectItem>
                      <SelectItem value="Burn">Burn</SelectItem>
                      <SelectItem value="Swap">Swap</SelectItem>
                      <SelectItem value="Stake">Stake</SelectItem>
                      <SelectItem value="Unstake">Unstake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Budget Category</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <Tag className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">No Category</SelectItem>
                        {BUDGET_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="budgetId">Link to Budget</Label>
                    <Select 
                      value={formData.budgetId}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, budgetId: value }));
                        // Auto-select category from budget
                        const budget = budgets.find(b => String(b.id) === value);
                        if (budget) {
                          setFormData(prev => ({ ...prev, budgetId: value, category: budget.category }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">No Budget Link</SelectItem>
                        {budgets.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.category} ({(b.allocatedAmount / 100_000_000).toFixed(2)} ICP)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memo">Memo (Optional)</Label>
                  <Textarea 
                    id="memo" 
                    placeholder="Add a note about this transaction..."
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="accent" 
                  onClick={handleSubmitTransaction}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Transaction'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="animate-slide-up">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by hash, address, or memo..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((tx, index) => (
          <Card 
            key={tx.id} 
            className={cn(
              "hover:shadow-md transition-all animate-slide-up cursor-pointer",
              tx.status === 'Pending' && "border-l-4 border-l-warning"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Transaction Icon */}
                <div className={cn(
                  "p-3 rounded-xl shrink-0 self-start",
                  tx.toAddress.includes('Treasury') 
                    ? "bg-success/10 text-success" 
                    : "bg-primary/10 text-primary"
                )}>
                  {tx.toAddress.includes('Treasury') 
                    ? <ArrowDownLeft className="h-5 w-5" />
                    : <ArrowUpRight className="h-5 w-5" />
                  }
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium truncate max-w-[200px]">
                      {tx.hash.length > 20 ? `${tx.hash.slice(0, 8)}...${tx.hash.slice(-8)}` : tx.hash}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(tx.hash)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Badge variant={getStatusVariant(tx.status)}>
                      {tx.status}
                    </Badge>
                    <Badge variant="outline">{tx.transactionType}</Badge>
                    {tx.category && (
                      <Badge variant="flow" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {tx.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                    <div className="truncate">
                      <span className="text-foreground/60">From:</span>{' '}
                      <span className="font-mono">{tx.fromAddress}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-foreground/60">To:</span>{' '}
                      <span className="font-mono">{tx.toAddress}</span>
                    </div>
                  </div>

                  {tx.memo && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {tx.memo}
                    </p>
                  )}

                  {tx.failureReason && (
                    <p className="text-sm text-destructive">
                      {tx.failureReason}
                    </p>
                  )}
                </div>

                {/* Amount & Details */}
                <div className="flex items-center gap-6 lg:text-right">
                  <div>
                    <p className="text-lg font-bold">{formatAmount(tx.amount, tx.tokenType)}</p>
                    <p className="text-xs text-muted-foreground">{tx.tokenType}</p>
                  </div>
                  <div className="hidden sm:block text-sm text-muted-foreground">
                    <p>{tx.timestamp.toLocaleDateString()}</p>
                    <p>{tx.timestamp.toLocaleTimeString()}</p>
                  </div>
                  
                  {/* Action Buttons for Pending Transactions */}
                  {tx.status === 'Pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-success hover:text-success hover:bg-success/10"
                        onClick={() => handleConfirmTransaction(tx.id)}
                        disabled={processingTxId === tx.id || !isConnected}
                      >
                        {processingTxId === tx.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">Confirm</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedTxId(tx.id);
                          setFailDialogOpen(true);
                        }}
                        disabled={processingTxId === tx.id || !isConnected}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Fail</span>
                      </Button>
                    </div>
                  )}
                  
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <Card className="animate-fade-in">
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {!isConnected 
                ? 'Connect to the backend to view transactions.' 
                : searchQuery || statusFilter !== 'all'
                  ? 'No transactions found matching your criteria.'
                  : 'No transactions yet. Record your first transaction to get started.'
              }
            </p>
            {isConnected && !searchQuery && statusFilter === 'all' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Record First Transaction
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {isConnected && pagination && totalPages > 1 && (
        <Card className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isRefreshing}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isRefreshing}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasMore || isRefreshing}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fail Transaction Dialog */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Transaction as Failed</DialogTitle>
            <DialogDescription>
              Provide a reason for why this transaction failed. This action requires Admin or Auditor permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="failReason">Failure Reason *</Label>
              <Textarea 
                id="failReason" 
                placeholder="Enter the reason for failure (e.g., Insufficient funds, Invalid address, Network error...)"
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setFailDialogOpen(false);
              setFailReason('');
              setSelectedTxId(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleFailTransaction}
              disabled={!failReason.trim() || processingTxId !== null}
            >
              {processingTxId !== null ? 'Processing...' : 'Mark as Failed'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
