const cron = require('node-cron');
const Job = require('../models/Job');
const WorkLog = require('../models/WorkLog');
const dayjs = require('dayjs');

const dailyWorkLog = () => {
    cron.schedule('0 0 * * *', async () => { // Runs every day at midnight
        console.log('Running daily worklog creation cron job...');
        try {
            const today = dayjs().startOf('day').toDate();

            // Find all permanent jobs that are in-progress and started on or before today
            const permanentJobs = await Job.find({
                workType: 'permanent',
                status: 'in-progress',
                startDate: { $lte: today }
            }).populate('workers.workerId'); // Populate worker to get worker details if needed, though just ID is enough for worklog

            for (const job of permanentJobs) {
                // For each worker assigned to this permanent job
                for (const workerEntry of job.workers) {
                    const workerId = workerEntry.workerId;

                    // Check if a worklog already exists for this job, worker, and today's date
                    const existingWorkLog = await WorkLog.findOne({
                        job: job._id,
                        worker: workerId,
                        workDate: today // Use workDate as defined in WorkLog model
                    });

                    if (!existingWorkLog) {
                        // Create a new worklog entry for today
                        const newWorkLog = new WorkLog({
                            job: job._id,
                            worker: workerId,
                            employer: job.employer, // Assuming employer is directly on the job
                            workDate: today,
                            status: 'pending' // Initial status, to be updated by worker
                        });
                        await newWorkLog.save();
                        console.log(`Created daily worklog for permanent job ${job._id} and worker ${workerId} for ${today}`);
                    } else {
                        console.log(`Worklog already exists for permanent job ${job._id} and worker ${workerId} for ${today}`);
                    }
                }
            }
            console.log('Daily worklog creation cron job finished.');
        } catch (error) {
            console.error('Error in daily worklog creation cron job:', error);
        }
    });
};

module.exports = dailyWorkLog;