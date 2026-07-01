import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/ProductCard';
import { Package } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Home() {
  const products = useProductStore((state) => state.products);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.category.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [products, activeCategory, searchQuery]);

  const clearFilters = () => {
    setActiveCategory('All');
    if (searchQuery) {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="boutique-gradient rounded-[2rem] p-8 md:p-16 text-center text-charcoal relative overflow-hidden shadow-soft border border-white/40">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZmlsbD0icmdiYSgwLCAwLCAwLCAwLjEpIiBkPSJNMCAwaDIwdjIwSDB6bTEwIDEwYTEwIDEwIDAgMSAxIDAgMjAgMTAgMTAgMCAwIDEgMC0yMHoiLz48L3N2Zz4=')]"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 leading-tight text-charcoal drop-shadow-sm">
            Elevate Your <span className="text-primary underline decoration-accent decoration-4 underline-offset-4">Lifestyle</span>
          </h1>
          <p className="text-lg md:text-xl text-charcoal-muted mb-8 font-medium">
            Discover our curated collection of premium products designed for the modern world.
          </p>
          <button className="px-8 py-4 bg-primary text-white rounded-full font-bold shadow-glow hover:shadow-glow-accent hover:-translate-y-1 transition-all duration-400 focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:outline-none">
            Shop New Arrivals
          </button>
        </div>
      </section>

      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold text-charcoal tracking-tight">Featured Products</h2>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide snap-x">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap snap-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  activeCategory === category 
                    ? "bg-primary text-white shadow-glow" 
                    : "bg-cream text-charcoal-muted hover:bg-white hover:text-charcoal hover:shadow-soft border border-white/60"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center boutique-card animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-6 border border-white/80 shadow-sm">
              <Package className="w-10 h-10 text-charcoal-muted/50" />
            </div>
            <h3 className="text-xl font-bold text-charcoal mb-2">No products found</h3>
            <p className="text-charcoal-muted max-w-sm mb-6">
              We couldn't find any products {searchQuery ? `matching "${searchQuery}" ` : ''}
              {activeCategory !== 'All' ? `in the "${activeCategory}" category.` : ''}
              {!searchQuery && activeCategory === 'All' ? 'at the moment.' : ''}
            </p>
            <button 
              onClick={clearFilters}
              className="px-6 py-2.5 bg-cream text-charcoal-muted font-medium rounded-xl hover:bg-white border border-white/60 transition-soft focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
