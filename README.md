# Realtouch Invoice

<div align="center">
  <img src="https://customer-assets.emergentagent.com/job_77cf16cd-eadc-4d0e-b24f-9448ffa83e9e/artifacts/8fhvo7zu_image.png" alt="Realtouch Invoice Logo" width="200">
  
  **Professional Invoicing, Simplified Globally**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)](https://fastapi.tiangolo.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)](https://www.mongodb.com/)
</div>

---

## 📋 Overview

Realtouch Invoice is a production-ready SaaS invoicing platform built for businesses of all sizes. Create professional invoices, manage customers, and streamline your billing process with an intuitive dashboard and comprehensive feature set.

### ✨ Key Features

- **📄 Multi-Format Documents** - Create invoices, receipts, quotes, credit notes, purchase orders, and more
- **🌍 Global Tax Compliance** - Customizable tax rates per invoice (0-100% VAT, GST, etc.)
- **💳 Payment Integration** - Stripe checkout with Credit Card and Google Pay support
- **📧 Email Invoices** - Send invoices directly to customers with PDF attachments
- **🔄 Recurring Invoices** - Set up weekly, monthly, quarterly, or yearly billing cycles
- **👥 Customer Management** - Store and manage customer details for quick invoicing
- **📊 Dashboard Analytics** - Real-time revenue tracking and business insights
- **🎨 Custom Branding** - Upload your logo and customize company details
- **📱 Mobile Responsive** - Works seamlessly on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB 6+
- Stripe Account (for payments)
- Resend Account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RealtouchResearchHub/realtouch-invoice.git
   cd realtouch-invoice
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   
   # Terminal 2 - Frontend
   cd frontend
   yarn start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001/api

---

## ⚙️ Configuration

### Backend Environment Variables

Create `/backend/.env`:

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=realtouch_invoice

# Security
JWT_SECRET=your-secure-jwt-secret-min-32-chars
CORS_ORIGINS=*

# Stripe (Payment Processing)
STRIPE_API_KEY=sk_live_your_stripe_key

# Resend (Email Service)
RESEND_API_KEY=re_your_resend_key
SENDER_EMAIL=invoices@yourdomain.com

# Owner Access (Unlimited privileges)
OWNER_EMAIL=your-email@domain.com
```

### Frontend Environment Variables

Create `/frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://your-api-domain.com
```

---

## 📁 Project Structure

```
realtouch-invoice/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Landing page
│   │   │   ├── LoginPage.jsx      # Login page
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── AuthCallback.jsx   # OAuth callback
│   │   │   └── PaymentSuccess.jsx # Payment confirmation
│   │   │
│   │   ├── components/
│   │   │   ├── DashboardHome.jsx   # Dashboard overview
│   │   │   ├── InvoiceEditor.jsx   # Invoice creation/editing
│   │   │   ├── CustomerManager.jsx # Customer CRUD
│   │   │   ├── UpgradeModal.jsx    # Payment upgrade
│   │   │   └── SettingsPage.jsx    # User settings
│   │   │
│   │   ├── components/ui/          # shadcn/ui components
│   │   ├── App.js                  # Main React app
│   │   └── index.css               # Global styles
│   │
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/session` | Exchange OAuth session for app token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | Logout user |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile & company details |
| POST | `/api/user/upload-logo` | Upload company logo |
| DELETE | `/api/user/logo` | Delete company logo |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices |
| GET | `/api/invoices/:id` | Get single invoice |
| POST | `/api/invoices` | Create new invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| GET | `/api/invoices/:id/download` | Download PDF |
| POST | `/api/invoices/:id/send-email` | Email invoice |
| POST | `/api/invoices/:id/set-recurring` | Configure recurring |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/stripe/create-checkout` | Create checkout session |
| GET | `/api/payments/stripe/status/:session_id` | Check payment status |
| POST | `/api/webhook/stripe` | Stripe webhook handler |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get dashboard statistics |
| GET | `/api/recurring-invoices` | List recurring invoices |

---

## 💳 Supported Document Types

1. Invoice
2. Tax Invoice
3. Proforma Invoice
4. Receipt
5. Sales Receipt
6. Cash Receipt
7. Quote
8. Credit Memo
9. Credit Note
10. Purchase Order
11. Delivery Note

---

## 💰 Pricing Plans

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Price | £0/month | £8.99/month | £59.99/month |
| Downloads | 5 total | Unlimited | Unlimited |
| Document Types | All | All | All |
| Customer Management | ✅ | ✅ | ✅ |
| Email Invoices | ❌ | ✅ | ✅ |
| Recurring Invoices | ❌ | ✅ | ✅ |
| Custom Branding | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |

**Note:** Download limit for Starter plan is **permanent**, not monthly.

---

## 🔐 Owner Access

Product owners can get unlimited access by setting their email in the `OWNER_EMAIL` environment variable:

```env
OWNER_EMAIL=owner@yourcompany.com
```

Owners receive:
- 👑 Owner badge in dashboard
- Unlimited downloads
- All enterprise features
- No subscription required

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
yarn test
```

### Code Formatting

```bash
# Python
black backend/
ruff check backend/

# JavaScript
cd frontend
yarn lint
```

---

## 🚀 Deployment

### Docker

```dockerfile
# See docker-compose.yml for full configuration
docker-compose up -d
```

### Environment Checklist

Before deploying to production:

- [ ] Set `MONGO_URL` to production MongoDB
- [ ] Set `STRIPE_API_KEY` to live Stripe key
- [ ] Set `RESEND_API_KEY` to production Resend key
- [ ] Set `SENDER_EMAIL` to your verified domain email
- [ ] Set `JWT_SECRET` to a secure random string
- [ ] Set `OWNER_EMAIL` to product owner's email
- [ ] Update `REACT_APP_BACKEND_URL` to production API URL

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Company:** Realtouch Global Ventures Ltd
- **Company Number:** 16578193
- **Email:** support@realtouch.com

---

<div align="center">
  <p>Built with ❤️ by Realtouch Global Ventures Ltd</p>
  <p>© 2025 All rights reserved</p>
</div>
