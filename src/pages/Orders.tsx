import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore, Order, OrderItem } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Trash2, ShoppingCart, Minus, FileText, Link2, MessageCircle, Download, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
export default function Orders() {
  const location = useLocation();
  const { orders, leads, products, addOrder, updateOrder, deleteOrder } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [orderStatus, setOrderStatus] = useState<Order['status']>('Draft');

  const confirmedLeads = leads.filter((l) => l.status === 'Order Confirmed');

  useEffect(() => {
    const state = location.state as { leadId?: string } | null;
    if (state?.leadId) {
      setSelectedLeadId(state.leadId);
      setIsDialogOpen(true);
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;
    
    orderItems.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        gstAmount += (itemTotal * product.gstPercent) / 100;
      }
    });

    return {
      subtotal,
      gstAmount,
      total: subtotal + gstAmount,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;

    const { subtotal, gstAmount, total } = calculateTotals();
    const items: OrderItem[] = orderItems
      .filter((item) => item.productId && item.quantity > 0)
      .map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          gstPercent: product.gstPercent,
        };
      });

    addOrder({
      leadId: lead.id,
      customerName: lead.shopName,
      customerMobile: lead.mobile,
      customerArea: lead.area,
      items,
      subtotal,
      gstAmount,
      total,
      status: orderStatus,
      paymentStatus: 'Pending',
      amountPaid: 0,
    });

    resetForm();
  };

  const resetForm = () => {
    setSelectedLeadId('');
    setOrderItems([]);
    setOrderStatus('Draft');
    setIsDialogOpen(false);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1 }]);
  };

  const updateItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateStatus = (orderId: string, status: Order['status']) => {
    const updates: Partial<Order> = { status };
    if (status === 'Delivered') {
      updates.deliveredAt = new Date().toISOString().slice(0, 10);
    }
    updateOrder(orderId, updates);
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  const { subtotal, gstAmount, total } = calculateTotals();

  // Get invoice URL
  const getInvoiceUrl = (order: Order) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/orders?invoice=${order.invoiceNumber}`;
  };

  // Copy PO link to clipboard
  const copyInvoiceLink = async (order: Order) => {
    const url = getInvoiceUrl(order);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success('Invoice link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Share on WhatsApp
  const shareOnWhatsApp = (order: Order) => {
    const url = getInvoiceUrl(order);
    const message = encodeURIComponent(
      `🧾 *Invoice: ${order.invoiceNumber}*\n\n` +
      `Customer: ${order.customerName}\n` +
      `Amount: ${formatCurrency(order.total)}\n` +
      `Status: ${order.paymentStatus}\n\n` +
      `View invoice: ${url}`
    );
    const whatsappUrl = `https://wa.me/${order.customerMobile.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Download PDF
  const downloadPDF = async (order: Order) => {
    if (!invoiceRef.current) return;
    
    toast.loading('Generating PDF...');
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${order.invoiceNumber}.pdf`);
      
      toast.dismiss();
      toast.success('Invoice downloaded!');
    } catch {
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title mb-0">Orders</h1>
          <p className="text-muted-foreground">Manage invoices and deliveries</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {confirmedLeads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.shopName} - {lead.area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Products</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                {orderItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Add products to the order
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(index, 'productId', value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {formatCurrency(product.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            className="w-20"
                          />
                          {product && (
                            <span className="text-sm font-medium w-24 text-right">
                              {formatCurrency(product.price * item.quantity)}
                            </span>
                          )}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Totals */}
              {orderItems.length > 0 && (
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>GST</span>
                    <span>{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Order Status</Label>
                <Select value={orderStatus} onValueChange={(v: Order['status']) => setOrderStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!selectedLeadId || orderItems.length === 0}
                >
                  Create Order
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
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
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No orders found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Create your first order to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header text-left py-3 px-4">Invoice</th>
                    <th className="table-header text-left py-3 px-4">Customer</th>
                    <th className="table-header text-left py-3 px-4">Items</th>
                    <th className="table-header text-left py-3 px-4">Amount</th>
                    <th className="table-header text-left py-3 px-4">Status</th>
                    <th className="table-header text-left py-3 px-4">Payment</th>
                    <th className="table-header text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm">{order.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerArea}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {order.items.length} items
                      </td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-4">
                        <Select 
                          value={order.status} 
                          onValueChange={(v: Order['status']) => handleUpdateStatus(order.id, v)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <span className={`status-badge ${
                              order.status === 'Delivered' ? 'status-delivered' :
                              order.status === 'Confirmed' ? 'status-confirmed' :
                              'status-draft'
                            }`}>
                              {order.status}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setViewingOrder(order);
                              setIsInvoiceOpen(true);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteOrder(order.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Modal */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Invoice {viewingOrder?.invoiceNumber}</span>
            </DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-6">
              {/* Invoice Content - for PDF capture */}
              <div ref={invoiceRef} className="bg-white p-6 space-y-6">
                {/* Customer Info */}
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Gudaly Chocolates</h3>
                    <p className="text-sm text-muted-foreground">Premium Chocolate Distributor</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-foreground">{viewingOrder.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{viewingOrder.createdAt}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground">Bill To:</p>
                  <p className="font-semibold text-foreground">{viewingOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{viewingOrder.customerArea}</p>
                  <p className="text-sm text-muted-foreground">{viewingOrder.customerMobile}</p>
                </div>

                {/* Items */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-header text-left py-2">Product</th>
                        <th className="table-header text-right py-2">Qty</th>
                        <th className="table-header text-right py-2">Price</th>
                        <th className="table-header text-right py-2">GST</th>
                        <th className="table-header text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingOrder.items.map((item, i) => {
                        const itemTotal = item.price * item.quantity;
                        const itemGst = (itemTotal * item.gstPercent) / 100;
                        return (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{item.productName}</td>
                            <td className="py-2 text-right text-foreground">{item.quantity}</td>
                            <td className="py-2 text-right text-foreground">{formatCurrency(item.price)}</td>
                            <td className="py-2 text-right text-foreground">{item.gstPercent}%</td>
                            <td className="py-2 text-right font-medium text-foreground">
                              {formatCurrency(itemTotal + itemGst)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between text-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(viewingOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>GST</span>
                    <span>{formatCurrency(viewingOrder.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Grand Total</span>
                    <span className="text-primary">{formatCurrency(viewingOrder.total)}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Payment Status:</span>
                  <span className={`status-badge ${
                    viewingOrder.paymentStatus === 'Paid' ? 'status-paid' :
                    viewingOrder.paymentStatus === 'Partial' ? 'status-partial' :
                    'status-pending'
                  }`}>
                    {viewingOrder.paymentStatus}
                  </span>
                  {viewingOrder.paymentStatus !== 'Paid' && (
                    <span className="text-sm text-muted-foreground">
                      Paid: {formatCurrency(viewingOrder.amountPaid)} / {formatCurrency(viewingOrder.total)}
                    </span>
                  )}
                </div>
              </div>

              {/* PO Link */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground flex-1 truncate font-mono">
                  {getInvoiceUrl(viewingOrder)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyInvoiceLink(viewingOrder)}
                  className="shrink-0"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => copyInvoiceLink(viewingOrder)}
                  className="flex-1"
                >
                  {linkCopied ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => shareOnWhatsApp(viewingOrder)}
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  onClick={() => downloadPDF(viewingOrder)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
