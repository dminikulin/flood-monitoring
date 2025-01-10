import board
import time
import adafruit_bmp280

# Initialize the BMP280 sensor
def initialize_bmp280():
    try:
        i2c = board.I2C()
        bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=0x76)
        bmp280.sea_level_pressure = 1013.25
        return bmp280
    except ValueError:
        return None

# Create a BMP280 instance
bmp280 = initialize_bmp280()

# Get temperature and pressure
def get_pressure():
    if bmp280 is None:
        return None
    try:
        return round(bmp280.pressure, 2)
    except Exception:
        return None
