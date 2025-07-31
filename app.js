import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { setupMiddleware } from './middleware/index.js';
import routes from './routes/index.js';

// Load .env file
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;

// Setup middleware
setupMiddleware(app);

// Setup routes
app.use('/', routes);

// Start everything
const start = async () => {
  try {
    console.log('🔄 Starting VDart Portal Server...');
    
    await connectDB();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server successfully running on http://localhost:${PORT}`);
      console.log(`🌐 Also accessible at: http://127.0.0.1:${PORT}`);
      console.log(`🔗 Test URL: http://localhost:${PORT}/`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

start();