# Coordinate Finder Python
#python -m pip install -q -U google-genai

from google import genai

client = genai.Client(api_key="AIzaSyDHKri84VG-HEn5xQPuAX1NUNQULZjc3qk")

def NameToCoordinates(city, country):
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        contents=f"What are the coordinates of the city of {city} in the country of {country}? " \
        "If the city and/or country provided cannot be made sense of, print \"91.00,181.00\". " \
        "If coordinates for the location can be found, print the comma delineated decimal coordinates to two decimal places with no symbols or directions.")
    coords = response.text.split(',')
    return coords

location = input("Enter <City, Country>, formatted as shown: ")
locations = location.split(", ")
print(locations[0])
print(locations[1])
retCoords = NameToCoordinates(locations[0], locations[1])
print(retCoords[0], retCoords[1])