const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    author: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true
    },
    role: {
        type: String,
        required: [true, 'Role/Designation is required'],
        trim: true
    },
    quote: {
        type: String,
        required: [true, 'Testimonial quote is required'],
        trim: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial;
