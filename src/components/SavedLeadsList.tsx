import React from 'react';
import type { SavedLead } from '../types';
import { Phone, ExternalLink, Trash2, MessageSquare, Calendar } from 'lucide-react';

interface Props {
  leads: SavedLead[];
  onUpdateStatus: (id: string | number, status: SavedLead['pipelineStatus']) => void;
  onUpdateNotes: (id: string | number, notes: string) => void;
  onDelete: (id: string | number) => void;
}

const statusColors = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'Contacted': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Meeting': 'bg-purple-50 text-purple-700 border-purple-200',
  'Deal': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Lost': 'bg-slate-100 text-slate-500 border-slate-200',
};

const SavedLeadsList: React.FC<Props> = ({ leads, onUpdateStatus, onUpdateNotes, onDelete }) => {
  if (leads.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
        <p className="text-slate-400">Ei tallennettuja liidejä vielä.</p>
        <p className="text-sm text-slate-400">Etsi hakutoiminnolla tai lisää manuaalisesti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <div key={lead.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Vasen: Perustiedot */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{lead.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar size={12}/> Tallennettu: {new Date(lead.savedAt).toLocaleDateString()}
                  </p>
                </div>
                {/* Status Dropdown */}
                <select 
                  value={lead.pipelineStatus}
                  onChange={(e) => onUpdateStatus(lead.id, e.target.value as any)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer outline-none appearance-none ${statusColors[lead.pipelineStatus]}`}
                >
                  <option value="New">🔹 Uusi</option>
                  <option value="Contacted">🔸 Otettu yhteys</option>
                  <option value="Meeting">📅 Tapaaminen</option>
                  <option value="Deal">💰 KAUPPA</option>
                  <option value="Lost">💀 Hävisi</option>
                </select>
              </div>

              <div className="space-y-1.5 mt-3">
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-slate-400"/>
                    {lead.phone || <span className="text-slate-300 italic">Ei numeroa</span>}
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ExternalLink size={14} className="text-slate-400"/>
                    {lead.url && lead.url !== "No Website" ? (
                      <a href={lead.url.startsWith('http') ? lead.url : `http://${lead.url}`} target="_blank" className="hover:text-indigo-600 hover:underline">
                        {lead.url}
                      </a>
                    ) : <span className="text-rose-500 text-xs font-medium">Ei nettisivua</span>}
                 </div>
              </div>
            </div>

            {/* Oikea: Muistiinpanot */}
            <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 relative group">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1.5">
                <MessageSquare size={12}/> Analyysi / Muistiinpanot
              </label>
              <textarea 
                className="w-full bg-transparent text-sm text-slate-700 resize-none outline-none min-h-[80px] placeholder:text-slate-300"
                placeholder="Kirjoita tähän: Miksi nettisivu on huono? Milloin soittaa uudestaan?"
                value={lead.notes}
                onChange={(e) => onUpdateNotes(lead.id, e.target.value)}
              />
            </div>
            
            {/* Poista-nappi */}
            <div className="flex items-center justify-center md:items-start pt-2">
              <button onClick={() => onDelete(lead.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2" title="Poista liidi">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedLeadsList;