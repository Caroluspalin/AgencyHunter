import React, { useState } from 'react';
import { Search, MapPin, Loader2, Filter, Plus } from 'lucide-react';
import LeadTable from './components/LeadTable';
import SavedLeadsList from './components/SavedLeadsList'; // Poistettu .tsx pääte
import ManualLeadModal from './components/ManualLeadModal';
import Sidebar from './components/Sidebar'; // Palautettu Sidebar!
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

  const { savedLeads, saveLead, addManualLead, updateLeadStatus, updateLeadNotes, deleteLead } = useLeads();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/leads?business_type=${encodeURIComponent(businessType)}&city=${encodeURIComponent(city)}`);
      const data = await response.json();
      
      // KORJAUS: Backend palauttaa "website", frontend odottaa "url". Mäpätään ne.
      const mappedData = data.map((item: any) => ({
        ...item,
        url: item.website || "No Website",
      }));
      
      setLeads(mappedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = showOpportunitiesOnly ? leads.filter(lead => !lead.status.includes("MOBILE FRIENDLY")) : leads;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* 1. SIDEBAR PALAUTETTU */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. PÄÄSISÄLTÖ OIKEALLA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
           <h1 className="text-xl font-bold text-slate-900">
             {activeTab === 'search' ? 'Liidien Haku' : 'Omat Liidit & CRM'}
           </h1>
           {activeTab === 'crm' && (
             <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
               <Plus size={16}/> Uusi Liidi
             </button>
           )}
        </header>

        {/* Scrollattava sisältöalue */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* NÄKYMÄ 1: HAKU */}
          {activeTab === 'search' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto">
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
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Etsi'}
                  </button>
                </form>
              </div>

              {leads.length > 0 && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Hakutulokset <span className="text-slate-400 font-normal">({filteredLeads.length})</span></h2>
                    <button onClick={() => setShowOpportunitiesOnly(!showOpportunitiesOnly)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${showOpportunitiesOnly ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600'}`}>
                      <Filter size={14} /> {showOpportunitiesOnly ? "Vain myyntipaikat" : "Kaikki"}
                    </button>
                  </div>
                  <LeadTable leads={filteredLeads} onSave={saveLead} savedIds={savedLeads.map(l => l.name)} />
                </>
              )}
            </div>
          )}

          {/* NÄKYMÄ 2: CRM */}
          {activeTab === 'crm' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto">
              <SavedLeadsList 
                leads={savedLeads} 
                onUpdateStatus={updateLeadStatus} 
                onUpdateNotes={updateLeadNotes} 
                onDelete={deleteLead}
              />
            </div>
          )}
        </div>
      </main>

      <ManualLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addManualLead} />
    </div>
  );
}

export default App;