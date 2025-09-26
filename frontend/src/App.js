import React, { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // --- NEW: Import QR Code component
import { MessageSquare } from 'lucide-react'; // --- NEW: Import Icons
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import curePharmaLogo from './assets/logo.png';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Pill, LayoutDashboard, Package, LogOut, AlertTriangle, PlusCircle,Edit, X, CalendarDays,CheckCircle2, Search, FileText, ClipboardX, Download, TrendingUp, Store ,Receipt, History, MinusCircle, DollarSign, Upload, Building, ClipboardList, Wallet, ArrowLeft,BellRing, HeartPulse, Baby, ShieldCheck, Bone, Sun, Wind,Menu, CreditCard, Star, ShoppingBag, Trash2 } from 'lucide-react';

// --- Axios Configuration ---
const api = axios.create({ baseURL: '/api', withCredentials: true });

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

        <GlobalStyles />

            <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} size="sm">
                <AuthScreen onLoginSuccess={handleLoginSuccess} />
            </Modal>

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
    const [shippingAddress, setShippingAddress] = useState(null);
    const [pendingInvoiceId, setPendingInvoiceId] = useState(null);
    const [cart, setCart] = useState(() => {
        
        try {
            const savedCart = localStorage.getItem('curepharma_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) { return []; }
    });
    const [activePage, setActivePage] = useState('store'); 
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // --- CORRECTED DATA FETCHING LOGIC ---
    useEffect(() => {
        setIsLoading(true);
        let apiUrl = '/medicines?'; // Start with the base URL

        // If a category is selected, use it for the API call.
        // Otherwise, if a search term is present, use that.
        if (selectedCategory) {
            apiUrl += `category=${encodeURIComponent(selectedCategory)}`;
        } else if (searchTerm) {
            apiUrl += `q=${encodeURIComponent(searchTerm)}`;
        }

        // Use a timer to prevent too many API calls while typing
        const timer = setTimeout(() => {
            api.get(apiUrl)
                .then(res => setMedicines(res.data))
                .finally(() => setIsLoading(false));
        }, 300);
        
        return () => clearTimeout(timer);
    }, [searchTerm, selectedCategory]); // This now runs when EITHER searchTerm OR selectedCategory changes

    useEffect(() => {
        localStorage.setItem('curepharma_cart', JSON.stringify(cart));
    }, [cart]);

     const handleProductSelect = (medicineId) => {
        setIsDetailLoading(true);
        setActivePage('productDetail'); // Switch the view
        api.get(`/medicines/${medicineId}`)
            .then(res => {
                setSelectedMedicine(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch medicine details:", err);
                // If it fails, go back to the store to avoid a blank page
                setActivePage('store');
            })
            .finally(() => {
                setIsDetailLoading(false);
            });
    };

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
    
    const handleCategorySelect = (category) => {
        setSearchTerm(''); // Clear any search term
        setSelectedCategory(category);
    };

    const handleProceedToCheckout = () => {
        if (user) {
            // If the user is logged in, go to the checkout page as normal.
            setActivePage('address');
        } else {
            // If the user is a guest, call the onLoginRequest function
            // which opens the login modal.
            onLoginRequest();
        }
    };

    // --- RENDER LOGIC ---
    const renderContent = () => {
        switch (activePage) {
            // Inside the renderContent function in CustomerStore
case 'cart': 
    return <CartView 
                cart={cart} 
                updateCartQuantity={updateCartQuantity} 
                cartTotal={cartTotal} 
                onCheckout={handleProceedToCheckout} // <-- CORRECT WAY
                onContinueShopping={() => setActivePage('store')} 
           />;
           
           case 'address':
            return <AddressView onAddressConfirm={(address) => {
                setShippingAddress(address);
                setActivePage('payment'); // After confirming address, go to payment
            }} />;

 case 'payment':
                return <PaymentView
                    cartTotal={cartTotal}
                    onPaymentSelect={(method) => {
                        // For now, we just log the method and proceed.
                        // Later, you'll add UPI logic here.
                        console.log("Selected payment method:", method);
                        setActivePage('checkout');
                    }}
                />;

        case 'checkout':
    // --- THIS IS THE FIX ---
    // We add a check here. Only render the CheckoutView if the cart
    // actually has items in it. Otherwise, show a loading message.
    return cart.length > 0 ? (
        <CheckoutView 
            cart={cart} 
            cartTotal={cartTotal} 
            user={user}
            address={shippingAddress}
            onOrderPlaced={(invoiceId) => { 
                setCart([]);
                setPendingInvoiceId(invoiceId);
                setActivePage('order-pending');
            }} 
        />
    ) : (
        <div className="text-center p-8">
            <p className="text-gray-500">Loading your cart...</p>
        </div>
    );

                       case 'order-pending':
                // Pass the stored ID as a prop
                return <OrderPendingView invoiceId={pendingInvoiceId}
                 onBackToStore={() => setActivePage('store')}
                onViewOrders={() => setActivePage('orderHistory')} />;
                
            case 'orderHistory': return <OrderHistoryView onBackToStore={() => setActivePage('store')} />;
             case 'productDetail':
                if (isDetailLoading || !selectedMedicine) {
                    return <div className="text-center p-12">Loading medicine details...</div>;
                }
                return <ProductDetailView 
                            medicine={selectedMedicine} 
                            onAddToCart={addToCart} 
                            onBackToStore={() => setActivePage('store')} 
                       />;
            default: return <StoreView 
                medicines={medicines} 
                onAddToCart={addToCart} 
                isLoading={isLoading} 
                onCategorySelect={handleCategorySelect} 
                selectedCategory={selectedCategory} 
                clearCategory={() => setSelectedCategory(null)} 
                onProductSelect={handleProductSelect} 
            />;
        }
    };

    return (
        <div className="md:pl-20 bg-slate-50 min-h-screen font-sans">
            <header className="bg-white sticky top-0 z-20 shadow-md">
                <div className="bg-slate-100 py-2 border-b">
                    <div className="container mx-auto px-6 flex justify-between items-center text-sm text-slate-600">
                        <span>Your Trusted Online Pharmacy</span>
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span>Welcome, {user.name}</span>
                                <button onClick={onLogout} className="text-slate-500 hover:text-red-600 transition-colors font-semibold">Logout</button>
                            </div>
                        ) : (
                            <button onClick={onLoginRequest} className="font-semibold text-blue-600 hover:underline">Login / Sign Up</button>
                        )}
                    </div>
                </div>
                {/* --- Stretched Vertical Branding (Now a Button) --- */}
            <button 
                onClick={() => { setActivePage('store'); setSelectedCategory(null); setSearchTerm(''); }}
                className="fixed left-0 top-0 h-full w-20 hidden md:flex flex-col items-center justify-center z-30 group"
            >
                <span 
                    className="text-6xl font-black text-gray-200 group-hover:text-blue-500 transition-colors duration-500 cursor-pointer" 
                    style={{ 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)',
                        letterSpacing: '0.3em',
                        paddingTop: '2rem',
                        paddingBottom: '2rem'
                    }}
                >
                    CUREPHARMA
                </span>
            </button>

                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={() => { setActivePage('store'); setSelectedCategory(null); setSearchTerm(''); }} className="flex items-center space-x-3">
    <img src={curePharmaLogo} alt="CurePharma Logo" className="h-10" />
    <span className="text-3xl font-bold">
   <span className="text-red-600">Cure</span><span className="text-blue-600">Pharma</span>
   </span>
   </button>
                    <div className="hidden lg:flex flex-grow max-w-xl mx-8 relative">
                        <Input type="text" placeholder="Search for Medicines, Health Products..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setSelectedCategory(null); setActivePage('store'); }} className="w-full !p-3 !pl-12 !bg-slate-100 !shadow-inner !rounded-full"/>
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setActivePage('store')} 
                className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
                <Store size={20} /> 
                <span className="hidden md:block font-semibold">Home</span>
            </button>
                            <button onClick={() => setActivePage('orderHistory')} className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors">
                                <History size={20} />
                                <span className="hidden md:block font-semibold">My Orders</span>
                            </button>
                        
                        <button onClick={() => setActivePage('cart')} className="relative flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors">
                            <Package size={20} />
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

const AddressView = ({ onAddressConfirm }) => {
    // --- STATE MANAGEMENT ---
    const [map, setMap] = useState(null);
    const [markerPosition, setMarkerPosition] = useState({ lat: 17.3850, lng: 78.4867 }); // Hyderabad default
    const [address, setAddress] = useState('');
    const [pincode, setPincode] = useState('');
    const [autocomplete, setAutocomplete] = useState(null);
    const [geocoder, setGeocoder] = useState(null);
    const [landmark, setLandmark] = useState('');
    const [receiverInfo, setReceiverInfo] = useState('');
    const [addressType, setAddressType] = useState('Home');
    const [pincodeStatus, setPincodeStatus] = useState({ type: '', message: '' });

    // --- CONSTANTS & CONFIG ---
    const serviceablePincodes = useMemo(() => ['500008', '500034', '500033', '500096', '500019', '500036', '500002', '500024', '500086', '500028', '500048','500046'], []);
    const hyderabadBounds = useMemo(() => ({ north: 17.5, south: 17.2, east: 78.6, west: 78.3 }), []);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyB_qkpy4ncFzWtiZEZVocG_nSTUUoThdaE", // PASTE YOUR API KEY HERE
        libraries: ['places', 'geocoding']
    });

    const checkPincode = useCallback((code) => {
        if (!code) {
            setPincodeStatus({ type: '', message: '' });
            return;
        }
        if (serviceablePincodes.includes(code)) {
            setPincodeStatus({ type: 'success', message: 'Congrats! We deliver here.' });
        } else {
            setPincodeStatus({ type: 'error', message: 'Sorry, we do not currently deliver to this pincode.' });
        }
    }, [serviceablePincodes]);
    
    // --- LOGIC HOOKS ---
    useEffect(() => {
        if (isLoaded && map) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setMarkerPosition(currentLocation);
                    map.panTo(currentLocation);
                }, (error) => {
                    console.error("Error getting user location:", error);
                });
            }
        }
    }, [isLoaded, map]);

    useEffect(() => {
        if (isLoaded && markerPosition && geocoder) {
            geocoder.geocode({ 'location': markerPosition }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setAddress(results[0].formatted_address);
                    const pincodeComponent = results[0].address_components.find(c => c.types.includes("postal_code"));
                    const foundPincode = pincodeComponent ? pincodeComponent.long_name : '';
                    setPincode(foundPincode);
                    checkPincode(foundPincode);
                }
            });
        }
    }, [markerPosition, isLoaded, geocoder, checkPincode]);

    const containerStyle = useMemo(() => ({ width: '100%', height: '200px', borderRadius: '0.5rem', position: 'relative' }), []);

    const onLoad = useCallback(map => {
        setGeocoder(new window.google.maps.Geocoder());
        setMap(map);
    }, []);

    const onUnmount = useCallback(map => setMap(null), []);

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setMarkerPosition({ lat, lng });
                map.panTo({ lat, lng });
            }
        }
    };

    const handleConfirm = () => {
        if (!address || !pincode) {
            alert("Please select a valid address.");
            return;
        }
        if (pincodeStatus.type === 'error') {
            alert(pincodeStatus.message);
            return;
        }
        onAddressConfirm({ address, pincode, landmark, receiverInfo, addressType, ...markerPosition });
    };

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl max-w-lg mx-auto">
            <h1 className="text-xl md:text-2xl font-bold mb-4">Enter Your Delivery Address</h1>

            <div style={containerStyle}>
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
                    center={markerPosition}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, restriction: { latLngBounds: hyderabadBounds, strictBounds: false } }}
                >
                    <Marker position={markerPosition} draggable={true} onDragEnd={(e) => setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() })} />
                </GoogleMap>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                    Drag the pin to refine location
                </div>
            </div>

            <div className="space-y-3 mt-4">
                <Autocomplete onLoad={(ac) => setAutocomplete(ac)} onPlaceChanged={onPlaceChanged} options={{ bounds: hyderabadBounds, componentRestrictions: { country: "in" }, strictBounds: false }}>
                    <Input type="text" placeholder="Search for your address in Hyderabad" value={address} onChange={(e) => setAddress(e.target.value)} />
                </Autocomplete>
                <Input type="text" placeholder="Landmark, Building Name, Flat No." value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                <div className="flex items-center gap-3">
                    <Input type="text" placeholder="Pincode" value={pincode} readOnly className="flex-grow" />
                </div>
                {pincodeStatus.message && (
                    <p className={`text-sm font-semibold -mt-2 ${pincodeStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{pincodeStatus.message}</p>
                )}
                <Input type="text" placeholder="Receiver's Name & Phone Number" value={receiverInfo} onChange={(e) => setReceiverInfo(e.target.value)} />
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-600">Save as:</p>
                    {['Home', 'Work', 'Other'].map(type => (
                        <button key={type} onClick={() => setAddressType(type)} className={`px-3 py-1.5 text-sm rounded-full transition-colors ${addressType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <Button onClick={handleConfirm} className="w-full mt-6 !py-3 !text-base md:!text-lg">
                Proceed to Payment
            </Button>
        </div>
    );
};


const PaymentView = ({ cartTotal, onPaymentSelect }) => {
    const [selectedMethod, setSelectedMethod] = useState('COD');

    const paymentOptions = [
        { id: 'COD', title: 'Cash on Delivery', description: 'Pay with cash at your doorstep.', icon: Wallet },
        { id: 'UPI', title: 'UPI', description: 'Pay with any UPI app.', icon: CreditCard },
        { id: 'Credits', title: 'CurePharma Credits', description: 'Feature coming soon.', icon: Star, disabled: true }
    ];

    const handleProceed = () => {
        onPaymentSelect(selectedMethod);
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-xl max-w-lg mx-auto">
            <h1 className="text-xl md:text-2xl font-bold mb-4">Choose a Payment Method</h1>

            <div className="space-y-3">
                {paymentOptions.map(option => (
                    <button
                        key={option.id}
                        onClick={() => !option.disabled && setSelectedMethod(option.id)}
                        disabled={option.disabled}
                        className={`w-full flex items-center text-left p-4 rounded-lg border-2 transition-all ${
                            selectedMethod === option.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                        } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <option.icon className={`h-6 w-6 mr-4 ${selectedMethod === option.id ? 'text-blue-600' : 'text-gray-500'}`} />
                        <div>
                            <p className="font-semibold text-gray-800">{option.title}</p>
                            <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                    </button>
                ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-dashed flex justify-between items-center">
                <p className="text-gray-600">Amount to Pay:</p>
                <p className="text-2xl font-bold text-gray-900">₹{cartTotal.toFixed(2)}</p>
            </div>

            <Button onClick={handleProceed} className="w-full mt-4 !py-3 !text-base md:!text-lg">
                {selectedMethod === 'COD' ? 'Confirm Order' : `Pay ₹${cartTotal.toFixed(2)}`}
            </Button>
        </div>
    );
};

const OrderPendingView = ({ invoiceId, onBackToStore, onViewOrders }) => {
    const [status, setStatus] = useState('Pending');

   
    // This polling effect now waits for the invoiceId to be set.
    useEffect(() => {
        if (!invoiceId) return; // This check is still important.

        const interval = setInterval(() => {
            api.get(`/order-status/${invoiceId}`)
                .then(res => {
                    const newStatus = res.data.status;
                    if (newStatus !== 'Pending') {
                        setStatus(newStatus);
                        clearInterval(interval);
                    }
                })
                .catch(err => {
                    console.error("Error checking order status:", err);
                    clearInterval(interval);
                });
        }, 5000);

        return () => clearInterval(interval);
    }, [invoiceId]); // This effect now runs whenever the invoiceId state changes.

    // --- NEW: This is the view for an approved order ---
   if (status === 'Approved') {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Order Confirmed!</h1>
                <p className="text-gray-600">Your order has been approved and is being prepared for delivery.</p>
                <Button onClick={onViewOrders} className="mt-6">
                    View My Orders
                </Button>
            </div>
        );
    }

    if (status === 'Rejected') {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto text-center">
                <div className="text-7xl mb-6">😞</div>
                <h1 className="text-2xl font-bold mb-4 text-red-600">Sorry, your order can't be placed.</h1>
                <p className="text-gray-600">There was an issue processing your order. Please contact the pharmacy for more details.</p>
                <Button onClick={onBackToStore} className="mt-6">
                    <ArrowLeft size={20} />
                    <span>Back to Store</span>
                </Button>
            </div>
        );
    }
    
    // Default "Pending" view
    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Please Wait</h1>
            <p className="text-gray-600">Your order is being confirmed by the pharmacy. This page will update automatically.</p>
            <Button onClick={onBackToStore} variant="secondary" className="mt-6">
                Go Back to Store
            </Button>
        </div>
    );
};

// NEW: The page for the admin to view and approve online orders
const OnlineOrdersView = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

     // ADD THIS FUNCTION for rejecting orders
    const handleReject = async (orderId) => {
        if (!window.confirm('Are you sure you want to reject this order?')) return;
        try {
            await api.put(`/orders/${orderId}/reject`);
            alert('Order rejected!');
            fetchOrders(); // Refresh the list
        } catch (error) {
            alert(`Failed to reject order: ${error.response?.data?.error || 'Server error'}`);
        }
    };

    // ADD THIS FUNCTION for deleting orders
    const handleDelete = async (orderId) => {
        if (!window.confirm('Are you sure you want to permanently delete this order?')) return;
        try {
            await api.delete(`/orders/${orderId}/delete`);
            alert('Order deleted successfully!');
            fetchOrders(); // Refresh the list
        } catch (error) {
            alert(`Failed to delete order: ${error.response?.data?.error || 'Server error'}`);
        }
    };

    const fetchOrders = useCallback(() => {
        setIsLoading(true);
        api.get('/online-orders')
           .then(res => setOrders(res.data))
           .finally(() => setIsLoading(false));
    }, []);

    useEffect(fetchOrders, [fetchOrders]);

    const handleApprove = async (orderId) => {
        if (!window.confirm('Are you sure you want to approve this order? This will deduct stock from inventory.')) return;
        try {
            await api.put(`/orders/${orderId}/approve`);
            alert('Order approved successfully!');
            fetchOrders(); // Refresh the list
        } catch (error) {
            alert(`Failed to approve order: ${error.response?.data?.error || 'Server error'}`);
        }
    };

    if (isLoading) return <p>Loading online orders...</p>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Online Orders</h1>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border space-y-4">
                {orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pending online orders found.</p>
                ) : orders.map(order => (
                    <div key={order.id} className="border rounded-lg p-4 transition-shadow hover:shadow-md">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <div>
                                <p className="font-bold">{order.customer_name} - ₹{order.grand_total.toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{order.bill_date}</p>
                            </div>
                            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>{order.status}</span>
                                {order.status === 'Pending' && ( <>
                                    <Button onClick={() => handleApprove(order.id)} className="!py-1 !px-3">Approve</Button>
                                     <Button onClick={() => handleReject(order.id)} variant="secondary" className="!py-1 !px-3 !bg-orange-100 !text-orange-700 hover:!bg-orange-200">
                Reject
            </Button>
        </>                                
                                )}
                                 <Button onClick={() => handleDelete(order.id)} variant="secondary" className="!py-1 !px-2 !bg-red-100 !text-red-700 hover:!bg-red-200">
        <Trash2 size={16} />
    </Button>
                            </div>
                        </div>
                        <div className="mt-3 border-t pt-3">
                             <p className="text-sm font-semibold mb-1">Items:</p>
                             <ul className="list-disc list-inside text-sm text-gray-600">
                                {order.items.map((item, index) => <li key={index}>{item.medicine_name} (x{item.quantity})</li>)}
                             </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS for the new design ---

const StoreView = ({ medicines, onAddToCart, isLoading, onCategorySelect, selectedCategory, clearCategory, onProductSelect }) => (
    <>
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            <motion.div 
                initial={{ opacity: 0, x: -50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.5 }} 
                className="lg:col-span-3 bg-gradient-to-br from-red-600 to-red-800 p-10 rounded-3xl shadow-2xl text-white"
            >
                <h1 className="text-5xl font-black tracking-tight">UP TO 20% OFF</h1>
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

        <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <CategoryCard icon={Pill} label="General" onSelect={onCategorySelect} />
                <CategoryCard icon={HeartPulse} label="Cardiac Care" onSelect={onCategorySelect} />
                <CategoryCard icon={Baby} label="Baby Care" onSelect={onCategorySelect} />
                <CategoryCard icon={ShieldCheck} label="Immunity" onSelect={onCategorySelect} />
                <CategoryCard icon={Bone} label="Ortho Care" onSelect={onCategorySelect} />
                <CategoryCard icon={Sun} label="Skin Care" onSelect={onCategorySelect} />
                <CategoryCard icon={Wind} label="Respiratory" onSelect={onCategorySelect} />
            </div>
        </div>

        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
                {selectedCategory ? `Results for "${selectedCategory}"` : 'Featured Products'}
            </h2>
            {selectedCategory && (
                <Button variant="secondary" onClick={clearCategory}>Clear Filter</Button>
            )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : medicines.length > 0 ? (
                medicines.map(med => (
                    // This now correctly passes the onProductSelect function
                    <ProductCard key={med.id} med={med} onAddToCart={onAddToCart} onProductSelect={onProductSelect} />
                ))
            ) : (
                <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg">
                    <ClipboardX size={56} className="mx-auto text-gray-300 mb-4"/>
                    <h2 className="text-2xl font-semibold text-gray-700">No Products Found</h2>
                    {selectedCategory && (
                        <p className="text-gray-500 mt-2">
                            There are currently no products listed in the "{selectedCategory}" category.
                        </p>
                    )}
                </div>
            )}
        </div>
    </>
);


const ProductDetailView = ({ medicine, onAddToCart, onBackToStore }) => (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Image Placeholder */}
            <div className="bg-gray-100 rounded-xl h-80 flex items-center justify-center">
                <Package size={80} className="text-gray-300" />
            </div>

            {/* Medicine Details */}
            <div>
                <h1 className="text-4xl font-bold text-gray-900">{medicine.name}</h1>
                {medicine.formula && (
                    <p className="text-lg text-gray-500 mt-2">
                        <span className="font-semibold">Formula:</span> {medicine.formula}
                    </p>
                )}
                
                <p className="text-5xl font-extrabold text-blue-600 my-6">
                    ₹{medicine.mrp?.toFixed(2)}
                </p>

                <div className="text-sm text-gray-600 space-y-2">
                    <p>
                        <span className="font-semibold">Category:</span> {medicine.category || 'N/A'}
                    </p>
                    <p>
                         <span className="font-semibold">Stock Status:</span> 
                         {medicine.quantity > 0 ? 
                            <span className="text-green-600 font-semibold"> Available</span> : 
                            <span className="text-red-600 font-semibold"> Out of Stock</span>
                         }
                    </p>
                </div>

                <div className="mt-8 flex items-center space-x-4">
                    <Button 
                        onClick={() => onAddToCart(medicine)} 
                        disabled={medicine.quantity === 0}
                        className="!py-4 !px-8 !text-lg flex-grow"
                    >
                        <PlusCircle size={22} />
                        <span>Add to Cart</span>
                    </Button>
                    <Button onClick={onBackToStore} variant="secondary" className="!py-4 !px-6">
                        <ArrowLeft size={22} />
                    </Button>
                </div>
            </div>
        </div>
    </div>
);

const CategoryCard = ({ icon: Icon, label, onSelect }) => (
    <motion.div 
        whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} 
        className="bg-white p-4 rounded-xl shadow-lg text-center cursor-pointer flex flex-col items-center justify-center h-32"
        onClick={() => onSelect(label)}
    >
        <Icon className="h-12 w-12 text-blue-500 mb-2" />
        <span className="font-semibold text-gray-700">{label}</span>
    </motion.div>
);

const ProductCard = ({ med, onAddToCart, onProductSelect }) => (
    <motion.div 
        className="bg-white rounded-2xl shadow-lg overflow-hidden group flex flex-col" 
        whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
    >
        {/* The main card is now a button for navigation */}
        <button onClick={() => onProductSelect(med.id)} className="text-left w-full h-full flex flex-col">
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                <Package size={48} className="text-gray-300 group-hover:text-blue-500 transition-colors duration-300" />
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 truncate">{med.name}</h3>
                <p className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 text-transparent bg-clip-text mt-2">
                    ₹{med.mrp?.toFixed(2)}
                </p>
                <div className="mt-auto pt-4"> {/* Spacer */} </div>
            </div>
        </button>
        {/* The Add to Cart button is separate to prevent navigation */}
        <div className="p-6 pt-0">
             <Button 
                onClick={(e) => {
                    e.stopPropagation(); // Prevents the card's click event from firing
                    onAddToCart(med);
                }} 
                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 !font-bold !py-3 !rounded-xl"
            >
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

const CheckoutView = ({ cart, cartTotal, user, onOrderPlaced, address }) => {
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
     // If there is no user or the cart is empty, don't try to render anything.
    // This prevents the component from crashing.
    if (!user || cart.length === 0) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500">There is nothing to check out.</p>
            </div>
        );
    }
   const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        const customerDetails = { name: user.name, phone: user.phone };
        const orderItems = cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, mrp: item.mrp, discount: 0, isManual: false }));
        try {
          // UPDATE THIS API CALL from '/billing' to '/submit-order'
          const res = await api.post('/submit-order', {
                customer: customerDetails,
                items: orderItems,
                paymentMode: 'COD', // Assuming COD for now, update if you pass payment method
                address: address
            });
             onOrderPlaced(res.data.invoiceId);
        } catch(err) {
            alert('Could not submit order. Please try again.');
            setIsPlacingOrder(false); // Make sure to re-enable button on error
        }
        // No finally needed, as we navigate away on success
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


const InventorySystem = ({ user, onLogout }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); 
    const [billingCustomer, setBillingCustomer] = useState({ name: '', countryCode: '91', localPhone: '' });
    const [billingItems, setBillingItems] = useState([]);
    const [editingBill, setEditingBill] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNewOrderPopup, setShowNewOrderPopup] = useState(false);
    const [lastPendingCount, setLastPendingCount] = useState(0);

    // ADD THIS useEffect TO CHECK FOR NEW ORDERS every 15 seconds
    useEffect(() => {
        // Initial check
        api.get('/pending-orders/check').then(res => setLastPendingCount(res.data.pending_count));

        const interval = setInterval(() => {
            api.get('/pending-orders/check').then(res => {
                const newCount = res.data.pending_count;
                if (newCount > 0 && newCount > lastPendingCount) {
                    setShowNewOrderPopup(true); // Show pop-up if new orders have arrived
                }
                setLastPendingCount(newCount);
            });
        }, 15000); // Check every 15 seconds

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [lastPendingCount]);


    const handleBillCreated = () => {
        setBillingCustomer({ name: '', countryCode: '91', localPhone: '' });
        setBillingItems([]);
        setEditingBill(null);
    };

    const handleEditBill = (bill) => {
        setEditingBill(bill);
        setActiveView('billing');
    };

    // Helper component for the sidebar navigation items
    const NavItem = ({ icon: Icon, label, viewName,setIsMobileMenuOpen }) => {
        const isSalesView = activeView === 'sales';
        const isActive = activeView === viewName;
        
        const baseStyle = isSalesView ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-blue-100 hover:bg-blue-700';
        const activeStyle = isSalesView ? 'bg-gray-700 text-white shadow-inner' : 'bg-blue-700 text-white shadow-inner';

        return (
            <button
               onClick={() => {
    setActiveView(viewName);
    setIsMobileMenuOpen(false); // This closes the mobile menu
}}
            
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors duration-200 ${isActive ? activeStyle : baseStyle}`}
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                    {isSidebarExpanded && (
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
    };

    const AboutView = () => {
        const isSalesView = activeView === 'sales';
        return (
            <div className="flex items-center justify-center h-full">
                <motion.div 
                    className={`text-center p-12 rounded-xl shadow-lg border ${isSalesView ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Pill className={`mx-auto h-16 w-16 mb-4 ${isSalesView ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h1 className="text-5xl font-bold">
                        <span className={isSalesView ? 'text-red-500' : 'text-red-600'}>Cure</span>
                        <span className={isSalesView ? 'text-blue-400' : 'text-blue-600'}>Pharma X</span>
                    </h1>
                    <p className={`mt-2 text-lg ${isSalesView ? 'text-gray-400' : 'text-gray-500'}`}>
                        Next Generation Inventory Software
                    </p>
                </motion.div>
            </div>
        );
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard setActiveView={setActiveView} />;
            case 'medicines': return <MedicinesView />;
            case 'billing': return <BillingView customer={billingCustomer} setCustomer={setBillingCustomer} items={billingItems} setItems={setBillingItems} onBillCreated={handleBillCreated} editingBill={editingBill} />;
            case 'sales': return <SalesView />;
            case 'online-orders': return <OnlineOrdersView />;
            case 'alerts': return <AlertsView />;
            case 'purchase-invoices': return <PurchaseInvoiceView />;
            case 'customer-bills': return <CustomerBillsView onEditBill={handleEditBill} />;
            case 'advances': return <AdvancesView />;
            case 'shortages': return <ShortagesView />;
            case 'customer-history': return <CustomerHistoryView />;
            case 'import': return <ImportView />;
            case 'about': return <AboutView />;
            case 'daily-sales': return <DailySalesView />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className={`flex h-screen transition-colors duration-500 ease-in-out ${
            activeView === 'sales' ? 'bg-black text-gray-300' : 'bg-gray-50 text-gray-800'
        }`}>
             {isMobileMenuOpen && (
            <div
                className="fixed inset-0 bg-black/60 z-30 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
        )}

        <Modal isOpen={showNewOrderPopup} onClose={() => setShowNewOrderPopup(false)} size="sm">
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold">New Online Order!</h2>
                    <p className="text-gray-600 my-4">A new online order has been submitted and is awaiting your approval.</p>
                    <Button onClick={() => {
                        setActiveView('online-orders'); // Go to the online orders page
                        setShowNewOrderPopup(false);
                    }}>View Orders</Button>
                </div>
            </Modal>
            <motion.aside
                className={`fixed inset-y-0 left-0 z-40 p-4 flex flex-col shrink-0 shadow-lg transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
                    activeView === 'sales' ? 'bg-gray-900 border-r border-gray-800' : 'bg-blue-600'
                }`}
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
                animate={{ width: isSidebarExpanded ? '16rem' : '4.5rem' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <button onClick={() => setActiveView('about')} className="flex items-center space-x-2 mb-8 px-2 overflow-hidden text-left w-full flex-shrink-0">
                    <Pill className="h-8 w-8 text-white flex-shrink-0" />
                    <AnimatePresence>
                        {isSidebarExpanded && (
                            <motion.span 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                className="text-xl font-bold whitespace-nowrap"
                            >
                                <span className={activeView === 'sales' ? 'text-red-500' : 'text-red-400'}>Cure</span>
                                <span className="text-white">Pharma X</span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                <div className="flex-grow overflow-y-auto -mr-2 pr-2 custom-scrollbar">
                    <nav className="space-y-1">
                        <NavItem icon={LayoutDashboard} label="Dashboard" viewName="dashboard" setIsMobileMenuOpen={setIsMobileMenuOpen} />
                        <NavItem icon={Package} label="Medicines" viewName="medicines" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={Receipt} label="New Bill" viewName="billing" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={ShoppingBag} label="Online Orders" viewName="online-orders" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={CalendarDays} label="Daily Sales" viewName="daily-sales" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={TrendingUp} label=" Advance Sales" viewName="sales" setIsMobileMenuOpen={setIsMobileMenuOpen} />
                        <NavItem icon={BellRing} label="Reminders" viewName="alerts" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={Building} label="Agency Invoices" viewName="purchase-invoices" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={ClipboardList} label="Customer Bills" viewName="customer-bills" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={Wallet} label="Advances" viewName="advances" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={ClipboardX} label="Shortages" viewName="shortages" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={History} label="Customer History" viewName="customer-history" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                        <NavItem icon={Upload} label="Import CSV" viewName="import" setIsMobileMenuOpen={setIsMobileMenuOpen}/>
                    </nav>
                </div>

                <div className={`flex-shrink-0 pt-4 mt-4 border-t transition-colors duration-500 ease-in-out ${activeView === 'sales' ? 'border-gray-700' : 'border-blue-500/50'}`}>
                    <button
                        onClick={onLogout}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left transition-colors duration-200 ${activeView === 'sales' ? 'text-gray-400 hover:bg-red-500/50 hover:text-white' : 'text-blue-100 hover:bg-red-500 hover:text-white'}`}
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

            <main className="flex-grow p-6 lg:p-8 overflow-y-auto custom-scrollbar">
                <button
        className="md:hidden p-2 mb-4 rounded-md bg-gray-200 text-gray-800"
        onClick={() => setIsMobileMenuOpen(true)}
    >
        <Menu size={24} />
    </button>
                {renderView()}
            </main>
        </div>
    );
};



const MedicinesView = () => {
    const [medicines, setMedicines] = useState([]);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState('name');

    const fetchMedicines = useCallback(() => {
        api.get(`/medicines?q=${searchTerm}&by=${searchBy}`)
           .then(res => setMedicines(res.data));
    }, [searchTerm, searchBy]);

    useEffect(fetchMedicines, [fetchMedicines]);

    const onSave = () => { fetchMedicines(); setIsFormModalOpen(false); };
    const onDelete = (id) => { if (window.confirm('Are you sure?')) { api.delete(`/medicines/${id}`).then(fetchMedicines); } };

    return (
        <>
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} size="3xl">
                <MedicineForm medicine={editingMedicine} onSave={onSave} onCancel={() => setIsFormModalOpen(false)} />
            </Modal>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Medicines</h1>
                <Button onClick={() => { setEditingMedicine(null); setIsFormModalOpen(true); }}>
                    <PlusCircle size={20} /><span>Add Medicine</span>
                </Button>
            </div>
            
            <div className="mb-6 flex gap-2">
                <div className="relative flex-grow">
                    <Input type="text" placeholder={`Search by ${searchBy}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10"/>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <select value={searchBy} onChange={e => setSearchBy(e.target.value)} className="bg-gray-100 border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="name">Name</option>
                    <option value="formula">Formula</option>
                    <option value="batch_no">Batch #</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold">S.No</th>
                            <th className="p-3 font-semibold">Name</th>
                            <th className="p-3 font-semibold">Formula</th>
                            <th className="p-3 font-semibold">Batch #</th>
                            <th className="p-3 font-semibold">Qty</th>
                            <th className="p-3 font-semibold">MRP</th>
                            <th className="p-3 font-semibold">PTR</th>
                            <th className="p-3 font-semibold">GST(%)</th>
                            <th className="p-3 font-semibold">Cost/Item</th>
                            <th className="p-3 font-semibold">Profit/Item (₹)</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicines.map((med, index) => {
                            const costPerItem = (med.ptr && med.gst !== null) ? med.ptr * (1 + med.gst / 100) : 0;
                            const profit = (med.mrp && costPerItem) ? med.mrp - costPerItem : 0;
                            return (
                                <tr key={med.id} className="border-t">
                                    <td className="p-3 font-medium">{index + 1}</td>
                                    <td className="p-3 font-medium">{med.name}</td>
                                    <td className="p-3 text-gray-500">{med.formula}</td>
                                    <td className="p-3 text-gray-500">{med.batch_no}</td>
                                    <td className="p-3">{med.quantity}</td>
                                    <td className="p-3">₹{med.mrp?.toFixed(2)}</td>
                                    <td className="p-3 text-gray-500">₹{med.ptr?.toFixed(2)}</td>
                                    <td className="p-3 text-gray-500">{med.gst}%</td>
                                    <td className="p-3 text-gray-500">₹{med.amount?.toFixed(2)}</td>
                                    <td className={`p-3 font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>₹{profit.toFixed(2)}</td>
                                    <td className="p-3 text-right space-x-2 flex items-center justify-end">
                                        <button onClick={() => { setEditingMedicine(med); setIsFormModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={18} /></button>
                                        <button onClick={() => onDelete(med.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};


const MedicineForm = ({ medicine, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        formula: '',
        quantity: '',
        freeqty: '',
        batch_no: '',
        expiry_date: '',
        mrp: '',
        ptr: '',
        amount: '0.00',
        gst: '',
        image_url: '',
        category: 'General'
    });
    const categories = ['General', 'Cardiac Care', 'Baby Care', 'Immunity', 'Ortho Care', 'Skin Care', 'Respiratory'];

    const totalPurchaseValue = ((parseFloat(formData.amount) || 0) * (parseInt(formData.quantity) || 0)).toFixed(2);

    useEffect(() => {
        const ptr = parseFloat(formData.ptr) || 0;
        const gst = parseFloat(formData.gst) || 0;
        const perItemAmount = ptr * (1 + gst / 100);
        setFormData(prevData => ({ ...prevData, amount: perItemAmount.toFixed(2) }));
    }, [formData.ptr, formData.gst]);

    useEffect(() => {
        if (medicine) {
            const formattedMedicine = { ...medicine, expiry_date: medicine.expiry_date ? medicine.expiry_date.split('T')[0] : '', image_url: medicine.image_url || '', category: medicine.category || 'General', formula: medicine.formula || '' };
            setFormData(formattedMedicine);
        } else {
            setFormData({ name: '', formula: '', quantity: '', freeqty: '', batch_no: '', expiry_date: '', mrp: '', ptr: '', amount: '0.00', gst: '', image_url: '', category: 'General' });
        }
    }, [medicine]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...formData };
        delete payload.amount;

        const method = medicine ? 'put' : 'post';
        const url = medicine ? `/medicines/${medicine.id}` : '/medicines';
        await api[method](url, payload);
        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-xl font-bold mb-6">{medicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Medicine Name" required className="lg:col-span-2" />
                <Input name="formula" value={formData.formula} onChange={handleChange} placeholder="Formula (e.g., Paracetamol)" />
                <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
                <Input name="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleChange} placeholder="MRP (₹)" />
                <Input name="ptr" type="number" step="0.01" value={formData.ptr} onChange={handleChange} placeholder="PTR (₹)" />
                <Input name="gst" type="number" step="0.01" value={formData.gst} onChange={handleChange} placeholder="GST (%)" />
                <div>
                    <label className="text-sm font-medium text-gray-500">Cost Price / Item (₹)</label>
                    <Input name="amount" type="number" value={formData.amount} readOnly className="bg-gray-200 text-gray-500" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Total Purchase Value (₹)</label>
                    <Input type="number" value={totalPurchaseValue} readOnly className="bg-gray-200 text-gray-500 font-bold" />
                </div>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-100 border-gray-300 rounded-lg p-3">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <Input name="batch_no" value={formData.batch_no} onChange={handleChange} placeholder="Batch #" />
                <Input name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} />
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
                <p className="mb-4">2. Required headers: <code className="bg-gray-100 p-1 rounded">name,quantity,mrp</code>. Optional headers: <code className="bg-gray-100 p-1 rounded">freeqty,batch_no,expiry_date,ptr,amount,gst,formula</code></p>
                <div className="flex gap-2"><Input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} /><Button onClick={handleUpload}><Upload size={18}/><span>Upload</span></Button></div>
                {status.message && <p className={`mt-4 text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{status.message}</p>}
            </div>
        </div>
    );
};
const BillingView = ({ customer, setCustomer, items, setItems, onBillCreated, editingBill }) => {
    // State for this component's own logic
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]); 
    const [manualItem, setManualItem] = useState({ name: '', mrp: '' });
    const [lastBill, setLastBill] = useState(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [saveToInventory, setSaveToInventory] = useState(true);
    const [paymentMode, setPaymentMode] = useState('Cash');

    // State for the Customer History feature
    const [customerHistory, setCustomerHistory] = useState(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Dynamic search logic with debounce for the unified search bar
    useEffect(() => {
        if (searchTerm.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const debounceTimer = setTimeout(() => {
            api.get(`/medicines?q=${searchTerm}`)
                .then(res => setSearchResults(res.data))
                .catch(err => console.error("Error fetching search results:", err));
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]); // Only depends on the search term now

    // Effect to fetch customer history
    useEffect(() => {
        if (customer.localPhone && customer.localPhone.length === 10) {
            setIsHistoryLoading(true);
            const fullPhoneNumber = customer.countryCode + customer.localPhone;
            const handler = setTimeout(() => {
                api.get(`/customer-history-by-phone/${fullPhoneNumber}`)
                    .then(res => {
                        setCustomerHistory(res.data);
                        if (res.data.customer_name && !customer.name) {
                            setCustomer(prev => ({ ...prev, name: res.data.customer_name }));
                        }
                    })
                    .catch(() => setCustomerHistory({ bill_count: 0, bills: [] }))
                    .finally(() => setIsHistoryLoading(false));
            }, 500);
            return () => clearTimeout(handler);
        } else {
            setCustomerHistory(null);
        }
    }, [customer.localPhone, customer.countryCode, customer.name, setCustomer]);

    // Effect to populate the form when editing a bill
    useEffect(() => {
        if (editingBill) {
            const phone = editingBill.customer_phone || '';
            const countryCode = phone.startsWith('91') ? '91' : '91';
            const localPhone = phone.replace(new RegExp(`^${countryCode}`), '');
            setCustomer({ name: editingBill.customer_name, countryCode, localPhone });

            const formattedItems = editingBill.items.map(item => ({
                id: item.medicine_id || `manual-${item.medicine_name}`,
                name: item.medicine_name,
                quantity: item.quantity,
                mrp: item.mrp,
                discount: item.discount_percent,
                ptr: item.ptr // Assuming ptr is available from the fetched bill item
            }));
            setItems(formattedItems);
            setPaymentMode(editingBill.payment_mode || 'Cash');
        }
    }, [editingBill, setCustomer, setItems]);
    
    // --- Component Functions ---
    const addItem = (med) => {
        const existing = items.find(i => i.id === med.id);
        if (existing) {
            setItems(items.map(i => i.id === med.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setItems([...items, { ...med, quantity: 1, discount: 0, isManual: false, ptr: med.ptr }]);
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
        const payload = { customer: { name: customer.name, phone: fullPhoneNumber }, items, paymentMode };
        try {
            const response = editingBill 
                ? await api.put(`/customer-bills/${editingBill.id}`, payload)
                : await api.post('/billing', payload);
            setLastBill({ ...response.data, customer: { name: customer.name, phone: fullPhoneNumber }, items, grandTotal });
            setIsSuccessModalOpen(true);
        } catch (error) { 
            alert(`Error: ${error.response?.data?.error || 'Could not save bill.'}`); 
        }
    };
    
    const handleModalClose = () => {
        setIsSuccessModalOpen(false);
        onBillCreated();
    };
    
    return (
        <>
            <Modal isOpen={isSuccessModalOpen} onClose={handleModalClose} size="md">
                {lastBill && (
                    <div className="p-6 text-center">
                        <h2 className="text-2xl font-bold text-green-600 mb-4">Bill Saved Successfully!</h2>
                        <div className="p-4 bg-gray-100 rounded-lg inline-block">
                             <QRCodeSVG value={`http://localhost:5001/bill/view/${lastBill.invoiceId}`} size={160} />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Scan to view receipt</p>
                        <a href={createWhatsAppLink(lastBill)} target="_blank" rel="noopener noreferrer" className="mt-6 w-full bg-green-500 text-white hover:bg-green-600 px-4 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2">
                            <MessageSquare />
                            <span>Send on WhatsApp</span>
                        </a>
                    </div>
                )}
            </Modal>
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} size="3xl">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Purchase History for {customerHistory?.customer_name}</h2>
                    {customerHistory?.bills?.length > 0 ? (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {customerHistory.bills.map(invoice => (
                                <div key={invoice.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between font-semibold">
                                        <span>Invoice #{invoice.id} - {invoice.bill_date}</span>
                                        <span>₹{invoice.grand_total.toFixed(2)}</span>
                                    </div>
                                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                                        {invoice.items.map((item, index) => (
                                            <li key={index}>{item.medicine_name} (x{item.quantity})</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : <p>No history found.</p>}
                </div>
            </Modal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold mb-4">
                        {editingBill ? `Editing Invoice #${editingBill.id}` : 'New Customer Bill'}
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <div className="relative">
                                <Input 
                                    type="text" 
                                    placeholder="Search by name or formula... (min 2 chars)"
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                />
                                {searchResults.length > 0 && (
                                     <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                                        {searchResults.map(med => (
                                            <div key={med.id} onClick={() => addItem(med)} className="p-2 hover:bg-blue-100 cursor-pointer">
                                                <p className="font-medium">{med.name}</p>
                                                <p className="text-sm text-gray-500">{med.formula}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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
                        {/* Table remains the same */}
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">Medicine</th>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">Qty</th>
                                    <th className="py-2 text-left text-sm font-medium text-gray-500">PTR</th>
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
                                        <td><Input type="number" step="0.01" value={item.ptr || ''} onChange={e => updateItem(item.id, 'ptr', parseFloat(e.target.value) || 0)} className="w-24 p-1" placeholder="Purchase Price"/></td>
                                        <td><Input type="number" step="0.01" value={item.mrp} onChange={e => updateItem(item.id, 'mrp', parseFloat(e.target.value) || 0)} className="w-24 p-1"/></td>
                                        <td><Input type="number" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} className="w-16 p-1"/></td>
                                        <td><Input type="number" placeholder="e.g., 10" value={item.reminder_days || ''} onChange={e => updateItem(item.id, 'reminder_days', e.target.value)} className="w-24 p-1"/></td>
                                        <td>₹{((item.quantity || 0) * (item.mrp || 0) * (1 - (item.discount || 0) / 100)).toFixed(2)}</td>
                                        <td><button onClick={() => removeItem(item.id)}><MinusCircle className="h-5 w-5 text-red-500"/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 self-start">
                    {/* Customer Details section remains the same */}
                    <h2 className="text-xl font-bold mb-4">Customer Details</h2>
                    <div className="space-y-4 mb-6">
                        <Input type="text" placeholder="Customer Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Customer Phone</label>
                            <div className="flex">
                                <select value={customer.countryCode} onChange={e => setCustomer({...customer, countryCode: e.target.value})} className="bg-gray-100 border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border-r-0">
                                    <option value="91">🇮🇳 +91</option>
                                    <option value="1">🇺🇸 +1</option>
                                    <option value="44">🇬🇧 +44</option>
                                    <option value="971">🇦🇪 +971</option>
                                </select>
                                <Input type="tel" placeholder="Phone Number" value={customer.localPhone} onChange={e => setCustomer({...customer, localPhone: e.target.value})} className="rounded-l-none"/>
                            </div>
                            <div className="h-6 mt-2">
                                {isHistoryLoading ? (
                                    <p className="text-sm text-gray-500">Searching history...</p>
                                ) : customerHistory ? (
                                    customerHistory.bill_count > 0 ? (
                                        <button onClick={() => setIsHistoryModalOpen(true)} className="text-sm text-blue-600 hover:underline font-semibold">
                                            Returning Customer ({customerHistory.bill_count} previous bills)
                                        </button>
                                    ) : (
                                        <p className="text-sm text-green-600 font-semibold">
                                            New Customer
                                        </p>
                                    )
                                ) : null}
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
                    <Button onClick={handleSubmitBill} className="w-full mt-6 !py-3">
                        {editingBill ? 'Update Bill' : 'Create Bill'}
                    </Button>
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
    
    let message = `Hi ${bill.customer.name},\n *USE THIS CHAT FOR ANY ONLINE ORDERS*\nThank you for your purchase from CurePharma !, \n*SHOP AGAIN*\n\n*Invoice #${bill.invoiceId}*\n\n`;
    
    bill.items.forEach(item => {
        const itemTotal = item.quantity * item.mrp;
        message += `- ${item.name} (x${item.quantity}): ₹${itemTotal.toFixed(2)}\n`;
    });

    message += `\n*Grand Total: ₹${bill.grandTotal.toFixed(2)}*`;
    message += '\n📎 Bill attached — keep it for your records.';
    message += '\n💚 Wishing you a speedy recovery!';
    message += '\n*— Team CurePharma*';
    
    const encodedMessage = encodeURIComponent(message);

    // Clean the phone number to remove any non-digit characters like '+', spaces, or '-'
    const sanitizedPhone = bill.customer.phone.replace(/[^0-9]/g, '');
    
    // Note: The user must still enter the country code (e.g., 91) in the form
   return `https://web.whatsapp.com/send?phone=${sanitizedPhone}&text=${encodedMessage}`;
};


const createWhatsAppLinkForBill = (bill) => {
    let message = `*Thank you for your purchase from CurePharma X!*\n\n*Invoice #${bill.id}*\n\n`;
    bill.items.forEach(item => {
        const itemTotal = item.quantity * item.mrp;
        message += `- ${item.medicine_name} (x${item.quantity}): ₹${itemTotal.toFixed(2)}\n`;
    });
    message += `\n*Grand Total: ₹${bill.grand_total.toFixed(2)}*`;
    message += '\n *USE THIS CHAT FOR ANY FURTHER ORDERS :)*';
    const encodedMessage = encodeURIComponent(message);
    const sanitizedPhone = bill.customer_phone.replace(/[^0-9]/g, '');
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

const Dashboard = ({ setActiveView }) => {
    const [stats, setStats] = useState(null);
    const [modalContent, setModalContent] = useState(null);
    
    // State for the new Profit Modal
    const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
    const [profitDetails, setProfitDetails] = useState([]);
    const [isProfitDetailsLoading, setIsProfitDetailsLoading] = useState(false);

    useEffect(() => {
        api.get('/dashboard-stats').then(res => setStats(res.data));
    }, []);

    // Reusable StatCard component
    const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
        <motion.div 
            whileHover={{ y: -5 }} 
            onClick={onClick} 
            className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between ${onClick ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all' : ''}`}
        >
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value ?? '...'}</p>
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </motion.div>
    );

    // Function to open the modal for low stock, expiring, etc.
    const openModal = async (type) => {
        let title = '';
        let data = [];
        let endpoint = '';

        if (type === 'low-stock') {
            title = 'Low Stock Medicines (<10)';
            endpoint = '/medicines?filter=low_stock';
        } else if (type === 'expiring_soon') {
            title = 'Medicines Expiring in 60 Days';
            endpoint = '/medicines?filter=expiring_soon';
        } else if (type === 'expired') {
            title = 'Expired Medicines';
            endpoint = '/medicines?filter=expired';
        }
        
        if(endpoint) {
            const res = await api.get(endpoint);
            data = res.data;
        }
        setModalContent({ title, data, type });
    };

    // Function to open the new profit details modal
    const openProfitModal = () => {
        setIsProfitDetailsLoading(true);
        setIsProfitModalOpen(true);
        api.get('/profit-today-details')
           .then(res => setProfitDetails(res.data))
           .finally(() => setIsProfitDetailsLoading(false));
    };

    return (
        <>
            {/* Modal for Low Stock, Expired, etc. */}
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

            {/* NEW Modal for Profit Details */}
            <Modal isOpen={isProfitModalOpen} onClose={() => setIsProfitModalOpen(false)} size="3xl">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Today's Profit Breakdown</h2>
                    {isProfitDetailsLoading ? <p>Loading details...</p> : (
                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-3 font-semibold">Medicine</th>
                                        <th className="p-3 font-semibold text-center">Qty Sold</th>
                                        <th className="p-3 font-semibold text-right">MRP</th>
                                        <th className="p-3 font-semibold text-right">Cost Price</th>
                                        <th className="p-3 font-semibold text-right">Profit / Item</th>
                                        <th className="p-3 font-semibold text-right">Total Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profitDetails.map((item, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-3 font-medium">{item.medicine_name}</td>
                                            <td className="p-3 text-center">{item.quantity_sold}</td>
                                            <td className="p-3 text-right">₹{item.mrp.toFixed(2)}</td>
                                            <td className="p-3 text-right text-gray-500">₹{item.cost_price.toFixed(2)}</td>
                                            <td className={`p-3 text-right font-semibold ${item.profit_per_item >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                ₹{item.profit_per_item.toFixed(2)}
                                            </td>
                                            <td className={`p-3 text-right font-bold ${item.total_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                ₹{item.total_profit.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="font-bold bg-gray-100 sticky bottom-0">
                                    <tr className="border-t-2">
                                        <td colSpan="5" className="p-3 text-right">Total Profit Today</td>
                                        <td className="p-3 text-right text-lg text-green-700">
                                            ₹{profitDetails.reduce((acc, item) => acc + item.total_profit, 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>

            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Sales Today" value={`₹${stats?.salesToday?.toFixed(2) ?? '0.00'}`} icon={DollarSign} color="bg-green-500" />
                <StatCard 
                    title="Profit Today" 
                    value={`₹${stats?.profitToday?.toFixed(2) ?? '0.00'}`} 
                    icon={TrendingUp}
                    color="bg-teal-500" 
                    onClick={openProfitModal} 
                />
                <StatCard title="Total Medicines" value={stats?.totalMedicines} icon={Package} color="bg-blue-500" />
                <StatCard title="Low Stock" value={stats?.lowStockCount} icon={AlertTriangle} color="bg-yellow-500" onClick={() => openModal('low-stock')} />
                <StatCard title="Expiring Soon (60d)" value={stats?.expiringSoonCount} icon={History} color="bg-indigo-500" onClick={() => openModal('expiring_soon')} />
                <StatCard 
                    title="Pending Reminders" 
                    value={stats?.pendingReminders} 
                    icon={BellRing}
                    color="bg-cyan-500" 
                    onClick={() => setActiveView('alerts')} 
                />
                <StatCard title="Shortages" value={stats?.shortageCount} icon={ClipboardX} color="bg-orange-500" onClick={() => setActiveView('shortages')} />    
            </div>
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold mb-4">Sales (Last 30 Days)</h2>
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

const CustomerBillsView = ({ onEditBill }) => {
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- STATE for Broadcast Feature ---
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState("Hello! We have new offers at CurePharma X. Visit us for exciting discounts!");
    const [allPhones, setAllPhones] = useState([]);
    const [selectedPhones, setSelectedPhones] = useState(new Set());
    const [isLoadingPhones, setIsLoadingPhones] = useState(false);

    const fetchBills = useCallback(() => { 
        api.get(`/customer-bills?q=${searchTerm}`).then(res => setBills(res.data));
    }, [searchTerm]);

    useEffect(() => { 
        const handler = setTimeout(() => {
            fetchBills();
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, fetchBills]);

    const viewBillDetails = (bill) => { 
        setSelectedBill(bill);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (billId) => { 
        if (window.confirm('Are you sure you want to permanently delete this bill?')) {
            try {
                await api.delete(`/customer-bills/${billId}`);
                fetchBills();
            } catch (error) {
                alert('Failed to delete the bill.');
            }
        }
    };

    const handleFetchPhones = () => {
        setIsLoadingPhones(true);
        api.get('/customers/all-phones')
           .then(res => {
               setAllPhones(res.data);
               setSelectedPhones(new Set(res.data)); // Auto-select all by default
           })
           .finally(() => setIsLoadingPhones(false));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPhones(new Set(allPhones));
        } else {
            setSelectedPhones(new Set());
        }
    };

    const handlePhoneSelect = (phone, isChecked) => {
        setSelectedPhones(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(phone);
            } else {
                newSet.delete(phone);
            }
            return newSet;
        });
    };

    const handleSendBroadcast = () => {
        if (selectedPhones.size === 0) {
            alert("Please select at least one phone number.");
            return;
        }
        
        const message = encodeURIComponent(broadcastMessage);
        selectedPhones.forEach((phone, index) => {
            const sanitizedPhone = phone.replace(/[^0-9]/g, '');
            const url = `https://api.whatsapp.com/send?phone=${sanitizedPhone}&text=${message}`;
            setTimeout(() => {
                window.open(url, '_blank');
            }, index * 200); 
        });
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

            <Modal isOpen={isBroadcastModalOpen} onClose={() => setIsBroadcastModalOpen(false)} size="3xl">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Send Broadcast Message</h2>
                    <div className="space-y-4">
                        <label htmlFor="broadcast-message" className="block text-sm font-medium text-gray-700">Your Message:</label>
                        <textarea id="broadcast-message" rows="4" className="w-full bg-gray-100 border-gray-300 rounded-lg p-3" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
                        
                        <div className="flex items-center space-x-4">
                             <Button onClick={handleFetchPhones} disabled={isLoadingPhones}>
                                {isLoadingPhones ? 'Loading...' : `Generate List (${allPhones.length > 0 ? allPhones.length : ''})`}
                            </Button>
                            {allPhones.length > 0 && (
                                <Button onClick={handleSendBroadcast} className="!bg-green-600 hover:!bg-green-700">
                                    Send to {selectedPhones.size} Selected Customers
                                </Button>
                            )}
                        </div>

                        {allPhones.length > 0 && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg max-h-64 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center mb-2 border-b pb-2">
                                    <input type="checkbox" id="select-all" checked={selectedPhones.size === allPhones.length && allPhones.length > 0} onChange={handleSelectAll} className="h-5 w-5 rounded"/>
                                    <label htmlFor="select-all" className="ml-2 font-semibold">Select All ({selectedPhones.size} / {allPhones.length})</label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {allPhones.map(phone => (
                                        <div key={phone} className="flex items-center p-2 bg-white rounded-md shadow-sm">
                                            <input 
                                                type="checkbox" 
                                                id={`phone-${phone}`}
                                                checked={selectedPhones.has(phone)}
                                                onChange={(e) => handlePhoneSelect(phone, e.target.checked)}
                                                className="h-4 w-4 rounded"
                                            />
                                            {/* --- THIS IS THE NEW CLICKABLE LINK --- */}
                                            <a 
                                                href={`https://web.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(broadcastMessage)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 text-sm text-blue-600 hover:underline cursor-pointer"
                                                title={`Send message to ${phone}`}
                                            >
                                                {phone}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Customer Bills</h1>
                <Button onClick={() => { setAllPhones([]); setSelectedPhones(new Set()); setIsBroadcastModalOpen(true); }}>
                    <MessageSquare size={20} />
                    <span>Broadcast</span>
                </Button>
            </div>
            
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
                            <tr key={bill.id} className="border-t hover:bg-gray-50">
                                <td className="p-3 font-medium">{bill.id}</td>
                                <td className="p-3">{bill.customer_name}</td>
                                <td className="p-3 text-gray-500">{bill.customer_phone}</td>
                                <td className="p-3 text-gray-500">{bill.bill_date}</td>
                                <td className="p-3 text-right font-semibold">₹{bill.grand_total.toFixed(2)}</td>
                                <td className="p-3 text-right space-x-2 flex items-center justify-end">
                                    <a href={createWhatsAppLinkForBill(bill)} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-green-600" title="Send on WhatsApp">
                                        <MessageSquare size={18} />
                                    </a>
                                    <button onClick={() => viewBillDetails(bill)} className="p-2 text-gray-500 hover:text-gray-800" title="View Bill">
                                        <FileText size={18} />
                                    </button>
                                    <button onClick={() => onEditBill(bill)} className="p-2 text-gray-500 hover:text-blue-600" title="Edit Bill">
                                        <Edit size={18} />
                                    </button>
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


// --- UPDATED: Daily Sales View Component ---
const DailySalesView = () => {
    const [summary, setSummary] = useState([]);
    const [details, setDetails] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    useEffect(() => {
        api.get('/daily-sales-summary')
           .then(res => setSummary(res.data))
           .finally(() => setIsLoading(false));
    }, []);

    const viewDayDetails = (date_str) => {
        setSelectedDate(date_str);
        setIsDetailsLoading(true);
        api.get(`/daily-sales/${date_str}`)
           .then(res => setDetails(res.data))
           .finally(() => setIsDetailsLoading(false));
    };

    if (isLoading) return <p>Loading daily sales...</p>;

    return (
        <>
            <Modal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} size="3xl">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Invoice Details for {selectedDate}</h2>
                    {isDetailsLoading ? <p>Loading details...</p> : (
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {details.map(invoice => (
                                <div key={invoice.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between font-semibold">
                                        {/* --- THIS IS THE UPDATED SECTION --- */}
                                        <span className="flex items-center">
                                            Invoice #{invoice.id} - {invoice.customer_name}
                                            {/* This line conditionally renders the "Online" tag */}
                                            {invoice.order_type === 'Online' && (
                                                <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    Online
                                                </span>
                                            )}
                                        </span>
                                        <span>₹{invoice.grand_total.toFixed(2)}</span>
                                    </div>
                                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                                        {invoice.items.map((item, index) => (
                                            <li key={index}>{item.medicine_name} (x{item.quantity})</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            <h1 className="text-3xl font-bold mb-6">Daily Sales Summary</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold">Date</th>
                            <th className="p-3 font-semibold">Total Bills</th>
                            <th className="p-3 font-semibold text-right">Total Profit (₹)</th>
                            <th className="p-3 font-semibold text-right">Total Sales (₹)</th>
                            <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.map(day => (
                            <tr key={day.date} className="border-t">
                                <td className="p-3 font-medium">{day.date}</td>
                                <td className="p-3 text-gray-500">{day.bill_count}</td>
                                <td className={`p-3 text-right font-semibold ${day.total_profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    ₹{day.total_profit.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-semibold">₹{day.total_sales.toFixed(2)}</td>
                                <td className="p-3 text-right">
                                    <Button variant="secondary" onClick={() => viewDayDetails(day.date)} className="!py-1 !px-3">
                                        View Details
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const SalesView = () => {
    // State for date range
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 6); // Default to last 7 days
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    // State for report data
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReport = useCallback(() => {
        setIsLoading(true);
        setError('');
        api.get(`/advanced-sales-report?start_date=${startDate}&end_date=${endDate}`)
            .then(res => setReportData(res.data))
            .catch(err => setError('Could not fetch report. Please check the date range.'))
            .finally(() => setIsLoading(false));
    }, [startDate, endDate]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleDownloadCSV = () => {
        if (!reportData || !reportData.daily_trends) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Sales,Profit\n"; // Header row
        
        reportData.daily_trends.forEach(row => {
            csvContent += `${row.date},${row.sales.toFixed(2)},${row.profit.toFixed(2)}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Advanced Sales Report</h1>
                <div className="flex items-center gap-2">
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="font-semibold">to</span>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    <Button onClick={fetchReport}>Generate</Button>
                </div>
            </div>

            {isLoading ? (
                <p>Generating your report...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : reportData && (
                <div className="space-y-8">
                    {/* --- Key Metrics --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard title="Total Sales" value={`₹${reportData.period_totals.total_sales.toFixed(2)}`} color="bg-green-500" />
                        <StatCard title="Total Profit" value={`₹${reportData.period_totals.total_profit.toFixed(2)}`} color="bg-teal-500" />
                    </div>

                    {/* --- Sales & Profit Trend Chart --- */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-bold mb-4">Sales & Profit Trend</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reportData.daily_trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="sales" stroke="#3b82f6" name="Sales" strokeWidth={2} />
                                <Line type="monotone" dataKey="profit" stroke="#14b8a6" name="Profit" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* --- Top Products --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProductList title="Top 5 Best-Selling Products" data={reportData.top_selling_products} unit="units sold" />
                        <ProductList title="Top 5 Most Profitable Products" data={reportData.top_profitable_products} unit="in profit" isCurrency={true} />
                    </div>

                    {/* --- Download Button --- */}
                    <div className="text-right">
                        <Button variant="secondary" onClick={handleDownloadCSV}>
                            <Download size={18} />
                            <span>Download Daily Summary (CSV)</span>
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

// Helper components for the SalesView
const StatCard = ({ title, value, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border flex justify-between items-center">
        <p className="text-lg font-semibold text-gray-700">{title}</p>
        <p className={`text-3xl font-bold ${color.replace('bg-', 'text-')}`}>{value}</p>
    </div>
);

const ProductList = ({ title, data, unit, isCurrency = false }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <ul className="space-y-3">
            {data.map((item, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span className="font-bold text-blue-600">
                        {isCurrency ? `₹${item.value.toFixed(2)}` : item.value} {unit}
                    </span>
                </li>
            ))}
        </ul>
    </div>
);


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

// --- ADD THIS NEW COMPONENT ---
// This component's only job is to inject our custom CSS into the app.
const GlobalStyles = () => (
  <style jsx global>{`
    /* A subtle, blue scrollbar for Webkit browsers */
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(59, 130, 246, 0.4); /* Tailwind's blue-500 with 40% opacity */
      border-radius: 8px;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb {
      background-color: rgba(59, 130, 246, 0.6); /* 60% opacity on hover */
    }
  `}</style>
);

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
