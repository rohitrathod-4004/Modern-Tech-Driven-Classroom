import { Request, Response, RequestHandler } from "express";
import { User } from "../models/User";
import { hashPassword, verifyPassword, generateToken } from "../services/auth/authService";

export const register: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, organization_id } = req.body;

    if (!name || !email || !password || !role) {
       res.status(400).json({ error: "Missing required fields" });
       return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
       res.status(409).json({ error: "User already exists with this email" });
       return;
    }

    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      organization_id,
    });

    const token = generateToken({ userId: newUser.id, role: newUser.role });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("[AuthController] Register Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
       res.status(400).json({ error: "Email and password are required" });
       return;
    }

    const user = await User.findOne({ email });
    if (!user) {
       res.status(401).json({ error: "Invalid credentials" });
       return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
       res.status(401).json({ error: "Invalid credentials" });
       return;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[AuthController] Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
