import { useState, useEffect } from 'react';
import type { Lead, SavedLead } from '../types';

export const useLeads = () => {
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>(() => {
    // Lataa alussa localStoragesta
    const localData = localStorage.getItem('agencyHunterLeads');
    return localData ? JSON.parse(localData) : [];
  });

  // Tallenna aina kun lista muuttuu
  useEffect(() => {
    localStorage.setItem('agencyHunterLeads', JSON.stringify(savedLeads));
  }, [savedLeads]);

  const saveLead = (lead: Lead) => {
    if (savedLeads.some(l => l.name === lead.name)) return; // Estä duplikaatit

    const newLead: SavedLead = {
      ...lead,
      id: Date.now().toString(), // Uniikki ID
      pipelineStatus: 'New',
      notes: '',
      savedAt: new Date().toISOString()
    };
    setSavedLeads(prev => [newLead, ...prev]);
  };

  const addManualLead = (lead: Omit<Lead, 'id'>) => {
    const newLead: SavedLead = {
      ...lead,
      id: Date.now().toString(),
      pipelineStatus: 'New',
      notes: '',
      savedAt: new Date().toISOString(),
      discovery_method: 'Manual Entry'
    };
    setSavedLeads(prev => [newLead, ...prev]);
  };

  const updateLeadStatus = (id: string | number, status: SavedLead['pipelineStatus']) => {
    setSavedLeads(prev => prev.map(l => l.id == id ? { ...l, pipelineStatus: status } : l));
  };

  const updateLeadNotes = (id: string | number, notes: string) => {
    setSavedLeads(prev => prev.map(l => l.id == id ? { ...l, notes: notes } : l));
  };

  const deleteLead = (id: string | number) => {
    if (confirm("Haluatko varmasti poistaa tämän liidin?")) {
      setSavedLeads(prev => prev.filter(l => l.id != id));
    }
  };

  return { savedLeads, saveLead, addManualLead, updateLeadStatus, updateLeadNotes, deleteLead };
};