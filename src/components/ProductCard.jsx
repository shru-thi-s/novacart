import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { cn } from '../lib/utils';
import { useState } from 'react';
import SafeImage from './SafeImage';

export default function ProductCard({ product }) {
  const addToCart = useCartStore(state => state.addToCart);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setIsAdded(true);
    toast.success('Added to cart');
    setTimeout(() => setIsAdded(false), 1500);
  };

  const hasDiscount = !!product.discountPrice;
  const currentPrice = hasDiscount ? product.discountPrice : product.price;

  return (
    <Link 
      to={`/product/${product.id}`}
      className="group flex flex-col boutique-card overflow-hidden transition-all duration-400 hover:-translate-y-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="relative aspect-square overflow-hidden bg-cream border-b border-white/50">
        <SafeImage 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1.5 rounded-lg tracking-wide shadow-sm border border-white/50">
            SALE
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-charcoal-muted">{product.rating}</span>
        </div>
        
        <h3 className="font-semibold text-charcoal text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-xs text-charcoal-muted mb-3">{product.category}</p>
        
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-charcoal">₹{currentPrice.toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <span className="text-sm text-charcoal-muted/60 line-through ml-2">₹{product.price.toLocaleString('en-IN')}</span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-soft shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              isAdded 
                ? "bg-green-50 text-green-600 border border-green-100 shadow-none" 
                : "bg-white text-charcoal hover:bg-primary hover:text-white border border-gray-100 shadow-sm hover:border-transparent"
            )}
            title="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
