import serial
import time
import pynmea2

def read_gps(ser):
    while True:
        try:
            line = ser.readline().decode('utf-8', errors='replace').strip()
            if line.startswith('$GNGGA') or line.startswith('$GPGGA'):  # GGA sentence (Global Positioning Fix Data)
                try:
                    msg = pynmea2.parse(line)
                    if msg.gps_qual > 0 and msg.latitude and msg.longitude:
                        latitude = round(msg.latitude, 5)
                        longitude = round(msg.longitude, 5)
                        return latitude, longitude
                    else:
                        print("No GPS fix yet. Waiting...")
                        return None, None
                except pynmea2.ParseError as e:
                    print(f"Parse Error: {e}")
                    print(f"Problematic line: {line}")
            time.sleep(5)  # Wait before reading the next line
        except UnicodeDecodeError as e:
            print(f"Decode Error: {e}")

    return None, None 

def serial_cleanup(ser):
    if ser.is_open:
        ser.close()
