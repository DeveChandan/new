const Testimonial = require('../models/Testimonial');

/**
 * GET /api/site/testimonials
 * Public endpoint to fetch active testimonials.
 */
const getActiveTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json(testimonials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/admin/testimonials
 * Admin endpoint to fetch all testimonials.
 */
const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
        res.status(200).json(testimonials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/admin/testimonials
 * Admin endpoint to create a new testimonial.
 */
const createTestimonial = async (req, res) => {
    try {
        const { author, role, quote, rating, image, isActive } = req.body;
        const testimonial = await Testimonial.create({
            author,
            role,
            quote,
            rating,
            image,
            isActive
        });
        res.status(201).json(testimonial);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * PUT /api/admin/testimonials/:id
 * Admin endpoint to update a testimonial.
 */
const updateTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        res.status(200).json(testimonial);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * DELETE /api/admin/testimonials/:id
 * Admin endpoint to delete a testimonial.
 */
const deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        res.status(200).json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getActiveTestimonials,
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
};
