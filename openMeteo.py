`

import openmeteo_requests
import pandas as pd
import requests_cache
from retry_requests import retry

# Set the latitude and longitude for the desired location
lat = 49.28
long = -123.12

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": lat,
	"longitude": long,
	"daily": ["temperature_2m_max", "temperature_2m_min", "wind_speed_10m_max", "wind_direction_10m_dominant", "precipitation_sum"],
	"current": ["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "wind_direction_10m", "cloud_cover", "precipitation"],
	"forecast_days": 3,
}
responses = openmeteo.weather_api(url, params=params)


# Process current data. The order of variables needs to be the same as requested.
response = responses[0]
current = response.Current()
current_temperature_2m = current.Variables(0).Value()
current_relative_humidity_2m = current.Variables(1).Value()
current_wind_speed_10m = current.Variables(2).Value()
current_wind_direction_10m = current.Variables(3).Value()
# current_cloud_cover = current.Variables(4).Value()
current_precipitation = current.Variables(5).Value()

currentWeather = list((current_temperature_2m, current_relative_humidity_2m, current_wind_speed_10m, current_wind_direction_10m, current_precipitation))


fromattedCurrentWeather = [f"{num:.1f}" for num in currentWeather]
print(*fromattedCurrentWeather, sep=',')

# PULLS DAILY DATA
daily = response.Daily()
daily_temperature_2m_max = daily.Variables(0).ValuesAsNumpy()
daily_temperature_2m_min = daily.Variables(1).ValuesAsNumpy()
daily_wind_speed_10m_max = daily.Variables(2).ValuesAsNumpy()
daily_wind_direction_10m_dominant = daily.Variables(3).ValuesAsNumpy()
daily_precipitation_sum = daily.Variables(4).ValuesAsNumpy()


dates = pd.date_range(
    start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
    end =  pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
    freq = pd.Timedelta(seconds = daily.Interval()),
    inclusive = "left"
)

# 1. Clean the date to a simple string format
clean_dates = dates.strftime('%Y-%m-%d').tolist()

# 2. Convert and round the weather values (rounding to 2 decimal places)
clean_tmax = [round(float(x), 2) for x in daily_temperature_2m_max]
clean_tmin = [round(float(x), 2) for x in daily_temperature_2m_min]
clean_wind = [round(float(x), 2) for x in daily_wind_speed_10m_max]
clean_dir  = [round(float(x), 2) for x in daily_wind_direction_10m_dominant]
clean_prec = [round(float(x), 2) for x in daily_precipitation_sum]

# 3. Zip them into unique daily lists
daily_raw_values = list(zip(
    clean_tmax, 
    clean_tmin, 
    clean_wind, 
    clean_dir, 
    clean_prec
))

# 4. Print the result
for day in daily_raw_values:
    print(*day, sep=',')