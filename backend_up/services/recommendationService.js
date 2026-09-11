const { User } = require('../models/User');
const Job = require('../models/Job');
const whatsappService = require('./whatsappService');
const notificationService = require('./notificationService');
const { escapeRegex } = require('../utils');

/**
 * Finds the best-matching workers for a new job based on City, WorkerType, and Skills,
 * then dispatches in-app, socket, and push notifications to them.
 * @param {object} newJob The newly created job object.
 */
const findAndNotifyWorkers = async (newJob) => {
    try {
        console.log(`Starting recommendation search for new job: ${newJob.title}`);

        const jobWorkerTypes = Array.isArray(newJob.workerType) && newJob.workerType.length > 0
            ? newJob.workerType
            : (newJob.workerType ? [newJob.workerType] : []);
        
        if (jobWorkerTypes.length === 0) {
            console.log("Job has no workerType defined, skipping worker notifications.");
            return;
        }

        const jobCity = (newJob.location?.city || '').trim();
        const jobSkills = Array.isArray(newJob.skills)
            ? newJob.skills.filter(s => s && s.trim())
            : [];

        // Base criteria: active worker matching workerType
        const baseQuery = {
            role: 'worker',
            isActive: true,
            accountStatus: 'active',
            workerType: { $in: jobWorkerTypes },
        };

        // City matching: match worker's city, locationName, or within radius if coordinates available
        let cityCondition = null;
        if (jobCity) {
            const escapedCity = escapeRegex(jobCity);
            cityCondition = {
                $or: [
                    { city: { $regex: `^${escapedCity}$`, $options: 'i' } },
                    { city: { $regex: escapedCity, $options: 'i' } },
                    { locationName: { $regex: escapedCity, $options: 'i' } }
                ]
            };
        }

        let matchedWorkers = [];

        // Tier 1: Match WorkerType + City + Skills
        if (cityCondition && jobSkills.length > 0) {
            const tier1Query = {
                ...baseQuery,
                ...cityCondition,
                skills: { $in: jobSkills }
            };
            const tier1Workers = await User.find(tier1Query).limit(20).lean();
            matchedWorkers = [...tier1Workers];
        }

        // Tier 2: If we need more workers, Match WorkerType + City (even without exact skill tags)
        if (cityCondition && matchedWorkers.length < 15) {
            const existingIds = new Set(matchedWorkers.map(w => w._id.toString()));
            const tier2Query = {
                ...baseQuery,
                ...cityCondition,
                _id: { $nin: Array.from(existingIds) }
            };
            const tier2Workers = await User.find(tier2Query).limit(15 - matchedWorkers.length).lean();
            matchedWorkers = [...matchedWorkers, ...tier2Workers];
        }

        // Tier 3: If still no workers found in the city (or job has no city), match by WorkerType + Skills
        if (matchedWorkers.length < 5) {
            const existingIds = new Set(matchedWorkers.map(w => w._id.toString()));
            const tier3Query = {
                ...baseQuery,
                _id: { $nin: Array.from(existingIds) }
            };
            if (jobSkills.length > 0) {
                tier3Query.skills = { $in: jobSkills };
            }
            const tier3Workers = await User.find(tier3Query).limit(10 - matchedWorkers.length).lean();
            matchedWorkers = [...matchedWorkers, ...tier3Workers];
        }

        if (matchedWorkers.length === 0) {
            console.log("No matching workers found for this job criteria.");
            return;
        }

        console.log(`Found ${matchedWorkers.length} matching workers for job "${newJob.title}" (City: ${jobCity || 'Any'}). Dispatching push notifications...`);

        // 1. Immediately dispatch In-App and Push Notifications
        const pushPromises = matchedWorkers.map(worker => 
            notificationService.createAndSend({
                userId: worker._id,
                userRole: 'worker',
                type: 'job_suggestion',
                title: notificationTitle,
                message: notificationMessage,
                relatedId: newJob._id,
                relatedModel: 'Job',
                actionUrl: `/jobs/${newJob._id}`,
                metadata: {
                    jobId: newJob._id,
                    city: jobCity,
                    salary: newJob.salary,
                    workerType: newJob.workerType?.[0]
                }
            })
        );

        const pushResults = await Promise.allSettled(pushPromises);
        const pushSuccess = pushResults.filter(r => r.status === 'fulfilled').length;
        console.log(`📲 In-App & Push notifications sent to ${pushSuccess}/${matchedWorkers.length} workers.`);

        // 2. Dispatch WhatsApp messages if WhatsApp is configured
        if (whatsappService.isConfigured()) {
            console.log(`💬 WhatsApp is configured. Dispatching job suggestions to ${matchedWorkers.length} workers...`);
            (async () => {
                for (const worker of matchedWorkers) {
                    if (worker.mobile) {
                        try {
                            await whatsappService.sendJobSuggestion(worker.mobile, {
                                workerName: worker.name,
                                jobTitle: newJob.title,
                                employerName: newJob.employer?.name || 'a verified employer'
                            });
                        } catch (err) {
                            console.error(`Failed to send WhatsApp job suggestion to ${worker.mobile}:`, err.message);
                        }
                        // Stagger 300ms between messages to prevent rate-limiting
                        await new Promise(res => setTimeout(res, 300));
                    }
                }
            })().catch(err => console.error('Error during WhatsApp worker notification loop:', err));
        } else {
            console.log('[RecommendationService] WhatsApp not configured in .env. Skipping WhatsApp job suggestions.');
        }

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

        // Find recent jobs that match the new worker's primary workerType and city
        const baseJobQuery = {
            status: 'open',
            workerType: { $in: newWorker.workerType },
        };

        let recentJobs = [];
        if (newWorker.city && newWorker.city.trim()) {
            const escapedCity = escapeRegex(newWorker.city.trim());
            const cityQuery = {
                ...baseJobQuery,
                $or: [
                    { 'location.city': { $regex: escapedCity, $options: 'i' } },
                    { 'location.address': { $regex: escapedCity, $options: 'i' } }
                ]
            };
            recentJobs = await Job.find(cityQuery)
                .sort({ createdAt: -1 })
                .limit(20)
                .populate('employer', 'name mobile')
                .lean();
        }

        // If no jobs in worker's city, fallback to general jobs for this workerType
        if (recentJobs.length === 0) {
            recentJobs = await Job.find(baseJobQuery)
                .sort({ createdAt: -1 })
                .limit(20)
                .populate('employer', 'name mobile')
                .lean();
        }

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

        // 1. Immediately dispatch In-App and Push Notifications
        const pushPromises = Array.from(uniqueEmployers.values()).map(employer =>
            notificationService.createAndSend({
                userId: employer._id,
                userRole: 'employer',
                type: 'worker_suggestion',
                title: 'New Worker Match!',
                message: `We found a worker matching your open jobs: ${newWorker.name}`,
                relatedId: newWorker._id,
                relatedModel: 'User',
                actionUrl: `/profile/${newWorker._id}`
            })
        );

        const pushResults = await Promise.allSettled(pushPromises);
        const pushSuccess = pushResults.filter(r => r.status === 'fulfilled').length;
        console.log(`📲 In-App & Push notifications sent to ${pushSuccess}/${uniqueEmployers.size} employers.`);

        // 2. Dispatch WhatsApp messages if WhatsApp is configured
        if (whatsappService.isConfigured()) {
            console.log(`💬 WhatsApp is configured. Dispatching worker suggestions to ${uniqueEmployers.size} employers...`);
            (async () => {
                for (const employer of uniqueEmployers.values()) {
                    if (employer.mobile) {
                        try {
                            await whatsappService.sendWorkerSuggestion(employer.mobile, {
                                employerName: employer.name,
                                workerName: newWorker.name,
                                workerSkills: newWorker.skills?.join(', ') || 'various skills'
                            });
                        } catch (err) {
                            console.error(`Failed to send WhatsApp worker suggestion to ${employer.mobile}:`, err.message);
                        }
                        // Stagger 300ms between messages to prevent rate-limiting
                        await new Promise(res => setTimeout(res, 300));
                    }
                }
            })().catch(err => console.error('Error during WhatsApp employer notification loop:', err));
        } else {
            console.log('[RecommendationService] WhatsApp not configured in .env. Skipping WhatsApp worker suggestions.');
        }

    } catch (error) {
        console.error("Error in findAndNotifyEmployers:", error);
    }
};


module.exports = {
    findAndNotifyWorkers,
    findAndNotifyEmployers,
};
