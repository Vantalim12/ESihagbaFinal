import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  DollarSign, 
  Clock, 
  Search, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ExternalLink,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { useBackend, type BackendEvent } from '@/context/BackendContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CANISTER_ID } from '@/lib/icp';

const ICP_EXPLORER_CANISTER_URL = `https://dashboard.internetcomputer.org/canister/${CANISTER_ID}`;

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Upcoming':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'Ongoing':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'Completed':
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    case 'Cancelled':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Upcoming': return <Clock className="h-4 w-4" />;
    case 'Ongoing': return <PlayCircle className="h-4 w-4" />;
    case 'Completed': return <CheckCircle2 className="h-4 w-4" />;
    case 'Cancelled': return <XCircle className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
};

// Convert nanoseconds timestamp to Date
const nsToDate = (ns: number): Date => {
  return new Date(ns / 1_000_000); // nanoseconds to milliseconds
};

// Convert Date to nanoseconds for ICP
const dateToNs = (date: Date): number => {
  return date.getTime() * 1_000_000;
};

// Format ICP amount from e8s
const formatIcpAmount = (e8s: number): string => {
  return (e8s / 100_000_000).toFixed(4);
};

export function Events() {
  const {
    events: backendEvents,
    isConnected,
    isLoading,
    fetchEvents,
    createEvent,
    updateEventStatus,
    recordEventExpense,
    error: backendError,
  } = useBackend();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingEventId, setProcessingEventId] = useState<number | null>(null);
  
  // Expense dialog
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Create form
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    budgetAllocated: '',
    category: '',
  });

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected, fetchEvents]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEvents();
    setIsRefreshing(false);
    toast({ title: "Refreshed", description: "Events list updated" });
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.location || 
        !newEvent.startDate || !newEvent.endDate || !newEvent.budgetAllocated) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const budget = parseFloat(newEvent.budgetAllocated);
    if (isNaN(budget) || budget <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please enter a valid budget amount",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const startDateNs = dateToNs(new Date(newEvent.startDate));
    const endDateNs = dateToNs(new Date(newEvent.endDate));

    const result = await createEvent(
      newEvent.title,
      newEvent.description,
      newEvent.location,
      startDateNs,
      endDateNs,
      budget,
      newEvent.category && newEvent.category !== '_none' ? newEvent.category : undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Event Created",
        description: (
          <span className="flex flex-col gap-2">
            <span>Event has been created on the blockchain.</span>
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
      setIsCreateDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        budgetAllocated: '',
        category: '',
      });
    } else {
      toast({
        title: "Creation Failed",
        description: result.error || "Failed to create event",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (eventId: number, newStatus: string) => {
    setProcessingEventId(eventId);
    const result = await updateEventStatus(eventId, newStatus);
    setProcessingEventId(null);

    if (result.success) {
      toast({
        title: "Status Updated",
        description: `Event status changed to ${newStatus}`,
      });
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  const handleRecordExpense = async () => {
    if (selectedEventId === null || !expenseAmount || !expenseDescription.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in amount and description",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    setProcessingEventId(selectedEventId);
    const result = await recordEventExpense(selectedEventId, amount, expenseDescription);
    setProcessingEventId(null);
    setExpenseDialogOpen(false);
    setSelectedEventId(null);
    setExpenseAmount('');
    setExpenseDescription('');

    if (result.success) {
      toast({
        title: "Expense Recorded",
        description: (
          <span className="flex flex-col gap-2">
            <span>Event expense recorded on the blockchain.</span>
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
        title: "Recording Failed",
        description: result.error || "Failed to record expense",
        variant: "destructive",
      });
    }
  };

  const events = backendEvents;

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'Upcoming').length,
    ongoing: events.filter(e => e.status === 'Ongoing').length,
    totalBudget: events.reduce((sum, e) => sum + e.budgetAllocated, 0),
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
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
                {backendError || "Connect to the backend to view and manage events."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">
            {isConnected
              ? `${events.length} event${events.length !== 1 ? 's' : ''} on blockchain`
              : 'Manage city events and budget allocations'
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent" className="gap-2" disabled={!isConnected}>
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Create a new event on the blockchain with budget allocation.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Event description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="Event location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Budget (ICP) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0.00"
                      step="0.0001"
                      min="0"
                      value={newEvent.budgetAllocated}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, budgetAllocated: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newEvent.category}
                      onValueChange={(value) => setNewEvent(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <Tag className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">No Category</SelectItem>
                        {BUDGET_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={handleCreateEvent} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Total Events</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Upcoming</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <PlayCircle className="h-4 w-4" />
              <span className="text-xs">Ongoing</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.ongoing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Total Budget</span>
            </div>
            <div className="text-2xl font-bold">{formatIcpAmount(stats.totalBudget)} ICP</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events by title, location, or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {!isConnected
                ? 'Connect to the backend to view events.'
                : searchQuery || statusFilter !== 'all'
                  ? 'No events found matching your criteria.'
                  : 'No events yet. Create your first event to get started.'
              }
            </p>
            {isConnected && !searchQuery && statusFilter === 'all' && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event, index) => {
            const startDate = nsToDate(event.startDate);
            const endDate = nsToDate(event.endDate);
            const budgetUtilization = event.budgetAllocated > 0
              ? (event.budgetSpent / event.budgetAllocated) * 100
              : 0;
            const isOverBudget = budgetUtilization > 100;

            return (
              <Card
                key={event.id}
                className="animate-slide-up hover:shadow-md transition-all"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Event icon */}
                    <div className={cn(
                      "p-3 rounded-xl shrink-0 self-start",
                      event.status === 'Ongoing' ? "bg-green-500/10 text-green-600" :
                      event.status === 'Upcoming' ? "bg-blue-500/10 text-blue-600" :
                      event.status === 'Completed' ? "bg-gray-500/10 text-gray-600" :
                      "bg-red-500/10 text-red-600"
                    )}>
                      {getStatusIcon(event.status)}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant="outline" className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        {event.category && (
                          <Badge variant="flow" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {event.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{format(startDate, 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>to {format(endDate, 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Budget & Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Budget</div>
                        <div className="font-semibold">
                          {formatIcpAmount(event.budgetSpent)} / {formatIcpAmount(event.budgetAllocated)} ICP
                        </div>
                      </div>
                      <div className="w-36 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isOverBudget ? "bg-destructive" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {budgetUtilization.toFixed(1)}% utilized
                      </div>
                      <div className="flex gap-2">
                        {/* Status actions */}
                        {event.status === 'Upcoming' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-green-600 hover:text-green-600 hover:bg-green-500/10"
                            onClick={() => handleStatusUpdate(event.id, 'Ongoing')}
                            disabled={processingEventId === event.id || !isConnected}
                          >
                            {processingEventId === event.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <PlayCircle className="h-3.5 w-3.5" />
                            )}
                            Start
                          </Button>
                        )}
                        {event.status === 'Ongoing' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => {
                                setSelectedEventId(event.id);
                                setExpenseDialogOpen(true);
                              }}
                              disabled={processingEventId === event.id || !isConnected}
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Expense
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-success hover:text-success hover:bg-success/10"
                              onClick={() => handleStatusUpdate(event.id, 'Completed')}
                              disabled={processingEventId === event.id || !isConnected}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Complete
                            </Button>
                          </>
                        )}
                        {(event.status === 'Upcoming' || event.status === 'Ongoing') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleStatusUpdate(event.id, 'Cancelled')}
                            disabled={processingEventId === event.id || !isConnected}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Record Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Event Expense</DialogTitle>
            <DialogDescription>
              Record an expense against this event's budget.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expenseAmount">Amount (ICP) *</Label>
              <Input
                id="expenseAmount"
                type="number"
                placeholder="0.00"
                step="0.0001"
                min="0"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expenseDesc">Description *</Label>
              <Textarea
                id="expenseDesc"
                placeholder="Describe the expense..."
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setExpenseDialogOpen(false);
              setExpenseAmount('');
              setExpenseDescription('');
              setSelectedEventId(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleRecordExpense}
              disabled={!expenseAmount || !expenseDescription.trim() || processingEventId !== null}
            >
              {processingEventId !== null ? 'Recording...' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
