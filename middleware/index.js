import cors from 'cors';
import express from 'express';

export const setupMiddleware = (app) => {
  // Enhanced CORS for React app on port 5173
  app.use(cors({
    origin: ['http://localhost:5173','https://comforting-seahorse-c84077.netlify.app'],
    credentials: true
  }));
  
  app.use(express.json());
};