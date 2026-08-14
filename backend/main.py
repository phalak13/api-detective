from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import time

app = FastAPI(
    title="API Detective",
    description="A REST API monitoring and analysis tool",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "API Detective is alive 🕵️"
    }


def analyze_status(status_code):
    if 200 <= status_code < 300:
        return {
            "category": "Success",
            "severity": "LOW",
            "message": "API request was successful."
        }

    elif 300 <= status_code < 400:
        return {
            "category": "Redirection",
            "severity": "LOW",
            "message": "API returned a redirect."
        }

    elif status_code == 401:
        return {
            "category": "Authentication Error",
            "severity": "MEDIUM",
            "message": "Authentication is required or invalid."
        }

    elif status_code == 403:
        return {
            "category": "Authorization Error",
            "severity": "MEDIUM",
            "message": "Access to this resource is forbidden."
        }

    elif status_code == 404:
        return {
            "category": "Not Found",
            "severity": "LOW",
            "message": "The requested resource was not found."
        }

    elif status_code == 429:
        return {
            "category": "Rate Limited",
            "severity": "MEDIUM",
            "message": "Too many requests were sent."
        }

    elif 400 <= status_code < 500:
        return {
            "category": "Client Error",
            "severity": "MEDIUM",
            "message": "The request contains an error."
        }

    elif 500 <= status_code < 600:
        return {
            "category": "Server Error",
            "severity": "HIGH",
            "message": "The API server encountered an error."
        }

    return {
        "category": "Unknown",
        "severity": "UNKNOWN",
        "message": "Unrecognized HTTP status code."
    }


def calculate_health_score(
    status_code,
    security_score,
    response_time,
    is_json
):
    score = 0

    # Availability: 40 points
    if 200 <= status_code < 300:
        score += 40
    elif 300 <= status_code < 400:
        score += 30
    elif 400 <= status_code < 500:
        score += 15

    # Security: 25 points
    score += round(security_score * 0.25)

    # Response time: 20 points
    if response_time < 300:
        score += 20
    elif response_time < 500:
        score += 15
    elif response_time < 1000:
        score += 10
    else:
        score += 5

    # JSON: 15 points
    if is_json:
        score += 15

    return score


def generate_findings(
    status_code,
    response_time,
    security_checks,
    is_json
):
    findings = []

    # Status
    if 200 <= status_code < 300:
        findings.append({
            "type": "success",
            "message": "API responded successfully."
        })
    elif status_code == 401:
        findings.append({
            "type": "warning",
            "message": "Authentication is required or invalid."
        })
    elif status_code == 403:
        findings.append({
            "type": "warning",
            "message": "Access to this resource is forbidden."
        })
    elif status_code == 404:
        findings.append({
            "type": "warning",
            "message": "The requested resource was not found."
        })
    elif status_code == 429:
        findings.append({
            "type": "warning",
            "message": "The API is rate limiting requests."
        })
    elif status_code >= 500:
        findings.append({
            "type": "danger",
            "message": "The API server returned a server error."
        })

    # Response time
    if response_time < 300:
        findings.append({
            "type": "success",
            "message": "API response time is fast."
        })
    elif response_time < 1000:
        findings.append({
            "type": "warning",
            "message": "API response time is moderate."
        })
    else:
        findings.append({
            "type": "danger",
            "message": "API response time is slow."
        })

    # Security headers
    missing_headers = [
        header
        for header, present in security_checks.items()
        if not present
    ]

    if not missing_headers:
        findings.append({
            "type": "success",
            "message": "All checked security headers are present."
        })
    else:
        findings.append({
            "type": "warning",
            "message": (
                f"Missing security headers: "
                f"{', '.join(missing_headers)}"
            )
        })

    # JSON
    if is_json:
        findings.append({
            "type": "success",
            "message": "API returned valid JSON."
        })
    else:
        findings.append({
            "type": "warning",
            "message": "API response is not JSON."
        })

    return findings


@app.get("/analyze")
def analyze(url: str):

    url = url.strip().strip("'\"")

    start_time = time.time()

    try:
       response = requests.get(
    url,
    timeout=5,
    headers={
        "User-Agent": "API-Detective/1.0"
    }
)

        end_time = time.time()

        response_time = round(
            (end_time - start_time) * 1000,
            2
        )

        status_analysis = analyze_status(
            response.status_code
        )

        headers = dict(response.headers)

        # Analyze response body
        try:
            data = response.json()
            is_json = True

            if isinstance(data, dict):
                json_type = "object"
                field_count = len(data)

            elif isinstance(data, list):
                json_type = "array"
                field_count = len(data)

            else:
                json_type = "primitive"
                field_count = 1

        except ValueError:
            is_json = False
            json_type = "non-JSON"
            field_count = 0

        # Security header checks
        security_checks = {
            "Strict-Transport-Security":
                "Strict-Transport-Security" in headers,

            "X-Frame-Options":
                "X-Frame-Options" in headers,

            "X-Content-Type-Options":
                "X-Content-Type-Options" in headers,

            "Content-Security-Policy":
                "Content-Security-Policy" in headers,

            "Referrer-Policy":
                "Referrer-Policy" in headers
        }

        passed = sum(security_checks.values())
        total = len(security_checks)

        security_score = round(
            (passed / total) * 100
        )

        health_score = calculate_health_score(
            response.status_code,
            security_score,
            response_time,
            is_json
        )

        findings = generate_findings(
            response.status_code,
            response_time,
            security_checks,
            is_json
        )

        return {
            "url": url,
            "status_code": response.status_code,
            "status_analysis": status_analysis,
            "response_time_ms": response_time,
            "is_alive": response.ok,
            "is_json": is_json,
            "json_type": json_type,
            "field_count": field_count,
            "security_score": security_score,
            "security_checks": security_checks,
            "health_score": health_score,
            "findings": findings
        }

    except requests.exceptions.RequestException as e:

        return {
            "url": url,
            "is_alive": False,
            "error": str(e)
        }