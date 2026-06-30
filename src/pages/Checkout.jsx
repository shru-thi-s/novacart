import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { CreditCard, Truck, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore, useCartTotal } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import SafeImage from '../components/SafeImage';
import api from '../services/api';

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const totalPrice = useCartTotal();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });

  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\d+$/.test(data.phone)) newErrors.phone = 'Phone must contain only numbers';
    
    if (!data.address.trim()) newErrors.address = 'Address is required';
    if (!data.city.trim()) newErrors.city = 'City is required';
    
    if (!data.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d+$/.test(data.pincode)) newErrors.pincode = 'Pincode must contain only numbers';
    
    if (paymentMethod === 'Online') {
      if (!data.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!data.cardExpiry.trim()) newErrors.cardExpiry = 'Expiry is required';
      if (!data.cardCvv.trim()) newErrors.cardCvv = 'CVV is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (hasAttemptedSubmit) {
      validate(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, paymentMethod, hasAttemptedSubmit]);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const shippingCost = totalPrice > 4999 ? 0 : 250;
  const finalTotal = totalPrice + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent non-numeric input for phone and pincode
    if ((name === 'phone' || name === 'pincode') && value !== '' && !/^\d+$/.test(value)) {
      return; 
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const processOrderSuccess = async () => {
    try {
      // Map items to match backend schema
      const mappedItems = items.map(item => ({
        product: item.id,
        name: item.name,
        price: item.discountPrice || item.price,
        quantity: item.quantity
      }));

      const orderData = {
        items: mappedItems,
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode
        },
        paymentMethod,
        totalAmount: finalTotal
      };

      const { data } = await api.post('/orders', orderData);
      
      clearCart();
      toast.success('Order placed successfully!');
      // Send the real order ID to the success page
      navigate('/order-success', { state: { method: paymentMethod, total: finalTotal, orderId: data._id } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    
    if (!validate(formData)) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    if (isProcessing) return;
    setIsProcessing(true);

    if (paymentMethod === 'COD') {
      await processOrderSuccess();
    } else {
      // Simulate online payment delay then process
      setTimeout(async () => {
        await processOrderSuccess();
      }, 1500);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.name && formData.phone && formData.address && formData.city && formData.pincode;

  return (
    <>
      {isProcessing && paymentMethod === 'Online' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream/70 backdrop-blur-xl">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-charcoal">Processing Payment...</h2>
          <p className="text-charcoal-muted mt-2">Please do not close this window or go back.</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-charcoal mb-8 pb-4 border-b border-gray-200">Checkout</h1>

          <form onSubmit={handlePlaceOrder} className="space-y-10">
            <section>
              <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-charcoal-muted/50" /> Shipping Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-cream border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.name ? "border-red-500" : "border-white/60 focus:border-primary")}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-cream border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.phone ? "border-red-500" : "border-white/60 focus:border-primary")}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-cream border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft resize-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.address ? "border-red-500" : "border-white/60 focus:border-primary")}
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-cream border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.city ? "border-red-500" : "border-white/60 focus:border-primary")}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-cream border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.pincode ? "border-red-500" : "border-white/60 focus:border-primary")}
                  />
                  {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-charcoal-muted/50" /> Payment Method
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div 
                  onClick={() => setPaymentMethod('Online')}
                  tabIndex="0"
                  onKeyDown={(e) => { if(e.key === 'Enter') setPaymentMethod('Online'); }}
                  className={cn("cursor-pointer border rounded-2xl p-4 flex flex-col gap-2 transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none bg-cream", paymentMethod === 'Online' ? "border-primary bg-primary/5" : "border-white/60 hover:border-charcoal/20")}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-charcoal">Online Payment</span>
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'Online' ? "border-primary" : "border-gray-300")}>
                      {paymentMethod === 'Online' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                  <p className="text-xs text-charcoal-muted">Credit Card, Debit Card, UPI</p>
                </div>

                <div 
                  onClick={() => setPaymentMethod('COD')}
                  tabIndex="0"
                  onKeyDown={(e) => { if(e.key === 'Enter') setPaymentMethod('COD'); }}
                  className={cn("cursor-pointer border rounded-2xl p-4 flex flex-col gap-2 transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none bg-cream", paymentMethod === 'COD' ? "border-primary bg-primary/5" : "border-white/60 hover:border-charcoal/20")}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-charcoal">Cash on Delivery</span>
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'COD' ? "border-primary" : "border-gray-300")}>
                      {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                  <p className="text-xs text-charcoal-muted">Pay at your doorstep</p>
                </div>
              </div>

              {paymentMethod === 'Online' && (
                <div className="bg-cream border border-white/60 p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Demo Only: Enter any details</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className={cn("w-full px-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.cardNumber ? "border-red-500" : "border-gray-200 focus:border-primary")}
                    />
                    {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className={cn("w-full px-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.cardExpiry ? "border-red-500" : "border-gray-200 focus:border-primary")}
                      />
                      {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <input
                        type="text"
                        name="cardCvv"
                        placeholder="123"
                        value={formData.cardCvv}
                        onChange={handleInputChange}
                        className={cn("w-full px-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-charcoal", errors.cardCvv ? "border-red-500" : "border-gray-200 focus:border-primary")}
                      />
                      {errors.cardCvv && <p className="text-red-500 text-xs mt-1">{errors.cardCvv}</p>}
                    </div>
                  </div>
                </div>
              )}
            </section>
            
            <button type="submit" className="hidden">Submit</button>
          </form>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <div className="boutique-card p-8 sticky top-24">
            <h2 className="text-xl font-bold text-charcoal mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/60 bg-cream">
                    <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-charcoal text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 py-1">
                    <p className="text-sm font-medium text-charcoal line-clamp-2 leading-tight">{item.name}</p>
                    <p className="text-sm font-bold text-charcoal mt-1">
                      ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-sm font-medium text-charcoal-muted mb-6 pb-6 border-t border-b border-gray-100 py-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-charcoal">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-charcoal">{shippingCost === 0 ? 'Free' : `₹${shippingCost.toLocaleString('en-IN')}`}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-8">
              <span className="text-base font-semibold text-charcoal">Total</span>
              <span className="text-3xl font-bold text-charcoal">₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={isProcessing || (hasAttemptedSubmit && !isFormValid)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-semibold shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                `Pay ₹${finalTotal.toLocaleString('en-IN')}`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
