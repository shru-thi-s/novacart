import { create } from 'zustand';

export const useOrderStore = create((set) => ({
  orders: [],
  
  addOrder: (order) => set((state) => ({
    orders: [
      {
        ...order,
        id: `NOVA-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString()
      },
      ...state.orders
    ]
  })),
}));
