import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2, Mail, Lock, User, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { login, register, googleLogin, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // If already authenticated, redirect to previous page or home
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    return () => clearError();
  }, [clearError, isLogin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.name.trim().length < 2) {
        toast.error('Name must be at least 2 characters');
        return false;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!validateForm()) return;

    const email = formData.email.trim();
    const password = formData.password.trim();

    let success;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(formData.name.trim(), email, password);
    }

    if (success) {
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      toast.error(useAuthStore.getState().error || 'Authentication failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const success = await googleLogin(credentialResponse.credential);
    if (success) {
      toast.success('Successfully logged in with Google');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      toast.error(useAuthStore.getState().error || 'Google login failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Global background from App.jsx is used here */}

      <div className="boutique-card max-w-5xl w-full flex flex-col md:flex-row overflow-hidden z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Left Side - Branding/Illustration */}
        <div className="hidden md:flex md:w-1/2 bg-blush/30 p-12 flex-col justify-between relative overflow-hidden text-charcoal border-r border-white/40">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZmlsbD0icmdiYSgwLCAwLCAwLCAwLjAzKSIgZD0iTTAgMGgyMHYyMEgwem0xMCAxMGExMCAxMCAwIDEgMSAwIDIwIDEwIDEwIDAgMCAxIDAtMjB6Ii8+PC9zdmc+')] opacity-20"></div>
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 text-charcoal hover:opacity-80 transition-opacity w-fit">
              <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-bold text-2xl tracking-tight">NovaCart</span>
            </Link>
          </div>
          
          <div className="relative z-10 max-w-md mt-20">
            <h1 className="text-4xl font-extrabold mb-6 leading-tight">
              {isLogin ? "Welcome back! Let's get you shopping." : "Join NovaCart and start saving today."}
            </h1>
            <p className="text-charcoal-muted text-lg leading-relaxed">
              Discover thousands of products with unbeatable prices, fast shipping, and a vibrant community.
            </p>
          </div>

          <div className="relative z-10 mt-12 flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
              ))}
            </div>
            <p className="text-sm font-medium text-charcoal-muted">Join 10,000+ happy shoppers</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12">
          <div className="max-w-md mx-auto">
            
            {/* Mobile Header */}
            <div className="md:hidden flex flex-col items-center mb-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-charcoal">NovaCart</h2>
            </div>

            <div className="flex items-center bg-cream p-1 rounded-2xl mb-8 relative border border-white/60">
              <div className={cn(
                "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out",
                isLogin ? "left-1" : "left-[calc(50%+4px)]"
              )}></div>
              <button
                type="button"
                onClick={() => { setIsLogin(true); clearError(); }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-xl relative z-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  isLogin ? "text-primary" : "text-charcoal-muted hover:text-charcoal"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); clearError(); }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold rounded-xl relative z-10 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  !isLogin ? "text-primary" : "text-charcoal-muted hover:text-charcoal"
                )}
              >
                Create Account
              </button>
            </div>

            <div className="mb-6 flex justify-center w-full max-w-[320px] mx-auto">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign-In failed')}
                theme="outline"
                size="large"
                shape="pill"
                width="320"
                text={isLogin ? "signin_with" : "signup_with"}
              />
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs font-medium text-charcoal-muted/60 uppercase tracking-wider">or continue with email</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-charcoal-muted mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-muted/60">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 bg-cream border border-white/60 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-soft text-charcoal"
                      placeholder="Alex Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-charcoal-muted mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-muted/60">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-cream border border-white/60 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-soft text-charcoal"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-sm font-medium text-charcoal-muted">Password</label>
                  {isLogin && <a href="#" className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors">Forgot?</a>}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-muted/60">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-cream border border-white/60 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-soft text-charcoal"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-charcoal-muted mb-1.5 ml-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal-muted/60">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 bg-cream border border-white/60 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-soft text-charcoal"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 mt-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold transition-all duration-400 shadow-glow hover:shadow-glow-accent hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-charcoal-muted/60">
              By continuing, you agree to NovaCart's <a href="#" className="font-semibold text-charcoal-muted hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="font-semibold text-charcoal-muted hover:text-primary transition-colors">Privacy Policy</a>.
            </p>
            
          </div>
        </div>
      </div>
    </div>
  );
}
