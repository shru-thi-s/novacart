import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const client = new OAuth2Client(); // Will use CLIENT_ID from env if needed, but since frontend sends token, we just verify it.

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation failed for registration:", errors.array());
    return res.status(400).json({ 
      message: errors.array().map(e => e.msg).join(', '),
      errors: errors.array() 
    });
  }

  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      const responsePayload = {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user.id),
      };
      console.log('Sending Registration Success Response (201):', responsePayload);
      res.status(201).json(responsePayload);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("=== LOGIN ATTEMPT ===");
  console.log("Email:", email, "Password Length:", password?.length);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Result: User not found in DB");
      return res.status(401).json({ message: 'Invalid email or password (user not found)' });
    }
    if (!user.password) {
      console.log("Result: User has no password (Google OAuth user?)");
      return res.status(401).json({ message: 'Invalid email or password (no password set)' });
    }

    console.log("User found:", user.email, "Hash:", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Bcrypt Match Result:", isMatch);

    if (isMatch) {
      const responsePayload = {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user.id),
      };
      console.log("Result: Success! Returning token (200):", responsePayload);
      res.json(responsePayload);
    } else {
      console.log("Result: Password mismatch!");
      res.status(401).json({ message: 'Invalid email or password (mismatch)' });
    }
  } catch (error) {
    console.error("Result: Server Error", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const googleAuth = async (req, res) => {
  const { googleToken } = req.body;
  if (!googleToken) {
    return res.status(400).json({ message: 'No googleToken provided' });
  }

  try {
    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      // audience: process.env.GOOGLE_CLIENT_ID, // Specify if you enforce audience
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create user without password
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        role: 'customer' // default
      });
    } else if (!user.googleId) {
      // Link Google ID if user exists with email but no Google ID
      user.googleId = googleId;
      user.avatar = user.avatar || avatar;
      await user.save();
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google token', error: error.message });
  }
};

export const getMe = async (req, res) => {
  // req.user is populated by protect middleware
  res.json({
    _id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
  });
};
