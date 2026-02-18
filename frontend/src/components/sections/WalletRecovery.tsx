import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    KeyRound, ShieldCheck, Clock, CheckCircle2, XCircle,
    AlertTriangle, Plus, Wallet,
} from 'lucide-react';
import { useBackend, type WalletChangeRequest } from '@/context/BackendContext';
import { useToast } from '@/hooks/use-toast';

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { color: string; icon: any }> = {
        PendingApproval: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Clock },
        Approved: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
        Rejected: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle },
    };
    const cfg = config[status] || config.PendingApproval;
    const Icon = cfg.icon;
    return (
        <Badge variant="outline" className={`${cfg.color} flex gap-1 items-center`}>
            <Icon className="h-3 w-3" />
            {status === 'PendingApproval' ? 'Pending' : status}
        </Badge>
    );
};

export function WalletRecovery() {
    const {
        walletChangeRequests, fetchWalletChangeRequests,
        requestWalletChange, approveWalletChange, rejectWalletChange,
        barangays, fetchBarangays,
    } = useBackend();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);

    // Request form
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestBarangayId, setRequestBarangayId] = useState('');
    const [requestNewWallet, setRequestNewWallet] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reject dialog
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    // Approve state
    const [approvingId, setApprovingId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([fetchWalletChangeRequests(), fetchBarangays()]);
            setLoading(false);
        })();
    }, [fetchWalletChangeRequests, fetchBarangays]);

    const pendingRequests = walletChangeRequests.filter(r => r.status === 'PendingApproval');
    const resolvedRequests = walletChangeRequests.filter(r => r.status !== 'PendingApproval');
    const activeBarangays = barangays.filter(b => b.isActive);

    const formatDate = (ns: number) => new Date(ns / 1_000_000).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const getBarangayName = (id: number) => {
        const brgy = barangays.find(b => b.id === id);
        return brgy ? brgy.name : `Barangay #${id}`;
    };

    const getCooldownStatus = (barangayId: number) => {
        const brgy = barangays.find(b => b.id === barangayId);
        if (!brgy?.lastWalletChange) return null;
        const lastChange = brgy.lastWalletChange / 1_000_000; // ns to ms
        const cooldownEnd = lastChange + (7 * 24 * 60 * 60 * 1000); // 7 days
        const now = Date.now();
        if (now < cooldownEnd) {
            const remaining = cooldownEnd - now;
            const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
            return { inCooldown: true, daysRemaining: days, cooldownEnd };
        }
        return { inCooldown: false, daysRemaining: 0, cooldownEnd: 0 };
    };

    const handleSubmitRequest = useCallback(async () => {
        if (!requestBarangayId || !requestNewWallet.trim() || !requestReason.trim()) return;
        setSubmitting(true);
        const result = await requestWalletChange(Number(requestBarangayId), requestNewWallet, requestReason);
        setSubmitting(false);
        if (result.success) {
            setRequestOpen(false);
            setRequestBarangayId('');
            setRequestNewWallet('');
            setRequestReason('');
            toast({ title: 'Wallet Change Requested', description: 'SuperAdmin approval is required.' });
        } else {
            toast({ title: 'Request Failed', description: result.error, variant: 'destructive' });
        }
    }, [requestBarangayId, requestNewWallet, requestReason, requestWalletChange, toast]);

    const handleApprove = useCallback(async (id: number) => {
        setApprovingId(id);
        const result = await approveWalletChange(id);
        setApprovingId(null);
        if (result.success) {
            toast({ title: 'Wallet Change Approved', description: 'The barangay wallet has been updated.' });
        } else {
            toast({ title: 'Approval Failed', description: result.error, variant: 'destructive' });
        }
    }, [approveWalletChange, toast]);

    const handleReject = useCallback(async () => {
        if (rejectId == null || !rejectReason.trim()) return;
        setRejecting(true);
        const result = await rejectWalletChange(rejectId, rejectReason);
        setRejecting(false);
        if (result.success) {
            setRejectOpen(false);
            setRejectReason('');
            toast({ title: 'Request Rejected' });
        } else {
            toast({ title: 'Rejection Failed', description: result.error, variant: 'destructive' });
        }
    }, [rejectId, rejectReason, rejectWalletChange, toast]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div><h1 className="text-2xl font-bold">Wallet Recovery</h1><p className="text-muted-foreground">Loading...</p></div>
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-20 bg-muted rounded" /></CardContent></Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <KeyRound className="h-6 w-6 text-teal-500" />
                        Wallet Recovery & Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Request and manage barangay wallet changes with a 7-day cooldown period
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchWalletChangeRequests}>
                        Refresh
                    </Button>
                    <Button onClick={() => setRequestOpen(true)} className="bg-gradient-flow hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Request Wallet Change
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
                                <p className="text-2xl font-bold mt-1">{pendingRequests.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Approved</p>
                                <p className="text-2xl font-bold mt-1">{walletChangeRequests.filter(r => r.status === 'Approved').length}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Rejected</p>
                                <p className="text-2xl font-bold mt-1">{walletChangeRequests.filter(r => r.status === 'Rejected').length}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cooldown Status */}
            {activeBarangays.some(b => getCooldownStatus(b.id)?.inCooldown) && (
                <Card className="border-amber-500/50 bg-amber-500/5 animate-slide-up">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            Active Cooldown Periods
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {activeBarangays
                                .map(b => ({ ...b, cooldown: getCooldownStatus(b.id) }))
                                .filter(b => b.cooldown?.inCooldown)
                                .map(b => (
                                    <div key={b.id} className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{b.name}</span>
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {b.cooldown!.daysRemaining} day{b.cooldown!.daysRemaining > 1 ? 's' : ''} remaining
                                        </Badge>
                                    </div>
                                ))
                            }
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <Card className="animate-slide-up">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-amber-500" />
                            Pending Wallet Changes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">{getBarangayName(req.barangayId)}</span>
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Old Wallet: </span>
                                                    <span className="font-mono">{req.oldWallet ? `${req.oldWallet.slice(0, 20)}...` : 'None'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">New Wallet: </span>
                                                    <span className="font-mono">{req.newWallet.slice(0, 20)}...</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Reason: <span className="italic">{req.reason}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Requested {formatDate(req.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                disabled={approvingId === req.id}
                                                onClick={() => handleApprove(req.id)}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                {approvingId === req.id ? 'Approving...' : 'Approve'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    setRejectId(req.id);
                                                    setRejectOpen(true);
                                                }}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* History */}
            {resolvedRequests.length > 0 && (
                <Card className="animate-slide-up">
                    <CardHeader>
                        <CardTitle className="text-lg">Change History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {resolvedRequests.slice(0, 20).map(req => (
                                <div key={req.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                                    {req.status === 'Approved' ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{getBarangayName(req.barangayId)}</span>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {req.oldWallet ? `${req.oldWallet.slice(0, 12)}...` : 'None'} → {req.newWallet.slice(0, 12)}...
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {req.resolvedAt ? formatDate(req.resolvedAt) : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Request Dialog */}
            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Request Wallet Change</DialogTitle>
                        <DialogDescription>
                            Submit a request to change a barangay's wallet address. Requires SuperAdmin approval and is subject to a 7-day cooldown period.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Barangay</Label>
                            <Select value={requestBarangayId} onValueChange={setRequestBarangayId}>
                                <SelectTrigger><SelectValue placeholder="Select barangay..." /></SelectTrigger>
                                <SelectContent>
                                    {activeBarangays.map(b => {
                                        const cooldown = getCooldownStatus(b.id);
                                        return (
                                            <SelectItem key={b.id} value={String(b.id)} disabled={cooldown?.inCooldown}>
                                                {b.name} ({b.code})
                                                {cooldown?.inCooldown ? ` — ${cooldown.daysRemaining}d cooldown` : ''}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>New Wallet Address</Label>
                            <Input
                                value={requestNewWallet}
                                onChange={e => setRequestNewWallet(e.target.value)}
                                placeholder="e.g., rrkah-fqaaa-aaaaa-aaaaq-cai"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason for Change</Label>
                            <Textarea
                                value={requestReason}
                                onChange={e => setRequestReason(e.target.value)}
                                placeholder="e.g., Compromised wallet, treasurer change..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSubmitRequest}
                            disabled={submitting || !requestBarangayId || !requestNewWallet.trim() || !requestReason.trim()}
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Reject Wallet Change</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this wallet change request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Reason for Rejection</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="e.g., Invalid wallet address, insufficient documentation..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejecting || !rejectReason.trim()}
                        >
                            {rejecting ? 'Rejecting...' : 'Reject Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Empty State */}
            {walletChangeRequests.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="pt-12 pb-12 text-center">
                        <KeyRound className="h-12 w-12 mx-auto text-teal-500 mb-4" />
                        <h3 className="text-lg font-semibold">No Wallet Change Requests</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Wallet change requests will appear here when a barangay needs to update its wallet address.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
