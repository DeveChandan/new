const Dispute = require('../models/Dispute');
const { User } = require('../models/User');
const notificationService = require('../services/notificationService');

const createDispute = async (req, res) => {
  const { job, reportedUser, reason } = req.body;
  const reportedBy = req.user._id;

  try {
    const dispute = await Dispute.create({
      job,
      reportedBy,
      reportedUser,
      reason,
    });

    // Notify the reported user
    await notificationService.createAndSend({
      userId: reportedUser,
      userRole: 'worker', // Assuming reported user is a worker, might need to fetch role
      type: 'dispute_opened',
      title: 'A Dispute Has Been Opened',
      message: `A dispute has been opened by ${req.user.name} regarding job ID: ${job}.`,
      relatedId: dispute._id,
      relatedModel: 'Dispute',
      actionUrl: `/disputes/${dispute._id}`
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await notificationService.createAndSend({
        userId: admin._id,
        userRole: 'admin',
        type: 'dispute_opened',
        title: 'New Dispute Opened',
        message: `A new dispute has been opened by ${req.user.name}.`,
        relatedId: dispute._id,
        relatedModel: 'Dispute',
        actionUrl: `/admin/disputes`
      });
    }

    res.status(201).json(dispute);
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ message: 'Failed to create dispute' });
  }
};

const getDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({})
      .populate('job', 'title')
      .populate('reportedBy', 'name')
      .populate('reportedUser', 'name');
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const resolveDispute = async (req, res) => {
  const { resolution } = req.body;
  try {
    const dispute = await Dispute.findById(req.params.id);
    if (dispute) {
      dispute.status = 'resolved';
      dispute.resolution = resolution;
      await dispute.save();

      // Notify the user who reported the dispute
      await notificationService.createAndSend({
        userId: dispute.reportedBy,
        userRole: 'user', // Role might need to be fetched
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: `The dispute you opened has been resolved by an admin.`,
        relatedId: dispute._id,
        relatedModel: 'Dispute',
        actionUrl: `/disputes/${dispute._id}`
      });

      // Notify the user who was reported
      await notificationService.createAndSend({
        userId: dispute.reportedUser,
        userRole: 'user', // Role might need to be fetched
        type: 'dispute_resolved',
        title: 'Dispute Resolved',
        message: `The dispute against you has been resolved.`,
        relatedId: dispute._id,
        relatedModel: 'Dispute',
        actionUrl: `/disputes/${dispute._id}`
      });

      res.json({ message: 'Dispute resolved successfully' });
    } else {
      res.status(404).json({ message: 'Dispute not found' });
    }
  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createDispute, getDisputes, resolveDispute };
