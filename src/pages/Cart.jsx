import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore, useCartTotal, useCartCount } from '../store/cartStore';
import SafeImage from '../components/SafeImage';

export default function Cart() {
  const { items, removeFromCart, updateQuantity } = useCartStore();
  const totalPrice = useCartTotal();
  const totalItems = useCartCount();
  const navigate = useNavigate();

  const shippingCost = totalPrice > 4999 ? 0 : 250;
  const finalTotal = totalPrice + shippingCost;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center boutique-card animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center mb-6 border border-white/80 shadow-sm animate-in zoom-in duration-300">
          <ShoppingBag className="w-10 h-10 text-charcoal-muted/50" />
        </div>
        <h2 className="text-3xl font-bold text-charcoal mb-4">Your cart is empty</h2>
        <p className="text-charcoal-muted mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Discover our latest products and add them here!</p>
        <Link 
          to="/" 
          className="px-8 py-3 bg-primary text-white font-medium rounded-xl shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-charcoal">Shopping Cart</h1>
          <span className="text-charcoal-muted font-medium">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
        </div>

        <div className="flex flex-col gap-6">
          {items.map((item) => {
            const currentPrice = item.discountPrice || item.price;
            return (
              <div key={item.id} className="flex gap-4 sm:gap-6 p-4 boutique-card transition-all duration-400 hover:-translate-y-1 hover:shadow-card">
                <Link 
                  to={`/product/${item.id}`} 
                  className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden bg-cream border border-white/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Link 
                        to={`/product/${item.id}`} 
                        className="font-semibold text-charcoal hover:text-primary transition-soft line-clamp-2 mb-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-charcoal-muted">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-charcoal">₹{currentPrice.toLocaleString('en-IN')}</p>
                      {item.discountPrice && (
                        <p className="text-sm text-charcoal-muted/60 line-through">₹{item.price.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-white/60 rounded-full bg-cream p-1 shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-soft text-charcoal-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-charcoal">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm disabled:opacity-50 transition-soft text-charcoal-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-soft p-2 hover:bg-red-50 rounded-full focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full lg:w-96 shrink-0">
        <div className="boutique-card p-8 sticky top-24">
          <h2 className="text-xl font-bold text-charcoal mb-6">Order Summary</h2>
          
          <div className="space-y-4 text-sm font-medium text-charcoal-muted mb-6 pb-6 border-b border-gray-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-charcoal">₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping estimate</span>
              <span className="text-charcoal">{shippingCost === 0 ? 'Free' : `₹${shippingCost.toLocaleString('en-IN')}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax estimate</span>
              <span className="text-charcoal">Calculated at checkout</span>
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-8">
            <span className="text-base font-semibold text-charcoal">Total Estimate</span>
            <span className="text-3xl font-bold text-charcoal">₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>
          
          <button 
            onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-semibold shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Proceed to Checkout <ArrowRight className="w-5 h-5" />
          </button>
          
          {shippingCost > 0 && (
            <p className="text-center text-xs text-charcoal-muted mt-4">
              Add ₹{(4999 - totalPrice).toLocaleString('en-IN')} more for free shipping
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
