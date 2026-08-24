# 🚚 Last-Mile Delivery Tracker

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black.svg)](https://socket.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade Last-Mile Logistics Management Platform featuring **dynamic admin-configurable rate cards**, **volumetric weight billing**, **automatic zone detection**, **intelligent nearest-agent auto-assignment**, **immutable tracking audit logs**, **failed delivery self-service rescheduling**, and **multi-channel customer notifications (Email & SMS)**.

---

## 🌟 Key System Capabilities

1. **Dynamic Rate Calculation Engine (Zero Hardcoding)**:
   - Computes Volumetric Weight: $\frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$.
   - Bills on Chargeable Weight: $\max(\text{Actual Weight}, \text{Volumetric Weight})$.
   - Admin-configurable Rate Cards for **B2B** and **B2C** separately across **Intra-Zone** and **Inter-Zone** scopes.
   - Surcharge rules for Cash on Delivery (COD) and incremental per-kg weight slabs.
   - Full price quote transparently displayed before order commitment.

2. **Zone & Area Resolution Engine**:
   - Maps postal codes (pincodes) and area localities to municipal delivery zones.
   - Automatically determines whether an order is Intra-Zone or Inter-Zone based on pickup and drop coordinates.

3. **Intelligent Auto-Assignment & Dispatch**:
   - Scores online delivery agents using **Haversine geodesic distance**, zone proximity bonuses, and active workload capacity.
   - Fallback to manual admin dispatch or queueing if drivers are at peak capacity.

4. **Order Status Lifecycle & Immutable Audit Trail**:
   - Strict lifecycle state transitions: `Created` $\to$ `Assigned` $\to$ `Picked Up` $\to$ `In Transit` $\to$ `Out for Delivery` $\to$ `Delivered` / `Failed` $\to$ `Rescheduled`.
   - Every status modification is recorded in an append-only `TrackingAuditLog` with actor role, timestamp, GPS coordinates, and notes.

5. **Failed Delivery & Self-Service Rescheduling**:
   - Delivery agents can flag failed attempts with structured reasons (e.g., "Customer Unavailable / Door Locked", "Restricted Access").
   - Triggers instant automated Email & SMS alerts with a single-click customer rescheduling link.
   - Customer picks new delivery date & time window, automatically queuing the order for agent reassignment.

6. **Multi-Role Portals & Real-Time Sync**:
   - **Customer Portal**: Rate quote calculator, shipment booking, live GPS tracking map, and self-service rescheduling.
   - **Delivery Agent Portal**: On-duty toggle, assigned orders, status progress buttons, and failed attempt reporting.
   - **Admin Operations Hub**: Overview KPI metrics, order dispatch board, zone manager, rate card configurator, and status override.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, Nodemailer, Morgan, Jest
- **Frontend**: React 18 (Vite), Tailwind CSS, Lucide React, Leaflet & React-Leaflet, Axios, Socket.io-client
- **Security**: JWT Authentication, bcryptjs password hashing, role-based authorization middleware
- **Notifications**: Automated Nodemailer (Ethereal test accounts with instant preview links + optional SendGrid/SMTP) + Multi-carrier SMS log audit

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally on port 27017 or a MongoDB Atlas connection URI

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository_url>
cd LastMileDeliveryTracker

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/lastmile_delivery_tracker
JWT_SECRET=super_secret_jwt_key_lastmile_2026_xyz
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed Demo Database

Populate realistic zones (North, South, East, West, Central), area pincode mappings, B2B/B2C rate cards, delivery agents with GPS coordinates, and sample orders:

```bash
cd backend
npm run seed
```

### 4. Start the Application

**Terminal 1 (Backend API & Socket.io on Port 5001):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend on Port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Demo Accounts & Pre-Seeded Tracking Numbers

| Role | Email | Password | Details |
|---|---|---|---|
| **👑 Admin** | `admin@lastmile.com` | `Admin@123` | Full Operations Control Center |
| **🛵 Agent Rahul** | `rahul.agent@lastmile.com` | `Agent@123` | South Zone • Bike |
| **🚐 Agent Vikram** | `vikram.agent@lastmile.com` | `Agent@123` | East Zone • Van |
| **🛍️ Customer** | `customer@lastmile.com` | `Customer@123` | Standard Customer Portal |

### Sample Tracking Numbers for Testing:
- **`LMD-2026-X81A1`**: Status `Created` (Pending Auto-Dispatch)
- **`LMD-2026-B94K2`**: Status `In Transit` (Assigned to Agent Vikram)
- **`LMD-2026-F33X7`**: Status `Failed` (**Test Customer Rescheduling Flow!**)
- **`LMD-2026-D19M4`**: Status `Delivered` (Complete Completed Timeline)

---

## 📐 Mathematical Formulation of the Rate Engine

$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$

$$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$

### Example Rating Calculation:
- **Dimensions**: $40 \times 30 \times 25 \text{ cm} \implies \frac{30,000}{5000} = 6.0 \text{ kg}$
- **Actual Weight**: $4.5 \text{ kg} \implies \text{Chargeable Weight} = 6.0 \text{ kg}$ (billed on volumetric weight)
- **Order Type**: B2B Inter-Zone (Base Slab: 5.0 kg @ ₹380, Extra Weight: ₹25/kg, COD Surcharge: 2.5%, Tax: 18% GST)
  - Extra Weight Charge: $(6.0 - 5.0) \times 25 = \text{₹}25$
  - COD Surcharge: $\max(75, (380 + 25) \times 0.025) = \text{₹}75$
  - Subtotal: $380 + 25 + 75 = \text{₹}480$
  - GST Tax (18%): $480 \times 0.18 = \text{₹}86.40$
  - **Total Amount**: $\mathbf{₹566.40}$

---

## 🗄️ Database Schema Overview

```
+----------------+       +-------------------+       +--------------------+
|     Zone       |<------|    AreaMapping    |       |      RateCard      |
+----------------+       +-------------------+       +--------------------+
| _id            |       | _id               |       | _id                |
| name           |       | pincode (indexed) |       | name               |
| code (unique)  |       | areaName          |       | orderType(B2B/B2C) |
| city           |       | city, state       |       | scope(intra/inter) |
| centerCoords   |       | zone (ref Zone)   |       | baseWeightLimitKg  |
+----------------+       +-------------------+       | basePrice          |
        ^                                            | incrementalPrice   |
        |                                            | codSurchargeType   |
+-------+--------+       +-------------------+       | codSurchargeValue  |
|     Order      |------>| TrackingAuditLog  |       +--------------------+
+----------------+       +-------------------+
| trackingNumber |       | order (ref Order) |
| customer       |       | previousStatus    |
| pickupAddress  |       | newStatus         |
| pickupZone     |       | actor (role, user)|
| dropAddress    |       | timestamp         |
| dropZone       |       | notes, reason     |
| isZoneIntra    |       +-------------------+
| dimensions     |
| actualWeight   |       +-------------------+
| volWeight      |       |  NotificationLog  |
| chargeableWt   |       +-------------------+
| pricing        |       | trackingNumber    |
| status         |       | channel(email/sms)|
| assignedAgent  |       | previewUrl        |
| failedDetails  |       | status            |
+----------------+       +-------------------+
```

---

## 📡 REST API Reference

### Rate Engine & Zones
- `POST /api/rate-cards/calculate-quote` - Compute instant delivery price quote with volumetric calculation.
- `GET /api/rate-cards` - List all admin-configured rate cards.
- `POST /api/rate-cards` - Create rate card (*Admin only*).
- `PUT /api/rate-cards/:id` - Update rate card (*Admin only*).
- `GET /api/zones` - List all operational zones.
- `POST /api/zones` - Create zone (*Admin only*).
- `GET /api/zones/areas/all` - List all mapped pincodes and localities.
- `POST /api/zones/areas` - Map a pincode/locality to a zone (*Admin only*).

### Orders & Dispatch
- `POST /api/orders` - Create order with auto-rating and optional auto-dispatch.
- `GET /api/orders` - List orders with status/zone/agent filters (*Role authorized*).
- `GET /api/orders/my-orders` - Customer's orders.
- `GET /api/orders/agent-tasks` - Delivery agent assigned tasks.
- `PUT /api/orders/:id/status` - Advance lifecycle status (`Picked Up`, `In Transit`, `Out for Delivery`, `Delivered`, `Failed`).
- `POST /api/orders/:id/auto-assign` - Trigger nearest-agent auto-assignment.
- `POST /api/orders/:id/manual-assign` - Admin manual agent assignment.
- `POST /api/orders/:id/reschedule` - Customer reschedule failed delivery attempt.
- `PUT /api/orders/:id/override` - Administrative status override.

### Tracking & Public Telemetry
- `GET /api/track/:trackingNumber` - Public live tracking, coordinates, price breakdown, driver card, and immutable timeline logs.
- `GET /api/track/:trackingNumber/notifications` - Dispatched email and SMS audit logs with live Ethereal preview links.

---

## 🧪 Automated Testing

Run the automated Jest test suite to verify volumetric weight calculations, chargeable weight selection, and Haversine distance heuristics:

```bash
cd backend
npm test
```

Output:
```
PASS tests/rateEngine.test.js
PASS tests/assignment.test.js
Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
```

---

## 🌐 Hosted Live Application

- **Live Frontend (Vercel)**: [https://last-mile-delivery-kco7s7tp4-ishitagautam298-droids-projects.vercel.app](https://last-mile-delivery-kco7s7tp4-ishitagautam298-droids-projects.vercel.app)
- **Live Backend API (Render)**: [https://lastmile-delivery-api.onrender.com/api/health](https://lastmile-delivery-api.onrender.com/api/health)
- **GitHub Repository**: [https://github.com/ishitagautam298-droid/Last_Mile_Delivery](https://github.com/ishitagautam298-droid/Last_Mile_Delivery)

---

## 🚀 Deployment Guide

### Cloud Deployment Specifications:

1. **Frontend (Vercel)**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://lastmile-delivery-api.onrender.com`

2. **Backend (Render)**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `MONGODB_URI`: MongoDB Atlas Cloud Cluster Connection String
     - `JWT_SECRET`: 32-character secret key
     - `CLIENT_URL`: `https://last-mile-delivery-kco7s7tp4-ishitagautam298-droids-projects.vercel.app`
     - `NODE_ENV`: `production`

---

## 📄 License
This project is licensed under the MIT License.
