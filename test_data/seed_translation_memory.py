"""
STEP 2: Seed Translation Memory, Glossary, and Style Profile.
Creates a project, seeds 20 EN→ES TM pairs, 10 glossary terms, and 1 style profile.
Run AFTER create_seed_documents.py.

Usage:
    python test_data/seed_translation_memory.py

Set BASE_URL env var to override the default API URL:
    set BASE_URL=http://localhost:8000/api/v1
"""

import os
import sys
import json
import httpx

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000/api/v1")


def create_project(client: httpx.Client) -> str:
    """Create the test project and return its ID."""
    print("\n--- Creating Project ---")
    resp = client.post(f"{BASE_URL}/projects/", json={
        "name": "TranslateIQ Test Project",
        "description": "Test project for end-to-end pipeline validation with EN→ES translation.",
        "source_language": "en",
        "target_language": "es"
    })
    resp.raise_for_status()
    project = resp.json()
    project_id = project["id"]
    print(f"  Project Name: {project['name']}")
    print(f"  Project ID:   {project_id}")
    return project_id


def seed_tm_pairs(client: httpx.Client, project_id: str) -> int:
    """Seed 20 English → Spanish TM pairs across 4 domains."""
    print("\n--- Seeding Translation Memory (20 pairs) ---")

    tm_pairs = [
        # Software domain (5 pairs)
        {
            "source_text": "CloudSync requires a minimum of 4GB RAM to operate.",
            "target_text": "CloudSync requiere un mínimo de 4 GB de RAM para funcionar."
        },
        {
            "source_text": "Please restart the application to apply the changes.",
            "target_text": "Por favor, reinicie la aplicación para aplicar los cambios."
        },
        {
            "source_text": "Your account has been successfully created.",
            "target_text": "Su cuenta ha sido creada exitosamente."
        },
        {
            "source_text": "Click the Settings icon to configure your preferences.",
            "target_text": "Haga clic en el ícono de Configuración para ajustar sus preferencias."
        },
        {
            "source_text": "The system will automatically save your progress.",
            "target_text": "El sistema guardará su progreso automáticamente."
        },

        # HR domain (5 pairs)
        {
            "source_text": "Employees are entitled to 20 days of annual leave per year.",
            "target_text": "Los empleados tienen derecho a 20 días de vacaciones anuales."
        },
        {
            "source_text": "All grievances must be submitted in writing to HR.",
            "target_text": "Todas las quejas deben presentarse por escrito al departamento de RR.HH."
        },
        {
            "source_text": "Performance reviews are conducted on a quarterly basis.",
            "target_text": "Las evaluaciones de desempeño se realizan trimestralmente."
        },
        {
            "source_text": "The company maintains a strict zero-tolerance policy.",
            "target_text": "La empresa mantiene una estricta política de tolerancia cero."
        },
        {
            "source_text": "Employees must comply with all workplace health and safety regulations.",
            "target_text": "Los empleados deben cumplir con todas las normas de salud y seguridad laboral."
        },

        # Legal domain (5 pairs)
        {
            "source_text": "This agreement is governed by applicable law.",
            "target_text": "Este acuerdo se rige por la ley aplicable."
        },
        {
            "source_text": "Payment shall be made within thirty days of invoice.",
            "target_text": "El pago deberá realizarse dentro de los treinta días posteriores a la factura."
        },
        {
            "source_text": "Either party may terminate this agreement with written notice.",
            "target_text": "Cualquiera de las partes puede rescindir este acuerdo mediante aviso por escrito."
        },
        {
            "source_text": "All confidential information must be protected from disclosure.",
            "target_text": "Toda la información confidencial debe estar protegida contra su divulgación."
        },
        {
            "source_text": "The parties agree to resolve disputes through arbitration.",
            "target_text": "Las partes acuerdan resolver las disputas mediante arbitraje."
        },

        # General business domain (5 pairs)
        {
            "source_text": "Please review the attached document carefully.",
            "target_text": "Por favor, revise el documento adjunto con detenimiento."
        },
        {
            "source_text": "This policy is effective from the date of signing.",
            "target_text": "Esta política entra en vigor a partir de la fecha de firma."
        },
        {
            "source_text": "Contact our support team for further assistance.",
            "target_text": "Comuníquese con nuestro equipo de soporte para obtener más ayuda."
        },
        {
            "source_text": "All users must accept the terms before proceeding.",
            "target_text": "Todos los usuarios deben aceptar los términos antes de continuar."
        },
        {
            "source_text": "The report will be submitted by the end of the month.",
            "target_text": "El informe será entregado antes de fin de mes."
        },
    ]

    entries = []
    for pair in tm_pairs:
        entries.append({
            "project_id": project_id,
            "source_language": "en",
            "target_language": "es",
            "source_text": pair["source_text"],
            "target_text": pair["target_text"],
        })

    resp = client.post(
        f"{BASE_URL}/projects/{project_id}/tm/seed",
        json={"entries": entries},
        timeout=120.0
    )
    resp.raise_for_status()
    result = resp.json()
    stored = result.get("stored", len(entries))
    print(f"  TM pairs seeded: {stored}")

    # Print each pair for verification
    for i, pair in enumerate(tm_pairs, 1):
        print(f"    {i:2d}. EN: \"{pair['source_text'][:60]}...\"")
        print(f"        ES: \"{pair['target_text'][:60]}...\"")

    return stored


def seed_glossary(client: httpx.Client, project_id: str) -> int:
    """Seed 10 English → Spanish glossary terms."""
    print("\n--- Seeding Glossary (10 terms) ---")

    glossary_terms = [
        {"source_term": "software",      "target_term": "software",       "context_notes": "General technology term, no translation needed."},
        {"source_term": "application",    "target_term": "aplicación",     "context_notes": "Software application or program."},
        {"source_term": "employee",       "target_term": "empleado",       "context_notes": "HR context — a person employed by the company."},
        {"source_term": "agreement",      "target_term": "acuerdo",        "context_notes": "Legal context — a formal arrangement between parties."},
        {"source_term": "payment",        "target_term": "pago",           "context_notes": "Financial context — monetary transaction."},
        {"source_term": "termination",    "target_term": "rescisión",      "context_notes": "Legal context — ending of a contract or agreement."},
        {"source_term": "confidential",   "target_term": "confidencial",   "context_notes": "Information that must not be disclosed."},
        {"source_term": "policy",         "target_term": "política",       "context_notes": "HR/Legal — a set of rules or guidelines."},
        {"source_term": "review",         "target_term": "revisión",       "context_notes": "Process of evaluating or examining something."},
        {"source_term": "support",        "target_term": "soporte",        "context_notes": "Technical or customer support."},
    ]

    count = 0
    for term in glossary_terms:
        resp = client.post(
            f"{BASE_URL}/projects/{project_id}/glossary",
            json={
                "source_language": "en",
                "target_language": "es",
                "source_term": term["source_term"],
                "target_term": term["target_term"],
                "context_notes": term["context_notes"],
            }
        )
        resp.raise_for_status()
        count += 1
        print(f"    {count:2d}. {term['source_term']:15s} → {term['target_term']}")

    print(f"  Glossary terms seeded: {count}")
    return count


def create_style_profile(client: httpx.Client, project_id: str) -> str:
    """Create the 'Formal Spanish' style profile."""
    print("\n--- Creating Style Profile ---")

    resp = client.post(
        f"{BASE_URL}/projects/{project_id}/style-profiles",
        json={
            "name": "Formal Spanish",
            "tone": "formal",
            "target_language": "es",
            "custom_rules": (
                "Use formal usted form. Avoid colloquialisms. "
                "Maintain professional register throughout."
            ),
        }
    )
    resp.raise_for_status()
    profile = resp.json()
    profile_id = profile["id"]
    print(f"  Profile Name:  {profile['name']}")
    print(f"  Profile ID:    {profile_id}")
    print(f"  Tone:          {profile['tone']}")
    print(f"  Language:      {profile['target_language']}")
    print(f"  Custom Rules:  {profile['custom_rules']}")
    return profile_id


def save_project_id(project_id: str):
    """Save project ID to a file for use by other test scripts."""
    filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "project_id.txt")
    with open(filepath, "w") as f:
        f.write(project_id)
    print(f"\n  Project ID saved to: {filepath}")


if __name__ == "__main__":
    print("=" * 60)
    print("STEP 2: Seeding Translation Memory, Glossary & Style Profile")
    print("=" * 60)
    print(f"API Base URL: {BASE_URL}")

    client = httpx.Client(timeout=120.0)

    try:
        # 1. Create project
        project_id = create_project(client)

        # 2. Seed TM pairs
        tm_count = seed_tm_pairs(client, project_id)

        # 3. Seed glossary terms
        glossary_count = seed_glossary(client, project_id)

        # 4. Create style profile
        style_id = create_style_profile(client, project_id)

        # 5. Save project ID
        save_project_id(project_id)

        # Summary
        print()
        print("=" * 60)
        print("SEED SUMMARY")
        print("=" * 60)
        print(f"  Project ID:          {project_id}")
        print(f"  TM pairs seeded:     {tm_count}")
        print(f"  Glossary terms:      {glossary_count}")
        print(f"  Style profile:       Formal Spanish ({style_id})")
        print()
        print("Next step: Run create_test_documents.py")
        print("=" * 60)

    except httpx.HTTPStatusError as e:
        print(f"\n[ERROR] HTTP {e.response.status_code}: {e.response.text}")
        sys.exit(1)
    except httpx.ConnectError:
        print(f"\n[ERROR] Cannot connect to {BASE_URL}")
        print("  Make sure the backend server is running:")
        print("  uvicorn app.main:app --reload --port 8000")
        sys.exit(1)
    finally:
        client.close()
