import { useState } from 'react';
import { useStore, Lead } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit2, Trash2, ShoppingCart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusOptions = ['New', 'Interested', 'Order Confirmed', 'Lost'] as const;

export default function Leads() {
  const navigate = useNavigate();
  const { leads, addLead, updateLead, deleteLead } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    mobile: '',
    area: '',
    notes: '',
    status: 'New' as Lead['status'],
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      updateLead(editingLead.id, formData);
    } else {
      addLead(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      shopName: '',
      ownerName: '',
      mobile: '',
      area: '',
      notes: '',
      status: 'New',
    });
    setEditingLead(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      shopName: lead.shopName,
      ownerName: lead.ownerName,
      mobile: lead.mobile,
      area: lead.area,
      notes: lead.notes,
      status: lead.status,
    });
    setIsDialogOpen(true);
  };

  const handleCreateOrder = (lead: Lead) => {
    navigate('/orders', { state: { leadId: lead.id } });
  };

  const getStatusCount = (status: string) => 
    leads.filter((l) => l.status === status).length;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title mb-0">Leads</h1>
          <p className="text-muted-foreground">Manage your potential customers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Lead['status']) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingLead ? 'Update' : 'Add'} Lead
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOptions.map((status) => (
          <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{status}</p>
                  <p className="text-2xl font-bold">{getStatusCount(status)}</p>
                </div>
                <div className={`status-badge ${
                  status === 'New' ? 'status-new' :
                  status === 'Interested' ? 'status-interested' :
                  status === 'Order Confirmed' ? 'status-confirmed' :
                  'status-lost'
                }`}>
                  {status.split(' ')[0]}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
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
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No leads found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Add your first lead to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header text-left py-3 px-4">Shop</th>
                    <th className="table-header text-left py-3 px-4">Owner</th>
                    <th className="table-header text-left py-3 px-4">Mobile</th>
                    <th className="table-header text-left py-3 px-4">Area</th>
                    <th className="table-header text-left py-3 px-4">Status</th>
                    <th className="table-header text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{lead.shopName}</p>
                          {lead.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-48">{lead.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{lead.ownerName}</td>
                      <td className="py-3 px-4 font-mono text-sm">{lead.mobile}</td>
                      <td className="py-3 px-4">{lead.area}</td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${
                          lead.status === 'New' ? 'status-new' :
                          lead.status === 'Interested' ? 'status-interested' :
                          lead.status === 'Order Confirmed' ? 'status-confirmed' :
                          'status-lost'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {lead.status === 'Order Confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateOrder(lead)}
                              className="text-success border-success/30 hover:bg-success/10"
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Order
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteLead(lead.id)}
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
    </div>
  );
}
