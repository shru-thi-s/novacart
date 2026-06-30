import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, User, LogOut, LogIn, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartCount } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import { cn } from '../lib/utils';
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  const totalItems = useCartCount();
  const { user, isAuthenticated, logout } = useAuthStore();
  const products = useProductStore((state) => state.products);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const searchResults = products.filter(p => {
    if (!debouncedQuery) return false;
    const lowerQuery = debouncedQuery.toLowerCase();
    return p.name.toLowerCase().includes(lowerQuery) || p.category.toLowerCase().includes(lowerQuery);
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1f2937',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.75rem',
            border: '1px solid #f3f4f6',
            fontSize: '0.875rem',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: '#ff6b6b',
              secondary: '#ffffff',
            },
          },
        }} 
      />
      
      <header className="sticky top-0 z-50 bg-blush/80 backdrop-blur-md border-b border-white/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xl shadow-inner">
                  N
                </div>
                <span className="font-bold text-xl text-charcoal tracking-tight">NovaCart</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-sm font-medium text-charcoal-muted hover:text-primary transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md px-1">
                  Home
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-charcoal-muted hover:text-primary transition-soft flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md px-1">
                    <LayoutDashboard className="w-4 h-4" /> Admin
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative hidden sm:block" ref={searchRef}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search products..." 
                  className="w-64 pl-4 pr-10 py-2 bg-cream border border-white/50 rounded-full text-sm focus-visible:bg-white focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 outline-none transition-soft shadow-inner text-charcoal placeholder:text-charcoal-muted/50"
                />
                
                {isSearchOpen && debouncedQuery && (
                  <div className="absolute top-full left-0 mt-2 w-full boutique-card overflow-hidden z-50">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                          {searchResults.slice(0, 5).map(product => (
                            <Link 
                              key={product.id} 
                              to={`/product/${product.id}`}
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-charcoal/5 transition-colors border-b border-charcoal/5 last:border-0"
                            >
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover bg-cream shrink-0 border border-white/60" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-charcoal truncate">{product.name}</p>
                                <p className="text-xs text-primary font-bold">₹{product.price.toLocaleString('en-IN')}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        {searchResults.length > 5 && (
                          <Link
                            to={`/?search=${encodeURIComponent(debouncedQuery)}`}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="block w-full p-3 text-center text-sm font-semibold text-primary hover:bg-primary-light/10 transition-colors bg-cream"
                          >
                            View all results ({searchResults.length})
                          </Link>
                        )}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-charcoal-muted bg-cream">
                        No products found for "{debouncedQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Link to="/cart" className="relative p-2 text-charcoal-muted hover:text-primary transition-soft group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-full">
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>

              <div className="h-6 w-px bg-white/50 hidden sm:block"></div>

              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-background hover:bg-primary-light/20 px-3 py-1.5 rounded-full border border-gray-200 transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-charcoal-muted hidden sm:block max-w-[100px] truncate">{user?.name}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 boutique-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                    <div className="p-3 border-b border-charcoal/5">
                      <p className="text-sm font-semibold text-charcoal truncate">{user?.name}</p>
                      <p className="text-xs text-charcoal-muted truncate">{user?.email}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <Link to="/profile" className="px-3 py-2 text-sm text-charcoal-muted hover:bg-charcoal/5 hover:text-primary rounded-lg transition-colors flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link to="/my-orders" className="px-3 py-2 text-sm text-charcoal-muted hover:bg-charcoal/5 hover:text-primary rounded-lg transition-colors flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> My Orders
                      </Link>
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="md:hidden px-3 py-2 text-sm text-charcoal-muted hover:bg-charcoal/5 hover:text-primary rounded-lg transition-colors flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}
                    </div>
                    <div className="p-2 border-t border-charcoal/5">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary-hover shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-cream border-t border-white/50 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center font-bold text-sm">
                N
              </div>
              <span className="font-semibold text-charcoal">NovaCart Lite</span>
            </div>
            <p className="text-sm text-charcoal-muted">
              © {new Date().getFullYear()} NovaCart Demo. Built with React & Tailwind.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-charcoal-muted hover:text-primary transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">Privacy</a>
              <a href="#" className="text-sm text-charcoal-muted hover:text-primary transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
