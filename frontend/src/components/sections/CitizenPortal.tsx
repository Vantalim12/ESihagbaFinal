import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Users,
  Shield,
  DollarSign,
  Calendar,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PieChart,
  TrendingUp,
  FileText,
  MapPin,
  Clock,
  Download,
  FileSpreadsheet,
  FileDown,
  ChevronDown
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useBackend } from '@/context/BackendContext';
import { CANISTER_ID } from '@/lib/icp';
import { exportToCsv, exportToPdf, exportToJson } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  categoryBreakdown: { category: string; allocated: number; spent: number }[];
}

interface PublicEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  budgetAllocated: number;
}

interface PublicTransaction {
  id: number;
  date: Date;
  amount: number;
  purpose: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Infrastructure': '#6366f1',
  'Healthcare': '#8b5cf6',
  'Education': '#a855f7',
  'Social Welfare': '#d946ef',
  'Public Safety': '#ec4899',
  'Administration': '#f43f5e',
  'Environment': '#14b8a6',
};

export function CitizenPortal() {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [transactions, setTransactions] = useState<PublicTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'budget' | 'events' | 'transactions'>('budget');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const transactionsPerPage = 10;
  const { actor, isConnected } = useBackend();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchPublicData();
  }, [actor, isConnected]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [currentPage, activeTab, actor]);

  const fetchPublicData = async () => {
    if (!actor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch public budget summary (no auth required)
      const budgetResult = await (actor as any).getPublicBudgetSummary(BigInt(currentYear));
      setBudgetSummary({
        totalBudget: Number(budgetResult.totalBudget),
        totalSpent: Number(budgetResult.totalSpent),
        remainingBudget: Number(budgetResult.remainingBudget),
        categoryBreakdown: budgetResult.categoryBreakdown.map((c: any) => ({
          category: c.category,
          allocated: Number(c.allocated),
          spent: Number(c.spent),
        })),
      });

      // Fetch public events
      const eventsResult = await (actor as any).getPublicEvents();
      setEvents(eventsResult.map((e: any, index: number) => ({
        id: index + 1,
        title: e.title,
        description: e.description,
        location: e.location,
        startDate: new Date(Number(e.startDate) / 1000000), // Convert nanoseconds
        budgetAllocated: Number(e.budgetAllocated),
      })));

    } catch (error) {
      console.error('Failed to fetch public data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!actor) return;

    try {
      const result = await (actor as any).getPublicTransactionHistory(BigInt(currentPage), BigInt(transactionsPerPage));
      setTransactions(result.transactions.map((tx: any, index: number) => ({
        id: (currentPage - 1) * transactionsPerPage + index + 1,
        date: new Date(Number(tx.date) / 1000000),
        amount: Number(tx.amount),
        purpose: tx.purpose,
      })));
      setTotalTransactions(Number(result.total));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  // ── Transaction Export Handlers ──
  const txHeaders = ['Date', 'Time', 'Purpose', 'Amount (₱)'];

  const getTxRows = (): string[][] =>
    filteredTransactions.map(tx => [
      format(tx.date, 'yyyy-MM-dd'),
      format(tx.date, 'HH:mm:ss'),
      tx.purpose,
      tx.amount.toLocaleString(),
    ]);

  const handleExportCsv = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportToCsv(`transactions-${dateStr}`, txHeaders, getTxRows());
    toast({ title: 'CSV Exported', description: `${filteredTransactions.length} transactions exported to CSV.` });
  };

  const handleExportPdf = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportToPdf(`transactions-${dateStr}`, txHeaders, getTxRows(), {
      title: 'eSihagBa Public Transaction History',
      subtitle: `${filteredTransactions.length} transactions • Page ${currentPage}`,
      canisterId: CANISTER_ID,
    });
    toast({ title: 'PDF Exported', description: `${filteredTransactions.length} transactions exported to PDF.` });
  };

  const handleExportJson = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    exportToJson(`transactions-${dateStr}`, filteredTransactions);
    toast({ title: 'JSON Exported', description: `${filteredTransactions.length} transactions exported to JSON.` });
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Citizen Portal</h1>
        <p className="text-muted-foreground">Public access to barangay budget information and services</p>
      </div>

      {/* Blockchain Notice */}
      <Card className="border-accent/30 bg-accent/5 animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/20">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-accent">Blockchain Verified</h3>
              <p className="text-sm text-muted-foreground">
                All budget transactions are recorded on the Internet Computer blockchain for full transparency and immutability.
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto hidden sm:flex">
              <ExternalLink className="h-4 w-4 mr-2" />
              Verify on Chain
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b animate-slide-up" style={{ animationDelay: '50ms' }}>
        <button
          onClick={() => setActiveTab('budget')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'budget'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <DollarSign className="h-4 w-4 inline mr-2" />
          Budget Overview
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'events'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Public Events
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Transaction History
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading public data...</div>
        </div>
      ) : (
        <>
          {/* Budget Tab */}
          {activeTab === 'budget' && budgetSummary && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-8 w-8 text-primary/20" />
                      <Badge variant="secondary">FY 2026</Badge>
                    </div>
                    <div className="text-3xl font-bold">₱{(budgetSummary.totalBudget / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-muted-foreground">Total Budget</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-8 w-8 text-green-500/20" />
                      <Badge variant="outline" className="text-green-600">
                        {((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-green-600">₱{(budgetSummary.totalSpent / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <PieChart className="h-8 w-8 text-blue-500/20" />
                      <Badge variant="outline" className="text-blue-600">Available</Badge>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">₱{(budgetSummary.remainingBudget / 1000000).toFixed(1)}M</div>
                    <div className="text-sm text-muted-foreground">Remaining Budget</div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Allocation by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetSummary.categoryBreakdown.map((cat) => {
                      const percentage = ((cat.allocated / budgetSummary.totalBudget) * 100).toFixed(1);
                      const utilizationPercent = ((cat.spent / cat.allocated) * 100).toFixed(0);
                      const color = CATEGORY_COLORS[cat.category] || '#6366f1';

                      return (
                        <div key={cat.category}>
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                              <span className="font-medium">{cat.category}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ₱{(cat.allocated / 1000000).toFixed(1)}M ({percentage}%)
                            </span>
                          </div>
                          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                width: `${(cat.spent / cat.allocated) * 100}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{utilizationPercent}% utilized</span>
                            <span>₱{(cat.spent / 1000000).toFixed(2)}M spent</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-4 animate-fade-in">
              {events.length === 0 ? (
                <Card>
                  <CardContent className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No upcoming events</h3>
                      <p className="text-muted-foreground">Check back later for community events</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{format(event.startDate, 'MMMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>₱{event.budgetAllocated.toLocaleString()} budget</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-sm">
                            {formatDistanceToNow(event.startDate, { addSuffix: true })}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="text-sm">{format(tx.date, 'MMM d, yyyy')}</div>
                            <div className="text-xs text-muted-foreground">{format(tx.date, 'h:mm a')}</div>
                          </TableCell>
                          <TableCell className="font-medium">{tx.purpose}</TableCell>
                          <TableCell className="text-right font-mono">
                            ₱{tx.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
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
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
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
          )}
        </>
      )}
    </div>
  );
}
