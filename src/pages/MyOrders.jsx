import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, CreditCard, Calendar, ArrowRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my');
        setOrders(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default: // Placed, Processing, etc.
        return 'bg-amber-100 text-amber-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-charcoal-muted font-medium">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center mb-6 border border-white/60 shadow-sm animate-in zoom-in duration-300">
          <ShoppingBag className="w-10 h-10 text-charcoal-muted/50" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal mb-4">No orders yet</h2>
        <p className="text-charcoal-muted mb-8 max-w-md">Looks like you haven't made any purchases yet. Start exploring our vibrant collection!</p>
        <Link to="/" className="px-8 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary-hover transition-soft shadow-md hover:shadow-lg">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-charcoal mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-primary" />
        My Orders
      </h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="boutique-card p-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal/10 mb-4">
              <div>
                <p className="text-sm font-semibold text-charcoal-muted uppercase tracking-wider mb-1">
                  Order #{order._id.substring(order._id.length - 8)}
                </p>
                <div className="flex items-center gap-4 text-sm text-charcoal-muted font-medium">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-charcoal-muted/60" /> {formatDate(order.createdAt)}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block ${getStatusColor(order.status || 'placed')}`}>
                {order.status || 'Placed'}
              </span>
            </div>

            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-white/60 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-cream rounded-lg border border-white/60 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-charcoal-muted/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal truncate">{item.name}</p>
                    <p className="text-sm text-charcoal-muted">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-charcoal">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Footer */}
            <div className="bg-cream rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/60">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-charcoal-muted/60" />
                <span className="text-sm font-medium text-charcoal-muted">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-charcoal-muted uppercase">Total Amount</span>
                <span className="text-xl font-bold text-charcoal text-primary">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
