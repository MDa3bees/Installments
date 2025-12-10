import React, { useMemo, useState } from 'react';
import { InstallmentPlan } from '../types';
// Add AlertCircle to the import list
import { TrendingUp, Users, Wallet, CheckCircle, Clock, AlertCircle, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface DashboardProps {
  plans: InstallmentPlan[];
  onViewDetails: (planId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ plans, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paid' | 'overdue'>('all');

  const stats = useMemo(() => {
    return plans.reduce((acc, plan) => {
      acc.totalProfit += plan.intermediaryProfit;
      acc.totalRevenue += plan.totalPriceToCustomer;
      acc.activeCount += 1;
      acc.totalReceivables += plan.remainingBalance;
      return acc;
    }, { totalProfit: 0, totalRevenue: 0, activeCount: 0, totalReceivables: 0 });
  }, [plans]);

  // Data for chart: Last 5 plans profitability
  const chartData = useMemo(() => {
    return plans.slice(0, 7).map(p => ({
      name: p.customerName.split(' ')[0], // First name only
      profit: Math.round(p.intermediaryProfit),
      total: Math.round(p.totalPriceToCustomer)
    })).reverse();
  }, [plans]);

  const filteredPlans = useMemo(() => {
    let currentPlans = plans;

    if (searchTerm) {
      currentPlans = currentPlans.filter(plan => 
        plan.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      currentPlans = currentPlans.filter(plan => plan.status === filterStatus);
    }
    
    return currentPlans;
  }, [plans, searchTerm, filterStatus]);

  const getStatusBadge = (status: InstallmentPlan['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">
            <Clock size={14} /> نشط
          </span>
        );
      case 'paid':
        return (
          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle size={14} /> مدفوع
          </span>
        );
      case 'overdue':
        return (
          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
            <AlertCircle size={14} /> متأخر
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">لوحة المعلومات</h2>
        <p className="text-slate-500">نظرة عامة على أداء المبيعات والأرباح</p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">صافي الأرباح (للوسيط)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalProfit.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">إجمالي المستحقات</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalReceivables.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <Wallet size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">العقود النشطة</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.activeCount}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">تحليل آخر العمليات</h3>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} />
              <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{fill: '#f1f5f9'}}
              />
              <Legend />
              <Bar name="إجمالي المبلغ" dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar name="الربح" dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-slate-800">أحدث الأقساط المضافة</h3>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto flex-grow">
              <input 
                type="text" 
                placeholder="بحث باسم العميل..." 
                className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <select
              className="w-full md:w-auto p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'paid' | 'overdue')}
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="paid">مدفوع</option>
              <option value="overdue">متأخر</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">المنتج</th>
                <th className="px-6 py-4">القسط الشهري</th>
                <th className="px-6 py-4">الربح</th>
                <th className="px-6 py-4">الرصيد المتبقي</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    لا توجد بيانات حالياً تتطابق مع معايير البحث.
                  </td>
                </tr>
              ) : (
                filteredPlans.map(plan => (
                  <tr 
                    key={plan.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onViewDetails(plan.id)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{plan.customerName}</td>
                    <td className="px-6 py-4 text-slate-600">{plan.productName}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{plan.monthlyInstallment.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 text-emerald-600">+{Math.round(plan.intermediaryProfit).toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-blue-700">{Math.round(plan.remainingBalance).toLocaleString()} ج.م</td>
                    <td className="px-6 py-4">{getStatusBadge(plan.status)}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{new Date(plan.startDate).toLocaleDateString('ar-EG')}</td>
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