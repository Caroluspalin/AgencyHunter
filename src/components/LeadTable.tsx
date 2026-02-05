import React from 'react';
import { ExternalLink, PlusCircle, MapPin, Phone } from 'lucide-react';

interface Lead {
  id: number;
  name: string;
  url: string;
  status: string;
  address: string;
  phone?: string;
  discovery_method?: string;
}

interface LeadTableProps {
  leads: Lead[];
}

const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  // 🛡️ TURVATARKISTUS: Jos leads ei ole lista (esim. virheviesti), näytä tyhjää
  if (!leads || !Array.isArray(leads)) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Ei tuloksia tai virhe haussa.</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Tee haku nähdäksesi tuloksia.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Yritys</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Yhteystiedot</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Nettisivu</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Tila</th>
              <th className="px-6 py-4 text-right font-semibold text-xs text-slate-500 uppercase tracking-wider">Toiminto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{lead.name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin size={10} /> {lead.address}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  {lead.phone ? (
                     <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone size={12} className="text-slate-400"/> {lead.phone}
                     </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Ei numeroa</span>
                  )}
                </td>

                <td className="px-6 py-4 text-sm text-slate-500">
                  {lead.url && lead.url !== "No Website" ? (
                    <a 
                      href={lead.url.startsWith('http') ? lead.url : `http://${lead.url}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-indigo-600 hover:underline"
                    >
                      {new URL(lead.url.startsWith('http') ? lead.url : `http://${lead.url}`).hostname.replace('www.', '')}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <StatusBadge status={lead.status} />
                </td>

                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                    <PlusCircle size={14} />
                    Tallenna
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Apukomponentti tilan väreille
const StatusBadge = ({ status }: { status: string }) => {
  let styles = "bg-slate-100 text-slate-600 border-slate-200";
  
  if (status.includes("NO WEBSITE")) styles = "bg-rose-50 text-rose-700 border-rose-100";
  else if (status.includes("BROKEN")) styles = "bg-orange-50 text-orange-700 border-orange-100";
  else if (status.includes("NOT MOBILE")) styles = "bg-yellow-50 text-yellow-700 border-yellow-100";
  else if (status.includes("MOBILE FRIENDLY")) styles = "bg-emerald-50 text-emerald-700 border-emerald-100";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {status}
    </span>
  );
};

export default LeadTable;