"""طير — Species catalog (reference list)."""
from typing import List, Optional

from pydantic import BaseModel


class Species(BaseModel):
    species_id: str
    name_ar: str
    name_en: str
    category: str = "birds"
    is_prohibited: bool = False
    requires_cites_permit: bool = False
    requires_health_cert: bool = False
    common_breeds: List[str] = []
    icon: Optional[str] = None


# Seed catalog — expand freely later.
SEED_SPECIES: List[dict] = [
    {"species_id": "canary", "name_ar": "كناري", "name_en": "Canary", "category": "birds",
     "common_breeds": ["Malinois", "Roller", "Fife", "Border"]},
    {"species_id": "budgie", "name_ar": "بادجي / كوكتيل", "name_en": "Budgerigar", "category": "birds",
     "common_breeds": ["English", "Australian"]},
    {"species_id": "cockatiel", "name_ar": "كوكتيل", "name_en": "Cockatiel", "category": "birds",
     "common_breeds": ["Normal Grey", "Lutino", "Pied", "Pearl"]},
    {"species_id": "lovebird", "name_ar": "الحب (روزيلا)", "name_en": "Lovebird", "category": "birds",
     "common_breeds": ["Peach-faced", "Fischer", "Masked"]},
    {"species_id": "parrot_african_grey", "name_ar": "الببغاء الرمادي الأفريقي", "name_en": "African Grey Parrot",
     "category": "birds", "requires_cites_permit": True,
     "common_breeds": ["Congo", "Timneh"]},
    {"species_id": "parrot_macaw", "name_ar": "ببغاء المكاو", "name_en": "Macaw", "category": "birds",
     "requires_cites_permit": True,
     "common_breeds": ["Blue-and-Gold", "Scarlet", "Green-winged"]},
    {"species_id": "parrot_amazon", "name_ar": "ببغاء الأمازون", "name_en": "Amazon Parrot", "category": "birds",
     "requires_cites_permit": True},
    {"species_id": "finch_zebra", "name_ar": "الحسون الزيبرا", "name_en": "Zebra Finch", "category": "birds"},
    {"species_id": "finch_gouldian", "name_ar": "الحسون الجولديان", "name_en": "Gouldian Finch", "category": "birds"},
    {"species_id": "pigeon", "name_ar": "حمام", "name_en": "Pigeon", "category": "birds",
     "common_breeds": ["Fantail", "Homer", "Roller", "Jacobin"]},
    {"species_id": "chicken", "name_ar": "دجاج", "name_en": "Chicken", "category": "birds",
     "common_breeds": ["Silkie", "Brahma", "Baladi"]},
    {"species_id": "falcon", "name_ar": "صقر", "name_en": "Falcon", "category": "birds",
     "requires_cites_permit": True, "requires_health_cert": True},
    {"species_id": "cat", "name_ar": "قطط", "name_en": "Cat", "category": "mammals",
     "common_breeds": ["Persian", "Scottish Fold", "Shirazi", "British Shorthair"]},
    {"species_id": "dog", "name_ar": "كلاب", "name_en": "Dog", "category": "mammals",
     "requires_health_cert": True,
     "common_breeds": ["German Shepherd", "Husky", "Golden Retriever"]},
    {"species_id": "rabbit", "name_ar": "أرانب", "name_en": "Rabbit", "category": "mammals"},
    {"species_id": "hamster", "name_ar": "هامستر", "name_en": "Hamster", "category": "mammals"},
    {"species_id": "turtle", "name_ar": "سلاحف", "name_en": "Turtle", "category": "reptiles"},
    {"species_id": "aquarium_fish", "name_ar": "أسماك زينة", "name_en": "Aquarium Fish", "category": "fish"},
    # Prohibited examples (auto-flagged)
    {"species_id": "wild_hawk", "name_ar": "صقور برية غير مرخصة", "name_en": "Unlicensed Wild Hawk",
     "category": "birds", "is_prohibited": True},
]
