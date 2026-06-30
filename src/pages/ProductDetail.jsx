import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import ProductCard from '../components/ProductCard';
import SafeImage from '../components/SafeImage';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = useProductStore(state => state.products.find(p => p.id === id));
  const allProducts = useProductStore(state => state.products);
  const addToCart = useCartStore(state => state.addToCart);
  
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, allProducts]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-3xl font-bold text-charcoal mb-4">Product not found</h2>
        <p className="text-charcoal-muted mb-8 max-w-md">The product you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-soft shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
          Back to Home
        </Link>
      </div>
    );
  }

  const hasDiscount = !!product.discountPrice;
  const currentPrice = hasDiscount ? product.discountPrice : product.price;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    toast.success('Added to cart');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  return (
    <div className="flex flex-col gap-16 pb-16">
      <div className="pt-4">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-charcoal-muted hover:text-primary transition-soft mb-6 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1 -ml-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream border border-white/50 shadow-sm">
            <SafeImage 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <div className="absolute top-6 left-6 bg-primary/10 text-primary border border-primary/20 text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm tracking-wide">
                SALE
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">{product.category}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal tracking-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-charcoal-muted font-medium">{product.rating} Rating</span>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-bold text-charcoal">₹{currentPrice.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <span className="text-xl text-charcoal-muted/60 line-through">₹{product.price.toLocaleString('en-IN')}</span>
              )}
            </div>

            <div className="prose prose-sm text-charcoal-muted mb-8 max-w-none">
              <p className="text-base leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-auto border-t border-gray-200 pt-8">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-charcoal">Quantity</span>
                <div className="flex items-center border border-white/60 rounded-full bg-cream p-1 shadow-sm">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white disabled:opacity-50 transition-soft text-charcoal-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-medium text-charcoal">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white disabled:opacity-50 transition-soft text-charcoal-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-charcoal-muted/60">{product.stock} available</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                    isAdded 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                      : 'bg-cream text-charcoal border-2 border-charcoal/20 hover:bg-white hover:border-charcoal/40'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isAdded ? (
                    <><CheckCircle2 className="w-5 h-5" /> Added to Cart</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                  )}
                </button>
                
                <button 
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 py-4 bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="border-t border-charcoal/10 pt-16">
          <h2 className="text-2xl font-bold text-charcoal tracking-tight mb-8">You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(rp => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
