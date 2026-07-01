import { create } from 'zustand';
import api from '../services/api';

export const useProductStore = create((set) => ({
  products: [],
  isLoading: false,
  error: null,
  
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/products');
      // Format data to match frontend expectations (id vs _id)
      const formattedProducts = data.map(p => ({ ...p, id: p._id }));
      set({ products: formattedProducts, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch products',
        isLoading: false 
      });
    }
  },

  addProduct: async (productData) => {
    try {
      const { data } = await api.post('/products', productData);
      const newProduct = { ...data, id: data._id };
      set((state) => ({ 
        products: [newProduct, ...state.products] 
      }));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to add product'
      };
    }
  },

  updateProduct: async (id, updatedData) => {
    try {
      const { data } = await api.put(`/products/${id}`, updatedData);
      const updatedProduct = { ...data, id: data._id };
      set((state) => ({
        products: state.products.map(p => p.id === id ? updatedProduct : p)
      }));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update product'
      };
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.delete(`/products/${id}`);
      set((state) => ({
        products: state.products.filter(p => p.id !== id)
      }));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete product'
      };
    }
  }
}));
