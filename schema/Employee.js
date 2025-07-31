import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  team: {
    type: String,
    required: true,
    enum: ['L&D', 'HR', 'Hareesh', 'HR Tag', 'Admin', 'HR Ops', 'IT', 'Delivery']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  email: {
    type: String,
    trim: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  // New email permission fields
  canSendEmail: {
    type: Boolean,
    default: false
  },
  // Only for Delivery team managers
  isDeliveryManager: {
    type: Boolean,
    default: false
  },
  // Manager's email credentials (only for Delivery managers)
  managerEmailConfig: {
    email: {
      type: String,
      trim: true
    },
    appPassword: {
      type: String
    }
  }
}, {
  timestamps: true
});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;