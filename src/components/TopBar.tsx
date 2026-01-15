import { useStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp } from 'lucide-react';

export function TopBar() {
  const { settings, updateSettings, getTotalSales } = useStore();
  const totalSales = getTotalSales();
  const targetProgress = Math.min((totalSales / settings.monthlyTarget) * 100, 100);

  const months = [
    { value: '2024-01', label: 'January 2024' },
    { value: '2024-02', label: 'February 2024' },
    { value: '2024-03', label: 'March 2024' },
    { value: '2024-04', label: 'April 2024' },
    { value: '2024-05', label: 'May 2024' },
    { value: '2024-06', label: 'June 2024' },
    { value: '2024-07', label: 'July 2024' },
    { value: '2024-08', label: 'August 2024' },
    { value: '2024-09', label: 'September 2024' },
    { value: '2024-10', label: 'October 2024' },
    { value: '2024-11', label: 'November 2024' },
    { value: '2024-12', label: 'December 2024' },
  ];

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <Select 
          value={settings.currentMonth} 
          onValueChange={(value) => updateSettings({ currentMonth: value })}
        >
          <SelectTrigger className="w-48 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Progress */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4 text-accent" />
          <span>Monthly Target</span>
        </div>
        <div className="w-48">
          <Progress 
            value={targetProgress} 
            className="h-2"
          />
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className={`w-4 h-4 ${targetProgress >= 80 ? 'text-success' : 'text-warning'}`} />
          <span className="text-sm font-medium">{targetProgress.toFixed(1)}%</span>
        </div>
      </div>
    </header>
  );
}
