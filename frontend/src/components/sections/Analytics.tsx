import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  Activity,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useBackend } from '@/context/BackendContext';
import { cn } from '@/lib/utils';

interface MonthlyData {
  month: string;
  allocated: number;
  spent: number;
}

interface CategoryData {
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Flow palette colors for categories
const CATEGORY_COLORS = [
  '#2d8f8f', // Teal (accent)
  '#4e9a67', // Green (success)
  '#a8d060', // Lime (flow)
  '#1a2f38', // Navy (primary)
  '#3d9a9a', // Light teal
  '#6bb077', // Light green
  '#c5d86d', // Light lime
  '#14b8a6', // Cyan
];

const CATEGORY_NAMES: { [key: string]: string } = {
  Infrastructure: 'Infrastructure',
  Healthcare: 'Healthcare',
  Education: 'Education',
  SocialWelfare: 'Social Welfare',
  PublicSafety: 'Public Safety',
  Administration: 'Administration',
  Environment: 'Environment',
};

export function Analytics() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { actor, isConnected, isLoading, fetchBudgets, budgets, error: backendError } = useBackend();

  // Generate available years dynamically
  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedYear, actor, isConnected]);

  const fetchAnalyticsData = async () => {
    if (!actor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const yearNum = parseInt(selectedYear);

      // Fetch budget allocations to get real allocated amounts
      await fetchBudgets(yearNum);

      // Fetch category distribution
      const catResult = await (actor as any).getCategoryDistribution(BigInt(yearNum));
      const categories: CategoryData[] = catResult.map((item: any, index: number) => {
        const categoryKey = Object.keys(item.category)[0];
        const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;
        return {
          name: categoryName,
          allocated: Number(item.allocated),
          spent: Number(item.spent),
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        };
      });
      setCategoryData(categories);

      // Fetch monthly expenditure
      const monthResult = await (actor as any).getMonthlyExpenditure(BigInt(yearNum));
      
      // Calculate total allocated budget for the year (divided evenly across months for the chart)
      const totalAllocatedForYear = categories.reduce((sum, c) => sum + c.allocated, 0);
      const monthlyAllocated = totalAllocatedForYear > 0 
        ? totalAllocatedForYear / 12 
        : 0;
      
      const monthly: MonthlyData[] = monthResult.map((item: any) => ({
        month: MONTH_NAMES[Number(item.month) - 1] || `Month ${item.month}`,
        allocated: monthlyAllocated,
        spent: Number(item.totalExpenditure),
      }));
      setMonthlyData(monthly);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setMonthlyData([]);
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalyticsData();
    setIsRefreshing(false);
  };

  // Use category-level totals for KPIs (more accurate than monthly approximations)
  const totalCategoryAllocated = categoryData.reduce((sum, c) => sum + c.allocated, 0);
  const totalCategorySpent = categoryData.reduce((sum, c) => sum + c.spent, 0);
  const totalAllocated = totalCategoryAllocated;
  const totalSpent = totalCategorySpent;
  const utilizationRate = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : '0';
  const remainingBudget = totalAllocated - totalSpent;

  const maxMonthlyValue = Math.max(...monthlyData.map(d => Math.max(d.allocated, d.spent)), 1);

  // Format ICP amounts from e8s
  const formatIcp = (e8s: number): string => {
    const icp = e8s / 100_000_000;
    if (icp >= 1_000_000) return `${(icp / 1_000_000).toFixed(2)}M`;
    if (icp >= 1_000) return `${(icp / 1_000).toFixed(2)}K`;
    return icp.toFixed(4);
  };

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
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
                {backendError || "Connect to the backend to view analytics."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Budget Analytics</h1>
          <p className="text-muted-foreground">Detailed analysis of city budget allocation and expenditure</p>
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
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-primary/20" />
              <Badge variant="secondary" className="text-xs">Total</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatIcp(totalAllocated)} ICP</div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-green-500/20" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-green-600">{formatIcp(totalSpent)} ICP</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-blue-500/20" />
              <Badge variant="outline" className="text-xs">{utilizationRate}%</Badge>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-blue-600">{utilizationRate}%</div>
              <div className="text-sm text-muted-foreground">Utilization Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <PieChart className="h-8 w-8 text-purple-500/20" />
              {remainingBudget > 0 ? (
                <TrendingDown className="h-4 w-4 text-purple-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-purple-600">{formatIcp(remainingBudget)} ICP</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Budget vs Expenditure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {/* Chart */}
              <div className="flex items-end justify-between h-[250px] gap-1 px-2">
                {monthlyData.map((item, index) => (
                  <div key={item.month} className="flex flex-col items-center flex-1 gap-1">
                    <div className="flex gap-0.5 items-end h-full w-full">
                      {/* Allocated bar */}
                      <div
                        className="flex-1 bg-primary/30 rounded-t transition-all duration-500 hover:bg-primary/40"
                        style={{
                          height: `${(item.allocated / maxMonthlyValue) * 100}%`,
                        }}
                        title={`Allocated: ${formatIcp(item.allocated)} ICP`}
                      />
                      {/* Spent bar */}
                      <div
                        className="flex-1 bg-primary rounded-t transition-all duration-500 hover:bg-primary/90"
                        style={{
                          height: `${(item.spent / maxMonthlyValue) * 100}%`,
                        }}
                        title={`Spent: ${formatIcp(item.spent)} ICP`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between px-2 mt-2">
                {monthlyData.map((item) => (
                  <span key={item.month} className="text-xs text-muted-foreground flex-1 text-center">
                    {item.month}
                  </span>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/30" />
                <span className="text-sm text-muted-foreground">Allocated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-sm text-muted-foreground">Spent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Budget Distribution by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category, index) => {
                const percentage = ((category.allocated / totalCategoryAllocated) * 100).toFixed(1);
                const utilizationPercent = ((category.spent / category.allocated) * 100).toFixed(0);

                return (
                  <div key={category.name} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {percentage}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {utilizationPercent}% used
                        </Badge>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      {/* Allocated (background) */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-full opacity-30"
                        style={{
                          width: '100%',
                          backgroundColor: category.color
                        }}
                      />
                      {/* Spent (foreground) */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{
                          width: `${(category.spent / category.allocated) * 100}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>{formatIcp(category.spent)} ICP spent</span>
                      <span>{formatIcp(category.allocated)} ICP allocated</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Budget Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 && monthlyData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No budget data available for {selectedYear}.</p>
              <p className="text-sm mt-1">Create budget allocations and record transactions to see analytics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">Top Performing</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const sorted = [...categoryData]
                      .filter(c => c.allocated > 0)
                      .sort((a, b) => (b.spent / b.allocated) - (a.spent / a.allocated));
                    if (sorted.length > 0) {
                      const top = sorted[0];
                      const pct = ((top.spent / top.allocated) * 100).toFixed(0);
                      return `${top.name} sector shows highest utilization at ${pct}%.`;
                    }
                    return 'Add budget allocations to track category performance.';
                  })()}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-600">Attention Needed</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const lowUtilization = categoryData
                      .filter(c => c.allocated > 0)
                      .sort((a, b) => (a.spent / a.allocated) - (b.spent / b.allocated));
                    if (lowUtilization.length > 0) {
                      const low = lowUtilization[0];
                      const pct = ((low.spent / low.allocated) * 100).toFixed(0);
                      return `${low.name} spending at ${pct}% of allocation. Review pending expenditures.`;
                    }
                    return 'All categories are performing within expected ranges.';
                  })()}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-600">Projection</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {Number(utilizationRate) > 0
                    ? `At current pace (${utilizationRate}% utilized), annual budget will be ${Number(utilizationRate) > 80 ? 'fully utilized' : `approximately ${Math.min(Number(utilizationRate) * 1.5, 100).toFixed(0)}% utilized`} by year end.`
                    : 'Record transactions to see budget utilization projections.'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
