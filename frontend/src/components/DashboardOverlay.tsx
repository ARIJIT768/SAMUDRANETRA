import { useRef } from 'react';
import { Radar, Waves, Ship, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DashboardOverlayProps {
  stage: number;
  setStage: (s: number) => void;
  timelineT: number;
  setTimelineT: (t: number) => void;
}

export default function DashboardOverlay({ stage, setStage, timelineT, setTimelineT }: DashboardOverlayProps) {
  
  const panelRef = useRef<HTMLDivElement>(null);

  const handleStage1 = () => setStage(1);
  const handleStage2 = () => setStage(2);
  const handleStage3 = () => setStage(3);
  const handleStage4 = async () => {
    setStage(4);
    // Generate PDF
    const mapElement = document.querySelector('.map-container') as HTMLElement;
    if (mapElement) {
      const canvas = await html2canvas(mapElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      // Add text overlay for evidence
      pdf.setFontSize(24);
      pdf.setTextColor(255, 0, 0);
      pdf.text('CONFIDENTIAL: LEGAL DOSSIER', 50, 50);
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Suspect Vessel: MMSI 419001842', 50, 100);
      pdf.text('Score: 94.8%', 50, 130);
      pdf.text('Anomalies: AIS Blackout (42 min), 6.2 kt Deceleration', 50, 160);
      
      pdf.save('evidence_dossier.pdf');
    }
  };

  return (
    <div className="overlay-container glass-panel slide-in" ref={panelRef} style={{ padding: '24px' }}>
      <h2>Command & Control</h2>
      <p style={{ marginBottom: '20px' }}>Deterministic Live Case Study: Gulf of Kutch</p>

      {/* Stage Progress Bar */}
      <div className="stage-indicator">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`stage-dot ${stage >= s ? 'completed' : ''} ${stage === s ? 'active' : ''}`}></div>
        ))}
      </div>

      {/* Stage 1 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          className={`glass-btn ${stage === 1 ? 'pulse-cyan' : ''}`} 
          onClick={handleStage1}
          style={{ width: '100%' }}
        >
          <Radar size={18} /> Toggle AI Segmentation Mask
        </button>
        {stage >= 1 && (
          <div className="fade-in" style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
            <p><strong>Chlorophyll Index:</strong> 0.08 (Biogenic Algae Rejected)</p>
            <p><strong>Surface Wind:</strong> 14.2 m/s</p>
            <p style={{ color: 'var(--accent-cyan)' }}><strong>True Petroleum Slick Confirmed (98.4%)</strong></p>
          </div>
        )}
      </div>

      {/* Stage 2 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          className={`glass-btn ${stage === 2 ? 'pulse-cyan' : ''}`} 
          onClick={handleStage2}
          style={{ width: '100%' }}
        >
          <Waves size={18} /> Run Reverse Ocean Hindcast
        </button>
        {stage >= 2 && (
          <div className="fade-in" style={{ marginTop: '12px' }}>
            <p style={{ marginBottom: '8px' }}>Time: T {timelineT === 0 ? '' : timelineT}h</p>
            <input 
              type="range" 
              min="-8" 
              max="0" 
              step="1" 
              value={timelineT} 
              onChange={(e) => setTimelineT(parseInt(e.target.value))} 
            />
            {timelineT === -8 && (
              <p className="fade-in" style={{ color: 'var(--accent-red)', marginTop: '8px' }}>
                Origin Space-Time Box locked.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stage 3 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          className={`glass-btn ${stage === 3 ? 'pulse-amber' : ''}`} 
          onClick={handleStage3}
          style={{ width: '100%' }}
        >
          <Ship size={18} /> Query AIS Vessel Tracks
        </button>
        {stage >= 3 && (
          <div className="fade-in" style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', maxHeight: '150px', overflowY: 'auto' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px' }}>
              <p style={{ color: 'var(--accent-red)' }}><strong>FLAGGED: Crude Carrier - MMSI 419001842</strong></p>
              <p>Score: 94.8%</p>
              <p style={{ fontSize: '0.8rem' }}>AIS Blackout (42 min) + 6.2 kt Deceleration</p>
            </div>
            <div>
              <p>Container Ship - MMSI 353123456</p>
              <p>Score: 21.4% (Normal Transit)</p>
            </div>
          </div>
        )}
      </div>

      {/* Stage 4 */}
      <div>
        <button 
          className="glass-btn pulse-green" 
          onClick={handleStage4}
          style={{ width: '100%', background: 'rgba(16, 185, 129, 0.2)', borderColor: 'var(--accent-green)' }}
        >
          <Download size={18} /> Generate Legal Dossier
        </button>
      </div>

    </div>
  );
}
