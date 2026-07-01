import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProductStore } from '../store/productStore';
import { useOrderStore } from '../store/orderStore';
import { cn } from '../lib/utils';
import SafeImage from '../components/SafeImage';

export default function Admin() {
  const { products, isLoading, error, addProduct, updateProduct, deleteProduct } = useProductStore();
  const { orders } = useOrderStore();
  
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  
  // Products logic
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  
  const CATEGORIES = ["All", "Electronics", "Fashion", "Shoes", "Accessories"];

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'All') return products;
    return products.filter(p => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const defaultFormData = {
    name: '',
    price: '',
    discountPrice: '',
    category: 'Electronics',
    stock: '',
    rating: '5.0',
    description: '',
    image: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/400/400`
  };
  
  const [formData, setFormData] = useState(defaultFormData);

  const openAddModal = () => {
    setFormData({
      ...defaultFormData,
      image: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/400/400`
    });
    setEditingId(null);
    setErrors({});
    setHasAttemptedSubmit(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      discountPrice: product.discountPrice ? product.discountPrice.toString() : '',
      category: product.category,
      stock: product.stock.toString(),
      rating: product.rating.toString(),
      description: product.description,
      image: product.image
    });
    setEditingId(product.id);
    setErrors({});
    setHasAttemptedSubmit(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const { success, message } = await deleteProduct(id);
      if (success) {
        toast.success('Product deleted');
      } else {
        toast.error(message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.image.trim()) newErrors.image = 'Image URL is required';
    
    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (formData.discountPrice !== '' && (isNaN(formData.discountPrice) || Number(formData.discountPrice) < 0)) {
      newErrors.discountPrice = 'Must be a valid number';
    }
    
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0 || !Number.isInteger(Number(formData.stock))) {
      newErrors.stock = 'Valid integer required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    
    if (!validate()) {
      return;
    }
    
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
      category: formData.category,
      stock: parseInt(formData.stock),
      rating: parseFloat(formData.rating),
      description: formData.description,
      image: formData.image
    };

    let result;
    if (editingId) {
      result = await updateProduct(editingId, productData);
    } else {
      result = await addProduct(productData);
    }

    if (result.success) {
      toast.success(editingId ? 'Product updated' : 'Product added');
      closeModal();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Admin Dashboard</h1>
          <p className="text-sm text-charcoal-muted mt-1">Manage your store's inventory and view orders.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-cream border border-white/60 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              activeTab === 'products' ? "bg-white text-charcoal shadow-soft" : "text-charcoal-muted hover:text-charcoal hover:bg-white/50"
            )}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              activeTab === 'orders' ? "bg-white text-charcoal shadow-soft" : "text-charcoal-muted hover:text-charcoal hover:bg-white/50"
            )}
          >
            Orders
            {orders.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-charcoal-muted">Filter by Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-3 pr-8 py-2 bg-cream border border-white/60 text-charcoal rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-soft shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-400 w-full sm:w-auto focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-xl border border-red-100 text-sm">
              Failed to load products from API: {error}. Is the backend running?
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-charcoal-muted">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
              <p>Loading products from API...</p>
            </div>
          ) : (

          <div className="boutique-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-charcoal/5 border-b border-charcoal/10">
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/5">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-white/60 transition-soft">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-cream overflow-hidden shrink-0 border border-white/60 flex items-center justify-center">
                            <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="font-medium text-charcoal line-clamp-2 max-w-xs">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream border border-white/60 text-charcoal-muted">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-charcoal">₹{(product.discountPrice || product.price).toLocaleString('en-IN')}</span>
                          {product.discountPrice && (
                            <span className="text-xs text-charcoal-muted/60 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-sm font-medium", product.stock > 10 ? "text-green-600" : product.stock > 0 ? "text-orange-500" : "text-red-500")}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="p-2 text-charcoal-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-charcoal-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-soft focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-charcoal-muted">
                          <div className="w-16 h-16 bg-cream border border-white/60 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-charcoal-muted/50" />
                          </div>
                          <p className="text-lg font-medium text-charcoal mb-1">No products found</p>
                          <p className="text-sm">We couldn't find any products in this category.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="boutique-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-charcoal/5 border-b border-charcoal/10">
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Order ID & Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/5">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-white/60 transition-soft">
                      <td className="px-6 py-4">
                        <div className="font-bold text-charcoal">{order.id}</div>
                        <div className="text-xs text-charcoal-muted mt-1">{new Date(order.date).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-charcoal">{order.customerName}</div>
                        <div className="text-xs text-charcoal-muted">{order.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-charcoal-muted">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-charcoal">₹{order.total.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-charcoal-muted">{order.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-charcoal-muted">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-cream border border-white/60 rounded-full flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-charcoal-muted/50" />
                          </div>
                          <p className="text-lg font-medium text-charcoal mb-1">No orders yet</p>
                          <p className="text-sm">When customers place orders, they will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative boutique-card bg-cream w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-card animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-cream/90 backdrop-blur-xl border-b border-white/60 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-charcoal">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button 
                onClick={closeModal}
                className="p-2 text-charcoal-muted hover:text-charcoal hover:bg-white rounded-full transition-soft focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-charcoal-muted mb-1">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-white border border-white/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft text-charcoal focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none", errors.name ? "border-red-500" : "focus:border-primary")}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none", errors.price ? "border-red-500" : "border-gray-200 focus:border-primary")}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (Optional, ₹)</label>
                  <input
                    type="number"
                    name="discountPrice"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none", errors.discountPrice ? "border-red-500" : "border-gray-200 focus:border-primary")}
                  />
                  {errors.discountPrice && <p className="text-red-500 text-xs mt-1">{errors.discountPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none", errors.stock ? "border-red-500" : "border-gray-200 focus:border-primary")}
                  />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className={cn("w-full px-4 py-2 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-sm", errors.image ? "border-red-500" : "border-gray-200 focus:border-primary")}
                  />
                  {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                  {formData.image && (
                    <div className="mt-3 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-primary-light/20 flex items-center justify-center">
                      <SafeImage src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-soft resize-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  ></textarea>
                </div>
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-2.5 text-sm font-semibold text-charcoal-muted bg-white border border-white/60 hover:bg-white hover:text-charcoal rounded-xl transition-soft focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={hasAttemptedSubmit && Object.keys(errors).length > 0}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm hover:shadow-md transition-soft disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  {editingId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
