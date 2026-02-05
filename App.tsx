/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import GameHub from './components/GameHub';
import CityBuilderGame from './components/CityBuilderGame';
import { GameScenario } from './types';

function App() {
  const [activeScenario, setActiveScenario] = useState<GameScenario | null>(null);

  const handleStartGame = (scenario: GameScenario) => {
    setActiveScenario(scenario);
  };

  const handleExitGame = () => {
    setActiveScenario(null);
  };

  return (
    <div className="w-full h-full">
      {activeScenario ? (
        <CityBuilderGame 
          key={activeScenario.id} // Force re-mount on scenario change
          scenario={activeScenario} 
          onExit={handleExitGame} 
        />
      ) : (
        <GameHub onSelectScenario={handleStartGame} />
      )}
    </div>
  );
}

export default App;
