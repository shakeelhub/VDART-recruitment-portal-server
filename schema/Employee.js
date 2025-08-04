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
  // Email permission fields
  canSendEmail: {
    type: Boolean,
    default: false
  },
  isDeliveryManager: {
    type: Boolean,
    default: false
  },
  managerEmailConfig: {
    email: {
      type: String,
      trim: true
    },
    appPassword: {
      type: String
    }
  },
  
  // 🔒 NEW: LOGIN ATTEMPT SECURITY FIELDS
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  lastAttemptTime: {
    type: Date,
    default: null
  },
  lastAttemptIP: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 🔒 NEW: Virtual field to check if account is currently locked
employeeSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// 🔒 NEW: Method to increment failed attempts
employeeSchema.methods.incFailedAttempts = function(ip) {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockedUntil: 1,
      },
      $set: {
        failedAttempts: 1,
        lastAttemptTime: Date.now(),
        lastAttemptIP: ip
      }
    });
  }
  
  const updates = {
    $inc: {
      failedAttempts: 1
    },
    $set: {
      lastAttemptTime: Date.now(),
      lastAttemptIP: ip
    }
  };
  
  // If we have reached max attempts and it's not locked already, lock it
  if (this.failedAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set.lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
  }
  
  return this.updateOne(updates);
};

// 🔒 NEW: Method to reset failed attempts (on successful login)
employeeSchema.methods.resetFailedAttempts = function() {
  return this.updateOne({
    $unset: {
      failedAttempts: 1,
      lockedUntil: 1,
      lastAttemptTime: 1,
      lastAttemptIP: 1
    }
  });
};

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;