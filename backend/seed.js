import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

dotenv.config();

const mockProducts = [
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 34990,
    discountPrice: 29990,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
    stock: 15,
    rating: 4.8,
    description: "Industry-leading noise cancellation. Features two processors controlling eight microphones for unprecedented noise cancellation and exceptional call quality."
  },
  {
    name: "Minimalist Leather Backpack",
    price: 8999,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
    stock: 24,
    rating: 4.6,
    description: "Handcrafted from premium full-grain leather. Features a padded laptop sleeve, water-resistant lining, and ergonomic shoulder straps for all-day comfort."
  },
  {
    name: "Apple Watch Series 9",
    price: 41900,
    discountPrice: 39900,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1434493789847-2902a52dda8c?auto=format&fit=crop&q=80&w=800",
    stock: 10,
    rating: 4.9,
    description: "Smarter, brighter, mightier. The most powerful chip in Apple Watch ever. A magical new way to use your watch without touching the screen."
  },
  {
    name: "Air Jordan 1 Retro High",
    price: 16995,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=800",
    stock: 5,
    rating: 4.7,
    description: "Familiar but always fresh, the iconic Air Jordan 1 is remastered for today's sneakerhead culture. This Retro High OG version goes all in with premium leather."
  },
  {
    name: "Leica Q2 Digital Camera",
    price: 450000,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&q=80&w=800",
    stock: 2,
    rating: 4.9,
    description: "The Leica Q2 features a newly developed 47.3 megapixel full frame sensor that captures both richly-detailed still pictures and 4K video."
  },
  {
    name: "Essential Cotton T-Shirt",
    price: 1499,
    discountPrice: 999,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
    stock: 100,
    rating: 4.5,
    description: "The perfect everyday tee. Made from 100% organic Peruvian Pima cotton for incredible softness and durability."
  },
  {
    name: "Aesop Resurrection Hand Wash",
    price: 3500,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1629198725622-c84013c713b1?auto=format&fit=crop&q=80&w=800",
    stock: 45,
    rating: 4.8,
    description: "A gentle formulation containing oils of Orange, Rosemary and Lavender to effectively cleanse the hands without drying them out."
  },
  {
    name: "Keychron Q1 Pro Keyboard",
    price: 18500,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=800",
    stock: 8,
    rating: 4.7,
    description: "A fully customizable 75% layout mechanical keyboard with QMK/VIA support, designed with an all-metal CNC machined body."
  },
  {
    name: "Common Projects Achilles",
    price: 35000,
    discountPrice: 28000,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800",
    stock: 12,
    rating: 4.6,
    description: "The definitive luxury sneaker. Features minimal branding save for the signature gold foil serial number stamped on the heel."
  },
  {
    name: "Herman Miller Aeron Chair",
    price: 125000,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=800",
    stock: 0,
    rating: 4.9,
    description: "The benchmark for ergonomic seating. Features 8Z Pellicle suspension material and PostureFit SL back support."
  },
  {
    name: "Oculus Quest 3",
    price: 49990,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800",
    stock: 20,
    rating: 4.8,
    description: "Dive into extraordinary new experiences with our most powerful mixed reality headset yet. Features breakthrough high-resolution color passthrough."
  },
  {
    name: "Patagonia Nano Puff Jacket",
    price: 18500,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800",
    stock: 30,
    rating: 4.7,
    description: "Warm, windproof, water-resistant—the Nano Puff Jacket uses incredibly lightweight and highly compressible 60-g PrimaLoft Gold Insulation."
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    // Clear existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // Insert mock products
    await Product.insertMany(mockProducts);
    console.log('Products seeded successfully');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    await User.create({
      name: 'Admin User',
      email: 'admin@novacart.com',
      password: hashedPassword,
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
    });
    console.log('Admin user seeded successfully');

    console.log('Database seeding completed successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
