import { useState, useRef } from 'react';
import DeckGLMap from './components/DeckGLMap';
import DashboardOverlay from './components/DashboardOverlay';
import './index.css';

function App() {
  const [stage, setStage] = useState<number>(0);
  const [timelineT, setTimelineT] = useState<number>(0); // 0 to -8
  
  const appRef = useRef<HTMLDivElement>(null);

  return (
    <div className="app-container" ref={appRef}>
      <div className="map-container">
        <DeckGLMap stage={stage} timelineT={timelineT} />
      </div>
      
      <DashboardOverlay 
        stage={stage} 
        setStage={setStage} 
        timelineT={timelineT} 
        setTimelineT={setTimelineT} 
      />
    </div>
  );
}

export default App;
