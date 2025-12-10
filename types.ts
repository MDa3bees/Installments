export interface Customer {
  id: string;
  name: string;
  phone: string;
  nationalId: string;
  status?: 'trustworthy' | 'good' | 'average' | 'bad' | 'blocked'; // Customer classification
  feedback?: string; // Manual notes about behavior
}

export interface Payment {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  amount: number;
  notes?: string;
  safeType?: 'cash' | 'instapay' | 'wallet'; // Added to track where payment was received
}

export interface InstallmentPlan {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  productName: string;
  basePrice: number;
  sellerPercentage: number; // e.g., 30
  customerPercentage: number; // e.g., 40
  
  // Calculated values stored for history
  totalCostToIntermediary: number; // base * 1.30
  totalPriceToCustomer: number; // base * 1.40
  intermediaryProfit: number; // totalCustomer - totalIntermediary
  
  downPayment: number;
  months: number;
  monthlyInstallment: number;
  startDate: string; // YYYY-MM-DD format
  dueDate: string; // YYYY-MM-DD format - Calculated last payment due date
  notes?: string; // Added general notes field
  aiAnalysis?: string;

  // New fields for payment tracking
  payments: Payment[];
  remainingBalance: number;
  status: 'active' | 'paid' | 'overdue'; // 'overdue' is for future expansion
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'deposit' | 'expense' | 'withdrawal';
  category: string; // e.g., 'Initial Markup', 'Manual Deposit', 'Rent', 'Electricity'
  description?: string;
  relatedPlanId?: string;
  safeType: 'cash' | 'instapay' | 'wallet'; // Added safe identification
}

export interface DashboardStats {
  totalActivePlans: number;
  totalProfit: number;
  totalReceivables: number;
  recentPlans: InstallmentPlan[];
}