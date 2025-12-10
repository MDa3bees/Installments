import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewInstallment } from './pages/NewInstallment';
import { InstallmentDetails } from './pages/InstallmentDetails';
import { Treasury } from './pages/Treasury'; // New import
import { Customer, InstallmentPlan, Payment, Transaction } from './types';
import { getCustomers, getPlans, saveCustomer, savePlan, updatePlan, deletePlan, getTransactions, saveTransaction, deleteTransaction } from './utils/storage';
import { UserCog, Star, ShieldAlert, ShieldCheck, Shield, Ban, Save, X } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('new-plan');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]); // New state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Edit Customer State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Load initial data
  useEffect(() => {
    setCustomers(getCustomers());
    setPlans(getPlans());
    setTransactions(getTransactions());
  }, []);

  const handleSavePlan = (plan: InstallmentPlan, newCustomer: Customer | null, initialTransaction: Transaction | null, downPaymentTransaction: Transaction | null) => {
    if (newCustomer) {
      saveCustomer(newCustomer);
      setCustomers(getCustomers()); // Reload
    }
    
    // Save the plan
    savePlan(plan);
    setPlans(getPlans()); // Reload

    // Save initial transaction (Deduction of base price) if exists
    if (initialTransaction) {
      saveTransaction(initialTransaction);
    }

    // Save down payment transaction if exists
    if (downPaymentTransaction) {
      saveTransaction(downPaymentTransaction);
    }
    
    setTransactions(getTransactions()); // Reload transactions once
    setActiveTab('dashboard');
  };

  // Treasury Handlers
  const handleAddTransaction = useCallback((transaction: Transaction) => {
    saveTransaction(transaction);
    setTransactions(getTransactions());
  }, []);

  const handleDeleteTransaction = useCallback((id: string) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
  }, []);

  const handleViewInstallmentDetails = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    setActiveTab('installment-details');
  }, []);

  const handleAddPayment = useCallback((planId: string, amount: number, notes: string | undefined, date: string, safeType: 'cash' | 'instapay' | 'wallet') => {
    setPlans(prevPlans => {
      const updatedPlans = prevPlans.map(plan => {
        if (plan.id === planId) {
          const newPayment: Payment = {
            id: crypto.randomUUID(),
            date: date,
            amount,
            notes,
            safeType: safeType // Store where this payment went
          };
          const updatedPayments = [...plan.payments, newPayment];
          const newRemainingBalance = plan.remainingBalance - amount;
          const newStatus = newRemainingBalance <= 0 ? 'paid' : 'active';
          
          const updatedPlan: InstallmentPlan = {
            ...plan,
            payments: updatedPayments,
            remainingBalance: Math.max(0, newRemainingBalance),
            status: newStatus,
          };
          updatePlan(updatedPlan);

          // NEW: Add Payment to Treasury (Khazna) automatically
          const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: date,
            amount: amount,
            type: 'deposit',
            category: 'تحصيل أقساط',
            description: `دفعة قسط: ${plan.customerName} - ${plan.productName} (${notes || ''})`,
            relatedPlanId: plan.id,
            safeType: safeType // Add to the specific safe
          };
          saveTransaction(transaction);
          
          return updatedPlan;
        }
        return plan;
      });
      
      // Update transactions state after plan update
      setTimeout(() => setTransactions(getTransactions()), 0);
      return updatedPlans;
    });
  }, []);

  const handleDeletePayment = useCallback((planId: string, paymentId: string) => {
    setPlans(prevPlans => {
      const updatedPlans = prevPlans.map(plan => {
        if (plan.id === planId) {
          const paymentToDelete = plan.payments.find(p => p.id === paymentId);
          if (!paymentToDelete) return plan;

          const updatedPayments = plan.payments.filter(p => p.id !== paymentId);
          const newRemainingBalance = plan.remainingBalance + paymentToDelete.amount;
          const newStatus = newRemainingBalance > 0 ? 'active' : 'paid';

          const updatedPlan: InstallmentPlan = {
            ...plan,
            payments: updatedPayments,
            remainingBalance: newRemainingBalance,
            status: newStatus,
          };
          updatePlan(updatedPlan);

          // NEW: Remove money from Treasury (via Expense/Reversal)
          const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            amount: paymentToDelete.amount,
            type: 'expense', // Expense to reverse the deposit
            category: 'تعديل - حذف دفعة',
            description: `إلغاء دفعة قسط: ${plan.customerName} - ${plan.productName}`,
            relatedPlanId: plan.id,
            safeType: paymentToDelete.safeType || 'cash' // Reverse from the same safe
          };
          saveTransaction(transaction);
          
          return updatedPlan;
        }
        return plan;
      });
      // Update transactions state
      setTimeout(() => setTransactions(getTransactions()), 0);
      return updatedPlans;
    });
  }, []);

  const handleDeletePlan = useCallback((planId: string) => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف خطة التقسيط هذه؟ لا يمكن التراجع عن هذا الإجراء.")) {
      deletePlan(planId);
      setPlans(getPlans());
      setSelectedPlanId(null);
      setActiveTab('dashboard');
    }
  }, []);

  const handleBackFromDetails = useCallback(() => {
    setSelectedPlanId(null);
    setActiveTab('dashboard');
  }, []);

  // Update Customer Feedback
  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      saveCustomer(editingCustomer);
      setCustomers(getCustomers());
      setEditingCustomer(null);
    }
  };

  const getCustomerStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'trustworthy': return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold"><Star size={12} fill="currentColor" /> VIP</span>;
      case 'good': return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold"><ShieldCheck size={12} /> ملتزم</span>;
      case 'bad': return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold"><ShieldAlert size={12} /> مماطل</span>;
      case 'blocked': return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold"><Ban size={12} /> محظور</span>;
      default: return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold"><Shield size={12} /> عادي</span>;
    }
  };

  useEffect(() => {
    if (selectedPlanId && activeTab !== 'installment-details') {
      setSelectedPlanId(null);
    }
  }, [activeTab, selectedPlanId]);


  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} selectedPlanId={selectedPlanId}>
      {activeTab === 'dashboard' && <Dashboard plans={plans} onViewDetails={handleViewInstallmentDetails} />}
      
      {activeTab === 'new-plan' && (
        <NewInstallment 
          customers={customers} 
          onSave={handleSavePlan} 
        />
      )}

      {activeTab === 'treasury' && (
        <Treasury 
          transactions={transactions}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {activeTab === 'customers' && (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">قائمة العملاء والتقييمات</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">الاسم</th>
                            <th className="px-6 py-4">الهاتف</th>
                            <th className="px-6 py-4">التصنيف</th>
                            <th className="px-6 py-4">ملاحظات</th>
                            <th className="px-6 py-4">تعديل</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {customers.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium">{c.name}</td>
                                <td className="px-6 py-4 text-slate-600">{c.phone}</td>
                                <td className="px-6 py-4">{getCustomerStatusBadge(c.status)}</td>
                                <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate">{c.feedback || '-'}</td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => setEditingCustomer(c)}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                  >
                                    <UserCog size={18} />
                                  </button>
                                </td>
                            </tr>
                        ))}
                         {customers.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-8 text-slate-400">لا يوجد عملاء مسجلين</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <UserCog className="text-emerald-600" />
                  تقييم العميل: {editingCustomer.name}
                </h3>
                <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">تصنيف العميل</label>
                  <select 
                    value={editingCustomer.status || 'average'}
                    onChange={(e) => setEditingCustomer({...editingCustomer, status: e.target.value as any})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="average">عادي (بدون مشاكل)</option>
                    <option value="trustworthy">VIP (ممتاز جداً)</option>
                    <option value="good">ملتزم (جيد)</option>
                    <option value="bad">مماطل (سيء)</option>
                    <option value="blocked">محظور (Blacklist)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">ملاحظات الفيدباك</label>
                  <textarea 
                    value={editingCustomer.feedback || ''}
                    onChange={(e) => setEditingCustomer({...editingCustomer, feedback: e.target.value})}
                    rows={4}
                    placeholder="اكتب تفاصيل عن سلوك العميل في الدفع..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingCustomer(null)}
                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-colors flex justify-center items-center gap-2"
                  >
                    <Save size={18} />
                    حفظ التقييم
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {activeTab === 'installment-details' && selectedPlanId && (
        <InstallmentDetails
          plan={plans.find(p => p.id === selectedPlanId) as InstallmentPlan}
          onAddPayment={handleAddPayment}
          onDeletePayment={handleDeletePayment}
          onDeletePlan={handleDeletePlan}
          onBack={handleBackFromDetails}
        />
      )}
    </Layout>
  );
};

export default App;