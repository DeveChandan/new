const fs = require('fs');
const path = require('path');
const { User } = require('../models/User');
const WorkLog = require('../models/WorkLog');
const Testimonial = require('../models/Testimonial');
const Document = require('../models/Document');
const Invoice = require('../models/Invoice');

/**
 * Get all files in a directory recursively
 */
const getAllFiles = (dirPath, arrayOfFiles) => {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            // Store relative path from uploads directory
            const fullPath = path.join(dirPath, file);
            const relativePath = path.relative(path.join(__dirname, '../../uploads'), fullPath);
            arrayOfFiles.push('/uploads/' + relativePath.replace(/\\/g, '/'));
        }
    });

    return arrayOfFiles;
};

/**
 * Clean up unused files in the uploads directory
 */
const cleanUnusedFiles = async () => {
    try {
        console.log('🧹 Starting unused file cleanup...');
        
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            console.log('⚠️ Uploads directory does not exist');
            return { deleted: 0, checked: 0 };
        }

        // 1. Get all files in uploads directory
        const allFiles = getAllFiles(uploadsDir);
        console.log(`📂 Found ${allFiles.length} files in uploads directory`);

        // 2. Aggregate all file references from database
        const usedFiles = new Set();

        // Users
        const users = await User.find({}, 'profilePicture documents companyDetails.documents');
        users.forEach(user => {
            if (user.profilePicture) usedFiles.add(user.profilePicture);
            if (user.documents) {
                user.documents.forEach(doc => usedFiles.add(doc.url));
            }
            if (user.companyDetails && user.companyDetails.documents) {
                if (user.companyDetails.documents.gstCertificate) usedFiles.add(user.companyDetails.documents.gstCertificate);
                if (user.companyDetails.documents.panCard) usedFiles.add(user.companyDetails.documents.panCard);
            }
        });

        // WorkLogs
        const workLogs = await WorkLog.find({}, 'startPhoto endPhoto');
        workLogs.forEach(log => {
            if (log.startPhoto) usedFiles.add(log.startPhoto);
            if (log.endPhoto) usedFiles.add(log.endPhoto);
        });

        // Testimonials
        const testimonials = await Testimonial.find({}, 'image');
        testimonials.forEach(t => {
            if (t.image) usedFiles.add(t.image);
        });

        // Documents
        const documents = await Document.find({}, 'url');
        documents.forEach(d => {
            if (d.url) usedFiles.add(d.url);
        });

        // Invoices
        const invoices = await Invoice.find({}, 'pdfUrl');
        invoices.forEach(i => {
            if (i.pdfUrl) usedFiles.add(i.pdfUrl);
        });

        console.log(`🔗 Found ${usedFiles.size} unique file references in database`);

        // 3. Identify orphaned files
        const orphanedFiles = allFiles.filter(file => {
            // Handle both full URLs and relative paths
            // If the DB has a full URL, we extract the path part for comparison
            // But since our models usually store /uploads/..., we can compare directly
            return !usedFiles.has(file);
        });

        if (orphanedFiles.length === 0) {
            console.log('✅ No orphaned files found');
            return { deleted: 0, checked: allFiles.length };
        }

        console.log(`🗑️ Found ${orphanedFiles.length} orphaned files to delete`);

        // 4. Delete orphaned files
        let deletedCount = 0;
        for (const file of orphanedFiles) {
            try {
                // Remove the /uploads/ prefix to get filesystem path
                const filePath = path.join(uploadsDir, file.replace('/uploads/', ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`✅ Deleted: ${file}`);
                }
            } catch (err) {
                console.error(`❌ Failed to delete ${file}:`, err.message);
            }
        }

        console.log(`✨ Successfully deleted ${deletedCount} unused files`);
        return { deleted: deletedCount, checked: allFiles.length };

    } catch (error) {
        console.error('❌ Error in unused file cleanup:', error);
        throw error;
    }
};

module.exports = { cleanUnusedFiles };
