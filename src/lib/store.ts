import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Lead {
  id: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  area: string;
  notes: string;
  status: 'New' | 'Interested' | 'Order Confirmed' | 'Lost';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  flavor: string;
  boxSize: string;
  price: number;
  gstPercent: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  gstPercent: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  leadId: string;
  customerName: string;
  customerMobile: string;
  customerArea: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  status: 'Draft' | 'Confirmed' | 'Delivered';
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  amountPaid: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface Settings {
  monthlyTarget: number;
  currentMonth: string;
}

interface AppState {
  leads: Lead[];
  products: Product[];
  orders: Order[];
  settings: Settings;
  
  // Lead actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Order actions
  addOrder: (order: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<Settings>) => void;
  
  // Computed
  getTotalSales: () => number;
  getPendingPayments: () => number;
  getOverduePaymentsCount: () => number;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateInvoiceNumber = () => `GUD-${Date.now().toString().slice(-6)}`;

// Demo data
const demoLeads: Lead[] = [
  { id: '1', shopName: 'Sweet Corner', ownerName: 'Rajesh Kumar', mobile: '9876543210', area: 'Andheri West', notes: 'Interested in premium range', status: 'Order Confirmed', createdAt: '2024-01-10' },
  { id: '2', shopName: 'Choco Delights', ownerName: 'Priya Sharma', mobile: '9876543211', area: 'Bandra', notes: 'New shop, potential bulk buyer', status: 'Interested', createdAt: '2024-01-12' },
  { id: '3', shopName: 'Gift Paradise', ownerName: 'Amit Patel', mobile: '9876543212', area: 'Juhu', notes: 'Gift packaging needed', status: 'New', createdAt: '2024-01-15' },
  { id: '4', shopName: 'Metro Mart', ownerName: 'Sunita Reddy', mobile: '9876543213', area: 'Powai', notes: 'Large retail chain', status: 'Order Confirmed', createdAt: '2024-01-08' },
  { id: '5', shopName: 'Corner Store', ownerName: 'Vikram Singh', mobile: '9876543214', area: 'Goregaon', notes: 'Price sensitive', status: 'Lost', createdAt: '2024-01-05' },
];

const demoProducts: Product[] = [
  { id: '1', name: 'Gudaly Dark Truffle', flavor: 'Dark Chocolate', boxSize: '12 pcs', price: 450, gstPercent: 18 },
  { id: '2', name: 'Gudaly Milk Classic', flavor: 'Milk Chocolate', boxSize: '24 pcs', price: 680, gstPercent: 18 },
  { id: '3', name: 'Gudaly Hazelnut Premium', flavor: 'Hazelnut', boxSize: '12 pcs', price: 520, gstPercent: 18 },
  { id: '4', name: 'Gudaly Almond Crunch', flavor: 'Almond', boxSize: '18 pcs', price: 590, gstPercent: 18 },
  { id: '5', name: 'Gudaly Caramel Swirl', flavor: 'Caramel', boxSize: '12 pcs', price: 480, gstPercent: 18 },
  { id: '6', name: 'Gudaly Orange Zest', flavor: 'Orange', boxSize: '12 pcs', price: 460, gstPercent: 18 },
  { id: '7', name: 'Gudaly Mixed Assortment', flavor: 'Assorted', boxSize: '36 pcs', price: 980, gstPercent: 18 },
];

const demoOrders: Order[] = [
  {
    id: '1',
    invoiceNumber: 'GUD-000001',
    leadId: '1',
    customerName: 'Sweet Corner',
    customerMobile: '9876543210',
    customerArea: 'Andheri West',
    items: [
      { productId: '1', productName: 'Gudaly Dark Truffle', quantity: 10, price: 450, gstPercent: 18 },
      { productId: '2', productName: 'Gudaly Milk Classic', quantity: 5, price: 680, gstPercent: 18 },
    ],
    subtotal: 7900,
    gstAmount: 1422,
    total: 9322,
    status: 'Delivered',
    paymentStatus: 'Paid',
    amountPaid: 9322,
    createdAt: '2024-01-10',
    deliveredAt: '2024-01-12',
  },
  {
    id: '2',
    invoiceNumber: 'GUD-000002',
    leadId: '4',
    customerName: 'Metro Mart',
    customerMobile: '9876543213',
    customerArea: 'Powai',
    items: [
      { productId: '7', productName: 'Gudaly Mixed Assortment', quantity: 20, price: 980, gstPercent: 18 },
      { productId: '3', productName: 'Gudaly Hazelnut Premium', quantity: 15, price: 520, gstPercent: 18 },
    ],
    subtotal: 27400,
    gstAmount: 4932,
    total: 32332,
    status: 'Delivered',
    paymentStatus: 'Partial',
    amountPaid: 20000,
    createdAt: '2024-01-08',
    deliveredAt: '2024-01-10',
  },
  {
    id: '3',
    invoiceNumber: 'GUD-000003',
    leadId: '1',
    customerName: 'Sweet Corner',
    customerMobile: '9876543210',
    customerArea: 'Andheri West',
    items: [
      { productId: '4', productName: 'Gudaly Almond Crunch', quantity: 8, price: 590, gstPercent: 18 },
      { productId: '5', productName: 'Gudaly Caramel Swirl', quantity: 6, price: 480, gstPercent: 18 },
    ],
    subtotal: 7600,
    gstAmount: 1368,
    total: 8968,
    status: 'Delivered',
    paymentStatus: 'Pending',
    amountPaid: 0,
    createdAt: '2024-01-14',
    deliveredAt: '2024-01-15',
  },
  {
    id: '4',
    invoiceNumber: 'GUD-000004',
    leadId: '4',
    customerName: 'Metro Mart',
    customerMobile: '9876543213',
    customerArea: 'Powai',
    items: [
      { productId: '1', productName: 'Gudaly Dark Truffle', quantity: 25, price: 450, gstPercent: 18 },
    ],
    subtotal: 11250,
    gstAmount: 2025,
    total: 13275,
    status: 'Confirmed',
    paymentStatus: 'Pending',
    amountPaid: 0,
    createdAt: '2024-01-16',
  },
];

const currentMonth = '2024-01'; // Default to January 2024 for demo data

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      leads: demoLeads,
      products: demoProducts,
      orders: demoOrders,
      settings: {
        monthlyTarget: 100000,
        currentMonth,
      },

      // Lead actions
      addLead: (lead) => set((state) => ({
        leads: [...state.leads, { ...lead, id: generateId(), createdAt: new Date().toISOString().slice(0, 10) }],
      })),
      
      updateLead: (id, updates) => set((state) => ({
        leads: state.leads.map((lead) => lead.id === id ? { ...lead, ...updates } : lead),
      })),
      
      deleteLead: (id) => set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
      })),

      // Product actions
      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: generateId() }],
      })),
      
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map((product) => product.id === id ? { ...product, ...updates } : product),
      })),
      
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((product) => product.id !== id),
      })),

      // Order actions
      addOrder: (order) => set((state) => ({
        orders: [...state.orders, { ...order, id: generateId(), invoiceNumber: generateInvoiceNumber(), createdAt: new Date().toISOString().slice(0, 10) }],
      })),
      
      updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map((order) => order.id === id ? { ...order, ...updates } : order),
      })),
      
      deleteOrder: (id) => set((state) => ({
        orders: state.orders.filter((order) => order.id !== id),
      })),

      // Settings actions
      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings },
      })),

      // Computed values
      getTotalSales: () => {
        const { orders, settings } = get();
        return orders
          .filter((order) => order.status === 'Delivered' && order.createdAt.startsWith(settings.currentMonth))
          .reduce((sum, order) => sum + order.total, 0);
      },
      
      getPendingPayments: () => {
        const { orders } = get();
        return orders
          .filter((order) => order.paymentStatus !== 'Paid')
          .reduce((sum, order) => sum + (order.total - order.amountPaid), 0);
      },
      
      getOverduePaymentsCount: () => {
        const { orders } = get();
        return orders.filter((order) => 
          order.status === 'Delivered' && order.paymentStatus !== 'Paid'
        ).length;
      },
    }),
    {
      name: 'gudaly-storage',
    }
  )
);
