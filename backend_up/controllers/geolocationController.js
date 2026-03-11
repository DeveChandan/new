const axios = require('axios');
const WorkerLocation = require('../models/WorkerLocation'); // Import the new model
const Job = require('../models/Job'); // Import Job model for authorization
const { User } = require('../models/User'); // Import User model
const { getIo } = require('../socket');

const reverseGeocode = async (req, res) => {
  console.log('API Hit: reverseGeocode', req.query);
  const lat = req.query.lat || req.query.latitude;
  const lng = req.query.lng || req.query.longitude;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required.' });
  }

  try {
    // Using OpenStreetMap Nominatim for reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'ShramikSeva/1.0 (shramik-seva-app@gmail.com)',
      },
    });

    if (response.data && response.data.display_name) {
      res.json({ address: response.data.display_name });
    } else {
      res.status(404).json({ message: 'Address not found for these coordinates.' });
    }
  } catch (error) {
    console.error('Error during reverse geocoding:', error.message);
    res.status(500).json({ message: 'Failed to get address from coordinates.' });
  }
};

const updateWorkerLocation = async (req, res) => {
  console.log('API Hit: updateWorkerLocation', req.params.workerId, req.params.jobId, req.body);
  const { workerId, jobId } = req.params;
  const { latitude, longitude } = req.body;

  // Authorization: Only the authenticated worker can update their own location
  if (req.user._id.toString() !== workerId) {
    return res.status(403).json({ message: 'Not authorized to update this worker\'s location.' });
  }

  try {
    console.log('Step 1: Finding job and checking authorization...');
    const job = await Job.findById(jobId);
    if (!job || !job.workers.some(w => w.workerId.toString() === workerId)) {
      console.log('Step 1 Failed: Job not found or worker not hired.');
      return res.status(404).json({ message: 'Job not found or worker not hired for this job.' });
    }
    console.log('Step 1 Succeeded: Job found and worker authorized.');

    console.log('Step 2: Fetching worker details...');
    const worker = await User.findById(workerId);
    if (!worker) {
      console.log('Step 2 Failed: Worker not found.');
      return res.status(404).json({ message: 'Worker not found.' });
    }
    console.log('Step 2 Succeeded: Worker found.');

    console.log('Step 3: Updating/Creating WorkerLocation...');
    let workerLocation = await WorkerLocation.findOneAndUpdate(
      {
        worker: workerId,
        job: jobId,
      },
      {
        latitude,
        longitude,
        timestamp: new Date(), // Update timestamp to ensure it\'s the latest
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if one doesn\'t exist
        sort: { timestamp: -1 } // Sort to ensure we update the latest if multiple exist (though upsert should prevent this)
      }
    );
    console.log('Step 3 Succeeded: WorkerLocation updated/created.', workerLocation);

    console.log('Step 4: Emitting socket event...');
    const io = getIo();
    const eventData = {
      workerId,
      workerName: worker.name, // Include worker's name
      jobId,
      latitude: workerLocation.latitude,
      longitude: workerLocation.longitude,
      timestamp: workerLocation.timestamp,
    };

    // Emit to job room (for live tracking on job details page)
    io.to(`job:${jobId}`).emit('workerLocationUpdated', eventData);

    // Emit to employer's personal room (if they are elsewhere in the app)
    io.to(`user:${job.employer.toString()}`).emit('workerLocationUpdated', eventData);
    console.log('Step 4 Succeeded: Socket event emitted.');

    res.status(201).json(workerLocation);
  } catch (error) {
    console.error('Error updating worker location:', error);
    res.status(500).json({ message: 'Failed to update worker location.' });
  }
};

const getWorkerLatestLocation = async (req, res) => {
  console.log('API Hit: getWorkerLatestLocation', req.params.workerId, req.params.jobId);
  const { workerId, jobId } = req.params;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Authorization: Only the employer of the job can view the worker's location
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this worker\'s location for this job.' });
    }

    const latestLocation = await WorkerLocation.findOne({ worker: workerId, job: jobId })
      .sort({ timestamp: -1 }) // Get the latest one
      .limit(1);

    if (latestLocation) {
      res.json(latestLocation);
    } else {
      res.status(404).json({ message: 'Worker location not found for this job.' });
    }
  } catch (error) {
    console.error('Error fetching worker latest location:', error);
    res.status(500).json({ message: 'Failed to fetch worker latest location.' });
  }
};

const getWorkerRoute = async (req, res) => {
  console.log('API Hit: getWorkerRoute', req.params.workerId, req.params.jobId);
  const { workerId, jobId } = req.params;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Authorization: Allow employer of the job OR the worker themselves to view the route
    if (job.employer.toString() !== req.user._id.toString() && workerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this worker\'s route for this job.' });
    }

    // Get all locations for the worker and job for the current day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const workerRoute = await WorkerLocation.find({
      worker: workerId,
      job: jobId,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ timestamp: 1 }); // Sort by timestamp ascending to get the route in order

    if (workerRoute.length > 0) {
      res.json(workerRoute);
    } else {
      res.status(404).json({ message: 'Worker route not found for this job today.' });
    }
  } catch (error) {
    console.error('Error fetching worker route:', error);
    res.status(500).json({ message: 'Failed to fetch worker route.' });
  }
};

const calculateRoute = async (req, res) => {
  console.log('API Hit: calculateRoute', req.query);
  let startLatVal, startLngVal, endLatVal, endLngVal;

  if (req.query.origin && req.query.destination) {
    [startLatVal, startLngVal] = req.query.origin.split(',').map(Number);
    [endLatVal, endLngVal] = req.query.destination.split(',').map(Number);
  } else {
    startLatVal = Number(req.query.startLat);
    startLngVal = Number(req.query.startLng);
    endLatVal = Number(req.query.endLat);
    endLngVal = Number(req.query.endLng);
  }

  if (isNaN(startLatVal) || isNaN(startLngVal) || isNaN(endLatVal) || isNaN(endLngVal)) {
    return res.status(400).json({ message: 'Valid start and end coordinates are required.' });
  }

  try {
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${startLngVal},${startLatVal};${endLngVal},${endLatVal}?overview=full&geometries=geojson`;
    const response = await axios.get(osrmUrl);

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const routeGeometry = response.data.routes[0].geometry.coordinates;
      // OSRM returns [longitude, latitude], convert to [{ latitude, longitude }]
      const formattedRoute = routeGeometry.map((coord) => ({
        longitude: coord[0],
        latitude: coord[1],
      }));
      res.json(formattedRoute);
    } else {
      res.status(404).json({ message: 'Route not found.' });
    }
  } catch (error) {
    console.error('Error fetching route from OSRM:', error.message);
    res.status(500).json({ message: 'Failed to calculate route.' });
  }
};

module.exports = {
  reverseGeocode,
  updateWorkerLocation,
  getWorkerLatestLocation,
  getWorkerRoute,
  calculateRoute,
};
