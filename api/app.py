from flask import Flask, render_template, request, jsonify, session, redirect
from pymongo import MongoClient
import hashlib
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone
from bson import ObjectId
import io
import csv
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import qrcode
from reportlab.pdfgen import canvas
import tempfile
import os
from flask import send_file
import requests
from io import BytesIO
app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.secret_key = os.urandom(32)
from dotenv import load_dotenv
load_dotenv()
MONGO_URI = os.getenv("mongo_uri")
if not MONGO_URI:
    raise RuntimeError(" MONGO_URI not set in environment variables")
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=20000,
    connectTimeoutMS=20000
)
db = client["CSI_WEBSITE"]
admins = db["admin_users"]
hero_collection = db["hero_section"]
events_collection = db["events"]
team_collection = db["team_members"]
alumni_collection = db["alumni"]
forms_collection = db["embedded_forms"]

certificate_participants = db["certificate_participants"]
client.admin.command("ping")
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
if not CLOUDINARY_URL:
    raise RuntimeError(" CLOUDINARY_URL not set in environment variables")
cloudinary.config(
    cloudinary_url=CLOUDINARY_URL,
    secure=True
)
@app.route("/")
def index():
    return render_template("index.html")
@app.route("/partials/<page>")
def user_partial(page):
    try:
        return render_template(f"partials/{page}.html")
    except:
        return "Page Not Found", 404

@app.route("/pages/<page>")
def serve_spa_page(page):
    return render_template("index.html")

@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    admin = admins.find_one({"username": username})
    if not admin:
        return jsonify({"status": "error", "message": "Invalid username"}), 401
    if admin["password"] != password:
        return jsonify({"status": "error", "message": "Invalid password"}), 401
    session_key = hashlib.sha256((username + password).encode()).hexdigest()
    session["admin"] = {
        "username": username,
        "session_key": session_key
    }
    return jsonify({
        "status": "success",
        "redirect": "/admin-panel",
        "session_key": session_key
    })
@app.route("/admin-panel")
def admin_panel():
    print(session)
    if "admin" not in session:
        return redirect("/")
    return render_template("admin.html", page="dashboard")
from flask import redirect, url_for, session
 
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return redirect("/admin-panel")


@app.route("/admin/pages/<page>")
def admin_spa(page):
    print(session)
    if "admin" not in session:
        return redirect("/")
    return render_template("admin.html", page=page)
@app.route("/admin/<page>")
def admin_partial(page):
    print(session)
    if "admin" not in session:
        return redirect("/")
    try:
        return render_template(f"admin/{page}.html")
    except:
        return "Page Not Found", 404
@app.route("/admin/partials/<page>")
def admin_partials(page):
    print(session)
    if "admin" not in session:
        return redirect("/")
    try:
        return render_template(f"admin/{page}.html")
    except:
        return "Partial not found", 404
@app.route("/admin/update-hero", methods=["POST"])
def update_hero():
    if "admin" not in session:
        return jsonify({"status": "error", "message": "Admin not logged in"}), 401

    try:
        title = request.form.get('heroTitle', '').strip()
        button_name = request.form.get('btn1Label', '').strip()
        link_input = request.form.get('btn1Link', '').strip()
        banner_file = request.files.get('heroBanner')

        # === IMAGE UPLOAD (Cloudinary overwrite logic) ===
        hero_image_url = None
        if banner_file and banner_file.filename:
            upload_result = cloudinary.uploader.upload(
                banner_file,
                folder="CSI/Hero",
                public_id="hero_banner",  # fixed name for overwrite
                overwrite=True,
                resource_type="image"
            )
            hero_image_url = upload_result.get("secure_url")

        # === LINK LOGIC ===
        generated_link = None
        embed_code = None
        link_type = "url"  # default type

        # Case A: Embedded code detected
        if "<iframe" in link_input or "<form" in link_input:
            from uuid import uuid4
            slug = uuid4().hex[:10]
            generated_link = f"/form/{slug}"
            link_type = "embed"
            embed_code = link_input

            # Store embed form in DB
            forms_collection.insert_one({
                "slug": slug,
                "embed_code": embed_code,
                "created_at": datetime.utcnow()
            })

        # Case B: Empty or "#"
        elif link_input == "#":
            generated_link = "#"
            link_type = "hash"

        # Case C: Normal URL
        else:
            generated_link = link_input
            link_type = "url"

        # === SAVE HERO DATA ===
        update_data = {
            "hero_title": title,
            "btn1_label": button_name,
            "btn1_link": generated_link,
            "link_type": link_type,
            "updated_at": datetime.utcnow()
        }

        if hero_image_url:
            update_data["hero_image_url"] = hero_image_url

        hero_collection.update_one(
            {"type": "hero"},
            {"$set": update_data},
            upsert=True
        )

        return jsonify({
            "status": "success",
            "message": "Hero updated successfully",
            "generated_link": generated_link,
            "link_type": link_type,
            "hero_image_url": hero_image_url
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500
@app.route("/form/<slug>")
def show_embedded_form(slug):
    data = forms_collection.find_one({"slug": slug})
    if not data:
        return "Form not found", 404

    embed_code = data.get("embed_code", "")
    return render_template("embedded_form.html", embed=embed_code)


@app.route('/api/hero-section', methods=['GET'])
def get_hero_section():
    last_client_update = request.args.get("last_update")

    data = hero_collection.find_one({}, {"_id": 0})
    if not data:
        return jsonify({"status": "error", "message": "No hero data found"}), 404

    server_time = data.get("updated_at")


    if last_client_update and server_time:
        try:
            client_time = datetime.fromisoformat(last_client_update)
            if server_time <= client_time:
                return jsonify({
                    "status": "not_modified"
                })
        except:
            pass

    # Only send updated values
    response = {"status": "success"}

    allowed_fields = [
        "hero_title",
        "btn1_label",
        "btn1_link",
        "btn2_label",
        "btn2_link",
        "schedule_link",
        "hero_image_url"
    ]

    for field in allowed_fields:
        if field in data:
            response[field] = data[field]

    response["updated_at"] = server_time.isoformat() if server_time else None

    return jsonify(response)

# -------- Add New Event --------
@app.route("/admin/add-event", methods=["POST"])
def add_event():
    if "admin" not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    try:
        title = request.form.get("title")
        date = request.form.get("date")
        description = request.form.get("description")
        participants = int(request.form.get("participants", 0))
        teams = int(request.form.get("teams", 0))
        image = request.files.get("image")

        image_url = None
        if image and image.filename:
            upload = cloudinary.uploader.upload(
                image,
                folder="CSI/Events"
            )
            image_url = upload.get("secure_url")

        events_collection.insert_one({
            "title": title,
            "date": date,
            "description": description,
            "participants": participants,
            "teams":teams,
            "image_url": image_url,
            "created_at": datetime.utcnow()
        })

        return jsonify({"status": "success", "message": "Event added successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/admin/get-event/<event_id>")
def get_event(event_id):
    if "admin" not in session:
        return jsonify({"status": "error"}), 401

    event = events_collection.find_one({"_id": ObjectId(event_id)}, {"_id": 0})
    if not event:
        return jsonify({"status": "error", "message": "Event not found"}), 404

    return jsonify({"status": "success", "data": event})


# -------- Update Event --------
@app.route("/admin/update-event/<event_id>", methods=["POST"])
def update_event(event_id):
    if "admin" not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    try:
        title = request.form.get("title")
        date = request.form.get("date")
        description = request.form.get("description")
        participants = int(request.form.get("participants", 0))
        teams = int(request.form.get("teams", 0))
        image = request.files.get("image")

        update_data = {
            "title": title,
            "date": date,
            "description": description,
            "participants": participants,
            "teams":teams,
            "updated_at": datetime.utcnow()
        }

        if image and image.filename:
            upload = cloudinary.uploader.upload(
                image,
                folder="CSI/Events",
                overwrite=True
            )
            update_data["image_url"] = upload.get("secure_url")

        events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )

        return jsonify({"status": "success", "message": "Event updated successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
@app.route("/admin/list-events")
def list_events():
    events = list(events_collection.find({}, {
        "_id": 1,
        "title": 1,
        "date": 1,
        "description": 1,
        "participants": 1,
        "teams":1,
        "image_url": 1
    }))

    for ev in events:
        ev["_id"] = str(ev["_id"])

    return jsonify({
        "status": "success",
        "events": events
    })


@app.route("/api/events")
def get_events():
    events = list(events_collection.find({}, {
        "_id": 0,
        "title": 1,
        "date": 1,
        "description": 1,     
        "participants": 1,
        "teams":1,      
        "image_url": 1
    }).sort("created_at", -1))
    return jsonify({
        "status": "success",
        "events": events
    })
@app.route("/api/team")
def get_team():
    members = list(team_collection.find({}, {
        "_id": 0,
        "name": 1,
        "role": 1,
        "category": 1,
        "department": 1,
        "image_url": 1,
        "linkedin": 1,
        "instagram": 1,
        "order": 1
    }).sort([
        ("category", 1),   # group by category A → Z
        ("_id", 1)         # FIFO inside each category
    ]))

    return jsonify({
        "status": "success",
        "members": members
    })


@app.route("/admin/add-team-member", methods=["POST"])
def add_team_member():
    if "admin" not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    image_url = None
    image = request.files.get("image")

    if image and image.filename:
        upload = cloudinary.uploader.upload(image, folder="CSI/Team")
        image_url = upload.get("secure_url")

    team_collection.insert_one({
        "name": request.form.get("name"),
        "role": request.form.get("role"),
        "category": request.form.get("category"),
        "department": request.form.get("department"),
        "linkedin": request.form.get("linkedin"),
        "instagram": request.form.get("instagram"),
        "image_url": image_url,
        "created_at": datetime.now(timezone.utc)
    })

    return jsonify({"status": "success"})
@app.route("/admin/get-team/<member_id>")
def get_team_member(member_id):
    member = team_collection.find_one({"_id": ObjectId(member_id)})

    if not member:
        return jsonify({"error": "Member not found"}), 404

    return jsonify({
        "name": member.get("name", ""),
        "role": member.get("role", ""),
        "category": member.get("category", ""),
        "department": member.get("department", ""),
        "linkedin": member.get("linkedin", ""),
        "instagram": member.get("instagram", ""),
        "image_url": member.get("image_url", "")
    })

@app.route("/admin/list-team")
def list_team():
    if "admin" not in session:
        return jsonify({"status": "error"}), 401

    members = list(team_collection.find({}))
    for m in members:
        m["_id"] = str(m["_id"])

    return jsonify({
        "status": "success",
        "members": members
    })
@app.route("/admin/update-team/<member_id>", methods=["POST"])
def update_team_member(member_id):
    data = request.get_json()

    team_collection.update_one(
        {"_id": ObjectId(member_id)},
        {"$set": data}
    )

    return jsonify({"status": "success"})

@app.route("/admin/delete-team/<member_id>", methods=["DELETE"])
def delete_team_member(member_id):
    if "admin" not in session:
        return jsonify({"status": "error"}), 401

    team_collection.delete_one({"_id": ObjectId(member_id)})

    return jsonify({"status": "success", "message": "Deleted"})
@app.route("/admin/add-alumni", methods=["POST"])
def add_alumni():
    if "admin" not in session:
        return jsonify({"status": "error"}), 401

    try:
        name = request.form.get("name")
        position = request.form.get("position")
        batch = request.form.get("batch")
        image = request.files.get("photo")

        image_url = None
        if image and image.filename:
            upload = cloudinary.uploader.upload(
                image,
                folder="CSI/Alumni"
            )
            image_url = upload.get("secure_url")

        alumni_collection.insert_one({
            "name": name,
            "position": position,
            "batch": batch,
            "image_url": image_url,
            "created_at": datetime.utcnow()
        })

        return jsonify({"status": "success", "message": "Alumni added"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
@app.route("/admin/list-alumni")
def list_alumni():
    if "admin" not in session:
        return jsonify({"status": "error"}), 401

    alumni = list(alumni_collection.find({}))
    for a in alumni:
        a["_id"] = str(a["_id"])

    return jsonify({"status": "success", "alumni": alumni})
@app.route("/admin/update-alumni/<alumni_id>", methods=["POST"])
def update_alumni(alumni_id):
    data = request.get_json()

    alumni_collection.update_one(
        {"_id": ObjectId(alumni_id)},
        {"$set": {
            "name": data["name"],
            "role": data["role"],
            "company": data.get("company", ""),
            "year": data.get("year", ""),
            "linkedin": data.get("linkedin", "")
        }}
    )

    return jsonify({"status": "success"})

@app.route("/admin/delete-alumni/<alumni_id>", methods=["DELETE"])
def delete_alumni(alumni_id):
    if "admin" not in session:
        return jsonify({"status": "error"}), 401

    alumni_collection.delete_one({"_id": ObjectId(alumni_id)})
    return jsonify({"status": "success"})
@app.route("/api/alumni")
def public_alumni():
    alumni = list(alumni_collection.find({}, {
        "_id": 0,
        "name": 1,
        "position": 1,
        "batch": 1,
        "image_url": 1
    }).sort("batch", -1))

    return jsonify({"status": "success", "alumni": alumni})

@app.route("/admin/get-alumni/<alumni_id>")
def get_alumni_member(alumni_id):
    alumni = alumni_collection.find_one({"_id": ObjectId(alumni_id)})

    if not alumni:
        return jsonify({"status": "error", "message": "Not found"}), 404

    return jsonify({
        "name": alumni.get("name", ""),
        "role": alumni.get("role", ""),
        "company": alumni.get("company", ""),
        "year": alumni.get("year", ""),
        "linkedin": alumni.get("linkedin", ""),
        "image_url": alumni.get("image_url", "")
    })

cert_events = db["certificate_events"]
participants_collection = db["certificate_participants"]
@app.route("/admin/create-certificate-event", methods=["POST"])
def create_certificate_event():
    try:
        year = request.form.get("year")
        event_name = request.form.get("event_name")
        date = request.form.get("date")
        csv_file = request.files.get("participants_csv")

        if not all([year, event_name, date, csv_file]):
            return jsonify({"success": False, "error": "All fields required"}), 400

        # -------- CREATE EVENT --------
        event = {
        "year": year,
        "event_name": event_name,
        "date": date,
        "created_at": datetime.utcnow()
        }


        result = cert_events.insert_one(event)
        event_id = result.inserted_id

        # -------- READ CSV --------
        stream = csv_file.stream.read().decode("utf-8").splitlines()
        reader = csv.DictReader(stream)

        required_cols = {"name", "position"}
        if not required_cols.issubset(reader.fieldnames):
            return jsonify({
                "success": False,
                "error": "CSV must contain columns: name, position"
            }), 400

        participants = []
        for row in reader:
            name = row["name"].strip()
            position = row["position"].strip().lower()

            if not name:
                continue

            participants.append({
                "event_id": event_id,
                "name": name,
                "position": position,
                "created_at": datetime.utcnow()
            })

        if participants:
            certificate_participants.insert_many(participants)

        return jsonify({
            "success": True,
            "event_id": str(event_id)
        })

    except Exception as e:
        print("CERT ADMIN ERROR:", e)
        return jsonify({"success": False, "error": str(e)}), 500
@app.route("/admin/upload-certificate-participants", methods=["POST"])
def upload_certificate_participants():
    event_id = request.form.get("event_id")
    file = request.files.get("file")

    if not event_id or not file:
        return jsonify(success=False)

    stream = io.StringIO(file.stream.read().decode("utf-8"))
    reader = csv.DictReader(stream)

    for row in reader:
        certificate_participants.insert_one({
            "event_id": ObjectId(event_id),
            "name": row["name"].strip(),
            "position": row["position"].strip().lower()
        })

    return jsonify(success=True)
@app.route("/api/certificates/years")
def certificate_years():
    years = cert_events.distinct("year")
    return jsonify(sorted(years, reverse=True))
@app.route("/api/certificates/events/<year>")
def certificate_events_by_year(year):
    events = list(cert_events.find(
        {"year": year},
        {"event_name": 1}
    ))
    return jsonify([
        {"id": str(e["_id"]), "name": e["event_name"]}
        for e in events
    ])
@app.route("/api/certificates/participants/<event_id>")
def certificate_participants_list(event_id):
    parts = certificate_participants.find(
        {"event_id": ObjectId(event_id)},
        {"name": 1}
    )
    return jsonify([p["name"] for p in parts])
@app.route("/certificates/list")
def list_certificates():
    data = {}

    for ev in cert_events.find():
        year = ev["year"]
        if year not in data:
            data[year] = []

        data[year].append({
            "id": str(ev["_id"]),
            "name": ev["event_name"]
        })

    return jsonify(data)

@app.route("/certificates/participants/<event_id>")
def list_participants(event_id):
    names = certificate_participants.find(
        {"event_id": ObjectId(event_id)},
        {"name": 1, "_id": 0}
    )
    return jsonify([p["name"] for p in names])
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader

@app.route("/certificate/download", methods=["POST"])
def download_certificate():

    name = request.form["name"]
    event_id = request.form["event_id"]

    participant = certificate_participants.find_one({
        "event_id": ObjectId(event_id),
        "name": {"$regex": f"^{name}$", "$options": "i"}
    })

    if not participant:
        return jsonify({
            "error": "No participant found. Contact admin."
        }), 404

    event = cert_events.find_one({"_id": ObjectId(event_id)})

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    # ===== BORDER =====
    c.setStrokeColor(HexColor("#1e3a8a"))
    c.setLineWidth(10)
    c.rect(30, 30, width-60, height-60)

    # ===== LOGOS =====
    c.drawImage(
        "static/images/csi-logo.png",
        60, height-140, width=80, preserveAspectRatio=True
    )
    c.drawImage(
        "static/images/griet-logo.png",
        width-140, height-140, width=80, preserveAspectRatio=True
    )

    # ===== HEADER =====
    c.setFont("Times-Bold", 28)
    c.drawCentredString(width/2, height-100, "Computer Society of India")

    c.setFont("Times-Roman", 18)
    c.drawCentredString(width/2, height-135, "GRIET Student Chapter")

    # Divider
    c.line(80, height-160, width-80, height-160)

    # ===== BODY =====
    c.setFont("Times-Bold", 32)
    c.drawCentredString(width/2, height-230, "Certificate of Participation")

    c.setFont("Times-Roman", 18)
    c.drawCentredString(width/2, height-280, "This is to certify that")

    c.setFont("Times-Bold", 36)
    c.drawCentredString(width/2, height-330, participant["name"].upper())

    c.setFont("Times-Roman", 18)
    c.drawCentredString(width/2, height-380, "has successfully participated in the event")

    c.setFont("Times-Bold", 22)
    c.drawCentredString(width/2, height-420, event["event_name"])

    c.setFont("Times-Roman", 16)
    c.drawCentredString(width/2, height-460, f"conducted in the year {event['year']}")

    # ===== QR CODE =====
    qr_data = f"{event_id}:{participant['_id']}"
    qr_img = qrcode.make(qr_data)
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    qr_buf.seek(0)

    c.drawImage(ImageReader(qr_buf), width/2-60, 110, 120, 120)

    # ===== SIGNATURES =====
    c.setFont("Times-Bold", 14)
    c.drawCentredString(200, 90, "CSI GRIET")
    c.setFont("Times-Roman", 12)
    c.drawCentredString(200, 70, "Faculty Coordinator")

    c.setFont("Times-Bold", 14)
    c.drawCentredString(width-200, 90, "GRIET")
    c.setFont("Times-Roman", 12)
    c.drawCentredString(width-200, 70, "Principal")

    c.showPage()
    c.save()

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"{participant['name']}_certificate.pdf"
    )
@app.route("/api/certificate/validate", methods=["POST"])
def validate_certificate():

    data = request.json
    event_id = data.get("event_id")
    name = data.get("name", "").strip()

    if not event_id or not name:
        return jsonify({
            "valid": False,
            "message": "Missing data"
        })

    participant = certificate_participants.find_one({
        "event_id": ObjectId(event_id),
        "name": {"$regex": f"^{name}$", "$options": "i"}
    })

    if not participant:
        return jsonify({
            "valid": False,
            "message": "No participant found. Contact admin."
        })

    return jsonify({
        "valid": True,
        "name": participant["name"],
        "position": participant.get("position", "participant")
    })
@app.route("/api/events/latest")
def get_latest_events():
    try:
        events = list(
            events_collection
            .find({})
            .sort("created_at", -1) 
            .limit(6)
        )

        for ev in events:
            ev["_id"] = str(ev["_id"])

        return jsonify({
            "status": "success",
            "events": events
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
@app.route("/certificate-template")
def certificate_template():
    return render_template("certificate_template.html")


# if __name__ == "__main__":
#     app.run(debug=True)
    # Vercel needs this variable
handler = app

