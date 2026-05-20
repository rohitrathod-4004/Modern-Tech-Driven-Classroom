import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

// We export the class directly or a configured instance
export const genAI = new GoogleGenerativeAI(apiKey);
