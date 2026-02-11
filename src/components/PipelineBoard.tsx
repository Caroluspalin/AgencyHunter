import { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Lead } from '../types';

// Määritellään sarakkeet
const COLUMNS = [
  { id: 'new', title: '🆕 Uusi' },
  { id: 'contacted', title: '📞 Soitettu' },
  { id: 'meeting', title: '🤝 Tapaaminen' },
  { id: 'negotiation', title: '💰 Neuvottelu' },
  { id: 'won', title: '✅ Kauppa' },
  { id: 'lost', title: '❌ Hävinnyt' },
];

// Yksittäinen liidikortti
function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id.toString(),
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 mb-2 rounded shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-shadow"
    >
      <div className="font-bold text-gray-800">{lead.company_name || lead.name}</div>
      <div className="text-xs text-gray-500 mt-1 truncate">{lead.address}</div>
      {lead.phone && <div className="text-xs text-blue-600 mt-1">📞 {lead.phone}</div>}
    </div>
  );
}

// Sarake (droppable area)
function Column({ id, title, leads }: { id: string, title: string, leads: Lead[] }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[250px] bg-gray-50 rounded-lg p-2 mx-1 flex flex-col h-full">
      <h3 className="font-semibold text-gray-700 mb-3 text-center uppercase text-sm tracking-wide">
        {title} <span className="text-gray-400 font-normal">({leads.length})</span>
      </h3>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px]">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

// Pääkomponentti
export default function PipelineBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Hae liidit tietokannasta
  const fetchLeads = async () => {
    try {
      const res = await fetch('http://localhost:8000/leads/');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // 2. Kun kortti pudotetaan
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const leadId = parseInt(active.id as string);
    const newStatus = over.id as string;

    // Päivitä UI heti (optimistinen päivitys)
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus as any } : l))
    );

    // Päivitä tietokanta
    try {
      await fetch(`http://localhost:8000/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchLeads(); // Peruuta muutos jos virhe
    }
  };

  if (loading) return <div className="p-10">Ladataan myyntiputkea...</div>;

  return (
    <div className="h-full flex overflow-x-auto p-4 pb-10">
      <DndContext onDragEnd={handleDragEnd}>
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            leads={leads.filter((l) => l.status === col.id)}
          />
        ))}
      </DndContext>
    </div>
  );
}