import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useBackend } from '@/context/BackendContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryData {
  name: string;
  allocated: number;
  spent: number;
  percentUsed: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CATEGORY_NAMES: { [key: string]: string } = {
  Infrastructure: 'Infrastructure',
  Healthcare: 'Healthcare',
  Education: 'Education',
  SocialWelfare: 'Social Welfare',
  PublicSafety: 'Public Safety',
  Administration: 'Administration',
  Environment: 'Environment',
};

export function CategoryDistribution() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { actor, isConnected } = useBackend();

  useEffect(() => {
    fetchCategoryData();
  }, [actor, selectedYear, isConnected]);

  const fetchCategoryData = async () => {
    if (!actor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await (actor as any).getCategoryDistribution(BigInt(selectedYear));

      const categoryData: CategoryData[] = result.map((item: any) => {
        // Extract category name from variant
        const categoryKey = Object.keys(item.category)[0];
        const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;

        const allocated = Number(item.allocated);
        const spent = Number(item.spent);

        return {
          name: categoryName,
          allocated,
          spent,
          percentUsed: allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
        };
      });

      setData(categoryData);
    } finally {
      setLoading(false);
    }
  };

  // Generate available years (current year and nearby years)
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // Calculate total budget from data
  const totalBudget = data.reduce((sum, item) => sum + item.allocated, 0);

  if (loading) {
    return (
      <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Budget Allocation by Category</CardTitle>
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
      <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Budget Allocation by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full flex items-center justify-center">
            <div className="text-muted-foreground">No budget data available for {selectedYear}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Budget Allocation by Category</CardTitle>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs border rounded px-2 py-1 bg-background"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full flex flex-col gap-3 overflow-y-auto">
          {data.map((item, index) => {
            const percentage = totalBudget > 0 ? ((item.allocated / totalBudget) * 100).toFixed(1) : '0';
            const color = COLORS[index % COLORS.length];

            return (
              <div key={item.name} className="group">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {percentage}% • ₱{(item.allocated / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  {/* Allocated bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full opacity-30"
                    style={{
                      width: `${totalBudget > 0 ? (item.allocated / totalBudget) * 100 : 0}%`,
                      backgroundColor: color
                    }}
                  />
                  {/* Spent bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalBudget > 0 ? (item.spent / totalBudget) * 100 : 0}%`,
                      backgroundColor: color,
                      animationDelay: `${index * 100}ms`
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.percentUsed}% utilized (₱{(item.spent / 1000000).toFixed(2)}M spent)
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

