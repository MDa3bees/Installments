import React, { useState, useEffect } from 'react';
import { Customer, InstallmentPlan, Transaction } from '../types';
import { analyzeInstallmentPlan } from '../services/ai';
import { Calculator, Save, Wand2, UserPlus, CheckCircle, AlertTriangle, CreditCard, Wallet, Banknote, ShieldAlert, ShieldCheck, Ban, Star, Shield } from 'lucide-react';

interface Props {
  customers: Customer[];
  onSave: (plan: InstallmentPlan, customer: Customer | null, initialTransaction: Transaction | null, downPaymentTransaction: Transaction | null) => void;
}

// Helper to format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to calculate due date by adding months to a start date
const calculateDueDate = (start: string, months: number): string => {
  const startDateObj = new Date(start + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
  startDateObj.setMonth(startDateObj.getMonth() + months);
  return formatDate(startDateObj);
};

export const NewInstallment: React.FC<Props> = ({ customers, onSave }) => {
  // Customer Selection State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', nationalId: '' });

  // Calculation State
  const [form, setForm] = useState({
    productName: 'iphone',
    basePrice: 10000,
    sellerPercentage: 30, // Default 30%
    customerPercentage: 40, // Default 40%
    downPayment: 0,
    months: 12,
    startDate: formatDate(new Date()), // New: Start date
    notes: '', // New: General notes for the plan
    purchaseSafe: 'cash' as 'cash' | 'instapay' | 'wallet', // Where did we buy the product from?
    downPaymentSafe: 'cash' as 'cash' | 'instapay' | 'wallet', // Where did we receive the down payment?
  });

  // Results State
  const [results, setResults] = useState<{
    costBasis: number;
    totalPrice: number;
    profit: number;
    remaining: number;
    monthly: number;
  } | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Get Selected Customer Object
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  // Auto Calculate Effect
  useEffect(() => {
    const costBasis = form.basePrice * (1 + form.sellerPercentage / 100);
    const totalPrice = form.basePrice * (1 + form.customerPercentage / 100);
    const profit = totalPrice - costBasis;
    const remaining = totalPrice - form.downPayment;
    const monthly = form.months > 0 ? remaining / form.months : 0;
    
    setResults({
      costBasis,
      totalPrice,
      profit,
      remaining,
      monthly,
    });
  }, [form]);

  // Handlers
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'new') {
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setCustomerForm({ name: '', phone: '', nationalId: '' });
    } else {
      setIsNewCustomer(false);
      setSelectedCustomerId(val);
      const cust = customers.find(c => c.id === val);
      if (cust) {
        setCustomerForm(cust);
      }
    }
  };

  const handleAiAnalysis = async () => {
    if (!results) return;
    setLoadingAi(true);
    const analysis = await analyzeInstallmentPlan({
      ...form,
      intermediaryProfit: results.profit,
      monthlyInstallment: results.monthly
    });
    setAiAnalysis(analysis);
    setLoadingAi(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!results) return;

    // Check blocked status
    if (selectedCustomerObj?.status === 'blocked') {
      if (!window.confirm("تحذير: هذا العميل محظور! هل أنت متأكد أنك تريد المتابعة؟")) {
        return;
      }
    }

    // Prepare Customer Data
    let finalCustomer: Customer | null = null;
    let finalCustomerId = selectedCustomerId;
    let finalCustomerName = '';

    if (isNewCustomer) {
        if(!customerForm.name || !customerForm.phone) {
            alert("يرجى إدخال بيانات العميل");
            return;
        }
      finalCustomerId = crypto.randomUUID();
      finalCustomerName = customerForm.name;
      finalCustomer = { ...customerForm, id: finalCustomerId, status: 'average' }; // Default status
    } else {
      const existing = customers.find(c => c.id === selectedCustomerId);
      if (existing) {
        finalCustomerName = existing.name;
      } else {
          alert("يرجى اختيار عميل");
          return;
      }
    }

    const dueDate = calculateDueDate(form.startDate, form.months); // Calculate due date
    const planId = crypto.randomUUID();

    const newPlan: InstallmentPlan = {
      id: planId,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      productName: form.productName,
      basePrice: form.basePrice,
      sellerPercentage: form.sellerPercentage,
      customerPercentage: form.customerPercentage,
      totalCostToIntermediary: results.costBasis,
      totalPriceToCustomer: results.totalPrice,
      intermediaryProfit: results.profit,
      downPayment: form.downPayment,
      months: form.months,
      monthlyInstallment: results.monthly,
      startDate: form.startDate, // Use the selected start date
      dueDate: dueDate, // Include the calculated due date
      notes: form.notes, // Include the general notes
      aiAnalysis: aiAnalysis,
      payments: [], // Initialize payments
      remainingBalance: results.remaining, // Initialize remaining balance
      status: 'active', // Set initial status
    };

    // 1. Transaction: DEDUCT BASE PRICE from Safe (Purchase Cost)
    const initialTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: formatDate(new Date()),
      amount: form.basePrice,
      type: 'expense', // Expense = Buying the product
      category: 'شراء بضاعة',
      description: `شراء جهاز (${form.productName}) للعميل ${finalCustomerName}`,
      relatedPlanId: planId,
      safeType: form.purchaseSafe
    };

    // 2. Transaction: DEPOSIT DOWN PAYMENT (if exists)
    let downPaymentTransaction: Transaction | null = null;
    if (form.downPayment > 0) {
      downPaymentTransaction = {
        id: crypto.randomUUID(),
        date: formatDate(new Date()),
        amount: form.downPayment,
        type: 'deposit',
        category: 'مقدم قسط',
        description: `مقدم جهاز (${form.productName}) - ${finalCustomerName}`,
        relatedPlanId: planId,
        safeType: form.downPaymentSafe
      };
    }

    onSave(newPlan, finalCustomer, initialTransaction, downPaymentTransaction);
    alert("تم حفظ العملية بنجاح!");
    
    // Reset slightly
    setAiAnalysis('');
    setForm(prev => ({ 
        ...prev, 
        productName: '', 
        basePrice: 0, 
        downPayment: 0, 
        months: 12, 
        startDate: formatDate(new Date()), 
        notes: '',
    }));
    setSelectedCustomerId('');
    setIsNewCustomer(false);
    setCustomerForm({ name: '', phone: '', nationalId: '' });
  };

  const getSafeLabel = (type: string) => {
    switch(type) {
      case 'cash': return 'خزنة كاش';
      case 'instapay': return 'انستا باي';
      case 'wallet': return 'محفظة إلكترونية';
      default: return type;
    }
  };

  // Helper for feedback alert styling
  const getFeedbackAlert = (status: string | undefined, feedback: string | undefined) => {
    if (!status && !feedback) return null;

    let bgClass = "bg-slate-50 border-slate-200 text-slate-700";
    let icon = <Shield size={24} />;
    let title = "تقييم العميل";

    switch (status) {
      case 'trustworthy':
        bgClass = "bg-purple-50 border-purple-200 text-purple-800";
        icon = <Star className="text-purple-600" size={24} fill="currentColor" />;
        title = "عميل VIP (ممتاز)";
        break;
      case 'good':
        bgClass = "bg-emerald-50 border-emerald-200 text-emerald-800";
        icon = <ShieldCheck className="text-emerald-600" size={24} />;
        title = "عميل ملتزم";
        break;
      case 'bad':
        bgClass = "bg-orange-50 border-orange-200 text-orange-800";
        icon = <ShieldAlert className="text-orange-600" size={24} />;
        title = "عميل مماطل / سيء";
        break;
      case 'blocked':
        bgClass = "bg-red-50 border-red-200 text-red-800";
        icon = <Ban className="text-red-600" size={24} />;
        title = "عميل محظور (Blacklist)";
        break;
      default:
        bgClass = "bg-blue-50 border-blue-200 text-blue-800";
        icon = <Shield className="text-blue-600" size={24} />;
        title = "عميل عادي";
    }

    return (
      <div className={`mt-4 p-4 rounded-xl border ${bgClass} flex items-start gap-3 animate-in fade-in slide-in-from-top-2`}>
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div>
          <h4 className="font-bold">{title}</h4>
          {feedback && <p className="text-sm mt-1 opacity-90">{feedback}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
      {/* Form Side */}
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">قسط جديد</h2>
          <p className="text-slate-500 text-sm md:text-base">أدخل البيانات لحساب الأرباح والأقساط</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          
          {/* Customer Section */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              <UserPlus size={20} className="text-emerald-600"/> بيانات العميل
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">اختيار عميل</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={isNewCustomer ? 'new' : selectedCustomerId}
                onChange={handleCustomerSelect}
              >
                <option value="">-- اختر عميل مسجل --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
                <option value="new" className="font-bold text-emerald-600">+ عميل جديد</option>
              </select>
            </div>

            {/* CUSTOMER FEEDBACK ALERT */}
            {selectedCustomerObj && !isNewCustomer && getFeedbackAlert(selectedCustomerObj.status, selectedCustomerObj.feedback)}

            {(isNewCustomer || selectedCustomerId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-500 mb-2">اسم العميل</label>
                  <input 
                    type="text" 
                    required 
                    disabled={!isNewCustomer}
                    value={customerForm.name}
                    onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl disabled:bg-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-2">رقم الهاتف</label>
                  <input 
                    type="tel" 
                    required 
                    disabled={!isNewCustomer}
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl disabled:bg-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-2">رقم البطاقة (اختياري)</label>
                  <input 
                    type="text" 
                    disabled={!isNewCustomer}
                    value={customerForm.nationalId}
                    onChange={e => setCustomerForm({...customerForm, nationalId: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-xl disabled:bg-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
              <Calculator size={20} className="text-emerald-600"/> تفاصيل المنتج والسعر
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">اسم المنتج</label>
              <input 
                type="text" 
                value={form.productName}
                onChange={e => setForm({...form, productName: e.target.value})}
                placeholder="مثال: ايفون 15 برو ماكس"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">السعر الأصلي</label>
                <input 
                  type="number" 
                  value={form.basePrice}
                  onChange={e => setForm({...form, basePrice: Number(e.target.value)})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">المدة (شهر)</label>
                <input 
                  type="number" 
                  value={form.months}
                  onChange={e => setForm({...form, months: Number(e.target.value)})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Purchase Safe Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">شراء الجهاز من خزنة:</label>
              <div className="flex gap-2">
                {(['cash', 'instapay', 'wallet'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({...form, purchaseSafe: type})}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      form.purchaseSafe === type 
                      ? 'bg-slate-800 text-white border-slate-800' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {getSafeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">نسبة البائع %</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={form.sellerPercentage}
                    onChange={e => setForm({...form, sellerPercentage: Number(e.target.value)})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">نسبة العميل %</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={form.customerPercentage}
                    onChange={e => setForm({...form, customerPercentage: Number(e.target.value)})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">المقدم (دفعة أولى)</label>
                <input 
                  type="number" 
                  value={form.downPayment}
                  onChange={e => setForm({...form, downPayment: Number(e.target.value)})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              {form.downPayment > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">استلام المقدم في:</label>
                  <div className="flex gap-2">
                    {(['cash', 'instapay', 'wallet'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({...form, downPaymentSafe: type})}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                          form.downPaymentSafe === type 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {getSafeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">تاريخ البداية</label>
              <input 
                type="date" 
                value={form.startDate}
                onChange={e => setForm({...form, startDate: e.target.value})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">ملاحظات (اختياري)</label>
              <textarea 
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="أضف أي ملاحظات مهمة..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-y transition-all"
              ></textarea>
            </div>

             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
              <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm font-bold text-orange-800">تنبيه الخزنة</p>
                <p className="text-xs text-orange-600 mt-1 leading-relaxed">
                  سيتم <strong>خصم {form.basePrice.toLocaleString()} ج.م</strong> من ({getSafeLabel(form.purchaseSafe)}) تكلفة شراء.
                  {form.downPayment > 0 && (
                     <span className="block mt-1">وسيتم <strong>إيداع {form.downPayment.toLocaleString()} ج.م</strong> مقدم في ({getSafeLabel(form.downPaymentSafe)}).</span>
                  )}
                </p>
              </div>
            </div>

          </div>
          
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            حفظ العملية
          </button>
        </form>
      </div>

      {/* Results Side */}
      <div className="space-y-6">
        {results && (
          <>
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500 blur-3xl opacity-20 -translate-x-10 -translate-y-10"></div>
              
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="text-emerald-400" />
                ملخص الحساب
              </h3>

              <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                  <span className="text-slate-400 text-sm">سعر البيع (الإجمالي)</span>
                  <span className="text-2xl font-bold text-white tracking-tight">{results.totalPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                  <span className="text-slate-400 text-sm">المتبقي (بعد المقدم)</span>
                  <span className="text-xl font-semibold text-slate-200">{results.remaining.toLocaleString()}</span>
                </div>

                <div className="bg-emerald-900/40 p-5 rounded-xl border border-emerald-500/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-emerald-300 font-medium">القسط الشهري</span>
                    <span className="text-xs text-emerald-400/70 bg-emerald-900/50 px-2 py-1 rounded-full">{form.months} شهر</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {Math.round(results.monthly).toLocaleString()} <span className="text-sm font-normal text-emerald-500/80">ج.م</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <div className="text-sm">
                        <span className="block text-slate-500 text-xs mb-1">التكلفة الأساسية</span>
                        <span className="font-mono text-slate-300">{results.costBasis.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-emerald-400 text-xs mb-1">صافي الربح</span>
                        <span className="font-bold text-xl text-emerald-400">+{results.profit.toLocaleString()}</span>
                    </div>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Wand2 size={20} className="text-purple-600" />
                  المحلل الذكي
                </h3>
                <button 
                  onClick={handleAiAnalysis}
                  disabled={loadingAi}
                  className="text-xs bg-purple-50 text-purple-700 px-4 py-2 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50 font-medium"
                >
                  {loadingAi ? 'جاري التحليل...' : 'تحليل العملية'}
                </button>
              </div>

              {aiAnalysis ? (
                <div className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  اضغط على تحليل للحصول على تقييم للمخاطر والأرباح
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};