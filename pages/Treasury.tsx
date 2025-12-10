import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { Vault, ArrowDownCircle, ArrowUpCircle, Plus, Search, Trash2, Smartphone, CreditCard, Banknote, Filter } from 'lucide-react';

interface TreasuryProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const Treasury: React.FC<TreasuryProps> = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'expense'>('all');
  const [safeFilter, setSafeFilter] = useState<'all' | 'cash' | 'instapay' | 'wallet'>('all');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'deposit' | 'expense'>('expense');
  
  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    safeType: 'cash' as 'cash' | 'instapay' | 'wallet'
  });

  const stats = useMemo(() => {
    // Initialize stats structure
    const initial = {
      total: { balance: 0, income: 0, expenses: 0 },
      cash: { balance: 0, income: 0, expenses: 0 },
      instapay: { balance: 0, income: 0, expenses: 0 },
      wallet: { balance: 0, income: 0, expenses: 0 }
    };

    return transactions.reduce((acc, t) => {
      // For backward compatibility, default to 'cash' if safeType is undefined
      const type = t.safeType || 'cash';
      
      const amount = t.amount;
      const isDeposit = t.type === 'deposit';

      // Update specific safe stats
      if (isDeposit) {
        acc[type].income += amount;
        acc[type].balance += amount;
        acc.total.income += amount;
        acc.total.balance += amount;
      } else {
        acc[type].expenses += amount;
        acc[type].balance -= amount;
        acc.total.expenses += amount;
        acc.total.balance -= amount;
      }
      
      return acc;
    }, initial);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Filter by Type (All/Deposit/Expense)
    if (activeTab === 'deposit') filtered = filtered.filter(t => t.type === 'deposit');
    if (activeTab === 'expense') filtered = filtered.filter(t => t.type !== 'deposit');

    // Filter by Safe
    if (safeFilter !== 'all') {
        filtered = filtered.filter(t => (t.safeType || 'cash') === safeFilter);
    }
    
    return filtered;
  }, [transactions, activeTab, safeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("يرجى إدخال مبلغ صحيح");
      return;
    }

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: formData.date,
      amount: Number(formData.amount),
      type: formType,
      category: formData.category || (formType === 'deposit' ? 'إيداع نقدي' : 'مصروفات عامة'),
      description: formData.description,
      safeType: formData.safeType
    };

    onAddTransaction(newTransaction);
    setShowForm(false);
    setFormData({ amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], safeType: 'cash' });
  };

  const openForm = (type: 'deposit' | 'expense') => {
    setFormType(type);
    setShowForm(true);
  };

  const getSafeLabel = (type: string | undefined) => {
    switch(type) {
      case 'cash': return 'خزنة كاش';
      case 'instapay': return 'انستا باي';
      case 'wallet': return 'محفظة إلكترونية';
      default: return 'خزنة كاش';
    }
  };

  const getSafeIcon = (type: string | undefined) => {
    switch(type) {
      case 'instapay': return <CreditCard size={18} className="text-purple-600" />;
      case 'wallet': return <Smartphone size={18} className="text-blue-600" />;
      default: return <Banknote size={18} className="text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">الخزنة والمصروفات</h2>
        <p className="text-slate-500 text-sm md:text-base">إدارة السيولة النقدية والمحافظ الإلكترونية</p>
      </header>

      {/* Main Total Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">الرصيد الكلي (جميع الخزائن)</p>
                <p className="text-4xl font-bold tracking-tight">{stats.total.balance.toLocaleString()} <span className="text-lg font-normal text-slate-500">ج.م</span></p>
            </div>
             <div className="flex gap-6 text-sm">
                <div>
                    <span className="block text-slate-500 text-xs">إجمالي الوارد</span>
                    <span className="text-emerald-400 font-bold">+{stats.total.income.toLocaleString()}</span>
                </div>
                <div>
                    <span className="block text-slate-500 text-xs">إجمالي المصروفات</span>
                    <span className="text-red-400 font-bold">-{stats.total.expenses.toLocaleString()}</span>
                </div>
             </div>
          </div>
          <Vault className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-800 opacity-50" size={80} />
      </div>

      {/* Specific Safe Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Cash Safe */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-emerald-50 rounded-lg"><Banknote className="text-emerald-600" size={20} /></div>
             <h3 className="font-bold text-slate-700">خزنة الكاش</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-2">{stats.cash.balance.toLocaleString()} ج.م</p>
          <div className="flex justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
            <span>د: <span className="text-emerald-600">+{stats.cash.income}</span></span>
            <span>خ: <span className="text-red-600">-{stats.cash.expenses}</span></span>
          </div>
        </div>

        {/* InstaPay */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-purple-50 rounded-lg"><CreditCard className="text-purple-600" size={20} /></div>
             <h3 className="font-bold text-slate-700">انستا باي</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-2">{stats.instapay.balance.toLocaleString()} ج.م</p>
          <div className="flex justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
            <span>د: <span className="text-emerald-600">+{stats.instapay.income}</span></span>
            <span>خ: <span className="text-red-600">-{stats.instapay.expenses}</span></span>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2 bg-blue-50 rounded-lg"><Smartphone className="text-blue-600" size={20} /></div>
             <h3 className="font-bold text-slate-700">محفظة إلكترونية</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-2">{stats.wallet.balance.toLocaleString()} ج.م</p>
          <div className="flex justify-between text-xs text-slate-500 border-t border-slate-50 pt-2">
            <span>د: <span className="text-emerald-600">+{stats.wallet.income}</span></span>
            <span>خ: <span className="text-red-600">-{stats.wallet.expenses}</span></span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => openForm('deposit')}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Plus size={20} />
          إيداع جديد
        </button>
        <button 
          onClick={() => openForm('expense')}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all"
        >
          <ArrowDownCircle size={20} />
          تسجيل مصروف
        </button>
      </div>

      {/* Add Transaction Modal/Form Area */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10 md:zoom-in duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden"></div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              {formType === 'deposit' ? 'إيداع جديد' : 'تسجيل مصروف'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">نوع الخزنة</label>
                <div className="flex gap-2">
                   {(['cash', 'instapay', 'wallet'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, safeType: type})}
                        className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
                            formData.safeType === type 
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {getSafeLabel(type)}
                      </button>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">المبلغ</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-semibold"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">التاريخ</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">التصنيف (اختياري)</label>
                <input 
                  type="text" 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder={formType === 'deposit' ? 'مثال: زيادة رأس مال' : 'مثال: إيجار، كهرباء'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">ملاحظات (اختياري)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  rows={2}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className={`flex-1 py-3.5 px-4 text-white rounded-xl font-bold shadow-lg transition-colors ${
                    formType === 'deposit' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4">
            {/* Type Tabs */}
            <div className="flex w-full xl:w-auto p-1 bg-slate-100 rounded-xl order-2 xl:order-1">
                <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 xl:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                الكل
                </button>
                <button 
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 xl:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'deposit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                >
                الوارد
                </button>
                <button 
                onClick={() => setActiveTab('expense')}
                className={`flex-1 xl:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-600'}`}
                >
                المصروفات
                </button>
            </div>

            {/* Safe Filter */}
            <div className="flex items-center gap-2 w-full xl:w-auto order-1 xl:order-2">
                <Filter size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500 whitespace-nowrap">عرض:</span>
                <select 
                    value={safeFilter}
                    onChange={(e) => setSafeFilter(e.target.value as any)}
                    className="flex-1 xl:w-48 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 outline-none font-medium"
                >
                    <option value="all">جميع الخزائن</option>
                    <option value="cash">خزنة كاش</option>
                    <option value="instapay">انستا باي</option>
                    <option value="wallet">محفظة إلكترونية</option>
                </select>
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">الخزنة</th>
                <th className="px-6 py-4">التصنيف</th>
                <th className="px-6 py-4">الوصف</th>
                <th className="px-6 py-4">المبلغ</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Vault className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    لا توجد معاملات مسجلة في هذا القسم.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 text-sm font-medium">{t.date}</td>
                    <td className="px-6 py-4">
                      {t.type === 'deposit' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                          <ArrowUpCircle size={14} /> وارد
                        </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-100">
                          <ArrowDownCircle size={14} /> مصروف
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                            {getSafeIcon(t.safeType)}
                            {getSafeLabel(t.safeType)}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-medium text-sm">{t.category}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate">{t.description || '-'}</td>
                    <td className={`px-6 py-4 font-bold text-base ${t.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button 
                        onClick={() => {
                          if(window.confirm('هل أنت متأكد من حذف هذا السجل؟')) onDeleteTransaction(t.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};