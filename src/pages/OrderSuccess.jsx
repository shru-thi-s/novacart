import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, CreditCard, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOrderStore } from '../store/orderStore';

export default function OrderSuccess() {
  const location = useLocation();
  const [orderId, setOrderId] = useState('');
  
  const state = location.state;
  const { orders } = useOrderStore();

  useEffect(() => {
    if (orders.length > 0) {
      setOrderId(orders[0].id);
    } else {
      setOrderId(`NOVA-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [orders]);

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No recent orders found</h2>
        <p className="text-gray-500 mb-8 max-w-md">You haven't placed an order recently or the session has expired.</p>
        <Link to="/" className="px-8 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary-hover transition-soft shadow-md hover:shadow-lg">
          Start Shopping
        </Link>
      </div>
    );
  }

  const { method, total } = state;

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 max-w-2xl mx-auto text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
        Order Successful!
      </h1>
      
      <p className="text-lg text-gray-600 mb-10">
        Thank you for your purchase. We've received your order and are getting it ready to ship.
      </p>

      <div className="w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-card mb-10 text-left">
        <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Details</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Order Number</p>
              <p className="font-bold text-gray-900">{orderId || 'Processing...'}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Payment Method</p>
              <p className="font-bold text-gray-900">{method}</p>
            </div>
          </div>
          
          <div className="col-span-full border-t border-gray-100 pt-6 mt-2 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total Amount Paid</span>
            <span className="text-2xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link 
          to="/my-orders" 
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
        >
          View My Orders
        </Link>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-semibold shadow-sm hover:shadow-md hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none"
        >
          Continue Shopping <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
