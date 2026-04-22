import base64
import json
import os
import sys


def decode_role(secret: str) -> str | None:
    parts = secret.split(".")
    if len(parts) < 2:
        return None
    try:
        payload_segment = parts[1] + ("=" * (-len(parts[1]) % 4))
        payload = json.loads(base64.urlsafe_b64decode(payload_segment.encode("utf-8")).decode("utf-8"))
    except Exception:
        return None
    role = payload.get("role")
    return str(role) if role else None


def main() -> int:
    secret = (os.getenv("SUPABASE_SERVICE_KEY") or "").strip()
    if not secret:
        print("Missing secret: SUPABASE_SERVICE_KEY")
        return 1

    lowered = secret.lower()
    if secret.startswith("sb_publishable_"):
        print("SUPABASE_SERVICE_KEY is a publishable key, not a service-role key.")
        return 1
    if "anon" in lowered and "." in secret:
        role = decode_role(secret)
        if role == "anon":
            print("SUPABASE_SERVICE_KEY decodes to role=anon, not service_role.")
            return 1

    role = decode_role(secret)
    if role and role != "service_role":
        print(f"SUPABASE_SERVICE_KEY decodes to role={role}, not service_role.")
        return 1

    if role == "service_role":
        print("SUPABASE_SERVICE_KEY validation passed (role=service_role).")
        return 0

    print("SUPABASE_SERVICE_KEY is present. Role could not be decoded, so format checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
