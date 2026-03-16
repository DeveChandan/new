const APPLICATION_STATUSES = ['pending', 'approved', 'rejected', 'hired', 'offered', 'offerAccepted', 'offerRejected'];
const JOB_STATUSES = ['open', 'closed', 'in-progress', 'completed', 'done'];
const JOB_WORKER_STATUSES = ['open', 'in-progress', 'completed', 'cancelled'];
const WORKLOG_STATUSES = ['pending', 'assigned', 'in-progress', 'completed', 'approved', 'rejected', 'incomplete', 'cancelled'];
const SUBSCRIPTION_STATUSES = ['active', 'expired', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'success', 'failure', 'refunded'];
const MESSAGE_STATUSES = ['sent', 'delivered', 'read'];
const INVOICE_STATUSES = ['pending', 'paid', 'overdue', 'refunded', 'cancelled'];
const DISPUTE_STATUSES = ['pending', 'resolved', 'rejected'];
const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'];
const USER_AVAILABILITY = ['available', 'unavailable'];

// Other relevant model constants
const WORKER_TYPES = ['Security guards', 'Security Supervisor', 'Housekeepers', 'Facility Manager',
    'Electricians', 'Plumbers', 'Liftman', 'Fireman', 'Gardener', 'Pantry Boy',
    'Nurse', 'Aya', 'Carpenters', 'Welders', 'Electronic mechanic', 'Motor mechanic',
    'Swimming trainer', 'WTP / STP operator', 'Accountant', 'Rajmistri (Masons)',
    'Any skilled/unskilled workers'];
const DOCUMENT_TYPES = ['biodata', 'bank_account', 'adhaar_card', 'voter_id', 'skill_certificate', 'experience_certificate', 'other', 'business_registration', 'gst_certificate', 'pan_card', 'company_registration'];
const JOB_WORK_TYPES = ['permanent', 'temporary'];


module.exports = {
    APPLICATION_STATUSES,
    JOB_STATUSES,
    JOB_WORKER_STATUSES,
    WORKLOG_STATUSES,
    SUBSCRIPTION_STATUSES,
    PAYMENT_STATUSES,
    MESSAGE_STATUSES,
    INVOICE_STATUSES,
    DISPUTE_STATUSES,
    DOCUMENT_STATUSES,
    USER_AVAILABILITY,

    // Expose additional enums here for centralized maintenance
    WORKER_TYPES,
    DOCUMENT_TYPES,
    JOB_WORK_TYPES
};
