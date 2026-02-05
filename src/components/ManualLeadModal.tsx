import React, { useState } from 'react';
import { X, Save, Building2, Globe, MapPin, Phone } from 'lucide-react';
import type { Lead } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id'>) => void;
}

const ManualLeadModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    address: '',
    phone: '',
    status: 'NO WEBSITE 🔴' // Oletus: Jos lisäät käsin, varmaan nettisivu puuttuu
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    setFormData({ name: '', url: '', address: '', phone: '', status: 'NO WEBSITE 🔴' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Lisää liidi manuaalisesti</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yrityksen nimi</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input required type="text" className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Esim. Rakennus Oy" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nettisivu (valinnainen)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="www.esimerkki.fi" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Puhelin</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input type="text" className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="040..." />
              </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Tila</label>
               <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                 value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                 <option value="NO WEBSITE 🔴">Ei nettisivua</option>
                 <option value="BROKEN WEBSITE 🔴">Rikki</option>
                 <option value="SOCIAL ONLY 🟡">Vain Some</option>
                 <option value="MOBILE FRIENDLY 🟢">Kunnossa</option>
               </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kaupunki / Osoite</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Tampere" />
            </div>
          </div>

          <button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Save size={18} /> Tallenna Liidi
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualLeadModal;