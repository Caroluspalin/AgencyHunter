import React from 'react';
import { Search as SearchIcon, MapPin } from 'lucide-react';

interface SearchBarProps {
  onSearch: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  return (
    <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
      <div className="flex-1 flex items-center px-4 gap-3 border-r border-slate-100">
        <SearchIcon size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Keyword (e.g. Dentist, Law Firm)" 
          className="w-full py-3 text-sm focus:outline-none bg-transparent"
        />
      </div>
      <div className="flex-1 flex items-center px-4 gap-3">
        <MapPin size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="City (e.g. Helsinki, NY)" 
          className="w-full py-3 text-sm focus:outline-none bg-transparent"
        />
      </div>
      <button 
        onClick={onSearch}
        disabled={isLoading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-70"
      >
        {isLoading ? "Searching..." : "Search Leads"}
      </button>
    </div>
  );
};

export default SearchBar;