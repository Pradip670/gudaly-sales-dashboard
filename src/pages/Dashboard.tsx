import { useStore } from '@/lib/store';
import { StatCard } from '@/components/StatCard';
import { IndianRupee, Target, TrendingUp, AlertTriangle, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { orders, products, settings, getTotalSales, getPendingPayments, getOverduePaymentsCount } = useStore();

  const totalSales = getTotalSales();
  const pendingPayments = getPendingPayments();
  const overdueCount = getOverduePaymentsCount();
  const targetProgress = Math.min((totalSales / settings.monthlyTarget) * 100, 100);

  // Calculate best selling product
  const productSales: Record<string, number> = {};
  orders
    .filter(o => o.status === 'Delivered')
    .forEach(order => {
      order.items.forEach(item => {
        productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
      });
    });
  
  const bestSeller = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0];

  // Chart data - daily sales for current month
  const dailySalesData = Array.from({ length: 20 }, (_, i) => {
    const day = i + 1;
    const dayStr = day.toString().padStart(2, '0');
    const date = `${settings.currentMonth}-${dayStr}`;
    
    const daySales = orders
      .filter(o => o.status === 'Delivered' && o.deliveredAt === date)
      .reduce((sum, o) => sum + o.total, 0);

    return {
      day: `${day}`,
      sales: daySales,
      target: settings.monthlyTarget / 30,
    };
  });

  // Recent orders
  const recentOrders = orders.slice().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="page-container space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          subtitle={`This month`}
          icon={IndianRupee}
          variant="primary"
        />
        <StatCard
          title="Monthly Target"
          value={formatCurrency(settings.monthlyTarget)}
          subtitle="Set in settings"
          icon={Target}
          variant="default"
        />
        <StatCard
          title="Target Achieved"
          value={`${targetProgress.toFixed(1)}%`}
          subtitle={`${formatCurrency(settings.monthlyTarget - totalSales)} remaining`}
          icon={TrendingUp}
          variant="accent"
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(pendingPayments)}
          subtitle={`${overdueCount} overdue invoices`}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium font-sans">Daily Sales vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="sales" 
                    name="Sales"
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Daily Target"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Insights Panel */}
        <div className="space-y-4">
          {/* Best Seller */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium font-sans flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                Best Selling Flavor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bestSeller ? (
                <div>
                  <p className="text-lg font-semibold text-foreground">{bestSeller[0]}</p>
                  <p className="text-sm text-muted-foreground">{bestSeller[1]} boxes sold</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Alert */}
          {overdueCount > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium font-sans flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Overdue Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-warning">{overdueCount} invoices</p>
                <p className="text-sm text-muted-foreground">Require attention</p>
                <Link to="/payments">
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    View Payments
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium font-sans">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/leads" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Add New Lead
                </Button>
              </Link>
              <Link to="/orders" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Create Order
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium font-sans">Recent Orders</CardTitle>
          <Link to="/orders">
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header text-left py-3 px-4">Invoice</th>
                  <th className="table-header text-left py-3 px-4">Customer</th>
                  <th className="table-header text-left py-3 px-4">Amount</th>
                  <th className="table-header text-left py-3 px-4">Status</th>
                  <th className="table-header text-left py-3 px-4">Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm">{order.invoiceNumber}</td>
                    <td className="py-3 px-4">{order.customerName}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(order.total)}</td>
                    <td className="py-3 px-4">
                      <span className={`status-badge ${
                        order.status === 'Delivered' ? 'status-delivered' :
                        order.status === 'Confirmed' ? 'status-confirmed' :
                        'status-draft'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`status-badge ${
                        order.paymentStatus === 'Paid' ? 'status-paid' :
                        order.paymentStatus === 'Partial' ? 'status-partial' :
                        'status-pending'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
