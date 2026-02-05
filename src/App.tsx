import React, { useState } from 'react';
import { Search, Building2, MapPin, Loader2, Filter, LayoutDashboard, Plus } from 'lucide-react';
import LeadTable from './components/LeadTable';
import SavedLeadsList from './components/SavedLeadsList.tsx';
import ManualLeadModal from './components/ManualLeadModal';
import { useLeads } from './hooks/useLeads';
import type { Lead } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'crm'>('search');
  const [businessType, setBusinessType] = useState('autokorjaamo');
  const [city, setCity] = useState('Tampere');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOpportunitiesOnly, setShowOpportunitiesOnly] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Käytetään meidän uutta hookia!
  const { savedLeads, saveLead, addManualLead, updateLeadStatus, updateLeadNotes, deleteLead } = useLeads();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/leads?business_type=${encodeURIComponent(businessType)}&city=${encodeURIComponent(city)}`);
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = showOpportunitiesOnly ? leads.filter(lead => !lead.status.includes("MOBILE FRIENDLY")) : leads;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg"><Building2 className="text-white" size={20} /></div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Agency Hunter</span>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button onClick={() => setActiveTab('search')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'search' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Haku
             </button>
             <button onClick={() => setActiveTab('crm')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'crm' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Omat Liidit <span className="bg-slate-200 text-slate-600 text-xs px-1.5 rounded-full">{savedLeads.length}</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* NÄKYMÄ 1: HAKU */}
        {activeTab === 'search' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 ml-1">Toimiala</label>
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" /></div>
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 ml-1">Kaupunki</label>
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={city} onChange={e => setCity(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none" /></div>
                </div>
                <button disabled={loading} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Etsi Liidejä'}
                </button>
              </form>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Hakutulokset <span className="text-slate-400 font-normal">({filteredLeads.length})</span></h2>
              <button onClick={() => setShowOpportunitiesOnly(!showOpportunitiesOnly)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${showOpportunitiesOnly ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600'}`}>
                <Filter size={14} /> {showOpportunitiesOnly ? "Vain myyntipaikat" : "Kaikki"}
              </button>
            </div>

            <LeadTable leads={filteredLeads} onSave={saveLead} savedIds={savedLeads.map(l => l.name)} />
          </div>
        )}

        {/* NÄKYMÄ 2: CRM (OMAT LIIDIT) */}
        {activeTab === 'crm' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                 <LayoutDashboard className="text-indigo-600"/> Työpöytä
               </h2>
               <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm shadow-indigo-200">
                 <Plus size={18}/> Lisää manuaalisesti
               </button>
            </div>
            
            <SavedLeadsList 
              leads={savedLeads} 
              onUpdateStatus={updateLeadStatus} 
              onUpdateNotes={updateLeadNotes} 
              onDelete={deleteLead}
            />
          </div>
        )}
      </main>

      <ManualLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addManualLead} />
    </div>
  );
}

export default App;