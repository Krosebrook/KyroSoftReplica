/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { GameScenario } from '../types';
import { generateHubGreeting } from '../services/geminiService';

interface GameHubProps {
  onSelectScenario: (scenario: GameScenario) => void;
}

const GameHub: React.FC<GameHubProps> = ({ onSelectScenario }) => {
  const [greeting, setGreeting] = useState("Loading hub data...");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kairo_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    generateHubGreeting().then(setGreeting);
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavs = prev.includes(id) 
        ? prev.filter(f => f !== id) 
        : [...prev, id];
      localStorage.setItem('kairo_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredScenarios = showFavoritesOnly 
    ? SCENARIOS.filter(s => favorites.includes(s.id))
    : SCENARIOS;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-pink-500 selection:text-white overflow-y-auto">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl shadow-lg flex items-center justify-center text-4xl transform -rotate-6 border-4 border-white/10">
              🏗️
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                Kairo-Sim Hub
              </h1>
              <p className="text-slate-400 font-mono text-sm uppercase tracking-widest mt-1">
                Management Simulation Suite
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            {/* Assistant Bubble */}
            <div className="bg-white text-slate-900 px-6 py-4 rounded-3xl rounded-tl-none shadow-xl max-w-xs transform transition-all hover:scale-105">
                <p className="font-bold text-sm md:text-base">"{greeting}"</p>
                <div className="text-[10px] text-slate-400 font-mono mt-1 text-right uppercase tracking-wider">- AI Secretary</div>
            </div>

            {/* Filter Toggle */}
            <button 
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition-all border
                    ${showFavoritesOnly 
                        ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' 
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}
                `}
            >
                <span className={showFavoritesOnly ? "animate-pulse" : ""}>♥</span>
                {showFavoritesOnly ? 'Showing Favorites' : 'Show All'}
            </button>
          </div>
        </header>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.length === 0 && showFavoritesOnly && (
              <div className="col-span-full py-20 text-center text-slate-500 italic">
                  No favorite scenarios yet. Click the heart icon on a scenario to mark it!
              </div>
          )}

          {filteredScenarios.map((scenario) => {
            const isSelected = selectedId === scenario.id;
            const isFav = favorites.includes(scenario.id);

            return (
              <div 
                key={scenario.id}
                onClick={() => setSelectedId(scenario.id)}
                className={`
                  group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  ${isSelected ? 'border-white scale-105 shadow-2xl bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}
                `}
              >
                {/* Favorite Button */}
                <button 
                    onClick={(e) => toggleFavorite(e, scenario.id)}
                    className="absolute top-3 left-3 z-20 text-2xl transition-transform active:scale-90 hover:scale-110 drop-shadow-md"
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                    <span className={isFav ? "text-pink-500" : "text-white/20 hover:text-white/50"}>♥</span>
                </button>

                {/* Card Header Color */}
                <div className={`h-24 bg-gradient-to-r ${scenario.color} relative p-4 flex items-center justify-center overflow-hidden`}>
                   <div className="absolute inset-0 bg-black/10"></div>
                   <div className="text-6xl transform group-hover:scale-110 transition-transform duration-500 drop-shadow-md z-10">
                     {scenario.icon}
                   </div>
                   
                   {/* Difficulty Badge */}
                   <div className="absolute top-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-white">
                      {scenario.difficulty}
                   </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                      {scenario.name}
                      {isFav && <span className="text-pink-500 text-xs">♥</span>}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 h-16">
                    {scenario.description}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs font-mono text-slate-500 border-t border-slate-700 pt-4">
                     <span className="flex items-center gap-1">
                       💰 <span className="text-slate-300">${scenario.initialMoney}</span>
                     </span>
                     <span className="flex items-center gap-1">
                       🌍 <span className="text-slate-300 capitalize">{scenario.terrain}</span>
                     </span>
                  </div>

                  {/* Play Button (Visible on selection or hover) */}
                  <div className={`mt-6 overflow-hidden transition-all duration-300 ${isSelected ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0 group-hover:max-h-12 group-hover:opacity-100'}`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScenario(scenario);
                      }}
                      className="w-full py-2 bg-white text-slate-900 font-black rounded-lg hover:bg-cyan-300 transition-colors uppercase tracking-widest shadow-lg active:transform active:translate-y-0.5"
                    >
                      Start Simulation
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Coming Soon Card */}
          {!showFavoritesOnly && (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-6 flex flex-col items-center justify-center text-slate-600 min-h-[300px]">
                <span className="text-4xl mb-4 grayscale opacity-50">🚀</span>
                <p className="font-bold uppercase tracking-widest text-sm">More coming soon</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className="mt-20 text-center text-slate-600 text-xs font-mono">
           <p>© 2024 Kairo-Sim Hub. Powered by Gemini.</p>
        </footer>

      </div>
    </div>
  );
};

export default GameHub;
