import requests
import json
import os

BASE_URL = "http://localhost:8000/api/v1"

# 15 TM Pairs
tm_pairs = [
    ("This agreement is governed by applicable law.", "Este acuerdo se rige por la ley aplicable."),
    ("Payment shall be made within thirty days.", "El pago deberá realizarse dentro de treinta días."),
    ("The parties agree to the following terms and conditions.", "Las partes acuerdan los siguientes términos y condiciones."),
    ("Either party may terminate this agreement with written notice.", "Cualquiera de las partes puede rescindir este acuerdo con aviso por escrito."),
    ("The client must consistently and explicitly provide timely feedback.", "El cliente debe proporcionar comentarios oportunos de manera consistente y explícita."),
    ("Both parties will unequivocally maintain strict and perpetual confidentiality.", "Ambas partes mantendrán inequívocamente una confidencialidad estricta y perpetua."),
    ("Any potential disputes prominently arising from or directly relating to this contract will be exclusively and finally resolved in the designated state courts.", "Cualquier disputa potencial que surja principalmente de o se relacione directamente con este contrato se resolverá de manera exclusiva y final en los tribunales estatales designados."),
    ("By executing and signing this comprehensive agreement, both involved parties openly acknowledge their respective duties.", "Al ejecutar y firmar este acuerdo integral, ambas partes involucradas reconocen abiertamente sus respectivos deberes."),
    ("The Provider ensures high availability; nonetheless, scheduled maintenance windows are necessary.", "El Proveedor garantiza una alta disponibilidad; no obstante, las ventanas de mantenimiento programadas son necesarias."),
    ("Failure to adequately make any required payments by the explicitly specified dates outlined in the table will automatically incur an compounding late fee.", "El incumplimiento de realizar adecuadamente cualquier pago requerido en las fechas explícitamente especificadas y descritas en la tabla incurrirá automáticamente en un cargo por pago atrasado compuesto."),
    ("All standard support inquiries and maintenance requests must be submitted by 5:00 PM on regular business days.", "Todas las consultas de soporte estándar y las solicitudes de mantenimiento deben enviarse antes de las 5:00 PM en los días hábiles regulares."),
    ("The primary purpose of this specific contract is to comprehensively outline the rules, regulations, and operational guidelines governing the use of the proprietary platform.", "El propósito principal de este contrato específico es delinear de manera integral las reglas, regulaciones y pautas operativas que rigen el uso de la plataforma propietaria."),
    ("There shall be absolutely no unauthorized distribution, modification, or reverse engineering of this confidential document.", "No habrá absolutamente ninguna distribución, modificación o ingeniería inversa no autorizada de este documento confidencial."),
    ("In the specific event of an early or unexpected termination prompted by the Client, all outstanding and accumulated payments for completed work instantly become due immediately without exception.", "En el evento específico de una terminación anticipada o inesperada impulsada por el Cliente, todos los pagos pendientes y acumulados por el trabajo completado vencerán instantáneamente de inmediato sin excepción."),
    ("This document serves as the official binding legal agreement governing the provision of professional services.", "Este documento sirve como el acuerdo legal vinculante oficial que rige la provisión de servicios profesionales.")
]

glossary_terms = [
    ("contract", "contrato"),
    ("payment", "pago"),
    ("agreement", "acuerdo"),
    ("termination", "rescisión"),
    ("clause", "cláusula"),
    ("obligation", "obligación"),
    ("governing", "rector"),
    ("notice", "aviso")
]

def create_project():
    url = f"{BASE_URL}/projects/"
    payload = {
        "name": "Validation Test Project",
        "description": "End-to-End Testing",
        "source_language": "en"
    }
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    return resp.json()["id"]

def seed_tm(project_id):
    url = f"{BASE_URL}/projects/{project_id}/tm/seed"
    entries = []
    for en, es in tm_pairs:
        entries.append({
            "project_id": project_id,
            "source_language": "en",
            "target_language": "es",
            "source_text": en,
            "target_text": es
        })
    payload = {"entries": entries}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    print(f"Seeded TM: {resp.json()['stored']} entries")

def seed_glossary(project_id):
    for en, es in glossary_terms:
        url = f"{BASE_URL}/projects/{project_id}/glossary"
        payload = {
            "source_language": "en",
            "target_language": "es",
            "source_term": en,
            "target_term": es
        }
        resp = requests.post(url, json=payload)
        resp.raise_for_status()
    print(f"Seeded Glossary: {len(glossary_terms)} terms")

def create_style_profile(project_id):
    url = f"{BASE_URL}/projects/{project_id}/style-profiles"
    payload = {
        "name": "Formal Document",
        "tone": "Formal",
        "target_language": "es"
    }
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    print("Created Style Profile")

if __name__ == "__main__":
    try:
        project_id = create_project()
        print(f"Created project: {project_id}")
        
        # Save project_id for pipeline script
        with open(os.path.join(os.path.dirname(__file__), "project_id.txt"), "w") as f:
            f.write(project_id)
        
        seed_tm(project_id)
        seed_glossary(project_id)
        create_style_profile(project_id)
        print("Success! TM, Glossary, and Style Profile seeded.")
    except Exception as e:
        print(f"Error: {e}")
