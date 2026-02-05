export interface Lead {
  id: number | string; // String manuaalisille, number APIsta
  name: string;
  url: string;
  status: string; // "NO WEBSITE", "MOBILE FRIENDLY" jne.
  address: string;
  phone?: string;
  discovery_method?: string;
}

// Laajennettu versio tallennetulle liidille
export interface SavedLead extends Lead {
  pipelineStatus: 'New' | 'Contacted' | 'Meeting' | 'Deal' | 'Lost';
  notes: string;
  savedAt: string;
}