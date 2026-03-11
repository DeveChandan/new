const { User } = require('../models/User');
const Job = require('../models/Job');
const whatsappService = require('./whatsappService');

/**
 * Finds the best-matching workers for a new job and notifies them.
 * @param {object} newJob The newly created job object.
 */
const findAndNotifyWorkers = async (newJob) => {
    try {
        console.log(`Starting recommendation search for new job: ${newJob.title}`);

        // Find workers who match the primary workerType of the job.
        // This is the most important matching criterion.
        const query = {
            role: 'worker',
            workerType: { $in: newJob.workerType },
            // Optional: Add more filters like location or skill overlap for better matching
            // For example, to match skills: skills: { $in: newJob.skills }
        };

        // Find the top 5 best matches. A more advanced system could use a scoring algorithm.
        const matchedWorkers = await User.find(query).limit(5).lean();

        if (matchedWorkers.length === 0) {
            console.log("No matching workers found for this job.");
            return;
        }

        console.log(`Found ${matchedWorkers.length} matching workers. Notifying them...`);

        const notifications = matchedWorkers
            .filter(worker => worker.mobile)
            .map(worker =>
                whatsappService.sendJobSuggestion(worker.mobile, {
                    workerName: worker.name,
                    jobTitle: newJob.title,
                    employerName: newJob.employer.name || 'a reputable employer'
                })
            );

        const results = await Promise.allSettled(notifications);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Job suggestion notifications completed. Success: ${successful}, Failed: ${failed}`);

    } catch (error) {
        console.error("Error in findAndNotifyWorkers:", error);
    }
};

/**
 * Finds relevant employers for a new worker and notifies them.
 * @param {object} newWorker The newly created worker object.
 */
const findAndNotifyEmployers = async (newWorker) => {
    try {
        console.log(`Starting recommendation search for new worker: ${newWorker.name}`);

        // Find recent jobs that match the new worker's primary workerType.
        const query = {
            status: 'open',
            workerType: { $in: newWorker.workerType },
        };

        // Find jobs posted in the last 30 days to target active employers.
        const recentJobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .limit(20) // Limit the search space
            .populate('employer', 'name mobile')
            .lean();

        if (recentJobs.length === 0) {
            console.log("No relevant employers found for this new worker.");
            return;
        }

        // Get a unique list of employers from these recent jobs.
        const uniqueEmployers = new Map();
        for (const job of recentJobs) {
            if (job.employer && job.employer._id && !uniqueEmployers.has(job.employer._id.toString())) {
                uniqueEmployers.set(job.employer._id.toString(), job.employer);
            }
        }

        console.log(`Found ${uniqueEmployers.size} relevant employers. Notifying them...`);

        const notifications = Array.from(uniqueEmployers.values())
            .filter(employer => employer.mobile)
            .map(employer =>
                whatsappService.sendWorkerSuggestion(employer.mobile, {
                    employerName: employer.name,
                    workerName: newWorker.name,
                    workerSkills: newWorker.skills.join(', ') || 'various skills'
                })
            );

        const results = await Promise.allSettled(notifications);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Worker suggestion notifications completed. Success: ${successful}, Failed: ${failed}`);

    } catch (error) {
        console.error("Error in findAndNotifyEmployers:", error);
    }
};


module.exports = {
    findAndNotifyWorkers,
    findAndNotifyEmployers,
};
