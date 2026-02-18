import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ScrollText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Calendar,
  FileText,
  User,
  Shield,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileDown,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { useBackend } from '@/context/BackendContext';
import { CANISTER_ID } from '@/lib/icp';
import { exportToCsv, exportToPdf, exportToJson } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

const ICP_EXPLORER_CANISTER_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  timestamp: Date;
  userId: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CreateTransaction':
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    case 'UpdateTransaction':
      return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
    case 'CreateWallet':
      return <Wallet className="h-4 w-4 text-purple-500" />;
    case 'CreateEvent':
    case 'UpdateEvent':
      return <Calendar className="h-4 w-4 text-orange-500" />;
    case 'CreateBudget':
    case 'UpdateBudget':
      return <FileText className="h-4 w-4 text-indigo-500" />;
    case 'Login':
    case 'Logout':
      return <User className="h-4 w-4 text-cyan-500" />;
    default:
      return <ScrollText className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionBadge = (action: string) => {
  const color = {
    CreateTransaction: 'bg-green-500/10 text-green-600',
    UpdateTransaction: 'bg-blue-500/10 text-blue-600',
    CreateWallet: 'bg-purple-500/10 text-purple-600',
    CreateEvent: 'bg-orange-500/10 text-orange-600',
    UpdateEvent: 'bg-orange-500/10 text-orange-600',
    CreateBudget: 'bg-indigo-500/10 text-indigo-600',
    UpdateBudget: 'bg-indigo-500/10 text-indigo-600',
    Login: 'bg-cyan-500/10 text-cyan-600',
  }[action] || 'bg-muted text-muted-foreground';

  return color;
};

const shouldShowAuditLink = (action: string, entityType: string): boolean => {
  // Show audit link for transactions and wallets
  return (
    (action === 'CreateTransaction' || action === 'UpdateTransaction') ||
    (action === 'CreateWallet' && entityType === 'Wallet')
  );
};

export function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const logsPerPage = 15;
  const { actor, isConnected } = useBackend();
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, actionFilter, actor, isConnected]);

  const fetchAuditLogs = async () => {
    if (!actor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await (actor as any).getAuditLogs(BigInt(currentPage), BigInt(logsPerPage));

      const auditLogs: AuditLog[] = result.logs.map((item: any) => {
        // Extract action from variant
        const actionKey = Object.keys(item.action)[0];

        return {
          id: Number(item.id),
          action: actionKey,
          entityType: item.entityType,
          entityId: Number(item.entityId),
          details: item.details,
          timestamp: new Date(Number(item.timestamp) / 1000000), // Convert nanoseconds
          userId: item.userId.toText ? item.userId.toText().slice(0, 15) + '...' : 'unknown',
        };
      });

      // Client-side filter by action if needed
      let filteredLogs = auditLogs;
      if (actionFilter !== 'all') {
        filteredLogs = auditLogs.filter(log => log.action === actionFilter);
      }

      setLogs(filteredLogs);
      setTotalLogs(Number(result.total));
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalLogs / logsPerPage);

  const auditHeaders = ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Details', 'User'];

  const getAuditRows = (): string[][] =>
    filteredLogs.map(log => [
      String(log.id),
      format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      log.action.replace(/([A-Z])/g, ' $1').trim(),
      log.entityType,
      String(log.entityId),
      log.details,
      log.userId,
    ]);

  const handleExportCsv = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportToCsv(`audit-logs-${dateStr}`, auditHeaders, getAuditRows());
    toast({ title: 'CSV Exported', description: `${filteredLogs.length} audit logs exported to CSV.` });
  };

  const handleExportPdf = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportToPdf(`audit-logs-${dateStr}`, auditHeaders, getAuditRows(), {
      title: 'eSihagBa Audit Trail',
      subtitle: `${filteredLogs.length} records • Page ${currentPage}`,
      canisterId: CANISTER_ID,
    });
    toast({ title: 'PDF Exported', description: `${filteredLogs.length} audit logs exported to PDF.` });
  };

  const handleExportJson = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportToJson(`audit-logs-${dateStr}`, filteredLogs);
    toast({ title: 'JSON Exported', description: `${filteredLogs.length} audit logs exported to JSON.` });
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Audit Trail</h1>
          <p className="text-muted-foreground">Complete history of all system activities and changes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchAuditLogs()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJson}>
                <FileText className="h-4 w-4 mr-2" />
                Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Blockchain Verification Notice */}
      <Card className="border-accent/30 bg-accent/5 animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-accent/20">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Blockchain Verified</h3>
                <p className="text-xs text-muted-foreground">
                  All audit logs are stored immutably on the Internet Computer blockchain
                </p>
              </div>
            </div>
            <a
              href={ICP_EXPLORER_CANISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View on ICP Explorer
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CreateTransaction">Create Transaction</SelectItem>
            <SelectItem value="UpdateTransaction">Update Transaction</SelectItem>
            <SelectItem value="CreateWallet">Create Wallet</SelectItem>
            <SelectItem value="CreateEvent">Create Event</SelectItem>
            <SelectItem value="UpdateEvent">Update Event</SelectItem>
            <SelectItem value="CreateBudget">Create Budget</SelectItem>
            <SelectItem value="UpdateBudget">Update Budget</SelectItem>
            <SelectItem value="Login">Login</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Logs Table */}
      <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-muted-foreground">Loading audit logs...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[100px]">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="group">
                    <TableCell>
                      <div className="p-2 rounded-full bg-muted">
                        {getActionIcon(log.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionBadge(log.action)}>
                        {log.action.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="truncate block">{log.details}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {log.entityType} #{log.entityId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{log.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(log.timestamp, 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(log.timestamp, 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {shouldShowAuditLink(log.action, log.entityType) ? (
                        <a
                          href={ICP_EXPLORER_CANISTER_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                          title="View on ICP Explorer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Audit</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
