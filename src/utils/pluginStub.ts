export const DEFAULT_PLUGIN_STUB = `import httpx

PLUGIN_NAME = "create_lead"
PLUGIN_DISPLAY_NAME = "Create Lead"
PLUGIN_DESCRIPTION = (
    "Use when the visitor wants to be contacted, requests a callback or demo, "
    "or shares an email so you can create a lead. Requires the visitor email."
)


class PluginInputs:
    email = {
        "type": "string",
        "description": "Visitor email address to create a lead for",
        "required": True,
    }


class PluginSecrets:
    api_url = ""
    api_key = ""


def run(inputs: dict, secrets):
    email = (inputs.get("email") or "").strip().lower()
    if not email:
        return {"error": True, "message": "email is required."}

    api_url = (secrets.api_url or "").strip()
    api_key = (secrets.api_key or "").strip()
    if not api_url or not api_key:
        return {"error": True, "message": "Lead API URL or API key is not configured."}

    with httpx.Client(timeout=15.0) as client:
        response = client.post(
            api_url,
            json={"email": email},
            headers={
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )

    try:
        body = response.json()
    except Exception:
        body = response.text or ""

    if response.status_code >= 400:
        return {
            "error": True,
            "status_code": response.status_code,
            "body": body,
        }

    return body if isinstance(body, dict) else {"result": body}
`;
