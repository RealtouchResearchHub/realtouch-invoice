# Realtouch Invoice - Requirements & Architecture

## Original Problem Statement

Build Realtouch Invoice - a production-ready SaaS invoicing platform for Realtouch Global Ventures Ltd with:
- High-converting landing page
- Complete dashboard for invoice management
- Customizable tax rates per invoice (0-100%)
- PERMANENT download limit system (5 downloads total, then must upgrade - NOT monthly)
- Payment integration (Stripe)
- Complete CRUD for all document types
- Mobile-responsive design

**Company:** Realtouch Global Ventures Ltd  
**Company Number:** 16578193

---

## Architecture Completed

### Backend (FastAPI + MongoDB)

**Collections:**
- `users` - User accounts with plan, download_count
- `invoices` - All document types with custom tax rates
- `customers` - Customer management
- `downloads` - Download history
- `user_sessions` - Auth sessions
- `payment_transactions` - Stripe payment tracking

**API Endpoints:**
1. `POST /api/auth/session` - Exchange Emergent OAuth session for app session
2. `GET /api/auth/me` - Get current user
3. `POST /api/auth/logout` - Logout
4. `GET /api/user/profile` - Get profile
5. `PUT /api/user/profile` - Update profile
6. `GET /api/invoices` - List invoices (with filters)
7. `GET /api/invoices/:id` - Get invoice
8. `POST /api/invoices` - Create invoice
9. `PUT /api/invoices/:id` - Update invoice
10. `DELETE /api/invoices/:id` - Delete invoice
11. `GET /api/invoices/:id/download` - Download PDF (with limit enforcement)
12. `GET /api/customers` - List customers
13. `POST /api/customers` - Create customer
14. `PUT /api/customers/:id` - Update customer
15. `DELETE /api/customers/:id` - Delete customer
16. `POST /api/payments/stripe/create-checkout` - Create Stripe session
17. `GET /api/payments/stripe/status/:session_id` - Check payment status
18. `POST /api/webhook/stripe` - Stripe webhook
19. `GET /api/stats` - Dashboard statistics

### Frontend (React + shadcn/ui)

**Pages:**
- Landing Page with hero, features, pricing, testimonials
- Dashboard with sidebar, stats, invoice table
- Invoice Editor modal
- Customer Manager
- Upgrade Modal with Stripe checkout

**Components:**
- InvoiceEditor.jsx - Full invoice creation/editing
- CustomerManager.jsx - CRUD for customers
- UpgradeModal.jsx - Stripe upgrade flow

### Key Features Implemented

1. **Customizable Tax Rate**: 0-100% per invoice, auto-calculates tax amount
2. **PERMANENT Download Limit**: 5 total downloads for free users (never resets)
3. **Stripe Integration**: Checkout sessions for Professional (£8.99) and Enterprise (£59.99)
4. **All 11 Document Types**: Invoice, Tax Invoice, Proforma, Receipt, Sales Receipt, Cash Receipt, Quote, Credit Memo, Credit Note, Purchase Order, Delivery Note
5. **Google OAuth**: Emergent-managed authentication

---

## Configuration for Production

### Replacing API Keys

**Stripe:**
Edit `/app/backend/.env`:
```
STRIPE_API_KEY=sk_live_your_actual_key
```

**Google OAuth:**
The app uses Emergent-managed Google OAuth. To use your own:
1. Set up Google Cloud Console OAuth 2.0 credentials
2. Replace the redirect URL in `/app/frontend/src/pages/LandingPage.jsx`
3. Implement your own session exchange endpoint

### Environment Variables

**Backend (.env):**
```
MONGO_URL=mongodb://your_production_mongodb
DB_NAME=realtouch_invoice
STRIPE_API_KEY=sk_live_xxx
JWT_SECRET=your_secure_secret
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=https://your-domain.com
```

---

## Next Action Items

### Phase 2 Features

1. **PayPal Integration** - Add PayPal as alternative payment method
2. **Google Pay** - Mobile payment option via Stripe
3. **Email Invoices** - Send invoices directly to customers via email
4. **Recurring Invoices** - Schedule automatic invoice generation
5. **Multi-currency Support** - Add EUR, USD, etc.
6. **Custom Branding** - Allow users to upload logos
7. **Reports & Analytics** - Revenue charts, payment trends
8. **PDF Templates** - Multiple invoice design templates
9. **JPEG Export** - Implement proper PDF-to-JPEG conversion
10. **API Access** - REST API for Enterprise users

### Bug Fixes / Improvements

- Add loading states for all async operations
- Implement proper error boundaries
- Add form validation feedback
- Mobile responsive improvements for invoice editor
- Add invoice preview before download

---

## Tech Stack

- **Backend:** FastAPI, MongoDB, emergentintegrations
- **Frontend:** React 18, shadcn/ui, Tailwind CSS
- **Auth:** Emergent Google OAuth
- **Payments:** Stripe Checkout
- **PDF:** ReportLab

---

## Test Credentials

For development testing:
- Session Token: Created via `mongosh` (see auth_testing.md)
- Stripe: Test mode enabled with `sk_test_emergent`
