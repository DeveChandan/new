const Job = require('../models/Job.js');
const WorkLog = require('../models/WorkLog');
const { User } = require('../models/User');
const Application = require('../models/Application');
const notificationService = require('../services/notificationService');
const whatsappService = require('../services/whatsappService');
const recommendationService = require('../services/recommendationService');
const { geocodeAddress } = require('../services/geolocationService');
const { getIo } = require('../socket');
const { getLocale } = require('../utils');
const { translateJob } = require('../services/translationService');
const { JOB_STATUSES, JOB_WORKER_STATUSES, APPLICATION_STATUSES } = require('../constants/statusEnums');

const createJob = async (req, res) => {
  const {
    title,
    description,
    skills,
    salary,
    location,
    workType,
    minExperience,
    maxExperience,
    totalOpenings,
    durationDays,
    otpVerificationRequired,
    geoTaggingRequired,
    workerType,
  } = req.body;

  const jobLocation = {
    address: location.address,
    type: 'Point',
    coordinates: [location.longitude, location.latitude],
  };

  const Subscription = require('../models/Subscription');

  // Check for active paid subscription (no free plan)
  const subscription = await Subscription.findOne({
    employer: req.user._id,
    endDate: { $gte: new Date() } // Must be active (not expired)
  });

  if (!subscription) {
    return res.status(403).json({
      message: 'Active subscription required to post jobs. Please subscribe to a plan to continue.',
      requiresSubscription: true
    });
  }

  // Check job posting limits based on subscription plan (only active jobs count)
  const activeJobsCount = await Job.countDocuments({
    employer: req.user._id,
    status: { $in: [JOB_STATUSES[0], JOB_STATUSES[2]] }
  });

  if (activeJobsCount >= subscription.maxActiveJobs) {
    return res.status(403).json({
      message: `You can have only ${subscription.maxActiveJobs} active job at a time. Please close or complete your existing job to post a new one.`,
      requiresJobClose: true,
      currentPlan: subscription.planType,
      maxActiveJobs: subscription.maxActiveJobs,
      activeJobsCount
    });
  }

  const job = new Job({
    title,
    description,
    skills,
    salary,
    location: jobLocation,
    workType,
    durationDays: workType === 'temporary' ? durationDays : undefined,
    totalOpenings,
    minExperience,
    maxExperience,
    otpVerificationRequired,
    geoTaggingRequired,
    employer: req.user._id,
    workerType,
  });

  let createdJob = await job.save();

  // Populate employer name for recommendation service
  createdJob = await createdJob.populate('employer', 'name');

  // --- Trigger Recommendation Service (fire and forget) ---
  recommendationService.findAndNotifyWorkers(createdJob);

  const io = getIo();
  io.to(`user:${req.user._id}`).emit('jobCreated', createdJob);

  res.status(201).json(createdJob);
};

const getJobs = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const {
    keyword,
    location,
    skills,
    workType,
    workerType,
    minExperience,
    maxExperience,
    minSalary,
    maxSalary,
    limit,
  } = req.query;

  const query = {
    status: { $in: [JOB_STATUSES[0], JOB_STATUSES[2]] } // Only show active jobs
  };

  if (keyword) {
    query.title = { $regex: keyword, $options: 'i' };
  }

  if (skills) {
    query.skills = { $in: skills.split(',') };
  }

  if (workType) {
    query.workType = workType;
  }

  if (workerType) {
    const userWorkerTypes = workerType.split(',').map(type => type.trim());
    query.workerType = { $in: userWorkerTypes };
  }

  if (minExperience) {
    query.minExperience = { $gte: Number(minExperience) };
  }

  if (maxExperience) {
    query.maxExperience = { $lte: Number(maxExperience) };
  }

  if (minSalary) {
    query.salary = { ...query.salary, $gte: Number(minSalary) };
  }

  if (maxSalary) {
    query.salary = { ...query.salary, $lte: Number(maxSalary) };
  }

  if (location) {
    const geocodedLocation = await geocodeAddress(location);
    if (geocodedLocation) {
      // Use $geoWithin with $centerSphere instead of $near to avoid countDocuments sorting error
      query.location = {
        $geoWithin: {
          $centerSphere: [
            geocodedLocation.coordinates,
            50 / 6378.1 // 50km in radians
          ],
        },
      };
    } else {
      // Fallback to regex search if geocoding fails
      query['location.address'] = { $regex: location, $options: 'i' };
    }
  }

  const count = await Job.countDocuments(query);

  let jobsQuery = Job.find(query)
    .populate('employer', 'name companyName')
    .skip(pageSize * (page - 1));

  // Apply limit if provided (for recommendations)
  if (limit) {
    jobsQuery = jobsQuery.limit(Number(limit));
  } else {
    jobsQuery = jobsQuery.limit(pageSize);
  }

  const jobs = await jobsQuery;

  // Translation support
  const locale = getLocale(req);
  let translatedJobs = jobs;
  if (locale !== 'en') {
    translatedJobs = await Promise.all(
      jobs.map(job => translateJob(job, locale))
    );
  }

  res.json({ jobs: translatedJobs, page, pages: Math.ceil(count / pageSize) });
};

const getJobById = async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('employer', 'name companyName businessType rating companyDetails')
    .populate('workers.workerId', 'name email mobile location locationName rating profilePicture')
    .populate('applicants', 'name email availability rating profilePicture');

  if (job) {
    if (req.user) {
      const application = await Application.findOne({ job: req.params.id, worker: req.user._id });
      if (application) {
        job._doc.userApplicationStatus = application.status;
      }
    }

    // Translation support
    const locale = getLocale(req);
    let translatedJob = job;
    if (locale !== 'en') {
      translatedJob = await translateJob(job, locale);
    }

    res.json(translatedJob);
  } else {
    res.status(404).json({ message: 'Job not found' });
  }
};

const applyToJob = async (req, res) => {
  const jobId = req.params.id;
  const workerId = req.user._id;

  try {
    const job = await Job.findById(jobId).populate('employer', 'name role mobile');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status === JOB_STATUSES[1]) {
      return res.status(400).json({ message: 'Cannot apply, this job is already closed.' });
    }

    const existingApplication = await Application.findOne({ job: jobId, worker: workerId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    const application = new Application({
      job: jobId,
      worker: workerId,
      status: APPLICATION_STATUSES[0],
      appliedDate: new Date(),
      selectedCV: req.body.cvId || undefined,
    });
    await application.save();

    await Job.findByIdAndUpdate(jobId, {
      $addToSet: { applicants: workerId }
    });

    await notificationService.createAndSend({
      userId: job.employer._id,
      userRole: 'employer',
      type: 'new_application',
      title: 'New Job Application',
      message: `${req.user.name} applied for your job: ${job.title}`,
      relatedId: application._id,
      relatedModel: 'Application',
      actionUrl: `/dashboard/employer/applicants`,
    });

    if (job.employer.mobile) {
      whatsappService.sendApplicationNotification(job.employer.mobile, {
        workerName: req.user.name,
        jobTitle: job.title,
      });
    }

    const io = getIo();
    io.to(`user:${job.employer._id}`).emit('jobUpdated', { jobId: job._id, job });

    res.status(201).json({ message: 'Applied to job successfully', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (job) {
    // Authorization: only employer can update job, unless it's a worker updating their own status
    if (job.employer.toString() !== req.user._id.toString()) {
      const isHiredWorker = job.workers.some(w => w.workerId.toString() === req.user._id.toString());
      if (!isHiredWorker || !req.body.workerStatus) {
        return res.status(403).json({ message: 'User not authorized to update this job' });
      }
    }

    // Employer-only fields
    if (job.employer.toString() === req.user._id.toString()) {
      job.title = req.body.title || job.title;
      job.description = req.body.description || job.description;
      job.skills = req.body.skills || job.skills;
      job.salary = req.body.salary || job.salary;
      if (req.body.location) {
        const { address, city, state, latitude, longitude } = req.body.location;

        // Start with existing location data
        const newLocation = {
          address: address || job.location?.address,
          city: city || job.location?.city,
          state: state || job.location?.state,
          type: 'Point',
          coordinates: job.location?.coordinates || [0, 0]
        };

        // Update coordinates if provided
        if (latitude && longitude) {
          newLocation.coordinates = [Number(longitude), Number(latitude)];
        }

        job.location = newLocation;
      }
      job.workType = req.body.workType || job.workType;
      job.otpVerificationRequired = req.body.otpVerificationRequired;
      job.geoTaggingRequired = req.body.geoTaggingRequired;
      job.totalOpenings = req.body.totalOpenings || job.totalOpenings;
      job.minExperience = req.body.minExperience || job.minExperience;
      job.maxExperience = req.body.maxExperience || job.maxExperience;
      job.durationDays = req.body.workType === 'temporary' ? req.body.durationDays : undefined;
      job.workerType = req.body.workerType || job.workerType;

      // Handle explicit job status update from employer (Open/Close)
      if (req.body.status) {
        // If activating job (open or in-progress), check subscription limits
        if ([JOB_STATUSES[0], JOB_STATUSES[2]].includes(req.body.status) && ![JOB_STATUSES[0], JOB_STATUSES[2]].includes(job.status)) {
          const Subscription = require('../models/Subscription');

          // Check for active paid subscription
          const subscription = await Subscription.findOne({
            employer: req.user._id,
            endDate: { $gte: new Date() }
          });

          if (!subscription) {
            return res.status(403).json({
              message: 'Active subscription required. Please subscribe to a plan.',
              requiresSubscription: true
            });
          }

          // Check active job limit
          const activeJobsCount = await Job.countDocuments({
            employer: req.user._id,
            status: { $in: [JOB_STATUSES[0], JOB_STATUSES[2]] },
            _id: { $ne: job._id } // Exclude current job from count
          });

          if (activeJobsCount >= subscription.maxActiveJobs) {
            return res.status(403).json({
              message: `You can have only ${subscription.maxActiveJobs} active job at a time. Please close another job first.`,
              requiresJobClose: true,
              currentPlan: subscription.planType,
              maxActiveJobs: subscription.maxActiveJobs,
              activeJobsCount
            });
          }
        }

        job.status = req.body.status;
      }
    }

    // Handle worker-specific status update
    if (req.body.workerStatus) {
      const workerIndex = job.workers.findIndex(w => w.workerId.toString() === req.user._id.toString());
      if (workerIndex !== -1) {
        job.workers[workerIndex].status = req.body.workerStatus;
        if (req.body.workerStatus === JOB_WORKER_STATUSES[2]) {
          job.workers[workerIndex].completedAt = new Date();
        }
      }
    }

    // Re-evaluate overall job status based on worker statuses
    // ONLY IF status wasn't explicitly set in this request OR if the update was about worker status
    // If status IS provided, we respect the manual override (which already passed limit checks above)
    // IMPORTANT: Don't automatically change status if it's already in a terminal state (closed, completed, done)
    if (!req.body.status && ![JOB_STATUSES[1], JOB_STATUSES[3], JOB_STATUSES[4]].includes(job.status)) {
      const allWorkersCompleted = job.workers.length > 0 && job.workers.every(w => w.status === JOB_WORKER_STATUSES[2]);
      if (allWorkersCompleted) {
        job.status = JOB_STATUSES[3];
      } else if (job.workers.some(w => w.status === JOB_WORKER_STATUSES[1])) {
        job.status = JOB_STATUSES[2];
      } else {
        job.status = JOB_STATUSES[0];
      }
    }

    const updatedJob = await job.save();

    const io = getIo();
    // Use employer ID from job (it might be an object or ID string, safer to handle both if populated)
    const employerId = job.employer._id ? job.employer._id.toString() : job.employer.toString();
    io.to(`user:${employerId}`).emit('jobUpdated', { jobId: job._id, job: updatedJob });

    res.json(updatedJob);
  } else {
    res.status(404).json({ message: 'Job not found' });
  }
};

const hireWorkerForJob = async (req, res) => {
  const jobId = req.params.id;
  const { workerId } = req.params;

  try {
    const job = await Job.findById(jobId).populate('employer', 'name');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.employer._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to hire for this job' });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker') return res.status(404).json({ message: 'Worker not found' });
    if (worker.availability === 'unavailable') return res.status(400).json({ message: 'Worker is not available for hire.' });

    if (job.status === 'closed') {
      return res.status(400).json({ message: 'Cannot hire, this job is already closed.' });
    }
    if (job.workers.length >= job.totalOpenings) {
      return res.status(400).json({ message: 'Job has reached maximum number of openings.' });
    }

    let application = await Application.findOne({ job: jobId, worker: workerId });

    if (application && (application.status === APPLICATION_STATUSES[0] || application.status === APPLICATION_STATUSES[5])) {
      application.status = APPLICATION_STATUSES[3];
      await application.save();

      // Atomic push with size limit to prevent race condition when multiple workers are hired simultaneously
      const updatedJob = await Job.findOneAndUpdate(
        { _id: jobId, $expr: { $lt: [{ $size: "$workers" }, "$totalOpenings"] } },
        { $push: { workers: { workerId: workerId, status: JOB_WORKER_STATUSES[1] } } },
        { new: true }
      );

      if (!updatedJob) {
        // Concurrency catch: Job was filled by another concurrent request
        return res.status(400).json({ message: 'Job has reached maximum number of openings.' });
      }

      // Check if all positions are filled (after atomic update)
      if (updatedJob.workers.length >= updatedJob.totalOpenings) {
        updatedJob.status = JOB_STATUSES[1];
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Job ${updatedJob._id} auto-closed: all ${updatedJob.totalOpenings} positions filled`);
        }
      } else {
        updatedJob.status = JOB_STATUSES[2];
      }

      await updatedJob.save();

      await User.findByIdAndUpdate(workerId, { availability: 'unavailable' });

      await notificationService.createAndSend({
        userId: workerId,
        userRole: 'worker',
        type: 'worker_hired',
        title: 'You Got Hired!',
        message: `Congratulations! You have been hired for the job: ${job.title}`,
        relatedId: job._id,
        relatedModel: 'Job',
        actionUrl: `/dashboard/worker/assigned-jobs/${job._id}`,
      });

      if (worker.mobile) {
        whatsappService.sendHiredNotification(worker.mobile, {
          jobTitle: job.title,
          employerName: job.employer.name,
        });
      }

      const io = getIo();
      const employerId = job.employer._id ? job.employer._id.toString() : job.employer.toString();
      io.to(`user:${employerId}`).emit('jobUpdated', { jobId: job._id, job });

      res.json({ message: 'Worker hired successfully', application });

    } else if (!application) {
      application = new Application({
        job: jobId,
        worker: workerId,
        status: APPLICATION_STATUSES[4],
        appliedDate: new Date(),
      });
      await application.save();

      await notificationService.createAndSend({
        userId: workerId,
        userRole: 'worker',
        type: 'hire_request_received',
        title: 'New Job Offer!',
        message: `You have received a job offer for: ${job.title} from ${job.employer.name}`,
        relatedId: application._id,
        relatedModel: 'Application',
        actionUrl: `/dashboard/worker/hiring-requests`,
      });

      res.json({ message: 'Job offer sent successfully', application });
    } else {
      return res.status(400).json({ message: `Cannot hire worker. Application status is '${application.status}'.` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAssignedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ 'workers.workerId': req.user._id })
      .populate('employer', 'name companyName')
      .sort({ createdAt: -1 });

    const locale = getLocale(req);
    let translatedJobs = jobs;
    if (locale !== 'en') {
      translatedJobs = await Promise.all(
        jobs.map(job => translateJob(job, locale))
      );
    }
    res.json(translatedJobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getHiredJobsForEmployer = async (req, res) => {
  try {
    const hiredJobs = await Job.find({ employer: req.user._id, 'workers.workerId': { $exists: true } })
      .populate('workers.workerId', 'name email mobile rating workerType skills profilePicture')
      .populate('employer', 'name companyName')
      .sort({ createdAt: -1 });

    const locale = getLocale(req);
    let translatedJobs = hiredJobs;
    if (locale !== 'en') {
      translatedJobs = await Promise.all(
        hiredJobs.map(job => translateJob(job, locale))
      );
    }
    res.json(translatedJobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const rejectApplicant = async (req, res) => {
  const { jobId, applicantId } = req.params;
  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const application = await Application.findOne({ job: jobId, worker: applicantId });
    if (!application) return res.status(404).json({ message: 'Applicant not found' });

    application.status = APPLICATION_STATUSES[2];
    await application.save();

    job.applicants = job.applicants.filter(appId => appId.toString() !== applicantId);
    await job.save();

    await notificationService.createAndSend({
      userId: applicantId,
      userRole: 'worker',
      type: 'application_rejected',
      title: 'Application Update',
      message: `Your application for "${job.title}" was not selected`,
      relatedId: application._id,
      relatedModel: 'Application',
      actionUrl: `/jobs/${job._id}`,
    });

    const io = getIo();
    const employerId = job.employer._id ? job.employer._id.toString() : job.employer.toString();
    io.to(`user:${employerId}`).emit('jobUpdated', { jobId: job._id, job });

    res.json({ message: 'Applicant rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .populate('applicants', 'name email availability')
      .sort({ createdAt: -1 });

    const locale = getLocale(req);
    let translatedJobs = jobs;
    if (locale !== 'en') {
      translatedJobs = await Promise.all(
        jobs.map(job => translateJob(job, locale))
      );
    }
    res.json(translatedJobs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getWorkerHiringRequests = async (req, res) => {
  try {
    const hiringRequests = await Application.find({ worker: req.user._id, status: APPLICATION_STATUSES[4] })
      .populate({ path: 'job', populate: { path: 'employer', select: 'name companyName profilePicture' } })
      .sort({ appliedDate: -1 });

    const locale = getLocale(req);
    let translatedRequests = hiringRequests;
    if (locale !== 'en') {
      translatedRequests = await Promise.all(
        hiringRequests.map(async reqObj => {
          if (reqObj.job) {
            const translatedJob = await translateJob(reqObj.job, locale);
            return { ...reqObj.toObject(), job: translatedJob };
          }
          return reqObj;
        })
      );
    }
    res.json(translatedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const acceptHiringRequest = async (req, res) => {
  const { applicationId } = req.params;
  const workerId = req.user._id;

  try {
    const application = await Application.findById(applicationId).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.worker.toString() !== workerId.toString()) return res.status(401).json({ message: 'Not authorized' });
    if (application.status !== APPLICATION_STATUSES[4]) return res.status(400).json({ message: 'Hiring request is not in offered status' });

    const job = await Job.findById(application.job._id).populate('employer', 'name role');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.status === JOB_STATUSES[1]) {
      return res.status(400).json({ message: 'Job is already closed and cannot accept more workers' });
    }
    if (job.workers.length >= job.totalOpenings) {
      return res.status(400).json({ message: 'Job has reached maximum number of openings.' });
    }

    application.status = APPLICATION_STATUSES[5];
    await application.save();

    const updatedJob = await Job.findOneAndUpdate(
      {
        _id: job._id,
        'workers.workerId': { $ne: workerId },
        $expr: { $lt: [{ $size: "$workers" }, "$totalOpenings"] }
      },
      { $push: { workers: { workerId: workerId, status: JOB_WORKER_STATUSES[1] } } },
      { new: true }
    );

    if (!updatedJob) {
      // Revert application status since job atomic assignment failed
      application.status = APPLICATION_STATUSES[4];
      await application.save();
      return res.status(400).json({ message: 'Job has reached maximum number of openings or you are already hired.' });
    }

    if (updatedJob.workers.length >= updatedJob.totalOpenings) {
      updatedJob.status = JOB_STATUSES[1];
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Job ${updatedJob._id} auto-closed on acceptance: all ${updatedJob.totalOpenings} positions filled`);
      }
    } else {
      updatedJob.status = JOB_STATUSES[2];
    }
    await updatedJob.save();

    await User.findByIdAndUpdate(workerId, { availability: 'unavailable' });

    await notificationService.createAndSend({
      userId: job.employer._id,
      userRole: 'employer',
      type: 'hire_request_accepted',
      title: 'Job Offer Accepted!',
      message: `${req.user.name} accepted your job offer for: ${job.title}`,
      relatedId: job._id,
      relatedModel: 'Job',
      actionUrl: `/dashboard/employer/hired-jobs/${job._id}`,
    });

    const io = getIo();
    const employerId = job.employer._id ? job.employer._id.toString() : job.employer.toString();
    io.to(`user:${employerId}`).emit('jobUpdated', { jobId: job._id, job });

    res.json({ message: 'Hiring request accepted successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const rejectHiringRequest = async (req, res) => {
  const { applicationId } = req.params;
  const workerId = req.user._id;

  try {
    const application = await Application.findById(applicationId).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.worker.toString() !== workerId.toString()) return res.status(401).json({ message: 'Not authorized' });
    if (application.status !== APPLICATION_STATUSES[4]) return res.status(400).json({ message: 'Hiring request is not in offered status' });

    application.status = APPLICATION_STATUSES[6];
    await application.save();

    const job = await Job.findById(application.job._id).populate('employer', 'name role');
    if (job) {
      await notificationService.createAndSend({
        userId: job.employer._id,
        userRole: 'employer',
        type: 'hire_request_rejected',
        title: 'Job Offer Declined',
        message: `${req.user.name} declined your job offer for: ${job.title}`,
        relatedId: job._id,
        relatedModel: 'Job',
        actionUrl: `/dashboard/employer/jobs`,
      });
    }

    const io = getIo();
    if (job) {
      const employerId = job.employer._id ? job.employer._id.toString() : job.employer.toString();
      io.to(`user:${employerId}`).emit('jobUpdated', { jobId: job._id });
    }

    res.json({ message: 'Hiring request rejected successfully', application });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update job location (limited by subscription)
const updateJobLocation = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { location } = req.body;
    const subscription = req.subscription;

    if (!location || !location.latitude || !location.longitude || !location.address) {
      return res.status(400).json({ message: 'Invalid location data' });
    }

    const job = await Job.findOne({ _id: jobId, employer: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or not authorized' });
    }

    // Atomic update to prevent race conditions bypassing limits
    const Subscription = require('../models/Subscription');
    const updatedSubscription = await Subscription.findOneAndUpdate(
      {
        _id: subscription._id,
        $expr: { $lt: ["$locationChangesUsed", "$maxLocationChanges"] }
      },
      { $inc: { locationChangesUsed: 1 } },
      { new: true }
    );

    if (!updatedSubscription) {
      return res.status(403).json({ message: 'Location change limit reached. You cannot change job location anymore with your current plan.' });
    }

    // Update location
    job.location = {
      address: location.address,
      type: 'Point',
      coordinates: [location.longitude, location.latitude]
    };

    await job.save();

    res.status(200).json({
      job,
      locationChangesRemaining: updatedSubscription.maxLocationChanges - updatedSubscription.locationChangesUsed,
      locationChangesUsed: updatedSubscription.locationChangesUsed,
      maxLocationChanges: updatedSubscription.maxLocationChanges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  applyToJob,
  updateJob,
  hireWorkerForJob,
  getAssignedJobs,
  getHiredJobsForEmployer,
  rejectApplicant,
  getEmployerJobs,
  acceptHiringRequest,
  rejectHiringRequest,
  getWorkerHiringRequests,
  updateJobLocation
};

