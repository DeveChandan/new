const { User, Worker, Employer, Admin } = require('../models/User.js');
const mongoose = require('mongoose');
const Job = require('../models/Job.js');
const Otp = require('../models/Otp');
const Conversation = require('../models/Conversation');
const WorkLog = require('../models/WorkLog');
const Document = require('../models/Document.js');
const Application = require('../models/Application.js');
const Rating = require('../models/Rating.js');
const jwt = require('jsonwebtoken');
const recommendationService = require('../services/recommendationService');
const { geocodeAddress } = require('../services/geolocationService');
const { sendOTP } = require('../utils/fast2smsService');
const { getLocale } = require('../utils');
const { translateUser, translateRating, translateJob } = require('../services/translationService');
const { plans } = require('../services/subscriptionService');

const checkMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }
    const user = await User.findOne({ mobile });
    if (user) {
      return res.json({ exists: true, role: user.role, message: `This number is already registered as ${user.role === 'employer' ? 'an employer' : 'a worker'}.` });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error('Error in checkMobile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper to set cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Use 'none' for cross-site in production if needed, or 'lax' for local
  };
  res.cookie('access_token', token, cookieOptions);
};

const registerUser = async (req, res) => {
  const { name, email, password, role, mobile, profilePicture, skills, experience, availability, languages, documents, bankDetails, companyName, businessType, gstNumber } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Use role-specific discriminator model
  const UserModel = role === 'worker' ? Worker : role === 'employer' ? Employer : Admin;
  const user = await UserModel.create({ name, email, password, mobile, profilePicture, skills, experience, availability, languages, documents, bankDetails, companyName, businessType, gstNumber });

  if (user) {
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

const initiateRegistration = async (req, res) => {
  try {
    console.log('Initiate Registration Request Body:', JSON.stringify(req.body, null, 2));
    const { name, email, password, role, mobile, workerType, isFresher, gender } = req.body;
    if (!name || !role || !mobile) {
      console.log('Missing basic fields');
      return res.status(400).json({ message: 'Please enter name, role, and mobile number' });
    }

    // Email and password are required for employers, optional for workers
    if (role === 'employer' && (!email || !password)) {
      return res.status(400).json({ message: 'Email and password are required for employers' });
    }

    if (role === 'worker' && (!workerType || workerType.length === 0)) {
      console.log('Missing workerType');
      return res.status(400).json({ message: 'Worker type is required for workers' });
    }
    if (role === 'worker' && !gender) {
      console.log('Missing gender');
      return res.status(400).json({ message: 'Gender is required for workers' });
    }
    if (role === 'worker' && !isFresher && (req.body.experience === undefined || req.body.experience === null)) {
      console.log('Missing experience for experienced worker');
      return res.status(400).json({ message: 'Experience is required for experienced workers' });
    }

    if (email) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: 'User with this mobile number already exists' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await Otp.create({ mobile, otp, registrationData: req.body });

      // Send OTP via Fast2SMS
      const result = await sendOTP(mobile, otp);

      if (result.development) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Development OTP for ${mobile}: ${otp}`);
        }
        res.status(200).json({ message: 'OTP sent successfully (logged to console for development)' });
      } else if (result.success) {
        res.status(200).json({ message: 'OTP sent successfully' });
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Development OTP for ${mobile}: ${otp}`);
        }
        res.status(200).json({ message: 'OTP sent (logged to console, Fast2SMS unavailable)' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to initiate registration and send OTP' });
    }
  } catch (err) {
    console.error('Unexpected error in initiateRegistration:', err);
    res.status(500).json({ message: 'Server error during registration initiation' });
  }
};

const completeRegistration = async (req, res) => {
  const { mobile, otp } = req.body;
  try {
    const otpDoc = await Otp.findOne({ mobile, otp });
    if (!otpDoc || !otpDoc.registrationData) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    const {
      name, email, password, role, profilePicture, skills,
      experience, experienceMonths, hourlyRate, availability,
      languages, documents, bankDetails, companyName,
      businessType, gstNumber, workerType, isFresher, gender,
      companyDetails, currentJobTitle, currentCompany, currentSalary
    } = otpDoc.registrationData;

    let queryOptions = [{ mobile }];
    if (email && email.trim() !== '') {
      queryOptions.push({ email });
    }
    const userExists = await User.findOne({ $or: queryOptions });
    if (userExists) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: 'User already exists with this email or mobile' });
    }

    // Use role-specific discriminator model
    const UserModel = role === 'worker' ? Worker : role === 'employer' ? Employer : Admin;

    // Calculate total experience in years (e.g., 2.5 for 2 years 6 months)
    const totalExperience = isFresher ? 0 : (parseFloat(experience) || 0) + ((parseFloat(experienceMonths) || 0) / 12);

    const userData = {
      name, mobile, profilePicture, skills,
      hourlyRate, availability, languages, documents, bankDetails,
      companyName: companyName || (role === 'employer' ? name : undefined),
      businessType, gstNumber, workerType, isFresher
    };

    if (email && email.trim() !== '') {
      userData.email = email;
    } else {
      delete userData.email;
    }

    if (password && password.trim() !== '') {
      userData.password = password;
    }

    if (role === 'worker') {
      userData.experience = Math.max(0, totalExperience);
      userData.currentJobTitle = currentJobTitle;
      userData.currentCompany = currentCompany;
      userData.currentSalary = currentSalary;
      userData.gender = gender;
    }

    if (role === 'employer') {
      userData.companyDetails = companyDetails;
    }

    const user = await UserModel.create(userData);

    await Otp.deleteOne({ _id: otpDoc._id });
    if (user) {
      if (user.role === 'worker') {
        recommendationService.findAndNotifyEmployers(user);
      }
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, companyName: user.companyName, token });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to complete registration' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, companyName: user.companyName, token });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate('subscription');
  if (user) {
    const documents = await Document.find({ user: user._id });
    const userObject = user.toObject();
    userObject.documents = documents;

    const locale = getLocale(req);
    const finalUser = locale !== 'en' ? await translateUser(userObject, locale) : userObject;

    res.json(finalUser);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name !== undefined ? req.body.name : user.name;
    user.email = req.body.email !== undefined ? req.body.email : user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    user.profilePicture = req.body.profilePicture !== undefined ? req.body.profilePicture : user.profilePicture;
    user.skills = req.body.skills !== undefined ? req.body.skills : user.skills;
    user.experience = req.body.experience !== undefined ? Math.max(0, parseFloat(req.body.experience) || 0) : user.experience;
    user.hourlyRate = req.body.hourlyRate !== undefined ? req.body.hourlyRate : user.hourlyRate;
    user.availability = req.body.availability !== undefined ? req.body.availability : user.availability;
    user.languages = req.body.languages !== undefined ? req.body.languages : user.languages;
    user.locationName = req.body.locationName !== undefined ? req.body.locationName : user.locationName;
    if (req.body.locationName) {
      const location = await geocodeAddress(req.body.locationName);
      if (location) {
        user.location = location;
      }
    }
    if (req.body.documents !== undefined) {
      user.documents = req.body.documents;
    }
    user.bankDetails = req.body.bankDetails !== undefined ? req.body.bankDetails : user.bankDetails;
    user.companyName = req.body.companyName !== undefined ? req.body.companyName : user.companyName;
    user.businessType = req.body.businessType !== undefined ? req.body.businessType : user.businessType;
    user.gstNumber = req.body.gstNumber !== undefined ? req.body.gstNumber : user.gstNumber;

    if (user.role === 'employer' && req.body.companyDetails) {
      // Convert existing Mongoose subdoc to plain object and merge with incoming data
      const existing = user.companyDetails?.toObject ? user.companyDetails.toObject() : (user.companyDetails || {});
      const merged = { ...existing, ...req.body.companyDetails };
      // Strip undefined and null values to prevent Mongoose CastError
      const cleanDetails = Object.fromEntries(
        Object.entries(merged).filter(([_, v]) => v !== undefined && v !== null)
      );
      user.companyDetails = cleanDetails;
    }

    user.workerType = req.body.workerType !== undefined ? req.body.workerType : user.workerType;
    user.isFresher = req.body.isFresher !== undefined ? req.body.isFresher : user.isFresher;
    user.gender = req.body.gender !== undefined ? req.body.gender : user.gender;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

    if (user.isFresher) {
      user.experience = 0;
    }
    const updatedUser = await user.save();
    const token = generateToken(updatedUser._id);
    setTokenCookie(res, token);
    res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, companyName: updatedUser.companyName, token });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const getWorkerDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }
    const appliedJobs = await Application.find({ worker: req.user._id }).populate({ path: 'job', select: 'title employer', populate: { path: 'employer', select: 'name companyName' } }).sort({ appliedDate: -1 });

    const validAppliedJobs = appliedJobs.filter(app => app.job);

    const activeApplications = validAppliedJobs.filter(app => app.status === 'pending' || app.status === 'approved').length;
    const hiringRequests = validAppliedJobs.filter(app => app.status === 'offered').length;

    // Count jobs where worker is assigned and currently in-progress
    const assignedJobs = await Job.countDocuments({
      'workers': {
        $elemMatch: {
          workerId: req.user._id,
          status: 'in-progress'
        }
      }
    });
    const appliedJobIds = validAppliedJobs.map(app => app.job._id);

    let recommendedJobsQuery = {
      _id: { $nin: appliedJobIds },
      status: { $in: ['open', 'in-progress'] } // Only recommend active jobs
    };

    let recommendedJobs = [];

    // Only fetch recommendations if worker has a defined workerType
    // This strictly filters by role and prevents mismatched skills from bypassing workerType
    if (user.workerType && user.workerType.length > 0) {
      recommendedJobsQuery.workerType = { $in: user.workerType };

      // Try geospatial query if user has location
      if (user.location && user.location.coordinates && user.location.coordinates.length === 2) {
        try {
          const geoQuery = {
            ...recommendedJobsQuery,
            location: {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: user.location.coordinates,
                },
                $maxDistance: 50000, // 50km
              },
            },
          };

          recommendedJobs = await Job.find(geoQuery)
            .populate('employer', 'name companyName')
            .limit(5);
        } catch (geoError) {
          // Fallback to non-geospatial query if index is missing
          console.warn('Geospatial query failed, falling back to non-geospatial query:', geoError.message);

          recommendedJobs = await Job.find(recommendedJobsQuery)
            .populate('employer', 'name companyName')
            .limit(5);
        }
      } else {
        // No location data, use regular query
        recommendedJobs = await Job.find(recommendedJobsQuery)
          .populate('employer', 'name companyName')
          .limit(5);
      }
    }

    const recentApplications = validAppliedJobs.map(app => ({
      _id: app.job._id,
      applicationId: app._id,
      title: app.job.title,
      employer: app.job.employer,
      status: app.status,
      appliedDate: app.appliedDate
    }));

    // Calculate actual worker earnings from completed jobs
    const completedJobs = await Job.find({
      'workers.workerId': req.user._id,
      status: 'closed',
    }).select('salary');
    const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.salary || 0), 0);

    const Notification = require('../models/Notification');
    const messageCount = await Notification.countDocuments({ userId: user._id, type: 'new_message', isRead: false });

    // Translation
    const locale = getLocale(req);
    if (locale !== 'en') {
      recommendedJobs = await Promise.all(
        recommendedJobs.map(job => translateJob(job, locale))
      );
    }

    res.json({ activeApplications, assignedJobs, hiringRequests, recommendedJobs, recentApplications, totalEarnings, messages: messageCount });
  } catch (error) {
    console.error('Error in getWorkerDashboard:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getEmployerDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('role');
    if (!user || user.role !== 'employer') {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const employerJobIdsResponse = await Job.find({ employer: user._id }).select('_id');
    const employerJobIds = employerJobIdsResponse.map(job => job._id);

    // If employer has no jobs, return early with zeros
    if (employerJobIds.length === 0) {
      return res.json({
        activeJobs: 0,
        totalApplicants: 0,
        openApplications: 0,
        closedApplications: 0,
        hireRequests: 0,
        totalLifetimeHireRequests: 0,
        hires: 0,
        recentApplications: []
      });
    }

    const [
      activeJobs,
      totalApplicants,
      openApplications,
      closedApplications,
      hireRequests,
      totalLifetimeHireRequests,
      hiredApplications,
      recentApplications
    ] = await Promise.all([
      Job.countDocuments({ employer: user._id, status: { $in: ['open', 'in-progress'] } }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: { $in: ['pending', 'approved', 'rejected', 'hired'] } }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: 'pending' }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: { $in: ['reject', 'offerRejected'] } }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: 'offered' }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: { $in: ['offered', 'offerAccepted', 'rejected'] } }),
      Application.find({ job: { $in: employerJobIds }, status: { $in: ['hired', 'offerAccepted'] } }).select('worker'),
      Application.find({ job: { $in: employerJobIds } })
        .populate('worker', 'name email availability')
        .populate('job', 'title')
        .sort({ appliedDate: -1 })
        .limit(5)
    ]);

    const hiredWorkerIds = new Set(hiredApplications.map(app => app.worker.toString()));
    const hires = hiredWorkerIds.size;

    res.json({
      activeJobs,
      totalApplicants,
      openApplications,
      closedApplications,
      hireRequests,
      totalLifetimeHireRequests,
      hires,
      recentApplications
    });
  } catch (error) {
    console.error("Error in getEmployerDashboard:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const searchWorkers = async (req, res) => {
  const { keyword, skills, location, availability, workerType, jobId } = req.query;
  const query = { role: 'worker' };

  // Debug Log
  console.log("SearchWorkers requested with JobID:", jobId);



  try {
    // If jobId is provided, prioritize job-based recommendations
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        // 1. Worker Type Match (Exact)
        if (job.workerType && job.workerType.length > 0) {
          query.workerType = { $in: job.workerType };
        }

        // 2. Location Match - REMOVED per user request
        // User wants recommendations based PURELY on workerType and skills
        // if (job.location && job.location.coordinates && job.location.coordinates.length === 2) { ... }

        // 3. Skills Match (Optional/Partial)
        // Find workers who have AT LEAST ONE of the required skills
        if (job.skills && job.skills.length > 0) {
          query.skills = { $in: job.skills };
        }
      }
    }
  } catch (err) {
    console.error("Error applying job-based filters:", err);
    // Continue with basic search if job fetch fails
  }

  if (keyword) {
    query.name = { $regex: keyword, $options: 'i' };
  }
  if (skills) {
    query.skills = { $in: skills.split(',') };
  }
  if (location) {
    query.locationName = { $regex: location, $options: 'i' };
  }
  if (availability) {
    query.availability = availability;
  }
  if (workerType) {
    query.workerType = workerType;
  }
  try {
    const workers = await User.find(query).select('-password');

    // Fetch review counts for all found workers
    const workersWithReviewCount = await Promise.all(workers.map(async (worker) => {
      const workerObj = worker.toObject();
      const reviewCount = await Rating.countDocuments({ user: worker._id });
      workerObj.reviews = Array.from({ length: reviewCount }); // Fake array to allow .length to work on frontend, or just add reviewCount
      workerObj.reviewCount = reviewCount;
      return workerObj;
    }));

    const locale = getLocale(req);
    const finalWorkers = locale !== 'en'
      ? await Promise.all(workersWithReviewCount.map(w => translateUser(w, locale)))
      : workersWithReviewCount;

    res.json(finalWorkers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.toString() });
  }
};

const getPublicUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('subscription');

    if (user) {
      let userObject = user.toObject();
      const documents = await Document.find({ user: user._id });
      userObject.documents = documents;

      const reviewCount = await Rating.countDocuments({ user: user._id });
      userObject.reviews = Array.from({ length: reviewCount });
      userObject.reviewCount = reviewCount;

      // Check if the requester is the user themselves or an admin
      const isSelf = req.user._id.toString() === user._id.toString();
      const isAdmin = req.user.role === 'admin';

      const locale = getLocale(req);

      if (isSelf || isAdmin) {
        const finalUser = locale !== 'en' ? await translateUser(userObject, locale) : userObject;
        res.json(finalUser);
        return;
      }

      // If user is an employer, check if they have unlocked this profile
      if (req.user.role === 'employer') {
        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findOne({
          employer: req.user._id,
          status: 'active',
          endDate: { $gte: new Date() }
        });

        const isUnlocked = subscription && subscription.unlockedWorkers && subscription.unlockedWorkers.some(id => id.toString() === user._id.toString());

        if (isUnlocked) {
          const finalUser = locale !== 'en' ? await translateUser(userObject, locale) : userObject;
          res.json(finalUser);
          return;
        }
      }

      // If not self, admin, or unlocked employer, hide sensitive contact info
      delete userObject.mobile;
      delete userObject.email;
      delete userObject.documents; // Hide documents too if strictly private
      // Keep name, skills, experience, location, etc.

      const finalUser = locale !== 'en' ? await translateUser(userObject, locale) : userObject;
      res.json(finalUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getPublicUserProfile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getEmployerAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('role');
    if (!user || user.role !== 'employer') {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const jobs = await Job.find({ employer: user._id });
    const employerJobIds = jobs.map(job => job._id);

    if (employerJobIds.length === 0) {
      return res.json({
        activeJobs: 0,
        totalApplicants: 0,
        openApplications: 0,
        closedApplications: 0,
        hireRequests: 0,
        totalLifetimeHireRequests: 0,
        hires: 0,
        totalSpent: 0,
        hiresBySkill: [],
        jobBreakdown: []
      });
    }

    const [
      activeJobsCount,
      totalApplicants,
      openApplications,
      closedApplications,
      hireRequests,
      totalLifetimeHireRequests,
      hiredApplications,
      totalSpentResult,
      hiresBySkill,
      applicationStatsByJob
    ] = await Promise.all([
      Job.countDocuments({ employer: user._id, status: { $in: ['open', 'in-progress'] } }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: { $in: ['pending', 'approved', 'rejected', 'hired'] } }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: 'pending' }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: 'rejected' }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: 'offered' }),
      Application.countDocuments({ job: { $in: employerJobIds }, status: { $in: ['offered', 'offerAccepted', 'offerRejected'] } }),
      Application.find({ job: { $in: employerJobIds }, status: { $in: ['hired', 'offerAccepted'] } }).select('worker'),
      Job.aggregate([
        { $match: { employer: user._id } },
        { 
          $project: { 
            salary: 1, 
            workType: 1, 
            durationDays: 1,
            status: 1,
            completedWorkers: {
              $filter: {
                input: { $ifNull: ["$workers", []] },
                as: "worker",
                cond: { 
                  $or: [
                    { $eq: ["$$worker.status", "completed"] },
                    { $in: ["$status", ["completed", "done"]] }
                  ]
                }
              }
            }
          } 
        },
        { $unwind: { path: "$completedWorkers", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  "$salary",
                  { $cond: [{ $eq: ["$workType", "temporary"] }, { $ifNull: ["$durationDays", 1] }, 1] }
                ]
              }
            }
          }
        }
      ]),
      Application.aggregate([
        { $match: { job: { $in: employerJobIds }, status: { $in: ['hired', 'offerAccepted'] } } },
        { $lookup: { from: 'users', localField: 'worker', foreignField: '_id', as: 'workerInfo' } },
        { $unwind: '$workerInfo' },
        { $unwind: '$workerInfo.skills' },
        { $group: { _id: '$workerInfo.skills', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Application.aggregate([
        { $match: { job: { $in: employerJobIds } } },
        {
          $group: {
            _id: '$job',
            applicantCount: { $sum: 1 },
            hireCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['hired', 'offerAccepted']] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const hires = new Set(hiredApplications.map(app => app.worker.toString())).size;
    const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;

    // Create a map for quick lookup of application stats
    const statsMap = applicationStatsByJob.reduce((acc, stat) => {
      acc[stat._id.toString()] = stat;
      return acc;
    }, {});

    const jobBreakdown = jobs.map(job => {
      const stats = statsMap[job._id.toString()] || { applicantCount: 0, hireCount: 0 };
      return {
        _id: job._id,
        title: job.title,
        totalOpenings: job.totalOpenings,
        status: job.status,
        applicants: stats.applicantCount,
        hires: stats.hireCount
      };
    });

    res.json({
      activeJobs: activeJobsCount,
      totalApplicants,
      openApplications,
      closedApplications,
      hireRequests,
      totalLifetimeHireRequests,
      hires,
      totalSpent,
      hiresBySkill,
      jobBreakdown
    });
  } catch (error) {
    console.error("Error in getEmployerAnalytics:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getWorkerCompletedJobs = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const jobs = await Job.find({ 'workers.workerId': userId, 'workers.status': { $in: ['completed', 'in-progress'] } }).populate('employer', 'name companyName').sort({ 'workers.completedAt': -1 }).lean();
    const Rating = require('../models/Rating');
    const jobsWithRatings = await Promise.all(jobs.map(async (job) => {
      const workerEntry = job.workers.find(w => w.workerId.toString() === userId && (w.status === 'completed' || w.status === 'in-progress'));
      if (!workerEntry) return null;
      let rating = await Rating.findOne({ job: job._id, user: userId, ratedBy: job.employer._id }).lean();

      const locale = getLocale(req);
      if (locale !== 'en' && rating) {
        rating = await translateRating(rating, locale);
      }

      const title = locale !== 'en' && job.title ? (await translateJob(job, locale)).title : job.title;

      return { _id: job._id, title: title, employer: { _id: job.employer._id, name: job.employer.name || job.employer.companyName }, status: workerEntry.status, assignedAt: workerEntry.assignedAt, completedAt: workerEntry.completedAt, rating: rating ? { rating: rating.rating, review: rating.review, createdAt: rating.createdAt } : null };
    }));
    const validJobs = jobsWithRatings.filter(job => job !== null);
    res.json(validJobs);
  } catch (error) {
    console.error('Error in getWorkerCompletedJobs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyName, businessType, description, website, foundedYear, employeeCount, address, contactPerson, documents, isProfileComplete } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can update company profile' });
    }
    // Update top-level employer fields
    if (companyName) user.companyName = companyName;
    if (businessType) user.businessType = businessType;
    // Update nested companyDetails
    user.companyDetails = { ...user.companyDetails, description: description || user.companyDetails?.description, website: website || user.companyDetails?.website, foundedYear: foundedYear || user.companyDetails?.foundedYear, employeeCount: employeeCount || user.companyDetails?.employeeCount, address: address ? { ...user.companyDetails?.address, ...address } : user.companyDetails?.address, contactPerson: contactPerson ? { ...user.companyDetails?.contactPerson, ...contactPerson } : user.companyDetails?.contactPerson, documents: documents ? { ...user.companyDetails?.documents, ...documents } : user.companyDetails?.documents, isProfileComplete: isProfileComplete !== undefined ? isProfileComplete : user.companyDetails?.isProfileComplete };
    const updatedUser = await user.save();
    res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, companyName: updatedUser.companyName, businessType: updatedUser.businessType, companyDetails: updatedUser.companyDetails });
  } catch (error) {
    console.error('Error in updateCompanyProfile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { userId, planType } = req.body;
    const Subscription = require('../models/Subscription');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    let subscription = await Subscription.findOne({ employer: userId });
    const selectedPlan = plans[planType];
    if (!selectedPlan) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    if (subscription) {
      subscription.planType = planType;
      subscription.maxActiveJobs = selectedPlan.maxActiveJobs;
      subscription.maxDatabaseUnlocks = selectedPlan.maxDatabaseUnlocks;
      subscription.price = selectedPlan.price;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedPlan.duration);
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = 'active';
      await subscription.save();
    } else {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedPlan.duration);
      subscription = await Subscription.create({
        employer: userId,
        planType,
        maxActiveJobs: selectedPlan.maxActiveJobs,
        maxDatabaseUnlocks: selectedPlan.maxDatabaseUnlocks,
        price: selectedPlan.price,
        startDate,
        endDate,
        status: 'active'
      });
    }
    res.json(subscription);
  } catch (error) {
    console.error('Error in updateSubscription:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};



// Unlock worker profile (costs 1 database unlock)
const unlockWorkerProfile = async (req, res) => {
  try {
    const workerId = req.params.id;
    const subscription = req.subscription;

    const isAlreadyUnlocked = subscription.unlockedWorkers && subscription.unlockedWorkers.some(id => id.toString() === workerId);
    let updatedSubscription = subscription;

    if (!isAlreadyUnlocked) {
      const Subscription = require('../models/Subscription');
      // Atomic update with strict size limits to prevent double-charging or surpassing limit
      updatedSubscription = await Subscription.findOneAndUpdate(
        {
          _id: subscription._id,
          unlockedWorkers: { $ne: workerId },
          $expr: { $lt: ["$databaseUnlocksUsed", "$maxDatabaseUnlocks"] }
        },
        {
          $inc: { databaseUnlocksUsed: 1 },
          $push: { unlockedWorkers: workerId }
        },
        { new: true }
      );

      if (!updatedSubscription) {
        // Concurrency catch: did it fail because max was reached, or because another concurrent request just unlocked them?
        updatedSubscription = await Subscription.findById(subscription._id);
        if (!updatedSubscription.unlockedWorkers.some(id => id.toString() === workerId)) {
          return res.status(403).json({ message: 'Database unlock limit reached. Please upgrade your plan.' });
        }
      }
    }

    // Get full worker profile with contact details
    const worker = await User.findById(workerId)
      .select('+mobile +email') // Include normally hidden fields
      .populate('completedJobs');

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.status(200).json({
      worker,
      unlocksRemaining: updatedSubscription.maxDatabaseUnlocks - updatedSubscription.databaseUnlocksUsed,
      unlocksUsed: updatedSubscription.databaseUnlocksUsed,
      maxUnlocks: updatedSubscription.maxDatabaseUnlocks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePushToken = async (req, res) => {
  const { pushToken } = req.body;

  if (!pushToken) {
    return res.status(400).json({ message: 'Push token is required' });
  }

  try {
    // SECURITY FIX: Remove this push token from ANY other user record to ensure uniqueness.
    const unsetResult = await User.updateMany(
        { pushToken, _id: { $ne: req.user._id } },
        { $unset: { pushToken: 1 } }
    );
    if (unsetResult.modifiedCount > 0) {
        console.log(`[UserController] Push token ${pushToken.substring(0, 10)}... was unset from ${unsetResult.modifiedCount} other users`);
    }

    // Update the current user's token
    await User.findByIdAndUpdate(req.user._id, { pushToken });
    
    res.json({ message: 'Push token updated successfully' });
  } catch (error) {
    console.error('Error updating push token:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const changePassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const logoutUser = async (req, res) => {
  res.cookie('access_token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  checkMobile,
  registerUser,
  initiateRegistration,
  completeRegistration,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getWorkerDashboard,
  getEmployerDashboard,
  searchWorkers,
  getPublicUserProfile,
  getEmployerAnalytics,
  getWorkerCompletedJobs,
  updateCompanyProfile,
  updateSubscription,
  unlockWorkerProfile,
  updatePushToken,
  changePassword
};
