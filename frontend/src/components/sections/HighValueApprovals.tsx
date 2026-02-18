import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    ShieldCheck, ShieldAlert, ShieldX, AlertTriangle,
    CheckCircle2, XCircle, Clock, Users, Settings,
} from 'lucide-react';
import { useBackend, type HighValueRequest } from '@/context/BackendContext';
import { useToast } from '@/hooks/use-toast';

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'PendingApproval': return <Clock className="h-4 w-4 text-amber-500" />;
        case 'Approved': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        case 'Rejected': return <XCircle className="h-4 w-4 text-red-500" />;
        default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        PendingApproval: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        Approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        Rejected: 'bg-red-500/10 text-red-600 border-red-500/30',
        Expired: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
    };
    return (
        <Badge variant="outline" className={`${colors[status] || colors.Expired} flex gap-1 items-center`}>
            <StatusIcon status={status} />
            {status === 'PendingApproval' ? 'Pending' : status}
        </Badge>
    );
};

export function HighValueApprovals() {
    const {
        highValueRequests, fetchHighValueRequests,
        approveHighValueRequest, rejectHighValueRequest,
        barangays, fetchBarangays,
        setBarangayThreshold,
    } = useBackend();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    // Threshold settings dialog
    const [thresholdOpen, setThresholdOpen] = useState(false);
    const [thresholdBarangayId, setThresholdBarangayId] = useState<number | null>(null);
    const [thresholdValue, setThresholdValue] = useState('');
    const [settingThreshold, setSettingThreshold] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([fetchHighValueRequests(), fetchBarangays()]);
            setLoading(false);
        })();
    }, [fetchHighValueRequests, fetchBarangays]);

    const pendingRequests = highValueRequests.filter(r => r.status === 'PendingApproval');
    const resolvedRequests = highValueRequests.filter(r => r.status !== 'PendingApproval');

    const handleApprove = useCallback(async (id: number) => {
        setApprovingId(id);
        const result = await approveHighValueRequest(id);
        setApprovingId(null);
        if (result.success) {
            toast({ title: 'Approval Submitted', description: 'Your approval has been recorded.' });
        } else {
            toast({ title: 'Approval Failed', description: result.error, variant: 'destructive' });
        }
    }, [approveHighValueRequest, toast]);

    const handleReject = useCallback(async () => {
        if (rejectId == null || !rejectReason.trim()) return;
        setRejecting(true);
        const result = await rejectHighValueRequest(rejectId, rejectReason);
        setRejecting(false);
        if (result.success) {
            setRejectOpen(false);
            setRejectReason('');
            toast({ title: 'Request Rejected' });
        } else {
            toast({ title: 'Rejection Failed', description: result.error, variant: 'destructive' });
        }
    }, [rejectId, rejectReason, rejectHighValueRequest, toast]);

    const handleSetThreshold = useCallback(async () => {
        if (thresholdBarangayId == null || !thresholdValue) return;
        setSettingThreshold(true);
        const amount = Math.floor(parseFloat(thresholdValue) * 100_000_000);
        const result = await setBarangayThreshold(thresholdBarangayId, amount);
        setSettingThreshold(false);
        if (result.success) {
            setThresholdOpen(false);
            toast({ title: 'Threshold Updated' });
        } else {
            toast({ title: 'Update Failed', description: result.error, variant: 'destructive' });
        }
    }, [thresholdBarangayId, thresholdValue, setBarangayThreshold, toast]);

    const formatAmount = (amt: number) => `₱${(amt / 100_000_000).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const formatDate = (ns: number) => new Date(ns / 1_000_000).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const getBarangayName = (budgetId: number) => {
        // We show budgetId since we don't have barangay mapping from request
        return `Budget #${budgetId}`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div><h1 className="text-2xl font-bold">High-Value Approvals</h1><p className="text-muted-foreground">Loading...</p></div>
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
                        <ShieldCheck className="h-6 w-6 text-amber-500" />
                        High-Value Approvals
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Multi-signature approval for distributions exceeding barangay thresholds
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchHighValueRequests}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Pending Alert Banner */}
            {pendingRequests.length > 0 && (
                <Card className="border-amber-500/50 bg-amber-500/5 animate-slide-up">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-amber-600">
                                    {pendingRequests.length} Pending Approval{pendingRequests.length > 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    High-value distributions require approval from 2 distinct SuperAdmin/LGU accounts
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                <p className="text-2xl font-bold mt-1">{highValueRequests.filter(r => r.status === 'Approved').length}</p>
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
                                <p className="text-2xl font-bold mt-1">{highValueRequests.filter(r => r.status === 'Rejected').length}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Requests Table */}
            {pendingRequests.length > 0 && (
                <Card className="animate-slide-up">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Awaiting Your Approval
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">{getBarangayName(req.budgetId)}</span>
                                                <StatusBadge status={req.status} />
                                                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {req.approvals.length}/{req.requiredApprovals} approvals
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Amount: <span className="font-mono font-semibold text-foreground">{formatAmount(req.amount)}</span>
                                                {' • '}
                                                Requested {formatDate(req.createdAt)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                From: {req.fromWallet.slice(0, 16)}... → To: {req.toWallet.slice(0, 16)}...
                                            </p>
                                            {req.reason && (
                                                <p className="text-xs text-muted-foreground mt-1 italic">"{req.reason}"</p>
                                            )}
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

            {/* Resolved Requests History */}
            {resolvedRequests.length > 0 && (
                <Card className="animate-slide-up">
                    <CardHeader>
                        <CardTitle className="text-lg">Request History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {resolvedRequests.slice(0, 20).map(req => (
                                <div key={req.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                                    <StatusIcon status={req.status} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{getBarangayName(req.budgetId)}</span>
                                            <span className="font-mono text-sm">{formatAmount(req.amount)}</span>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        {req.rejectionReason && (
                                            <p className="text-xs text-red-500 mt-0.5 italic">Reason: {req.rejectionReason}</p>
                                        )}
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

            {/* Barangay Thresholds */}
            <Card className="animate-slide-up">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-slate-500" />
                        Per-Barangay High-Value Thresholds
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground">
                                    <th className="text-left py-2 pr-4">Barangay</th>
                                    <th className="text-left py-2 pr-4">Code</th>
                                    <th className="text-right py-2 pr-4">Threshold</th>
                                    <th className="text-right py-2">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {barangays.filter(b => b.isActive).map(b => (
                                    <tr key={b.id}>
                                        <td className="py-2 pr-4 font-medium">{b.name}</td>
                                        <td className="py-2 pr-4 text-muted-foreground">{b.code}</td>
                                        <td className="py-2 pr-4 text-right font-mono">
                                            {formatAmount(b.highValueThreshold)}
                                        </td>
                                        <td className="py-2 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setThresholdBarangayId(b.id);
                                                    setThresholdValue(String(b.highValueThreshold / 100_000_000));
                                                    setThresholdOpen(true);
                                                }}
                                            >
                                                <Settings className="h-3 w-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Reject High-Value Request</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this distribution request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Reason for Rejection</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="e.g., Amount exceeds quarterly budget limit..."
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

            {/* Threshold Dialog */}
            <Dialog open={thresholdOpen} onOpenChange={setThresholdOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Set High-Value Threshold</DialogTitle>
                        <DialogDescription>
                            Distributions exceeding this amount will require multi-signature approval.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Threshold Amount (₱)</Label>
                            <Input
                                type="number"
                                value={thresholdValue}
                                onChange={e => setThresholdValue(e.target.value)}
                                placeholder="e.g., 1000000"
                            />
                            <p className="text-xs text-muted-foreground">
                                Current: {thresholdBarangayId != null ? (
                                    formatAmount(barangays.find(b => b.id === thresholdBarangayId)?.highValueThreshold || 0)
                                ) : '—'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setThresholdOpen(false)}>Cancel</Button>
                        <Button onClick={handleSetThreshold} disabled={settingThreshold || !thresholdValue}>
                            {settingThreshold ? 'Setting...' : 'Update Threshold'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Empty State */}
            {highValueRequests.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="pt-12 pb-12 text-center">
                        <ShieldCheck className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                        <h3 className="text-lg font-semibold">No High-Value Requests</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            High-value distribution requests will appear here when distributions exceed a barangay's configured threshold.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
