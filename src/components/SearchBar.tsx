import React, { useState } from 'react';
import { Search as SearchIcon, MapPin } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');

  const handleSearch = () => {
    // Yhdistetään hakusana ja kaupunki yhdeksi pötköksi
    // Esim: "Hammaslääkäri" + "Tampere" -> "Hammaslääkäri Tampere"
    const term = `${keyword} ${city}`.trim();
    if (term) {
      onSearch(term);
    }
  };

  return (
    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
      {/* KEYWORD INPUT */}
      <div className="flex-1 flex items-center px-4 gap-3 border-r border-slate-100">
        <SearchIcon size={18} className="text-slate-400" />
        <input 
          type="text" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Keyword (e.g. Dentist, Law Firm)" 
          className="w-full py-3 text-sm focus:outline-none bg-transparent"
        />
      </div>

      {/* CITY INPUT - NYT TOIMII! */}
      <div className="flex-1 flex items-center px-4 gap-3">
        <MapPin size={18} className="text-slate-400" />
        <input 
          type="text" 
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="City (e.g. Helsinki, Tampere)" 
          className="w-full py-3 text-sm focus:outline-none bg-transparent"
        />
      </div>

      <button 
        onClick={handleSearch}
        disabled={isLoading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-70"
      >
        {isLoading ? "Searching..." : "Search Leads"}
      </button>
    </div>
  );
};

export default SearchBar;