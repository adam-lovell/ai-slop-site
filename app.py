"""
Shiny Rides — Luxury Car Detailing Service
Flask backend handling contact form emails and serving the single-page site.
"""

import os
import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Configuration – set these environment variables before deploying:
#   MAIL_SERVER, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_RECIPIENT
# For local dev the form will simply return success without sending.
# ---------------------------------------------------------------------------
MAIL_SERVER   = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT     = int(os.getenv("MAIL_PORT", "587"))
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_RECIPIENT = os.getenv("MAIL_RECIPIENT", "bookings@shinyrides.com")


def _send_email(name: str, email: str, phone: str, service: str, message: str) -> bool:
    """Send a booking-request email. Returns True on success."""
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        # Dev mode – just log to console
        print(f"[DEV] Booking from {name} <{email}> | {phone} | {service}")
        print(f"[DEV] Message: {message}")
        return True

    subject = f"New Booking Request — {service} — {name}"
    body = (
        f"Name:    {name}\n"
        f"Email:   {email}\n"
        f"Phone:   {phone}\n"
        f"Service: {service}\n"
        f"Date:    {datetime.now():%Y-%m-%d %H:%M}\n\n"
        f"Message:\n{message}"
    )

    msg = MIMEMultipart()
    msg["From"]    = MAIL_USERNAME
    msg["To"]      = MAIL_RECIPIENT
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
            server.starttls()
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_USERNAME, MAIL_RECIPIENT, msg.as_string())
        return True
    except Exception as exc:
        print(f"[ERROR] Failed to send email: {exc}")
        return False


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/book", methods=["POST"])
def book():
    """Handle the booking form submission (AJAX)."""
    data = request.get_json(silent=True) or {}

    name    = data.get("name", "").strip()
    email   = data.get("email", "").strip()
    phone   = data.get("phone", "").strip()
    service = data.get("service", "").strip()
    message = data.get("message", "").strip()

    # Basic validation
    errors = []
    if not name:
        errors.append("Name is required.")
    if not email or not EMAIL_RE.match(email):
        errors.append("A valid email address is required.")
    if not service:
        errors.append("Please select a service.")

    if errors:
        return jsonify({"ok": False, "errors": errors}), 422

    success = _send_email(name, email, phone, service, message)
    if success:
        return jsonify({"ok": True, "message": "Booking request received! We'll be in touch shortly."})
    else:
        return jsonify({"ok": False, "errors": ["Something went wrong. Please try again later."]}), 500


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
