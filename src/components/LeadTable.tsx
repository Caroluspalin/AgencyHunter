import React from 'react';
import { ExternalLink, PlusCircle, CheckCircle, MapPin, Phone } from 'lucide-react';
import type { Lead } from '../types';

interface LeadTableProps {
  leads: Lead[];
  onSave: (lead: Lead) => void;
  savedIds: string[];
}

const LeadTable: React.FC<LeadTableProps> = ({ leads, onSave, savedIds }) => {
  if (!leads || !Array.isArray(leads) || leads.length === 0) return null;

  return (
    <div className="w-full overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase">Yritys</th>
              <th className="px-6 py-4 font-semibold text-xs text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-right font-semibold text-xs text-slate-500 uppercase">Toiminto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead, idx) => {
              const isSaved = savedIds.includes(lead.name); 

              return (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-slate-900">{lead.name}</span>
                    
                    {/* Osoite */}
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={12} className="text-slate-400" /> {lead.address}
                    </span>

                    {/* TÄSSÄ: Nyt käytämme Phone-ikonia puhelinnumeron näyttämiseen */}
                    {lead.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={12} className="text-slate-400" /> {lead.phone}
                        </span>
                    )}

                    {/* Nettisivu */}
                    {lead.url && lead.url !== "No Website" && (
                        <a href={lead.url.startsWith('http') ? lead.url : `http://${lead.url}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-0.5 flex items-center gap-1 w-fit">
                           <ExternalLink size={10}/> {lead.url}
                        </a>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 align-top pt-5">
                   <StatusBadge status={lead.status} />
                </td>

                <td className="px-6 py-4 text-right align-top pt-4">
                  {isSaved ? (
                    <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg cursor-default border border-emerald-100">
                      <CheckCircle size={14} /> Tallennettu
                    </button>
                  ) : (
                    <button 
                      onClick={() => onSave(lead)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                    >
                      <PlusCircle size={14} /> Tallenna
                    </button>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  let styles = "bg-slate-100 text-slate-600 border-slate-200";
  if (status.includes("NO WEBSITE")) styles = "bg-rose-50 text-rose-700 border-rose-100";
  else if (status.includes("BROKEN")) styles = "bg-orange-50 text-orange-700 border-orange-100";
  else if (status.includes("NOT MOBILE")) styles = "bg-yellow-50 text-yellow-700 border-yellow-100";
  else if (status.includes("MOBILE FRIENDLY")) styles = "bg-emerald-50 text-emerald-700 border-emerald-100";
  else if (status.includes("SOCIAL")) styles = "bg-purple-50 text-purple-700 border-purple-100";
  
  return <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${styles}`}>{status}</span>;
};

export default LeadTable;