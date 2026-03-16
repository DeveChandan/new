const cron = require('node-cron');
const Job = require('../models/Job');
const WorkLog = require('../models/WorkLog');
const Rating = require('../models/Rating');
const { getIo } = require('../socket');
const dayjs = require('dayjs');

const ratingPrompt = () => {
    cron.schedule('0 1 * * *', async () => { // Runs daily at 1 AM
        console.log('Running rating prompt cron job...');
        try {
            const today = dayjs().startOf('day').toDate();

            // Find jobs that are either in-progress or completed
            const jobsToReview = await Job.find({
                $or: [
                    { status: 'in-progress' },
                    { status: 'completed' }
                ],
                isApproved: true // Only consider approved jobs
            }).populate('workers.workerId');

            for (const job of jobsToReview) {
                // --- Handle Temporary Jobs ---
                if (job.workType === 'temporary' && job.status === 'completed') {
                    // Check if employer has rated worker(s) for this job
                    for (const workerEntry of job.workers) {
                        const workerId = workerEntry.workerId._id;

                        // Check if employer has rated this worker for this job
                        const employerRatedWorker = await Rating.findOne({
                            job: job._id,
                            user: workerId, // Worker is being rated
                            ratedBy: job.employer // Employer is rating
                        });

                        if (!employerRatedWorker) {
                            // Prompt employer to rate worker
                            const io = getIo();
                            io.to(job.employer.toString()).emit('receiveNotification', {
                                type: 'rating_due',
                                message: `Please rate worker ${workerEntry.workerId.name} for job: ${job.title}`,
                                jobId: job._id,
                                userIdToRate: workerId,
                            });
                            console.log(`Prompted employer ${job.employer} to rate worker ${workerId} for job ${job._id}`);
                        }

                        // Check if worker has rated employer for this job
                        const workerRatedEmployer = await Rating.findOne({
                            job: job._id,
                            user: job.employer, // Employer is being rated
                            ratedBy: workerId // Worker is rating
                        });

                        if (!workerRatedEmployer) {
                            // Prompt worker to rate employer
                            const io = getIo();
                            io.to(workerId.toString()).emit('receiveNotification', {
                                type: 'rating_due',
                                message: `Please rate employer ${job.employer.name} for job: ${job.title}`,
                                jobId: job._id,
                                userIdToRate: job.employer,
                            });
                            console.log(`Prompted worker ${workerId} to rate employer ${job.employer} for job ${job._id}`);
                        }
                    }
                }

                // --- Handle Permanent Jobs ---
                if (job.workType === 'permanent') {
                    for (const workerEntry of job.workers) {
                        const workerId = workerEntry.workerId._id;

                        // Determine the start date for counting worklogs for this rating cycle
                        const lastEmployerPrompt = job.lastEmployerRatingPromptDate || job.createdAt;
                        const lastWorkerPrompt = job.lastWorkerRatingPromptDate || job.createdAt;

                        // Count completed worklogs for this worker since the last prompt
                        const completedWorklogsCount = await WorkLog.countDocuments({
                            job: job._id,
                            worker: workerId,
                            status: 'completed', // Only count completed worklogs
                            workDate: { $gte: lastEmployerPrompt } // Count since last prompt date
                        });

                        // Employer rating prompt logic
                        if (completedWorklogsCount >= job.ratingPromptThresholdDays) {
                            // Check if employer has already rated this worker for this cycle
                            const employerRatedWorker = await Rating.findOne({
                                job: job._id,
                                user: workerId,
                                ratedBy: job.employer,
                                createdAt: { $gte: lastEmployerPrompt } // Rated since last prompt
                            });

                            if (!employerRatedWorker) {
                                const io = getIo();
                                io.to(job.employer.toString()).emit('receiveNotification', {
                                    type: 'rating_due',
                                    message: `Please rate worker ${workerEntry.workerId.name} for recent work on job: ${job.title}`,
                                    jobId: job._id,
                                    userIdToRate: workerId,
                                });
                                job.lastEmployerRatingPromptDate = today; // Update prompt date
                                console.log(`Prompted employer ${job.employer} to rate worker ${workerId} for permanent job ${job._id}`);
                            }
                        }

                        // Worker rating prompt logic
                        if (completedWorklogsCount >= job.ratingPromptThresholdDays) {
                            // Check if worker has already rated this employer for this cycle
                            const workerRatedEmployer = await Rating.findOne({
                                job: job._id,
                                user: job.employer,
                                ratedBy: workerId,
                                createdAt: { $gte: lastWorkerPrompt } // Rated since last prompt
                            });

                            if (!workerRatedEmployer) {
                                const io = getIo();
                                io.to(workerId.toString()).emit('receiveNotification', {
                                    type: 'rating_due',
                                    message: `Please rate employer ${job.employer.name} for recent work on job: ${job.title}`,
                                    jobId: job._id,
                                    userIdToRate: job.employer,
                                });
                                job.lastWorkerRatingPromptDate = today; // Update prompt date
                                console.log(`Prompted worker ${workerId} to rate employer ${job.employer} for permanent job ${job._id}`);
                            }
                        }
                    }
                }
                await job.save(); // Save updated prompt dates
            }
            console.log('Rating prompt cron job finished.');
        } catch (error) {
            console.error('Error in rating prompt cron job:', error);
        }
    });
};

module.exports = ratingPrompt;
