import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // --- NEW: Import QR Code component
import { QrCode, MessageSquare } from 'lucide-react'; // --- NEW: Import Icons
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, LayoutDashboard, Package, LogOut, AlertTriangle, PlusCircle, Trash2, Edit, X, Search, FileText, ClipboardX, Store ,Receipt, History, MinusCircle, DollarSign, Upload, Building, BrainCircuit, Sparkles,ClipboardList, Wallet, ArrowLeft,BellRing, HeartPulse, Baby, ShieldCheck, Bone, Sun, Wind } from 'lucide-react';

// --- Axios Configuration ---
const api = axios.create({ baseURL: 'http://localhost:5001/api', withCredentials: true });

// --- Reusable UI Components ---
const Modal = ({ children, isOpen, onClose, size = '2xl' }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`bg-white rounded-xl shadow-2xl w-full max-w-${size} max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);
const Button = ({ children, onClick, className = '', variant = 'primary', type = 'button', disabled = false }) => {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${variants[variant]} ${className}`}>{children}</button>;
};
const Input = (props) => <input {...props} className={`w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className}`} />;

export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    
    // This state controls whether to show the admin panel or the store
    const [appView, setAppView] = useState('store'); 
    
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAdminChoice, setShowAdminChoice] = useState(false);

    useEffect(() => { 
        api.get('/check_session')
           .then(res => setUser(res.data.user))
           .catch(() => setUser(null))
           .finally(() => setIsAuthLoading(false)); 
    }, []);

    const handleLoginSuccess = (loggedInUser) => {
        setUser(loggedInUser);
        setShowLoginModal(false);
        // If the logged-in user is an admin, show them the choice modal
        if (loggedInUser.role === 'admin') {
            setShowAdminChoice(true);
        }
    };

    const handleLogout = () => {
        api.post('/logout').then(() => {
            setUser(null);
            setAppView('store'); // Always return to store view on logout
        });
    };

    if (isAuthLoading) {
        return <div className="bg-gray-100 h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <>
            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} size="sm">
                <AuthScreen onLoginSuccess={handleLoginSuccess} />
            </Modal>

            <Modal isOpen={showAdminChoice} onClose={() => setShowAdminChoice(false)} size="lg">
                <AdminChoiceScreen 
                    onSelectInventory={() => { setAppView('admin'); setShowAdminChoice(false); }}
                    onSelectStore={() => { setAppView('store'); setShowAdminChoice(false); }}
                />
            </Modal>

            {/* This now conditionally renders the correct part of your app */}
            {appView === 'admin' && user?.role === 'admin' ? (
                <InventorySystem user={user} onLogout={handleLogout} />
            ) : (
                <CustomerStore user={user} onLogout={handleLogout} onLoginRequest={() => setShowLoginModal(true)} />
            )}
        </>
    );
}

const AdminChoiceScreen = ({ onSelectInventory, onSelectStore }) => (
    <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Welcome, Admin!</h2>
        <p className="text-gray-600 mb-6">Where would you like to go?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button 
                whileHover={{ y: -5 }}
                onClick={onSelectInventory} 
                className="p-8 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
                <LayoutDashboard className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <span className="text-lg font-semibold">Inventory System</span>
            </motion.button>
            <motion.button 
                whileHover={{ y: -5 }}
                onClick={onSelectStore} 
                className="p-8 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
                <Store className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <span className="text-lg font-semibold">Customer Webstore</span>
            </motion.button>
        </div>
    </div>
);
// --- AuthScreen Component ---
const AuthScreen = ({ onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); const url = isLoginView ? '/login' : '/signup';
        try {
            const response = await api.post(url, { name, phone, password });
            if (isLoginView) onLoginSuccess(response.data.user);
            else { alert('Signup successful! Please log in.'); setIsLoginView(true); }
        } catch (err) { setError(err.response?.data?.error || 'An error occurred.'); }
    };
    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6"><Pill className="mx-auto h-10 w-10 text-blue-600" /><h1 className="text-3xl font-bold mt-4 text-gray-800">CurePharma X</h1></div>
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center text-sm">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoginView && <Input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required />}
                        <Input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
                        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <Button type="submit" className="w-full !py-3">{isLoginView ? 'Log In' : 'Sign Up'}</Button>
                    </form>
                    <p className="text-center text-sm mt-6 text-gray-500">{isLoginView ? "Don't have an account? " : "Already have an account? "}<button onClick={() => setIsLoginView(!isLoginView)} className="text-blue-600 hover:underline font-semibold">{isLoginView ? 'Sign Up' : 'Log In'}</button></p>
                </div>
            </div>
        </div>
    );
};

const CustomerStore = ({ user, onLogout, onLoginRequest }) => {
    // --- STATE MANAGEMENT ---
    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('curepharma_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) { return []; }
    });
    const [activePage, setActivePage] = useState('store'); 
    const [isLoading, setIsLoading] = useState(true);

    // --- DATA FETCHING & PERSISTENCE ---
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            api.get(`/medicines?q=${searchTerm}`)
                .then(res => setMedicines(res.data))
                .finally(() => setIsLoading(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        localStorage.setItem('curepharma_cart', JSON.stringify(cart));
    }, [cart]);

    // --- CART LOGIC ---
    const addToCart = (medicine) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === medicine.id);
            if (existingItem) {
                return prevCart.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
            } else {
                return [...prevCart, { ...medicine, quantity: 1 }];
            }
        });
    };
    const updateCartQuantity = (medicineId, quantity) => {
        const newQuantity = Math.max(0, quantity);
        if (newQuantity === 0) {
            setCart(prevCart => prevCart.filter(item => item.id !== medicineId));
        } else {
            setCart(prevCart => prevCart.map(item => item.id === medicineId ? { ...item, quantity: newQuantity } : item));
        }
    };
    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cart.reduce((acc, item) => acc + (item.mrp * item.quantity), 0);

    // --- RENDER LOGIC ---
    const renderContent = () => {
        switch (activePage) {
            case 'cart': return <CartView cart={cart} updateCartQuantity={updateCartQuantity} cartTotal={cartTotal} onCheckout={() => setActivePage('checkout')} onContinueShopping={() => setActivePage('store')} />;
            case 'checkout': return <CheckoutView cart={cart} cartTotal={cartTotal} user={user} onOrderPlaced={() => { setCart([]); setActivePage('orderHistory'); }} />;
            case 'orderHistory': return <OrderHistoryView onBackToStore={() => setActivePage('store')} />;
            default: return <StoreView medicines={medicines} onAddToCart={addToCart} isLoading={isLoading} />;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
           <header className="bg-white sticky top-0 z-20 shadow-md">
                {/* Top Bar */}
                <div className="bg-slate-100 py-2 border-b">
                    <div className="container mx-auto px-6 flex justify-between items-center text-sm text-slate-600">
                        <span>Your Trusted Online Pharmacy</span>
                        {/* --- THIS PART IS NOW CONDITIONAL --- */}
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span>Welcome, {user.name}</span>
                                <button onClick={onLogout} className="text-slate-500 hover:text-red-600 transition-colors font-semibold">Logout</button>
                            </div>
                        ) : (
                            <button onClick={onLoginRequest} className="font-semibold text-blue-600 hover:underline">
                                Login / Sign Up
                            </button>
                        )}
                    </div>
                </div>
                {/* Main Header */}
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={() => setActivePage('store')} className="flex items-center space-x-2">
                        <Pill className="h-10 w-10 text-blue-600" />
                        <span className="text-3xl font-bold"><span className="text-red-600">Cure</span><span className="text-blue-600">Pharma</span></span>
                    </button>
                    <div className="hidden lg:flex flex-grow max-w-xl mx-8 relative">
                        <Input type="text" placeholder="Search for Medicines, Health Products..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setActivePage('store'); }} className="w-full !p-3 !pl-12 !bg-slate-100 !shadow-inner !rounded-full"/>
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* --- My Orders is now conditional --- */}
                        {user && (
                            <button onClick={() => setActivePage('orderHistory')} className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors">
                                <History size={28} />
                                <span className="hidden md:block font-semibold">My Orders</span>
                            </button>
                        )}
                        <button onClick={() => setActivePage('cart')} className="relative flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors">
                            <Package size={28} />
                            <span className="hidden md:block font-semibold">Cart</span>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-white font-bold">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-6 py-8">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={activePage}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>
            
            <footer className="bg-slate-800 text-white mt-16 py-12">
                <div className="container mx-auto px-6 text-center">
                    <p>&copy; {new Date().getFullYear()} CurePharma X. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};


// --- SUB-COMPONENTS for the new design ---

const StoreView = ({ medicines, onAddToCart, isLoading }) => (
    <>
        {/* --- Hero Banner --- */}
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            <motion.div 
                initial={{ opacity: 0, x: -50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5 }} 
                className="lg:col-span-3 bg-gradient-to-br from-red-600 to-red-800 p-10 rounded-3xl shadow-2xl text-white"
            >
                <h1 className="text-5xl font-black tracking-tight">UP TO 20% OFF</h1>
                {/* --- TEXT CORRECTED --- */}
                <p className="mt-2 text-2xl font-semibold text-red-100">On All CurePharma Products</p>
                <p className="mt-4 text-red-200">Unlock exclusive savings on our in-house brands and prioritize your health.</p>
                <Button className="mt-6 !bg-white !text-red-600 !font-bold hover:!bg-red-100">Explore Deals</Button>
            </motion.div>
            <motion.div 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5 }} 
                className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-3xl shadow-2xl text-white"
            >
                 <h1 className="text-5xl font-black tracking-tight">Everyday Essentials</h1>
                 <p className="mt-2 text-2xl font-semibold text-blue-100">Starting at ₹49</p>
                 <p className="mt-4 text-blue-200">Personal care, health devices, and more at unbeatable prices.</p>
                 <Button className="mt-6 !bg-white !text-blue-600 !font-bold hover:!bg-blue-100">Shop Now</Button>
            </motion.div>
        </div>

        {/* --- The rest of the StoreView component remains the same --- */}
        <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <CategoryCard icon={HeartPulse} label="Cardiac Care" />
                <CategoryCard icon={Baby} label="Baby Care" />
                <CategoryCard icon={ShieldCheck} label="Immunity" />
                <CategoryCard icon={Bone} label="Ortho Care" />
                <CategoryCard icon={Sun} label="Skin Care" />
                <CategoryCard icon={Wind} label="Respiratory" />
            </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (
                medicines.map(med => (
                    <ProductCard key={med.id} med={med} onAddToCart={onAddToCart} />
                ))
            )}
        </div>
    </>
);
const CategoryCard = ({ icon: Icon, label }) => (
    <motion.div 
        whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} 
        className="bg-white p-4 rounded-xl shadow-lg text-center cursor-pointer flex flex-col items-center justify-center h-32"
    >
        <Icon className="h-12 w-12 text-blue-500 mb-2" />
        <span className="font-semibold text-gray-700">{label}</span>
    </motion.div>
);

const ProductCard = ({ med, onAddToCart }) => (
    <motion.div className="bg-white rounded-2xl shadow-lg overflow-hidden group flex flex-col" whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
        <div className="h-48 bg-gray-100 flex items-center justify-center relative"><Package size={48} className="text-gray-300 group-hover:text-blue-500 transition-colors duration-300" /></div>
        <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-gray-800 truncate">{med.name}</h3>
            <p className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 text-transparent bg-clip-text mt-2">₹{med.mrp?.toFixed(2)}</p>
            <Button onClick={() => onAddToCart(med)} className="w-full mt-auto bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 !font-bold !py-3 !rounded-xl">
                <PlusCircle size={20} /><span>Add to Cart</span>
            </Button>
        </div>
    </motion.div>
);

const ProductSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col animate-pulse">
        <div className="h-48 bg-slate-200"></div>
        <div className="p-6 flex flex-col flex-grow">
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-6"></div>
            <div className="h-12 bg-slate-200 rounded-xl mt-auto"></div>
        </div>
    </div>
);

const CartView = ({ cart, updateCartQuantity, cartTotal, onCheckout, onContinueShopping }) => (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-4xl mx-auto">
        <div className="flex justify-between items-center border-b-2 border-gray-100 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Your Cart</h1>
            <h2 className="text-xl font-semibold text-gray-500">{cart.length} Items</h2>
        </div>
        {cart.length === 0 ? 
            (<div className="text-center py-16"><ClipboardX size={56} className="mx-auto text-gray-300 mb-4"/><h2 className="text-2xl font-semibold text-gray-700">Your cart is empty.</h2><p className="text-gray-500 mt-2">Looks like you haven't added anything yet.</p><Button onClick={onContinueShopping} className="mt-6">Continue Shopping</Button></div>) : 
            (<>
                <div className="space-y-6">{cart.map(item => (<div key={item.id} className="flex flex-col sm:flex-row items-center justify-between"><div><h2 className="font-bold text-lg">{item.name}</h2><p className="text-gray-500">₹{item.mrp?.toFixed(2)} each</p></div><div className="flex items-center space-x-4 mt-4 sm:mt-0"><Input type="number" value={item.quantity} onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))} className="w-20 text-center p-2 rounded-md border-gray-300" /><p className="font-bold text-xl w-24 text-right">₹{(item.mrp * item.quantity).toFixed(2)}</p><button onClick={() => updateCartQuantity(item.id, 0)}><Trash2 className="text-red-500 h-6 w-6 hover:text-red-700 transition-colors"/></button></div></div>))}</div>
                <div className="mt-8 pt-6 border-t-2 border-dashed flex justify-between items-center">
                    <Button onClick={onContinueShopping} variant="secondary">Continue Shopping</Button>
                    <div className="text-right">
                        <p className="text-gray-500">Grand Total</p>
                        <p className="text-4xl font-extrabold text-gray-900">₹{cartTotal.toFixed(2)}</p>
                        <Button onClick={onCheckout} className="mt-4 !py-3 !px-8 !text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl transform hover:scale-105 transition-all">Proceed to Checkout</Button>
                    </div>
                </div>
            </>)
        }
    </div>
);

const OrderHistoryView = ({ onBackToStore }) => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {api.get('/my-orders').then(res => setOrders(res.data)).catch(err => console.error("Error fetching orders:", err)).finally(() => setIsLoading(false));}, []);
    if (isLoading) return <div className="text-center p-12">Loading your order history...</div>;
    return (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 border-b-2 border-gray-100 pb-6 mb-6">Your Order History</h1>
            {orders.length === 0 ? 
                (<div className="text-center py-16"><History size={56} className="mx-auto text-gray-300 mb-4"/><h2 className="text-2xl font-semibold text-gray-700">No Orders Found</h2><p className="text-gray-500 mt-2">Your past orders will appear here once you place an order.</p><Button onClick={onBackToStore} className="mt-6">Browse Store</Button></div>) : 
                (<div className="space-y-6">{orders.map(order => (<div key={order.id} className="border border-gray-200 rounded-xl p-6 transition-shadow hover:shadow-lg bg-white"><div className="flex flex-col sm:flex-row justify-between sm:items-center"><div><h2 className="font-bold text-xl text-gray-800">Order #{order.id}</h2><p className="text-sm text-gray-500">{order.bill_date}</p></div><p className="font-bold text-2xl text-blue-600 mt-2 sm:mt-0">₹{order.grand_total.toFixed(2)}</p></div><div className="mt-4 border-t pt-4"><h3 className="font-semibold mb-2">Items:</h3>{order.items.map((item, index) => (<div key={index} className="flex justify-between text-gray-600"><span>{item.medicine_name} (x{item.quantity})</span><span>₹{item.total_price.toFixed(2)}</span></div>))}</div></div>))}</div>)
            }
        </div>
    );
};

const CheckoutView = ({ cart, cartTotal, user, onOrderPlaced }) => {
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        const customerDetails = { name: user.name, phone: user.phone };
        const orderItems = cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, mrp: item.mrp, discount: 0, isManual: false }));
        try {
            const res = await api.post('/billing', { customer: customerDetails, items: orderItems, paymentMode: 'COD' });
            alert('Your order has been placed successfully!');
            onOrderPlaced(res.data);
        } catch(err) {
            alert('Could not place order. Please try again.');
        } finally { setIsPlacingOrder(false); }
    };
    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Confirm Your Order</h1>
            <div className="border-b pb-4 mb-6"><h3 className="font-semibold text-lg">Shipping to:</h3><p className="text-gray-600">{user.name} ({user.phone})</p></div>
            <h3 className="font-semibold text-lg mb-2">Order Summary:</h3>
            <div className="border-y py-4 space-y-2 mb-6">{cart.map(item => (<div key={item.id} className="flex justify-between"><span className="text-gray-700">{item.name} (x{item.quantity})</span><span className="font-medium">₹{(item.mrp * item.quantity).toFixed(2)}</span></div>))}</div>
            <div className="text-right text-3xl font-extrabold mb-8">Total: ₹{cartTotal.toFixed(2)}</div>
            <Button onClick={handlePlaceOrder} disabled={isPlacingOrder} className="w-full !py-4 !text-lg !font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl transform hover:scale-105 transition-all">
                {isPlacingOrder ? 'Placing Order...' : 'Confirm & Place Order (Cash on Delivery)'}
            </Button>
        </div>
    );
};



// --- Main Inventory System (with Animated Blue Sidebar) ---
const InventorySystem = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState('about');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); 
    const [billingCustomer, setBillingCustomer] = useState({ name: '', countryCode: '91', localPhone: '' });
    const [billingItems, setBillingItems] = useState([]);
    // --- AND MODIFY THIS FUNCTION ---
    const handleBillCreated = () => {
        // Reset the state to its default values
        setBillingCustomer({ name: '', countryCode: '91', localPhone: '' });
        setBillingItems([]);
    };

    // This function determines which page component to show
    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard setActiveView={setActiveView} />;
            case 'chatbot': return <ChatbotView />;
            case 'medicines': return <MedicinesView />;
            case 'alerts': return <AlertsView />;
            case 'billing': return (
    <BillingView 
        customer={billingCustomer}
        setCustomer={setBillingCustomer}
        items={billingItems}
        setItems={setBillingItems}
        onBillCreated={handleBillCreated}
    />
);
            case 'customer-bills': return <CustomerBillsView />;
            case 'advances': return <AdvancesView />;
            case 'shortages': return <ShortagesView />;
            case 'purchase-invoices': return <PurchaseInvoiceView />;
            case 'customer-history': return <CustomerHistoryView />;
            case 'import': return <ImportView />;
            case 'about': return <AboutView />; 
            default: return <Dashboard />;
        }
    };
    

    // --- NEW --- About View Component ---
const AboutView = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <motion.div 
                className="text-center p-12 bg-white rounded-xl shadow-lg border border-gray-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Pill className="mx-auto h-16 w-16 text-blue-600 mb-4" />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 text-transparent bg-clip-text">
                    CurePharma X
                </h1>
                <p className="mt-2 text-lg text-gray-500">
                    Next Generation Inventory Software
                </p>
            </motion.div>
        </div>
    );
};

    // This is a sub-component for the navigation buttons in the sidebar
    const NavItem = ({ icon: Icon, label, viewName, isExpanded }) => (
        <button
            onClick={() => setActiveView(viewName)}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors duration-700 ${
                activeView === viewName 
                ? 'bg-blue-700 text-white shadow-inner' // Style for the active button
                : 'text-blue-100 hover:bg-blue-700' // Style for inactive buttons
            }`}
        >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
                {isExpanded && (
                    <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800">
            {/* --- The Animated Sidebar --- */}
            <motion.aside
                className="bg-blue-600 p-4 flex flex-col shrink-0 shadow-lg"
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
                animate={{ width: isSidebarExpanded ? '16rem' : '4.5rem' }} // Animates width
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Sidebar Header */}
                <button onClick={() => setActiveView('about')} className="flex items-center space-x-2 mb-8 px-2 overflow-hidden text-left w-full">
                    <Pill className="h-8 w-8 text-white flex-shrink-0" />
                    <AnimatePresence>
                        {isSidebarExpanded && (
                            <motion.span 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                className="text-xl font-bold text-white whitespace-nowrap"
                            >
                                CurePharma X
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {/* Navigation Menu */}
                <nav className="flex-grow space-y-1">
                    <NavItem icon={LayoutDashboard} label="Dashboard" viewName="dashboard" isExpanded={isSidebarExpanded} />
                    <NavItem icon={BrainCircuit} label="AI Helper" viewName="chatbot" isExpanded={isSidebarExpanded} />
                    <NavItem icon={Package} label="Medicines" viewName="medicines" isExpanded={isSidebarExpanded} />
                    <NavItem icon={Receipt} label="New Bill" viewName="billing" isExpanded={isSidebarExpanded} />
                    <NavItem icon={Building} label="Agency Invoices" viewName="purchase-invoices" isExpanded={isSidebarExpanded} />
                    <NavItem icon={ClipboardList} label="Customer Bills" viewName="customer-bills" isExpanded={isSidebarExpanded} />
                    <NavItem icon={BellRing} label="Reminders" viewName="alerts" isExpanded={isSidebarExpanded} />
                    <NavItem icon={Wallet} label="Advances" viewName="advances" isExpanded={isSidebarExpanded} />
                    <NavItem icon={ClipboardX} label="Shortages" viewName="shortages" isExpanded={isSidebarExpanded} />
                    <NavItem icon={History} label="Customer History" viewName="customer-history" isExpanded={isSidebarExpanded} />
                    <NavItem icon={Upload} label="Import CSV" viewName="import" isExpanded={isSidebarExpanded} />
                </nav>

                {/* Logout Button */}
                <div className="mt-auto">
                    <button
                        onClick={onLogout}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left text-blue-100 hover:bg-red-500 hover:text-white transition-colors duration-200"
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        <AnimatePresence>
                            {isSidebarExpanded && (
                                <motion.span 
                                    initial={{ opacity: 0, width: 0 }} 
                                    animate={{ opacity: 1, width: 'auto' }} 
                                    exit={{ opacity: 0, width: 0 }} 
                                    transition={{ duration: 0.2 }}
                                    className="whitespace-nowrap"
                                >
                                    Logout
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-grow p-6 lg:p-8 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

// --- Medicines View (with Full Details) ---
const MedicinesView = () => {
    const [medicines, setMedicines] = useState([]);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMedicines = useCallback(() => { api.get('/medicines').then(res => setMedicines(res.data)) }, []);
    useEffect(fetchMedicines, [fetchMedicines]);

    const onSave = () => { fetchMedicines(); setIsFormModalOpen(false); };
    const onDelete = (id) => { if (window.confirm('Are you sure?')) { api.delete(`/medicines/${id}`).then(fetchMedicines); } };
    
    const filteredMedicines = medicines.filter(med => med.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <>
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} size="3xl"><MedicineForm medicine={editingMedicine} onSave={onSave} onCancel={() => setIsFormModalOpen(false)} /></Modal>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Medicines</h1>
                <Button onClick={() => { setEditingMedicine(null); setIsFormModalOpen(true); }}><PlusCircle size={20} /><span>Add Medicine</span></Button>
            </div>
            <div className="mb-6 relative">
                <Input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10"/>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 font-semibold">S.No</th>
                        <th className="p-3 font-semibold">Name</th>
                        <th className="p-3 font-semibold">Batch #</th>
                        <th className="p-3 font-semibold">Qty</th>
                        <th className="p-3 font-semibold">Expiry</th>
                        <th className="p-3 font-semibold">MRP</th>
                        <th className="p-3 font-semibold">PTR</th>
                        <th className="p-3 font-semibold">GST(%)</th>
                        <th className="p-3 font-semibold text-right">Actions</th>
                    </tr></thead>
                    <tbody>
                        {filteredMedicines.map((med, index) => (
                            <tr key={med.id} className="border-t">
                                <td className="p-3 font-medium">{index + 1}</td>
                                <td className="p-3 font-medium">{med.name}</td>
                                <td className="p-3 text-gray-500">{med.batch_no}</td>
                                <td className="p-3">{med.quantity}</td>
                                <td className="p-3 text-gray-500">{med.expiry_date}</td>
                                <td className="p-3">₹{med.mrp?.toFixed(2)}</td>
                                <td className="p-3">₹{med.ptr?.toFixed(2)}</td>
                                <td className="p-3">{med.gst}%</td>
                                <td className="p-3 text-right space-x-2 flex items-center justify-end">
                                    <button onClick={() => { setEditingMedicine(med); setIsFormModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={18} /></button>
                                    <button onClick={() => onDelete(med.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};


// --- AI Chatbot View (Corrected) ---
const ChatbotView = () => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am your AI assistant. How can I help? Please describe the symptoms.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // This is a MOCK API call. You can replace this with a real call to your trained model.
    const getBotResponse = async (userInput) => {
        // Simulate network delay to make it feel real
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const input = userInput.toLowerCase();
        
        // Simple keyword-based logic. Your real AI model would handle this more intelligently.
        if (input.includes('headache') && input.includes('fever')) {
            return 'For headache and fever, consider Paracetamol or Ibuprofen. Please check for allergies first.';
        }
        if (input.includes('headache')) {
            return 'For a simple headache, a pain reliever like Paracetamol or Aspirin could be effective.';
        }
        if (input.includes('cough') && (input.includes('dry') || input.includes('sore throat'))) {
            return 'For a dry cough and sore throat, a cough suppressant like Dextromethorphan or lozenges could provide relief.';
        }
        if (input.includes('cough') && (input.includes('mucus') || input.includes('chest congestion'))) {
             return 'For a productive cough with mucus, an expectorant like Guaifenesin might be helpful.';
        }
        if (input.includes('runny nose') || input.includes('sneezing')) {
            return 'For symptoms like a runny nose or sneezing, an antihistamine like Cetirizine or Loratadine is often recommended.';
        }
        if (input.includes('stomach ache') || input.includes('indigestion')) {
            return 'For stomach ache or indigestion, an antacid can provide relief. If the pain is severe or persistent, please consult a doctor.';
        }

        return "I'm sorry, I'm not familiar with those symptoms. Please try describing them differently or consult a pharmacist directly for assistance.";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        const botResponseText = await getBotResponse(inputValue);
        const botMessage = { sender: 'bot', text: botResponseText };

        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-4">AI Symptom Helper</h1>
            <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-y-auto mb-4">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`rounded-2xl p-3 max-w-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="rounded-2xl p-3 bg-gray-200 text-gray-500 rounded-bl-none">
                            Thinking...
                         </div>
                    </div>
                )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Describe symptoms here..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>Send</Button>
            </form>
        </div>
    );
};

const MedicineForm = ({ medicine, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', quantity: '', freeqty: '', batch_no: '', expiry_date: '', mrp: '', ptr: '', amount: '', gst: '' });
    useEffect(() => { 
        if (medicine) {
            // Ensure expiry_date is in YYYY-MM-DD format for the input
            const formattedMedicine = { ...medicine, expiry_date: medicine.expiry_date ? medicine.expiry_date.split('T')[0] : '' };
            setFormData(formattedMedicine);
        } else {
            setFormData({ name: '', quantity: '', freeqty: '', batch_no: '', expiry_date: '', mrp: '', ptr: '', amount: '', gst: '' });
        }
    }, [medicine]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = medicine ? 'put' : 'post';
        const url = medicine ? `/medicines/${medicine.id}` : '/medicines';
        await api[method](url, formData);
        onSave();
    };
    return (
        <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-xl font-bold mb-6">{medicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Medicine Name" required className="lg:col-span-2" />
                <Input name="batch_no" value={formData.batch_no} onChange={handleChange} placeholder="Batch #" />
                <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
                <Input name="freeqty" type="number" value={formData.freeqty} onChange={handleChange} placeholder="Free Qty" />
                <Input name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} />
                <Input name="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleChange} placeholder="MRP (₹)" />
                <Input name="ptr" type="number" step="0.01" value={formData.ptr} onChange={handleChange} placeholder="PTR (₹)" />
                <Input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Amount (₹)" />
                <Input name="gst" type="number" step="0.01" value={formData.gst} onChange={handleChange} placeholder="GST (%)" />
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Medicine</Button>
            </div>
        </form>
    );
};

// --- Import CSV View (with Full Details) ---
const ImportView = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ message: '', type: '' });
    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/medicines/import', formData);
            setStatus({ message: res.data.message, type: 'success' });
        } catch (err) { setStatus({ message: err.response?.data?.error || 'Import failed', type: 'error' }); }
    };
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Import Medicines from CSV</h1>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
                <p className="mb-2">1. Your CSV file must have a header row.</p>
                <p className="mb-4">2. Required headers: <code className="bg-gray-100 p-1 rounded">name,quantity,mrp</code>. Optional headers: <code className="bg-gray-100 p-1 rounded">freeqty,batch_no,expiry_date,ptr,amount,gst</code></p>
                <div className="flex gap-2"><Input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} /><Button onClick={handleUpload}><Upload size={18}/><span>Upload</span></Button></div>
                {status.message && <p className={`mt-4 text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{status.message}</p>}
            </div>
        </div>
    );
};
const BillingView = ({ customer, setCustomer, items, setItems, onBillCreated }) => {
    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [manualItem, setManualItem] = useState({ name: '', mrp: '' });
    const [lastBill, setLastBill] = useState(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [saveToInventory, setSaveToInventory] = useState(true);
    const [paymentMode, setPaymentMode] = useState('Cash');

    useEffect(() => { api.get('/medicines').then(res => setMedicines(res.data)) }, []);

    const addItem = (med) => {
        const existing = items.find(i => i.id === med.id);
        if (existing) {
            setItems(items.map(i => i.id === med.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, { ...med, quantity: 1, discount: 0, isManual: false }]);
        }
        setSearchTerm('');
    };

    const addManualItem = () => {
        if (!manualItem.name || !manualItem.mrp) return;
        setItems([...items, { id: `manual-${Date.now()}`, name: manualItem.name, mrp: manualItem.mrp, quantity: 1, discount: 0, isManual: true, saveToInventory: saveToInventory }]);
        setManualItem({ name: '', mrp: '' });
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const removeItem = (id) => {
        setItems(items.filter(i => i.id !== id));
    };

    const grandTotal = items.reduce((acc, item) => {
        const total = (item.quantity || 0) * (item.mrp || 0);
        const discount = item.discount || 0;
        return acc + (total * (1 - discount / 100));
    }, 0);

    const handleSubmitBill = async () => {
        const fullPhoneNumber = customer.countryCode + customer.localPhone;
        if (!customer.name || !fullPhoneNumber || items.length === 0) {
            alert('Please fill customer details and add items.');
            return;
        }
        try {
            const response = await api.post('/billing', { 
                customer: { name: customer.name, phone: fullPhoneNumber }, 
                items, 
                paymentMode 
            });
            setLastBill({ ...response.data, customer: { name: customer.name, phone: fullPhoneNumber }, items, grandTotal });
            setIsSuccessModalOpen(true);
        } catch (error) { 
            alert(`Error: ${error.response?.data?.error || 'Could not create bill.'}`); 
        }
    };
    
    const handleModalClose = () => {
        setIsSuccessModalOpen(false);
        onBillCreated();
    };

    const searchResults = searchTerm ? medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5) : [];

    return (
        <>
            <Modal isOpen={isSuccessModalOpen} onClose={handleModalClose} size="md">
                {lastBill && (
                    <div className="p-6 text-center">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">Bill Saved Successfully!</h2>
                        <p className="text-gray-600 mb-4">Show the QR code to the customer or send the bill via WhatsApp.</p>
                        <div className="p-4 bg-gray-100 rounded-lg inline-block">
                            <QRCodeSVG value={`http://localhost:5001/bill/view/${lastBill.invoiceId}`} size={200} />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Scan to view receipt</p>
                        <a href={createWhatsAppLink(lastBill)} target="_blank" rel="noopener noreferrer" className="mt-6 w-full bg-green-500 text-white hover:bg-green-600 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2">
                            <MessageSquare />
                            <span>Send on WhatsApp</span>
                        </a>
                    </div>
                )}
            </Modal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold mb-4">New Customer Bill</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="relative"><Input type="text" placeholder="Search for medicine..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            {searchResults.length > 0 && <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg">{searchResults.map(med => <div key={med.id} onClick={() => addItem(med)} className="p-2 hover:bg-blue-100 cursor-pointer">{med.name}</div>)}</div>}
                        </div>
                        <div>
                           <div className="flex gap-2">
                                <Input type="text" placeholder="Manual Item Name" value={manualItem.name} onChange={e => setManualItem({ ...manualItem, name: e.target.value })} />
                                <Input type="number" placeholder="MRP" value={manualItem.mrp} onChange={e => setManualItem({ ...manualItem, mrp: e.target.value })} className="w-24" />
                                <Button onClick={addManualItem} variant="secondary"><PlusCircle size={20} /></Button>
                            </div>
                             <div className="flex items-center space-x-2 mt-1">
                                <input type="checkbox" id="saveToInventory" checked={saveToInventory} onChange={e => setSaveToInventory(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                <label htmlFor="saveToInventory" className="text-sm text-gray-600">Add this manual item to main inventory</label>
                            </div>
                        </div>
                    </div>
                    <div className="flow-root">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">Medicine</th>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">Qty</th>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">MRP</th>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">Discount (%)</th>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">Reminder (Days)</th>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">Total</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td className="py-2 font-medium">{item.name}</td>
                                        <td><Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} className="w-16 p-1"/></td>
                                        <td><Input type="number" step="0.01" value={item.mrp} onChange={e => updateItem(item.id, 'mrp', parseFloat(e.target.value) || 0)} className="w-24 p-1"/></td>
                                        <td><Input type="number" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} className="w-16 p-1"/></td>
                                        <td>
                                            <Input 
                                                type="number" 
                                                placeholder="e.g., 10"
                                                value={item.reminder_days || ''} 
                                                onChange={e => updateItem(item.id, 'reminder_days', e.target.value)} 
                                                className="w-24 p-1"
                                            />
                                        </td>
                                        <td>₹{((item.quantity || 0) * (item.mrp || 0) * (1 - (item.discount || 0) / 100)).toFixed(2)}</td>
                                        <td><button onClick={() => removeItem(item.id)}><MinusCircle className="h-5 w-5 text-red-500"/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 self-start">
                    <h2 className="text-xl font-bold mb-4">Customer Details</h2>
                    <div className="space-y-4 mb-6">
                        <Input 
                            type="text" 
                            placeholder="Customer Name" 
                            value={customer.name} 
                            onChange={e => setCustomer({...customer, name: e.target.value})} 
                        />
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Customer Phone</label>
                            <div className="flex">
                                <select 
                                    value={customer.countryCode}
                                    onChange={e => setCustomer({...customer, countryCode: e.target.value})}
                                    className="bg-gray-100 border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0"
                                >
                                    <option value="91">🇮🇳 +91</option>
                                    <option value="1">🇺🇸 +1</option>
                                    <option value="44">🇬🇧 +44</option>
                                    <option value="971">🇦🇪 +971</option>
                                </select>
                                <Input 
                                    type="tel" 
                                    placeholder="Phone Number" 
                                    value={customer.localPhone} 
                                    onChange={e => setCustomer({...customer, localPhone: e.target.value})}
                                    className="rounded-l-none"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Payment Mode</h3>
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <input id="cash" type="radio" value="Cash" name="payment-mode" checked={paymentMode === 'Cash'} onChange={e => setPaymentMode(e.target.value)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                                <label htmlFor="cash" className="ml-2 block text-sm font-medium text-gray-700">Cash</label>
                            </div>
                            <div className="flex items-center">
                                <input id="online" type="radio" value="Online" name="payment-mode" checked={paymentMode === 'Online'} onChange={e => setPaymentMode(e.target.value)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                                <label htmlFor="online" className="ml-2 block text-sm font-medium text-gray-700">Online</label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-lg">
                        <div className="flex justify-between font-bold">
                            <span>Grand Total:</span><span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button onClick={handleSubmitBill} className="w-full mt-6 !py-3">Create Bill</Button>
                </div>
            </div>
        </>
    );
};

// --- UPGRADED: Alerts View Component with WhatsApp Reminder Button ---
const AlertsView = () => {
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReminders = useCallback(() => {
        api.get('/reminders')
           .then(res => setReminders(res.data))
           .finally(() => setIsLoading(false));
    }, []);

    useEffect(fetchReminders, [fetchReminders]);

    const handleDismiss = async (id) => {
        if (window.confirm('Are you sure you want to dismiss this reminder?')) {
            await api.put(`/reminders/${id}/dismiss`);
            fetchReminders();
        }
    };

    if (isLoading) return <p>Loading reminders...</p>;

    return (
        <>
            <h1 className="text-3xl font-bold mb-6">Medicine Reminders</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold">Customer</th>
                            <th className="p-3 font-semibold">Phone</th>
                            <th className="p-3 font-semibold">Medicine</th>
                            <th className="p-3 font-semibold">Reminder Date</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reminders.map(r => (
                            <tr key={r.id} className="border-t">
                                <td className="p-3 font-medium">{r.customer_name}</td>
                                <td className="p-3 text-gray-500">{r.customer_phone}</td>
                                <td className="p-3">{r.medicine_name}</td>
                                <td className="p-3 text-gray-500">{r.reminder_date}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        r.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        r.status === 'Sent' ? 'bg-green-100 text-green-800' : ''
                                    }`}>{r.status}</span>
                                </td>
                                <td className="p-3 text-right space-x-2">
                                    {/* --- NEW WHATSAPP BUTTON --- */}
                                    <a 
                                        href={createReminderWhatsAppLink(r)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-block p-2 text-gray-500 hover:text-green-600" 
                                        title="Send WhatsApp Reminder"
                                    >
                                        <MessageSquare size={18} />
                                    </a>

                                    <button onClick={() => handleDismiss(r.id)} className="p-2 text-gray-500 hover:text-red-600" title="Dismiss">
                                        <X size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const createWhatsAppLink = (bill) => {
    // Return an empty string if bill data is incomplete, preventing errors
    if (!bill || !bill.customer || !bill.customer.phone) {
        return '';
    }

    let message = `Hi ${bill.customer.name},\n*Thank you for your purchase from CurePharma !, \nSHOP AGAIN*\n\n*Invoice #${bill.invoiceId}*\n\n`;
    
    bill.items.forEach(item => {
        const itemTotal = item.quantity * item.mrp;
        message += `- ${item.name} (x${item.quantity}): ₹${itemTotal.toFixed(2)}\n`;
    });

    message += `\n*Grand Total: ₹${bill.grandTotal.toFixed(2)}*`;
    
    const encodedMessage = encodeURIComponent(message);

    // Clean the phone number to remove any non-digit characters like '+', spaces, or '-'
    const sanitizedPhone = bill.customer.phone.replace(/[^0-9]/g, '');
    
    // Note: The user must still enter the country code (e.g., 91) in the form
   return `https://web.whatsapp.com/send?phone=${sanitizedPhone}&text=${encodedMessage}`;
};

// --- NEW: Helper function for reminder messages ---
const createReminderWhatsAppLink = (reminder) => {
    // Construct the reminder message
    let message = `Hi ${reminder.customer_name}, this is a friendly reminder from CurePharma X.\n\n`;
    message += `It might be time to restock your medicine: *${reminder.medicine_name}*.\n\n`;
    message += `Thank you for choosing us for your health needs!`;
    
    const encodedMessage = encodeURIComponent(message);

    // Sanitize the phone number to remove any non-digit characters
    const sanitizedPhone = reminder.customer_phone.replace(/[^0-9]/g, '');
    return `https://web.whatsapp.com/send?phone=${sanitizedPhone}&text=${encodedMessage}`;
    
};

// --- DEFINITIVE --- Dashboard Component with Robust Loading ---
const Dashboard = ({ setActiveView }) => {
    const [stats, setStats] = useState(null);
    const [modalContent, setModalContent] = useState(null);

    useEffect(() => {
        api.get('/dashboard-stats').then(res => setStats(res.data));
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
        <motion.div whileHover={{ y: -5 }} onClick={onClick} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between ${onClick ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-50' : ''}`}>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                {/* This now shows a placeholder while loading */}
                <p className="text-3xl font-bold text-gray-800">{value ?? '...'}</p>
            </div>
            <div className={`p-3 rounded-full ${color}`}><Icon className="h-6 w-6 text-white" /></div>
        </motion.div>
    );

    const openModal = async (type) => {
        let title = '';
        let data = [];
        if (type === 'low-stock') {
            title = 'Low Stock Medicines (<10)';
            const res = await api.get('/medicines?filter=low_stock');
            data = res.data;
        } else if (type === 'expiring_soon') {
            title = 'Medicines Expiring in 60 Days';
            const res = await api.get('/medicines?filter=expiring_soon');
            data = res.data;
        } else if (type === 'expired') {
            title = 'Expired Medicines';
            const res = await api.get('/medicines?filter=expired');
            data = res.data;
        }
        setModalContent({ title, data, type });
    };

    return (
        <>
            <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)}>
                <div className="p-6 flex flex-col">
                    <h2 className="text-xl font-bold mb-4">{modalContent?.title}</h2>
                    <div className="overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white">
                                <tr>
                                    <th className="py-2">Name</th>
                                    <th className="py-2">Qty</th>
                                    <th className="py-2">Expiry Date</th>
                                    <th className="py-2">MRP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalContent?.data.map(med => (
                                    <tr key={med.id} className="border-t">
                                        <td className="py-2">{med.name}</td>
                                        <td className="py-2">{med.quantity}</td>
                                        <td className="py-2">{med.expiry_date}</td>
                                        <td className="py-2">₹{med.mrp?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* --- THIS IS THE KEY FIX --- */}
                {/* We now use optional chaining (?.) and provide a default value ('...') */}
                {/* This prevents the crash by gracefully handling the initial loading state. */}
                <StatCard title="Total Medicines" value={stats?.totalMedicines} icon={Package} color="bg-blue-500" />
                <StatCard title="Sales Today" value={`₹${stats?.salesToday?.toFixed(2) ?? '0.00'}`} icon={DollarSign} color="bg-green-500" />
                <StatCard title="Low Stock" value={stats?.lowStockCount} icon={AlertTriangle} color="bg-yellow-500" onClick={() => openModal('low-stock')} />
                <StatCard title="Expiring Soon (60d)" value={stats?.expiringSoonCount} icon={History} color="bg-indigo-500" onClick={() => openModal('expiring_soon')} />
                <StatCard title="Shortages" value={stats?.shortageCount} icon={ClipboardX} color="bg-orange-500" onClick={() => setActiveView('shortages')} />    
            </div>
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Sales (Last 30 Days)</h2>
                {/* This also now waits for data before trying to render the chart */}
                {stats ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.salesChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }} />
                            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p>Loading chart data...</p>
                )}
            </div>
        </>
    );
};


const CustomerHistoryView = () => {
    const [query, setQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [history, setHistory] = useState([]);
    const search = async () => {
        if (query.length < 2) return;
        const res = await api.get(`/customers/search?q=${query}`);
        setCustomers(res.data);
    };
    const viewHistory = async (customer) => {
        setSelectedCustomer(customer);
        const res = await api.get(`/customers/history/${customer.phone}`);
        setHistory(res.data);
        setCustomers([]);
    };
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Customer History</h1>
            <div className="flex gap-2 mb-4">
                <Input type="text" placeholder="Search by name or phone..." value={query} onChange={e => setQuery(e.target.value)} className="max-w-md"/>
                <Button onClick={search}><Search size={18}/><span>Search</span></Button>
            </div>
            {customers.length > 0 && <div className="bg-white p-2 rounded-lg border shadow-sm max-w-md">{customers.map(c => <div key={c.phone} onClick={() => viewHistory(c)} className="p-2 hover:bg-blue-100 cursor-pointer rounded-md">{c.name} - {c.phone}</div>)}</div>}
            {selectedCustomer && (
                <div className="mt-6">
                    <h2 className="text-2xl font-bold">History for {selectedCustomer.name}</h2>
                    <div className="space-y-4 mt-4">
                        {history.map(inv => (
                            <div key={inv.id} className="bg-white\ p-4 rounded-lg border shadow-sm">
                                <div className="flex justify-between font-semibold"><span>Invoice #{inv.id} - {inv.date}</span><span>Total: ₹{inv.total.toFixed(2)}</span></div>
                                <ul className="list-disc list-inside text-sm text-gray-600 mt-2">{inv.items.map((item, i) => <li key={i}>{item.name} (x{item.qty})</li>)}</ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
const PurchaseInvoiceView = () => {
    const [invoices, setInvoices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fetchInvoices = useCallback(() => { api.get('/purchase-invoices').then(res => setInvoices(res.data)) }, []);
    useEffect(fetchInvoices, [fetchInvoices]);
    const onSave = () => { fetchInvoices(); setIsModalOpen(false); };
    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg"><PurchaseInvoiceForm onSave={onSave} onCancel={() => setIsModalOpen(false)} /></Modal>
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">Agency Invoices</h1><Button onClick={() => setIsModalOpen(true)}><PlusCircle size={20} /><span>Add Invoice</span></Button></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-left">
                    <thead><tr><th className="py-2">Agency</th><th>Invoice #</th><th>Date</th><th className="text-right">Amount</th></tr></thead>
                    <tbody>{invoices.map(inv => <tr key={inv.id} className="border-t">
                        <td className="py-2">{inv.agency_name}</td><td>{inv.invoice_number}</td><td>{inv.invoice_date}</td><td className="text-right">₹{inv.amount.toFixed(2)}</td>
                    </tr>)}</tbody>
                </table>
            </div>
        </>
    );
};


// --- UPDATED --- Customer Bills View with Search and Delete ---
const CustomerBillsView = () => {
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // State for the search bar

    // This function now includes the search term in the API call
    const fetchBills = useCallback(() => {
        api.get(`/customer-bills?q=${searchTerm}`).then(res => setBills(res.data));
    }, [searchTerm]); // It re-runs whenever the search term changes

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchBills();
        }, 300); // Debounce search to avoid too many API calls
        return () => clearTimeout(handler);
    }, [searchTerm, fetchBills]);

    const viewBillDetails = (bill) => {
        setSelectedBill(bill);
        setIsModalOpen(true);
    };

    // New function to handle the delete action
    const handleDelete = async (billId) => {
        if (window.confirm('Are you sure you want to permanently delete this bill?')) {
            try {
                await api.delete(`/customer-bills/${billId}`);
                fetchBills(); // Refresh the list after deleting
            } catch (error) {
                alert('Failed to delete the bill.');
            }
        }
    };

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="3xl">
                {selectedBill && (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-2">Invoice #{selectedBill.id}</h2>
                        <p className="text-gray-600"><strong>Customer:</strong> {selectedBill.customer_name} ({selectedBill.customer_phone})</p>
                        <p className="text-gray-600 mb-4"><strong>Date:</strong> {selectedBill.bill_date}</p>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 font-semibold">Item</th>
                                    <th className="p-2 font-semibold">Qty</th>
                                    <th className="p-2 font-semibold">MRP</th>
                                    <th className="p-2 font-semibold">Discount</th>
                                    <th className="p-2 font-semibold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>{selectedBill.items.map((item, index) => (
                                <tr key={index} className="border-t">
                                    <td className="p-2">{item.medicine_name}</td>
                                    <td className="p-2">{item.quantity}</td>
                                    <td className="p-2">₹{item.mrp.toFixed(2)}</td>
                                    <td className="p-2">{item.discount_percent}%</td>
                                    <td className="p-2 text-right">₹{item.total_price.toFixed(2)}</td>
                                </tr>
                            ))}</tbody>
                            <tfoot className="font-bold"><tr className="border-t-2"><td colSpan="4" className="p-2 text-right">Grand Total</td><td className="p-2 text-right">₹{selectedBill.grand_total.toFixed(2)}</td></tr></tfoot>
                        </table>
                    </div>
                )}
            </Modal>

            <h1 className="text-3xl font-bold mb-6">Customer Bills</h1>
            
            {/* --- NEW: Search Bar --- */}
            <div className="mb-6 relative">
                <Input
                    type="text"
                    placeholder="Search by customer name or phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold">Invoice #</th>
                            <th className="p-3 font-semibold">Customer</th>
                            <th className="p-3 font-semibold">Phone</th>
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold text-right">Amount</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bills.map(bill => (
                            <tr key={bill.id} className="border-t">
                                <td className="p-3 font-medium">{bill.id}</td>
                                <td className="p-3">{bill.customer_name}</td>
                                <td className="p-3 text-gray-500">{bill.customer_phone}</td>
                                <td className="p-3 text-gray-500">{bill.bill_date}</td>
                                <td className="p-3 text-right font-semibold">₹{bill.grand_total.toFixed(2)}</td>
                                <td className="p-3 text-right space-x-2">
                                    <Button variant="secondary" onClick={() => viewBillDetails(bill)} className="!py-1 !px-3">View</Button>
                                    {/* --- NEW: Delete Button --- */}
                                    <button onClick={() => handleDelete(bill.id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete Bill">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};


// --- NEW --- Advance Form Component (for the Modal) ---
const AdvanceForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({ customer_name: '', customer_phone: '', amount: '', notes: '' });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/advances', formData);
        onSave();
    };
    return (
        <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-xl font-bold mb-6">New Advance Payment</h2>
            <div className="space-y-4">
                <Input name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Customer Name" required />
                <Input name="customer_phone" value={formData.customer_phone} onChange={handleChange} placeholder="Customer Phone" required />
                <Input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Amount (₹)" required />
                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes (e.g., medicine name, special order details)" className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"></textarea>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Advance</Button>
            </div>
        </form>
    );
};

// --- NEW --- Advances View Component ---
const AdvancesView = () => {
    const [advances, setAdvances] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAdvances = useCallback(() => {
        api.get('/advances').then(res => setAdvances(res.data));
    }, []);

    useEffect(fetchAdvances, [fetchAdvances]);

    const handleDelivered = async (advanceId) => {
        if (window.confirm('Mark this advance as delivered and remove it from the list?')) {
            await api.put(`/advances/${advanceId}/deliver`);
            fetchAdvances(); // Refresh the list
        }
    };

    const onSave = () => {
        fetchAdvances();
        setIsModalOpen(false);
    };

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
                <AdvanceForm onSave={onSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Pending Advances</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle size={20} />
                    <span>New Advance</span>
                </Button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold">Customer</th>
                            <th className="p-3 font-semibold">Phone</th>
                            <th className="p-3 font-semibold">Notes</th>
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold text-right">Amount</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {advances.map(adv => (
                            <tr key={adv.id} className="border-t">
                                <td className="p-3 font-medium">{adv.customer_name}</td>
                                <td className="p-3 text-gray-500">{adv.customer_phone}</td>
                                <td className="p-3 text-gray-500">{adv.notes}</td>
                                <td className="p-3 text-gray-500">{adv.created_date}</td>
                                <td className="p-3 text-right font-semibold">₹{adv.amount.toFixed(2)}</td>
                                <td className="p-3 text-right">
                                    <Button onClick={() => handleDelivered(adv.id)} className="!py-1 !px-3">Delivered</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const ShortageForm = ({ onSave, onCancel }) => {
    // --- THIS IS THE MISSING LOGIC ---
    const [formData, setFormData] = useState({ 
        medicine_name: '', 
        customer_name: '', 
        customer_phone: '' 
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    // --- END OF MISSING LOGIC ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/shortages', formData);
        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-xl font-bold mb-6">Add New Shortage</h2>
            <div className="space-y-4">
                {/* This JSX now correctly uses 'formData' and 'handleChange' */}
                <Input name="medicine_name" value={formData.medicine_name} onChange={handleChange} placeholder="Medicine Name" required />
                <Input name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Customer Name (Optional)" />
                <Input name="customer_phone" value={formData.customer_phone} onChange={handleChange} placeholder="Customer Phone (Optional)" />
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Shortage</Button>
            </div>
        </form>
    );
};

// --- NEW --- Shortages View Component ---
const ShortagesView = () => {
    const [shortages, setShortages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchShortages = useCallback(() => {
        api.get('/shortages').then(res => setShortages(res.data));
    }, []);

    useEffect(fetchShortages, [fetchShortages]);

    const handleResolved = async (shortageId) => {
        if (window.confirm('Mark this shortage as resolved and remove it from the list?')) {
            await api.put(`/shortages/${shortageId}/resolve`);
            fetchShortages(); // Refresh the list
        }
    };

    const onSave = () => {
        fetchShortages();
        setIsModalOpen(false);
    };

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
                <ShortageForm onSave={onSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Pending Shortages</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle size={20} />
                    <span>New Shortage</span>
                </Button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold">Medicine Name</th>
                            <th className="p-3 font-semibold">Date Requested</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                            <th className="p-3 font-semibold">Customer Name</th> {/* <-- ADD THIS */}
                            <th className="p-3 font-semibold">Customer Phone</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {shortages.map(s => (
                            <tr key={s.id} className="border-t">
                                <td className="p-3 font-medium">{s.medicine_name}</td>
                                <td className="p-3 text-gray-500">{s.requested_date}</td>
                                <td className="p-3 text-right">
                                <td className="p-3 text-gray-500">{s.customer_name}</td> {/* <-- ADD THIS */}
                                <td className="p-3 text-gray-500">{s.customer_phone}</td>    
                                    <Button onClick={() => handleResolved(s.id)} className="!py-1 !px-3">Resolved</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const PurchaseInvoiceForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({ agency_name: '', invoice_number: '', invoice_date: '', amount: '' });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => { e.preventDefault(); await api.post('/purchase-invoices', formData); onSave(); };
    return (
        <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-xl font-bold mb-4">Add Agency Invoice</h2>
            <div className="space-y-4">
                <Input name="agency_name" value={formData.agency_name} onChange={handleChange} placeholder="Agency Name" required />
                <Input name="invoice_number" value={formData.invoice_number} onChange={handleChange} placeholder="Invoice Number" />
                <Input name="invoice_date" type="date" value={formData.invoice_date} onChange={handleChange} required />
                <Input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} placeholder="Amount" required />
            </div>
            <div className="flex justify-end space-x-2 mt-6"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};
