import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { useBackend } from '@/context/BackendContext';

interface MonthlyData {
  month: string;
  expenditure: number;
  transactionCount: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function BudgetChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { actor, isConnected } = useBackend();

  useEffect(() => {
    fetchExpenditureData();
  }, [actor, selectedYear, isConnected]);

  const fetchExpenditureData = async () => {
    if (!actor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await (actor as any).getMonthlyExpenditure(BigInt(selectedYear));

      const monthlyData: MonthlyData[] = result.map((item: any) => ({
        month: MONTH_NAMES[Number(item.month) - 1] || `Month ${item.month}`,
        expenditure: Number(item.totalExpenditure),
        transactionCount: Number(item.transactionCount),
      }));

      setData(monthlyData);
    } catch (error) {
      console.error('Failed to fetch monthly data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate available years
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const maxExpenditure = Math.max(...data.map(d => d.expenditure), 1);
  const totalExpenditure = data.reduce((sum, d) => sum + d.expenditure, 0);

  if (loading) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Monthly Expenditure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Monthly Expenditure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full flex items-center justify-center">
            <div className="text-muted-foreground">No expenditure data for {selectedYear}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Monthly Expenditure</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">
              ₱{(totalExpenditure / 1000000).toFixed(2)}M YTD
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          {/* Simple CSS bar chart with Flow styling */}
          <div className="flex items-end justify-between h-[220px] gap-2 px-2">
            {data.map((item, index) => (
              <div key={item.month} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-gradient-to-t from-accent via-success to-flow rounded-t-lg transition-all duration-500 hover:shadow-glow cursor-pointer relative group"
                  style={{
                    height: `${(item.expenditure / maxExpenditure) * 100}%`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-popover px-3 py-1.5 rounded-xl text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-border/50">
                    ₱{item.expenditure.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between px-2 mt-2">
            {data.map((item) => (
              <span key={item.month} className="text-xs text-muted-foreground flex-1 text-center">
                {item.month}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
