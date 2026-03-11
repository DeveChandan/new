const Rating = require('../models/Rating');
const { User } = require('../models/User');
const Job = require('../models/Job');
const WorkLog = require('../models/WorkLog');
const notificationService = require('../services/notificationService');
const { getLocale } = require('../utils');
const { translateRating, translateJob } = require('../services/translationService');

const createRating = async (req, res) => {
  const { job, user, rating, review } = req.body;
  const ratedBy = req.user._id;

  try {
    const newRating = await Rating.create({
      job,
      user,
      ratedBy,
      rating,
      review,
    });

    // Recalculate and update the user's average rating
    const userToRate = await User.findById(user);
    const allRatings = await Rating.find({ user });
    const avgRating = allRatings.reduce((acc, item) => item.rating + acc, 0) / allRatings.length;
    userToRate.rating = avgRating;
    await userToRate.save();

    // Notify the user who received the rating
    await notificationService.createAndSend({
      userId: user,
      userRole: userToRate.role,
      type: 'new_rating',
      title: 'You Have a New Rating!',
      message: `${req.user.name} gave you a ${rating}-star rating.`,
      relatedId: newRating._id,
      relatedModel: 'Rating',
      actionUrl: `/profile/${user}`
    });

    res.status(201).json(newRating);
  } catch (error) {
    console.error('Error in createRating:', error);
    res.status(500).json({ message: 'Failed to create rating' });
  }
};

const getPendingRatingPrompts = async (req, res) => {
  const userId = req.user._id;
  let pendingPrompts = [];

  try {
    const relevantJobs = await Job.find({
      $or: [
        { employer: userId },
        { 'workers.workerId': userId }
      ],
      isApproved: true,
      status: { $in: ['in-progress', 'completed'] }
    }).populate('workers.workerId').populate('employer', 'name');

    for (const job of relevantJobs) {
      const isEmployer = job.employer._id.toString() === userId.toString();
      const isWorker = job.workers.some(w => w.workerId._id.toString() === userId.toString());

      if (job.workType === 'temporary' && job.status === 'completed') {
        for (const workerEntry of job.workers) {
          const workerId = workerEntry.workerId._id;

          if (isEmployer) {
            const employerRatedWorker = await Rating.findOne({ job: job._id, user: workerId, ratedBy: userId });
            if (!employerRatedWorker) {
              pendingPrompts.push({
                jobId: job._id,
                jobTitle: job.title,
                userIdToRate: workerId,
                userNameToRate: workerEntry.workerId.name,
                ratingType: 'employer_rates_worker',
                jobType: 'temporary',
              });
            }
          }

          if (isWorker && workerId.toString() === userId.toString()) {
            const workerRatedEmployer = await Rating.findOne({ job: job._id, user: job.employer._id, ratedBy: userId });
            if (!workerRatedEmployer) {
              pendingPrompts.push({
                jobId: job._id,
                jobTitle: job.title,
                userIdToRate: job.employer._id,
                userNameToRate: job.employer.name,
                ratingType: 'worker_rates_employer',
                jobType: 'temporary',
              });
            }
          }
        }
      }

      if (job.workType === 'permanent') {
        for (const workerEntry of job.workers) {
          const workerId = workerEntry.workerId._id;

          if (isEmployer || (isWorker && workerId.toString() === userId.toString())) {
            const lastPromptDateEmployer = job.lastEmployerRatingPromptDate || job.createdAt;
            const lastPromptDateWorker = job.lastWorkerRatingPromptDate || job.createdAt;

            if (isEmployer) {
              const completedWorklogsCount = await WorkLog.countDocuments({ job: job._id, worker: workerId, status: 'completed', workDate: { $gte: lastPromptDateEmployer } });
              if (completedWorklogsCount >= job.ratingPromptThresholdDays) {
                const employerRatedWorker = await Rating.findOne({ job: job._id, user: workerId, ratedBy: userId, createdAt: { $gte: lastPromptDateEmployer } });
                if (!employerRatedWorker) {
                  pendingPrompts.push({
                    jobId: job._id,
                    jobTitle: job.title,
                    userIdToRate: workerId,
                    userNameToRate: workerEntry.workerId.name,
                    ratingType: 'employer_rates_worker',
                    jobType: 'permanent',
                  });
                }
              }
            }

            if (isWorker && workerId.toString() === userId.toString()) {
              const completedWorklogsCount = await WorkLog.countDocuments({ job: job._id, worker: workerId, status: 'completed', workDate: { $gte: lastPromptDateWorker } });
              if (completedWorklogsCount >= job.ratingPromptThresholdDays) {
                const workerRatedEmployer = await Rating.findOne({ job: job._id, user: job.employer._id, ratedBy: userId, createdAt: { $gte: lastPromptDateWorker } });
                if (!workerRatedEmployer) {
                  pendingPrompts.push({
                    jobId: job._id,
                    jobTitle: job.title,
                    userIdToRate: job.employer._id,
                    userNameToRate: job.employer.name,
                    ratingType: 'worker_rates_employer',
                    jobType: 'permanent',
                  });
                }
              }
            }
          }
        }
      }
    }

    // Translation support
    const locale = getLocale(req);
    if (locale !== 'en' && pendingPrompts.length > 0) {
      pendingPrompts = await Promise.all(
        pendingPrompts.map(async (prompt) => {
          // We translate the job title and user name dynamically at runtime
          if (prompt.jobTitle) {
            prompt.jobTitle = await require('../services/translationService').translateText(prompt.jobTitle, locale);
          }
          if (prompt.userNameToRate) {
            prompt.userNameToRate = await require('../services/translationService').translateText(prompt.userNameToRate, locale);
          }
          return prompt;
        })
      );
    }

    res.json(pendingPrompts);
  } catch (error) {
    console.error('Error in getPendingRatingPrompts:', error);
    res.status(500).json({ message: 'Failed to fetch pending rating prompts' });
  }
};

module.exports = { createRating, getPendingRatingPrompts };
