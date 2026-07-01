import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (product, quantity = 1) => set((state) => {
        const existingItem = state.items.find(item => item.id === product.id);
        if (existingItem) {
          return {
            items: state.items.map(item => 
              item.id === product.id 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          };
        }
        return { items: [...state.items, { ...product, quantity }] };
      }),
      
      removeFromCart: (productId) => set((state) => ({
        items: state.items.filter(item => item.id !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: state.items.filter(item => item.id !== productId) };
        }
        return {
          items: state.items.map(item => 
            item.id === productId ? { ...item, quantity } : item
          )
        };
      }),
      
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'novacart-cart',
    }
  )
);

export const useCartTotal = () => useCartStore(state => {
  console.log("Cart items for total calculation:", state.items);
  return state.items.reduce((total, item) => total + ((item.discountPrice || item.price) * item.quantity), 0);
});

export const useCartCount = () => useCartStore(state =>
  state.items.reduce((total, item) => total + item.quantity, 0)
);
