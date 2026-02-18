import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    PiggyBank,
    Plus,
    RefreshCw,
    Download,
    Send,
    Landmark,
    Users,
    Wallet,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    RotateCcw,
    Archive,
    FileSpreadsheet,
    FileDown,
    FileText,
    ChevronDown,
    MoreHorizontal,
    ExternalLink,
} from 'lucide-react';
import { useBackend, BudgetAllocation, Barangay } from '@/context/BackendContext';
import { CANISTER_ID } from '@/lib/icp';
import { exportToCsv, exportToPdf, exportToJson } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

// ─── Constants ───────────────────────────────────────────────

const BUDGET_CATEGORIES = [
    { value: 'Infrastructure', label: 'Infrastructure' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Education', label: 'Education' },
    { value: 'SocialWelfare', label: 'Social Welfare' },
    { value: 'PublicSafety', label: 'Public Safety' },
    { value: 'Administration', label: 'Administration' },
    { value: 'Environment', label: 'Environment' },
];

const ALLOCATION_PERIODS = [
    { value: 'Q1', label: 'Q1 (Jan–Mar)' },
    { value: 'Q2', label: 'Q2 (Apr–Jun)' },
    { value: 'Q3', label: 'Q3 (Jul–Sep)' },
    { value: 'Q4', label: 'Q4 (Oct–Dec)' },
    { value: 'SemiAnnual1', label: 'H1 (Jan–Jun)' },
    { value: 'SemiAnnual2', label: 'H2 (Jul–Dec)' },
    { value: 'Annual', label: 'Annual' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
    Draft: { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: Clock },
    Approved: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: CheckCircle2 },
    Released: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Send },
    FullySpent: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2 },
    Expired: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: Archive },
    Cancelled: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
};

const ICP_EXPLORER_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

function extractVariantKey(variant: any): string {
    if (typeof variant === 'string') return variant;
    if (typeof variant === 'object' && variant !== null) return Object.keys(variant)[0] || 'Unknown';
    return 'Unknown';
}

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
    const Icon = cfg.icon;
    return (
        <Badge className={`text-xs ${cfg.bg} ${cfg.color} ${cfg.border} gap-1`}>
            <Icon className="h-3 w-3" />
            {status}
        </Badge>
    );
}

// ─── Component ───────────────────────────────────────────────

export function BudgetManagement() {
    const {
        actor, isConnected, budgets, barangays: contextBarangays,
        fetchBudgets, fetchBarangays, createBudgetAllocation,
        distributeBudget, approveBudget, cancelBudget, closePeriod, rolloverBudget,
    } = useBackend();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Treasury state
    const [treasuryWallet, setTreasuryWallet] = useState<string>('');
    const [allWallets, setAllWallets] = useState<any[]>([]);

    // Allocate dialog
    const [allocateOpen, setAllocateOpen] = useState(false);
    const [allocateBarangay, setAllocateBarangay] = useState('');
    const [allocateAmount, setAllocateAmount] = useState('');
    const [allocateCategory, setAllocateCategory] = useState('Administration');
    const [allocatePeriod, setAllocatePeriod] = useState('Q1');
    const [allocateDescription, setAllocateDescription] = useState('');
    const [allocating, setAllocating] = useState(false);

    // Distribute dialog
    const [distributeOpen, setDistributeOpen] = useState(false);
    const [distributeBudgetId, setDistributeBudgetId] = useState<number | null>(null);
    const [distributing, setDistributing] = useState(false);

    // Cancel dialog
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelBudgetId, setCancelBudgetId] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    // Rollover dialog
    const [rolloverOpen, setRolloverOpen] = useState(false);
    const [rolloverBudgetId, setRolloverBudgetId] = useState<number | null>(null);
    const [rolloverYear, setRolloverYear] = useState(new Date().getFullYear());
    const [rolloverPeriod, setRolloverPeriod] = useState('Q1');
    const [rollingOver, setRollingOver] = useState(false);

    // Close Period dialog
    const [closePeriodOpen, setClosePeriodOpen] = useState(false);
    const [closePeriodPeriod, setClosePeriodPeriod] = useState('Q1');
    const [closingPeriod, setClosingPeriod] = useState(false);

    // Processing state for approve action
    const [approvingId, setApprovingId] = useState<number | null>(null);

    const currentYear = new Date().getFullYear();
    const availableYears = [currentYear - 1, currentYear, currentYear + 1];

    // ─── Fetch Data ────────────────────────────────────────────

    const fetchAllWallets = useCallback(async () => {
        if (!actor) return;
        try {
            const data = await (actor as any).getAllWallets();
            const wallets = (data as any[]).map((w: any) => ({
                id: Number(w.id),
                address: w.address,
                label: Array.isArray(w.walletLabel) ? w.walletLabel[0] || '' : (w.walletLabel || ''),
            }));
            setAllWallets(wallets);
            if (!treasuryWallet && wallets.length > 0) {
                const treasury = wallets.find((w: any) =>
                    (w.label || '').toLowerCase().includes('treasury') ||
                    (w.label || '').toLowerCase().includes('lgu') ||
                    (w.label || '').toLowerCase().includes('city')
                );
                if (treasury) setTreasuryWallet(treasury.address);
            }
        } catch (err) {
            console.error('Failed to fetch wallets:', err);
        }
    }, [actor, treasuryWallet]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchAllWallets(),
            fetchBudgets(selectedYear),
            fetchBarangays(),
        ]);
        setLoading(false);
    }, [fetchAllWallets, fetchBudgets, fetchBarangays, selectedYear]);

    useEffect(() => {
        if (isConnected) fetchData();
    }, [isConnected, fetchData]);

    // ─── Helpers ──────────────────────────────────────────────

    const getBarangayName = (id: number | null): string => {
        if (id === null) return 'Unassigned';
        const brgy = contextBarangays.find(b => b.id === id);
        return brgy ? brgy.name : `Barangay #${id}`;
    };

    const getBarangayBudgets = (barangayId: number): BudgetAllocation[] => {
        return budgets.filter(b => b.barangayId === barangayId);
    };

    // ─── Handlers ──────────────────────────────────────────────

    const handleAllocate = async () => {
        if (!allocateBarangay || !allocateAmount) return;
        setAllocating(true);
        try {
            const result = await createBudgetAllocation(
                allocateCategory,
                Number(allocateAmount),
                selectedYear,
                allocateDescription || undefined,
                Number(allocateBarangay),
                allocatePeriod
            );
            if (result.success) {
                toast({ title: 'Budget Allocated', description: `₱${Number(allocateAmount).toLocaleString()} allocated for ${allocatePeriod}` });
                setAllocateOpen(false);
                resetAllocateForm();
                await fetchBudgets(selectedYear);
            } else {
                toast({ title: 'Error', description: result.error || 'Allocation failed', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err?.message || 'Allocation failed', variant: 'destructive' });
        } finally {
            setAllocating(false);
        }
    };

    const handleDistribute = async () => {
        if (distributeBudgetId === null || !treasuryWallet) return;
        setDistributing(true);
        try {
            const result = await distributeBudget(distributeBudgetId, treasuryWallet);
            if (result.success) {
                toast({
                    title: 'Budget Distributed',
                    description: (
                        <span className="flex flex-col gap-2">
                            <span>Funds distributed successfully</span>
                            <a
                                href={ICP_EXPLORER_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80 font-medium text-sm underline"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Verify on ICP Explorer
                            </a>
                        </span>
                    ),
                });
                setDistributeOpen(false);
                setDistributeBudgetId(null);
                await fetchData();
            } else {
                toast({ title: 'Error', description: result.error || 'Distribution failed', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err?.message || 'Distribution failed', variant: 'destructive' });
        } finally {
            setDistributing(false);
        }
    };

    const handleApprove = async (budgetId: number) => {
        setApprovingId(budgetId);
        try {
            const result = await approveBudget(budgetId);
            if (result.success) {
                toast({ title: 'Budget Approved', description: `Allocation #${budgetId} approved` });
            } else {
                toast({ title: 'Error', description: result.error || 'Approval failed', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err?.message || 'Approval failed', variant: 'destructive' });
        } finally {
            setApprovingId(null);
        }
    };

    const handleCancel = async () => {
        if (cancelBudgetId === null || !cancelReason.trim()) return;
        setCancelling(true);
        try {
            const result = await cancelBudget(cancelBudgetId, cancelReason.trim());
            if (result.success) {
                toast({ title: 'Budget Cancelled', description: `Allocation #${cancelBudgetId} cancelled` });
                setCancelOpen(false);
                setCancelBudgetId(null);
                setCancelReason('');
            } else {
                toast({ title: 'Error', description: result.error || 'Cancellation failed', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err?.message || 'Cancellation failed', variant: 'destructive' });
        } finally {
            setCancelling(false);
        }
    };

    const handleClosePeriod = async () => {
        setClosingPeriod(true);
        try {
            const result = await closePeriod(selectedYear, closePeriodPeriod);
            if (result.success) {
                toast({ title: 'Period Closed', description: `${result.count || 0} allocations expired for ${closePeriodPeriod} FY${selectedYear}` });
                setClosePeriodOpen(false);
            } else {
                toast({ title: 'Error', description: result.error || 'Period closure failed', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err?.message || 'Period closure failed', variant: 'destructive' });
        } finally {
            setClosingPeriod(false);
        }
    };

    const handleRollover = async () => {
        if (rolloverBudgetId === null) return;
        setRollingOver(true);
        try {
            const result = await rolloverBudget(rolloverBudgetId, rolloverYear, rolloverPeriod);
            if (result.success) {
                toast({ title: 'Budget Rolled Over', description: `New draft allocation created for ${rolloverPeriod} FY${rolloverYear}` });
                setRolloverOpen(false);
                setRolloverBudgetId(null);
            } else {
                toast({ title: 'Error', description: result.error || 'Rollover failed', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err?.message || 'Rollover failed', variant: 'destructive' });
        } finally {
            setRollingOver(false);
        }
    };

    const resetAllocateForm = () => {
        setAllocateBarangay('');
        setAllocateAmount('');
        setAllocateCategory('Administration');
        setAllocatePeriod('Q1');
        setAllocateDescription('');
    };

    // ─── Computed ──────────────────────────────────────────────

    const activeBarangays = contextBarangays.filter(b => b.isActive);
    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const draftCount = budgets.filter(b => b.status === 'Draft').length;
    const approvedCount = budgets.filter(b => b.status === 'Approved').length;
    const releasedCount = budgets.filter(b => b.status === 'Released').length;
    const expiredCount = budgets.filter(b => b.status === 'Expired').length;

    // Group budgets by barangay for display
    const barangayBudgetMap = new Map<number, BudgetAllocation[]>();
    budgets.forEach(b => {
        const bid = b.barangayId ?? -1;
        const existing = barangayBudgetMap.get(bid) || [];
        existing.push(b);
        barangayBudgetMap.set(bid, existing);
    });

    // ─── Export ────────────────────────────────────────────────

    const exportHeaders = ['ID', 'Barangay', 'Category', 'Period', 'Allocated (₱)', 'Spent (₱)', 'Status'];
    const getExportRows = (): string[][] => budgets.map(b => [
        String(b.id),
        getBarangayName(b.barangayId),
        b.category,
        b.period,
        b.allocatedAmount.toLocaleString(),
        b.spentAmount.toLocaleString(),
        b.status,
    ]);

    const handleExportCsv = () => {
        exportToCsv(`budget-allocations-${selectedYear}`, exportHeaders, getExportRows());
        toast({ title: 'CSV Exported' });
    };
    const handleExportPdf = () => {
        exportToPdf(`budget-allocations-${selectedYear}`, exportHeaders, getExportRows(), {
            title: `eSihagBa Budget Allocations — FY ${selectedYear}`,
            subtitle: `${budgets.length} allocations • Total: ₱${totalAllocated.toLocaleString()}`,
            canisterId: CANISTER_ID,
        });
        toast({ title: 'PDF Exported' });
    };
    const handleExportJson = () => {
        exportToJson(`budget-allocations-${selectedYear}`, budgets.map(b => ({
            id: b.id, barangay: getBarangayName(b.barangayId), category: b.category,
            period: b.period, allocated: b.allocatedAmount, spent: b.spentAmount, status: b.status,
        })));
        toast({ title: 'JSON Exported' });
    };

    // ─── Loading State ─────────────────────────────────────────

    if (loading) {
        return (
            <div className="space-y-6">
                <div><h1 className="text-2xl font-bold">Budget Management</h1><p className="text-muted-foreground">Loading budget data...</p></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-20 bg-muted rounded" /></CardContent></Card>
                    ))}
                </div>
                <Card className="animate-pulse"><CardContent className="pt-6"><div className="h-64 bg-muted rounded" /></CardContent></Card>
            </div>
        );
    }

    // ─── Render ────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold">Budget Management</h1>
                    <p className="text-muted-foreground">
                        Allocate, approve, distribute &amp; manage budget lifecycle for FY {selectedYear}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="text-sm border rounded-lg px-3 py-2 bg-background"
                    >
                        {availableYears.map(y => <option key={y} value={y}>FY {y}</option>)}
                    </select>

                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" /> Export <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportCsv}><FileSpreadsheet className="h-4 w-4 mr-2" /> CSV</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPdf}><FileDown className="h-4 w-4 mr-2" /> PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportJson}><FileText className="h-4 w-4 mr-2" /> JSON</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Close Period Button */}
                    <Dialog open={closePeriodOpen} onOpenChange={setClosePeriodOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
                                <Archive className="h-4 w-4 mr-2" /> Close Period
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Close Budget Period</DialogTitle>
                                <DialogDescription>
                                    Expire all Approved/Released allocations for a completed period.
                                    Only past periods can be closed.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Fiscal Year</Label>
                                    <Input type="number" value={selectedYear} disabled className="bg-muted" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Period to Close</Label>
                                    <Select value={closePeriodPeriod} onValueChange={setClosePeriodPeriod}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ALLOCATION_PERIODS.map(p => (
                                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setClosePeriodOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleClosePeriod}
                                    disabled={closingPeriod}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {closingPeriod ? 'Closing...' : 'Close Period'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Allocate Budget Button */}
                    <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-flow hover:opacity-90">
                                <Plus className="h-4 w-4 mr-2" /> Allocate Budget
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Allocate Budget to Barangay</DialogTitle>
                                <DialogDescription>
                                    Create a new budget allocation for a barangay and period.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Barangay</Label>
                                    <Select value={allocateBarangay} onValueChange={setAllocateBarangay}>
                                        <SelectTrigger><SelectValue placeholder="Select barangay..." /></SelectTrigger>
                                        <SelectContent>
                                            {activeBarangays.map(b => (
                                                <SelectItem key={b.id} value={String(b.id)}>
                                                    {b.name} ({b.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label>Period</Label>
                                        <Select value={allocatePeriod} onValueChange={setAllocatePeriod}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {ALLOCATION_PERIODS.map(p => (
                                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Category</Label>
                                        <Select value={allocateCategory} onValueChange={setAllocateCategory}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {BUDGET_CATEGORIES.map(c => (
                                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount (₱)</Label>
                                    <Input
                                        type="number" min="0" placeholder="e.g. 5000000"
                                        value={allocateAmount}
                                        onChange={e => setAllocateAmount(e.target.value)}
                                    />
                                    {allocateAmount && (
                                        <p className="text-xs text-muted-foreground">₱{Number(allocateAmount).toLocaleString()}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description (Optional)</Label>
                                    <Textarea
                                        placeholder="Purpose of this allocation..."
                                        value={allocateDescription}
                                        onChange={e => setAllocateDescription(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setAllocateOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleAllocate}
                                    disabled={allocating || !allocateBarangay || !allocateAmount}
                                    className="bg-gradient-flow hover:opacity-90"
                                >
                                    {allocating ? 'Allocating...' : 'Create Allocation'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Treasury Selector */}
            <Card className="animate-slide-up border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Landmark className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">LGU Treasury Wallet</p>
                                <p className="text-xs text-muted-foreground">Source wallet for budget distributions</p>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Select value={treasuryWallet} onValueChange={setTreasuryWallet}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select LGU treasury wallet..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allWallets.map(w => (
                                        <SelectItem key={w.address} value={w.address}>
                                            {w.label || 'Unnamed'} — {w.address.slice(0, 16)}...
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Allocated</p>
                                <p className="text-2xl font-bold mt-1">₱{totalAllocated.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">{budgets.length} allocations</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Spent</p>
                                <p className="text-2xl font-bold mt-1">₱{totalSpent.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">{releasedCount} released</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Send className="h-6 w-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Remaining</p>
                                <p className="text-2xl font-bold mt-1">₱{totalRemaining.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">{draftCount} drafts, {approvedCount} approved</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <PiggyBank className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Barangays</p>
                                <p className="text-2xl font-bold mt-1">{activeBarangays.length}</p>
                                <p className="text-xs text-muted-foreground mt-1">{expiredCount} expired</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Treasury Warning */}
            {!treasuryWallet && budgets.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5 animate-fade-in">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-destructive">No Treasury Wallet Selected</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Select an LGU Treasury wallet above to enable budget distributions to barangays.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Budget Allocations Table */}
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Budget Allocations — FY {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {budgets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <PiggyBank className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground">No Budget Allocations</h3>
                            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                                Create budget allocations for barangays by clicking "Allocate Budget" above.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Barangay</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Allocated</TableHead>
                                    <TableHead className="text-right">Spent</TableHead>
                                    <TableHead>Utilization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {budgets.map((budget) => {
                                    const remaining = budget.allocatedAmount - budget.spentAmount;
                                    const utilization = budget.allocatedAmount > 0
                                        ? (budget.spentAmount / budget.allocatedAmount) * 100
                                        : 0;

                                    return (
                                        <TableRow key={budget.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{budget.id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{getBarangayName(budget.barangayId)}</div>
                                            </TableCell>
                                            <TableCell className="text-sm">{budget.category}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {budget.period}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-medium">
                                                ₱{budget.allocatedAmount.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                ₱{budget.spentAmount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="w-24 space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className={
                                                            utilization >= 100 ? 'text-emerald-500' :
                                                                utilization >= 75 ? 'text-amber-500' : 'text-blue-500'
                                                        }>
                                                            {utilization.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <Progress value={Math.min(utilization, 100)} className="h-1.5" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={budget.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {/* Approve: only for Draft */}
                                                        {budget.status === 'Draft' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleApprove(budget.id)}
                                                                disabled={approvingId === budget.id}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500" />
                                                                {approvingId === budget.id ? 'Approving...' : 'Approve'}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Distribute: only for Approved */}
                                                        {budget.status === 'Approved' && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setDistributeBudgetId(budget.id);
                                                                    setDistributeOpen(true);
                                                                }}
                                                                disabled={!treasuryWallet}
                                                            >
                                                                <Send className="h-4 w-4 mr-2 text-amber-500" />
                                                                Distribute Funds
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Cancel: Draft or Approved */}
                                                        {(budget.status === 'Draft' || budget.status === 'Approved') && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setCancelBudgetId(budget.id);
                                                                        setCancelOpen(true);
                                                                    }}
                                                                    className="text-red-500 focus:text-red-500"
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Cancel Allocation
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}

                                                        {/* Rollover: only for Expired */}
                                                        {budget.status === 'Expired' && remaining > 0 && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setRolloverBudgetId(budget.id);
                                                                    setRolloverYear(selectedYear + 1);
                                                                    setRolloverOpen(true);
                                                                }}
                                                            >
                                                                <RotateCcw className="h-4 w-4 mr-2 text-purple-500" />
                                                                Rollover (₱{remaining.toLocaleString()})
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Distribute Dialog */}
            <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Distribute Funds</DialogTitle>
                        <DialogDescription>
                            Release the approved budget to the barangay wallet via ICP.
                        </DialogDescription>
                    </DialogHeader>
                    {distributeBudgetId !== null && (
                        <div className="py-4">
                            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Allocation:</span>
                                    <span className="font-mono">#{distributeBudgetId}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">From:</span>
                                    <span className="font-mono text-xs">{treasuryWallet.slice(0, 16)}...</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                This will distribute the full remaining budget to the barangay's linked wallet and create a transaction record on ICP.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDistributeOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleDistribute}
                            disabled={distributing}
                            className="bg-gradient-flow hover:opacity-90"
                        >
                            {distributing ? 'Distributing...' : 'Distribute Funds'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Cancel Allocation</DialogTitle>
                        <DialogDescription>
                            This will permanently cancel allocation #{cancelBudgetId}. Please provide a reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 grid gap-3">
                        <div className="grid gap-2">
                            <Label>Cancellation Reason</Label>
                            <Textarea
                                placeholder="e.g. Budget reallocation requested by Mayor..."
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelOpen(false)}>Go Back</Button>
                        <Button
                            onClick={handleCancel}
                            disabled={cancelling || !cancelReason.trim()}
                            variant="destructive"
                        >
                            {cancelling ? 'Cancelling...' : 'Cancel Allocation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rollover Dialog */}
            <Dialog open={rolloverOpen} onOpenChange={setRolloverOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Rollover Budget</DialogTitle>
                        <DialogDescription>
                            Carry forward unspent funds from allocation #{rolloverBudgetId} to a new period.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Target Fiscal Year</Label>
                            <Select value={String(rolloverYear)} onValueChange={v => setRolloverYear(Number(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[currentYear, currentYear + 1, currentYear + 2].map(y => (
                                        <SelectItem key={y} value={String(y)}>FY {y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Target Period</Label>
                            <Select value={rolloverPeriod} onValueChange={setRolloverPeriod}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ALLOCATION_PERIODS.map(p => (
                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRolloverOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleRollover}
                            disabled={rollingOver}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {rollingOver ? 'Rolling over...' : 'Create Rollover'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
