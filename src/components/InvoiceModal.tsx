import { useRef, useState } from 'react';
import { Order } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link2, MessageCircle, Download, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceModal({ order, open, onOpenChange }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

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

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {order.invoiceNumber}</span>
          </DialogTitle>
        </DialogHeader>
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
                <p className="font-mono text-sm text-foreground">{order.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">{order.createdAt}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">Bill To:</p>
              <p className="font-semibold text-foreground">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerArea}</p>
              <p className="text-sm text-muted-foreground">{order.customerMobile}</p>
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
                  {order.items.map((item, i) => {
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
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span>GST</span>
                <span>{formatCurrency(order.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Grand Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Payment Status:</span>
              <span className={`status-badge ${
                order.paymentStatus === 'Paid' ? 'status-paid' :
                order.paymentStatus === 'Partial' ? 'status-partial' :
                'status-pending'
              }`}>
                {order.paymentStatus}
              </span>
              {order.paymentStatus !== 'Paid' && (
                <span className="text-sm text-muted-foreground">
                  Paid: {formatCurrency(order.amountPaid)} / {formatCurrency(order.total)}
                </span>
              )}
            </div>
          </div>

          {/* PO Link */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1 truncate font-mono">
              {getInvoiceUrl(order)}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyInvoiceLink(order)}
              className="shrink-0"
            >
              {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => copyInvoiceLink(order)}
              className="flex-1"
            >
              {linkCopied ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
              Copy Link
            </Button>
            <Button 
              variant="outline" 
              onClick={() => shareOnWhatsApp(order)}
              className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={() => downloadPDF(order)}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
