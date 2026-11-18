from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import math

app = FastAPI()

# Allow CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated Origin Point (Gulf of Kutch region)
ORIGIN_LNG = 69.2
ORIGIN_LAT = 22.45

@app.get("/api/case-study/radar")
def get_radar_data():
    """Stage 1: Returns the AI Segmentation Polygon (SAR)"""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [ORIGIN_LNG - 0.05, ORIGIN_LAT - 0.02],
                        [ORIGIN_LNG + 0.06, ORIGIN_LAT - 0.01],
                        [ORIGIN_LNG + 0.04, ORIGIN_LAT + 0.03],
                        [ORIGIN_LNG - 0.03, ORIGIN_LAT + 0.04],
                        [ORIGIN_LNG - 0.05, ORIGIN_LAT - 0.02]
                    ]]
                },
                "properties": {
                    "confidence": 98.4,
                    "chlorophyll_index": 0.08,
                    "wind_speed": 14.2
                }
            }
        ]
    }

@app.get("/api/case-study/hindcast")
def get_hindcast_particles():
    """Stage 2: Returns reverse drift particle starting points and vectors"""
    particles = []
    for i in range(100):
        # Initial position inside the polygon
        lng = ORIGIN_LNG + random.uniform(-0.04, 0.04)
        lat = ORIGIN_LAT + random.uniform(-0.01, 0.03)
        
        # Backward trajectory (roughly drifting southwest based on simulated reverse wind/current)
        trajectory = []
        curr_lng, curr_lat = lng, lat
        for t in range(9): # T=0 to T=-8
            trajectory.append([curr_lng, curr_lat])
            curr_lng -= random.uniform(0.005, 0.015) # Moving back SW
            curr_lat -= random.uniform(0.005, 0.015)
            
        particles.append({
            "id": i,
            "path": trajectory
        })
    return {"particles": particles}

@app.get("/api/case-study/ais-tracks")
def get_ais_tracks():
    """Stage 3: Returns 100k+ vessel tracks (mocked down for payload size but simulated to look dense)"""
    vessels = []
    
    # 1. Flagged Suspect (Crude Carrier, MMSI 419001842) - Crosses origin box at T=-8h
    suspect_path = []
    # Origin at T=-8 is roughly ORIGIN_LNG - 0.08, ORIGIN_LAT - 0.08
    target_lng = ORIGIN_LNG - 0.08
    target_lat = ORIGIN_LAT - 0.08
    for i in range(20):
        # Approaching from South, then crossing target, then moving North
        suspect_path.append([target_lng + (i-10)*0.01, target_lat + (i-10)*0.02])
        
    vessels.append({
        "mmsi": "419001842",
        "type": "Crude Carrier",
        "score": 94.8,
        "anomalies": ["AIS Blackout (42 min)", "6.2 kt Deceleration"],
        "path": suspect_path,
        "is_suspect": True
    })
    
    # 2. Normal Vessel (Container Ship)
    normal_path = []
    for i in range(20):
        normal_path.append([ORIGIN_LNG - 0.2 + i*0.03, ORIGIN_LAT + 0.1 - i*0.01])
    
    vessels.append({
        "mmsi": "353123456",
        "type": "Container Ship",
        "score": 21.4,
        "anomalies": [],
        "path": normal_path,
        "is_suspect": False
    })
    
    # Add random background vessels to simulate density
    for i in range(100):
        start_lng = ORIGIN_LNG + random.uniform(-1, 1)
        start_lat = ORIGIN_LAT + random.uniform(-1, 1)
        bg_path = []
        for j in range(5):
            bg_path.append([start_lng + j*0.02, start_lat + j*random.uniform(-0.02, 0.02)])
        vessels.append({
            "mmsi": f"000{i}",
            "type": "Cargo",
            "score": random.uniform(5, 15),
            "anomalies": [],
            "path": bg_path,
            "is_suspect": False
        })
        
    return {"vessels": vessels}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
