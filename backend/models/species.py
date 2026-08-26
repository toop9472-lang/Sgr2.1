"""طير — Species catalog (reference list)."""
from typing import List, Optional

from pydantic import BaseModel


class Species(BaseModel):
    species_id: str
    name_ar: str
    name_en: str
    category: str = "birds"
    family: str = "other"  # taxonomic family: parrots, finches, canaries, falcons, pigeons, songbirds, cats_dogs, small_mammals, reptiles, fish
    is_prohibited: bool = False
    requires_cites_permit: bool = False
    requires_health_cert: bool = False
    common_breeds: List[str] = []
    icon: Optional[str] = None


# Seed catalog — expand freely later.
SEED_SPECIES: List[dict] = [
    # Canaries & Songbirds
    {"species_id": "canary", "name_ar": "كناري", "name_en": "Canary", "category": "birds", "family": "canaries",
     "common_breeds": ["Malinois", "Roller", "Fife", "Border"]},
    {"species_id": "finch_zebra", "name_ar": "الحسون الزيبرا", "name_en": "Zebra Finch", "category": "birds", "family": "finches"},
    {"species_id": "finch_gouldian", "name_ar": "الحسون الجولديان", "name_en": "Gouldian Finch", "category": "birds", "family": "finches"},
    {"species_id": "goldfinch_european", "name_ar": "الحسون الأوروبي", "name_en": "European Goldfinch", "category": "birds", "family": "finches"},
    # Parrots
    {"species_id": "budgie", "name_ar": "بادجي", "name_en": "Budgerigar", "category": "birds", "family": "parrots",
     "common_breeds": ["English", "Australian"]},
    {"species_id": "cockatiel", "name_ar": "كوكتيل", "name_en": "Cockatiel", "category": "birds", "family": "parrots",
     "common_breeds": ["Normal Grey", "Lutino", "Pied", "Pearl"]},
    {"species_id": "lovebird", "name_ar": "طيور الحب (روزيلا)", "name_en": "Lovebird", "category": "birds", "family": "parrots",
     "common_breeds": ["Peach-faced", "Fischer", "Masked"]},
    {"species_id": "parrot_african_grey", "name_ar": "الببغاء الرمادي الأفريقي", "name_en": "African Grey Parrot",
     "category": "birds", "family": "parrots", "requires_cites_permit": True,
     "common_breeds": ["Congo", "Timneh"]},
    {"species_id": "parrot_macaw", "name_ar": "ببغاء المكاو", "name_en": "Macaw", "category": "birds", "family": "parrots",
     "requires_cites_permit": True,
     "common_breeds": ["Blue-and-Gold", "Scarlet", "Green-winged"]},
    {"species_id": "parrot_amazon", "name_ar": "ببغاء الأمازون", "name_en": "Amazon Parrot", "category": "birds", "family": "parrots",
     "requires_cites_permit": True},
    {"species_id": "cockatoo", "name_ar": "الكوكاتو", "name_en": "Cockatoo", "category": "birds", "family": "parrots",
     "requires_cites_permit": True},
    # Falcons (birds of prey)
    {"species_id": "falcon_peregrine", "name_ar": "الشاهين", "name_en": "Peregrine Falcon", "category": "birds", "family": "falcons",
     "requires_cites_permit": True, "requires_health_cert": True},
    {"species_id": "falcon_saker", "name_ar": "الحر", "name_en": "Saker Falcon", "category": "birds", "family": "falcons",
     "requires_cites_permit": True, "requires_health_cert": True},
    {"species_id": "falcon_gyr", "name_ar": "الجير", "name_en": "Gyrfalcon", "category": "birds", "family": "falcons",
     "requires_cites_permit": True, "requires_health_cert": True},
    # Pigeons & Chickens
    {"species_id": "pigeon", "name_ar": "حمام", "name_en": "Pigeon", "category": "birds", "family": "pigeons",
     "common_breeds": ["Fantail", "Homer", "Roller", "Jacobin"]},
    {"species_id": "chicken", "name_ar": "دجاج", "name_en": "Chicken", "category": "birds", "family": "pigeons",
     "common_breeds": ["Silkie", "Brahma", "Baladi"]},
    # Songbirds (native)
    {"species_id": "songbird_bulbul", "name_ar": "البلبل", "name_en": "Bulbul", "category": "birds", "family": "songbirds"},
    {"species_id": "songbird_mynah", "name_ar": "المينا", "name_en": "Mynah", "category": "birds", "family": "songbirds"},
    # Cats & Dogs
    {"species_id": "cat", "name_ar": "قطط", "name_en": "Cat", "category": "mammals", "family": "cats_dogs",
     "common_breeds": ["Persian", "Scottish Fold", "Shirazi", "British Shorthair"]},
    {"species_id": "dog", "name_ar": "كلاب", "name_en": "Dog", "category": "mammals", "family": "cats_dogs",
     "requires_health_cert": True,
     "common_breeds": ["German Shepherd", "Husky", "Golden Retriever"]},
    # Small mammals
    {"species_id": "rabbit", "name_ar": "أرانب", "name_en": "Rabbit", "category": "mammals", "family": "small_mammals"},
    {"species_id": "hamster", "name_ar": "هامستر", "name_en": "Hamster", "category": "mammals", "family": "small_mammals"},
    # Reptiles
    {"species_id": "turtle", "name_ar": "سلاحف", "name_en": "Turtle", "category": "reptiles", "family": "reptiles"},
    # Fish
    {"species_id": "aquarium_fish", "name_ar": "أسماك زينة", "name_en": "Aquarium Fish", "category": "fish", "family": "fish"},
    # Prohibited examples (auto-flagged)
    {"species_id": "wild_hawk", "name_ar": "صقور برية غير مرخصة", "name_en": "Unlicensed Wild Hawk",
     "category": "birds", "family": "falcons", "is_prohibited": True},
]


# Family metadata (order of display, Arabic name, lucide icon name)
FAMILIES: List[dict] = [
    {"family_id": "canaries", "name_ar": "الكناري", "icon": "music-2"},
    {"family_id": "finches", "name_ar": "الحسون والفنش", "icon": "feather"},
    {"family_id": "parrots", "name_ar": "الببغاوات", "icon": "bird"},
    {"family_id": "falcons", "name_ar": "الصقور والجوارح", "icon": "wind"},
    {"family_id": "pigeons", "name_ar": "الحمام والدجاج", "icon": "egg"},
    {"family_id": "songbirds", "name_ar": "الطيور المغرّدة", "icon": "music"},
    {"family_id": "cats_dogs", "name_ar": "القطط والكلاب", "icon": "cat"},
    {"family_id": "small_mammals", "name_ar": "الثدييات الصغيرة", "icon": "rabbit"},
    {"family_id": "reptiles", "name_ar": "الزواحف", "icon": "shell"},
    {"family_id": "fish", "name_ar": "الأسماك", "icon": "fish"},
]
