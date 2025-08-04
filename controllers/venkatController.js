import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Employee from '../schema/Employee.js';

// Hardcoded venkat credentials
const VENKAT_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_USERNAME
};

// Venkat login
export const venkatLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username !== VENKAT_CREDENTIALS.username || password !== VENKAT_CREDENTIALS.password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { username, isVenkat: true },
      process.env.JWT_SECRET || 'your-secret-key-2024',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token,
      user: { username }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select('-password -managerEmailConfig.appPassword') // Hide sensitive data
      .sort({ createdAt: -1 });
    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add new employee
export const addEmployee = async (req, res) => {
  try {
    const { 
      empId, 
      password, 
      name, 
      team, 
      email, 
      isDeliveryManager = false,
      managerEmail = '',
      managerAppPassword = ''
    } = req.body;
    
    // Validate required fields
    if (!empId || !password || !name || !team || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'All basic fields are required' 
      });
    }

    // Validate delivery manager fields
    if (team === 'Delivery' && isDeliveryManager) {
      if (!managerEmail || !managerAppPassword) {
        return res.status(400).json({
          success: false,
          error: 'Manager email and app password are required for delivery managers'
        });
      }

      // Check if delivery manager already exists
      const existingManager = await Employee.findOne({
        team: 'Delivery',
        isDeliveryManager: true,
        isActive: true
      });

      if (existingManager) {
        return res.status(400).json({
          success: false,
          error: 'A delivery manager already exists. Please deactivate current manager first.'
        });
      }
    }
    
    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ 
      $or: [{ empId }, { email }] 
    });
    
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        error: 'Employee with this ID or email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Prepare employee data
    const employeeData = {
      empId,
      password: hashedPassword,
      name,
      team,
      email,
      isActive: true,
      canSendEmail: team === 'Delivery' && isDeliveryManager, // Only delivery managers can send emails
      isDeliveryManager: team === 'Delivery' ? isDeliveryManager : false
    };

    // Add manager email config for delivery managers
    if (team === 'Delivery' && isDeliveryManager) {
      employeeData.managerEmailConfig = {
        email: managerEmail,
        appPassword: managerAppPassword
      };
    }
    
    // Create new employee
    const employee = new Employee(employeeData);
    await employee.save();
    
    // Return without sensitive data
    const { password: _, managerEmailConfig, ...employeeResponse } = employee.toObject();
    
    // Include manager email (not password) in response
    if (managerEmailConfig && managerEmailConfig.email) {
      employeeResponse.managerEmail = managerEmailConfig.email;
    }
    
    res.status(201).json({ 
      success: true,
      message: 'Employee created successfully',
      employee: employeeResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Toggle employee active status
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const { empId } = req.params;
    
    const employee = await Employee.findOne({ empId });
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    employee.isActive = !employee.isActive;
    
    // If deactivating a delivery manager, also remove email permission
    if (!employee.isActive && employee.isDeliveryManager) {
      employee.canSendEmail = false;
    }
    
    // If activating a delivery manager, restore email permission
    if (employee.isActive && employee.isDeliveryManager) {
      employee.canSendEmail = true;
    }
    
    await employee.save();
    
    const { password: _, managerEmailConfig, ...employeeData } = employee.toObject();
    
    res.json({ 
      success: true,
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
      employee: employeeData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    
    const employee = await Employee.findOneAndDelete({ empId });
    
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Employee deleted successfully',
      deletedEmployee: { empId, name: employee.name }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get delivery manager credentials (for email sending)
export const getDeliveryManagerCredentials = async (req, res) => {
  try {
    const manager = await Employee.findOne({
      team: 'Delivery',
      isDeliveryManager: true,
      isActive: true,
      canSendEmail: true
    }).select('managerEmailConfig name empId');

    if (!manager || !manager.managerEmailConfig) {
      return res.status(404).json({
        success: false,
        error: 'No active delivery manager found'
      });
    }

    res.json({
      success: true,
      credentials: {
        email: manager.managerEmailConfig.email,
        appPassword: manager.managerEmailConfig.appPassword,
        name: manager.name,
        empId: manager.empId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};