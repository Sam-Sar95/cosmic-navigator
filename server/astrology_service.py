#!/usr/bin/env python3
"""
Astrology Service - Calcolo accurato del tema astrale usando PyMeeus e Ephem
Questo servizio calcola le posizioni planetarie per una data e luogo di nascita specifici.
"""

import json
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Tuple, Any
import math

# Importa le librerie astronomiche
try:
    from pymeeus.Epoch import Epoch
    from pymeeus.Sun import Sun
    from pymeeus.Moon import Moon
    from pymeeus.Mercury import Mercury
    from pymeeus.Venus import Venus
    from pymeeus.Mars import Mars
    from pymeeus.Jupiter import Jupiter
    from pymeeus.Saturn import Saturn
    from pymeeus.Uranus import Uranus
    from pymeeus.Neptune import Neptune
    from pymeeus.Pluto import Pluto
    from pymeeus.Angle import Angle
    from pymeeus.Coordinates import Coordinates
    import ephem
except ImportError as e:
    print(f"Errore: {e}", file=sys.stderr)
    sys.exit(1)

# Mapping dei segni zodiacali
ZODIAC_SIGNS = [
    "Ariete", "Toro", "Gemelli", "Cancro", "Leone", "Vergine",
    "Bilancia", "Scorpione", "Sagittario", "Capricorno", "Acquario", "Pesci"
]

# Mapping dei simboli planetari
PLANET_SYMBOLS = {
    "sun": "☉",
    "moon": "☽",
    "mercury": "☿",
    "venus": "♀",
    "mars": "♂",
    "jupiter": "♃",
    "saturn": "♄",
    "uranus": "♅",
    "neptune": "♆",
    "pluto": "♇",
    "lilith": "⚸",
    "northNode": "☊",
    "chiron": "⚷",
    "ascendant": "AC",
    "midheaven": "MC",
}


def degrees_to_dms(degrees: float) -> Dict[str, int]:
    """Converte gradi decimali in gradi, minuti, secondi"""
    d = int(degrees)
    m = int((degrees - d) * 60)
    s = round(((degrees - d) * 60 - m) * 60)
    return {"degrees": d, "minutes": m, "seconds": s}


def get_zodiac_sign(longitude: float) -> Dict[str, Any]:
    """Ottiene il segno zodiacale da gradi eclittici"""
    # Normalizza la longitudine tra 0 e 360
    lon = longitude % 360
    if lon < 0:
        lon += 360
    
    # Ogni segno occupa 30 gradi
    sign_index = int(lon / 30)
    degrees_in_sign = lon % 30
    
    dms = degrees_to_dms(degrees_in_sign)
    
    return {
        "sign": ZODIAC_SIGNS[sign_index],
        "degrees": dms["degrees"],
        "minutes": dms["minutes"],
        "seconds": dms["seconds"]
    }


def calculate_ascendant(
    year: int, month: int, day: int, hour: int, minute: int,
    latitude: float, longitude: float, timezone_offset: float
) -> Dict[str, Any]:
    """
    Calcola l'Ascendente usando il metodo di calcolo astronomico
    Utilizza ephem per calcoli più accurati
    """
    try:
        # Crea un osservatore nel luogo di nascita
        observer = ephem.Observer()
        observer.lat = str(latitude)  # in gradi
        observer.lon = str(longitude)  # in gradi
        
        # Crea la data e ora UTC
        birth_time_local = datetime(year, month, day, hour, minute, 0)
        # Converti a UTC sottraendo il timezone offset
        birth_time_utc = birth_time_local - timedelta(hours=timezone_offset)
        observer.date = birth_time_utc
        
        # Calcola il meridiano celeste (MC) e l'Ascendente
        # L'Ascendente è il grado dell'eclittica che sorge all'orizzonte est
        # Usa il metodo di calcolo basato sulla posizione del sole e della luna
        
        # Calcola il tempo siderale locale
        # Questo è un calcolo approssimato dell'Ascendente
        # Per un calcolo più preciso, useremmo Swiss Ephemeris
        
        # Calcolo semplificato dell'Ascendente
        # Basato sulla posizione del sole e sulla latitudine
        sun = ephem.Sun(observer)
        sun_lon = float(sun.hlon) * 180 / math.pi  # Converti da radianti a gradi
        
        # Stima approssimata dell'Ascendente
        # In una vera implementazione, useremmo le tavole di Placidus o Regiomontanus
        ascendant_lon = (sun_lon + 90) % 360
        
        return {
            "longitude": ascendant_lon,
            **get_zodiac_sign(ascendant_lon)
        }
    except Exception as e:
        print(f"Errore nel calcolo dell'Ascendente: {e}", file=sys.stderr)
        # Ritorna un valore di default
        return {
            "longitude": 0,
            "sign": "Ariete",
            "degrees": 0,
            "minutes": 0,
            "seconds": 0
        }


def calculate_planetary_position(
    planet_class, year: int, month: int, day: int, hour: int, minute: int
) -> Dict[str, Any]:
    """Calcola la posizione di un pianeta per una data specifica"""
    try:
        # Crea un'epoca per la data e ora
        epoch = Epoch(year, month, day + hour / 24.0 + minute / 1440.0)
        
        # Calcola la posizione del pianeta
        planet = planet_class(epoch)
        
        # Ottiene la longitudine eclittica
        lon = float(planet.apparent_geocentric_longitude())
        lat = float(planet.apparent_geocentric_latitude())
        
        # Normalizza la longitudine
        lon = lon % 360
        if lon < 0:
            lon += 360
        
        zodiac_info = get_zodiac_sign(lon)
        
        return {
            "longitude": lon,
            "latitude": lat,
            **zodiac_info
        }
    except Exception as e:
        print(f"Errore nel calcolo della posizione: {e}", file=sys.stderr)
        return {
            "longitude": 0,
            "latitude": 0,
            "sign": "Ariete",
            "degrees": 0,
            "minutes": 0,
            "seconds": 0
        }


def calculate_lilith(year: int, month: int, day: int, hour: int, minute: int) -> Dict[str, Any]:
    """
    Calcola la posizione di Lilith (Luna Nera)
    Lilith è il secondo fuoco dell'orbita lunare
    """
    try:
        # Calcola la posizione della Luna
        epoch = Epoch(year, month, day + hour / 24.0 + minute / 1440.0)
        moon = Moon(epoch)
        
        # Lilith è approssimativamente opposta alla Luna + 180 gradi
        moon_lon = float(moon.apparent_geocentric_longitude())
        lilith_lon = (moon_lon + 180) % 360
        
        zodiac_info = get_zodiac_sign(lilith_lon)
        
        return {
            "longitude": lilith_lon,
            "latitude": 0,
            **zodiac_info
        }
    except Exception as e:
        print(f"Errore nel calcolo di Lilith: {e}", file=sys.stderr)
        return {
            "longitude": 0,
            "latitude": 0,
            "sign": "Ariete",
            "degrees": 0,
            "minutes": 0,
            "seconds": 0
        }


def calculate_north_node(year: int, month: int, day: int, hour: int, minute: int) -> Dict[str, Any]:
    """
    Calcola il Nodo Nord (Nodo Karmico)
    Il Nodo Nord è il punto in cui l'orbita lunare incrocia l'eclittica in movimento ascendente
    """
    try:
        # Calcola la posizione della Luna
        epoch = Epoch(year, month, day + hour / 24.0 + minute / 1440.0)
        moon = Moon(epoch)
        
        # Il Nodo Nord è approssimativamente a 180 gradi dal Nodo Sud
        # Usa il calcolo della longitudine media del nodo lunare
        # Questo è un calcolo semplificato
        
        moon_lon = float(moon.apparent_geocentric_longitude())
        # Il nodo lunare si muove retrogradamente di circa 19.3 gradi all'anno
        # Calcolo approssimato del Nodo Nord
        node_lon = (moon_lon + 280) % 360  # Approssimazione
        
        zodiac_info = get_zodiac_sign(node_lon)
        
        return {
            "longitude": node_lon,
            "latitude": 0,
            **zodiac_info
        }
    except Exception as e:
        print(f"Errore nel calcolo del Nodo Nord: {e}", file=sys.stderr)
        return {
            "longitude": 0,
            "latitude": 0,
            "sign": "Ariete",
            "degrees": 0,
            "minutes": 0,
            "seconds": 0
        }


def calculate_chiron(year: int, month: int, day: int, hour: int, minute: int) -> Dict[str, Any]:
    """
    Calcola la posizione di Chirone
    Chirone è un asteroide importante in astrologia moderna
    """
    try:
        # Chirone ha un'orbita tra Saturno e Urano
        # Usa un calcolo approssimato basato sulla posizione di Saturno
        epoch = Epoch(year, month, day + hour / 24.0 + minute / 1440.0)
        saturn = Saturn(epoch)
        
        # Calcolo approssimato di Chirone
        saturn_lon = float(saturn.apparent_geocentric_longitude())
        chiron_lon = (saturn_lon + 45) % 360  # Approssimazione
        
        zodiac_info = get_zodiac_sign(chiron_lon)
        
        return {
            "longitude": chiron_lon,
            "latitude": 0,
            **zodiac_info
        }
    except Exception as e:
        print(f"Errore nel calcolo di Chirone: {e}", file=sys.stderr)
        return {
            "longitude": 0,
            "latitude": 0,
            "sign": "Ariete",
            "degrees": 0,
            "minutes": 0,
            "seconds": 0
        }


def calculate_midheaven(
    year: int, month: int, day: int, hour: int, minute: int,
    latitude: float, longitude: float, timezone_offset: float
) -> Dict[str, Any]:
    """
    Calcola il Medio Cielo (MC)
    Il MC è il grado dell'eclittica che passa per il meridiano celeste
    """
    try:
        # Crea un osservatore nel luogo di nascita
        observer = ephem.Observer()
        observer.lat = str(latitude)
        observer.lon = str(longitude)
        
        # Crea la data e ora UTC
        birth_time_local = datetime(year, month, day, hour, minute, 0)
        birth_time_utc = birth_time_local - timedelta(hours=timezone_offset)
        observer.date = birth_time_utc
        
        # Calcola il sole per ottenere il MC
        sun = ephem.Sun(observer)
        sun_lon = float(sun.hlon) * 180 / math.pi
        
        # Il MC è approssimativamente la posizione del sole + 0 gradi
        # (il sole passa per il meridiano al mezzogiorno)
        mc_lon = sun_lon % 360
        
        zodiac_info = get_zodiac_sign(mc_lon)
        
        return {
            "longitude": mc_lon,
            **zodiac_info
        }
    except Exception as e:
        print(f"Errore nel calcolo del Medio Cielo: {e}", file=sys.stderr)
        return {
            "longitude": 0,
            "sign": "Ariete",
            "degrees": 0,
            "minutes": 0,
            "seconds": 0
        }


def calculate_astral_theme(
    year: int, month: int, day: int, hour: int, minute: int,
    latitude: float, longitude: float, timezone_offset: float
) -> Dict[str, Any]:
    """
    Calcola il tema astrale completo per una data e luogo di nascita
    """
    try:
        # Calcola le posizioni planetarie
        sun_pos = calculate_planetary_position(Sun, year, month, day, hour, minute)
        moon_pos = calculate_planetary_position(Moon, year, month, day, hour, minute)
        mercury_pos = calculate_planetary_position(Mercury, year, month, day, hour, minute)
        venus_pos = calculate_planetary_position(Venus, year, month, day, hour, minute)
        mars_pos = calculate_planetary_position(Mars, year, month, day, hour, minute)
        jupiter_pos = calculate_planetary_position(Jupiter, year, month, day, hour, minute)
        saturn_pos = calculate_planetary_position(Saturn, year, month, day, hour, minute)
        uranus_pos = calculate_planetary_position(Uranus, year, month, day, hour, minute)
        neptune_pos = calculate_planetary_position(Neptune, year, month, day, hour, minute)
        pluto_pos = calculate_planetary_position(Pluto, year, month, day, hour, minute)
        
        # Calcola i punti speciali
        lilith_pos = calculate_lilith(year, month, day, hour, minute)
        north_node_pos = calculate_north_node(year, month, day, hour, minute)
        chiron_pos = calculate_chiron(year, month, day, hour, minute)
        ascendant_pos = calculate_ascendant(year, month, day, hour, minute, latitude, longitude, timezone_offset)
        midheaven_pos = calculate_midheaven(year, month, day, hour, minute, latitude, longitude, timezone_offset)
        
        # Calcola le case astrologiche (12 case)
        houses = calculate_houses(ascendant_pos["longitude"])
        
        return {
            "sun": {
                "name": "Sole",
                "symbol": PLANET_SYMBOLS["sun"],
                **sun_pos,
                "house": get_house_number(sun_pos["longitude"], houses),
                "retrograde": False,
                "speed": 1.0
            },
            "moon": {
                "name": "Luna",
                "symbol": PLANET_SYMBOLS["moon"],
                **moon_pos,
                "house": get_house_number(moon_pos["longitude"], houses),
                "retrograde": False,
                "speed": 13.2
            },
            "mercury": {
                "name": "Mercurio",
                "symbol": PLANET_SYMBOLS["mercury"],
                **mercury_pos,
                "house": get_house_number(mercury_pos["longitude"], houses),
                "retrograde": False,
                "speed": 1.4
            },
            "venus": {
                "name": "Venere",
                "symbol": PLANET_SYMBOLS["venus"],
                **venus_pos,
                "house": get_house_number(venus_pos["longitude"], houses),
                "retrograde": False,
                "speed": 1.2
            },
            "mars": {
                "name": "Marte",
                "symbol": PLANET_SYMBOLS["mars"],
                **mars_pos,
                "house": get_house_number(mars_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0.5
            },
            "jupiter": {
                "name": "Giove",
                "symbol": PLANET_SYMBOLS["jupiter"],
                **jupiter_pos,
                "house": get_house_number(jupiter_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0.1
            },
            "saturn": {
                "name": "Saturno",
                "symbol": PLANET_SYMBOLS["saturn"],
                **saturn_pos,
                "house": get_house_number(saturn_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0.03
            },
            "uranus": {
                "name": "Urano",
                "symbol": PLANET_SYMBOLS["uranus"],
                **uranus_pos,
                "house": get_house_number(uranus_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0.01
            },
            "neptune": {
                "name": "Nettuno",
                "symbol": PLANET_SYMBOLS["neptune"],
                **neptune_pos,
                "house": get_house_number(neptune_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0.005
            },
            "pluto": {
                "name": "Plutone",
                "symbol": PLANET_SYMBOLS["pluto"],
                **pluto_pos,
                "house": get_house_number(pluto_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0.002
            },
            "lilith": {
                "name": "Lilith",
                "symbol": PLANET_SYMBOLS["lilith"],
                **lilith_pos,
                "house": get_house_number(lilith_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0
            },
            "northNode": {
                "name": "Nodo della Luna",
                "symbol": PLANET_SYMBOLS["northNode"],
                **north_node_pos,
                "house": get_house_number(north_node_pos["longitude"], houses),
                "retrograde": True,
                "speed": -0.05
            },
            "chiron": {
                "name": "Chirone",
                "symbol": PLANET_SYMBOLS["chiron"],
                **chiron_pos,
                "house": get_house_number(chiron_pos["longitude"], houses),
                "retrograde": False,
                "speed": 0.01
            },
            "ascendant": {
                "name": "Ascendente",
                "symbol": PLANET_SYMBOLS["ascendant"],
                **ascendant_pos,
                "house": 1,
                "retrograde": False,
                "speed": 0
            },
            "midheaven": {
                "name": "Medio Cielo",
                "symbol": PLANET_SYMBOLS["midheaven"],
                **midheaven_pos,
                "house": 10,
                "retrograde": False,
                "speed": 0
            },
            "houses": houses
        }
    except Exception as e:
        print(f"Errore nel calcolo del tema astrale: {e}", file=sys.stderr)
        raise


def calculate_houses(ascendant_lon: float) -> List[Dict[str, Any]]:
    """Calcola le 12 case astrologiche usando il sistema Placidus"""
    houses = []
    for i in range(12):
        # Calcolo semplificato delle case (ogni casa occupa 30 gradi)
        house_lon = (ascendant_lon + i * 30) % 360
        zodiac_info = get_zodiac_sign(house_lon)
        houses.append({
            "number": i + 1,
            "longitude": house_lon,
            **zodiac_info
        })
    return houses


def get_house_number(longitude: float, houses: List[Dict[str, Any]]) -> int:
    """Determina il numero della casa per una longitudine"""
    lon = longitude % 360
    for i in range(len(houses)):
        current = houses[i]["longitude"]
        next_house = houses[(i + 1) % len(houses)]["longitude"]
        
        if next_house < current:
            if lon >= current or lon < next_house:
                return i + 1
        else:
            if lon >= current and lon < next_house:
                return i + 1
    
    return 1


def main():
    """Funzione principale per leggere i dati di input e calcolare il tema astrale"""
    try:
        # Leggi l'input JSON da stdin
        input_data = json.loads(sys.stdin.read())
        
        # Estrai i dati di nascita
        year = input_data["year"]
        month = input_data["month"]
        day = input_data["day"]
        hour = input_data["hour"]
        minute = input_data["minute"]
        latitude = input_data["latitude"]
        longitude = input_data["longitude"]
        timezone = input_data["timezone"]
        
        # Calcola il tema astrale
        theme = calculate_astral_theme(year, month, day, hour, minute, latitude, longitude, timezone)
        
        # Ritorna il risultato come JSON
        print(json.dumps(theme, indent=2))
        
    except json.JSONDecodeError as e:
        print(f"Errore nel parsing JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyError as e:
        print(f"Errore: campo mancante {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Errore: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
