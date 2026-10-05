# AutoCare Desk — Vehicle Service Center CRM

AutoCare Desk is a full-stack Vehicle Service Center CRM designed to manage the complete vehicle service workflow from customer registration to completed service history.

The system supports multiple user roles, vehicle VIN decoding, service appointments, mechanic assignment, work-order tracking, checklist updates, parts usage, invoices, audit logs, and printable job cards.

---

## Features

- Customer Management
- Vehicle Management
- VIN Lookup using NHTSA vPIC API
- Service Appointment Management
- Work Order Creation and Tracking
- Mechanic Assignment
- Mechanic Dashboard
- Service Checklist
- Mechanic Notes
- Parts Used Tracking
- Work Order Status Updates
- Completed Service History
- Advisor / Mechanic / Manager Roles
- Backend Authentication
- Role-Based Authorization
- Password Hashing
- Audit Logs
- Invoice Mock
- Printable Job Card
- Persistent SQLite Database

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- Flask
- Flask-CORS
- Flask-SQLAlchemy
- Werkzeug Security
- ItsDangerous

### Database

- SQLite

### External API

- NHTSA vPIC VIN Decoder API

---

## Project Architecture

```text
User
 ↓
React Frontend
 ↓
Flask REST API
 ↓
SQLite Database

        +
        ↓
NHTSA vPIC VIN API