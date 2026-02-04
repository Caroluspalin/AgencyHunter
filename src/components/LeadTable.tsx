import React from 'react';
import { ExternalLink, PlusCircle } from 'lucide-react';

// Määritellään samat tyypit
interface Lead {
  id: number;
  name: string;
  url: string;
  status: string;
}

interface Props {
  leads: Lead[];
}

// Komponentti ottaa nyt vastaan "leads"-listan
const LeadTable: React.FC<Props> = ({ leads }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Company</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Website</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                Ei tuloksia haulla.
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{lead.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    {lead.url} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'Mobile Friendly' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-2 text-slate-700 hover:text-indigo-600 font-medium text-sm">
                    <PlusCircle size={16} /> Save Lead
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;