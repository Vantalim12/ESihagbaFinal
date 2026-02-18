# Missing Functionality Implementation Guide

This document outlines all placeholder/unimplemented features in the eSihagBa (Barangay Budget Management System) and provides detailed guidance on how to implement each one.

---

## Summary of Current Status

### ✅ Implemented Features (Working)
| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| User Registration | ✅ `registerUser()` | ✅ Login/Register | Working |
| Wallet Management | ✅ `createWallet()`, `getWallet()` | ✅ `Wallets.tsx` | Working |
| Transaction Recording | ✅ `recordTransaction()` | ✅ `Transactions.tsx` | Working |
| Transaction Confirmation | ✅ `confirmTransaction()` | ✅ `Transactions.tsx` | Working |
| System Statistics | ✅ `getSystemStats()` | ✅ `StatsCard.tsx` | Working |
| User Profile | ✅ User data in state | ✅ `Profile.tsx` | Working |
| Dashboard Overview | ✅ Stats data | ✅ `Dashboard.tsx` | Partially Working |

### ❌ Placeholder Features (Coming Soon)
| Feature | Backend Status | Frontend Component | Priority |
|---------|---------------|-------------------|----------|
| Monthly Expenditure Analytics | ❌ Not implemented | `BudgetChart.tsx` | High |
| Budget Category Distribution | ❌ Not implemented | `CategoryDistribution.tsx` | High |
| Event Management | ❌ Not implemented | `Events.tsx`, `UpcomingEvents.tsx` | Medium |
| Activity Feed / Audit Trail | ❌ Partial types defined | `ActivityFeed.tsx`, `AuditTrail.tsx` | Medium |
| Budget Analytics Page | ❌ Not implemented | `Analytics.tsx` | High |
| Citizen Portal | ❌ Not implemented | `CitizenPortal.tsx` | Low |

---

## Feature Implementation Details

---

## 1. Monthly Expenditure Analytics (BudgetChart)

**Frontend Component:** `frontend/src/components/dashboard/BudgetChart.tsx`

**Current Status:** Shows "Coming Soon" placeholder

### Backend Implementation Required

Add to `src/backend/main.mo`:

```motoko
// Add new type for monthly statistics
type MonthlyExpenditure = {
    month: Nat; // 1-12
    year: Nat;
    totalExpenditure: Nat;
    transactionCount: Nat;
    categories: [(Text, Nat)]; // Category name and amount
};

// Query function to get monthly expenditure data
public query func getMonthlyExpenditure(year: Nat): async [MonthlyExpenditure] {
    let allTransactions = Iter.toArray(transactions.vals());
    
    // Group transactions by month for the given year
    // Filter only confirmed transactions
    // Sum amounts per month
    // Return array of 12 months with their expenditure data
    
    // Implementation steps:
    // 1. Filter transactions by year (using timestamp)
    // 2. Group by month
    // 3. Calculate totals per month
    // 4. Return structured data
};

// Get expenditure for date range
public query func getExpenditureByDateRange(
    fromDate: Time.Time, 
    toDate: Time.Time
): async {
    totalExpenditure: Nat;
    transactionCount: Nat;
    dailyBreakdown: [(Time.Time, Nat)];
} {
    // Implementation here
};
```

### Frontend Implementation

Update `frontend/src/components/dashboard/BudgetChart.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  expenditure: number;
}

export function BudgetChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Call backend getMonthlyExpenditure
    // Transform data for chart display
    fetchMonthlyData();
  }, []);

  const fetchMonthlyData = async () => {
    try {
      // const result = await actor.getMonthlyExpenditure(new Date().getFullYear());
      // Transform and set data
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch monthly data:', error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenditure</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="expenditure" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Required Dependencies
```bash
cd frontend
npm install recharts
```

---

## 2. Budget Category Distribution (CategoryDistribution)

**Frontend Component:** `frontend/src/components/dashboard/CategoryDistribution.tsx`

### Backend Implementation Required

Add to `src/backend/types.mo`:

```motoko
// Budget Category Type
public type BudgetCategory = {
    #Infrastructure;
    #Healthcare;
    #Education;
    #SocialWelfare;
    #PublicSafety;
    #Administration;
    #Other: Text;
};

public type BudgetAllocation = {
    id: Nat;
    category: BudgetCategory;
    allocatedAmount: Nat;
    spentAmount: Nat;
    fiscalYear: Nat;
    createdAt: Time.Time;
    updatedAt: Time.Time;
};
```

Add to `src/backend/main.mo`:

```motoko
// Storage for budget allocations
private transient var budgetAllocations = HashMap.HashMap<Nat, BudgetAllocation>(50, Utils.natEqual, Utils.natHash);
private var nextBudgetId: Nat = 1;

// Create budget allocation
public shared(msg) func createBudgetAllocation(
    category: BudgetCategory,
    allocatedAmount: Nat,
    fiscalYear: Nat
): async Result<BudgetAllocation, Text> {
    // Check admin permissions
    // Create and store allocation
};

// Update spent amount
public shared(msg) func updateBudgetSpent(
    budgetId: Nat,
    spentAmount: Nat
): async Result<BudgetAllocation, Text> {
    // Update spent amount for category
};

// Get category distribution
public query func getCategoryDistribution(fiscalYear: Nat): async [{
    category: BudgetCategory;
    allocated: Nat;
    spent: Nat;
    percentage: Nat; // percentage of total budget
}] {
    // Return distribution data
};
```

### Frontend Implementation

Update `frontend/src/components/dashboard/CategoryDistribution.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

interface CategoryData {
  name: string;
  value: number;
  spent: number;
}

export function CategoryDistribution() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
  }, []);

  const fetchCategoryData = async () => {
    try {
      // const result = await actor.getCategoryDistribution(new Date().getFullYear());
      // Transform and set data
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Allocation by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## 3. Event Management (Events & UpcomingEvents)

**Frontend Components:** 
- `frontend/src/components/sections/Events.tsx` (full page)
- `frontend/src/components/dashboard/UpcomingEvents.tsx` (dashboard widget)

### Backend Implementation Required

Add to `src/backend/types.mo`:

```motoko
public type EventStatus = {
    #Upcoming;
    #Ongoing;
    #Completed;
    #Cancelled;
};

public type Event = {
    id: Nat;
    title: Text;
    description: Text;
    location: Text;
    startDate: Time.Time;
    endDate: Time.Time;
    budgetAllocated: Nat;
    budgetSpent: Nat;
    status: EventStatus;
    createdBy: Principal;
    createdAt: Time.Time;
    updatedAt: Time.Time;
    attendees: [Principal];
};
```

Add to `src/backend/main.mo`:

```motoko
// Event storage
private transient var events = HashMap.HashMap<Nat, Event>(50, Utils.natEqual, Utils.natHash);
private var nextEventId: Nat = 1;

// Create event
public shared(msg) func createEvent(
    title: Text,
    description: Text,
    location: Text,
    startDate: Time.Time,
    endDate: Time.Time,
    budgetAllocated: Nat
): async Result<Event, Text> {
    let caller = msg.caller;
    
    // Check admin permissions
    switch (users.get(caller)) {
        case null { return #err("User not registered") };
        case (?user) {
            if (user.role != #Admin) {
                return #err("Only admins can create events");
            };
        };
    };

    let newEvent: Event = {
        id = nextEventId;
        title = title;
        description = description;
        location = location;
        startDate = startDate;
        endDate = endDate;
        budgetAllocated = budgetAllocated;
        budgetSpent = 0;
        status = #Upcoming;
        createdBy = caller;
        createdAt = Time.now();
        updatedAt = Time.now();
        attendees = [];
    };

    events.put(nextEventId, newEvent);
    nextEventId += 1;
    #ok(newEvent)
};

// Get upcoming events
public query func getUpcomingEvents(limit: Nat): async [Event] {
    let allEvents = Iter.toArray(events.vals());
    let now = Time.now();
    
    // Filter upcoming events and sort by start date
    let upcoming = Array.filter<Event>(allEvents, func(e: Event): Bool {
        e.startDate > now and e.status == #Upcoming
    });
    
    // Sort and limit
    let sorted = Array.sort<Event>(upcoming, func(a: Event, b: Event): { #less; #equal; #greater } {
        if (a.startDate < b.startDate) { #less }
        else if (a.startDate > b.startDate) { #greater }
        else { #equal }
    });
    
    // Return limited results
    if (sorted.size() <= limit) { sorted }
    else {
        Array.tabulate<Event>(limit, func(i: Nat): Event { sorted[i] })
    }
};

// Get all events with filtering
public query func getAllEvents(
    statusFilter: ?EventStatus,
    page: Nat,
    limit: Nat
): async {
    events: [Event];
    total: Nat;
    hasMore: Bool;
} {
    // Implementation with pagination
};

// Update event
public shared(msg) func updateEvent(
    eventId: Nat,
    title: ?Text,
    description: ?Text,
    location: ?Text,
    startDate: ?Time.Time,
    endDate: ?Time.Time,
    budgetAllocated: ?Nat,
    status: ?EventStatus
): async Result<Event, Text> {
    // Update event fields
};

// Delete/Cancel event
public shared(msg) func cancelEvent(eventId: Nat): async Result<(), Text> {
    // Cancel event
};

// Record event expense
public shared(msg) func recordEventExpense(
    eventId: Nat,
    amount: Nat,
    memo: Text
): async Result<Event, Text> {
    // Add to budgetSpent
};
```

### Frontend Implementation for Events.tsx

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Calendar, Plus, MapPin, DollarSign, Users } from 'lucide-react';

interface Event {
  id: bigint;
  title: string;
  description: string;
  location: string;
  startDate: bigint;
  endDate: bigint;
  budgetAllocated: bigint;
  budgetSpent: bigint;
  status: { Upcoming: null } | { Ongoing: null } | { Completed: null } | { Cancelled: null };
  attendees: string[];
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state for creating event
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    budgetAllocated: 0
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    // Call backend getAllEvents
  };

  const handleCreateEvent = async () => {
    // Call backend createEvent
  };

  const getStatusBadge = (status: Event['status']) => {
    if ('Upcoming' in status) return <Badge variant="secondary">Upcoming</Badge>;
    if ('Ongoing' in status) return <Badge variant="default">Ongoing</Badge>;
    if ('Completed' in status) return <Badge variant="outline">Completed</Badge>;
    if ('Cancelled' in status) return <Badge variant="destructive">Cancelled</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Manage city events and budget allocations</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Event list and create dialog implementation */}
    </div>
  );
}
```

---

## 4. Audit Trail & Activity Feed

**Frontend Components:**
- `frontend/src/components/sections/AuditTrail.tsx` (full page)
- `frontend/src/components/dashboard/ActivityFeed.tsx` (dashboard widget)

### Backend Implementation Required

The types are already partially defined in `types.mo`. Add implementation to `main.mo`:

```motoko
// Audit log storage
private transient var auditLogs = HashMap.HashMap<Nat, AuditLog>(200, Utils.natEqual, Utils.natHash);
private var nextAuditId: Nat = 1;

// Internal function to log actions
private func logAction(
    action: AuditAction,
    entityType: Text,
    entityId: Nat,
    userId: Principal,
    details: Text
): () {
    let log: AuditLog = {
        id = nextAuditId;
        action = action;
        entityType = entityType;
        entityId = entityId;
        userId = userId;
        timestamp = Time.now();
        details = details;
    };
    auditLogs.put(nextAuditId, log);
    nextAuditId += 1;
};

// Get recent activity (for dashboard widget)
public query func getRecentActivity(limit: Nat): async [AuditLog] {
    let allLogs = Iter.toArray(auditLogs.vals());
    
    // Sort by timestamp descending
    let sorted = Array.sort<AuditLog>(allLogs, func(a: AuditLog, b: AuditLog): { #less; #equal; #greater } {
        if (a.timestamp > b.timestamp) { #less }
        else if (a.timestamp < b.timestamp) { #greater }
        else { #equal }
    });
    
    // Return limited results
    if (sorted.size() <= limit) { sorted }
    else {
        Array.tabulate<AuditLog>(limit, func(i: Nat): AuditLog { sorted[i] })
    }
};

// Get audit logs with filtering and pagination
public query(msg) func getAuditLogs(
    actionFilter: ?AuditAction,
    userFilter: ?Principal,
    fromDate: ?Time.Time,
    toDate: ?Time.Time,
    page: Nat,
    limit: Nat
): async {
    logs: [AuditLog];
    total: Nat;
    hasMore: Bool;
} {
    // Check if user has auditor or admin role
    let caller = msg.caller;
    switch (users.get(caller)) {
        case null { return { logs = []; total = 0; hasMore = false } };
        case (?user) {
            if (user.role != #Admin and user.role != #Auditor) {
                return { logs = []; total = 0; hasMore = false };
            };
        };
    };
    
    // Filter and paginate logs
    // Return results
};
```

**Update existing functions to log actions:**

```motoko
// In recordTransaction, add at the end before returning:
logAction(#CreateTransaction, "Transaction", nextTransactionId - 1, caller, 
    "Created transaction of " # Nat.toText(amount) # " from " # normalizedFromAddress);

// In confirmTransaction, add:
logAction(#UpdateTransaction, "Transaction", transactionId, caller,
    "Confirmed transaction at block " # Nat.toText(blockHeight));

// In createWallet, add:
logAction(#CreateWallet, "Wallet", nextWalletId - 1, caller,
    "Created wallet with address " # normalizedAddress);
```

### Frontend Implementation for ActivityFeed.tsx

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowUpRight, ArrowDownLeft, Wallet, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: bigint;
  action: { CreateTransaction: null } | { UpdateTransaction: null } | { CreateWallet: null };
  entityType: string;
  entityId: bigint;
  userId: string;
  timestamp: bigint;
  details: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    // const result = await actor.getRecentActivity(10);
  };

  const getActionIcon = (action: AuditLog['action']) => {
    if ('CreateTransaction' in action) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if ('UpdateTransaction' in action) return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
    if ('CreateWallet' in action) return <Wallet className="h-4 w-4 text-purple-500" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={Number(activity.id)} className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-muted">
                {getActionIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.details}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(Number(activity.timestamp) / 1000000, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5. Budget Analytics Page

**Frontend Component:** `frontend/src/components/sections/Analytics.tsx`

This is the full analytics page combining multiple visualizations.

### Backend Implementation Required

Add comprehensive analytics functions:

```motoko
// Get comprehensive analytics data
public query func getAnalyticsSummary(fiscalYear: Nat): async {
    // Monthly expenditure trends
    monthlyTrends: [{
        month: Nat;
        allocated: Nat;
        spent: Nat;
        variance: Int; // positive = under budget, negative = over budget
    }];
    
    // Category breakdown
    categoryBreakdown: [{
        category: BudgetCategory;
        allocated: Nat;
        spent: Nat;
        utilizationRate: Nat; // percentage
    }];
    
    // Transaction type distribution
    transactionTypeDistribution: [{
        transactionType: TransactionType;
        count: Nat;
        totalAmount: Nat;
    }];
    
    // Year-over-year comparison (if data available)
    yoyComparison: ?{
        previousYear: Nat;
        currentYear: Nat;
        percentageChange: Int;
    };
    
    // Top spending areas
    topSpendingAreas: [(Text, Nat)]; // Area name and amount
} {
    // Implementation
};

// Get budget utilization rate
public query func getBudgetUtilization(): async {
    totalAllocated: Nat;
    totalSpent: Nat;
    utilizationRate: Nat; // percentage
    remainingBudget: Nat;
    projectedEndOfYear: ?Nat; // projected spending at year end
} {
    // Calculate and return
};
```

### Frontend Implementation

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

export function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedYear]);

  const fetchAnalyticsData = async () => {
    // const result = await actor.getAnalyticsSummary(selectedYear);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budget Analytics</h1>
        <p className="text-muted-foreground">
          Detailed analysis of city budget allocation and expenditure
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Budget, Spent, Remaining, Utilization Rate cards */}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="comparison">Year Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          {/* Line chart showing monthly trends */}
        </TabsContent>
        
        <TabsContent value="categories">
          {/* Pie/Bar chart for category breakdown */}
        </TabsContent>
        
        <TabsContent value="comparison">
          {/* Year-over-year comparison charts */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 6. Citizen Portal

**Frontend Component:** `frontend/src/components/sections/CitizenPortal.tsx`

### Backend Implementation Required

Add public query functions that don't require authentication:

```motoko
// Public function - no authentication required
public query func getPublicBudgetSummary(fiscalYear: Nat): async {
    totalBudget: Nat;
    totalSpent: Nat;
    remainingBudget: Nat;
    categoryBreakdown: [{
        category: Text;
        allocated: Nat;
        spent: Nat;
    }];
} {
    // Return public budget information
};

// Public transaction history (limited info)
public query func getPublicTransactionHistory(
    page: Nat,
    limit: Nat
): async {
    transactions: [{
        date: Time.Time;
        category: Text;
        amount: Nat;
        purpose: Text;
    }];
    total: Nat;
    hasMore: Bool;
} {
    // Return sanitized public transaction data
    // Don't expose sensitive wallet addresses or internal details
};

// Upcoming public events
public query func getPublicEvents(): async [{
    title: Text;
    description: Text;
    location: Text;
    date: Time.Time;
    allocatedBudget: Nat;
}] {
    // Return upcoming public events
};

// Certificate request (if applicable)
public shared(msg) func requestCertificate(
    certificateType: Text,
    purpose: Text,
    requesterName: Text,
    contactInfo: Text
): async Result<{ requestId: Nat; status: Text }, Text> {
    // Create certificate request
    // This would need additional storage and tracking
};
```

### Frontend Implementation

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, DollarSign, Calendar, FileText, Search } from 'lucide-react';

export function CitizenPortal() {
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [publicTransactions, setPublicTransactions] = useState([]);
  const [publicEvents, setPublicEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    // No authentication needed for these calls
    // const budget = await actor.getPublicBudgetSummary(new Date().getFullYear());
    // const transactions = await actor.getPublicTransactionHistory(1, 10);
    // const events = await actor.getPublicEvents();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Citizen Portal</h1>
        <p className="text-muted-foreground">
          Public access to barangay budget information and services
        </p>
      </div>

      {/* Blockchain verification notice */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-accent" />
            <div>
              <h3 className="font-semibold">Blockchain Verified</h3>
              <p className="text-sm text-muted-foreground">
                All budget data is recorded on the Internet Computer blockchain
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="budget">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="budget">Budget Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          {/* Budget overview with charts */}
        </TabsContent>

        <TabsContent value="transactions">
          {/* Public transaction history table */}
        </TabsContent>

        <TabsContent value="events">
          {/* Upcoming public events list */}
        </TabsContent>

        <TabsContent value="services">
          {/* Certificate requests and other services */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Implementation Priority Order

### Phase 1: Core Budget Features (High Priority)
1. **Budget Categories & Allocation** - Foundation for all budget features
2. **Monthly Expenditure Analytics** - Dashboard visibility
3. **Category Distribution** - Dashboard visibility

### Phase 2: Event Management (Medium Priority)
4. **Event Creation & Management** - Full CRUD operations
5. **Upcoming Events Widget** - Dashboard integration

### Phase 3: Audit & Activity (Medium Priority)
6. **Audit Logging** - Backend modifications to existing functions
7. **Activity Feed Widget** - Dashboard integration
8. **Full Audit Trail Page** - Detailed view

### Phase 4: Public Facing (Lower Priority)
9. **Citizen Portal** - Public budget transparency
10. **Certificate Services** - Additional public services

---

## Technical Notes

### Required Frontend Dependencies
```bash
npm install recharts date-fns
```

### Backend Deployment
After modifying `main.mo`:
```bash
dfx deploy backend
```

### Testing Recommendations
1. Create unit tests for new Motoko functions
2. Test pagination with large datasets
3. Verify role-based access controls
4. Test blockchain data persistence after canister upgrades

### Security Considerations
1. Ensure all admin-only functions check user role
2. Sanitize all user inputs
3. Implement rate limiting for public endpoints
4. Don't expose sensitive data in public queries
