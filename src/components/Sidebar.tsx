import React from 'react';
import { Search, LayoutDashboard, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: 'search' | 'crm';
  setActiveTab: (tab: 'search' | 'crm') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'search', icon: Search, label: 'Etsi Liidejä' },
    { id: 'crm', icon: LayoutDashboard, label: 'Omat Liidit' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs">AH</span>
          </div>
          <span className="text-slate-900">Agency Hunter</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as 'search' | 'crm')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === item.id 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
            AH
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Myyjä</p>
            <p className="text-xs text-slate-500 truncate">Admin</p>
          </div>
          <LogOut size={16} className="text-slate-400" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;