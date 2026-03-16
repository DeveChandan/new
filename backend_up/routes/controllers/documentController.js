const Document = require('../models/Document');

const uploadDocument = async (req, res) => {
  console.log('API Hit: uploadDocument', req.body);
  const { name, url, type, expiryDate } = req.body;

  try {
    // If uploading a biodata/resume, remove existing ones to keep only the latest
    if (type === 'biodata') {
      await Document.deleteMany({ user: req.user._id, type: 'biodata' });
    }

    const document = await Document.create({
      user: req.user._id,
      name,
      url,
      type,
      expiryDate,
    });
    console.log('API Response: uploadDocument', document);
    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload document' });
  }
};

const getDocuments = async (req, res) => {
  console.log('API Hit: getDocuments');
  try {
    const documents = await Document.find({ user: req.user._id });
    console.log('API Response: getDocuments', documents);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateDocumentStatus = async (req, res) => {
  console.log('API Hit: updateDocumentStatus', req.params.id, req.body);
  const { status } = req.body;
  try {
    const document = await Document.findById(req.params.id);
    if (document) {
      document.status = status;
      await document.save();
      console.log('API Response: updateDocumentStatus', { message: 'Document status updated' });
      res.json({ message: 'Document status updated' });
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { uploadDocument, getDocuments, updateDocumentStatus };
