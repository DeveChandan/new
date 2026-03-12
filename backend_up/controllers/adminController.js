const { User } = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Rating = require('../models/Rating');
const Document = require('../models/Document');
const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const WorkLog = require('../models/WorkLog');
const Dispute = require('../models/Dispute');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const SupportMessage = require('../models/SupportMessage');
const mongoose = require('mongoose');
const dayjs = require('dayjs'); // Import dayjs

const getAdminDashboard = async (req, res) => {
  console.log('API Hit: getAdminDashboard');
  try {
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const totalEmployers = await User.countDocuments({ role: 'employer' });
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const closedJobs = await Job.countDocuments({ status: 'closed' });
    const pendingUserApprovals = await User.countDocuments({ isVerified: false });
    const pendingJobApprovals = await Job.countDocuments({ isApproved: false });
    const pendingApprovals = pendingUserApprovals + pendingJobApprovals;
    const totalDocuments = await Document.countDocuments();
    const pendingDocuments = await Document.countDocuments({ status: 'pending' });
    const activeWorklogs = await WorkLog.countDocuments({ status: { $in: ['pending', 'assigned', 'in-progress'] } });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    // Total revenue
    const totalRevenue = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Calculate User Growth (current month vs previous month)
    const currentMonthStart = dayjs().startOf('month').toDate();
    const previousMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const previousMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const currentMonthUsers = await User.countDocuments({
      createdAt: { $gte: currentMonthStart }
    });

    const previousMonthUsers = await User.countDocuments({
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
    });

    const userGrowthPercent = previousMonthUsers > 0
      ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
      : currentMonthUsers > 0 ? 100 : 0;

    // Calculate Revenue Growth (current month vs previous month)
    const currentMonthRevenue = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const previousMonthRevenue = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const currentRevenue = currentMonthRevenue.length > 0 ? currentMonthRevenue[0].total : 0;
    const previousRevenue = previousMonthRevenue.length > 0 ? previousMonthRevenue[0].total : 0;

    const revenueGrowthPercent = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0 ? 100 : 0;

    // Fetch Recent Activities (last 20 items)
    const recentActivities = [];

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt')
      .lean();

    recentUsers.forEach(user => {
      recentActivities.push({
        type: 'user_registration',
        user: { name: user.name, role: user.role },
        timestamp: user.createdAt
      });
    });

    // Get recent job postings
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('employer', 'name companyName')
      .select('title employer createdAt')
      .lean();

    recentJobs.forEach(job => {
      recentActivities.push({
        type: 'job_posted',
        job: {
          title: job.title,
          employer: job.employer?.companyName || job.employer?.name || 'Unknown'
        },
        timestamp: job.createdAt
      });
    });

    // Get recent completed jobs
    const completedJobs = await Job.find({ status: 'closed' })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('title updatedAt')
      .lean();

    completedJobs.forEach(job => {
      recentActivities.push({
        type: 'job_completed',
        job: { title: job.title },
        timestamp: job.updatedAt
      });
    });

    // Get recent payments
    const recentPayments = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('subscription', 'plan')
      .populate('employer', 'name companyName')
      .select('totalAmount subscription employer createdAt')
      .lean();

    recentPayments.forEach(invoice => {
      recentActivities.push({
        type: 'payment_received',
        payment: {
          amount: invoice.totalAmount,
          plan: invoice.subscription?.plan || 'Subscription',
          employer: invoice.employer?.companyName || invoice.employer?.name || 'Unknown'
        },
        timestamp: invoice.createdAt
      });
    });

    // Get recent documents
    const recentDocuments = await Document.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('user', 'name')
      .select('documentType user createdAt')
      .lean();

    recentDocuments.forEach(doc => {
      recentActivities.push({
        type: 'document_uploaded',
        document: {
          type: doc.documentType,
          user: doc.user?.name || 'Unknown User'
        },
        timestamp: doc.createdAt
      });
    });

    // Get recent disputes
    const recentDisputes = await Dispute.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .populate('job', 'title')
      .select('job createdAt')
      .lean();

    recentDisputes.forEach(dispute => {
      recentActivities.push({
        type: 'dispute_created',
        dispute: { job: dispute.job?.title || 'Unknown Job' },
        timestamp: dispute.createdAt
      });
    });

    // Sort all activities by timestamp (most recent first) and limit to 20
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = recentActivities.slice(0, 20);

    console.log('API Response: getAdminDashboard', {
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalJobs,
      openJobs,
      closedJobs,
      pendingApprovals,
      totalDocuments,
      pendingDocuments,
      activeWorklogs,
      verifiedUsers,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      userGrowthPercent: parseFloat(userGrowthPercent.toFixed(1)),
      revenueGrowthPercent: parseFloat(revenueGrowthPercent.toFixed(1)),
      recentActivitiesCount: limitedActivities.length
    });

    res.json({
      totalUsers,
      totalWorkers,
      totalEmployers,
      totalJobs,
      openJobs,
      closedJobs,
      pendingApprovals,
      totalDocuments,
      pendingDocuments,
      activeWorklogs,
      verifiedUsers,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      userGrowthPercent: parseFloat(userGrowthPercent.toFixed(1)),
      revenueGrowthPercent: parseFloat(revenueGrowthPercent.toFixed(1)),
      recentActivities: limitedActivities
    });
  } catch (error) {
    console.error('Error in getAdminDashboard:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getUsers = async (req, res) => {
  console.log('API Hit: getUsers', req.query);
  try {
    const { name, role, startDate, endDate, page = 1, pageSize = 10 } = req.query;
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (role && (role === 'worker' || role === 'employer')) {
      query.role = role;
    }

    let createdAtQuery = {};
    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      createdAtQuery.$gte = startOfDay;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      createdAtQuery.$lte = endOfDay;
    }
    if (Object.keys(createdAtQuery).length > 0) {
      query.createdAt = createdAtQuery;
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 }) // Sort by registration date, newest first
      .skip(skip)
      .limit(Number(pageSize));

    res.json({
      users,
      page: Number(page),
      pages: Math.ceil(totalUsers / Number(pageSize)),
      totalUsers,
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getJobs = async (req, res) => {
  console.log('API Hit: getJobs', req.query);
  try {
    const { title, status, workType, startDate, endDate, page = 1, pageSize = 10 } = req.query;
    let query = {};

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (workType) {
      query.workType = workType;
    }

    let createdAtQuery = {};
    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      createdAtQuery.$gte = startOfDay;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      createdAtQuery.$lte = endOfDay;
    }
    if (Object.keys(createdAtQuery).length > 0) {
      query.createdAt = createdAtQuery;
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('employer', 'name companyName')
      .populate('workers.workerId', 'name email mobile')
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip)
      .limit(Number(pageSize));

    res.json({
      jobs,
      page: Number(page),
      pages: Math.ceil(totalJobs / Number(pageSize)),
      totalJobs,
    });
  } catch (error) {
    console.error('Error in getJobs:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const approveJob = async (req, res) => {
  console.log('API Hit: approveJob', req.params.id);
  try {
    const job = await Job.findById(req.params.id);
    if (job) {
      job.isApproved = true;
      await job.save();
      console.log('API Response: approveJob', { message: 'Job approved' });
      res.json({ message: 'Job approved' });
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const approveUser = async (req, res) => {
  console.log('API Hit: approveUser', req.params.id);
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isVerified = true;

      // If user is an employer, also update the specific verification status
      if (user.role === 'employer') {
        if (!user.companyDetails) {
          user.companyDetails = {};
        }
        user.companyDetails.verificationStatus = 'verified';
      }

      await user.save();
      console.log('API Response: approveUser', { message: 'User approved' });
      res.json({ message: 'User approved' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in approveUser:', error); // Log the actual error
    res.status(500).json({ message: 'Server Error' });
  }
};

const getRatings = async (req, res) => {
  console.log('API Hit: getRatings');
  try {
    const { page = 1, pageSize = 10 } = req.query; // Get pagination params
    const skip = (Number(page) - 1) * Number(pageSize);

    const totalRatings = await Rating.countDocuments({}); // Get total count
    const ratings = await Rating.find({})
      .populate('job', 'title')
      .populate('user', 'name')
      .populate('ratedBy', 'name')
      .skip(skip)
      .limit(Number(pageSize));

    console.log('API Response: getRatings', {
      ratings,
      page: Number(page),
      pages: Math.ceil(totalRatings / Number(pageSize)),
      total: totalRatings,
    });
    res.json({
      ratings,
      page: Number(page),
      pages: Math.ceil(totalRatings / Number(pageSize)),
      total: totalRatings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteRating = async (req, res) => {
  console.log('API Hit: deleteRating', req.params.id);
  try {
    const rating = await Rating.findById(req.params.id);
    if (rating) {
      await rating.remove();
      console.log('API Response: deleteRating', { message: 'Rating removed' });
      res.json({ message: 'Rating removed' });
    } else {
      res.status(404).json({ message: 'Rating not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getDocuments = async (req, res) => {
  console.log('API Hit: getDocuments', req.query);
  try {
    const { documentName, status, type, userName, page = 1, pageSize = 10 } = req.query;
    let query = {};
    let documents;
    let totalDocuments;

    if (documentName) {
      query.name = { $regex: documentName, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    if (userName) {
      // Use aggregation pipeline for userName filter
      const pipeline = [
        { $match: query }, // Apply initial filters
        {
          $lookup: {
            from: 'users', // The collection name for the User model
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $match: {
            'userDetails.name': { $regex: userName, $options: 'i' },
          },
        },
        { $sort: { createdAt: -1 } }, // Sort by upload date, newest first
        { $skip: skip },
        { $limit: Number(pageSize) },
        {
          $project: { // Project necessary fields, including populated user details
            _id: 1,
            name: 1,
            url: 1,
            type: 1,
            status: 1,
            expiryDate: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              _id: '$userDetails._id',
              name: '$userDetails.name',
              email: '$userDetails.email',
            },
          },
        },
      ];

      const countPipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $match: {
            'userDetails.name': { $regex: userName, $options: 'i' },
          },
        },
        { $count: 'total' },
      ];

      documents = await Document.aggregate(pipeline);
      const countResult = await Document.aggregate(countPipeline);
      totalDocuments = countResult.length > 0 ? countResult[0].total : 0;

    } else {
      // Original find query if no userName filter
      totalDocuments = await Document.countDocuments(query);
      documents = await Document.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 }) // Sort by upload date, newest first
        .skip(skip)
        .limit(Number(pageSize));
    }

    res.json({
      documents,
      page: Number(page),
      pages: Math.ceil(totalDocuments / Number(pageSize)),
      totalDocuments,
    });
  } catch (error) {
    console.error('Error in getDocuments:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateDocumentStatus = async (req, res) => {
  console.log('API Hit: updateDocumentStatus', req.params.id, req.body);
  const { status } = req.body;
  try {
    const document = await Document.findById(req.params.id);
    if (document) {
      document.status = status;
      await document.save();
      console.log('API Response: updateDocumentStatus', { message: 'Document status updated' });
      res.json({ message: 'Document status updated' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteUser = async (req, res) => {
  console.log('API Hit: deleteUser', req.params.id);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.params.id).session(session);
    if (user) {
      const userId = user._id;

      if (user.role === 'employer') {
        const jobs = await Job.find({ employer: userId }).session(session);
        const jobIds = jobs.map(j => j._id);

        await Job.deleteMany({ employer: userId }).session(session);
        await Subscription.deleteMany({ employer: userId }).session(session);
        await Invoice.deleteMany({ employer: userId }).session(session);

        if (jobIds.length > 0) {
          await Application.deleteMany({ job: { $in: jobIds } }).session(session);
          await WorkLog.deleteMany({ job: { $in: jobIds } }).session(session);
          await Dispute.deleteMany({ job: { $in: jobIds } }).session(session);
        }
      } else if (user.role === 'worker') {
        await Application.deleteMany({ worker: userId }).session(session);
        await WorkLog.deleteMany({ worker: userId }).session(session);

        await Job.updateMany(
          { 'workers.workerId': userId },
          { $pull: { workers: { workerId: userId } } }
        ).session(session);
      }

      await Document.deleteMany({ user: userId }).session(session);
      await Rating.deleteMany({ $or: [{ user: userId }, { ratedBy: userId }] }).session(session);

      const conversations = await Conversation.find({ participants: userId }).session(session);
      const conversationIds = conversations.map(c => c._id);
      if (conversationIds.length > 0) {
        await Message.deleteMany({ conversationId: { $in: conversationIds } }).session(session);
        await Conversation.deleteMany({ _id: { $in: conversationIds } }).session(session);
      }

      await User.findByIdAndDelete(req.params.id).session(session);

      await session.commitTransaction();
      session.endSession();

      console.log('API Response: deleteUser', { message: 'User and all related records removed completely' });
      res.json({ message: 'User and all related records removed completely' });
    } else {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllSubscriptions = async (req, res) => {
  console.log('API Hit: getAllSubscriptions');
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const totalSubscriptions = await Subscription.countDocuments();
    const subscriptions = await Subscription.find({})
      .populate('employer', 'name email companyName')
      .skip(skip)
      .limit(Number(pageSize));
    res.json({
      subscriptions,
      page: Number(page),
      pages: Math.ceil(totalSubscriptions / Number(pageSize)),
      total: totalSubscriptions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getSubscriptionById = async (req, res) => {
  console.log('API Hit: getSubscriptionById', req.params.id);
  try {
    const subscription = await Subscription.findById(req.params.id).populate('employer', 'name email companyName');
    if (subscription) {
      res.json(subscription);
    } else {
      res.status(404).json({ message: 'Subscription not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
}

const updateSubscription = async (req, res) => {
  console.log('API Hit: updateSubscription', req.params.id, req.body);
  try {
    const { plan, endDate } = req.body;
    const subscription = await Subscription.findById(req.params.id);
    if (subscription) {
      subscription.plan = plan || subscription.plan;
      subscription.endDate = endDate || subscription.endDate;
      await subscription.save();
      res.json(subscription);
    } else {
      res.status(404).json({ message: 'Subscription not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
}

const deleteSubscription = async (req, res) => {
  console.log('API Hit: deleteSubscription', req.params.id);
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (subscription) {
      await subscription.remove();
      res.json({ message: 'Subscription removed' });
    } else {
      res.status(404).json({ message: 'Subscription not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};



const getAnalytics = async (req, res) => {
  console.log('API Hit: getAnalytics', req.query);
  try {
    const { timeRange } = req.query;
    let chartStartDate = dayjs().subtract(7, 'days').toDate(); // Default for chart display

    if (timeRange === '30d') {
      chartStartDate = dayjs().subtract(30, 'days').toDate();
    } else if (timeRange === '90d') {
      chartStartDate = dayjs().subtract(90, 'days').toDate();
    } else if (timeRange === '180d') { // Add 6 months option
      chartStartDate = dayjs().subtract(6, 'months').toDate();
    }

    // For user registrations, always fetch at least the last 6 months for consistent KPI calculation
    const kpiStartDate = dayjs().subtract(6, 'months').startOf('month').toDate();

    // User registration by month
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: kpiStartDate } // Use kpiStartDate for user registrations
        }
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, // Group by year and month
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }, // Sort by year then month
    ]);

    // Job postings by category over time (still uses chartStartDate)
    const jobPostings = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: chartStartDate } // Use chartStartDate for job postings
        }
      },
      { $unwind: '$workerType' },
      {
        $group: {
          _id: {
            category: '$workerType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: { // Flatten _id to category
          _id: 0, // Exclude default _id
          category: '$_id.category',
          count: '$count'
        }
      },
      { $sort: { category: 1 } }, // Sort by category name
    ]);

    res.json({
      userRegistrations,
      jobPostings,
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getWorklogsByWorker = async (req, res) => {
  try {
    const { search, date, status } = req.query; // Get date and status from query

    let workerQuery = { role: 'worker' };
    if (search) {
      workerQuery.name = { $regex: search, $options: 'i' };
    }
    const workers = await User.find(workerQuery);

    const workersWithWorklogs = await Promise.all(
      workers.map(async (worker) => {
        let worklogFilter = { worker: worker._id };

        if (date) {
          const startOfDay = new Date(date);
          startOfDay.setUTCHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setUTCHours(23, 59, 59, 999);
          worklogFilter.workDate = { $gte: startOfDay, $lte: endOfDay };
        }
        if (status && status !== 'all') {
          worklogFilter.status = status;
        }

        const worklogs = await WorkLog.find(worklogFilter) // Apply filters here
          .populate('job', 'title')
          .sort({ workDate: -1 });

        const worklogsByDate = worklogs.reduce((acc, log) => {
          const logDate = dayjs(log.workDate).format('YYYY-MM-DD');
          if (!acc[logDate]) {
            acc[logDate] = [];
          }
          acc[logDate].push(log);
          return acc;
        }, {});

        return {
          workerId: worker._id,
          workerName: worker.name,
          profilePicture: worker.profilePicture,
          worklogsByDate,
        };
      })
    );
    res.json(workersWithWorklogs);
  } catch (error) {
    console.error('Error in getWorklogsByWorker:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllDisputes = async (req, res) => {
  console.log('API Hit: getAllDisputes');
  try {
    const disputes = await Dispute.find({})
      .populate('job', 'title')
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email');
    console.log('API Response: getAllDisputes', disputes);
    res.json(disputes);
  } catch (error) {
    console.error('Error in getAllDisputes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getWorklogsForSingleWorker = async (req, res) => {
  console.log('API Hit: getWorklogsForSingleWorker');
  try {
    const { workerId } = req.params;
    const { jobTitle, startDate, endDate } = req.query;

    const worker = await User.findById(workerId).select('-password'); // Exclude password
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }

    let worklogs;
    let dateRangeQuery = {};

    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      dateRangeQuery.$gte = startOfDay;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      dateRangeQuery.$lte = endOfDay;
    }

    if (jobTitle) {
      // Use aggregation if jobTitle filter is present
      const matchStage = { worker: new mongoose.Types.ObjectId(workerId) };
      if (Object.keys(dateRangeQuery).length > 0) {
        matchStage.workDate = dateRangeQuery;
      }

      worklogs = await WorkLog.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'jobs', // The collection name for the Job model
            localField: 'job',
            foreignField: '_id',
            as: 'jobDetails',
          },
        },
        { $unwind: '$jobDetails' },
        {
          $lookup: {
            from: 'users', // The collection name for the User model (employers are users)
            localField: 'jobDetails.employer',
            foreignField: '_id',
            as: 'jobDetails.employerDetails',
          },
        },
        { $unwind: { path: '$jobDetails.employerDetails', preserveNullAndEmptyArrays: true } }, // Use preserveNullAndEmptyArrays if employer might be missing
        {
          $match: {
            'jobDetails.title': { $regex: jobTitle, $options: 'i' },
          },
        },
        {
          $project: {
            _id: 1,
            job: {
              _id: '$jobDetails._id',
              title: '$jobDetails.title',
              employer: {
                companyName: '$jobDetails.employerDetails.companyName',
              },
            },
            worker: 1,
            employer: 1,
            workDate: 1,
            startTime: 1,
            endTime: 1,
            startPhoto: 1,
            startPhotoLocation: 1,
            startPhotoAddress: 1,
            endPhoto: 1,
            endPhotoLocation: 1,
            endPhotoAddress: 1,
            startOtp: 1,
            endOtp: 1,
            startOtpVerified: 1,
            endOtpVerified: 1,
            startOtpExpires: 1,
            endOtpExpires: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        { $sort: { workDate: -1 } },
      ]);
    } else {
      // Original find query if no jobTitle filter
      let worklogQuery = { worker: workerId };
      if (Object.keys(dateRangeQuery).length > 0) {
        worklogQuery.workDate = dateRangeQuery;
      }
      worklogs = await WorkLog.find(worklogQuery)
        .populate('job', 'title')
        .select('startPhoto endPhoto workDate startTime endTime status job worker employer startPhotoLocation startPhotoAddress endPhotoLocation endPhotoAddress startOtp endOtp startOtpVerified endOtpVerified startOtpExpires endOtpExpires createdAt updatedAt') // Explicitly select all necessary fields
        .sort({ workDate: -1 });
    }

    const worklogsByDate = worklogs.reduce((acc, log) => {
      const date = dayjs(log.workDate).format('YYYY-MM-DD');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {});

    res.json({
      workerId: worker._id,
      workerName: worker.name,
      profilePicture: worker.profilePicture,
      worklogsByDate,
    });
  } catch (error) {
    console.error('Error in getWorklogsForSingleWorker:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getJobDetails = async (req, res) => {
  console.log('API Hit: getJobDetails', req.params.id);
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name email mobile profilePicture companyName')
      .populate('workers.workerId', 'name email mobile profilePicture')
      .populate('applicants', 'name email mobile profilePicture');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Find conversations between Employer and relevant Workers/Applicants
    const employerId = job.employer._id;

    // Combine worker IDs and applicant IDs
    const relevantUserIds = [
      ...(job.workers?.map(w => w.workerId?._id) || []),
      ...(job.applicants?.map(a => a._id) || [])
    ].filter(id => id); // Remove null/undefined

    // Remove duplicates
    const uniqueRelevantUserIds = [...new Set(relevantUserIds.map(id => id.toString()))];

    let conversations = [];
    if (uniqueRelevantUserIds.length > 0) {
      conversations = await Conversation.find({
        $and: [
          { members: employerId },
          { members: { $in: uniqueRelevantUserIds } }
        ]
      }).populate('members', 'name profilePicture role');
    }

    // Attach last message to each conversation for context
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (convo) => {
        const lastMessage = await Message.findOne({ conversationId: convo._id })
          .sort({ createdAt: -1 })
          .lean();
        return {
          ...convo.toObject(),
          lastMessage: lastMessage || null,
        };
      })
    );

    res.json({
      job,
      conversations: conversationsWithLastMessage
    });
  } catch (error) {
    console.error('Error in getJobDetails:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAdminConversationMessages = async (req, res) => {
  console.log('API Hit: getAdminConversationMessages', req.params.conversationId);
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 }); // Sort by creation date (oldest first)
    res.json(messages);
  } catch (error) {
    console.error('Error in getAdminConversationMessages:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update Worklog Status (Admin manually forcing approval/rejection)
// @route   PUT /api/admin/worklogs/:id/status
// @access  Private/Admin
const updateWorklogStatus = async (req, res) => {
  console.log('API Hit: updateWorklogStatus', req.params.id, req.body);
  try {
    const { status } = req.body;
    const workLog = await WorkLog.findById(req.params.id);

    if (!workLog) {
      return res.status(404).json({ message: 'WorkLog not found' });
    }

    if (!['pending', 'assigned', 'in-progress', 'completed', 'approved', 'rejected', 'incomplete', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    workLog.status = status;
    await workLog.save();

    res.json({ message: 'Worklog status updated successfully', workLog });
  } catch (error) {
    console.error('Error updating worklog status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a Worklog (Admin taking severe action)
// @route   DELETE /api/admin/worklogs/:id
// @access  Private/Admin
const deleteWorklog = async (req, res) => {
  console.log('API Hit: deleteWorklog', req.params.id);
  try {
    const workLog = await WorkLog.findById(req.params.id);

    if (!workLog) {
      return res.status(404).json({ message: 'WorkLog not found' });
    }

    await WorkLog.deleteOne({ _id: workLog._id });
    res.json({ message: 'Worklog deleted successfully' });
  } catch (error) {
    console.error('Error deleting worklog:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Support Message Management ---

/**
 * GET /api/admin/support-messages
 * Fetch all support messages with pagination and filtering
 */
const getSupportMessages = async (req, res) => {
  console.log('API Hit: getSupportMessages', req.query);
  try {
    const { status, page = 1, pageSize = 10, search, startDate, endDate } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    let createdAtQuery = {};
    if (startDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      createdAtQuery.$gte = startOfDay;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      createdAtQuery.$lte = endOfDay;
    }
    if (Object.keys(createdAtQuery).length > 0) {
      query.createdAt = createdAtQuery;
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const totalCount = await SupportMessage.countDocuments(query);
    const messages = await SupportMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize));

    res.json({
      messages,
      page: Number(page),
      pages: Math.ceil(totalCount / Number(pageSize)),
      totalCount
    });
  } catch (error) {
    console.error('Error in getSupportMessages:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * PATCH /api/admin/support-messages/:id
 * Update support message status
 */
const updateSupportMessageStatus = async (req, res) => {
  console.log('API Hit: updateSupportMessageStatus', req.params.id, req.body);
  try {
    const { status } = req.body;
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Support message not found' });
    }

    message.status = status || message.status;
    await message.save();

    res.json(message);
  } catch (error) {
    console.error('Error in updateSupportMessageStatus:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * DELETE /api/admin/support-messages/:id
 * Delete a support message
 */
const deleteSupportMessage = async (req, res) => {
  console.log('API Hit: deleteSupportMessage', req.params.id);
  try {
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Support message not found' });
    }

    await SupportMessage.deleteOne({ _id: message._id });
    res.json({ message: 'Support message removed successfully' });
  } catch (error) {
    console.error('Error in deleteSupportMessage:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  getJobs,
  approveJob,
  approveUser,
  deleteUser,
  getRatings,
  deleteRating,
  getDocuments,
  updateDocumentStatus,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  getAnalytics,
  getWorklogsByWorker,
  getAllDisputes,
  getWorklogsForSingleWorker,
  getJobDetails,
  getAdminConversationMessages,
  updateWorklogStatus,
  deleteWorklog,
  getSupportMessages,
  updateSupportMessageStatus,
  deleteSupportMessage
};
