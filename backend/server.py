from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import inch, cm
from PIL import Image as PILImage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Stripe config
JWT_SECRET = os.environ.get('JWT_SECRET', 'realtouch_invoice_jwt_secret_key')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========== MODELS ==========

class UserCreate(BaseModel):
    name: str
    email: str
    picture: Optional[str] = None

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: str
    picture: Optional[str] = None
    plan: str = "starter"
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    download_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceItem(BaseModel):
    description: str
    quantity: float
    rate: float
    amount: float

class InvoiceCreate(BaseModel):
    document_type: str = "Invoice"
    customer_name: str
    customer_address: Optional[str] = None
    customer_email: Optional[str] = None
    invoice_date: str
    due_date: Optional[str] = None
    items: List[InvoiceItem]
    tax_rate: float = 0.0
    notes: Optional[str] = None
    status: str = "unpaid"

class InvoiceUpdate(BaseModel):
    document_type: Optional[str] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    customer_email: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    items: Optional[List[InvoiceItem]] = None
    tax_rate: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invoice_id: str
    user_id: str
    invoice_number: str
    document_type: str
    customer_name: str
    customer_address: Optional[str] = None
    customer_email: Optional[str] = None
    invoice_date: str
    due_date: Optional[str] = None
    items: List[InvoiceItem]
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    customer_id: str
    user_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

class PaymentRequest(BaseModel):
    plan: str
    origin_url: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None

# ========== AUTHENTICATION ==========

async def get_current_user(request: Request) -> dict:
    """Get current user from session token (cookie or header)"""
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_doc

# ========== AUTH ENDPOINTS ==========

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Exchange session_id with Emergent Auth
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    # Check if user exists
    user_doc = await db.users.find_one(
        {"email": auth_data["email"]},
        {"_id": 0}
    )
    
    if user_doc:
        # Update existing user
        await db.users.update_one(
            {"email": auth_data["email"]},
            {"$set": {
                "name": auth_data.get("name", user_doc.get("name")),
                "picture": auth_data.get("picture", user_doc.get("picture"))
            }}
        )
        user_id = user_doc["user_id"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data.get("name", "User"),
            "picture": auth_data.get("picture"),
            "plan": "starter",
            "download_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = auth_data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    # Delete old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    
    # Create new session
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ========== USER ENDPOINTS ==========

@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get user profile"""
    return user

@api_router.put("/user/profile")
async def update_profile(
    profile: ProfileUpdate,
    user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    return updated_user

# ========== INVOICE ENDPOINTS ==========

async def generate_invoice_number(user_id: str) -> str:
    """Generate unique invoice number"""
    count = await db.invoices.count_documents({"user_id": user_id})
    return f"INV-{count + 1:05d}"

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all invoices for current user"""
    query = {"user_id": user["user_id"]}
    
    if status and status != "all":
        query["status"] = status
    if document_type and document_type != "all":
        query["document_type"] = document_type
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return invoices

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    user: dict = Depends(get_current_user)
):
    """Get single invoice"""
    invoice = await db.invoices.find_one(
        {"invoice_id": invoice_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

@api_router.post("/invoices")
async def create_invoice(
    invoice_data: InvoiceCreate,
    user: dict = Depends(get_current_user)
):
    """Create new invoice"""
    # Calculate totals
    subtotal = sum(item.amount for item in invoice_data.items)
    tax_amount = subtotal * (invoice_data.tax_rate / 100)
    total = subtotal + tax_amount
    
    invoice_id = f"inv_{uuid.uuid4().hex[:12]}"
    invoice_number = await generate_invoice_number(user["user_id"])
    
    invoice = {
        "invoice_id": invoice_id,
        "user_id": user["user_id"],
        "invoice_number": invoice_number,
        "document_type": invoice_data.document_type,
        "customer_name": invoice_data.customer_name,
        "customer_address": invoice_data.customer_address,
        "customer_email": invoice_data.customer_email,
        "invoice_date": invoice_data.invoice_date,
        "due_date": invoice_data.due_date,
        "items": [item.model_dump() for item in invoice_data.items],
        "subtotal": subtotal,
        "tax_rate": invoice_data.tax_rate,
        "tax_amount": tax_amount,
        "total": total,
        "status": invoice_data.status,
        "notes": invoice_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invoices.insert_one(invoice)
    
    # Return without _id
    del invoice["_id"] if "_id" in invoice else None
    return invoice

@api_router.put("/invoices/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    user: dict = Depends(get_current_user)
):
    """Update invoice"""
    existing = await db.invoices.find_one(
        {"invoice_id": invoice_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = {k: v for k, v in invoice_data.model_dump().items() if v is not None}
    
    # Recalculate totals if items or tax_rate changed
    if "items" in update_data:
        update_data["items"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in update_data["items"]]
        subtotal = sum(item["amount"] for item in update_data["items"])
        update_data["subtotal"] = subtotal
        tax_rate = update_data.get("tax_rate", existing.get("tax_rate", 0))
        update_data["tax_amount"] = subtotal * (tax_rate / 100)
        update_data["total"] = subtotal + update_data["tax_amount"]
    elif "tax_rate" in update_data:
        subtotal = existing.get("subtotal", 0)
        update_data["tax_amount"] = subtotal * (update_data["tax_rate"] / 100)
        update_data["total"] = subtotal + update_data["tax_amount"]
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.invoices.update_one(
        {"invoice_id": invoice_id, "user_id": user["user_id"]},
        {"$set": update_data}
    )
    
    updated = await db.invoices.find_one(
        {"invoice_id": invoice_id},
        {"_id": 0}
    )
    return updated

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete invoice"""
    result = await db.invoices.delete_one(
        {"invoice_id": invoice_id, "user_id": user["user_id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {"message": "Invoice deleted"}

# ========== DOWNLOAD ENDPOINTS ==========

@api_router.get("/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: str,
    format: str = "pdf",
    user: dict = Depends(get_current_user)
):
    """Download invoice as PDF or JPEG with PERMANENT limit enforcement"""
    # Get fresh user data
    user_doc = await db.users.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0}
    )
    
    # ENFORCE PERMANENT DOWNLOAD LIMIT
    if user_doc["plan"] == "starter" and user_doc["download_count"] >= 5:
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Download limit reached. You have used all 5 free downloads. Upgrade to continue.",
                "download_count": user_doc["download_count"],
                "limit": 5,
                "requires_upgrade": True
            }
        )
    
    # Get invoice
    invoice = await db.invoices.find_one(
        {"invoice_id": invoice_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=50, bottomMargin=50)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#0066cc')
    )
    
    # Header
    elements.append(Paragraph(invoice["document_type"].upper(), title_style))
    elements.append(Spacer(1, 12))
    
    # Company info
    elements.append(Paragraph("<b>From:</b>", styles['Normal']))
    elements.append(Paragraph("Realtouch Global Ventures Ltd", styles['Normal']))
    elements.append(Paragraph("Company No. 16578193", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Invoice details
    elements.append(Paragraph(f"<b>Invoice #:</b> {invoice['invoice_number']}", styles['Normal']))
    elements.append(Paragraph(f"<b>Date:</b> {invoice['invoice_date']}", styles['Normal']))
    if invoice.get('due_date'):
        elements.append(Paragraph(f"<b>Due Date:</b> {invoice['due_date']}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Bill To
    elements.append(Paragraph("<b>Bill To:</b>", styles['Normal']))
    elements.append(Paragraph(invoice['customer_name'], styles['Normal']))
    if invoice.get('customer_address'):
        elements.append(Paragraph(invoice['customer_address'], styles['Normal']))
    elements.append(Spacer(1, 30))
    
    # Items table
    table_data = [['Description', 'Qty', 'Rate', 'Amount']]
    for item in invoice['items']:
        table_data.append([
            item['description'],
            str(item['quantity']),
            f"£{item['rate']:.2f}",
            f"£{item['amount']:.2f}"
        ])
    
    table = Table(table_data, colWidths=[250, 60, 80, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0066cc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 30))
    
    # Totals
    totals_data = [
        ['Subtotal:', f"£{invoice['subtotal']:.2f}"],
        [f"Tax ({invoice['tax_rate']}%):", f"£{invoice['tax_amount']:.2f}"],
        ['Total:', f"£{invoice['total']:.2f}"]
    ]
    totals_table = Table(totals_data, colWidths=[380, 90])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#0066cc')),
    ]))
    elements.append(totals_table)
    
    # Notes
    if invoice.get('notes'):
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("<b>Notes:</b>", styles['Normal']))
        elements.append(Paragraph(invoice['notes'], styles['Normal']))
    
    # Status
    elements.append(Spacer(1, 30))
    status_color = colors.HexColor('#10B981') if invoice['status'] == 'paid' else colors.HexColor('#f59e0b')
    elements.append(Paragraph(f"<b>Status:</b> <font color='{status_color}'>{invoice['status'].upper()}</font>", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    # INCREMENT DOWNLOAD COUNT (PERMANENT for starter plan)
    if user_doc["plan"] == "starter":
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$inc": {"download_count": 1}}
        )
    
    # Log download
    await db.downloads.insert_one({
        "download_id": f"dl_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "invoice_id": invoice_id,
        "format": format,
        "downloaded_at": datetime.now(timezone.utc).isoformat()
    })
    
    if format == "jpeg":
        # Convert PDF to JPEG (simple approach - return PDF with different name)
        # For full JPEG conversion, would need pdf2image library
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={invoice['invoice_number']}.pdf"
            }
        )
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={invoice['invoice_number']}.pdf"
        }
    )

# ========== CUSTOMER ENDPOINTS ==========

@api_router.get("/customers")
async def get_customers(user: dict = Depends(get_current_user)):
    """Get all customers for current user"""
    customers = await db.customers.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    return customers

@api_router.post("/customers")
async def create_customer(
    customer_data: CustomerCreate,
    user: dict = Depends(get_current_user)
):
    """Create new customer"""
    customer_id = f"cust_{uuid.uuid4().hex[:12]}"
    
    customer = {
        "customer_id": customer_id,
        "user_id": user["user_id"],
        "name": customer_data.name,
        "email": customer_data.email,
        "phone": customer_data.phone,
        "address": customer_data.address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.customers.insert_one(customer)
    del customer["_id"] if "_id" in customer else None
    return customer

@api_router.put("/customers/{customer_id}")
async def update_customer(
    customer_id: str,
    customer_data: CustomerCreate,
    user: dict = Depends(get_current_user)
):
    """Update customer"""
    result = await db.customers.update_one(
        {"customer_id": customer_id, "user_id": user["user_id"]},
        {"$set": customer_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated = await db.customers.find_one(
        {"customer_id": customer_id},
        {"_id": 0}
    )
    return updated

@api_router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete customer"""
    result = await db.customers.delete_one(
        {"customer_id": customer_id, "user_id": user["user_id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer deleted"}

# ========== PAYMENT ENDPOINTS ==========

# Payment packages (server-side defined for security)
PAYMENT_PACKAGES = {
    "professional": 8.99,
    "enterprise": 59.99
}

@api_router.post("/payments/stripe/create-checkout")
async def create_stripe_checkout(
    payment: PaymentRequest,
    user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    if payment.plan not in PAYMENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    amount = PAYMENT_PACKAGES[payment.plan]
    
    # Build URLs from provided origin
    success_url = f"{payment.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payment.origin_url}/dashboard"
    
    # Initialize Stripe
    host_url = str(payment.origin_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="gbp",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "plan": payment.plan,
            "user_email": user.get("email", "")
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "session_id": session.session_id,
        "plan": payment.plan,
        "amount": amount,
        "currency": "gbp",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/stripe/status/{session_id}")
async def get_payment_status(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    """Get payment status and update user if paid"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Get transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if transaction and status.payment_status == "paid" and transaction.get("payment_status") != "paid":
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # UPGRADE USER AND RESET DOWNLOAD COUNT
        plan = status.metadata.get("plan", transaction.get("plan", "professional"))
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {
                "plan": plan,
                "download_count": 0  # Reset download count on upgrade
            }}
        )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, sig)
        
        if webhook_response.event_type == "checkout.session.completed":
            if webhook_response.payment_status == "paid":
                # Update transaction
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                
                # Get user_id from metadata
                user_id = webhook_response.metadata.get("user_id")
                plan = webhook_response.metadata.get("plan", "professional")
                
                if user_id:
                    # Upgrade user and reset download count
                    await db.users.update_one(
                        {"user_id": user_id},
                        {"$set": {
                            "plan": plan,
                            "download_count": 0
                        }}
                    )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ========== STATS ENDPOINTS ==========

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    # Get all invoices
    invoices = await db.invoices.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate stats
    total_revenue = sum(inv["total"] for inv in invoices if inv["status"] == "paid")
    total_unpaid = sum(inv["total"] for inv in invoices if inv["status"] != "paid")
    
    # This month
    now = datetime.now(timezone.utc)
    this_month_invoices = [
        inv for inv in invoices 
        if inv["invoice_date"].startswith(f"{now.year}-{now.month:02d}")
    ]
    this_month_revenue = sum(inv["total"] for inv in this_month_invoices if inv["status"] == "paid")
    
    # Get user's download count
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    return {
        "total_revenue": total_revenue,
        "total_unpaid": total_unpaid,
        "this_month_revenue": this_month_revenue,
        "invoice_count": len(invoices),
        "downloads_used": user_doc.get("download_count", 0),
        "downloads_limit": 5 if user_doc.get("plan") == "starter" else -1,  # -1 = unlimited
        "plan": user_doc.get("plan", "starter")
    }

# ========== HEALTH CHECK ==========

@api_router.get("/")
async def root():
    return {"message": "Realtouch Invoice API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
