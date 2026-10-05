import os
import requests

from functools import wraps

from flask import (
    Flask,
    jsonify,
    request,
    g
)

from flask_cors import CORS

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from itsdangerous import (
    URLSafeTimedSerializer,
    BadSignature,
    SignatureExpired
)

from models import (
    db,
    User,
    Customer,
    Vehicle,
    ServiceAppointment,
    WorkOrder,
    WorkItem,
    Part,
    InvoiceMock,
    AuditLog
)


# =========================================================
# APP CONFIGURATION
# =========================================================

app = Flask(__name__)

CORS(app)

app.config[
    "SQLALCHEMY_DATABASE_URI"
] = "sqlite:///autocare.db"

app.config[
    "SQLALCHEMY_TRACK_MODIFICATIONS"
] = False

app.config[
    "SECRET_KEY"
] = os.environ.get(
    "AUTOCARE_SECRET_KEY",
    "autocare-class-project-secret-2026"
)

db.init_app(app)

token_serializer = URLSafeTimedSerializer(
    app.config["SECRET_KEY"]
)


# =========================================================
# USER HELPER
# =========================================================

def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }


# =========================================================
# TOKEN AUTHENTICATION
# =========================================================

def create_token(user):

    return token_serializer.dumps({
        "user_id": user.id
    })


def get_current_user():

    auth_header = request.headers.get(
        "Authorization",
        ""
    )

    if not auth_header.startswith(
        "Bearer "
    ):
        return None

    token = auth_header.split(
        " ",
        1
    )[1].strip()

    if not token:
        return None

    try:

        data = token_serializer.loads(
            token,
            max_age=60 * 60 * 8
        )

        user_id = data.get(
            "user_id"
        )

        if not user_id:
            return None

        return db.session.get(
            User,
            user_id
        )

    except (
        BadSignature,
        SignatureExpired
    ):
        return None


def login_required(function):

    @wraps(function)
    def wrapper(
        *args,
        **kwargs
    ):

        user = get_current_user()

        if not user:

            return jsonify({
                "error":
                "Authentication required"
            }), 401

        g.current_user = user

        return function(
            *args,
            **kwargs
        )

    return wrapper


def roles_required(
    *allowed_roles
):

    def decorator(function):

        @wraps(function)
        def wrapper(
            *args,
            **kwargs
        ):

            user = get_current_user()

            if not user:

                return jsonify({
                    "error":
                    "Authentication required"
                }), 401

            if (
                user.role
                not in allowed_roles
            ):

                return jsonify({
                    "error":
                    "You do not have permission to perform this action"
                }), 403

            g.current_user = user

            return function(
                *args,
                **kwargs
            )

        return wrapper

    return decorator


def can_access_work_order(
    user,
    order
):

    if user.role in [
        "Advisor",
        "Manager"
    ]:
        return True

    if (
        user.role == "Mechanic"
        and order.mechanic_id
        == user.id
    ):
        return True

    return False


# =========================================================
# AUDIT LOG HELPER
# =========================================================

def log_action(
    user,
    action
):

    try:

        log = AuditLog(
            user_id=(
                user.id
                if user
                else None
            ),
            action=action
        )

        db.session.add(log)
        db.session.commit()

    except Exception as error:

        print(
            "Audit log error:",
            error
        )

        db.session.rollback()


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return jsonify({
        "message":
            "AutoCare Desk Backend is Running"
    })


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["POST"]
)
def login():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    if not email or not password:

        return jsonify({
            "error":
                "Email and password are required"
        }), 400

    user = User.query.filter_by(
        email=email
    ).first()

    if (
        not user
        or not check_password_hash(
            user.password,
            password
        )
    ):

        return jsonify({
            "error":
                "Invalid email or password"
        }), 401

    token = create_token(
        user
    )

    log_action(
        user,
        f"LOGIN: {user.email}"
    )

    return jsonify({
        "message":
            "Login successful",

        "token":
            token,

        "user":
            user_to_dict(user)
    })


# =========================================================
# CURRENT USER
# =========================================================

@app.route(
    "/me",
    methods=["GET"]
)
@login_required
def current_user():

    return jsonify({
        "user":
            user_to_dict(
                g.current_user
            )
    })


# =========================================================
# REGISTER USER
# MANAGER ONLY
# =========================================================

@app.route(
    "/register",
    methods=["POST"]
)
@roles_required(
    "Manager"
)
def register():

    data = request.get_json() or {}

    name = data.get(
        "name"
    )

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password"
    )

    role = data.get(
        "role"
    )

    if (
        not name
        or not email
        or not password
        or not role
    ):

        return jsonify({
            "error":
                "All fields are required"
        }), 400

    allowed_roles = [
        "Advisor",
        "Mechanic",
        "Manager"
    ]

    if role not in allowed_roles:

        return jsonify({
            "error":
                "Invalid role"
        }), 400

    if User.query.filter_by(
        email=email
    ).first():

        return jsonify({
            "error":
                "Email already registered"
        }), 409

    user = User(
        name=name,
        email=email,
        password=
            generate_password_hash(
                password
            ),
        role=role
    )

    db.session.add(user)
    db.session.commit()

    log_action(
        g.current_user,
        f"CREATED USER: {email} ({role})"
    )

    return jsonify({
        "message":
            "User registered successfully",
        "user":
            user_to_dict(user)
    }), 201


# =========================================================
# MECHANICS
# =========================================================

@app.route(
    "/mechanics",
    methods=["GET"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def get_mechanics():

    mechanics = User.query.filter_by(
        role="Mechanic"
    ).all()

    return jsonify([
        user_to_dict(
            mechanic
        )
        for mechanic
        in mechanics
    ])


# =========================================================
# CUSTOMER HELPER
# =========================================================

def customer_to_dict(
    customer
):

    return {
        "id":
            customer.id,

        "name":
            customer.name,

        "phone":
            customer.phone,

        "email":
            customer.email,

        "address":
            customer.address
    }


# =========================================================
# CUSTOMERS
# =========================================================

@app.route(
    "/customers",
    methods=["GET"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def get_customers():

    customers = (
        Customer.query
        .order_by(
            Customer.id.desc()
        )
        .all()
    )

    return jsonify([
        customer_to_dict(
            customer
        )
        for customer
        in customers
    ])


@app.route(
    "/customers",
    methods=["POST"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def create_customer():

    data = request.get_json() or {}

    name = data.get(
        "name",
        ""
    ).strip()

    phone = data.get(
        "phone",
        ""
    ).strip()

    if not name or not phone:

        return jsonify({
            "error":
                "Name and phone are required"
        }), 400

    customer = Customer(
        name=name,
        phone=phone,
        email=data.get(
            "email"
        ),
        address=data.get(
            "address"
        )
    )

    db.session.add(
        customer
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"CREATED CUSTOMER #{customer.id}: {customer.name}"
    )

    return jsonify({
        "message":
            "Customer created successfully",

        "customer":
            customer_to_dict(
                customer
            )
    }), 201


@app.route(
    "/customers/<int:customer_id>",
    methods=["PUT"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def update_customer(
    customer_id
):

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:

        return jsonify({
            "error":
                "Customer not found"
        }), 404

    data = request.get_json() or {}

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

    log_action(
        g.current_user,
        f"UPDATED CUSTOMER #{customer.id}"
    )

    return jsonify({
        "message":
            "Customer updated successfully",

        "customer":
            customer_to_dict(
                customer
            )
    })


@app.route(
    "/customers/<int:customer_id>",
    methods=["DELETE"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def delete_customer(
    customer_id
):

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:

        return jsonify({
            "error":
                "Customer not found"
        }), 404

    if customer.vehicles:

        return jsonify({
            "error":
                "Cannot delete customer while vehicles are registered"
        }), 400

    name = customer.name

    db.session.delete(
        customer
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"DELETED CUSTOMER #{customer_id}: {name}"
    )

    return jsonify({
        "message":
            "Customer deleted successfully"
    })


# =========================================================
# VIN LOOKUP
# =========================================================

@app.route(
    "/vin/<string:vin>",
    methods=["GET"]
)
@login_required
def vin_lookup(vin):

    vin = vin.strip().upper()

    if len(vin) != 17:

        return jsonify({
            "error":
                "VIN must contain exactly 17 characters"
        }), 400

    url = (
        "https://vpic.nhtsa.dot.gov/"
        "api/vehicles/"
        f"DecodeVinValues/{vin}"
        "?format=json"
    )

    try:

        response = requests.get(
            url,
            timeout=10
        )

        response.raise_for_status()

        results = (
            response.json()
            .get(
                "Results",
                []
            )
        )

        if not results:

            return jsonify({
                "error":
                    "Vehicle information not found"
            }), 404

        result = results[0]

        decoded = {
            "vin":
                vin,

            "make":
                result.get(
                    "Make",
                    ""
                ),

            "model":
                result.get(
                    "Model",
                    ""
                ),

            "year":
                result.get(
                    "ModelYear",
                    ""
                ),

            "vehicle_type":
                result.get(
                    "VehicleType",
                    ""
                )
        }

        log_action(
            g.current_user,
            f"VIN LOOKUP: {vin}"
        )

        return jsonify(
            decoded
        )

    except requests.RequestException:

        return jsonify({
            "error":
                "Unable to connect to NHTSA VIN service"
        }), 503


# =========================================================
# VEHICLE HELPER
# =========================================================

def vehicle_to_dict(
    vehicle
):

    return {
        "id":
            vehicle.id,

        "customer_id":
            vehicle.customer_id,

        "customer_name":
            (
                vehicle.customer.name
                if vehicle.customer
                else ""
            ),

        "vin":
            vehicle.vin,

        "make":
            vehicle.make,

        "model":
            vehicle.model,

        "year":
            vehicle.year,

        "vehicle_type":
            vehicle.vehicle_type
    }


# =========================================================
# VEHICLES
# =========================================================

@app.route(
    "/vehicles",
    methods=["GET"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def get_vehicles():

    vehicles = (
        Vehicle.query
        .order_by(
            Vehicle.id.desc()
        )
        .all()
    )

    return jsonify([
        vehicle_to_dict(
            vehicle
        )
        for vehicle
        in vehicles
    ])


@app.route(
    "/vehicles",
    methods=["POST"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def create_vehicle():

    data = request.get_json() or {}

    customer_id = data.get(
        "customer_id"
    )

    vin = data.get(
        "vin",
        ""
    ).strip().upper()

    if not customer_id:

        return jsonify({
            "error":
                "Customer is required"
        }), 400

    if len(vin) != 17:

        return jsonify({
            "error":
                "VIN must contain exactly 17 characters"
        }), 400

    customer = db.session.get(
        Customer,
        int(customer_id)
    )

    if not customer:

        return jsonify({
            "error":
                "Customer not found"
        }), 404

    if Vehicle.query.filter_by(
        vin=vin
    ).first():

        return jsonify({
            "error":
                "This VIN is already registered"
        }), 409

    vehicle = Vehicle(
        customer_id=int(
            customer_id
        ),

        vin=vin,

        make=data.get(
            "make"
        ),

        model=data.get(
            "model"
        ),

        year=data.get(
            "year"
        ),

        vehicle_type=data.get(
            "vehicle_type"
        )
    )

    db.session.add(
        vehicle
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"REGISTERED VEHICLE #{vehicle.id}: {vehicle.vin}"
    )

    return jsonify({
        "message":
            "Vehicle registered successfully",

        "vehicle":
            vehicle_to_dict(
                vehicle
            )
    }), 201


@app.route(
    "/vehicles/<int:vehicle_id>",
    methods=["PUT"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def update_vehicle(
    vehicle_id
):

    vehicle = db.session.get(
        Vehicle,
        vehicle_id
    )

    if not vehicle:

        return jsonify({
            "error":
                "Vehicle not found"
        }), 404

    data = request.get_json() or {}

    customer_id = int(
        data.get(
            "customer_id",
            vehicle.customer_id
        )
    )

    customer = db.session.get(
        Customer,
        customer_id
    )

    if not customer:

        return jsonify({
            "error":
                "Customer not found"
        }), 404

    new_vin = data.get(
        "vin",
        vehicle.vin
    ).strip().upper()

    if len(new_vin) != 17:

        return jsonify({
            "error":
                "VIN must contain exactly 17 characters"
        }), 400

    duplicate = Vehicle.query.filter(
        Vehicle.vin == new_vin,
        Vehicle.id != vehicle.id
    ).first()

    if duplicate:

        return jsonify({
            "error":
                "Another vehicle already uses this VIN"
        }), 409

    vehicle.customer_id = (
        customer_id
    )

    vehicle.vin = (
        new_vin
    )

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

    log_action(
        g.current_user,
        f"UPDATED VEHICLE #{vehicle.id}"
    )

    return jsonify({
        "message":
            "Vehicle updated successfully",

        "vehicle":
            vehicle_to_dict(
                vehicle
            )
    })


@app.route(
    "/vehicles/<int:vehicle_id>",
    methods=["DELETE"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def delete_vehicle(
    vehicle_id
):

    vehicle = db.session.get(
        Vehicle,
        vehicle_id
    )

    if not vehicle:

        return jsonify({
            "error":
                "Vehicle not found"
        }), 404

    appointment = (
        ServiceAppointment.query
        .filter_by(
            vehicle_id=
                vehicle.id
        )
        .first()
    )

    work_order = (
        WorkOrder.query
        .filter_by(
            vehicle_id=
                vehicle.id
        )
        .first()
    )

    if (
        appointment
        or work_order
    ):

        return jsonify({
            "error":
                "Cannot delete vehicle because service records exist"
        }), 400

    vin = vehicle.vin

    db.session.delete(
        vehicle
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"DELETED VEHICLE #{vehicle_id}: {vin}"
    )

    return jsonify({
        "message":
            "Vehicle deleted successfully"
    })


# =========================================================
# APPOINTMENT HELPER
# =========================================================

def appointment_to_dict(
    appointment
):

    customer = db.session.get(
        Customer,
        appointment.customer_id
    )

    vehicle = db.session.get(
        Vehicle,
        appointment.vehicle_id
    )

    return {
        "id":
            appointment.id,

        "customer_id":
            appointment.customer_id,

        "customer_name":
            (
                customer.name
                if customer
                else ""
            ),

        "vehicle_id":
            appointment.vehicle_id,

        "vehicle_name":
            (
                (
                    f"{vehicle.make or ''} "
                    f"{vehicle.model or ''}"
                ).strip()
                if vehicle
                else ""
            ),

        "vin":
            (
                vehicle.vin
                if vehicle
                else ""
            ),

        "appointment_date":
            appointment.appointment_date,

        "service_type":
            appointment.service_type,

        "status":
            appointment.status
    }


# =========================================================
# APPOINTMENTS
# =========================================================

@app.route(
    "/appointments",
    methods=["GET"]
)
@roles_required(
    "Advisor",
    "Manager"
)
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
        for appointment
        in appointments
    ])


@app.route(
    "/appointments",
    methods=["POST"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def create_appointment():

    data = request.get_json() or {}

    customer_id = data.get(
        "customer_id"
    )

    vehicle_id = data.get(
        "vehicle_id"
    )

    appointment_date = data.get(
        "appointment_date"
    )

    service_type = data.get(
        "service_type"
    )

    if (
        not customer_id
        or not vehicle_id
        or not appointment_date
        or not service_type
    ):

        return jsonify({
            "error":
                "Customer, vehicle, date and service type are required"
        }), 400

    vehicle = db.session.get(
        Vehicle,
        int(vehicle_id)
    )

    if not vehicle:

        return jsonify({
            "error":
                "Vehicle not found"
        }), 404

    if vehicle.customer_id != int(
        customer_id
    ):

        return jsonify({
            "error":
                "Selected vehicle does not belong to this customer"
        }), 400

    appointment = ServiceAppointment(
        customer_id=int(
            customer_id
        ),

        vehicle_id=int(
            vehicle_id
        ),

        appointment_date=
            appointment_date,

        service_type=
            service_type,

        status=
            "Scheduled"
    )

    db.session.add(
        appointment
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"CREATED APPOINTMENT #{appointment.id}"
    )

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
@roles_required(
    "Advisor",
    "Manager"
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

    data = request.get_json() or {}

    customer_id = int(
        data.get(
            "customer_id",
            appointment.customer_id
        )
    )

    vehicle_id = int(
        data.get(
            "vehicle_id",
            appointment.vehicle_id
        )
    )

    vehicle = db.session.get(
        Vehicle,
        vehicle_id
    )

    if not vehicle:

        return jsonify({
            "error":
                "Vehicle not found"
        }), 404

    if vehicle.customer_id != (
        customer_id
    ):

        return jsonify({
            "error":
                "Selected vehicle does not belong to this customer"
        }), 400

    appointment.customer_id = (
        customer_id
    )

    appointment.vehicle_id = (
        vehicle_id
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

    log_action(
        g.current_user,
        f"UPDATED APPOINTMENT #{appointment.id}"
    )

    return jsonify({
        "message":
            "Appointment updated successfully",

        "appointment":
            appointment_to_dict(
                appointment
            )
    })


@app.route(
    "/appointments/<int:appointment_id>/status",
    methods=["PATCH"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def update_appointment_status(
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

    data = request.get_json() or {}

    status = data.get(
        "status"
    )

    allowed_statuses = [
        "Scheduled",
        "Confirmed",
        "In Service",
        "Completed",
        "Cancelled"
    ]

    if (
        status
        not in allowed_statuses
    ):

        return jsonify({
            "error":
                "Invalid appointment status"
        }), 400

    appointment.status = (
        status
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"UPDATED APPOINTMENT #{appointment.id} STATUS TO {status}"
    )

    return jsonify({
        "message":
            "Appointment status updated",

        "appointment":
            appointment_to_dict(
                appointment
            )
    })


@app.route(
    "/appointments/<int:appointment_id>",
    methods=["DELETE"]
)
@roles_required(
    "Advisor",
    "Manager"
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

    db.session.delete(
        appointment
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"DELETED APPOINTMENT #{appointment_id}"
    )

    return jsonify({
        "message":
            "Appointment deleted successfully"
    })


# =========================================================
# WORK ORDER HELPER
# =========================================================

def work_order_to_dict(
    order
):

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
        "id":
            order.id,

        "vehicle_id":
            order.vehicle_id,

        "vehicle_name":
            (
                (
                    f"{vehicle.make or ''} "
                    f"{vehicle.model or ''}"
                ).strip()
                if vehicle
                else ""
            ),

        "vin":
            (
                vehicle.vin
                if vehicle
                else ""
            ),

        "customer_id":
            (
                customer.id
                if customer
                else None
            ),

        "customer_name":
            (
                customer.name
                if customer
                else ""
            ),

        "mechanic_id":
            order.mechanic_id,

        "mechanic_name":
            (
                mechanic.name
                if mechanic
                else "Unassigned"
            ),

        "issue_description":
            order.issue_description,

        "status":
            order.status,

        "created_at":
            (
                order.created_at.strftime(
                    "%Y-%m-%d %H:%M"
                )
                if order.created_at
                else ""
            )
    }


# =========================================================
# WORK ORDERS
# =========================================================

@app.route(
    "/work-orders",
    methods=["GET"]
)
@login_required
def get_work_orders():

    user = g.current_user

    query = WorkOrder.query

    if user.role == "Mechanic":

        query = query.filter_by(
            mechanic_id=
                user.id
        )

    elif user.role not in [
        "Advisor",
        "Manager"
    ]:

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    orders = (
        query
        .order_by(
            WorkOrder.id.desc()
        )
        .all()
    )

    return jsonify([
        work_order_to_dict(
            order
        )
        for order
        in orders
    ])


@app.route(
    "/work-orders/<int:work_order_id>",
    methods=["GET"]
)
@login_required
def get_work_order(
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

    if not can_access_work_order(
        g.current_user,
        order
    ):

        return jsonify({
            "error":
                "This work order is not assigned to you"
        }), 403

    return jsonify(
        work_order_to_dict(
            order
        )
    )


@app.route(
    "/work-orders",
    methods=["POST"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def create_work_order():

    data = request.get_json() or {}

    vehicle_id = data.get(
        "vehicle_id"
    )

    mechanic_id = data.get(
        "mechanic_id"
    )

    issue_description = data.get(
        "issue_description",
        ""
    ).strip()

    if not vehicle_id:

        return jsonify({
            "error":
                "Vehicle is required"
        }), 400

    if not issue_description:

        return jsonify({
            "error":
                "Issue description is required"
        }), 400

    vehicle = db.session.get(
        Vehicle,
        int(vehicle_id)
    )

    if not vehicle:

        return jsonify({
            "error":
                "Vehicle not found"
        }), 404

    if mechanic_id:

        mechanic = db.session.get(
            User,
            int(mechanic_id)
        )

        if (
            not mechanic
            or mechanic.role
            != "Mechanic"
        ):

            return jsonify({
                "error":
                    "Selected mechanic is invalid"
            }), 400

    order = WorkOrder(
        vehicle_id=int(
            vehicle_id
        ),

        mechanic_id=(
            int(mechanic_id)
            if mechanic_id
            else None
        ),

        issue_description=
            issue_description,

        status=(
            "Assigned"
            if mechanic_id
            else "Open"
        )
    )

    db.session.add(
        order
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"CREATED WORK ORDER #{order.id}"
    )

    return jsonify({
        "message":
            "Work order created successfully",

        "work_order":
            work_order_to_dict(
                order
            )
    }), 201


@app.route(
    "/work-orders/<int:work_order_id>",
    methods=["PUT"]
)
@roles_required(
    "Advisor",
    "Manager"
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

    data = request.get_json() or {}

    vehicle_id = int(
        data.get(
            "vehicle_id",
            order.vehicle_id
        )
    )

    vehicle = db.session.get(
        Vehicle,
        vehicle_id
    )

    if not vehicle:

        return jsonify({
            "error":
                "Vehicle not found"
        }), 404

    mechanic_id = data.get(
        "mechanic_id"
    )

    if mechanic_id:

        mechanic = db.session.get(
            User,
            int(mechanic_id)
        )

        if (
            not mechanic
            or mechanic.role
            != "Mechanic"
        ):

            return jsonify({
                "error":
                    "Selected mechanic is invalid"
            }), 400

        order.mechanic_id = int(
            mechanic_id
        )

    else:

        order.mechanic_id = None

    order.vehicle_id = (
        vehicle_id
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

    log_action(
        g.current_user,
        f"UPDATED WORK ORDER #{order.id}"
    )

    return jsonify({
        "message":
            "Work order updated successfully",

        "work_order":
            work_order_to_dict(
                order
            )
    })


@app.route(
    "/work-orders/<int:work_order_id>/status",
    methods=["PATCH"]
)
@login_required
def update_work_order_status(
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

    user = g.current_user

    if not can_access_work_order(
        user,
        order
    ):

        return jsonify({
            "error":
                "You cannot update this work order"
        }), 403

    data = request.get_json() or {}

    status = data.get(
        "status"
    )

    allowed_statuses = [
        "Open",
        "Assigned",
        "In Progress",
        "Waiting for Parts",
        "Completed",
        "Cancelled"
    ]

    if (
        status
        not in allowed_statuses
    ):

        return jsonify({
            "error":
                "Invalid work order status"
        }), 400

    order.status = (
        status
    )

    db.session.commit()

    log_action(
        user,
        f"UPDATED WORK ORDER #{order.id} STATUS TO {status}"
    )

    return jsonify({
        "message":
            "Work order status updated",

        "work_order":
            work_order_to_dict(
                order
            )
    })


@app.route(
    "/work-orders/<int:work_order_id>",
    methods=["DELETE"]
)
@roles_required(
    "Advisor",
    "Manager"
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
        work_order_id=
            work_order_id
    ).delete()

    Part.query.filter_by(
        work_order_id=
            work_order_id
    ).delete()

    InvoiceMock.query.filter_by(
        work_order_id=
            work_order_id
    ).delete()

    db.session.delete(
        order
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"DELETED WORK ORDER #{work_order_id}"
    )

    return jsonify({
        "message":
            "Work order deleted successfully"
    })


# =========================================================
# CHECKLIST HELPER
# =========================================================

def item_to_dict(
    item
):

    return {
        "id":
            item.id,

        "work_order_id":
            item.work_order_id,

        "item_name":
            item.item_name,

        "notes":
            item.notes,

        "completed":
            item.completed
    }


# =========================================================
# CHECKLIST
# =========================================================

@app.route(
    "/work-orders/<int:work_order_id>/items",
    methods=["GET"]
)
@login_required
def get_work_items(
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

    if not can_access_work_order(
        g.current_user,
        order
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    items = (
        WorkItem.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .all()
    )

    return jsonify([
        item_to_dict(
            item
        )
        for item
        in items
    ])


@app.route(
    "/work-orders/<int:work_order_id>/items",
    methods=["POST"]
)
@login_required
def add_work_item(
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

    if not can_access_work_order(
        g.current_user,
        order
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    data = request.get_json() or {}

    item_name = data.get(
        "item_name",
        ""
    ).strip()

    if not item_name:

        return jsonify({
            "error":
                "Checklist item name is required"
        }), 400

    item = WorkItem(
        work_order_id=
            work_order_id,

        item_name=
            item_name,

        notes=data.get(
            "notes",
            ""
        ),

        completed=False
    )

    db.session.add(
        item
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"ADDED CHECKLIST ITEM TO WORK ORDER #{work_order_id}: {item.item_name}"
    )

    return jsonify({
        "message":
            "Checklist item added",

        "item":
            item_to_dict(
                item
            )
    }), 201


@app.route(
    "/work-items/<int:item_id>",
    methods=["PUT"]
)
@login_required
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

    order = db.session.get(
        WorkOrder,
        item.work_order_id
    )

    if (
        not order
        or not can_access_work_order(
            g.current_user,
            order
        )
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    data = request.get_json() or {}

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

    log_action(
        g.current_user,
        f"UPDATED CHECKLIST ITEM #{item.id}"
    )

    return jsonify({
        "message":
            "Checklist item updated",

        "item":
            item_to_dict(
                item
            )
    })


@app.route(
    "/work-items/<int:item_id>",
    methods=["DELETE"]
)
@login_required
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

    order = db.session.get(
        WorkOrder,
        item.work_order_id
    )

    if (
        not order
        or not can_access_work_order(
            g.current_user,
            order
        )
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    work_order_id = (
        item.work_order_id
    )

    db.session.delete(
        item
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"DELETED CHECKLIST ITEM #{item_id} FROM WORK ORDER #{work_order_id}"
    )

    return jsonify({
        "message":
            "Checklist item deleted"
    })


# =========================================================
# PART HELPER
# =========================================================

def part_to_dict(
    part
):

    return {
        "id":
            part.id,

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


# =========================================================
# PARTS
# =========================================================

@app.route(
    "/work-orders/<int:work_order_id>/parts",
    methods=["GET"]
)
@login_required
def get_parts(
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

    if not can_access_work_order(
        g.current_user,
        order
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    parts = (
        Part.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .all()
    )

    return jsonify([
        part_to_dict(
            part
        )
        for part
        in parts
    ])


@app.route(
    "/work-orders/<int:work_order_id>/parts",
    methods=["POST"]
)
@login_required
def add_part(
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

    if not can_access_work_order(
        g.current_user,
        order
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    data = request.get_json() or {}

    part_name = data.get(
        "part_name",
        ""
    ).strip()

    if not part_name:

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

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "error":
                "Invalid quantity or price"
        }), 400

    if quantity < 1:

        return jsonify({
            "error":
                "Quantity must be at least 1"
        }), 400

    if price < 0:

        return jsonify({
            "error":
                "Price cannot be negative"
        }), 400

    part = Part(
        work_order_id=
            work_order_id,

        part_name=
            part_name,

        quantity=
            quantity,

        price=
            price
    )

    db.session.add(
        part
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"ADDED PART TO WORK ORDER #{work_order_id}: {part.part_name}"
    )

    return jsonify({
        "message":
            "Part added successfully",

        "part":
            part_to_dict(
                part
            )
    }), 201


@app.route(
    "/parts/<int:part_id>",
    methods=["DELETE"]
)
@login_required
def delete_part(
    part_id
):

    part = db.session.get(
        Part,
        part_id
    )

    if not part:

        return jsonify({
            "error":
                "Part not found"
        }), 404

    order = db.session.get(
        WorkOrder,
        part.work_order_id
    )

    if (
        not order
        or not can_access_work_order(
            g.current_user,
            order
        )
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    work_order_id = (
        part.work_order_id
    )

    part_name = (
        part.part_name
    )

    db.session.delete(
        part
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"DELETED PART FROM WORK ORDER #{work_order_id}: {part_name}"
    )

    return jsonify({
        "message":
            "Part deleted successfully"
    })


# =========================================================
# SERVICE HISTORY
# =========================================================

def history_to_dict(
    order
):

    result = work_order_to_dict(
        order
    )

    items = (
        WorkItem.query
        .filter_by(
            work_order_id=
                order.id
        )
        .all()
    )

    parts = (
        Part.query
        .filter_by(
            work_order_id=
                order.id
        )
        .all()
    )

    part_data = [
        part_to_dict(
            part
        )
        for part
        in parts
    ]

    result["checklist"] = [
        item_to_dict(
            item
        )
        for item
        in items
    ]

    result["parts"] = (
        part_data
    )

    result["parts_total"] = round(
        sum(
            part["total"]
            for part
            in part_data
        ),
        2
    )

    return result


@app.route(
    "/service-history",
    methods=["GET"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def get_service_history():

    orders = (
        WorkOrder.query
        .filter_by(
            status=
                "Completed"
        )
        .order_by(
            WorkOrder.id.desc()
        )
        .all()
    )

    return jsonify([
        history_to_dict(
            order
        )
        for order
        in orders
    ])


@app.route(
    "/service-history/<int:work_order_id>",
    methods=["GET"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def get_service_history_detail(
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
        history_to_dict(
            order
        )
    )


# =========================================================
# MANAGER SUMMARY
# =========================================================

@app.route(
    "/manager-summary",
    methods=["GET"]
)
@roles_required(
    "Manager"
)
def manager_summary():

    completed_orders = (
        WorkOrder.query
        .filter_by(
            status=
                "Completed"
        )
        .all()
    )

    parts_total = 0

    for order in completed_orders:

        parts = (
            Part.query
            .filter_by(
                work_order_id=
                    order.id
            )
            .all()
        )

        parts_total += sum(
            part.quantity *
            part.price
            for part
            in parts
        )

    active_jobs = (
        WorkOrder.query
        .filter(
            WorkOrder.status.in_([
                "Open",
                "Assigned",
                "In Progress",
                "Waiting for Parts"
            ])
        )
        .count()
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
            len(
                completed_orders
            ),

        "active_jobs":
            active_jobs,

        "parts_total":
            round(
                parts_total,
                2
            )
    })


# =========================================================
# AUDIT LOGS
# =========================================================

@app.route(
    "/audit-logs",
    methods=["GET"]
)
@roles_required(
    "Manager"
)
def get_audit_logs():

    logs = (
        AuditLog.query
        .order_by(
            AuditLog.id.desc()
        )
        .limit(200)
        .all()
    )

    results = []

    for log in logs:

        user = (
            db.session.get(
                User,
                log.user_id
            )
            if log.user_id
            else None
        )

        results.append({
            "id":
                log.id,

            "user":
                (
                    user.name
                    if user
                    else "System"
                ),

            "email":
                (
                    user.email
                    if user
                    else ""
                ),

            "role":
                (
                    user.role
                    if user
                    else "System"
                ),

            "action":
                log.action,

            "timestamp":
                (
                    log.timestamp.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                    if log.timestamp
                    else ""
                )
        })

    return jsonify(
        results
    )


# =========================================================
# INVOICE HELPER
# =========================================================

def invoice_to_dict(
    invoice,
    order
):

    parts = (
        Part.query
        .filter_by(
            work_order_id=
                order.id
        )
        .all()
    )

    parts_total = round(
        sum(
            part.quantity *
            part.price
            for part
            in parts
        ),
        2
    )

    if invoice:

        total_amount = float(
            invoice.total_amount
            or 0
        )

        service_charge = round(
            max(
                total_amount -
                parts_total,
                0
            ),
            2
        )

        status = (
            invoice.status
        )

        invoice_id = (
            invoice.id
        )

    else:

        total_amount = (
            parts_total
        )

        service_charge = 0

        status = (
            "Not Generated"
        )

        invoice_id = None

    return {
        "id":
            invoice_id,

        "work_order_id":
            order.id,

        "parts_total":
            parts_total,

        "service_charge":
            service_charge,

        "total_amount":
            round(
                total_amount,
                2
            ),

        "status":
            status
    }


# =========================================================
# GET INVOICE
# =========================================================

@app.route(
    "/work-orders/<int:work_order_id>/invoice",
    methods=["GET"]
)
@login_required
def get_invoice(
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

    if not can_access_work_order(
        g.current_user,
        order
    ):

        return jsonify({
            "error":
                "Permission denied"
        }), 403

    invoice = (
        InvoiceMock.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .first()
    )

    return jsonify(
        invoice_to_dict(
            invoice,
            order
        )
    )


# =========================================================
# CREATE / UPDATE INVOICE
# =========================================================

@app.route(
    "/work-orders/<int:work_order_id>/invoice",
    methods=["POST"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def create_invoice(
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

    data = request.get_json() or {}

    try:

        service_charge = float(
            data.get(
                "service_charge",
                0
            )
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "error":
                "Invalid service charge"
        }), 400

    if service_charge < 0:

        return jsonify({
            "error":
                "Service charge cannot be negative"
        }), 400

    parts = (
        Part.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .all()
    )

    parts_total = round(
        sum(
            part.quantity *
            part.price
            for part
            in parts
        ),
        2
    )

    total_amount = round(
        parts_total +
        service_charge,
        2
    )

    invoice = (
        InvoiceMock.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .first()
    )

    if invoice:

        invoice.total_amount = (
            total_amount
        )

    else:

        invoice = InvoiceMock(
            work_order_id=
                work_order_id,

            total_amount=
                total_amount,

            status=
                "Pending"
        )

        db.session.add(
            invoice
        )

    db.session.commit()

    log_action(
        g.current_user,
        f"GENERATED INVOICE FOR WORK ORDER #{work_order_id} - TOTAL {total_amount}"
    )

    return jsonify({
        "message":
            "Invoice generated successfully",

        "invoice":
            invoice_to_dict(
                invoice,
                order
            )
    })


# =========================================================
# INVOICE STATUS
# =========================================================

@app.route(
    "/invoices/<int:invoice_id>/status",
    methods=["PATCH"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def update_invoice_status(
    invoice_id
):

    invoice = db.session.get(
        InvoiceMock,
        invoice_id
    )

    if not invoice:

        return jsonify({
            "error":
                "Invoice not found"
        }), 404

    data = request.get_json() or {}

    status = data.get(
        "status"
    )

    allowed = [
        "Pending",
        "Paid",
        "Cancelled"
    ]

    if status not in allowed:

        return jsonify({
            "error":
                "Invalid invoice status"
        }), 400

    invoice.status = (
        status
    )

    db.session.commit()

    log_action(
        g.current_user,
        f"UPDATED INVOICE #{invoice.id} STATUS TO {status}"
    )

    order = db.session.get(
        WorkOrder,
        invoice.work_order_id
    )

    return jsonify({
        "message":
            "Invoice status updated",

        "invoice":
            invoice_to_dict(
                invoice,
                order
            )
    })


# =========================================================
# JOB CARD
# =========================================================

@app.route(
    "/work-orders/<int:work_order_id>/job-card",
    methods=["GET"]
)
@roles_required(
    "Advisor",
    "Manager"
)
def get_job_card(
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

    vehicle = db.session.get(
        Vehicle,
        order.vehicle_id
    )

    customer = (
        db.session.get(
            Customer,
            vehicle.customer_id
        )
        if vehicle
        else None
    )

    mechanic = (
        db.session.get(
            User,
            order.mechanic_id
        )
        if order.mechanic_id
        else None
    )

    checklist = (
        WorkItem.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .all()
    )

    parts = (
        Part.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .all()
    )

    invoice = (
        InvoiceMock.query
        .filter_by(
            work_order_id=
                work_order_id
        )
        .first()
    )

    return jsonify({
        "work_order": {
            "id":
                order.id,

            "issue_description":
                order.issue_description,

            "status":
                order.status,

            "created_at":
                (
                    order.created_at.strftime(
                        "%Y-%m-%d %H:%M"
                    )
                    if order.created_at
                    else ""
                )
        },

        "customer": {
            "id":
                (
                    customer.id
                    if customer
                    else None
                ),

            "name":
                (
                    customer.name
                    if customer
                    else ""
                ),

            "phone":
                (
                    customer.phone
                    if customer
                    else ""
                ),

            "email":
                (
                    customer.email
                    if customer
                    else ""
                ),

            "address":
                (
                    customer.address
                    if customer
                    else ""
                )
        },

        "vehicle": {
            "id":
                (
                    vehicle.id
                    if vehicle
                    else None
                ),

            "vin":
                (
                    vehicle.vin
                    if vehicle
                    else ""
                ),

            "make":
                (
                    vehicle.make
                    if vehicle
                    else ""
                ),

            "model":
                (
                    vehicle.model
                    if vehicle
                    else ""
                ),

            "year":
                (
                    vehicle.year
                    if vehicle
                    else ""
                ),

            "vehicle_type":
                (
                    vehicle.vehicle_type
                    if vehicle
                    else ""
                )
        },

        "mechanic": {
            "id":
                (
                    mechanic.id
                    if mechanic
                    else None
                ),

            "name":
                (
                    mechanic.name
                    if mechanic
                    else "Unassigned"
                )
        },

        "checklist": [
            item_to_dict(
                item
            )
            for item
            in checklist
        ],

        "parts": [
            part_to_dict(
                part
            )
            for part
            in parts
        ],

        "invoice":
            invoice_to_dict(
                invoice,
                order
            )
    })


# =========================================================
# DATABASE + DEMO USERS
# =========================================================

with app.app_context():

    db.create_all()


    advisor = (
        User.query
        .filter_by(
            email=
                "advisor@autocare.com"
        )
        .first()
    )

    if not advisor:

        advisor = User(
            name=
                "Test Advisor",

            email=
                "advisor@autocare.com",

            password=
                generate_password_hash(
                    "123456"
                ),

            role=
                "Advisor"
        )

        db.session.add(
            advisor
        )


    mechanic = (
        User.query
        .filter_by(
            email=
                "mechanic@autocare.com"
        )
        .first()
    )

    if not mechanic:

        mechanic = User(
            name=
                "Demo Mechanic",

            email=
                "mechanic@autocare.com",

            password=
                generate_password_hash(
                    "123456"
                ),

            role=
                "Mechanic"
        )

        db.session.add(
            mechanic
        )


    manager = (
        User.query
        .filter_by(
            email=
                "manager@autocare.com"
        )
        .first()
    )

    if not manager:

        manager = User(
            name=
                "Service Manager",

            email=
                "manager@autocare.com",

            password=
                generate_password_hash(
                    "123456"
                ),

            role=
                "Manager"
        )

        db.session.add(
            manager
        )


    db.session.commit()


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )