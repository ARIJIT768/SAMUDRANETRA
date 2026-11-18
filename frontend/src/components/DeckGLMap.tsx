// @ts-nocheck
import { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { PolygonLayer, ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Using a free map style (Carto Dark Matter equivalent via MapTiler/Stadia or just a Mapbox dark style if we had a token)
// For local prototyping without a token, we can use a free style or a blank grey style.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: 69.2,
  latitude: 22.45,
  zoom: 10,
  pitch: 45,
  bearing: 0
};

interface DeckGLMapProps {
  stage: number;
  timelineT: number;
}

interface Feature {
  geometry: { coordinates: number[][][] };
  properties?: { chlorophyll_index?: number };
}

interface RadarData {
  features: Feature[];
}

interface Particle {
  id: number;
  path: number[][];
}

interface Vessel {
  mmsi: string;
  score: number;
  is_suspect: boolean;
  path: number[][];
}

export default function DeckGLMap({ stage, timelineT }: DeckGLMapProps) {
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [hindcastData, setHindcastData] = useState<Particle[] | null>(null);
  const [aisData, setAisData] = useState<Vessel[] | null>(null);

  useEffect(() => {
    // Fetch data based on stage progression to simulate network requests
    if (stage >= 1 && !radarData) {
      fetch('http://localhost:8000/api/case-study/radar')
        .then(res => res.json())
        .then(data => setRadarData(data));
    }
    if (stage >= 2 && !hindcastData) {
      fetch('http://localhost:8000/api/case-study/hindcast')
        .then(res => res.json())
        .then(data => setHindcastData(data.particles));
    }
    if (stage >= 3 && !aisData) {
      fetch('http://localhost:8000/api/case-study/ais-tracks')
        .then(res => res.json())
        .then(data => setAisData(data.vessels));
    }
  }, [stage]);

  const layers = [];

  // Stage 1: Radar AI Polygon
  if (stage >= 1 && radarData) {
    layers.push(
      new PolygonLayer<any>({
        id: 'radar-polygon',
        data: radarData.features,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        wireframe: true,
        lineWidthMinPixels: 2,
        getPolygon: (d: Feature) => d.geometry.coordinates,
        getFillColor: [6, 182, 212, 40], // Cyan transparent
        getLineColor: [6, 182, 212, 255], // Cyan solid
        getLineWidth: 3
      })
    );
  }

  // Stage 2: Hindcast Particles
  if (stage >= 2 && hindcastData) {
    // Find particle position based on timelineT (which goes from 0 to -8)
    const timeIndex = Math.abs(timelineT);
    
    const particlesAtTime = hindcastData.map((p: Particle) => {
      // If timeIndex is larger than available path, keep at last known
      const pos = p.path[Math.min(timeIndex, p.path.length - 1)];
      return { position: pos };
    });

    layers.push(
      new ScatterplotLayer<any>({
        id: 'hindcast-particles',
        data: particlesAtTime,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 10,
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        lineWidthMinPixels: 1,
        getPosition: (d: { position: number[] }) => d.position,
        getFillColor: [16, 185, 129, 200], // Green
        getLineColor: [255, 255, 255, 255],
        updateTriggers: {
          getPosition: [timelineT] // force update when time changes
        }
      })
    );

    // Draw the "Origin Space-Time Box" at T=-8
    if (timelineT === -8) {
       const originBox = [{
         polygon: [
           [69.1, 22.35],
           [69.15, 22.35],
           [69.15, 22.39],
           [69.1, 22.39],
           [69.1, 22.35]
         ]
       }];
       layers.push(
        new PolygonLayer<any>({
          id: 'origin-box',
          data: originBox,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          getPolygon: (d: { polygon: number[][] }) => d.polygon,
          getFillColor: [239, 68, 68, 40], // Red transparent
          getLineColor: [239, 68, 68, 255], // Red solid
        })
      );
    }
  }

  // Stage 3: AIS Tracks
  if (stage >= 3 && aisData) {
    layers.push(
      new PathLayer<any>({
        id: 'ais-tracks',
        data: aisData,
        pickable: true,
        widthScale: 20,
        widthMinPixels: 2,
        getPath: (d: Vessel) => d.path,
        getColor: (d: Vessel) => d.is_suspect ? [245, 158, 11, 255] : [148, 163, 184, 100], // Amber for suspect, gray for normal
        getWidth: (d: Vessel) => d.is_suspect ? 4 : 1,
      })
    );
  }

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={layers}
      getTooltip={({ object }: any) => 
        object && (
          object.properties ? `Chlorophyll: ${object.properties.chlorophyll_index}` : 
          object.mmsi ? `Vessel MMSI: ${object.mmsi}\nScore: ${object.score.toFixed(1)}%` : 
          ''
        )
      }
    >
      <Map mapStyle={MAP_STYLE} />
    </DeckGL>
  );
}
