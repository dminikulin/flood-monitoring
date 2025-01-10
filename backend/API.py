from flask import Flask, request, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from collections import deque
import time
import threading
import ultrasonic
import pressure as bmp
import atexit
import serial
import GPS

CRITICAL_LEVEL = 10
MAX_NORMAL_LEVEL = 40
PRESSURE_DROP_THRESHOLD = 5

latest_flood_data = {}
water_level_history = deque(maxlen=10)
pressure_history = deque(maxlen=60)

app = Flask(__name__)
CORS(app)

try:
    ser = serial.Serial('/dev/serial0', 9600, timeout=1)
except serial.SerialException as e:
    print(f"Error initializing serial port: {e}")
    ser = None

def port_cleanup():
    ultrasonic.cleanup()
    GPS.serial_cleanup(ser)

atexit.register(port_cleanup)

distance_queue = deque(maxlen=60)

def collect_distance():
    while True:
        distance_queue.append(ultrasonic.measure_distance())
        time.sleep(1)

threading.Thread(target=collect_distance, daemon=True).start()

def normalized_distance():
    if len(distance_queue) < 2:
        return "Insufficient data"
    
    temp_queue = list(distance_queue)
    temp_queue.remove(max(temp_queue))
    temp_queue.remove(min(temp_queue))
    
    avg = round(sum(temp_queue) / len(temp_queue), 2)
    return avg

def calculate_risk(water_level):
    global CRITICAL_LEVEL, MAX_NORMAL_LEVEL
    level_margin = (MAX_NORMAL_LEVEL + CRITICAL_LEVEL) / 2
    if(water_level >= MAX_NORMAL_LEVEL):
        return "NONE"
    elif(MAX_NORMAL_LEVEL > water_level >= level_margin):
        return "LOW"
    elif(level_margin > water_level >= CRITICAL_LEVEL):
        return "HIGH"
    else: return "CRITICAL"

def predict_risk(future_time):
    if len(water_level_history) < future_time:
        return None

    recent_levels = list(water_level_history)
    time_interval = 1

    slopes = []
    for i in range(len(recent_levels) - 1):
        slope = (recent_levels[i+1] - recent_levels[i]) / time_interval
        slopes.append(slope)

    if len(slopes) > 3:
        slopes.remove(max(slopes))
        slopes.remove(min(slopes))

    avg_slope = sum(slopes) / len(slopes)

    future_level = recent_levels[-1] + avg_slope * future_time

    if abs(avg_slope) < 0.1:  # If slope is too small, increase risk artificially
        future_level += 0.2 * (future_time / 10) 

    predicted_risk = calculate_risk(future_level)
    
    return {
        "predicted_level": round(future_level, 2),
        "predicted_risk": predicted_risk
    }

def pressure_drop():
    if len(pressure_history) < 60:
        return False
        
    oldest_pressure = pressure_history[0]
    latest_pressure = pressure_history[-1]
    return (oldest_pressure - latest_pressure) >= PRESSURE_DROP_THRESHOLD

def update_flood_data():
    global latest_flood_data
    water_level = normalized_distance()
    water_level_history.append(water_level)
    pA = bmp.get_pressure()
    pressure_history.append(pA)
    lat, lon = None, None
    if ser:
        lat, lon = GPS.read_gps(ser)
    risk = calculate_risk(water_level)
    storm = pressure_drop()
    prediction = predict_risk(10)

    latest_flood_data = {
        "water_level": water_level,
        "pressure": pA,
        "location":{
            "latitude": lat,
            "longitude": lon
        },
        "risk": risk,
        "storm_possibility": storm,
        "predictions": prediction
    }

scheduler = BackgroundScheduler()
scheduler.add_job(update_flood_data, 'interval', seconds = 60)
scheduler.start()
atexit.register(lambda: scheduler.shutdown(wait=False))

@app.route('/api/flood_data', methods=["GET"])
def flood():
    return jsonify(latest_flood_data)

@app.route('/api/get_levels', methods=["GET"])
def get_levels():
    global CRITICAL_LEVEL, MAX_NORMAL_LEVEL
    levels = {
        "critical": CRITICAL_LEVEL,
        "max_normal": MAX_NORMAL_LEVEL
    }
    return jsonify(levels)

@app.route('/api/set_levels', methods=["POST"])
def set_levels():
    global CRITICAL_LEVEL, MAX_NORMAL_LEVEL
    data = request.json
    try:
        CRITICAL_LEVEL = int(data["critical"])
        MAX_NORMAL_LEVEL = int(data["max_normal"])

        return jsonify({"message": "Levels updated successfully!", "CRITICAL_LEVEL": CRITICAL_LEVEL, "MAX_NORMAL_LEVEL": MAX_NORMAL_LEVEL})
    except (KeyError, ValueError) as e:
        return jsonify({"error": "Invalid input data", "details": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
