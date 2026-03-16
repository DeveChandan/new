const Application = require('../models/Application');
const Job = require('../models/Job');
const NotificationService = require('../services/notificationService');

const createApplication = async (req, res) => {
  const { jobId } = req.params;
  const workerId = req.user._id;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if worker has already applied
    const existingApplication = await Application.findOne({ job: jobId, worker: workerId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create new application
    const application = new Application({
      job: jobId,
      worker: workerId,
    });
    await application.save();

    // Trigger Notification for Employer
    const employerId = job.employer;
    await NotificationService.createAndSend({
      userId: employerId,
      userRole: 'employer',
      type: 'job_application',
      title: 'New Job Application',
      message: `A worker has applied for your job: ${job.title}`,
      relatedId: jobId,
      relatedModel: 'Job',
      actionUrl: `/job/${jobId}/applicants`,
      metadata: { applicationId: application._id }
    });

    // Add worker to job's applicants list
    job.applicants.addToSet(workerId);
    await job.save();

    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getApplicationsForJob = async (req, res) => {
  console.log('API Hit: getApplicationsForJob', req.params.jobId);
  const { jobId } = req.params;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Authorization: Only the employer who posted the job can view applications
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view applications for this job.' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('worker', 'name email mobile role isApproved availability rating profilePicture') // Populate worker details
      .sort({ appliedDate: -1 });

    console.log('API Response: getApplicationsForJob', applications);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications for job:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllApplicationsForEmployer = async (req, res) => {
  console.log('API Hit: getAllApplicationsForEmployer', req.user._id);
  try {
    // Find all jobs posted by the employer
    const employerJobs = await Job.find({ employer: req.user._id }).select('_id');
    const jobIds = employerJobs.map(job => job._id);

    // Find all applications for these jobs
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('worker', 'name email mobile role isApproved availability')
      .populate('job', 'title') // Populate job title for context
      .sort({ appliedDate: -1 });

    console.log('API Response: getAllApplicationsForEmployer', applications);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching all applications for employer:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getWorkerApplications = async (req, res) => {
  console.log('API Hit: getWorkerApplications', req.user._id);
  try {
    const applications = await Application.find({ worker: req.user._id })
      .populate({
        path: 'job',
        populate: { path: 'employer', select: 'name companyName' }
      })
      .sort({ appliedDate: -1 });

    // Filter out applications where job has been deleted
    const validApplications = applications.filter(app => app.job !== null);

    console.log('API Response: getWorkerApplications', validApplications.length, 'valid out of', applications.length, 'total');
    res.json(validApplications);
  } catch (error) {
    console.error('Error fetching worker applications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createApplication,
  getApplicationsForJob,
  getAllApplicationsForEmployer,
  getWorkerApplications,
};
