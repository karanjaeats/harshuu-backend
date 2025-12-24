# 🍔 HARSHUU Backend

Production-grade backend for **HARSHUU**, a Zomato / Swiggy-style food delivery platform  
optimized for a **local city business**, built with **Node.js + Express + MongoDB**.

This backend is **real-world ready**, scalable, secure, and deployable on  
**Render / Railway / AWS** without refactoring.

---

## 🚀 Features Overview

### 👤 Multi-Role System (Single Backend)
- USER (Customer)
- RESTAURANT (Hotel / Cafe)
- DELIVERY (Delivery Partner)
- ADMIN (Super Admin)

Strict **RBAC (Role-Based Access Control)** enforced on all APIs.

---

### 🔐 Authentication & Security
- OTP-based login (mobile number)
- JWT Access Token + Refresh Token
- Role-protected routes
- Rate limiting
- Centralized error handling
- Secure password hashing (bcrypt)

---

### 🍽️ Restaurant Management
- Restaurant onboarding & approval
- Open / Close toggle
- Delivery radius control
- Menu categories & items
- Price & availability management
- Order accept / reject

---

### 📦 Order Management (Zomato-Style Flow)
CREATED → PAID → ACCEPTED → PREPARING → PICKED → DELIVERED → COMPLETED
Copy code

- Backend-controlled status transitions
- Cancellation & refund rules
- Visibility for user, restaurant, delivery partner & admin

---

### 🛵 Delivery Partner System
- Registration & admin approval
- Online / offline status
- Auto order assignment
- Earnings & incentives
- Payout tracking

---

### 💳 Payments
- Razorpay integration
- UPI / Card / Wallet / COD
- Backend payment verification
- Refund handling
- Wallet system
- GST-ready invoice support

---

### 🛠 Admin Control Panel APIs
- Approve / suspend restaurants
- Approve / suspend delivery partners
- Set commission percentage
- Control surge pricing
- Manual order override
- Platform analytics

---

## 🧱 Tech Stack

| Layer | Technology |
|-----|-----------|
| Runtime | Node.js (>=18) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + OTP |
| Payments | Razorpay |
| Security | Rate Limit, RBAC |
| Hosting | Render / Railway / AWS |

---

## 📂 Project Structure
harshuu-backend/ │ ├── index.js ├── package.json ├── .env ├── .gitignore │ └── src/ ├── config/ │   ├── db.js │   ├── jwt.js │   ├── razorpay.js │   └── constants.js │ ├── models/ │   ├── user.js │   ├── restaurant.js │   ├── menucategory.js │   ├── menuitem.js │   ├── order.js │   ├── deliverypartner.js │   ├── payment.js │   ├── wallet.js │   ├── adminsetting.js │   └── adminlog.js │ ├── routes/ │   ├── auth.routes.js │   ├── user.routes.js │   ├── restaurant.routes.js │   ├── menu.routes.js │   ├── order.routes.js │   ├── delivery.routes.js │   ├── payment.routes.js │   └── admin.routes.js │ ├── controllers/ │   ├── auth.controller.js │   ├── user.controller.js │   ├── restaurant.controller.js │   ├── menu.controller.js │   ├── order.controller.js │   ├── delivery.controller.js │   ├── payment.controller.js │   └── admin.controller.js │ ├── services/ │   ├── otp.service.js │   ├── pricing.service.js │   ├── order.service.js │   ├── assignment.service.js │   ├── payment.service.js │   ├── refund.service.js │   ├── wallet.service.js │   ├── admin.service.js │   ├── analytics.service.js │   └── notification.service.js │ ├── middlewares/ │   ├── auth.middleware.js │   ├── role.middleware.js │   ├── ratelimit.middleware.js │   ├── admin.middleware.js │   ├── validation.middleware.js │   └── error.middleware.js │ └── utils/ ├── distance.util.js ├── invoice.util.js ├── logger.util.js └── response.util.js
Copy code

---

## ⚙️ Environment Variables

Create a `.env` file (never commit it):

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
