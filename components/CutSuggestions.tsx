
import React, { useState, useEffect } from 'react';
import { dataProvider } from '../dataProvider';
import { CutSuggestion } from '../types';

interface CutSuggestionsProps {
  onNavigate: (tabId: string) => void;
}

const CutSuggestions: React.FC<CutSuggestionsProps> = ({ onNavigate }) => {
  const [cuts, setCuts] = useState<CutSuggestion[]>([]);

  useEffect(() => {
    const loadCuts = async () => {
      const fetchedCuts = await dataProvider.getCuts();
      // Filter: Must be active AND have an image URL (handling invisible slots)
      setCuts(fetchedCuts.filter(c => c.active && c.imageUrl.trim() !== ''));
    };
    loadCuts();
  }, []);

  const handleSelectCut = (cut: CutSuggestion) => {
    localStorage.setItem('selected_cut', JSON.stringify({
      id: cut.id,
      name: cut.name,
      technical: cut.technicalName
    }));
    onNavigate('schedule');
  };

  return (
    <div className="p-4 pb-24 min-h-screen lg:max-w-6xl lg:mx-auto">
      <div className="text-center mb-8">
        <span className="text-[#B8860B] font-bold tracking-widest uppercase text-xs mb-2 block">Inspiração</span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#2C1A1D] mb-4">Catálogo de Cortes</h2>
        <p className="text-gray-600 max-w-lg mx-auto font-sans text-sm md:text-base">Do clássico ao contemporâneo. Escolha sua referência.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {cuts.length === 0 && <p className="col-span-full text-center text-gray-400 italic">Carregando catálogo...</p>}

        {cuts.map((cut) => (
          <div key={cut.id} className="classic-card bg-white p-2 pb-4 group hover:shadow-xl transition-all duration-500">
            <div className="aspect-[4/5] overflow-hidden mb-3 border border-gray-100 relative">
              <img 
                src={cut.imageUrl} 
                alt={cut.name} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 border-[1px] border-[#B8860B]/20 m-1 pointer-events-none"></div>
            </div>
            
            <div className="text-center px-1">
              <h3 className="font-serif text-base md:text-lg font-bold text-[#2C1A1D] mb-1 leading-tight">{cut.name}</h3>
              <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-widest mb-3 truncate">{cut.technicalName}</p>
              
              <button 
                onClick={() => handleSelectCut(cut)}
                className="w-full classic-btn py-2 text-[10px] font-bold uppercase tracking-[0.1em]"
              >
                Quero Esse
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CutSuggestions;
