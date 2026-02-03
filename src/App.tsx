import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import SearchBar from './components/SearchBar.tsx';
import LeadTable from './components/LeadTable.tsx';

const App: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate API delay
    setTimeout(() => setIsSearching(false), 800);
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 justify-between">
          <h2 className="text-sm font-medium text-slate-500">Dashboard / Search</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">Pro Plan</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Hero Section */}
            <section className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Find Your Next Client</h1>
              <p className="text-slate-500 text-lg">Identify and reach out to local businesses needing optimization.</p>
            </section>

            {/* Search Component */}
            <SearchBar onSearch={handleSearch} isLoading={isSearching} />

            {/* Results Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Results</h3>
                <span className="text-xs text-slate-400">Showing 6 leads found</span>
              </div>
              <LeadTable />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;