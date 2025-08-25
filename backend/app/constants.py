"""
Constants for French Medical Education Structure
"""

# Medical education years
STUDY_YEARS = {
    1: "1ère Année",
    2: "2ème Année", 
    3: "3ème Année"
}

# Exam types
EXAM_TYPES = {
    "EMD": "EMD",
    "EMD1": "EMD1", 
    "EMD2": "EMD2",
    "RATTRAPAGE": "Rattrapage"
}

# 1st Year modules (no unites)
FIRST_YEAR_MODULES = {
    # Modules with EMD1/EMD2/Rattrapage
    "Anatomie": ["EMD1", "EMD2", "RATTRAPAGE"],
    "Biochimie": ["EMD1", "EMD2", "RATTRAPAGE"],
    "Biophysique": ["EMD1", "EMD2", "RATTRAPAGE"],
    "Biostatistique / Informatique": ["EMD1", "EMD2", "RATTRAPAGE"],
    "Chimie": ["EMD1", "EMD2", "RATTRAPAGE"],
    "Cytologie": ["EMD1", "EMD2", "RATTRAPAGE"],
    
    # Modules with EMD/Rattrapage only
    "Embryologie": ["EMD", "RATTRAPAGE"],
    "Histologie": ["EMD", "RATTRAPAGE"],
    "Physiologie": ["EMD", "RATTRAPAGE"],
    "S.S.H": ["EMD", "RATTRAPAGE"]
}

# 2nd Year structure
SECOND_YEAR_STRUCTURE = {
    "unites": {
        "Appareil Cardio-vasculaire et Respiratoire": [
            "Anatomie", "Histologie", "Physiologie", "Biophysique"
        ],
        "Appareil Digestif": [
            "Anatomie", "Histologie", "Physiologie", "Biochimie"
        ],
        "Appareil Urinaire": [
            "Anatomie", "Histologie", "Physiologie", "Biochimie"
        ],
        "Appareil Endocrinien et de la Reproduction": [
            "Anatomie", "Histologie", "Physiologie", "Biochimie"
        ],
        "Appareil Nerveux et Organes des Sens": [
            "Anatomie", "Histologie", "Physiologie", "Biophysique"
        ]
    },
    "modules_standalone": [
        "Génétique", "Immunologie"
    ]
}

# 3rd Year structure
THIRD_YEAR_STRUCTURE = {
    "unites": {
        "Appareil Cardio-vasculaire et Appareil Respiratoire": [
            "Semiologie", "physiopathologie", "radiologie", "biochimie"
        ],
        "Psychologie Médicale et Semiologie Générale": [
            "Semiologie", "physiopathologie", "radiologie", "biochimie"
        ],
        "Appareil Neurologique": [
            "Semiologie", "physiopathologie", "radiologie", "biochimie"
        ],
        "Appareil Endocrinien": [
            "Semiologie", "physiopathologie", "radiologie", "biochimie"
        ],
        "Appareil Urinaire": [
            "Semiologie", "physiopathologie", "radiologie", "biochimie"
        ],
        "Appareil Digestif": [
            "Semiologie", "physiopathologie", "radiologie", "biochimie"
        ]
    },
    "modules_standalone": [
        "Anatomie pathologique", "Immunologie", "Pharmacologie", 
        "Microbiologie", "Parasitologie"
    ]
}

# All exam types for each year
YEAR_EXAM_TYPES = {
    1: FIRST_YEAR_MODULES,
    2: ["EMD", "RATTRAPAGE"],  # All 2nd year modules have only EMD and Rattrapage
    3: ["EMD", "RATTRAPAGE"]   # All 3rd year modules have only EMD and Rattrapage
}

def get_modules_for_year(study_year: int):
    """Get all available modules for a given study year"""
    if study_year == 1:
        return list(FIRST_YEAR_MODULES.keys())
    elif study_year == 2:
        unites = list(SECOND_YEAR_STRUCTURE["unites"].keys())
        modules = SECOND_YEAR_STRUCTURE["modules_standalone"]
        return unites + modules
    elif study_year == 3:
        unites = list(THIRD_YEAR_STRUCTURE["unites"].keys())
        modules = THIRD_YEAR_STRUCTURE["modules_standalone"]
        return unites + modules
    return []

def get_exam_types_for_module(study_year: int, module: str):
    """Get available exam types for a module in a given year"""
    if study_year == 1:
        return FIRST_YEAR_MODULES.get(module, [])
    elif study_year in [2, 3]:
        return ["EMD", "RATTRAPAGE"]
    return []

def is_unite(study_year: int, module: str):
    """Check if a module is actually a unite"""
    if study_year == 2:
        return module in SECOND_YEAR_STRUCTURE["unites"]
    elif study_year == 3:
        return module in THIRD_YEAR_STRUCTURE["unites"]
    return False

def get_modules_in_unite(study_year: int, unite: str):
    """Get modules within a unite"""
    if study_year == 2:
        return SECOND_YEAR_STRUCTURE["unites"].get(unite, [])
    elif study_year == 3:
        return THIRD_YEAR_STRUCTURE["unites"].get(unite, [])
    return []