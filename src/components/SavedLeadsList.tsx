import { useState } from 'react';
import { Trash2, Phone, Globe, MessageSquare, Edit3, Check } from 'lucide-react';
import type { SavedLead, PipelineStatus } from '../types';

interface SavedLeadsListProps {
  leads: SavedLead[];
  // KORJAUS: Vaihdettu 'string' -> 'PipelineStatus'
  onUpdateStatus: (id: number, status: PipelineStatus) => void;
  onUpdateNotes: (id: number, notes: string) => void;
  onDelete: (id: number) => void;
}

export default function SavedLeadsList({ leads, onUpdateStatus, onUpdateNotes, onDelete }: SavedLeadsListProps) {
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState("");

  const handleNoteEdit = (lead: SavedLead) => {
    setEditingNoteId(lead.id);
    setTempNote(lead.notes || "");
  };

  const saveNote = (id: number) => {
    onUpdateNotes(id, tempNote);
    setEditingNoteId(null);
  };

  // Status-vaihtoehdot
  const statusOptions = [
    { value: 'new', label: 'Uusi', color: 'bg-blue-100 text-blue-800' },
    { value: 'contacted', label: 'Soitettu', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'meeting', label: 'Tapaaminen', color: 'bg-purple-100 text-purple-800' },
    { value: 'won', label: 'Kauppa', color: 'bg-green-100 text-green-800' },
    { value: 'lost', label: 'Hävinnyt', color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yritys</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tila (Pipeline)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yhteystiedot</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Muistiinpanot</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Toiminnot</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
              {/* 1. YRITYS */}
              <td className="px-6 py-4">
                <div className="text-sm font-bold text-slate-900">{lead.company_name}</div>
                <div className="text-xs text-slate-500">{lead.address}</div>
                {lead.source === 'manual' && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-1">MANUAL</span>}
              </td>

              {/* 2. TILA (DROPDOWN) */}
              <td className="px-6 py-4">
                <select 
                  value={lead.status} 
                  // KORJAUS: Pakotetaan HTML-arvo oikeaan tyyppiin "as PipelineStatus"
                  onChange={(e) => onUpdateStatus(lead.id, e.target.value as PipelineStatus)}
                  className="text-xs font-semibold rounded-full px-2 py-1 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 bg-transparent cursor-pointer"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>

              {/* 3. YHTEYSTIEDOT */}
              <td className="px-6 py-4 space-y-1">
                {lead.phone && (
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone size={14} className="mr-2 text-slate-400"/> {lead.phone}
                  </div>
                )}
                {lead.website && (
                   <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                     <Globe size={14} className="mr-2"/> Nettisivut
                   </a>
                )}
              </td>

              {/* 4. MUISTIINPANOT */}
              <td className="px-6 py-4">
                {editingNoteId === lead.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="text-sm border rounded px-2 py-1 w-full"
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveNote(lead.id)}
                    />
                    <button onClick={() => saveNote(lead.id)} className="text-green-600 hover:text-green-700"><Check size={16}/></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleNoteEdit(lead)}>
                    <p className="text-sm text-slate-600 max-w-[200px] truncate">
                      {lead.notes || <span className="text-slate-400 italic">Ei muistiinpanoja...</span>}
                    </p>
                    <Edit3 size={14} className="text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all"/>
                  </div>
                )}
              </td>

              {/* 5. TOIMINNOT */}
              <td className="px-6 py-4 text-right">
                <button 
                  onClick={() => onDelete(lead.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                  title="Poista liidi"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
          
          {leads.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <MessageSquare size={24} className="text-slate-400" />
                  </div>
                  <p className="font-medium">Ei vielä liidejä.</p>
                  <p className="text-sm">Siirry "Etsi Liidejä" -välilehdelle tai lisää uusi manuaalisesti.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}