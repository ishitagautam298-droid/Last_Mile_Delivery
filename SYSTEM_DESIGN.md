# Last-Mile Delivery Tracker: System Design Document

## 1. Executive Architecture Overview
The Last-Mile Delivery Tracker is an event-driven logistics orchestration platform designed to handle dynamic pricing, intelligent agent assignment, immutable state tracking, and customer communication across multi-zone municipal operations. The platform adopts a modular service-oriented architecture built on Node.js/Express, MongoDB, and React with bidirectional WebSocket synchronization.

```
+-------------------------------------------------------------------------------+
|                                 CLIENT TIER                                   |
|   Customer Portal       |       Agent Portal       |       Admin Ops Hub      |
+-------------------------------------------------------------------------------+
                                      | HTTP / REST & WebSockets
+-------------------------------------------------------------------------------+
|                            API & GATEWAY LAYER                                |
|          Role-Based Auth (JWT)  |  Rate Limiting  |  Validation Engine        |
+-------------------------------------------------------------------------------+
                                      |
+-------------------------------------------------------------------------------+
|                            CORE SERVICE ENGINES                               |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  | Rate Calculation   |  | Zone & Area        |  | Auto-Assignment        |  |
|  | Engine             |  | Resolution Engine  |  | Dispatcher              |  |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  | Order Lifecycle &  |  | Failed Delivery &  |  | Multi-Carrier           |  |
|  | Immutable Audit    |  | Reschedule Engine  |  | Notification Engine     |  |
|  +--------------------+  +--------------------+  +-------------------------+  |
+-------------------------------------------------------------------------------+
                                      |
+-------------------------------------------------------------------------------+
|                              PERSISTENCE TIER                                 |
|       MongoDB Atlas: Orders | Zones | Rates | Users | Audit Logs | Alerts     |
+-------------------------------------------------------------------------------+
```

---

## 2. Dynamic Rate Calculation Engine
Logistics margins depend on accurate freight rating. Rather than hardcoding formulas or zone prices, the platform models pricing as dynamic admin-configurable **Rate Cards**.

### Rating Mathematical Formulation:
1. **Volumetric Weight Formula**:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
2. **Chargeable Weight Determination**:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Weight Slabs & Incremental Pricing**:
   $$\text{Extra Weight} = \max(0, \text{Chargeable Weight} - \text{Base Weight Limit})$$
   $$\text{Extra Weight Charge} = \lceil \text{Extra Weight} \rceil \times \text{Incremental Price Per Kg}$$
4. **COD Surcharges & Taxes**:
   $$\text{COD Fee} = \begin{cases} 
   \max(\text{Min COD}, \text{Fixed COD Value}) & \text{if Fixed} \\
   \max(\text{Min COD}, (\text{Base} + \text{Extra}) \times \frac{\text{COD \%}}{100}) & \text{if Percentage}
   \end{cases}$$
   $$\text{Total Payable} = (\text{Base} + \text{Extra} + \text{COD}) \times \left(1 + \frac{\text{GST \%}}{100}\right)$$

Every quote is generated with sub-cent precision and rendered to the customer before payment commitment.

---

## 3. Zone & Area Resolution Approach
Cities are partitioned into operational polygons designated by `Zone` entities (e.g., `CM-01`, `SZ-01`, `EZ-01`, `NZ-01`, `WZ-01`).
- **Pincode & Locality Indexing**: The `AreaMapping` collection indexes standard 6-digit postal codes and area names to their corresponding zone IDs.
- **Routing Scope Classification**:
  - If $\text{Pickup Zone ID} == \text{Drop Zone ID} \implies \textbf{Intra-Zone}$
  - If $\text{Pickup Zone ID} \neq \text{Drop Zone ID} \implies \textbf{Inter-Zone}$
- The resolved `(OrderType, Scope)` tuple dynamically selects the exact matching active `RateCard` record.

---

## 4. Intelligent Auto-Assignment Logic
To minimize transit times and optimize fleet efficiency, the dispatch engine executes an automated scoring heuristic whenever orders are booked or rescheduled.

### Agent Scoring & Matching Heuristic:
For all delivery agents with `status === 'available'` and $\text{Active Orders} < \text{Max Capacity}$:
1. **Haversine Geodesic Distance**:
   $$d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
2. **Composite Dispatch Score**:
   $$\text{Score} = d_{\text{pickup}} + (\text{Active Deliveries} \times 2.0) - (\text{Zone Match Bonus: } 3.0 \text{ if in same zone})$$
The agent with the lowest composite score is assigned atomically, incrementing their active load counter and logging an immutable audit record.

---

## 5. Failed Delivery Handling & Rescheduling Lifecycle
Deliveries encounter real-world friction (customer unavailable, security gates, incorrect address). The system formalizes this with an immutable failure and self-service rescheduling loop:

```
[Out for Delivery] ---> [Delivery Attempt Fails]
                                |
                   (Agent tags failure reason & notes)
                                |
                  +-------------+-------------+
                  |                           |
        [Flag Status: Failed]    [Send Email & SMS Notification]
                  |                           |
                  +-------------+-------------+
                                |
              [Customer Opens Self-Service Reschedule Link]
                                |
             (Selects Date, Time Window, Special Notes)
                                |
                  [Order Status: Rescheduled]
                                |
           [Auto-Assignment Engine Reassigns New Agent]
                                |
                      [Assigned / Picked Up]
```

### Immutable Tracking History:
Every lifecycle change (`Created`, `Assigned`, `Picked Up`, `In Transit`, `Out for Delivery`, `Delivered`, `Failed`, `Rescheduled`) is written to `TrackingAuditLog` with strict append-only semantics, capturing the actor role, user identity, timestamp, coordinates, and notes.
