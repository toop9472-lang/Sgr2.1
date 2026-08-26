"""طير — Trip (delivery route) model."""
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


def _now():
    return datetime.now(timezone.utc)


TripStatus = Literal[
    "scheduled", "departed", "in_transit", "arrived", "completed", "cancelled"
]


class TripStatusEvent(BaseModel):
    status: TripStatus
    at: datetime = Field(default_factory=_now)
    note: Optional[str] = None


class Trip(BaseModel):
    trip_id: str
    carrier_id: str

    # route
    from_city: str
    from_district: Optional[str] = None
    to_city: str
    to_district: Optional[str] = None
    waypoints: List[str] = []

    # timing
    depart_at: datetime
    eta_at: Optional[datetime] = None

    # vehicle
    vehicle_type: str = "سيدان"
    has_ac: bool = True
    total_cages: int = 4
    available_cages: int = 4
    accepts_sensitive: bool = True

    # meta
    notes: Optional[str] = None
    price_hint_sar: Optional[float] = None

    status: TripStatus = "scheduled"
    status_updates: List[TripStatusEvent] = []

    bookings_count: int = 0
    bookings_ids: List[str] = []

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class TripCreate(BaseModel):
    from_city: str
    from_district: Optional[str] = None
    to_city: str
    to_district: Optional[str] = None
    waypoints: List[str] = []
    depart_at: datetime
    eta_at: Optional[datetime] = None
    vehicle_type: str = "سيدان"
    has_ac: bool = True
    total_cages: int = 4
    accepts_sensitive: bool = True
    notes: Optional[str] = None
    price_hint_sar: Optional[float] = None


class TripStatusUpdate(BaseModel):
    status: TripStatus
    note: Optional[str] = None
