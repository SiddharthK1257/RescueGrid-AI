import math
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.models.schemas import MapMarker, LocationRecord

logger = logging.getLogger("rescuegrid.location")

class LocationService:
    @staticmethod
    def validate_coordinates(lat: float, lon: float) -> bool:
        return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0

    @staticmethod
    def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great-circle distance between two geographic points in km."""
        r = 6371.0  # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(r * c, 2)

    def generate_incident_markers(
        self,
        incident_id: str,
        lat: float,
        lon: float,
        title: str,
        hazards: List[str],
        is_blocked: bool = False
    ) -> List[MapMarker]:
        """Generate tactical map markers around an incident epicenter."""
        markers = [
            MapMarker(
                markerId=f"MK-{incident_id}-MAIN",
                incidentId=incident_id,
                title=f"Incident Epicenter: {title}",
                type="INCIDENT",
                latitude=lat,
                longitude=lon,
                severity="CRITICAL",
                status="ACTIVE",
                description="Primary reported emergency site.",
                isSimulated=True,
                verificationStatus="VERIFIED"
            ),
            # Safe Staging Area (Offset slightly North-East)
            MapMarker(
                markerId=f"MK-{incident_id}-STAGE",
                incidentId=incident_id,
                title="Designated Staging Area Alpha",
                type="STAGING_AREA",
                latitude=lat + 0.004,
                longitude=lon + 0.003,
                severity="LOW",
                status="STANDBY",
                description="Safe perimeter buffer for incoming emergency vehicles and triage.",
                isSimulated=True,
                verificationStatus="VERIFIED"
            )
        ]

        if is_blocked or any("block" in h.lower() or "lane" in h.lower() for h in hazards):
            markers.append(
                MapMarker(
                    markerId=f"MK-{incident_id}-ROADBLOCK",
                    incidentId=incident_id,
                    title="Reported Highway Bottleneck / Road Block",
                    type="ROAD_BLOCK",
                    latitude=lat - 0.002,
                    longitude=lon - 0.001,
                    severity="HIGH",
                    status="ACTIVE",
                    description="Reported lane obstruction. Incoming units reroute to secondary corridor.",
                    isSimulated=True,
                    verificationStatus="UNVERIFIED"
                )
            )

        if any("fire" in h.lower() or "smoke" in h.lower() for h in hazards):
            markers.append(
                MapMarker(
                    markerId=f"MK-{incident_id}-HAZARD",
                    incidentId=incident_id,
                    title="Active Thermal / Smoke Hazard Zone",
                    type="HAZARD",
                    latitude=lat + 0.001,
                    longitude=lon + 0.001,
                    severity="CRITICAL",
                    status="ACTIVE",
                    description="Smoke plume and thermal risk area. 150m cordon advised.",
                    isSimulated=True,
                    verificationStatus="VERIFIED"
                )
            )

        return markers

location_service = LocationService()
