import { useState } from 'react';
import { useStore, Order } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CreditCard, IndianRupee, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/StatCard';

export default function Payments() {
  const { orders, updateOrder, getPendingPayments } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const pendingPayments = getPendingPayments();
  const totalCollected = orders.reduce((sum, o) => sum + o.amountPaid, 0);
  const paidCount = orders.filter((o) => o.paymentStatus === 'Paid').length;
  const pendingCount = orders.filter((o) => o.paymentStatus !== 'Paid').length;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePayment = () => {
    if (!selectedOrder || paymentAmount <= 0) return;

    const newAmountPaid = selectedOrder.amountPaid + paymentAmount;
    let newStatus: Order['paymentStatus'] = 'Partial';
    
    if (newAmountPaid >= selectedOrder.total) {
      newStatus = 'Paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'Partial';
    }

    updateOrder(selectedOrder.id, {
      amountPaid: Math.min(newAmountPaid, selectedOrder.total),
      paymentStatus: newStatus,
    });

    setSelectedOrder(null);
    setPaymentAmount(0);
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title mb-0">Payments</h1>
        <p className="text-muted-foreground">Track and collect payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalCollected)}
          icon={IndianRupee}
          variant="primary"
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(pendingPayments)}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Paid Invoices"
          value={paidCount}
          icon={CheckCircle}
          variant="default"
        />
        <StatCard
          title="Pending Invoices"
          value={pendingCount}
          icon={CreditCard}
          variant="default"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Partial">Partial</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No payments found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Create orders to track payments'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header text-left py-3 px-4">Invoice</th>
                    <th className="table-header text-left py-3 px-4">Customer</th>
                    <th className="table-header text-left py-3 px-4">Order Date</th>
                    <th className="table-header text-right py-3 px-4">Total</th>
                    <th className="table-header text-right py-3 px-4">Paid</th>
                    <th className="table-header text-right py-3 px-4">Due</th>
                    <th className="table-header text-left py-3 px-4">Status</th>
                    <th className="table-header text-left py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const due = order.total - order.amountPaid;
                    return (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">{order.invoiceNumber}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerArea}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{order.createdAt}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="py-3 px-4 text-right text-success font-medium">
                          {formatCurrency(order.amountPaid)}
                        </td>
                        <td className="py-3 px-4 text-right text-destructive font-medium">
                          {due > 0 ? formatCurrency(due) : '-'}
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
                        <td className="py-3 px-4">
                          {order.paymentStatus !== 'Paid' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setPaymentAmount(order.total - order.amountPaid);
                              }}
                            >
                              Record Payment
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium font-sans">Customer-wise Dues</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const customerDues: Record<string, { name: string; total: number; paid: number }> = {};
            orders.forEach((order) => {
              if (!customerDues[order.customerName]) {
                customerDues[order.customerName] = { name: order.customerName, total: 0, paid: 0 };
              }
              customerDues[order.customerName].total += order.total;
              customerDues[order.customerName].paid += order.amountPaid;
            });

            const customersWithDues = Object.values(customerDues)
              .filter((c) => c.total > c.paid)
              .sort((a, b) => (b.total - b.paid) - (a.total - a.paid));

            if (customersWithDues.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending dues! All payments are collected.
                </p>
              );
            }

            return (
              <div className="space-y-3">
                {customersWithDues.map((customer) => {
                  const due = customer.total - customer.paid;
                  const paidPercent = (customer.paid / customer.total) * 100;
                  return (
                    <div key={customer.name} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-destructive font-bold">{formatCurrency(due)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success rounded-full transition-all"
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {paidPercent.toFixed(0)}% paid
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Invoice</p>
                <p className="font-mono font-medium">{selectedOrder.invoiceNumber}</p>
                <p className="text-sm mt-2">{selectedOrder.customerName}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold">{formatCurrency(selectedOrder.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="font-bold text-success">{formatCurrency(selectedOrder.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="font-bold text-destructive">
                    {formatCurrency(selectedOrder.total - selectedOrder.amountPaid)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={selectedOrder.total - selectedOrder.amountPaid}
                  min={0}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedOrder(null)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment} 
                  className="flex-1"
                  disabled={paymentAmount <= 0}
                >
                  Record {formatCurrency(paymentAmount)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
