/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, AIGoal, NewsItem, GameScenario } from '../types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS } from '../constants';
import IsoMap from './IsoMap';
import UIOverlay from './UIOverlay';
import { generateCityGoal, generateNewsEvent } from '../services/geminiService';
import { audioService } from '../services/audioService';

// Grid Generation based on Terrain Type
const createInitialGrid = (terrain: GameScenario['terrain']): Grid => {
  const grid: Grid = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, buildingType: BuildingType.None });
    }
    grid.push(row);
  }
  
  return grid;
};

interface CityBuilderGameProps {
    scenario: GameScenario;
    onExit: () => void;
}

const CityBuilderGame: React.FC<CityBuilderGameProps> = ({ scenario, onExit }) => {
  // --- Game State ---
  const [grid, setGrid] = useState<Grid>(() => createInitialGrid(scenario.terrain));
  const [stats, setStats] = useState<CityStats>({ money: scenario.initialMoney, population: 0, day: 1 });
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  
  // --- AI State ---
  const [aiEnabled] = useState(true); // Always enabled in game mode for now
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(null);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  
  // Refs
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const goalRef = useRef(currentGoal);
  const aiEnabledRef = useRef(aiEnabled);
  const lastNewsFetchRef = useRef<number>(0);
  const audioInitRef = useRef(false);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { goalRef.current = currentGoal; }, [currentGoal]);
  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);

  // --- Audio Init ---
  const handleInteraction = () => {
    if (!audioInitRef.current) {
        audioService.init();
        audioInitRef.current = true;
    } else {
        audioService.resume();
    }
  };

  // --- AI Logic ---
  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed(prev => [...prev.slice(-12), item]); 
    audioService.playNotification();
  }, []);

  const fetchNewGoal = useCallback(async () => {
    if (isGeneratingGoal || !aiEnabledRef.current) return;
    setIsGeneratingGoal(true);
    await new Promise(r => setTimeout(r, 500));
    
    const newGoal = await generateCityGoal(statsRef.current, gridRef.current);
    if (newGoal) {
      setCurrentGoal(newGoal);
      audioService.playNotification();
    } else {
      if(aiEnabledRef.current) setTimeout(fetchNewGoal, 20000);
    }
    setIsGeneratingGoal(false);
  }, [isGeneratingGoal]); 

  const fetchNews = useCallback(async () => {
    const now = Date.now();
    if (!aiEnabledRef.current || now - lastNewsFetchRef.current < 45000 || Math.random() > 0.05) return; 
    
    lastNewsFetchRef.current = now;
    const news = await generateNewsEvent(statsRef.current, null);
    if (news) addNewsItem(news);
  }, [addNewsItem]);

  // --- Initial Setup ---
  useEffect(() => {
    addNewsItem({ 
        id: Date.now().toString(), 
        text: `Welcome to ${scenario.name}. Mayor appointed!`, 
        type: 'positive' 
    });

    // Add terrain-specific welcome messages
    setTimeout(() => {
        if (scenario.terrain === 'island') {
             addNewsItem({id: Date.now().toString(), text: "Effect: Commercial Tourism +20%. Build space limited to island center.", type: 'neutral'});
        } else if (scenario.terrain === 'coast') {
             addNewsItem({id: Date.now().toString(), text: "Effect: Coastal buildings get bonuses. Inland Commercial gets -10% penalty.", type: 'neutral'});
        }
    }, 1500);

    fetchNewGoal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- Game Loop ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      let dailyIncome = 0;
      let dailyPopGrowth = 0;
      let buildingCounts: Record<string, number> = {};

      gridRef.current.flat().forEach(tile => {
        if (tile.buildingType !== BuildingType.None) {
          const config = BUILDINGS[tile.buildingType];
          let tileIncome = config.incomeGen;
          let tilePop = config.popGen;
          
          // Terrain Effects
          if (scenario.terrain === 'island') {
             // Tourism Bonus for Commercial
             if (tile.buildingType === BuildingType.Commercial) {
                 tileIncome = Math.floor(tileIncome * 1.2);
             }
          } else if (scenario.terrain === 'coast') {
             // Ocean View Bonus (x: 4-6)
             if (tile.x >= 4 && tile.x <= 6) {
                 if (tile.buildingType === BuildingType.Residential || tile.buildingType === BuildingType.Commercial) {
                    tileIncome += 5;
                 }
             }
             // Inland Penalty (x > 10) for Commercial
             if (tile.x > 10 && tile.buildingType === BuildingType.Commercial) {
                 tileIncome = Math.floor(tileIncome * 0.9);
             }
          }

          // Park Adjacency Bonus (New)
          if (tile.buildingType === BuildingType.Residential) {
              const neighbors = [
                  { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                  { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
              ];
              let parkBonus = 0;
              neighbors.forEach(({dx, dy}) => {
                  const nx = tile.x + dx;
                  const ny = tile.y + dy;
                  if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                      if (gridRef.current[ny][nx].buildingType === BuildingType.Park) {
                          parkBonus += 2; // +2 Pop growth per adjacent park
                      }
                  }
              });
              tilePop += parkBonus;
          }

          dailyIncome += tileIncome;
          dailyPopGrowth += tilePop;
          buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + 1;
        }
      });

      const resCount = buildingCounts[BuildingType.Residential] || 0;
      const maxPop = resCount * 50; 

      setStats(prev => {
        let newPop = prev.population + dailyPopGrowth;
        if (newPop > maxPop) newPop = maxPop; 
        if (resCount === 0 && prev.population > 0) newPop = Math.max(0, prev.population - 5);

        const newStats = {
          money: prev.money + dailyIncome,
          population: newPop,
          day: prev.day + 1,
        };
        
        const goal = goalRef.current;
        if (aiEnabledRef.current && goal && !goal.completed) {
          let isMet = false;
          if (goal.targetType === 'money' && newStats.money >= goal.targetValue) isMet = true;
          if (goal.targetType === 'population' && newStats.population >= goal.targetValue) isMet = true;
          if (goal.targetType === 'building_count' && goal.buildingType) {
            if ((buildingCounts[goal.buildingType] || 0) >= goal.targetValue) isMet = true;
          }

          if (isMet) {
            setCurrentGoal({ ...goal, completed: true });
            audioService.playSuccess();
          }
        }
        return newStats;
      });

      fetchNews();
    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [fetchNews, scenario.terrain]);

  // --- Interaction ---
  const handleTileClick = useCallback((x: number, y: number) => {
    handleInteraction(); // Ensure audio context is ready
    
    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tool = selectedTool; 
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const currentTile = currentGrid[y][x];
    const buildingConfig = BUILDINGS[tool];

    // Terrain Restrictions
    if (scenario.terrain === 'island') {
         const center = GRID_SIZE / 2;
         const dist = Math.sqrt((x-center)*(x-center) + (y-center)*(y-center));
         // Stricter radius: 6
         if (dist > 6) {
             addNewsItem({id: Date.now().toString(), text: "Terrain unbuildable. Too far from island center.", type: 'negative'});
             audioService.playError();
             return;
         }
    } else if (scenario.terrain === 'coast') {
        if (x < 4) {
             addNewsItem({id: Date.now().toString(), text: "Cannot build on water.", type: 'negative'});
             audioService.playError();
             return;
        }
    }

    if (tool === BuildingType.None) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (currentStats.money >= demolishCost) {
            const newGrid = currentGrid.map(row => [...row]);
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
            audioService.playDemolish();
        } else {
            addNewsItem({id: Date.now().toString(), text: "Cannot afford demolition costs.", type: 'negative'});
            audioService.playError();
        }
      }
      return;
    }

    if (currentTile.buildingType === BuildingType.None) {
      if (currentStats.money >= buildingConfig.cost) {
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));
        const newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, buildingType: tool };
        setGrid(newGrid);
        audioService.playBuild();
      } else {
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Treasury insufficient for ${buildingConfig.name}.`, type: 'negative'});
        audioService.playError();
      }
    }
  }, [selectedTool, addNewsItem, scenario.terrain]);

  const handleClaimReward = () => {
    handleInteraction();
    if (currentGoal && currentGoal.completed) {
      setStats(prev => ({ ...prev, money: prev.money + currentGoal.reward }));
      addNewsItem({id: Date.now().toString(), text: `Goal achieved! ${currentGoal.reward} deposited.`, type: 'positive'});
      setCurrentGoal(null);
      fetchNewGoal();
      audioService.playSuccess();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-900 animate-fade-in" onClick={handleInteraction}>
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        terrain={scenario.terrain}
      />
      
      <UIOverlay
        stats={stats}
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        currentGoal={currentGoal}
        newsFeed={newsFeed}
        onClaimReward={handleClaimReward}
        isGeneratingGoal={isGeneratingGoal}
        aiEnabled={aiEnabled}
        onExit={onExit}
      />
    </div>
  );
}

export default CityBuilderGame;