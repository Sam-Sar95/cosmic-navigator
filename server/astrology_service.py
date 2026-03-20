#!/usr/bin/env python3
"""
Cosmic Navigator - Astrology Service (pyswisseph edition)
Motore di calcolo astrologico professionale basato su Swiss Ephemeris.
Case Placidus, gestione automatica UTC/ora legale tramite timezonefinder + pytz.
"""

import sys
import json
import math
import swisseph as swe
from datetime import datetime
from timezonefinder import TimezoneFinder
import pytz

# Costanti zodiacali
SIGNS = [
    "Ariete", "Toro", "Gemelli", "Cancro", "Leone", "Vergine",
    "Bilancia", "Scorpione", "Sagittario", "Capricorno", "Acquario", "Pesci"
]

SIGN_SYMBOLS = [
    "♈", "♉", "♊", "♋", "♌", "♍",
    "♎", "♏", "♐", "♑", "♒", "♓"
]

# Corpi celesti
PLANETS = {
    "sun":       swe.SUN,
    "moon":      swe.MOON,
    "mercury":   swe.MERCURY,
    "venus":     swe.VENUS,
    "mars":      swe.MARS,
    "jupiter":   swe.JUPITER,
    "saturn":    swe.SATURN,
    "uranus":    swe.URANUS,
    "neptune":   swe.NEPTUNE,
    "pluto":     swe.PLUTO,
    "chiron":    swe.CHIRON,
    "northNode": swe.TRUE_NODE,
    "lilith":    swe.MEAN_APOG,
}


def lon_to_sign_data(lon: float) -> dict:
    lon = lon % 360
    sign_idx = int(lon / 30)
    deg_in_sign = lon - sign_idx * 30
    degrees = int(deg_in_sign)
    minutes = int((deg_in_sign - degrees) * 60)
    return {
        "longitude": round(lon, 4),
        "sign": SIGNS[sign_idx],
        "signSymbol": SIGN_SYMBOLS[sign_idx],
        "degrees": degrees,
        "minutes": minutes,
    }


def get_timezone_offset(lat: float, lon: float, year: int, month: int, day: int, hour: int, minute: int) -> float:
    """Calcola l'offset UTC in ore gestendo automaticamente l'ora legale (DST)."""
    try:
        tf = TimezoneFinder()
        tz_name = tf.timezone_at(lat=lat, lng=lon)
        if not tz_name:
            return round(lon / 15)
        tz = pytz.timezone(tz_name)
        dt_naive = datetime(year, month, day, hour, minute)
        dt_local = tz.localize(dt_naive)
        offset_seconds = dt_local.utcoffset().total_seconds()
        return offset_seconds / 3600.0
    except Exception:
        return round(lon / 15)


def calculate_house(planet_lon: float, cusps: list) -> int:
    """Determina in quale casa si trova un pianeta (Placidus)."""
    lon = planet_lon % 360
    for i in range(12):
        start = cusps[i] % 360
        end = cusps[(i + 1) % 12] % 360
        if start <= end:
            if start <= lon < end:
                return i + 1
        else:
            if lon >= start or lon < end:
                return i + 1
    return 1


def calculate_astral_theme(
    year: int, month: int, day: int,
    hour: int, minute: int,
    latitude: float, longitude: float,
    timezone: float = None,
    place_name: str = ""
) -> dict:
    """Calcola il tema astrale completo con pyswisseph."""

    # 1. Calcola offset UTC automaticamente se non fornito
    if timezone is None:
        tz_offset = get_timezone_offset(latitude, longitude, year, month, day, hour, minute)
    else:
        tz_offset = float(timezone)

    # 2. Converti ora locale in UTC
    hour_utc = hour + minute / 60.0 - tz_offset

    # Gestisci cambio di giorno
    day_adj, month_adj, year_adj = day, month, year
    if hour_utc < 0:
        hour_utc += 24
        day_adj -= 1
    elif hour_utc >= 24:
        hour_utc -= 24
        day_adj += 1

    # 3. Giorno Giuliano in UTC
    jd_ut = swe.julday(year_adj, month_adj, day_adj, hour_utc)

    # 4. Effemeridi: usa seas_18.se1 se disponibile (per Chirone), altrimenti Moshier
    import os
    ephe_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'ephe')
    if not os.path.isdir(ephe_path):
        ephe_path = os.path.expanduser('~/ephe')
    if os.path.isdir(ephe_path) and os.path.exists(os.path.join(ephe_path, 'seas_18.se1')):
        swe.set_ephe_path(ephe_path)
    else:
        swe.set_ephe_path('')  # Fallback Moshier

    # 5. Case Placidus e angoli
    try:
        cusps_raw, ascmc = swe.houses(jd_ut, latitude, longitude, b'P')
        cusps = list(cusps_raw)
        asc_lon = ascmc[0]
        mc_lon  = ascmc[1]
    except Exception:
        # Fallback Porphyry per latitudini polari
        cusps_raw, ascmc = swe.houses(jd_ut, latitude, longitude, b'O')
        cusps = list(cusps_raw)
        asc_lon = ascmc[0]
        mc_lon  = ascmc[1]

    # 6. Calcola tutti i pianeti
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    planet_data = {}
    for key, pid in PLANETS.items():
        try:
            res, _ = swe.calc_ut(jd_ut, pid, flags)
            lon = res[0] % 360
            speed = res[3]
            sd = lon_to_sign_data(lon)
            planet_data[key] = {
                **sd,
                "retrograde": speed < 0,
                "house": calculate_house(lon, cusps),
                "speed": round(speed, 4),
            }
        except Exception:
            planet_data[key] = {
                "longitude": 0.0, "sign": "Ariete", "signSymbol": "♈",
                "degrees": 0, "minutes": 0,
                "retrograde": False, "house": 1, "speed": 0.0,
            }

    # 7. Ascendente e MC
    asc_sd = lon_to_sign_data(asc_lon)
    mc_sd  = lon_to_sign_data(mc_lon)

    # 8. Cuspidi delle case
    houses_list = []
    for i, cl in enumerate(cusps):
        csd = lon_to_sign_data(cl % 360)
        houses_list.append({
            "house": i + 1,
            "longitude": round(cl % 360, 4),
            "sign": csd["sign"],
            "signSymbol": csd["signSymbol"],
            "degrees": csd["degrees"],
            "minutes": csd["minutes"],
        })

    return {
        "sun":       planet_data["sun"],
        "moon":      planet_data["moon"],
        "mercury":   planet_data["mercury"],
        "venus":     planet_data["venus"],
        "mars":      planet_data["mars"],
        "jupiter":   planet_data["jupiter"],
        "saturn":    planet_data["saturn"],
        "uranus":    planet_data["uranus"],
        "neptune":   planet_data["neptune"],
        "pluto":     planet_data["pluto"],
        "chiron":    planet_data["chiron"],
        "northNode": planet_data["northNode"],
        "lilith":    planet_data["lilith"],
        "ascendant": {**asc_sd, "retrograde": False, "house": 1, "speed": 0.0},
        "midheaven": {**mc_sd,  "retrograde": False, "house": 10, "speed": 0.0},
        "houses": houses_list,
        "meta": {
            "placeName":  place_name,
            "latitude":   latitude,
            "longitude":  longitude,
            "timezone":   tz_offset,
            "julianDay":  round(jd_ut, 6),
            "utcHour":    round(hour_utc, 4),
            "houseSystem": "Placidus",
            "ephemeris":  "Swiss Ephemeris (Moshier)",
        }
    }


def main():
    """Entry point per chiamata da Node.js via stdin/stdout."""
    try:
        data = json.loads(sys.stdin.read())
        result = calculate_astral_theme(
            year=data["year"], month=data["month"], day=data["day"],
            hour=data["hour"], minute=data["minute"],
            latitude=data["latitude"], longitude=data["longitude"],
            timezone=data.get("timezone"),
            place_name=data.get("placeName", ""),
        )
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e), "type": type(e).__name__}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
