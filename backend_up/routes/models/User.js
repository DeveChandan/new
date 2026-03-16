const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_AVAILABILITY } = require('../constants/statusEnums');

// ==========================================
// BASE USER SCHEMA (Common fields for all user types)
// ==========================================

const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: false,
    sparse: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: false, // Will be required in discriminators for employer/admin
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: false, // Will be validated in discriminators
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid 10-digit mobile number'
    }
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String,
    // Validation removed to allow relative paths like /uploads/...
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated', 'pending'],
    default: 'active',
  },
  pushToken: {
    type: String,
    select: false // Do not return by default
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: false // Optional for base schema, enforced by controller for workers
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  }
}, baseOptions);

// Indexes for base schema
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ mobile: 1 }, { unique: true });
userSchema.index({ isActive: 1, accountStatus: 1 });

// Pre-save hook for password hashing
// Pre-save hook for password hashing
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance methods
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.bankDetails;
  return obj;
};

// Static methods
userSchema.statics.findActive = function (query = {}) {
  return this.find({ ...query, isActive: true, accountStatus: 'active' });
};

const User = mongoose.model('User', userSchema);

// ==========================================
// WORKER DISCRIMINATOR
// ==========================================

const workerSchema = new mongoose.Schema({
  workerType: {
    type: [{
      type: String,
      enum: {
        values: [
          'Security guards', 'Security Supervisor', 'Housekeepers', 'Facility Manager',
          'Electricians', 'Plumbers', 'Liftman', 'Fireman', 'Gardener', 'Pantry Boy',
          'Nurse', 'Aya', 'Carpenters', 'Welders', 'Electronic mechanic', 'Motor mechanic',
          'Swimming trainer', 'WTP / STP operator', 'Accountant', 'Rajmistri (Masons)',
          'Any skilled/unskilled workers'
        ],
        message: '{VALUE} is not a valid worker type'
      }
    }],
    required: [true, 'At least one worker type is required'],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'At least one worker type is required'
    }
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years'],
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0,
    min: [0, 'Hourly rate cannot be negative'],
    max: [10000, 'Hourly rate seems unrealistic']
  },
  currentJobTitle: {
    type: String,
    trim: true
  },
  currentCompany: {
    type: String,
    trim: true
  },
  currentSalary: {
    type: Number,
    min: [0, 'Salary cannot be negative']
  },
  isFresher: {
    type: Boolean,
    default: false,
  },
  availability: {
    type: String,
    enum: {
      values: ['available', 'unavailable'],
      message: '{VALUE} is not a valid availability status'
    },
    default: 'available',
  },
  locationName: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function (v) {
          if (!v || v.length === 0) return true;
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates format [longitude, latitude]'
      }
    }
  },
  languages: [{
    type: String,
    trim: true
  }],
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Document URL must be valid'
      }
    }
  }],
  bankDetails: {
    accountNumber: {
      type: String,
      select: false,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^\d{9,18}$/.test(v);
        },
        message: 'Invalid account number format'
      }
    },
    ifscCode: {
      type: String,
      uppercase: true,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
        },
        message: 'Invalid IFSC code format'
      }
    },
    bankName: {
      type: String,
      trim: true
    }
  }
});

// Worker-specific indexes
workerSchema.index({ location: '2dsphere' });
workerSchema.index({ availability: 1 });
workerSchema.index({ workerType: 1 });
workerSchema.index({ skills: 1 });

// Worker-specific pre-save hook
workerSchema.pre('save', async function (next) {
  if (this.isFresher) {
    this.experience = 0;
  }

  if (this.location && this.location.coordinates && this.location.coordinates.length === 2) {
    this.location.type = 'Point';
  }

  if (typeof next === 'function') {
    next();
  }
});

const Worker = User.discriminator('worker', workerSchema);

// ==========================================
// EMPLOYER DISCRIMINATOR
// ==========================================

const employerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required for employers'],
    lowercase: true,
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  businessType: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    uppercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
      },
      message: 'Invalid GST number format'
    }
  },
  companyDetails: {
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    website: {
      type: String,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^https?:\/\/.+\..+/.test(v);
        },
        message: 'Invalid website URL'
      }
    },
    foundedYear: {
      type: Number,
      min: [1800, 'Founded year seems too old'],
      max: [new Date().getFullYear(), 'Founded year cannot be in the future']
    },
    employeeCount: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true;
            return /^\d{6}$/.test(v);
          },
          message: 'Invalid pincode format (6 digits required)'
        }
      },
      mapsLink: String
    },
    contactPerson: {
      name: String,
      designation: String,
      phone: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true;
            return /^[6-9]\d{9}$/.test(v);
          },
          message: 'Invalid phone number'
        }
      },
      email: {
        type: String,
        lowercase: true,
        validate: {
          validator: function (v) {
            if (!v) return true;
            return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
          },
          message: 'Invalid email address'
        }
      }
    },
    documents: {
      gstCertificate: String,
      panCard: String
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected'],
        message: '{VALUE} is not a valid verification status'
      },
      default: 'pending',
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  }
});

// Employer-specific indexes
employerSchema.index({ 'companyDetails.verificationStatus': 1 });

const Employer = User.discriminator('employer', employerSchema);

// ==========================================
// ADMIN DISCRIMINATOR
// ==========================================

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required for admins'],
    lowercase: true,
    trim: true
  },
  permissions: [{
    type: String,
    enum: ['manage_users', 'manage_jobs', 'manage_payments', 'view_analytics', 'manage_disputes', 'send_notifications']
  }],
  department: {
    type: String,
    trim: true
  }
});

const Admin = User.discriminator('admin', adminSchema);

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  User,
  Worker,
  Employer,
  Admin
};
