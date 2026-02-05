import React, { useState } from 'react';
import { Search, Building2, MapPin, Loader2, Filter } from 'lucide-react';
import LeadTable from './components/LeadTable';

interface Lead {
  id: number;
  name: string;
  url: string;
  status: string;
  address: string;
  phone?: string;
  discovery_method?: string;
}

function App() {
  const [businessType, setBusinessType] = useState('autokorjaamo');
  const [city, setCity] = useState('Tampere');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // UUSI: Filtterin tila
  const [showOpportunitiesOnly, setShowOpportunitiesOnly] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType || !city) {
      setError("Täytä molemmat kentät.");
      return;
    }
    setLoading(true);
    setError('');
    setLeads([]);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/leads?business_type=${encodeURIComponent(businessType)}&city=${encodeURIComponent(city)}`
      );
      if (!response.ok) throw new Error(`Virhe palvelimella: ${response.statusText}`);
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
      setError('Haku epäonnistui. Tarkista backend.');
    } finally {
      setLoading(false);
    }
  };

  // UUSI: Suodatetaan liidit ennen kuin ne annetaan taulukolle
  const filteredLeads = showOpportunitiesOnly
    ? leads.filter(lead => !lead.status.includes("MOBILE FRIENDLY")) // Piilota vihreät
    : leads;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Building2 className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Agency Hunter</span>
          </div>
          <div className="text-xs font-medium px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
            Google Maps API Active
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Toimiala</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Kaupunki</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm shadow-indigo-200 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Haetaan...</> : 'Etsi Liidejä'}
            </button>
          </form>
          
          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
        </div>

        {/* Tulokset ja Filtteri */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-semibold text-slate-800">
                Löydetyt yritykset <span className="text-slate-400 font-normal">({filteredLeads.length})</span>
             </h2>
             {/* UUSI: Toggle-kytkin */}
             <button 
                onClick={() => setShowOpportunitiesOnly(!showOpportunitiesOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${showOpportunitiesOnly ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
             >
                <Filter size={14} />
                {showOpportunitiesOnly ? "Näytetään vain myyntipaikat" : "Näytä kaikki"}
             </button>
          </div>
        </div>

        <LeadTable leads={filteredLeads} />
        
      </main>
    </div>
  );
}

export default App;