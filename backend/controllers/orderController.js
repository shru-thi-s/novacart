import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Basic server-side validation: recalculate total
    // Note: In a real prod app we'd fetch prices from DB to prevent tampering.
    // Here we just verify the math adds up.
    let calculatedTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = calculatedTotal > 4999 ? 0 : 250;
    calculatedTotal += shippingCost;

    // Allow a small epsilon difference for JS float math
    if (Math.abs(calculatedTotal - totalAmount) > 1) {
      return res.status(400).json({ 
        message: 'Order total mismatch. Anti-tampering check failed.',
        expected: calculatedTotal,
        received: totalAmount
      });
    }

    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
