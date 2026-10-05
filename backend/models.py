from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


# =========================================================
# USERS
# =========================================================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(200),
        nullable=False
    )

    role = db.Column(
        db.String(50),
        nullable=False
    )


# =========================================================
# CUSTOMERS
# =========================================================

class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    phone = db.Column(
        db.String(20),
        nullable=False
    )

    email = db.Column(
        db.String(120)
    )

    address = db.Column(
        db.String(250)
    )


# =========================================================
# VEHICLES
# =========================================================

class Vehicle(db.Model):
    __tablename__ = "vehicles"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False
    )

    vin = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    make = db.Column(
        db.String(100)
    )

    model = db.Column(
        db.String(100)
    )

    year = db.Column(
        db.String(10)
    )

    vehicle_type = db.Column(
        db.String(100)
    )

    customer = db.relationship(
        "Customer",
        backref=db.backref(
            "vehicles",
            lazy=True
        )
    )


# =========================================================
# SERVICE APPOINTMENTS
# =========================================================

class ServiceAppointment(db.Model):
    __tablename__ = "service_appointments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.id"),
        nullable=False
    )

    vehicle_id = db.Column(
        db.Integer,
        db.ForeignKey("vehicles.id"),
        nullable=False
    )

    appointment_date = db.Column(
        db.String(50),
        nullable=False
    )

    service_type = db.Column(
        db.String(150),
        nullable=False
    )

    status = db.Column(
        db.String(50),
        default="Scheduled"
    )


# =========================================================
# WORK ORDERS
# =========================================================

class WorkOrder(db.Model):
    __tablename__ = "work_orders"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    vehicle_id = db.Column(
        db.Integer,
        db.ForeignKey("vehicles.id"),
        nullable=False
    )

    mechanic_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    issue_description = db.Column(
        db.Text,
        nullable=False
    )

    status = db.Column(
        db.String(50),
        default="Open"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    vehicle = db.relationship(
        "Vehicle",
        backref=db.backref(
            "work_orders",
            lazy=True
        )
    )

    mechanic = db.relationship(
        "User",
        foreign_keys=[mechanic_id]
    )


# =========================================================
# WORK ITEMS / CHECKLIST
# =========================================================

class WorkItem(db.Model):
    __tablename__ = "work_items"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    work_order_id = db.Column(
        db.Integer,
        db.ForeignKey("work_orders.id"),
        nullable=False
    )

    item_name = db.Column(
        db.String(150),
        nullable=False
    )

    notes = db.Column(
        db.Text
    )

    completed = db.Column(
        db.Boolean,
        default=False
    )


# =========================================================
# PARTS
# =========================================================

class Part(db.Model):
    __tablename__ = "parts"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    work_order_id = db.Column(
        db.Integer,
        db.ForeignKey("work_orders.id"),
        nullable=False
    )

    part_name = db.Column(
        db.String(150),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        default=1
    )

    price = db.Column(
        db.Float,
        default=0
    )


# =========================================================
# INVOICE MOCK
# =========================================================

class InvoiceMock(db.Model):
    __tablename__ = "invoices_mock"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    work_order_id = db.Column(
        db.Integer,
        db.ForeignKey("work_orders.id"),
        nullable=False
    )

    total_amount = db.Column(
        db.Float,
        default=0
    )

    status = db.Column(
        db.String(50),
        default="Pending"
    )


# =========================================================
# AUDIT LOG
# =========================================================

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    action = db.Column(
        db.String(200),
        nullable=False
    )

    timestamp = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )