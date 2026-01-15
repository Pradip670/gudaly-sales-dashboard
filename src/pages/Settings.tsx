import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Save, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Settings() {
  const { settings, updateSettings, getTotalSales } = useStore();
  const [monthlyTarget, setMonthlyTarget] = useState(settings.monthlyTarget);
  const [saved, setSaved] = useState(false);

  const totalSales = getTotalSales();
  const targetProgress = Math.min((totalSales / settings.monthlyTarget) * 100, 100);

  const handleSave = () => {
    updateSettings({ monthlyTarget });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const presetTargets = [50000, 100000, 150000, 200000, 300000, 500000];

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title mb-0">Settings</h1>
        <p className="text-muted-foreground">Configure your sales targets and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Target Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-sans text-lg">
              <Target className="w-5 h-5 text-accent" />
              Monthly Sales Target
            </CardTitle>
            <CardDescription>
              Set your monthly sales goal. This will be used to track your progress on the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="monthlyTarget">Target Amount (₹)</Label>
              <Input
                id="monthlyTarget"
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                min={0}
                step={1000}
                className="text-lg font-medium"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick presets</Label>
              <div className="flex flex-wrap gap-2">
                {presetTargets.map((preset) => (
                  <Button
                    key={preset}
                    variant={monthlyTarget === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMonthlyTarget(preset)}
                  >
                    {formatCurrency(preset)}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Target
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-lg">Current Progress</CardTitle>
            <CardDescription>
              Your sales progress for {new Date(settings.currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">Achieved</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(totalSales)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="text-xl font-semibold">{formatCurrency(settings.monthlyTarget)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress value={targetProgress} className="h-4" />
                <div className="flex justify-between text-sm">
                  <span className={targetProgress >= 100 ? 'text-success font-medium' : 'text-muted-foreground'}>
                    {targetProgress.toFixed(1)}% achieved
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(Math.max(0, settings.monthlyTarget - totalSales))} to go
                  </span>
                </div>
              </div>
            </div>

            {/* Milestone indicators */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Milestones</p>
              <div className="space-y-2">
                {[25, 50, 75, 100].map((milestone) => (
                  <div key={milestone} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      targetProgress >= milestone ? 'bg-success' : 'bg-muted'
                    }`}>
                      {targetProgress >= milestone && (
                        <CheckCircle className="w-3 h-3 text-success-foreground" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      targetProgress >= milestone ? 'text-success font-medium' : 'text-muted-foreground'
                    }`}>
                      {milestone}% - {formatCurrency(settings.monthlyTarget * milestone / 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-sans text-lg">About Gudaly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl chocolate-gradient flex items-center justify-center text-primary-foreground font-display text-2xl">
                G
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Gudaly Chocolates</h3>
                <p className="text-muted-foreground">Premium Chocolate Distributor</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sales Management System v1.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
