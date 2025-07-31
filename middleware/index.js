import cors from 'cors';
import express from 'express';

export const setupMiddleware = (app) => {
  // Enhanced CORS for React app on port 5173
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://localhost:3000'],
    credentials: true
  }));
  
  app.use(express.json());
};