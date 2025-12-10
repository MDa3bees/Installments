import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlusCircle, Users, FileText, Vault, WifiOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedPlanId: string | null; // New prop
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, selectedPlanId }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed right-0 top-0 overflow-y-auto z-50 shadow-xl border-l border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-emerald-400">أقساطي</span> برو
          </h1>
          <p className="text-slate-400 text-xs mt-1">نظام إدارة ذكي</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === 'dashboard' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'animate-pulse-slow' : ''} />
            <span className="font-medium">لوحة المعلومات</span>
          </button>
          
          <button
            onClick={() => onTabChange('new-plan')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === 'new-plan' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlusCircle size={20} />
            <span className="font-medium">حساب قسط جديد</span>
          </button>

          <button
            onClick={() => onTabChange('treasury')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === 'treasury' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Vault size={20} />
            <span className="font-medium">الخزنة والمصروفات</span>
          </button>

          <button
            onClick={() => onTabChange('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === 'customers' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={20} />
            <span className="font-medium">العملاء</span>
          </button>
          
          {selectedPlanId && (
            <div className="mt-4 pt-4 border-t border-slate-800">
                <button
                onClick={() => onTabChange('installment-details')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === 'installment-details' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                >
                <FileText size={20} />
                <span className="font-medium">تفاصيل قسط</span>
                </button>
            </div>
          )}
        </nav>
        
        {/* Desktop Offline Indicator */}
        {!isOnline && (
          <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-xs">
            <WifiOff size={16} />
            <span>وضع عدم الاتصال</span>
          </div>
        )}

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          © 2024 Installment Master
        </div>
      </aside>

      {/* Mobile Top Header (Minimal) */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900/95 backdrop-blur-sm text-white z-40 px-4 py-3 shadow-md flex items-center justify-between border-b border-slate-800">
         <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="text-emerald-400">أقساطي</span> برو
         </h1>
         {!isOnline && <WifiOff size={18} className="text-red-400" />}
      </div>

      {/* Mobile Bottom Navigation (Tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 z-50 flex justify-around items-center pb-safe-area pt-1 px-1 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
         <button 
            onClick={() => onTabChange('dashboard')} 
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                activeTab === 'dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
         >
            <LayoutDashboard size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">الرئيسية</span>
         </button>

         <button 
            onClick={() => onTabChange('new-plan')} 
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                activeTab === 'new-plan' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
         >
            <PlusCircle size={22} strokeWidth={activeTab === 'new-plan' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">جديد</span>
         </button>

         <button 
            onClick={() => onTabChange('treasury')} 
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                activeTab === 'treasury' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
         >
            <Vault size={22} strokeWidth={activeTab === 'treasury' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">الخزنة</span>
         </button>

         <button 
            onClick={() => onTabChange('customers')} 
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                activeTab === 'customers' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
            }`}
         >
            <Users size={22} strokeWidth={activeTab === 'customers' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">العملاء</span>
         </button>

         {selectedPlanId && (
            <button 
                onClick={() => onTabChange('installment-details')} 
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                    activeTab === 'installment-details' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'
                }`}
            >
                <FileText size={22} strokeWidth={activeTab === 'installment-details' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">التفاصيل</span>
            </button>
         )}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:mr-64 p-4 md:p-8 mt-14 md:mt-0 mb-20 md:mb-0 w-full overflow-x-hidden">
        {/* Offline Banner (Mobile/Tablet) */}
        {!isOnline && (
           <div className="md:hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm font-medium">
             <WifiOff size={18} />
             <span>أنت في وضع عدم الاتصال (Offline)</span>
           </div>
        )}
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};