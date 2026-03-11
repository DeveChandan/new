const WorkLog = require('../models/WorkLog');
const Job = require('../models/Job');
const { User } = require('../models/User');
const { getIo } = require('../socket');
const { getDistance, getLocale } = require('../utils');
const notificationService = require('../services/notificationService');
const { translateWorkLog } = require('../services/translationService');
const { WORKLOG_STATUSES } = require('../constants/statusEnums');

// Helper function to find the next pending work log for a worker on a job
const findActiveWorkLog = async (jobId, workerId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the next work log that is not yet completed or in-progress,
  // and whose workDate is today or in the future.
  const workLog = await WorkLog.findOne({
    job: jobId,
    worker: workerId,
    status: { $in: [WORKLOG_STATUSES[0], WORKLOG_STATUSES[1], WORKLOG_STATUSES[2]] }, // Include 'in-progress' status
    workDate: { $gte: today }, // Work date is today or in the future
  }).sort({ workDate: 1 }); // Get the earliest upcoming work log

  return workLog;
};

const createWorkLog = async (req, res) => {
  console.log('API Hit: createWorkLog', req.body);
  try {
    const newWorkLog = await WorkLog.create(req.body);
    console.log('API Response: createWorkLog', newWorkLog);
    res.status(201).json(newWorkLog);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create work log' });
  }
};

const getWorkLogByJob = async (req, res) => {
  console.log('API Hit: getWorkLogByJob', req.params.jobId);
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. First, try to find a worklog explicitly for TODAY (active or completed)
    let workLog = await WorkLog.findOne({
      job: req.params.jobId,
      worker: req.user._id,
      workDate: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });

    // 2. If no worklog specifically for today exists yet, find the earliest future one
    if (!workLog) {
      workLog = await WorkLog.findOne({
        job: req.params.jobId,
        worker: req.user._id,
        status: { $in: [WORKLOG_STATUSES[0], WORKLOG_STATUSES[1], WORKLOG_STATUSES[2]] },
        workDate: { $gte: tomorrow },
      }).sort({ workDate: 1 });
    }

    if (!workLog) {
      console.log('API Response: getWorkLogByJob', { message: 'No work log found for today or job duration ended' });
      return res.status(404).json({ message: 'No work log found for today or job duration ended' });
    }

    const locale = getLocale(req);
    const translatedLog = locale !== 'en' ? await translateWorkLog(workLog, locale) : workLog;

    console.log('API Response: getWorkLogByJob', translatedLog);
    res.json(translatedLog);

  } catch (error) {
    console.error('Error in getWorkLogByJob:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateWorkLog = async (req, res) => {
  console.log('API Hit: updateWorkLog', req.params.id, req.body);
  try {
    const workLog = await WorkLog.findById(req.params.id);
    if (workLog) {
      workLog.startTime = req.body.startTime || workLog.startTime;
      workLog.endTime = req.body.endTime || workLog.endTime;
      workLog.startPhoto = req.body.startPhoto || workLog.startPhoto;
      workLog.endPhoto = req.body.endPhoto || workLog.endPhoto;
      workLog.status = req.body.status || workLog.status;
      const updatedWorkLog = await workLog.save();
      console.log('API Response: updateWorkLog', updatedWorkLog);
      res.json(updatedWorkLog);
    } else {
      console.log('API Response: updateWorkLog', { message: 'Work log not found' });
      res.status(404).json({ message: 'Work log not found' });
    }
  } catch (error) {
    console.log('API Response: updateWorkLog', { message: 'Server Error' });
    res.status(500).json({ message: 'Server Error' });
  }
};

const generateStartOtp = async (req, res) => {
  const { jobId, workerId } = req.params;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.otpVerificationRequired) {
      return res.status(400).json({ message: 'OTP verification is not required for this job.' });
    }

    if (workerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to generate OTP for this job' });
    }

    // Check if worklogs have been created for this worker on this job yet
    let workLog = await findActiveWorkLog(jobId, workerId);

    if (!workLog) {
      // If no worklog found for today, check job type and create if necessary
      if (job.workType === 'temporary' && job.durationDays > 0) {
        // This is the first time the worker is starting this temporary job.
        // Create all worklogs for the job's duration starting from today.
        const existingLogForTemporary = await WorkLog.findOne({ job: jobId, worker: workerId });
        if (!existingLogForTemporary) { // Only create if no worklogs exist at all for this temporary job
          const workLogs = [];
          const startDate = new Date();
          startDate.setHours(0, 0, 0, 0);

          for (let i = 0; i < job.durationDays; i++) {
            const workDate = new Date(startDate);
            workDate.setDate(startDate.getDate() + i);
            workLogs.push({
              job: job._id,
              worker: workerId,
              employer: job.employer,
              status: 'assigned',
              workDate: workDate,
            });
          }
          await WorkLog.insertMany(workLogs);
          workLog = await findActiveWorkLog(jobId, workerId); // After creating, find today's worklog
        }
      } else if (job.workType === 'permanent') {
        // For permanent jobs, check if ANY worklog exists for today first.
        const workDate = new Date();
        workDate.setHours(0, 0, 0, 0);

        const existingWorkLogToday = await WorkLog.findOne({
          job: jobId,
          worker: workerId,
          workDate: workDate
        });

        if (existingWorkLogToday) {
          // A worklog for today already exists. It must be completed or in-progress.
          // We'll let the check after this block handle the response.
          workLog = existingWorkLogToday;
        } else {
          // No worklog for today exists at all, so create it.
          workLog = await WorkLog.create({
            job: job._id,
            worker: workerId,
            employer: job.employer,
            status: WORKLOG_STATUSES[0],
            workDate: workDate,
          });
          console.log(`Created on-demand worklog for permanent job ${job._id} and worker ${workerId} for ${workDate}`);
        }
      }
    }

    if (!workLog) {
      // This can happen if a temporary job's duration has passed, or if job type is not handled.
      return res.status(404).json({ message: 'No active work log found for today. The job might have ended or is not configured correctly.' });
    }

    if (workLog.status === WORKLOG_STATUSES[3]) {
      return res.status(400).json({ message: 'Work for today has already been completed.' });
    }

    if (workLog.status === WORKLOG_STATUSES[2]) {
      return res.status(400).json({ message: 'Work has already been started. Use end work to complete.' });
    }

    // If OTP already exists and is verified, don't allow regeneration
    if (workLog.startOtp && workLog.startOtpVerified) {
      return res.status(400).json({ message: 'Start work has already been verified. Please capture your start photo.' });
    }

    // If OTP exists but not verified, check if it's still valid
    if (workLog.startOtp && !workLog.startOtpVerified) {
      const now = new Date();
      if (workLog.startOtpExpires && now < workLog.startOtpExpires) {
        // OTP still valid, return it
        console.log(`Returning existing valid OTP for worker ${workerId} on job ${jobId}: ${workLog.startOtp}`);

        const io = getIo();
        const employerId = job.employer.toString();
        io.to(`user:${employerId}`).emit('workLogUpdated', { jobId, workerId, workLog });
        io.to(`job:${jobId}`).emit('workLogUpdated', { jobId, workerId, workLog });

        return res.json({
          message: 'Start OTP already generated and still valid',
          otp: workLog.startOtp,
          workLogId: workLog._id
        });
      }
      // OTP expired, will regenerate below
      console.log(`OTP expired for worker ${workerId} on job ${jobId}, regenerating...`);
    }


    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);

    workLog.startOtp = otp;
    workLog.startOtpExpires = expires;
    console.log(`WorkLog before save (generateStartOtp):`, workLog);
    await workLog.save();

    const io = getIo();
    // Safely handle employer ID whether populated or not
    const employerId = job.employer._id ? job.employer._id.toString() : job.employer.toString();
    const eventData = { jobId, workerId, workLog };

    console.log('🔔 Emitting workLogUpdated event:');
    console.log('   📍 To employer room:', employerId);
    console.log('   📦 Event data:', {
      jobId,
      workerId,
      workLogId: workLog._id,
      startOtp: workLog.startOtp,
      endOtp: workLog.endOtp
    });

    io.to(`user:${employerId}`).emit('workLogUpdated', eventData);
    io.to(`job:${jobId}`).emit('workLogUpdated', eventData);
    console.log('   ✅ Event emitted successfully');

    // Create notification for employer about OTP generation
    await notificationService.createAndSend({
      userId: job.employer,
      userRole: 'employer',
      type: 'otp_generated',
      title: 'Work Start OTP Generated',
      message: `Start work OTP generated for ${req.user.name} on job: ${job.title}`,
      relatedId: workLog._id,
      relatedModel: 'WorkLog',
      actionUrl: `/dashboard/employer/hired-jobs/${jobId}`,
      metadata: {
        jobId: job._id,
        jobTitle: job.title,
        workerName: req.user.name,
        workerId: workerId,
        otp: otp
      }
    });

    console.log(`Development Start Work OTP for worker ${workerId} on job ${jobId}: ${otp}`);

    res.json({ message: 'Start OTP generated successfully', otp, workLogId: workLog._id });

  } catch (error) {
    console.error('Error in generateStartOtp:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const verifyStartOtp = async (req, res) => {
  const { jobId, workerId } = req.params;
  const { otp } = req.body;

  try {
    console.log(`Verifying start OTP for worker ${workerId} on job ${jobId}`);
    const workLog = await findActiveWorkLog(jobId, workerId); // Use helper

    if (!workLog) {
      return res.status(404).json({ message: 'Work log not found or not active for today' });
    }

    if (workLog.startOtp !== otp || new Date() > workLog.startOtpExpires) {
      console.log(`Invalid OTP. Entered: ${otp}, Expected: ${workLog.startOtp}`);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Use atomic update to prevent race conditions
    const updatedWorkLog = await WorkLog.findOneAndUpdate(
      { _id: workLog._id, startOtp: otp },
      {
        $set: { startOtpVerified: true },
        $unset: { startOtp: "", startOtpExpires: "" }
      },
      { new: true }
    );

    if (!updatedWorkLog) {
      return res.status(400).json({ message: 'Failed to verify OTP due to concurrent update.' });
    }

    const io = getIo();
    // Safely handle employer ID whether populated or not
    const employerId = updatedWorkLog.employer._id ? updatedWorkLog.employer._id.toString() : updatedWorkLog.employer.toString();
    io.to(`user:${employerId}`).emit('workLogUpdated', { jobId, workerId, workLog: updatedWorkLog });
    io.to(`job:${jobId}`).emit('workLogUpdated', { jobId, workerId, workLog: updatedWorkLog });

    res.json({ message: 'Start OTP verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const generateEndOtp = async (req, res) => {
  const { jobId, workerId } = req.params;

  try {
    if (workerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to generate OTP for this job' });
    }

    // Fetch the job so we can use it in the notification below
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.otpVerificationRequired) {
      return res.status(400).json({ message: 'OTP verification is not required for this job.' });
    }

    let workLog = await findActiveWorkLog(jobId, workerId);

    if (!workLog) {
      return res.status(404).json({ message: 'Work log not found or not active for today' });
    }

    if (!workLog.startOtpVerified) {
      return res.status(400).json({ message: 'Start work OTP not verified yet' });
    }

    if (!workLog.startPhoto) {
      return res.status(400).json({ message: 'Start work photo not uploaded yet' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // OTP expires in 15 minutes

    workLog.endOtp = otp;
    workLog.endOtpExpires = expires;
    console.log(`WorkLog before save (generateEndOtp):`, workLog);
    await workLog.save();

    const io = getIo();
    // Safely handle employer ID whether populated or not
    const employerId = workLog.employer._id ? workLog.employer._id.toString() : workLog.employer.toString();
    const eventData = { jobId, workerId, workLog };

    console.log('🔔 Emitting workLogUpdated event (END OTP):');
    console.log('   📍 To employer room:', employerId);
    console.log('   📦 Event data:', {
      jobId,
      workerId,
      workLogId: workLog._id,
      startOtp: workLog.startOtp,
      endOtp: workLog.endOtp
    });

    io.to(`user:${employerId}`).emit('workLogUpdated', eventData);
    io.to(`job:${jobId}`).emit('workLogUpdated', eventData);
    console.log('   ✅ Event emitted successfully');

    // Create notification for employer about end OTP generation
    await notificationService.createAndSend({
      userId: workLog.employer,
      userRole: 'employer',
      type: 'otp_generated',
      title: 'Work End OTP Generated',
      message: `End work OTP generated for ${req.user.name} on job: ${job.title}`,
      relatedId: workLog._id,
      relatedModel: 'WorkLog',
      actionUrl: `/dashboard/employer/hired-jobs/${jobId}`,
      metadata: {
        jobId: job._id,
        jobTitle: job.title,
        workerName: req.user.name,
        workerId: workerId,
        otp: otp
      }
    });

    console.log(`Development End Work OTP for worker ${workerId} on job ${jobId}: ${otp}`);

    res.json({ message: 'End OTP generated successfully', otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const verifyEndOtp = async (req, res) => {
  const { jobId, workerId } = req.params;
  const { otp } = req.body;

  try {
    console.log(`Verifying end OTP for worker ${workerId} on job ${jobId}`);
    const workLog = await findActiveWorkLog(jobId, workerId); // Use helper

    if (!workLog) {
      return res.status(404).json({ message: 'Work log not found or not active for today' });
    }

    if (workLog.endOtp !== otp || new Date() > workLog.endOtpExpires) {
      console.log(`Invalid OTP. Entered: ${otp}, Expected: ${workLog.endOtp}`);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Use atomic update to prevent race conditions
    const updatedWorkLog = await WorkLog.findOneAndUpdate(
      { _id: workLog._id, endOtp: otp },
      {
        $set: { endOtpVerified: true },
        $unset: { endOtp: "", endOtpExpires: "" }
      },
      { new: true }
    );

    if (!updatedWorkLog) {
      return res.status(400).json({ message: 'Failed to verify OTP due to concurrent update.' });
    }

    const io = getIo();
    // Safely handle employer ID whether populated or not
    const employerId = updatedWorkLog.employer._id ? updatedWorkLog.employer._id.toString() : updatedWorkLog.employer.toString();
    io.to(`user:${employerId}`).emit('workLogUpdated', { jobId, workerId, workLog: updatedWorkLog });
    io.to(`job:${jobId}`).emit('workLogUpdated', { jobId, workerId, workLog: updatedWorkLog });

    res.json({ message: 'End OTP verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


const getWorkLogsByJob = async (req, res) => {
  try {
    // If user is employer, check for Worklog Access
    if (req.user.role === 'employer') {
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({
        employer: req.user._id,
        status: 'active',
        endDate: { $gte: new Date() }
      });

      const hasAccess = subscription && (
        subscription.planType === 'premium' ||
        (subscription.worklogAccessExpiry && new Date(subscription.worklogAccessExpiry) > new Date())
      );

      if (!hasAccess) {
        return res.status(403).json({
          message: 'Worklog access denied',
          requiresUpgrade: true,
          addonName: 'Worklog Access',
          price: 2499
        });
      }
    }

    const workLogs = await WorkLog.find({ job: req.params.jobId }).populate('worker', 'name mobile');

    const locale = getLocale(req);
    const translatedLogs = locale !== 'en'
      ? await Promise.all(workLogs.map(log => translateWorkLog(log, locale)))
      : workLogs;

    res.json(translatedLogs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateWorkLogPhoto = async (req, res) => {
  console.log('API Hit: updateWorkLogPhoto', req.params.jobId, req.params.workerId, req.body);
  const { jobId, workerId } = req.params;
  const { type, photoUrl, latitude, longitude, address } = req.body;

  try {
    if (req.user._id.toString() !== workerId) {
      return res.status(403).json({ message: 'Not authorized to update this work log.' });
    }

    let workLog = await findActiveWorkLog(jobId, workerId); // Use helper

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    if (!workLog) {
      // Auto-create on-demand worklog for jobs that don't require OTP,
      // as they bypass `generateStartOtp` which normally handles initial/daily creation.
      if (type === 'start' && !job.otpVerificationRequired) {
        if (job.workType === 'temporary' && job.durationDays > 0) {
          const existingLogForTemporary = await WorkLog.findOne({ job: jobId, worker: workerId });
          if (!existingLogForTemporary) {
            const workLogs = [];
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);

            for (let i = 0; i < job.durationDays; i++) {
              const workDate = new Date(startDate);
              workDate.setDate(startDate.getDate() + i);
              workLogs.push({
                job: job._id,
                worker: workerId,
                employer: job.employer,
                status: WORKLOG_STATUSES[1],
                workDate: workDate,
              });
            }
            await WorkLog.insertMany(workLogs);
            workLog = await findActiveWorkLog(jobId, workerId);
          }
        } else if (job.workType === 'permanent') {
          const workDate = new Date();
          workDate.setHours(0, 0, 0, 0);

          const existingCompleted = await WorkLog.findOne({
            job: jobId,
            worker: workerId,
            workDate: workDate,
            status: WORKLOG_STATUSES[3]
          });

          if (existingCompleted) {
            return res.status(400).json({ message: 'Work for today has already been completed.' });
          }

          workLog = await WorkLog.create({
            job: job._id,
            worker: workerId,
            employer: job.employer,
            status: WORKLOG_STATUSES[0],
            workDate: workDate,
          });
        }
      } else {
        return res.status(404).json({ message: 'Work log not found or not active for today.' });
      }
    }

    if (job.otpVerificationRequired) {
      if (type === 'start' && !workLog.startOtpVerified) {
        return res.status(400).json({ message: 'Start OTP not verified yet. Cannot capture photo.' });
      }
      if (type === 'end' && !workLog.endOtpVerified) {
        return res.status(400).json({ message: 'End OTP not verified yet. Cannot capture photo.' });
      }
    }

    let updateFields = {};
    const options = { new: true, runValidators: true };

    if (type === 'start') {
      updateFields = {
        startPhoto: photoUrl,
        startPhotoLocation: { latitude: String(latitude), longitude: String(longitude) },
        startPhotoAddress: address,
        status: WORKLOG_STATUSES[2],
      };
      if (!workLog.startTime) {
        updateFields.startTime = new Date();
      }
    } else if (type === 'end') {
      if (!workLog.startPhotoLocation || typeof workLog.startPhotoLocation.latitude === 'undefined') {
        return res.status(400).json({ message: 'Start work photo location not found. Cannot verify distance.' });
      }

      const startLat = parseFloat(workLog.startPhotoLocation.latitude);
      const startLon = parseFloat(workLog.startPhotoLocation.longitude);
      const endLat = parseFloat(latitude);
      const endLon = parseFloat(longitude);

      if (isNaN(startLat) || isNaN(startLon) || isNaN(endLat) || isNaN(endLon)) {
        return res.status(400).json({ message: 'Invalid GPS coordinates provided.' });
      }

      const distance = getDistance(startLat, startLon, endLat, endLon);

      if (distance > 0.5) {
        return res.status(400).json({ message: `You are too far from the job location to end the work. Distance: ${distance.toFixed(2)} km` });
      }

      updateFields = {
        endPhoto: photoUrl,
        endPhotoLocation: { latitude: String(latitude), longitude: String(longitude) },
        endPhotoAddress: address,
        endTime: new Date(),
        status: WORKLOG_STATUSES[3],
      };

      await User.findByIdAndUpdate(workerId, { availability: 'available' });
    } else {
      return res.status(400).json({ message: 'Invalid photo type.' });
    }

    const updatedWorkLog = await WorkLog.findByIdAndUpdate(workLog._id, updateFields, options); // Use findByIdAndUpdate

    if (!updatedWorkLog) {
      return res.status(404).json({ message: 'Work log not found after update attempt.' });
    }

    const io = getIo();
    io.to(`user:${updatedWorkLog.employer.toString()}`).emit('workLogUpdated', { jobId, workerId, workLog: updatedWorkLog });
    io.to(`job:${jobId}`).emit('workLogUpdated', { jobId, workerId, workLog: updatedWorkLog });

    // Populate job for notification
    await updatedWorkLog.populate('job', 'title');

    // Create notification for employer based on photo type
    if (type === 'start') {
      await notificationService.createAndSend({
        userId: updatedWorkLog.employer,
        userRole: 'employer',
        type: 'work_started',
        title: 'Work Started',
        message: `${req.user.name} started work on: ${updatedWorkLog.job.title}`,
        relatedId: updatedWorkLog._id,
        relatedModel: 'WorkLog',
        actionUrl: `/dashboard/employer/hired-jobs/${jobId}`,
        metadata: {
          jobId: jobId,
          jobTitle: updatedWorkLog.job.title,
          workerName: req.user.name,
          workerId: workerId,
          startTime: updatedWorkLog.startTime
        }
      });
    } else if (type === 'end') {
      await notificationService.createAndSend({
        userId: updatedWorkLog.employer,
        userRole: 'employer',
        type: 'work_ended',
        title: 'Work Completed',
        message: `${req.user.name} completed work on: ${updatedWorkLog.job.title}`,
        relatedId: updatedWorkLog._id,
        relatedModel: 'WorkLog',
        actionUrl: `/dashboard/employer/hired-jobs/${jobId}`,
        metadata: {
          jobId: jobId,
          jobTitle: updatedWorkLog.job.title,
          workerName: req.user.name,
          workerId: workerId,
          endTime: updatedWorkLog.endTime,
          duration: updatedWorkLog.endTime - updatedWorkLog.startTime
        }
      });
    }

    const locale = getLocale(req);
    const finalLog = locale !== 'en' ? await translateWorkLog(updatedWorkLog, locale) : updatedWorkLog;

    console.log('WorkLog before sending response:', finalLog);
    res.json(finalLog);
  } catch (error) {
    console.error('Error updating work log photo:', error);
    res.status(500).json({ message: 'Failed to update work log photo.' });
  }
};

const getWorkLogsForWorker = async (req, res) => {
  try {
    const workLogs = await WorkLog.find({ worker: req.user._id })
      .populate({
        path: 'job',
        select: 'title employer',
        populate: {
          path: 'employer',
          model: 'User',
          select: 'name companyName'
        }
      })
      .sort({ workDate: 1 });

    const locale = getLocale(req);
    const translatedLogs = locale !== 'en'
      ? await Promise.all(workLogs.map(log => translateWorkLog(log, locale)))
      : workLogs;

    res.json(translatedLogs);
  } catch (error) {
    console.error('Error fetching work logs for worker:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createWorkLog,
  getWorkLogByJob,
  updateWorkLog,
  generateStartOtp,
  verifyStartOtp,
  generateEndOtp,
  verifyEndOtp,
  getWorkLogsByJob,
  updateWorkLogPhoto,
  getWorkLogsForWorker,
};