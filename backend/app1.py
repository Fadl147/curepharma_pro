# backend/app_refactored.py

# --- IMPORTS ---
import os
from flask_migrate import Migrate
import csv
from datetime import datetime, timedelta
import pytz 
from functools import wraps
from apscheduler.schedulers.background import BackgroundScheduler
from collections import defaultdict


from flask import Flask, request, jsonify, session, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy import func, or_

ADMIN_PHONE_NUMBERS = ['917702164957'] # Add any other admin numbers here

# --- CONFIGURATION ---
class Config:
    """Application configuration."""
    # For production, load secrets from environment variables
    # e.g., SECRET_KEY = os.environ.get('SECRET_KEY')
    SECRET_KEY = "a-more-secure-and-refactored-secret-key"
    
    # Database configuration
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'inventory.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Uploads folder
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

# --- APPLICATION SETUP ---
app = Flask(__name__)
app.config.from_object(Config)

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize extensions
CORS(app, supports_credentials=True)
db = SQLAlchemy(app)
migrate = Migrate(app, db)


def send_whatsapp_reminders():
    with app.app_context():
        today = datetime.now().date()
        due_reminders = Reminder.query.filter_by(reminder_date=today, status='Pending').all()

        for reminder in due_reminders:
            # In a real app, you would use a WhatsApp API service here.
            # For now, we'll just log it and update the status.
            print(f"Sending reminder to {reminder.customer_phone} for {reminder.medicine_name}")

            # This is a placeholder for the actual WhatsApp sending logic.
            # You would construct a message and send it via an API like Twilio.

            reminder.status = 'Sent'
            db.session.commit()

scheduler = BackgroundScheduler(daemon=True)
# This will run the check every day at 10:00 AM
scheduler.add_job(send_whatsapp_reminders, 'cron', hour=10) 
scheduler.start()


# --- DATABASE MODELS ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    role = db.Column(db.String(20), nullable=False, default='customer')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    quantity = db.Column(db.Integer, default=0)
    freeqty = db.Column(db.Integer, default=0)
    batch_no = db.Column(db.String(80))
    expiry_date = db.Column(db.Date)
    mrp = db.Column(db.Float)
    ptr = db.Column(db.Float)
    amount = db.Column(db.Float)
    gst = db.Column(db.Float)
    netvalue = db.Column(db.Float)
    category = db.Column(db.String(50), nullable=True, default='General')
    formula = db.Column(db.String(255), nullable=True)



    def to_dict(self):
        """Serializes the object to a dictionary."""
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if self.expiry_date:
            data['expiry_date'] = self.expiry_date.strftime('%Y-%m-%d')
        return data

# --- ADD THIS NEW MODEL ---
class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    medicine_name = db.Column(db.String(120), nullable=False)
    reminder_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='Pending') # Pending, Sent, Dismissed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    invoice_id = db.Column(db.Integer, db.ForeignKey('customer_invoice.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'medicine_name': self.medicine_name,
            'reminder_date': self.reminder_date.strftime('%Y-%m-%d'),
            'status': self.status
        }
    


class CustomerInvoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100))
    customer_phone = db.Column(db.String(20))
    bill_date = db.Column(db.DateTime, default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    grand_total = db.Column(db.Float, nullable=False)
    payment_mode = db.Column(db.String(20), default='Cash') 
    items = db.relationship('CustomerInvoiceItem', backref='invoice', lazy=True, cascade="all, delete-orphan")
    

class CustomerInvoiceItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('customer_invoice.id'), nullable=False)
    medicine_name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    mrp = db.Column(db.Float, nullable=False)
    discount_percent = db.Column(db.Float, default=0)
    total_price = db.Column(db.Float, nullable=False)
    ptr = db.Column(db.Float, default=0.0) # <-- ADD THIS LINE
    gst = db.Column(db.Float, default=0.0)

class PurchaseInvoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    agency_name = db.Column(db.String(100), nullable=False)
    invoice_number = db.Column(db.String(50))
    invoice_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'agency_name': self.agency_name,
            'invoice_number': self.invoice_number,
            'invoice_date': self.invoice_date.strftime('%Y-%m-%d'),
            'amount': self.amount
        }

class ImportRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    original_filename = db.Column(db.String(255), nullable=False)
    saved_filename = db.Column(db.String(255), nullable=False, unique=True)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    imported_count = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'upload_date': self.upload_date.strftime('%Y-%m-%d %H:%M:%S'),
            'imported_count': self.imported_count
        }
    
class AdvancePayment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_delivered = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'amount': self.amount,
            'notes': self.notes,
            'created_date': self.created_date.strftime('%Y-%m-%d %H:%M'),
            'is_delivered': self.is_delivered
        }
class Shortage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    medicine_name = db.Column(db.String(120), nullable=False)
    customer_name = db.Column(db.String(100), nullable=True) # <-- ADD THIS
    customer_phone = db.Column(db.String(20), nullable=True)  # <-- ADD THIS
    requested_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='Pending')

    def to_dict(self):
        return {
            'id': self.id,
            'medicine_name': self.medicine_name,
            'customer_name': self.customer_name, # <-- ADD THIS
            'customer_phone': self.customer_phone, # <-- ADD THIS
            'requested_date': self.requested_date.strftime('%Y-%m-%d %H:%M'),
            'status': self.status
        }
    

# --- DECORATORS & HELPERS ---
def login_required(f):
    """Decorator to protect routes that require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized access. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated_function

def calculate_net_value(amount, gst_percent):
    """Calculates the net value from amount and GST percentage."""
    return float(amount) * (1 + float(gst_percent) / 100)

def parse_date(date_string):
    """Safely parses a date string in YYYY-MM-DD format."""
    if not date_string:
        return None
    try:
        return datetime.strptime(date_string, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None

@app.route("/api/advanced-sales-report")
@login_required
def get_advanced_sales_report():
    """
    Generates a comprehensive sales and profit report for a given date range.
    """
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid or missing date range. Please provide start_date and end_date in YYYY-MM-DD format."}), 400

    # 1. Calculate Total Sales and Profit for the period
    period_totals = db.session.query(
        func.sum(CustomerInvoice.grand_total).label('total_sales'),
        func.sum(
            ((CustomerInvoiceItem.mrp * (1 - CustomerInvoiceItem.discount_percent / 100)) - (Medicine.ptr * (1 + Medicine.gst / 100))) * CustomerInvoiceItem.quantity
        ).label('total_profit')
    ).select_from(CustomerInvoice).join(CustomerInvoiceItem, ...).join(Medicine, ...).filter(...).first()

    daily_trends = db.session.query(
        func.date(CustomerInvoice.bill_date).label('date'),
        func.sum(CustomerInvoice.grand_total).label('sales'),
        func.sum(
            ((CustomerInvoiceItem.mrp * (1 - CustomerInvoiceItem.discount_percent / 100)) - (Medicine.ptr * (1 + Medicine.gst / 100))) * CustomerInvoiceItem.quantity
        ).label('profit')
    ).select_from(CustomerInvoice).join(CustomerInvoiceItem, ...).join(Medicine, ...).filter(...).group_by(...).order_by(...).all()

    top_profitable_products = db.session.query(
        CustomerInvoiceItem.medicine_name,
        func.sum(
            ((CustomerInvoiceItem.mrp * (1 - CustomerInvoiceItem.discount_percent / 100)) - (Medicine.ptr * (1 + Medicine.gst / 100))) * CustomerInvoiceItem.quantity
        ).label('total_profit')
    ).select_from(CustomerInvoice).join(CustomerInvoiceItem, ...).join(Medicine, ...).filter(...).group_by(...).order_by(...).limit(5).all()

    # 3. Get Top 5 Best-Selling Products (by quantity)
    top_selling_products = db.session.query(
        CustomerInvoiceItem.medicine_name,
        func.sum(CustomerInvoiceItem.quantity).label('total_quantity_sold')
    ).join(CustomerInvoice, CustomerInvoice.id == CustomerInvoiceItem.invoice_id)\
     .filter(CustomerInvoice.bill_date.between(start_date, end_date + timedelta(days=1)))\
     .group_by(CustomerInvoiceItem.medicine_name)\
     .order_by(func.sum(CustomerInvoiceItem.quantity).desc())\
     .limit(5)\
     .all()

    # 4. Get Top 5 Most Profitable Products
    top_profitable_products = db.session.query(
        CustomerInvoiceItem.medicine_name,
        func.sum(
            (CustomerInvoiceItem.mrp - (Medicine.ptr * (1 + Medicine.gst / 100))) * CustomerInvoiceItem.quantity
        ).label('total_profit')
    ).select_from(CustomerInvoice)\
     .join(CustomerInvoiceItem, CustomerInvoice.id == CustomerInvoiceItem.invoice_id)\
     .join(Medicine, CustomerInvoiceItem.medicine_name == Medicine.name)\
     .filter(CustomerInvoice.bill_date.between(start_date, end_date + timedelta(days=1)))\
     .group_by(CustomerInvoiceItem.medicine_name)\
     .order_by(func.sum((CustomerInvoiceItem.mrp - (Medicine.ptr * (1 + Medicine.gst / 100))) * CustomerInvoiceItem.quantity).desc())\
     .limit(5)\
     .all()

    report = {
        "period_totals": {
            "total_sales": float(period_totals.total_sales or 0),
            "total_profit": float(period_totals.total_profit or 0)
        },
        "daily_trends": [
            # The database returns a string, so we use it directly. No .strftime() needed.
            {"date": d.date, "sales": float(d.sales or 0), "profit": float(d.profit or 0)} for d in daily_trends
        ],
        "top_selling_products": [
            {"name": p.medicine_name, "value": int(p.total_quantity_sold)} for p in top_selling_products
        ],
        "top_profitable_products": [
            {"name": p.medicine_name, "value": float(p.total_profit or 0)} for p in top_profitable_products
        ]
    }
    
    return jsonify(report)

# --- AUTHENTICATION ROUTES ---
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'phone', 'password']):
        return jsonify({"error": "Missing name, phone, or password"}), 400
    if User.query.filter_by(phone=data['phone']).first():
        return jsonify({"error": "Phone number already registered"}), 409
    
    new_user = User(name=data['name'], phone=data['phone'])
    new_user.set_password(data['password'])

    if data['phone'] in ADMIN_PHONE_NUMBERS:
        new_user.role = 'admin'

    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not all(k in data for k in ['phone', 'password']):
        return jsonify({"error": "Missing phone or password"}), 400
        
    user = User.query.filter_by(phone=data['phone']).first()
    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        session['user_name'] = user.name
        session['user_role'] = user.role
        user_data = {"id": user.id, "name": user.name, "role": user.role}
        return jsonify({"message": "Login successful", "user": user_data}), 200
    
    return jsonify({"error": "Invalid phone or password"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"}), 200

@app.route("/api/check_session")
def check_session():
    if 'user_id' in session:
        user_data = {"id": session['user_id'], "name": session['user_name'], "role": session.get('user_role', 'customer')}
        return jsonify({"isLoggedIn": True, "user": user_data}), 200
    return jsonify({"isLoggedIn": False}), 401





# --- NEW --- Shortage Endpoints ---
@app.route("/api/shortages", methods=["GET", "POST"])
def manage_shortages():
    if 'user_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    if request.method == "POST":
        data = request.get_json()
        new_shortage = Shortage(
    medicine_name=data['medicine_name'],
    customer_name=data.get('customer_name'), # <-- ADD THIS
    customer_phone=data.get('customer_phone')  # <-- ADD THIS
)
        
        db.session.add(new_shortage)
        db.session.commit()
        return jsonify(new_shortage.to_dict()), 201

    # GET request returns all pending shortages
    shortages = Shortage.query.filter_by(status='Pending').order_by(Shortage.requested_date.desc()).all()
    return jsonify([s.to_dict() for s in shortages])

@app.route("/api/shortages/<int:id>/resolve", methods=["PUT"])
def resolve_shortage(id):
    if 'user_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    shortage = Shortage.query.get_or_404(id)
    shortage.status = 'Resolved'
    db.session.commit()
    
    return jsonify({"message": "Shortage marked as resolved."})


# --- ADD THIS NEW ROUTE for customer order history ---
@app.route("/api/my-orders")
@login_required
def get_my_orders():
    # Get the current logged-in user
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Find all invoices matching the user's phone number
    invoices = CustomerInvoice.query.filter_by(customer_phone=user.phone).order_by(CustomerInvoice.bill_date.desc()).all()
    
    # Serialize the data to send to the frontend
    order_list = [{
        'id': inv.id,
        'customer_name': inv.customer_name,
        'bill_date': inv.bill_date.strftime('%d %b %Y, %I:%M %p'),
        'grand_total': inv.grand_total,
        'payment_mode': inv.payment_mode,
        'items': [{
            'medicine_name': item.medicine_name, 
            'quantity': item.quantity, 
            'mrp': item.mrp, 
            'total_price': item.total_price
        } for item in inv.items]
    } for inv in invoices]
        
    return jsonify(order_list)

# --- MEDICINE ROUTES ---
# In app_refactored.py, replace the get_medicines function

@app.route("/api/medicines", methods=["GET"])
def get_medicines():
    query_term = request.args.get('q', '').strip()
    category_param = request.args.get('category', '')
    filter_param = request.args.get('filter', '')
    
    base_query = Medicine.query
    
    # --- MODIFIED: Unified Search Logic ---
    if query_term:
        search_term_like = f'%{query_term}%'
        base_query = base_query.filter(
            or_(
                Medicine.name.ilike(search_term_like),
                Medicine.formula.ilike(search_term_like)
            )
        )

    if category_param:
        base_query = base_query.filter(Medicine.category == category_param)

    today = datetime.now().date()
    if filter_param == 'low_stock':
        base_query = base_query.filter(Medicine.quantity < 3)
    elif filter_param == 'expired':
        base_query = base_query.filter(Medicine.expiry_date < today)
    elif filter_param == 'expiring_soon':
        sixty_days_later = today + timedelta(days=60)
        base_query = base_query.filter(Medicine.expiry_date.between(today, sixty_days_later))

   # --- THIS IS THE FIX ---
    # Order the results first
    base_query = base_query.order_by(Medicine.name)

    # Only apply the limit if a search term is present
    if query_term:
        base_query = base_query.limit(10)

    medicines = base_query.all()
    # --- END OF FIX ---
    
    return jsonify([med.to_dict() for med in medicines])




@app.route("/api/medicines", methods=["POST"])
@login_required
def add_medicine():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Medicine name is required"}), 400

    # --- THIS IS THE CORRECTED LOGIC ---
    # We now handle empty strings by defaulting to '0' before converting to a number.
    ptr_str = data.get('ptr') or '0'
    gst_str = data.get('gst') or '0'
    quantity_str = data.get('quantity') or '0'
    freeqty_str = data.get('freeqty') or '0'
    mrp_str = data.get('mrp') or '0'

    ptr = float(ptr_str)
    gst = float(gst_str)
    quantity = int(quantity_str)
    
    # 'Amount' is the total purchase value for this quantity, after GST
    amount = (ptr * quantity) * (1 + gst / 100)

    new_med = Medicine(
        name=data['name'],
        quantity=quantity,
        freeqty=int(freeqty_str),
        batch_no=data.get('batch_no'),
        expiry_date=parse_date(data.get('expiry_date')),
        mrp=float(mrp_str),
        ptr=ptr,
        gst=gst,
        amount=amount,
        category=data.get('category', 'General'),
        formula=data.get('formula')
    )
    db.session.add(new_med)
    db.session.commit()
    return jsonify(new_med.to_dict()), 201


@app.route("/api/medicines/<int:med_id>", methods=["PUT"])
@login_required
def update_medicine(med_id):
    med = Medicine.query.get_or_404(med_id)
    data = request.get_json()

    try:
        # --- Explicitly update each field to ensure correct data types ---
        med.name = data.get('name', med.name)
        med.quantity = int(data.get('quantity', med.quantity))
        med.freeqty = int(data.get('freeqty', med.freeqty))
        med.batch_no = data.get('batch_no', med.batch_no)
        med.mrp = float(data.get('mrp', med.mrp))
        med.ptr = float(data.get('ptr', med.ptr))
        med.gst = float(data.get('gst', med.gst))
        med.category = data.get('category', med.category)
        med.formula = data.get('formula', med.formula)
        
        # This line now correctly handles both empty and valid date strings
        med.expiry_date = parse_date(data.get('expiry_date'))

        # Recalculate the total purchase amount automatically
        # using the newly updated values
        med.amount = (med.ptr * med.quantity) * (1 + med.gst / 100)

        db.session.commit()
        return jsonify(med.to_dict())
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating medicine: {e}")
        return jsonify({"error": "An internal server error occurred during update."}), 500
    

@app.route("/api/medicines/<int:med_id>", methods=["GET"])
def get_medicine_details(med_id):
    """Fetches specific details for a single medicine by its ID."""
    medicine = Medicine.query.get_or_404(med_id)
    
    # Manually build the response with only the required fields
    medicine_details = {
        "id": medicine.id,
        "name": medicine.name,
        "formula": medicine.formula or None,
        "mrp": medicine.mrp,
        "quantity": medicine.quantity,
        "category": medicine.category
    }
    
    return jsonify(medicine_details)


@app.route("/api/medicines/<int:med_id>", methods=["DELETE"])
@login_required
def delete_medicine(med_id):
    med = Medicine.query.get_or_404(med_id)
    db.session.delete(med)
    db.session.commit()
    return jsonify({"message": f"Medicine '{med.name}' deleted"}), 200

@app.route("/api/customers/all-phones")
@login_required
def get_all_customer_phones():
    """Fetches a list of all unique and valid Indian customer phone numbers."""
    
    all_phones_query = db.session.query(CustomerInvoice.customer_phone).distinct().all()
    all_phones = [phone[0] for phone in all_phones_query if phone[0]]
    
    # --- NEW: More Intelligent Filtering Logic ---
    valid_indian_phones = set() # Use a set to automatically handle duplicates
    for phone in all_phones:
        # 1. Clean the number by removing all non-digit characters
        cleaned_phone = "".join(filter(str.isdigit, phone))
        
        # 2. If the number is 10 digits, add '91' to the front
        if len(cleaned_phone) == 10:
            valid_indian_phones.add("91" + cleaned_phone)
        # 3. If the number is already 12 digits and starts with '91', add it
        elif len(cleaned_phone) == 12 and cleaned_phone.startswith('91'):
            valid_indian_phones.add(cleaned_phone)
            
    return jsonify(list(valid_indian_phones))

@app.route("/api/billing", methods=["POST"])
@login_required
def create_bill():
    data = request.get_json()
    customer_info = data.get('customer')
    items = data.get('items')
    payment_mode = data.get('paymentMode', 'Cash')

    if not all([customer_info, items]):
        return jsonify({"error": "Missing customer information or items"}), 400

    try:
        grand_total = 0
        invoice_items = []
        
        # --- THIS IS THE FIX: Track new medicines within this single transaction ---
        newly_added_medicines = set()

        for item in items:
            if item.get('isManual', False) and item.get('saveToInventory', False):
                item_name = item['name']
                # Check if we already processed this name OR if it's already in the DB
                if item_name not in newly_added_medicines and not Medicine.query.filter_by(name=item_name).first():
                    new_inventory_item = Medicine(
                        name=item_name,
                        mrp=float(item.get('mrp', 0.0)),
                        ptr=float(item.get('ptr', 0.0)),
                        gst=0.0,
                        quantity=0
                    )
                    db.session.add(new_inventory_item)
                    # Add the name to our tracker to prevent duplicates in the same bill
                    newly_added_medicines.add(item_name)
            
            item_ptr = float(item.get('ptr', 0.0))
            item_gst = 0.0

            if not item.get('isManual', False):
                medicine = Medicine.query.get(item['id'])
                if not medicine or medicine.quantity < int(item['quantity']):
                    db.session.rollback()
                    return jsonify({"error": f"Not enough stock for {item['name']}"}), 400
                medicine.quantity -= int(item['quantity'])
                item_ptr = medicine.ptr
                item_gst = medicine.gst

            amount = int(item['quantity']) * float(item['mrp'])
            discount = float(item.get('discount', 0))
            discounted_amount = amount * (1 - discount / 100)
            grand_total += discounted_amount
            
            invoice_items.append(CustomerInvoiceItem(
                medicine_name=item['name'],
                quantity=int(item['quantity']),
                mrp=float(item['mrp']),
                discount_percent=discount,
                total_price=discounted_amount,
                ptr=item_ptr,
                gst=item_gst
            ))
        
        new_invoice = CustomerInvoice(
            customer_name=customer_info.get('name', 'N/A'), 
            customer_phone=customer_info.get('phone', 'N/A'), 
            grand_total=grand_total,
            items=invoice_items,
            payment_mode=payment_mode
        )
        db.session.add(new_invoice)
        db.session.flush()

        today = datetime.now().date()
        for item in items:
            reminder_days_str = item.get('reminder_days')
            if reminder_days_str:
                try:
                    reminder_days = int(reminder_days_str)
                    if reminder_days > 0:
                        reminder_date = today + timedelta(days=reminder_days)
                        new_reminder = Reminder(customer_name=customer_info.get('name', 'N/A'), customer_phone=customer_info.get('phone', 'N/A'), medicine_name=item['name'], reminder_date=reminder_date, invoice_id=new_invoice.id)
                        db.session.add(new_reminder)
                except (ValueError, TypeError):
                    pass
        
        db.session.commit()
        return jsonify({"message": "Bill created successfully", "invoiceId": new_invoice.id}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating bill: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500
    

def safe_int(value, default=0):
    try:
        return int(str(value).strip() or default)
    except (ValueError, TypeError):
        return default

def safe_float(value, default=0.0):
    try:
        return float(str(value).replace('%', '').strip() or default)
    except (ValueError, TypeError):
        return default

# --- CSV IMPORT ROUTE ---
@app.route("/api/medicines/import", methods=["POST"])
@login_required
def import_medicines_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['file']
    if not file or not file.filename.endswith('.csv'):
        return jsonify({"error": "Please select a valid CSV file"}), 400
        
    original_filename = secure_filename(file.filename)
    saved_filename = f"{datetime.now().timestamp()}_{original_filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
    file.save(filepath)

    imported_count = 0
    updated_count = 0
    try:
        with open(filepath, mode='r', encoding='utf-8-sig') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            for row in csv_reader:
                medicine_name = row.get('name', '').strip()
                if not medicine_name:
                    continue

                existing_medicine = Medicine.query.filter_by(name=medicine_name).first()
                quantity = safe_int(row.get('quantity', '0') or 0)
                amount = safe_float(row.get('amount', '0').replace('%', '').strip() or 0.0)
                gst_percent = safe_float(row.get('gst', '0').replace('%', '').strip() or 0.0)
                formula = row.get('formula', '').strip()

                
                if existing_medicine:
                    existing_medicine.quantity += quantity
                    updated_count += 1
                else:
                    new_med = Medicine(
                        name=medicine_name,
                        quantity=quantity,
                        freeqty=safe_int(row.get('freeqty', '0') or 0),
                        batch_no=row.get('batch_no'),
                        expiry_date=parse_date(row.get('expiry_date')),
                        mrp=safe_float(row.get('mrp', '0.0') or 0.0),
                        ptr=safe_float(row.get('ptr', '0.0') or 0.0),
                        amount=amount,
                        gst=gst_percent,
                        netvalue=calculate_net_value(amount, gst_percent),
                        formula=formula
                    )
                    db.session.add(new_med)
                    imported_count += 1
        
        record = ImportRecord(
            original_filename=original_filename, 
            saved_filename=saved_filename, 
            imported_count=(imported_count + updated_count), 
            user_id=session['user_id']
        )
        db.session.add(record)
        db.session.commit()
        
        return jsonify({"message": f"Success! Added: {imported_count}, Updated: {updated_count}."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred during import: {str(e)}"}), 500


# --- ADD THESE NEW ROUTES for the Alerts page ---
@app.route("/api/reminders", methods=["GET"])
@login_required
def get_reminders():
    reminders = Reminder.query.filter(Reminder.status != 'Dismissed').order_by(Reminder.reminder_date.asc()).all()
    return jsonify([r.to_dict() for r in reminders])

@app.route("/api/reminders/<int:id>/dismiss", methods=["PUT"])
@login_required
def dismiss_reminder(id):
    reminder = Reminder.query.get_or_404(id)
    reminder.status = 'Dismissed'
    db.session.commit()
    return jsonify({"message": "Reminder dismissed."})

@app.route("/api/customer-bills", methods=["GET"])
@login_required
def get_customer_bills():
    query = request.args.get('q', '').strip()
    base_query = CustomerInvoice.query

    if query:
        search_term = f"%{query}%"
        base_query = base_query.filter(or_(
            CustomerInvoice.customer_name.ilike(search_term),
            CustomerInvoice.customer_phone.ilike(search_term)
        ))

    invoices = base_query.order_by(CustomerInvoice.bill_date.desc()).all()
    
    bill_list = [{
        'id': inv.id,
        'customer_name': inv.customer_name,
        'customer_phone': inv.customer_phone,
        'bill_date': inv.bill_date.strftime('%Y-%m-%d %H:%M'),
        'grand_total': inv.grand_total,
        'items': [{
            'medicine_name': item.medicine_name, 
            'quantity': item.quantity, 
            'mrp': item.mrp, 
            'discount_percent': item.discount_percent, 
            'total_price': item.total_price
        } for item in inv.items]
    } for inv in invoices]
        
    return jsonify(bill_list)

@app.route("/api/customer-bills/<int:bill_id>", methods=["DELETE"])
@login_required
def delete_customer_bill(bill_id):
    invoice = CustomerInvoice.query.get_or_404(bill_id)
    db.session.delete(invoice)
    db.session.commit()
    return jsonify({"message": "Bill deleted successfully"}), 200

@app.route("/api/customers/search")
@login_required
def search_customers():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    search_term = f"%{query}%"
    customers = (db.session.query(
        CustomerInvoice.customer_phone, 
        CustomerInvoice.customer_name
    ).filter(or_(
        CustomerInvoice.customer_phone.like(search_term), 
        CustomerInvoice.customer_name.like(search_term)
    )).group_by(CustomerInvoice.customer_phone)
      .order_by(func.max(CustomerInvoice.bill_date).desc())
      .limit(10).all())
      
    return jsonify([{'phone': c.customer_phone, 'name': c.customer_name} for c in customers])

@app.route("/api/customers/history/<phone>")
@login_required
def get_customer_history(phone):
    invoices = CustomerInvoice.query.filter_by(customer_phone=phone).order_by(CustomerInvoice.bill_date.desc()).all()
    history = [{
        'id': inv.id, 
        'date': inv.bill_date.strftime('%Y-%m-%d %H:%M'), 
        'total': inv.grand_total, 
        'items': [{
            'name': item.medicine_name, 
            'qty': item.quantity, 
            'price': item.total_price
        } for item in inv.items]
    } for inv in invoices]
    return jsonify(history)

@app.route("/api/customer-history-by-phone/<string:phone>")
@login_required
def get_customer_history_by_phone(phone):
    """Gets purchase count and bill details for a specific phone number."""
    
    # --- DEBUGGING STEP ---
    # This will print the exact phone number the server receives to your terminal.
    print(f"Searching for customer history with phone number: '{phone}'")

    # --- MORE ROBUST QUERY ---
    # We now trim any potential whitespace from the database column for a better match.
    invoices = CustomerInvoice.query.filter(func.trim(CustomerInvoice.customer_phone) == phone).order_by(CustomerInvoice.bill_date.desc()).all()
    
    if not invoices:
        # If no invoices are found, return a clear "not found" response.
        return jsonify({"customer_name": "", "bill_count": 0, "bills": []})

    # Get the name from the most recent invoice
    customer_name = invoices[0].customer_name
    bill_count = len(invoices)
    
    bill_list = [{
        'id': inv.id,
        'bill_date': inv.bill_date.strftime('%Y-%m-%d %H:%M'),
        'grand_total': inv.grand_total,
        'items': [{'medicine_name': item.medicine_name, 'quantity': item.quantity} for item in inv.items]
    } for inv in invoices]
        
    return jsonify({
        "customer_name": customer_name,
        "bill_count": bill_count,
        "bills": bill_list
    })


# --- ADD this to your imports at the top of the file ---
from collections import defaultdict

from sqlalchemy import case # <-- Make sure this is imported at the top of your file
@app.route("/api/daily-sales-summary")
@login_required
def get_daily_sales_summary():
    """Groups all invoices by date and calculates daily totals and profits."""
    
    # This query now has the correct indentation
    sales_by_day = db.session.query(
        func.date(CustomerInvoice.bill_date).label('sale_date'),
        func.count(CustomerInvoice.id).label('bill_count'),
        func.sum(CustomerInvoice.grand_total).label('total_sales'),
        func.sum(
            ((CustomerInvoiceItem.mrp * (1 - CustomerInvoiceItem.discount_percent / 100)) - (Medicine.ptr * (1 + Medicine.gst / 100))) * CustomerInvoiceItem.quantity
        ).label('total_profit')
    ).select_from(CustomerInvoice)\
     .join(CustomerInvoiceItem, CustomerInvoice.id == CustomerInvoiceItem.invoice_id)\
     .join(Medicine, CustomerInvoiceItem.medicine_name == Medicine.name)\
     .filter(Medicine.ptr > 0)\
     .group_by(func.date(CustomerInvoice.bill_date))\
     .order_by(func.date(CustomerInvoice.bill_date).desc())\
     .all()

    summary = [{'date': sale.sale_date, 'bill_count': sale.bill_count, 'total_sales': float(sale.total_sales or 0), 'total_profit': float(sale.total_profit or 0)} for sale in sales_by_day]
    
    return jsonify(summary)


@app.route("/api/daily-sales/<string:date_str>")
@login_required
def get_daily_sales_for_date(date_str):
    """Gets all individual invoices for a specific date."""
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    invoices = CustomerInvoice.query.filter(func.date(CustomerInvoice.bill_date) == target_date).order_by(CustomerInvoice.bill_date.desc()).all()

    bill_list = [{
        'id': inv.id,
        'customer_name': inv.customer_name,
        'grand_total': inv.grand_total,
        'items': [{
            'medicine_name': item.medicine_name, 
            'quantity': item.quantity, 
        } for item in inv.items]
    } for inv in invoices]

    return jsonify(bill_list)

# --- NEW --- Advance Payment Endpoints ---
@app.route("/api/advances", methods=["GET", "POST"])
def manage_advances():
    if 'user_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    if request.method == "POST":
        data = request.get_json()
        new_advance = AdvancePayment(
            customer_name=data['customer_name'],
            customer_phone=data['customer_phone'],
            amount=float(data['amount']),
            notes=data.get('notes')
        )
        db.session.add(new_advance)
        db.session.commit()
        return jsonify(new_advance.to_dict()), 201

    # GET request returns all pending (not delivered) advances
    advances = AdvancePayment.query.filter_by(is_delivered=False).order_by(AdvancePayment.created_date.desc()).all()
    return jsonify([adv.to_dict() for adv in advances])

@app.route("/api/advances/<int:id>/deliver", methods=["PUT"])
def deliver_advance(id):
    if 'user_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    advance = AdvancePayment.query.get_or_404(id)
    advance.is_delivered = True
    db.session.commit()
    
    return jsonify({"message": "Advance marked as delivered."})


# --- PURCHASE INVOICE ROUTES ---
@app.route("/api/purchase-invoices", methods=["GET", "POST"])
@login_required
def manage_purchase_invoices():
    if request.method == "POST":
        data = request.get_json()
        new_inv = PurchaseInvoice(
            agency_name=data.get('agency_name'),
            invoice_number=data.get('invoice_number'),
            invoice_date=parse_date(data.get('invoice_date')),
            amount=float(data.get('amount', 0.0))
        )
        db.session.add(new_inv)
        db.session.commit()
        return jsonify(new_inv.to_dict()), 201
    
    # GET request
    invoices = PurchaseInvoice.query.order_by(PurchaseInvoice.invoice_date.desc()).all()
    return jsonify([inv.to_dict() for inv in invoices])

@app.route("/api/purchase-invoices/<int:inv_id>", methods=["DELETE"])
@login_required
def delete_purchase_invoice(inv_id):
    inv = PurchaseInvoice.query.get_or_404(inv_id)
    db.session.delete(inv)
    db.session.commit()
    return jsonify({"message": "Purchase invoice deleted"}), 200


@app.route("/api/dashboard-stats")
@login_required
def dashboard_stats():
    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)
    
    # --- THIS IS THE FIX: Use a CASE statement for the profit query ---
    profit_today_query = db.session.query(
        func.sum(
            ((CustomerInvoiceItem.mrp * (1 - CustomerInvoiceItem.discount_percent / 100)) - (Medicine.ptr * (1 + Medicine.gst / 100))) * CustomerInvoiceItem.quantity
        )
    ).join(CustomerInvoice, CustomerInvoice.id == CustomerInvoiceItem.invoice_id)\
     .join(Medicine, CustomerInvoiceItem.medicine_name == Medicine.name)\
     .filter(func.date(CustomerInvoice.bill_date) == today)\
     .filter(Medicine.ptr > 0)\
     .scalar() or 0

    profit_today = float(profit_today_query)

    # The rest of the function remains the same...
    total_medicines_count = db.session.query(func.count(Medicine.id)).scalar()
    low_stock_count = Medicine.query.filter(Medicine.quantity < 3).count()
    expired_count = Medicine.query.filter(Medicine.expiry_date < today).count()
    expiring_soon_count = Medicine.query.filter(Medicine.expiry_date.between(today, today + timedelta(days=60))).count()
    pending_reminders = Reminder.query.filter_by(status='Pending').count()
    shortage_count = Shortage.query.filter_by(status='Pending').count()
    sales_today = db.session.query(func.sum(CustomerInvoice.grand_total)).filter(func.date(CustomerInvoice.bill_date) == today).scalar() or 0
    
    sales_data = (db.session.query(
        func.date(CustomerInvoice.bill_date), func.sum(CustomerInvoice.grand_total)
    ).filter(
        CustomerInvoice.bill_date >= thirty_days_ago
    ).group_by(
        func.date(CustomerInvoice.bill_date)
    ).order_by(
        func.date(CustomerInvoice.bill_date)
    ).all())

    sales_chart = [{'date': dt.strftime('%b %d'), 'sales': float(total)} for dt_str, total in sales_data for dt in [datetime.strptime(dt_str, '%Y-%m-%d')]]
    
    stats = {
        "totalMedicines": total_medicines_count,
        "lowStockCount": low_stock_count,
        "expiredCount": expired_count,
        "expiringSoonCount": expiring_soon_count,
        "salesToday": sales_today,
        "salesChart": sales_chart,
        "pendingReminders": pending_reminders,
        "shortageCount": shortage_count,
        "profitToday": profit_today
    }
    return jsonify(stats)

@app.route("/api/profit-today-details")
@login_required
def get_profit_today_details():
    """
    Gets a detailed breakdown of items sold today, correctly accounting for discounts
    and only calculating profit for items with a valid purchase price (PTR > 0).
    """
    today = datetime.now().date()
    
    # Fetch all individual items sold today, joining with their master medicine record
    items_sold = db.session.query(
        CustomerInvoiceItem, Medicine
    ).join(CustomerInvoice, CustomerInvoice.id == CustomerInvoiceItem.invoice_id)\
     .join(Medicine, CustomerInvoiceItem.medicine_name == Medicine.name)\
     .filter(func.date(CustomerInvoice.bill_date) == today)\
     .all()

    # Aggregate the results in Python to handle multiple sales of the same item correctly
    profit_details_agg = {}
    for sale_item, medicine_record in items_sold:
        name = sale_item.medicine_name
        
        # If we haven't seen this medicine yet, initialize it in our dictionary
        if name not in profit_details_agg:
            profit_details_agg[name] = {
                'medicine_name': name,
                'quantity_sold': 0,
                'mrp': medicine_record.mrp,
                'cost_price': 0, # Default to 0
                'total_profit': 0
            }
        
        # --- THIS IS THE CORRECTED LOGIC ---
        # Only calculate profit if the PTR is valid (greater than 0)
        profit_for_this_sale = 0
        cost_price = 0
        if medicine_record and medicine_record.ptr and medicine_record.ptr > 0:
            cost_price = medicine_record.ptr * (1 + (medicine_record.gst or 0) / 100)
            sale_price_after_discount = sale_item.mrp * (1 - (sale_item.discount_percent or 0) / 100)
            profit_for_this_sale = (sale_price_after_discount - cost_price) * sale_item.quantity

        # Add the results to our aggregate dictionary
        profit_details_agg[name]['quantity_sold'] += sale_item.quantity
        profit_details_agg[name]['total_profit'] += profit_for_this_sale
        profit_details_agg[name]['cost_price'] = cost_price # Store the calculated cost price

    details = list(profit_details_agg.values())
    
    # Calculate the 'profit_per_item' for display purposes
    for item in details:
        if item['quantity_sold'] > 0 and item['total_profit'] != 0:
            item['profit_per_item'] = item['total_profit'] / item['quantity_sold']
        else:
            item['profit_per_item'] = 0
            
    return jsonify(details)


# --- PUBLIC BILL VIEW ---
@app.route("/bill/view/<int:invoice_id>")
def view_public_bill(invoice_id):
    """Renders a simple, mobile-friendly HTML page for a specific invoice."""
    invoice = CustomerInvoice.query.get_or_404(invoice_id)
    
    html_template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #{{ invoice.id }}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 20px; background-color: #f7fafc; color: #1a202c; }
            .container { max-width: 600px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            h1 { color: #2d3748; text-align: center; margin-bottom: 0; }
            .header-sub { text-align: center; color: #718096; margin-top: 5px; margin-bottom: 30px;}
            .details { border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 15px; }
            .details p { margin: 6px 0; color: #4a5568; display: flex; justify-content: space-between; }
            .details p strong { color: #2d3748; }
            .items { width: 100%; border-collapse: collapse; }
            .items th, .items td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            .items th { color: #718096; font-weight: 600; }
            .items .align-right { text-align: right; }
            .total { text-align: right; font-weight: bold; font-size: 1.25em; margin-top: 20px; color: #2d3748;}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>CurePharma X</h1>
            <p class="header-sub">Medical Invoice</p>
            <div class="details">
                <p><strong>Invoice #:</strong> <span>{{ invoice.id }}</span></p>
                <p><strong>Customer:</strong> <span>{{ invoice.customer_name }}</span></p>
                <p><strong>Date:</strong> <span>{{ invoice.bill_date.strftime('%d %b %Y, %I:%M %p') }}</span></p>
            </div>
            <table class="items">
                <thead><tr><th>Item</th><th class="align-right">Qty</th><th class="align-right">MRP</th><th class="align-right">Total</th></tr></thead>
                <tbody>
                    {% for item in invoice.items %}
                    <tr>
                        <td>{{ item.medicine_name }}</td>
                        <td class="align-right">{{ item.quantity }}</td>
                        <td class="align-right">₹{{ "%.2f"|format(item.mrp) }}</td>
                        <td class="align-right">₹{{ "%.2f"|format(item.total_price) }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
            <p class="total">Grand Total: ₹{{ "%.2f"|format(invoice.grand_total) }}</p>
        </div>
    </body>
    </html>
    """
    return render_template_string(html_template, invoice=invoice)

# --- UTILITY COMMAND ---
@app.cli.command("init-db")
def init_db_command():
    """Initializes the database and creates all tables."""
    with app.app_context():
        db.create_all()
    print("✅ Initialized the database and created all tables.")


# --- RUN APP ---
if __name__ == "__main__":
    # For production, use a proper WSGI server like Gunicorn or uWSGI
    app.run(debug=True, port=5001)