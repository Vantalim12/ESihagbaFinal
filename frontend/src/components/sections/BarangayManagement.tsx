import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { useBackend, type Barangay, type BudgetAllocation } from '@/context/BackendContext';
import { useToast } from '@/hooks/use-toast';
import { formatTokenAmount } from '@/lib/dataTransformers';
import {
    Building2,
    Plus,
    Wallet,
    Search,
    Users,
    MapPin,
    Link2,
    CheckCircle2,
    AlertCircle,
    PiggyBank,
    TrendingUp,
    Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BarangayManagement() {
    const {
        barangays,
        budgets,
        isConnected,
        isLoading,
        fetchBarangays,
        fetchBudgets,
        registerBarangay,
        linkBarangayWallet,
    } = useBackend();
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [registerOpen, setRegisterOpen] = useState(false);
    const [walletLinkOpen, setWalletLinkOpen] = useState(false);
    const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Register form
    const [registerForm, setRegisterForm] = useState({
        name: '',
        code: '',
        captain: '',
        population: '',
    });

    // Wallet link form
    const [walletAddress, setWalletAddress] = useState('');

    useEffect(() => {
        if (isConnected) {
            fetchBarangays();
            fetchBudgets();
        }
    }, [isConnected, fetchBarangays, fetchBudgets]);

    const filteredBarangays = barangays.filter(
        (b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getBarangayBudgets = (barangayId: number): BudgetAllocation[] => {
        return budgets.filter((b) => b.barangayId === barangayId);
    };

    const getTotalAllocated = (barangayId: number): number => {
        return getBarangayBudgets(barangayId).reduce((sum, b) => sum + b.allocatedAmount, 0);
    };

    const getTotalSpent = (barangayId: number): number => {
        return getBarangayBudgets(barangayId).reduce((sum, b) => sum + b.spentAmount, 0);
    };

    const handleRegister = async () => {
        if (!registerForm.name || !registerForm.code) {
            toast({
                title: 'Validation Error',
                description: 'Name and Code are required',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);
        const result = await registerBarangay(
            registerForm.name,
            registerForm.code,
            registerForm.captain || undefined,
            registerForm.population ? parseInt(registerForm.population) : undefined
        );
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Success', description: `Barangay "${registerForm.name}" registered successfully` });
            setRegisterForm({ name: '', code: '', captain: '', population: '' });
            setRegisterOpen(false);
        } else {
            toast({ title: 'Error', description: result.error || 'Registration failed', variant: 'destructive' });
        }
    };

    const handleLinkWallet = async () => {
        if (!selectedBarangay || !walletAddress.trim()) {
            toast({ title: 'Error', description: 'Wallet address is required', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        const result = await linkBarangayWallet(selectedBarangay.id, walletAddress.trim());
        setIsSubmitting(false);

        if (result.success) {
            toast({ title: 'Success', description: `Wallet linked to ${selectedBarangay.name}` });
            setWalletAddress('');
            setWalletLinkOpen(false);
            setSelectedBarangay(null);
        } else {
            toast({ title: 'Error', description: result.error || 'Wallet linking failed', variant: 'destructive' });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft':
                return <Badge variant="outline">Draft</Badge>;
            case 'Approved':
                return <Badge variant="secondary">Approved</Badge>;
            case 'Released':
                return <Badge variant="confirmed">Released</Badge>;
            case 'FullySpent':
                return <Badge variant="default">Fully Spent</Badge>;
            case 'Cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold">Barangay Management</h1>
                    <p className="text-muted-foreground">Register and manage barangay entities</p>
                </div>
                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                    <DialogTrigger asChild>
                        <Button variant="accent" disabled={!isConnected}>
                            <Plus className="h-4 w-4 mr-2" />
                            Register Barangay
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Register New Barangay</DialogTitle>
                            <DialogDescription>
                                Add a new barangay entity to the system
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="brgyName">Barangay Name *</Label>
                                <Input
                                    id="brgyName"
                                    placeholder="e.g., Barangay San Jose"
                                    value={registerForm.name}
                                    onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brgyCode">Barangay Code *</Label>
                                <Input
                                    id="brgyCode"
                                    placeholder="e.g., SJ-001"
                                    value={registerForm.code}
                                    onChange={(e) => setRegisterForm((p) => ({ ...p, code: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brgyCaptain">Captain Name</Label>
                                <Input
                                    id="brgyCaptain"
                                    placeholder="e.g., Juan Dela Cruz"
                                    value={registerForm.captain}
                                    onChange={(e) => setRegisterForm((p) => ({ ...p, captain: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brgyPop">Population</Label>
                                <Input
                                    id="brgyPop"
                                    type="number"
                                    placeholder="e.g., 5000"
                                    value={registerForm.population}
                                    onChange={(e) => setRegisterForm((p) => ({ ...p, population: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button variant="accent" onClick={handleRegister} disabled={isSubmitting}>
                                {isSubmitting ? 'Registering...' : 'Register'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 animate-slide-up">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{barangays.length}</p>
                                <p className="text-sm text-muted-foreground">Registered Barangays</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {barangays.filter((b) => b.walletAddress).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Wallets Linked</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {barangays.reduce((sum, b) => sum + (b.population || 0), 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Population</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative animate-slide-up" style={{ animationDelay: '50ms' }}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-10"
                    placeholder="Search barangays by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Barangay List */}
            {filteredBarangays.length === 0 ? (
                <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <CardContent className="p-12 text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Barangays Found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery
                                ? 'No barangays match your search query.'
                                : 'Register your first barangay to get started.'}
                        </p>
                        {!searchQuery && (
                            <Button variant="accent" onClick={() => setRegisterOpen(true)} disabled={!isConnected}>
                                <Plus className="h-4 w-4 mr-2" />
                                Register Barangay
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBarangays.map((brgy, index) => {
                        const totalAllocated = getTotalAllocated(brgy.id);
                        const totalSpent = getTotalSpent(brgy.id);
                        const utilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
                        const brgyBudgets = getBarangayBudgets(brgy.id);

                        return (
                            <Card
                                key={brgy.id}
                                className="animate-slide-up hover:shadow-md transition-shadow"
                                style={{ animationDelay: `${(index + 2) * 50}ms` }}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-base">{brgy.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <Hash className="h-3 w-3" />
                                                {brgy.code}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={brgy.isActive ? 'confirmed' : 'destructive'}>
                                            {brgy.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {brgy.captain && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Users className="h-3.5 w-3.5" />
                                                <span className="truncate">{brgy.captain}</span>
                                            </div>
                                        )}
                                        {brgy.population && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span>{brgy.population.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Wallet Status */}
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        {brgy.walletAddress ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-medium">Wallet Linked</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                                                        {brgy.walletAddress}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-warning" />
                                                    <span className="text-xs text-muted-foreground">No wallet linked</span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => {
                                                        setSelectedBarangay(brgy);
                                                        setWalletLinkOpen(true);
                                                    }}
                                                    disabled={!isConnected}
                                                >
                                                    <Link2 className="h-3 w-3 mr-1" />
                                                    Link
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Budget Summary */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <PiggyBank className="h-3.5 w-3.5" />
                                                Budget
                                            </span>
                                            <span className="font-medium">
                                                {formatTokenAmount(totalAllocated)}
                                            </span>
                                        </div>
                                        {totalAllocated > 0 && (
                                            <>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all',
                                                            utilization > 90
                                                                ? 'bg-destructive'
                                                                : utilization > 70
                                                                    ? 'bg-warning'
                                                                    : 'bg-success'
                                                        )}
                                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Spent: {formatTokenAmount(totalSpent)}</span>
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        {utilization.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Budget History */}
                                    {brgyBudgets.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Allocations ({brgyBudgets.length})
                                                </p>
                                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                                    {brgyBudgets.slice(0, 3).map((alloc) => (
                                                        <div
                                                            key={alloc.id}
                                                            className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {getStatusBadge(alloc.status)}
                                                                <span className="text-muted-foreground">{alloc.period}</span>
                                                            </div>
                                                            <span className="font-medium">{formatTokenAmount(alloc.allocatedAmount)}</span>
                                                        </div>
                                                    ))}
                                                    {brgyBudgets.length > 3 && (
                                                        <p className="text-[10px] text-center text-muted-foreground">
                                                            +{brgyBudgets.length - 3} more allocations
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Wallet Link Dialog */}
            <Dialog open={walletLinkOpen} onOpenChange={setWalletLinkOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link Wallet</DialogTitle>
                        <DialogDescription>
                            Link a wallet address to {selectedBarangay?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="walletAddr">Wallet Address *</Label>
                            <Input
                                id="walletAddr"
                                placeholder="Enter ICP wallet address"
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="accent" onClick={handleLinkWallet} disabled={isSubmitting}>
                            {isSubmitting ? 'Linking...' : 'Link Wallet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
