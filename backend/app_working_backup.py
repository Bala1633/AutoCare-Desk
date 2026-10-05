from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import requests

from models import (
    db,
    User,
    Customer,
    Vehicle,
    ServiceAppointment,
    WorkOrder,
    WorkItem,
    Part
)

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///autocare.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return jsonify({
        "message": "AutoCare Desk Backend is Running"
    })


# =========================================================
# USER HELPERS / AUTH
# =========================================================

def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not name or not email or not password or not role:
        return jsonify({
            "error": "All fields are required"
        }), 400

    if role not in ["Advisor", "Mechanic", "Manager"]:
        return jsonify({
            "error": "Invalid role"
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            "error": "Email already registered"
        }), 409

    user = User(
        name=name,
        email=email,
        password=generate_password_hash(password),
        role=role
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": user_to_dict(user)
    }), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    if not check_password_hash(
        user.password,
        password
    ):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    return jsonify({
        "message": "Login successful",
        "user": user_to_dict(user)
    })


@app.route("/mechanics", methods=["GET"])
def get_mechanics():
    mechanics = User.query.filter_by(
        role="Mechanic"
    ).all()

    return jsonify([
        user_to_dict(mechanic)
        for mechanic in mechanics
    ])


# =========================================================
# CUSTOMERS
# =========================================================

def customer_to_dict(customer):
    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "address": customer.address
    }


@app.route("/customers", methods=["GET"])
def get_customers():
    customers = Customer.query.order_by(
        Customer.id.desc()
    ).all()

    return jsonify([
        customer_to_dict(customer)
        for customer in customers
    ])


@app.route("/customers", methods=["POST"])
def create_customer():
    data = request.get_json()

    if not data.get("name") or not data.get("phone"):
        return jsonify({
            "error": "Name and phone are required"
        }), 400

    customer = Customer(
        name=data["name"],
        phone=data["phone"],
        email=data.get("email"),
        address=data.get("address")
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer created successfully",
        "customer": customer_to_dict(customer)
    }), 201


@app.route(
    "/customers/<int:customer_id>",
    methods=["PUT"]
)
def update_customer(customer_id):
    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:
        return jsonify({
            "error": "Customer not found"
        }), 404

    data = request.get_json()

    customer.name = data.get(
        "name",
        customer.name
    )

    customer.phone = data.get(
        "phone",
        customer.phone
    )

    customer.email = data.get(
        "email",
        customer.email
    )

    customer.address = data.get(
        "address",
        customer.address
    )

    db.session.commit()

    return jsonify({
        "message": "Customer updated successfully",
        "customer": customer_to_dict(customer)
    })


@app.route(
    "/customers/<int:customer_id>",
    methods=["DELETE"]
)
def delete_customer(customer_id):
    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:
        return jsonify({
            "error": "Customer not found"
        }), 404

    if customer.vehicles:
        return jsonify({
            "error":
            "Cannot delete customer while vehicles exist"
        }), 400

    db.session.delete(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer deleted successfully"
    })


# =========================================================
# VIN LOOKUP
# =========================================================

@app.route("/vin/<string:vin>", methods=["GET"])
def vin_lookup(vin):
    vin = vin.strip().upper()

    if len(vin) != 17:
        return jsonify({
            "error":
            "VIN must contain exactly 17 characters"
        }), 400

    url = (
        "https://vpic.nhtsa.dot.gov/api/"
        f"vehicles/DecodeVinValues/{vin}"
        "?format=json"
    )

    try:
        response = requests.get(
            url,
            timeout=10
        )

        response.raise_for_status()

        results = response.json().get(
            "Results",
            []
        )

        if not results:
            return jsonify({
                "error": "VIN information not found"
            }), 404

        result = results[0]

        decoded = {
            "vin": vin,
            "make": result.get("Make", ""),
            "model": result.get("Model", ""),
            "year": result.get("ModelYear", ""),
            "vehicle_type":
                result.get("VehicleType", "")
        }

        return jsonify(decoded)

    except requests.RequestException:
        return jsonify({
            "error":
            "Unable to connect to NHTSA VIN service"
        }), 503


# =========================================================
# VEHICLES
# =========================================================

def vehicle_to_dict(vehicle):
    return {
        "id": vehicle.id,
        "customer_id": vehicle.customer_id,
        "customer_name":
            vehicle.customer.name
            if vehicle.customer
            else "",
        "vin": vehicle.vin,
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "vehicle_type":
            vehicle.vehicle_type
    }


@app.route("/vehicles", methods=["GET"])
def get_vehicles():
    vehicles = Vehicle.query.order_by(
        Vehicle.id.desc()
    ).all()

    return jsonify([
        vehicle_to_dict(vehicle)
        for vehicle in vehicles
    ])


@app.route("/vehicles", methods=["POST"])
def create_vehicle():
    data = request.get_json()

    customer_id = data.get(
        "customer_id"
    )

    vin = data.get(
        "vin",
        ""
    ).strip().upper()

    if not customer_id:
        return jsonify({
            "error": "Customer is required"
        }), 400

    if len(vin) != 17:
        return jsonify({
            "error":
            "VIN must contain exactly 17 characters"
        }), 400

    if Vehicle.query.filter_by(
        vin=vin
    ).first():
        return jsonify({
            "error":
            "VIN already registered"
        }), 409

    vehicle = Vehicle(
        customer_id=int(customer_id),
        vin=vin,
        make=data.get("make"),
        model=data.get("model"),
        year=data.get("year"),
        vehicle_type=data.get(
            "vehicle_type"
        )
    )

    db.session.add(vehicle)
    db.session.commit()

    return jsonify({
        "message":
            "Vehicle registered successfully",
        "vehicle":
            vehicle_to_dict(vehicle)
    }), 201


@app.route(
    "/vehicles/<int:vehicle_id>",
    methods=["PUT"]
)
def update_vehicle(vehicle_id):
    vehicle = db.session.get(
        Vehicle,
        vehicle_id
    )

    if not vehicle:
        return jsonify({
            "error": "Vehicle not found"
        }), 404

    data = request.get_json()

    vehicle.customer_id = int(
        data.get(
            "customer_id",
            vehicle.customer_id
        )
    )

    vehicle.vin = data.get(
        "vin",
        vehicle.vin
    ).strip().upper()

    vehicle.make = data.get(
        "make",
        vehicle.make
    )

    vehicle.model = data.get(
        "model",
        vehicle.model
    )

    vehicle.year = data.get(
        "year",
        vehicle.year
    )

    vehicle.vehicle_type = data.get(
        "vehicle_type",
        vehicle.vehicle_type
    )

    db.session.commit()

    return jsonify({
        "message":
            "Vehicle updated successfully",
        "vehicle":
            vehicle_to_dict(vehicle)
    })


@app.route(
    "/vehicles/<int:vehicle_id>",
    methods=["DELETE"]
)
def delete_vehicle(vehicle_id):
    vehicle = db.session.get(
        Vehicle,
        vehicle_id
    )

    if not vehicle:
        return jsonify({
            "error": "Vehicle not found"
        }), 404

    if vehicle.work_orders:
        return jsonify({
            "error":
            "Cannot delete vehicle while work orders exist"
        }), 400

    db.session.delete(vehicle)
    db.session.commit()

    return jsonify({
        "message":
            "Vehicle deleted successfully"
    })


# =========================================================
# APPOINTMENTS
# =========================================================

def appointment_to_dict(appointment):
    customer = db.session.get(
        Customer,
        appointment.customer_id
    )

    vehicle = db.session.get(
        Vehicle,
        appointment.vehicle_id
    )

    return {
        "id": appointment.id,

        "customer_id":
            appointment.customer_id,

        "customer_name":
            customer.name
            if customer
            else "",

        "vehicle_id":
            appointment.vehicle_id,

        "vehicle_name":
            (
                f"{vehicle.make or ''} "
                f"{vehicle.model or ''}"
            ).strip()
            if vehicle
            else "",

        "vin":
            vehicle.vin
            if vehicle
            else "",

        "appointment_date":
            appointment.appointment_date,

        "service_type":
            appointment.service_type,

        "status":
            appointment.status
    }


@app.route("/appointments", methods=["GET"])
def get_appointments():
    appointments = (
        ServiceAppointment.query
        .order_by(
            ServiceAppointment.id.desc()
        )
        .all()
    )

    return jsonify([
        appointment_to_dict(
            appointment
        )
        for appointment in appointments
    ])


@app.route("/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json()

    required = [
        data.get("customer_id"),
        data.get("vehicle_id"),
        data.get("appointment_date"),
        data.get("service_type")
    ]

    if not all(required):
        return jsonify({
            "error":
            "All appointment fields are required"
        }), 400

    appointment = ServiceAppointment(
        customer_id=int(
            data["customer_id"]
        ),

        vehicle_id=int(
            data["vehicle_id"]
        ),

        appointment_date=
            data["appointment_date"],

        service_type=
            data["service_type"],

        status="Scheduled"
    )

    db.session.add(appointment)
    db.session.commit()

    return jsonify({
        "message":
            "Appointment created successfully",

        "appointment":
            appointment_to_dict(
                appointment
            )
    }), 201


@app.route(
    "/appointments/<int:appointment_id>",
    methods=["PUT"]
)
def update_appointment(
    appointment_id
):
    appointment = db.session.get(
        ServiceAppointment,
        appointment_id
    )

    if not appointment:
        return jsonify({
            "error":
            "Appointment not found"
        }), 404

    data = request.get_json()

    appointment.customer_id = int(
        data.get(
            "customer_id",
            appointment.customer_id
        )
    )

    appointment.vehicle_id = int(
        data.get(
            "vehicle_id",
            appointment.vehicle_id
        )
    )

    appointment.appointment_date = (
        data.get(
            "appointment_date",
            appointment.appointment_date
        )
    )

    appointment.service_type = (
        data.get(
            "service_type",
            appointment.service_type
        )
    )

    appointment.status = data.get(
        "status",
        appointment.status
    )

    db.session.commit()

    return jsonify({
        "message":
            "Appointment updated successfully"
    })


@app.route(
    "/appointments/<int:appointment_id>/status",
    methods=["PATCH"]
)
def appointment_status(
    appointment_id
):
    appointment = db.session.get(
        ServiceAppointment,
        appointment_id
    )

    if not appointment:
        return jsonify({
            "error":
            "Appointment not found"
        }), 404

    status = request.get_json().get(
        "status"
    )

    allowed = [
        "Scheduled",
        "Confirmed",
        "In Service",
        "Completed",
        "Cancelled"
    ]

    if status not in allowed:
        return jsonify({
            "error": "Invalid status"
        }), 400

    appointment.status = status

    db.session.commit()

    return jsonify({
        "message":
            "Appointment status updated"
    })


@app.route(
    "/appointments/<int:appointment_id>",
    methods=["DELETE"]
)
def delete_appointment(
    appointment_id
):
    appointment = db.session.get(
        ServiceAppointment,
        appointment_id
    )

    if not appointment:
        return jsonify({
            "error":
            "Appointment not found"
        }), 404

    db.session.delete(appointment)
    db.session.commit()

    return jsonify({
        "message":
            "Appointment deleted successfully"
    })


# =========================================================
# WORK ORDERS
# =========================================================

def work_order_to_dict(order):
    vehicle = db.session.get(
        Vehicle,
        order.vehicle_id
    )

    mechanic = (
        db.session.get(
            User,
            order.mechanic_id
        )
        if order.mechanic_id
        else None
    )

    customer = (
        db.session.get(
            Customer,
            vehicle.customer_id
        )
        if vehicle
        else None
    )

    return {
        "id": order.id,

        "vehicle_id":
            order.vehicle_id,

        "vehicle_name":
            (
                f"{vehicle.make or ''} "
                f"{vehicle.model or ''}"
            ).strip()
            if vehicle
            else "",

        "vin":
            vehicle.vin
            if vehicle
            else "",

        "customer_id":
            customer.id
            if customer
            else None,

        "customer_name":
            customer.name
            if customer
            else "",

        "mechanic_id":
            order.mechanic_id,

        "mechanic_name":
            mechanic.name
            if mechanic
            else "Unassigned",

        "issue_description":
            order.issue_description,

        "status":
            order.status,

        "created_at":
            order.created_at.strftime(
                "%Y-%m-%d %H:%M"
            )
            if order.created_at
            else ""
    }


@app.route(
    "/work-orders",
    methods=["GET"]
)
def get_work_orders():
    mechanic_id = request.args.get(
        "mechanic_id"
    )

    query = WorkOrder.query

    if mechanic_id:
        query = query.filter_by(
            mechanic_id=int(
                mechanic_id
            )
        )

    orders = query.order_by(
        WorkOrder.id.desc()
    ).all()

    return jsonify([
        work_order_to_dict(order)
        for order in orders
    ])


@app.route(
    "/work-orders/<int:work_order_id>",
    methods=["GET"]
)
def get_work_order(work_order_id):
    order = db.session.get(
        WorkOrder,
        work_order_id
    )

    if not order:
        return jsonify({
            "error":
            "Work order not found"
        }), 404

    return jsonify(
        work_order_to_dict(order)
    )


@app.route(
    "/work-orders",
    methods=["POST"]
)
def create_work_order():
    data = request.get_json()

    if not data.get("vehicle_id"):
        return jsonify({
            "error":
            "Vehicle is required"
        }), 400

    if not data.get(
        "issue_description"
    ):
        return jsonify({
            "error":
            "Issue description is required"
        }), 400

    mechanic_id = data.get(
        "mechanic_id"
    )

    order = WorkOrder(
        vehicle_id=int(
            data["vehicle_id"]
        ),

        mechanic_id=(
            int(mechanic_id)
            if mechanic_id
            else None
        ),

        issue_description=
            data["issue_description"],

        status="Open"
    )

    db.session.add(order)
    db.session.commit()

    return jsonify({
        "message":
            "Work order created successfully",

        "work_order":
            work_order_to_dict(order)
    }), 201


@app.route(
    "/work-orders/<int:work_order_id>",
    methods=["PUT"]
)
def update_work_order(
    work_order_id
):
    order = db.session.get(
        WorkOrder,
        work_order_id
    )

    if not order:
        return jsonify({
            "error":
            "Work order not found"
        }), 404

    data = request.get_json()

    order.vehicle_id = int(
        data.get(
            "vehicle_id",
            order.vehicle_id
        )
    )

    mechanic_id = data.get(
        "mechanic_id"
    )

    order.mechanic_id = (
        int(mechanic_id)
        if mechanic_id
        else None
    )

    order.issue_description = (
        data.get(
            "issue_description",
            order.issue_description
        )
    )

    order.status = data.get(
        "status",
        order.status
    )

    db.session.commit()

    return jsonify({
        "message":
            "Work order updated successfully"
    })


@app.route(
    "/work-orders/<int:work_order_id>/status",
    methods=["PATCH"]
)
def work_order_status(
    work_order_id
):
    order = db.session.get(
        WorkOrder,
        work_order_id
    )

    if not order:
        return jsonify({
            "error":
            "Work order not found"
        }), 404

    status = request.get_json().get(
        "status"
    )

    allowed = [
        "Open",
        "Assigned",
        "In Progress",
        "Waiting for Parts",
        "Completed",
        "Cancelled"
    ]

    if status not in allowed:
        return jsonify({
            "error":
            "Invalid work order status"
        }), 400

    order.status = status

    db.session.commit()

    return jsonify({
        "message":
            "Work order status updated"
    })


@app.route(
    "/work-orders/<int:work_order_id>",
    methods=["DELETE"]
)
def delete_work_order(
    work_order_id
):
    order = db.session.get(
        WorkOrder,
        work_order_id
    )

    if not order:
        return jsonify({
            "error":
            "Work order not found"
        }), 404

    WorkItem.query.filter_by(
        work_order_id=order.id
    ).delete()

    Part.query.filter_by(
        work_order_id=order.id
    ).delete()

    db.session.delete(order)
    db.session.commit()

    return jsonify({
        "message":
            "Work order deleted successfully"
    })


# =========================================================
# CHECKLIST
# =========================================================

def item_to_dict(item):
    return {
        "id": item.id,
        "work_order_id":
            item.work_order_id,
        "item_name":
            item.item_name,
        "notes":
            item.notes,
        "completed":
            item.completed
    }


@app.route(
    "/work-orders/<int:work_order_id>/items",
    methods=["GET"]
)
def get_work_items(
    work_order_id
):
    items = WorkItem.query.filter_by(
        work_order_id=work_order_id
    ).all()

    return jsonify([
        item_to_dict(item)
        for item in items
    ])


@app.route(
    "/work-orders/<int:work_order_id>/items",
    methods=["POST"]
)
def add_work_item(
    work_order_id
):
    data = request.get_json()

    if not data.get("item_name"):
        return jsonify({
            "error":
            "Checklist item name is required"
        }), 400

    item = WorkItem(
        work_order_id=work_order_id,
        item_name=data["item_name"],
        notes=data.get("notes", ""),
        completed=False
    )

    db.session.add(item)
    db.session.commit()

    return jsonify({
        "message":
            "Checklist item added",
        "item":
            item_to_dict(item)
    }), 201


@app.route(
    "/work-items/<int:item_id>",
    methods=["PUT"]
)
def update_work_item(
    item_id
):
    item = db.session.get(
        WorkItem,
        item_id
    )

    if not item:
        return jsonify({
            "error":
            "Checklist item not found"
        }), 404

    data = request.get_json()

    item.item_name = data.get(
        "item_name",
        item.item_name
    )

    item.notes = data.get(
        "notes",
        item.notes
    )

    if "completed" in data:
        item.completed = bool(
            data["completed"]
        )

    db.session.commit()

    return jsonify({
        "message":
            "Checklist item updated",
        "item":
            item_to_dict(item)
    })


@app.route(
    "/work-items/<int:item_id>",
    methods=["DELETE"]
)
def delete_work_item(
    item_id
):
    item = db.session.get(
        WorkItem,
        item_id
    )

    if not item:
        return jsonify({
            "error":
            "Checklist item not found"
        }), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({
        "message":
            "Checklist item deleted"
    })


# =========================================================
# PARTS
# =========================================================

def part_to_dict(part):
    return {
        "id": part.id,

        "work_order_id":
            part.work_order_id,

        "part_name":
            part.part_name,

        "quantity":
            part.quantity,

        "price":
            part.price,

        "total":
            round(
                part.quantity *
                part.price,
                2
            )
    }


@app.route(
    "/work-orders/<int:work_order_id>/parts",
    methods=["GET"]
)
def get_parts(
    work_order_id
):
    parts = Part.query.filter_by(
        work_order_id=work_order_id
    ).all()

    return jsonify([
        part_to_dict(part)
        for part in parts
    ])


@app.route(
    "/work-orders/<int:work_order_id>/parts",
    methods=["POST"]
)
def add_part(
    work_order_id
):
    data = request.get_json()

    if not data.get("part_name"):
        return jsonify({
            "error":
            "Part name is required"
        }), 400

    try:
        quantity = int(
            data.get(
                "quantity",
                1
            )
        )

        price = float(
            data.get(
                "price",
                0
            )
        )

    except ValueError:
        return jsonify({
            "error":
            "Invalid quantity or price"
        }), 400

    part = Part(
        work_order_id=
            work_order_id,

        part_name=
            data["part_name"],

        quantity=
            quantity,

        price=
            price
    )

    db.session.add(part)
    db.session.commit()

    return jsonify({
        "message":
            "Part added successfully",
        "part":
            part_to_dict(part)
    }), 201


@app.route(
    "/parts/<int:part_id>",
    methods=["DELETE"]
)
def delete_part(part_id):
    part = db.session.get(
        Part,
        part_id
    )

    if not part:
        return jsonify({
            "error": "Part not found"
        }), 404

    db.session.delete(part)
    db.session.commit()

    return jsonify({
        "message":
            "Part deleted successfully"
    })


# =========================================================
# SERVICE HISTORY
# =========================================================

def history_to_dict(order):
    basic = work_order_to_dict(
        order
    )

    items = WorkItem.query.filter_by(
        work_order_id=order.id
    ).all()

    parts = Part.query.filter_by(
        work_order_id=order.id
    ).all()

    part_data = [
        part_to_dict(part)
        for part in parts
    ]

    parts_total = round(
        sum(
            part["total"]
            for part in part_data
        ),
        2
    )

    basic["checklist"] = [
        item_to_dict(item)
        for item in items
    ]

    basic["parts"] = part_data
    basic["parts_total"] = parts_total

    return basic


@app.route(
    "/service-history",
    methods=["GET"]
)
def get_service_history():
    customer_id = request.args.get(
        "customer_id"
    )

    vehicle_id = request.args.get(
        "vehicle_id"
    )

    query = WorkOrder.query.filter_by(
        status="Completed"
    )

    if vehicle_id:
        query = query.filter_by(
            vehicle_id=int(
                vehicle_id
            )
        )

    orders = query.order_by(
        WorkOrder.id.desc()
    ).all()

    results = []

    for order in orders:
        history = history_to_dict(
            order
        )

        if customer_id:
            if str(
                history["customer_id"]
            ) != str(customer_id):
                continue

        results.append(history)

    return jsonify(results)


@app.route(
    "/service-history/<int:work_order_id>",
    methods=["GET"]
)
def get_history_detail(
    work_order_id
):
    order = db.session.get(
        WorkOrder,
        work_order_id
    )

    if not order:
        return jsonify({
            "error":
            "Service record not found"
        }), 404

    if order.status != "Completed":
        return jsonify({
            "error":
            "Only completed work orders appear in service history"
        }), 400

    return jsonify(
        history_to_dict(order)
    )


# =========================================================
# MANAGER SUMMARY
# =========================================================

@app.route(
    "/manager-summary",
    methods=["GET"]
)
def manager_summary():
    completed_orders = (
        WorkOrder.query.filter_by(
            status="Completed"
        ).all()
    )

    parts_total = 0

    for order in completed_orders:
        parts = Part.query.filter_by(
            work_order_id=order.id
        ).all()

        parts_total += sum(
            part.quantity * part.price
            for part in parts
        )

    return jsonify({
        "customers":
            Customer.query.count(),

        "vehicles":
            Vehicle.query.count(),

        "appointments":
            ServiceAppointment.query.count(),

        "work_orders":
            WorkOrder.query.count(),

        "completed_jobs":
            len(completed_orders),

        "active_jobs":
            WorkOrder.query.filter(
                WorkOrder.status.in_([
                    "Open",
                    "Assigned",
                    "In Progress",
                    "Waiting for Parts"
                ])
            ).count(),

        "parts_total":
            round(
                parts_total,
                2
            )
    })


# =========================================================
# DEMO ACCOUNTS
# =========================================================

with app.app_context():
    db.create_all()

    mechanic = User.query.filter_by(
        email="mechanic@autocare.com"
    ).first()

    if not mechanic:
        mechanic = User(
            name="Demo Mechanic",
            email="mechanic@autocare.com",
            password=generate_password_hash(
                "123456"
            ),
            role="Mechanic"
        )

        db.session.add(mechanic)

    manager = User.query.filter_by(
        email="manager@autocare.com"
    ).first()

    if not manager:
        manager = User(
            name="Service Manager",
            email="manager@autocare.com",
            password=generate_password_hash(
                "123456"
            ),
            role="Manager"
        )

        db.session.add(manager)

    db.session.commit()


if __name__ == "__main__":
    app.run(debug=True)