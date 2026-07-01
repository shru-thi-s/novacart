import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
        Page Not Found
      </h1>
      
      <p className="text-lg text-gray-600 mb-10 max-w-md">
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>

      <Link 
        to="/" 
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <Home className="w-5 h-5" /> Back to Home
      </Link>
    </div>
  );
}
