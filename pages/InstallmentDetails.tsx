import React, { useState, useMemo } from 'react';
import { InstallmentPlan } from '../types';
import { ArrowLeft, Landmark, CalendarDays, Wallet, Banknote, ClipboardList, TrendingUp, DollarSign, PlusCircle, CheckCircle, Clock, Info, Users, Wand2, NotebookText, Trash2, Calendar, Smartphone, CreditCard } from 'lucide-react';

interface InstallmentDetailsProps {
  plan: InstallmentPlan;
  onAddPayment: (planId: string, amount: number, notes: string | undefined, date: string, safeType: 'cash' | 'instapay' | 'wallet') => void;
  onDeletePayment: (planId: string, paymentId: string) => void;
  onDeletePlan: (planId: string) => void;
  onBack: () => void;
}

// Helper to calculate the Nth installment's due date
const getNthInstallmentDueDate = (startDate: string, installmentNumber: number): string => {
  const start = new Date(startDate + 'T00:00:00'); 
  start.setMonth(start.getMonth() + installmentNumber);
  const year = start.getFullYear();
  const month = (start.getMonth() + 1).toString().padStart(2, '0');
  const day = start.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const InstallmentDetails: React.FC<InstallmentDetailsProps> = ({ plan, onAddPayment, onDeletePayment, onDeletePlan, onBack }) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [safeType, setSafeType] = useState<'cash' | 'instapay' | 'wallet'>('cash');

  const handleAddPaymentClick = () => {
    if (plan.status === 'paid') {
      alert("لا يمكن إضافة دفعات إلى قسط مدفوع بالكامل.");
      return;
    }
    if (paymentAmount <= 0) {
      alert("يرجى إدخال مبلغ صحيح للمدفوعات.");
      return;
    }
    if (paymentAmount > plan.remainingBalance) {
      alert("المبلغ المدفوع أكبر من الرصيد المتبقي.");
      return;
    }
    onAddPayment(plan.id, paymentAmount, paymentNotes, paymentDate, safeType); 
    setPaymentAmount(0);
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    // Alert handled by parent
  };

  const handleDeletePaymentClick = (paymentId: string) => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذه الدفعة؟ سيتم خصم المبلغ من الخزنة.")) {
      onDeletePayment(plan.id, paymentId);
    }
  };

  const handleDeleteClick = () => {
    onDeletePlan(plan.id); 
  };

  const getStatusBadge = (status: InstallmentPlan['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full text-sm font-medium">
            <Clock size={16} /> نشط
          </span>
        );
      case 'paid':
        return (
          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium">
            <CheckCircle size={16} /> مدفوع بالكامل
          </span>
        );
      case 'overdue':
        return (
          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-sm font-medium">
            <Info size={16} /> متأخر
          </span>
        );
      default:
        return null;
    }
  };

  const getSafeLabel = (type: string) => {
    switch(type) {
      case 'cash': return 'كاش';
      case 'instapay': return 'انستا';
      case 'wallet': return 'محفظة';
      default: return type;
    }
  };

  const getSafeIcon = (type: string | undefined) => {
    switch(type) {
      case 'instapay': return <CreditCard size={14} className="text-purple-600" />;
      case 'wallet': return <Smartphone size={14} className="text-blue-600" />;
      default: return <Banknote size={14} className="text-emerald-600" />;
    }
  };

  const monthlySummaries = useMemo(() => {
    const summariesMap: { [key: string]: { totalAmount: number; count: number } } = {};

    plan.payments.forEach(payment => {
      const paymentDate = new Date(payment.date);
      const yearMonth = `${paymentDate.getFullYear()}-${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!summariesMap[yearMonth]) {
        summariesMap[yearMonth] = { totalAmount: 0, count: 0 };
      }
      summariesMap[yearMonth].totalAmount += payment.amount;
      summariesMap[yearMonth].count += 1;
    });

    const summaryArray = Object.entries(summariesMap).map(([yearMonth, data]) => ({
      month: yearMonth,
      totalPaid: data.totalAmount,
      averagePaid: data.totalAmount / data.count,
    }));

    summaryArray.sort((a, b) => a.month.localeCompare(b.month));

    return summaryArray;
  }, [plan.payments]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors">
          <ArrowLeft size={20} />
          <span>العودة للوحة المعلومات</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-800">تفاصيل القسط</h2>
      </header>

      {/* Overview Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 border-b md:border-b-0 md:border-l border-slate-100 md:pl-6 pb-6 md:pb-0">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Landmark size={24} className="text-emerald-600"/> {plan.productName}
          </h3>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><CalendarDays size={18} /> تاريخ البدء:</span>
            <span>{new Date(plan.startDate).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><CalendarDays size={18} /> تاريخ آخر قسط:</span>
            <span>{new Date(plan.dueDate).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><ClipboardList size={18} /> مدة القسط:</span>
            <span>{plan.months} شهر</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><Banknote size={18} /> القسط الشهري:</span>
            <span className="font-bold text-lg">{plan.monthlyInstallment.toLocaleString()} ج.م</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><DollarSign size={18} /> سعر البيع للعميل:</span>
            <span className="font-bold text-lg">{plan.totalPriceToCustomer.toLocaleString()} ج.م</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><TrendingUp size={18} /> ربح الوسيط:</span>
            <span className="font-bold text-lg text-emerald-600">+{Math.round(plan.intermediaryProfit).toLocaleString()} ج.م</span>
          </div>
        </div>

        <div className="space-y-4 pt-6 md:pt-0">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Wallet size={24} className="text-purple-600"/> حالة الدفع
          </h3>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><Users size={18} /> العميل:</span>
            <span className="font-bold text-lg">{plan.customerName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><Banknote size={18} /> المقدم:</span>
            <span className="font-bold text-lg">{plan.downPayment.toLocaleString()} ج.م</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><Banknote size={18} /> المدفوع حتى الآن:</span>
            <span className="font-bold text-lg">{(plan.totalPriceToCustomer - plan.remainingBalance).toLocaleString()} ج.م</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><Wallet size={18} /> الرصيد المتبقي:</span>
            <span className="font-bold text-red-600 text-2xl">{plan.remainingBalance.toLocaleString()} ج.م</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><CheckCircle size={18} /> الحالة:</span>
            {getStatusBadge(plan.status)}
          </div>
        </div>
      </div>

      {/* General Notes */}
      {plan.notes && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <NotebookText size={20} className="text-blue-600" />
            ملاحظات عامة
          </h3>
          <div className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-line">
            {plan.notes}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {plan.aiAnalysis && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Wand2 size={20} className="text-purple-600" />
            تحليل المحلل الذكي
          </h3>
          <div className="text-sm leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-line">
            {plan.aiAnalysis}
          </div>
        </div>
      )}

      {/* Add New Payment */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <PlusCircle size={20} className="text-emerald-600" />
          إضافة دفعة جديدة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">تاريخ الدفعة</label>
            <input 
              type="date" 
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              disabled={plan.status === 'paid'}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">مبلغ الدفعة</label>
            <input 
              type="number" 
              value={paymentAmount}
              onChange={e => setPaymentAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              disabled={plan.status === 'paid'}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">طريقة الدفع</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                    onClick={() => setSafeType('cash')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${safeType === 'cash' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    كاش
                </button>
                <button
                    onClick={() => setSafeType('instapay')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${safeType === 'instapay' ? 'bg-white shadow text-purple-700' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    انستا
                </button>
                <button
                    onClick={() => setSafeType('wallet')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${safeType === 'wallet' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:bg-slate-200'}`}
                >
                    محفظة
                </button>
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-600 mb-1">ملاحظات (اختياري)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                placeholder="ملاحظات..."
                className="flex-grow p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                disabled={plan.status === 'paid'}
              />
              <button 
                onClick={handleAddPaymentClick}
                disabled={plan.status === 'paid' || paymentAmount <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>
        </div>
        {plan.status === 'paid' && (
          <p className="text-emerald-600 mt-4 flex items-center gap-2">
            <CheckCircle size={18} /> تم سداد هذا القسط بالكامل.
          </p>
        )}
      </div>

      {/* Monthly Payments Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-orange-600" />
          ملخص الدفعات الشهرية
        </h3>
        {monthlySummaries.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm">
            لا توجد دفعات شهرية لعرضها بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">الشهر</th>
                  <th className="px-6 py-4">إجمالي المبلغ المدفوع</th>
                  <th className="px-6 py-4">متوسط الدفعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlySummaries.map((summary) => (
                  <tr key={summary.month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {new Date(summary.month + '-01').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{summary.totalPaid.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 text-slate-600">{summary.averagePaid.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">سجل الدفعات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">المبلغ</th>
                <th className="px-6 py-4">طريقة الدفع</th>
                <th className="px-6 py-4">الملاحظات</th>
                <th className="px-6 py-4">تاريخ الاستحقاق</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    لا توجد دفعات مسجلة لهذا القسط بعد.
                  </td>
                </tr>
              ) : (
                plan.payments.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{new Date(payment.date).toLocaleDateString('ar-EG')}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">+{payment.amount.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md w-fit">
                             {getSafeIcon(payment.safeType)} {getSafeLabel(payment.safeType || 'cash')}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{payment.notes || '-'}</td>
                    <td className="px-6 py-4 text-slate-500">
                        {getNthInstallmentDueDate(plan.startDate, index + 1)}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeletePaymentClick(payment.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="حذف الدفعة"
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

      {/* Delete Plan Button */}
      <div className="flex justify-start pt-4">
        <button
          onClick={handleDeleteClick}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 size={20} />
          حذف القسط
        </button>
      </div>
    </div>
  );
};