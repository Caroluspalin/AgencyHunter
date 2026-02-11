export interface Lead {
  id: number;
  name: string;
  company_name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  status: string; // Backendin status
  source: string;
  notes: string | null;
  google_place_id: string | null;
  url?: string; // Frontendin apukenttä
}

export type PipelineStatus = 'new' | 'contacted' | 'meeting' | 'negotiation' | 'won' | 'lost';

// CRM-näkymän käyttämä laajennettu tyyppi
export interface SavedLead extends Lead {
  pipelineStatus?: PipelineStatus;
  savedAt?: string;
}