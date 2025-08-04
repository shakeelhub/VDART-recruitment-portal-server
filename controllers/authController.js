import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Employee from '../schema/Employee.js';

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
};

// Login API
export const login = async (req, res) => {
  try {
    const { empId, password } = req.body;
    const clientIP = getClientIP(req);

    // Validation
    if (!empId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Password are required'
      });
    }

    // Find employee
    const employee = await Employee.findOne({ empId: empId.trim() });
        
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Employee ID or Password'
      });
    }

    // 🔒 CHECK IF ACCOUNT IS LOCKED
    if (employee.isLocked) {
      const lockTimeRemaining = Math.ceil((employee.lockedUntil - Date.now()) / 1000 / 60); // minutes
      return res.status(423).json({ // 423 = Locked
        success: false,
        message: `Account is locked due to multiple failed attempts. Try again in ${lockTimeRemaining} minutes.`,
        isLocked: true,
        lockedUntil: employee.lockedUntil,
        timeRemaining: lockTimeRemaining
      });
    }

    // CHECK IF EMPLOYEE IS ACTIVE
    if (!employee.isActive) {
      // Still count as failed attempt for inactive accounts
      await employee.incFailedAttempts(clientIP);
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, employee.password);
        
    if (!isValidPassword) {
      // 🔒 INCREMENT FAILED ATTEMPTS
      await employee.incFailedAttempts(clientIP);
      
      // Reload employee to get updated failedAttempts count
      const updatedEmployee = await Employee.findById(employee._id);
      
      let message = 'Invalid Employee ID or Password';
      let additionalInfo = {};
      
      // Provide attempt warnings
      if (updatedEmployee.failedAttempts >= 5) {
        const lockTimeRemaining = Math.ceil((updatedEmployee.lockedUntil - Date.now()) / 1000 / 60);
        message = `Account locked due to multiple failed attempts. Try again in ${lockTimeRemaining} minutes.`;
        additionalInfo = {
          isLocked: true,
          lockedUntil: updatedEmployee.lockedUntil,
          timeRemaining: lockTimeRemaining
        };
      } else {
        const attemptsLeft = 5 - updatedEmployee.failedAttempts;
        message = `Invalid Employee ID or Password. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`;
        additionalInfo = {
          attemptsRemaining: attemptsLeft,
          failedAttempts: updatedEmployee.failedAttempts
        };
      }
      
      return res.status(401).json({
        success: false,
        message,
        ...additionalInfo
      });
    }

    // 🔒 SUCCESSFUL LOGIN - RESET FAILED ATTEMPTS
    if (employee.failedAttempts > 0) {
      await employee.resetFailedAttempts();
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        empId: employee.empId,
        team: employee.team,
        name: employee.name 
      },
      process.env.JWT_SECRET || 'vdart-secret-key',
      { expiresIn: '24h' }
    );

    // Success response
    res.json({
      success: true,
      message: `Welcome ${employee.team}!`,
      token,
      employee: {
        empId: employee.empId,
        name: employee.name,
        team: employee.team,
        email: employee.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

// 🔒 NEW: Check lockout status endpoint (for frontend to check)
export const checkLockoutStatus = async (req, res) => {
  try {
    const { empId } = req.params;
    
    const employee = await Employee.findOne(
      { empId: empId.trim() }, 
      'failedAttempts lockedUntil'
    );
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    if (employee.isLocked) {
      const timeRemaining = Math.ceil((employee.lockedUntil - Date.now()) / 1000 / 60);
      return res.json({
        success: true,
        isLocked: true,
        lockedUntil: employee.lockedUntil,
        timeRemaining,
        failedAttempts: employee.failedAttempts
      });
    }
    
    res.json({
      success: true,
      isLocked: false,
      failedAttempts: employee.failedAttempts || 0,
      attemptsRemaining: 5 - (employee.failedAttempts || 0)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};