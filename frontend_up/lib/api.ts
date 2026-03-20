const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl();
export const API_ROOT_URL = API_BASE_URL.replace("/api", "");

// Keys that are known to hold image or file URLs.
// resolveImageUrls will only attempt URL resolution for values under these keys.
const IMAGE_KEYS = new Set([
  'profileImage', 'profilePicture', 'photo', 'avatar',
  'startPhoto', 'endPhoto', 'logo', 'image', 'images',
  'pdfUrl', 'certificateUrl', 'resume', 'document', 'fileUrl'
]);

function resolveImageUrls(data: any, key?: string): any {
  if (typeof data === 'string' && data) {
    // Only attempt URL resolution for known image/file fields
    if (key && !IMAGE_KEYS.has(key)) return data;

    if (data.startsWith('/uploads')) {
      return `${API_ROOT_URL}${data}`;
    }
    if (/^\d{13,}-.*\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i.test(data)) {
      return `${API_ROOT_URL}/uploads/${data}`;
    }
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return data;
    }
  }
  if (Array.isArray(data)) {
    return data.map(item => resolveImageUrls(item, key));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.keys(data).reduce((acc, k) => {
      acc[k] = resolveImageUrls(data[k], k);
      return acc;
    }, {} as any);
  }
  return data;
}


export class APIError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }
}

export class APIClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const defaultHeaders = new Headers({
      "Content-Type": "application/json",
    });

    // Merge provided headers with default headers
    if (options.headers) {
      const incomingHeaders = new Headers(options.headers);
      incomingHeaders.forEach((value, key) => {
        defaultHeaders.set(key, value);
      });
    }

    // Authorization is now handled by HttpOnly cookies automatically via credentials: 'include'
    // but we can still allow explicit Authorization if passed (e.g. for SSR if needed)
    
    // Try to auto-inject Accept-Language from next-intl cookies
    if (typeof document !== "undefined" && !defaultHeaders.has("Accept-Language")) {
      const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'));
      if (match) {
        defaultHeaders.set("Accept-Language", match[2]);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
      credentials: 'include', // Automatically send cookies
    })

    const responseText = await response.text();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Response for ${endpoint}: Status - ${response.status}, OK - ${response.ok}`);
      console.log(`API Response Text for ${endpoint}: ${responseText}`);
    }

    if (!response.ok) {
      if (response.status === 429 && typeof window !== "undefined") {
        // Only trigger event for non-silent requests (profile checks are silent)
        if (endpoint !== "/users/profile") {
          window.dispatchEvent(new CustomEvent("api-rate-limit", { 
            detail: { message: "Too many requests. Please wait a few minutes." } 
          }));
        }
      }

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: "An unknown error occurred" };
      }
      throw new APIError(errorData.message || `API Error: ${response.status}`, response.status, errorData);
    }

    if (response.status === 204 || responseText === "") {
      return {} as T;
    }

    const jsonData = JSON.parse(responseText);
    return resolveImageUrls(jsonData) as T;
  }

  async checkMobile(mobile: string) {
    return this.request<{ exists: boolean; role?: string; message?: string }>("/users/check-mobile", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    })
  }

  async registerInitiate(data: {
    name: string
    email?: string
    password?: string
    role: "worker" | "employer"
    mobile: string
    skills?: string[]
    companyName?: string
    workerType?: string[]
    isFresher?: boolean
    experience?: number
    gender?: string
  }) {
    return this.request("/users/register-initiate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async registerComplete(data: { mobile: string; otp: string }) {
    return this.request("/users/register-complete", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async requestOTP(mobile: string) {
    return this.request("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ mobile }),
    })
  }

  async verifyOTP(data: { mobile: string; otp: string }) {
    return this.request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async loginUser(data: { email: string; password: string }) {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getProfile() {
    return this.request("/users/profile")
  }

  // getPublicUserProfile is the canonical method for fetching any user profile by ID
  async getPublicUserProfile(id: string) {
    return this.request(`/users/profile/${id}`)
  }

  async updateProfile(data: Record<string, any>) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getWorkerDashboard() {
    return this.request("/users/dashboard/worker")
  }

  async changePassword(newPassword: string): Promise<any> {
    return this.request("/users/change-password", {
      method: "PUT",
      body: JSON.stringify({ newPassword }),
    })
  }

  async getEmployerDashboard() {
    return this.request("/users/dashboard/employer")
  }

  async getEmployerAnalytics() {
    return this.request("/users/dashboard/employer/analytics")
  }

  async searchWorkers(params: {
    keyword?: string
    skills?: string
    location?: string
    availability?: string
    workerType?: string // Add workerType
  }) {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as any).toString()
    return this.request(`/users/search/workers?${query}`)
  }

  async unlockWorkerProfile(workerId: string) {
    return this.request(`/users/workers/${workerId}/unlock`, {
      method: "POST",
    })
  }

  async createJob(data: {
    title: string
    description: string
    skills: string[]
    salary: number
    location: { address: string; latitude?: number; longitude?: number }
    workType: "temporary" | "permanent"
    durationDays?: number
    totalOpenings: number
    minExperience?: number
    maxExperience?: number
    otpVerificationRequired: boolean
    geoTaggingRequired: boolean
    workerType: string[]
  }) {
    return this.request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getJobs(params?: {
    keyword?: string
    location?: string
    skills?: string
    salary?: number
    minSalary?: number
    maxSalary?: number
    minExperience?: number
    maxExperience?: number
    workType?: string
    workerType?: string // Add workerType parameter
    pageNumber?: number
    locale?: string // Add locale parameter
  }) {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString()
    return this.request(`/jobs?${query}`)
  }

  async getJobById(id: string, locale?: string) {
    const query = locale ? `?locale=${locale}` : '';
    return this.request(`/jobs/${id}${query}`)
  }

  async applyToJob(jobId: string, cvId?: string) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({ cvId }),
    })
  }

  async updateJob(id: string, data: Record<string, any>) {
    return this.request(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteJob(id: string) {
    return this.request(`/jobs/${id}`, {
      method: "DELETE",
    })
  }

  async hireWorkerForJob(jobId: string, workerId: string) {
    return this.request(`/jobs/${jobId}/hire/${workerId}`, {
      method: "PUT",
    })
  }

  async getAssignedJobs(locale?: string) {
    const query = locale ? `?locale=${locale}` : '';
    return this.request(`/jobs/assigned${query}`)
  }

  async getHiredJobsForEmployer() {
    return this.request("/jobs/hired")
  }

  async getWorkerCompletedJobs(userId: string) {
    return this.request(`/users/${userId}/completed-jobs`);
  }

  async getEmployerJobs(locale?: string) {
    const query = locale ? `?locale=${locale}` : '';
    return this.request(`/jobs/my-jobs${query}`)
  }

  async getWorkerHiringRequests() {
    return this.request("/jobs/hiring-requests")
  }

  async getWorkerApplications() {
    return this.request("/applications/worker");
  }

  async getWorkLogByJob(jobId: string) {
    return this.request(`/worklogs/job/${jobId}`);
  }

  async getWorkLogsByJob(jobId: string) {
    return this.request(`/worklogs/job/${jobId}/all`);
  }

  async getWorkLogsForWorker() {
    return this.request("/worklogs/worker");
  }

  async generateStartWorkOtp(jobId: string, workerId: string): Promise<{ message: string; otp: string; workLogId: string }> {
    return this.request(`/worklogs/job/${jobId}/worker/${workerId}/generate-start-otp`, {
      method: "POST",
    });
  }

  async verifyStartWorkOtp(jobId: string, workerId: string, data: { otp: string }) {
    return this.request(`/worklogs/job/${jobId}/worker/${workerId}/verify-start-otp`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async generateEndWorkOtp(jobId: string, workerId: string) {
    return this.request(`/worklogs/job/${jobId}/worker/${workerId}/generate-end-otp`, {
      method: "POST",
    });
  }

  async verifyEndWorkOtp(jobId: string, workerId: string, data: { otp: string }) {
    return this.request(`/worklogs/job/${jobId}/worker/${workerId}/verify-end-otp`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkLogPhoto(jobId: string, workerId: string, data: { type: "start" | "end", photoUrl: string, latitude: string, longitude: string, address: string | null }) {
    return this.request(`/worklogs/job/${jobId}/worker/${workerId}/photo`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async createConversation(senderId: string, receiverId: string) {
    return this.request("/conversations", {
      method: "POST",
      body: JSON.stringify({ senderId, receiverId }),
    })
  }

  async getConversations(userId: string) {
    return this.request(`/conversations/${userId}`)
  }

  async sendMessage(data: { conversationId: string; sender: string; text: string; clientMessageId?: string }) {
    return this.request("/messages", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getMessages(conversationId: string, locale?: string) {
    const query = locale ? `?locale=${locale}` : '';
    return this.request(`/messages/${conversationId}${query}`)
  }

  async rateUser(data: {
    job: string
    user: string
    rating: number
    review: string
  }) {
    return this.request("/ratings", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createPaymentIntent(amount: number) {
    return this.request("/payments/create-payment-intent", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  async initiatePaytmPayment(data: {
    amount: number;
    orderId: string;
    customerId: string;
    email?: string;
    phone?: string;
    planId: string;
    platform: 'web' | 'mobile';
  }) {
    return this.request<{
      success: boolean;
      txnToken: string;
      orderId: string;
      mid: string;
      host?: string;
    }>("/payments/paytm/initiate", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createSubscription(plan: "free" | "basic" | "premium" | "pro") {
    return this.request("/payments/subscribe", {
      method: "POST",
      body: JSON.stringify({ plan }),
    })
  }

  async purchaseWorklogAddon() {
    return this.request("/payments/addon", {
      method: "POST"
    })
  }


  async getSubscriptionPlans() {
    return this.request("/payments/plans");
  }

  async getPaymentPreview(planId: string): Promise<{
    basePrice: number;
    upgradeCredit: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    taxRate: number;
  }> {
    return this.request(`/payments/preview?planId=${planId}`);
  }

  async getCurrentSubscription(): Promise<any> {
    return this.request<any>("/payments/current");
  }

  // NOTE: generateInvoice was removed — invoices are auto-generated by the backend
  // on subscription creation. There is no /payments/generate-invoice route.

  async getInvoices() {
    return this.request("/payments/invoices");
  }

  async getInvoiceById(id: string) {
    return this.request(`/payments/invoices/${id}`);
  }

  async downloadInvoice(id: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch(`${this.baseURL}/payments/invoices/${id}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Download failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to download invoice: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Admin: Get all invoices
  async getAdminInvoices(params?: { status?: string; search?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = `/payments/admin/invoices${queryString ? `?${queryString}` : ''}`;
    return this.request(url, { method: 'GET' });
  }

  // Admin: Update invoice status
  async updateInvoiceStatus(id: string, status: string) {
    return this.request(`/payments/admin/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  // Admin: Send payment reminder
  async sendPaymentReminder(id: string) {
    return this.request(`/payments/admin/invoices/${id}/remind`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // Notification Center - Templates
  async getNotificationTemplates(targetAudience?: string) {
    const url = targetAudience
      ? `/notification-center/templates?targetAudience=${targetAudience}`
      : '/notification-center/templates';
    return this.request(url, { method: 'GET' });
  }

  async createNotificationTemplate(data: {
    name: string;
    targetAudience: string;
    title: string;
    message: string;
    variables?: string[];
    actionUrl?: string;
  }) {
    return this.request('/notification-center/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateNotificationTemplate(id: string, data: {
    name: string;
    title: string;
    message: string;
    variables?: string[];
    actionUrl?: string;
  }) {
    return this.request(`/notification-center/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteNotificationTemplate(id: string) {
    return this.request(`/notification-center/templates/${id}`, {
      method: 'DELETE'
    });
  }

  // Notification Center - Filtering
  async getFilteredWorkers(filters: {
    workerTypes?: string[];
    location?: string;
  }) {
    return this.request('/notification-center/filter/workers', {
      method: 'POST',
      body: JSON.stringify(filters)
    });
  }

  async getFilteredEmployers(filters: {
    hasActiveJobs?: boolean;
    jobTypes?: string[];
    location?: string;
  }) {
    return this.request('/notification-center/filter/employers', {
      method: 'POST',
      body: JSON.stringify(filters)
    });
  }

  // Notification Center - Sending
  async sendBulkNotification(data: {
    userIds: string[];
    title: string;
    message: string;
    actionUrl?: string; // Optional action URL
    channels: {
      inApp: boolean;
      whatsApp: boolean;
    };
  }) {
    return this.request('/notification-center/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async previewNotification(data: {
    title: string;
    message: string;
    targetAudience: string;
  }) {
    return this.request('/notification-center/preview', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }



  async uploadDocument(data: {
    name: string
    url: string
    type: string
    expiryDate?: string
  }) {
    return this.request("/documents", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getUserDocuments() {
    return this.request("/documents")
  }

  async createDispute(data: {
    job: string
    reportedUser: string
    reason: string
  }) {
    return this.request("/disputes", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getAllApplicationsForEmployer() {
    return this.request(`/applications/employer`);
  }

  async getApplicationsForJob(jobId: string) {
    return this.request(`/applications/job/${jobId}`);
  }

  async rejectApplicant(jobId: string, applicantId: string) {
    return this.request(`/jobs/${jobId}/applicants/${applicantId}/reject`, {
      method: "POST",
    });
  }

  async acceptHiringRequest(applicationId: string) {
    return this.request(`/jobs/hiring-requests/${applicationId}/accept`, {
      method: "PUT",
    });
  }

  async rejectHiringRequest(applicationId: string) {
    return this.request(`/jobs/hiring-requests/${applicationId}/reject`, {
      method: "PUT",
    });
  }

  async uploadFile(formData: FormData) {
    const url = `${this.baseURL}/upload`
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: headers, // Let fetch set Content-Type for FormData
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }))
      throw new Error(error.message || `API Error: ${response.status}`)
    }

    const jsonData = await response.json();
    return resolveImageUrls(jsonData);
  }

  async reverseGeocode(latitude: number, longitude: number) {
    return this.request(`/geolocation/reverse?lat=${latitude}&lng=${longitude}`)
  }

  async getWorkerLatestLocation(workerId: string, jobId: string) {
    try {
      return await this.request(`/geolocation/worker/${workerId}/job/${jobId}/latest`)
    } catch (error: any) {
      if (error.message.includes("Worker location not found for this job.")) {
        return null; // Return null if location is not found
      }
      throw error; // Re-throw other errors
    }
  }

  async getWorkerRoute(workerId: string, jobId: string) {
    try {
      return await this.request(`/geolocation/worker/${workerId}/job/${jobId}/route`);
    } catch (error: any) {
      if (error.message.includes("Worker route not found for this job today.")) {
        return []; // Return empty array if route is not found
      }
      throw error; // Re-throw other errors
    }
  }

  async updateWorkerLocation(workerId: string, jobId: string, latitude: number, longitude: number) {
    return this.request(`/geolocation/worker/${workerId}/job/${jobId}/location`, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    })
  }

  async getAdminDashboard() {
    return this.request("/admin/dashboard")
  }

  async calculateRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<Array<{ latitude: number; longitude: number; }>> {
    return this.request(`/geolocation/calculate-route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`);
  }

  async getAnalytics(timeRange?: string): Promise<{
    userRegistrations: Array<{ _id: { year: number; month: number }; count: number }>;
    jobPostings: Array<{ category: string; count: number }>;
  }> {
    const query = timeRange ? `?timeRange=${timeRange}` : "";
    return this.request(`/admin/analytics${query}`)
  }

  async getAllUsers(params?: {
    name?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ users: any[]; page: number; pages: number; totalUsers: number }> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/users?${query}`);
  }

  async getAllJobs(params?: {
    title?: string;
    status?: string;
    workType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ jobs: any[]; page: number; pages: number; totalJobs: number }> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/jobs?${query}`);
  }

  async getAdminJobDetails(jobId: string) {
    return this.request(`/admin/jobs/${jobId}/details`);
  }

  async getAdminConversationMessages(conversationId: string) {
    return this.request(`/admin/conversations/${conversationId}/messages`);
  }

  async approveJob(jobId: string) {
    return this.request(`/admin/jobs/${jobId}/approve`, {
      method: "PUT",
    })
  }

  async approveUser(userId: string) {
    return this.request(`/admin/users/${userId}/approve`, {
      method: "PUT",
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/users/${userId}`, {
      method: "DELETE",
    })
  }

  async getAllRatings(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ ratings: any[]; page: number; pages: number; total: number }> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/ratings?${query}`);
  }

  async deleteRating(ratingId: string) {
    return this.request(`/admin/ratings/${ratingId}`, {
      method: "DELETE",
    })
  }

  async getAllDocuments(params?: {
    documentName?: string;
    status?: string;
    type?: string;
    userName?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ documents: any[]; page: number; pages: number; totalDocuments: number }> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/documents?${query}`);
  }

  async updateDocumentStatus(documentId: string, status: "approved" | "rejected" | "pending") {
    return this.request(`/admin/documents/${documentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  }

  async getAllDisputes(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/disputes?${query}`);
  }

  async resolveDispute(disputeId: string, resolution: string) {
    return this.request(`/admin/disputes/${disputeId}/resolve`, {
      method: "PUT",
      body: JSON.stringify({ resolution }),
    })
  }

  async getAllSubscriptions(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ subscriptions: any[]; page: number; pages: number; total: number }> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/subscriptions?${query}`);
  }

  async getSubscriptionById(subscriptionId: string) {
    return this.request(`/admin/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, data: { plan?: string; endDate?: string }) {
    return this.request(`/admin/subscriptions/${subscriptionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSubscription(subscriptionId: string) {
    return this.request(`/admin/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request(`/admin/subscriptions/${subscriptionId}/cancel`, {
      method: "PUT",
    })
  }

  async getAllPayments(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/payments?${query}`);
  }

  async getAdminWorklogs(params?: {
    search?: string;
    date?: string;
    status?: string;
  }): Promise<any[]> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/worklogs/workers?${query}`);
  }

  async getWorkerWorklogs(userId: string, params?: {
    jobTitle?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    const queryString = query ? `?${query}` : "";
    return this.request(`/admin/worklogs/worker/${userId}${queryString}`);
  }

  async updateAdminWorklogStatus(worklogId: string, status: string): Promise<any> {
    return this.request(`/admin/worklogs/${worklogId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
  }

  async deleteAdminWorklog(worklogId: string): Promise<any> {
    return this.request(`/admin/worklogs/${worklogId}`, {
      method: "DELETE"
    });
  }

  async getSupportMessages(params?: {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ messages: any[]; page: number; pages: number; total: number }> {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/admin/support-messages?${query}`);
  }

  async updateSupportMessageStatus(id: string, status: string) {
    return this.request(`/admin/support-messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteSupportMessage(id: string) {
    return this.request(`/admin/support-messages/${id}`, {
      method: "DELETE",
    });
  }

  async getPendingRatingPrompts() {
    return this.request("/ratings/pending-prompts");
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
  }) {
    const query = new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined) as any).toString();
    return this.request(`/notifications?${query}`);
  }

  async getUnreadNotificationCount() {
    return this.request("/notifications/unread-count");
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/mark-all-read", {
      method: "PUT",
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  async clearReadNotifications() {
    return this.request("/notifications/clear-all", {
      method: "DELETE",
    });
  }
  async updateCompanyProfile(userId: string, data: any) {
    return this.request(`/users/${userId}/company-profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateUserSubscription(userId: string, planType: string) {
    return this.request(`/users/subscription`, {
      method: "PUT",
      body: JSON.stringify({ userId, planType }),
    });
  }

  async markMessagesAsRead(conversationId: string) {
    return this.request(`/messages/${conversationId}/read`, {
      method: "PUT",
    });
  }

  async logout() {
    return this.request("/users/logout", {
      method: "POST",
    });
  }

  // Testimonials
  async getActiveTestimonials() {
    return this.request("/site/testimonials");
  }

  async getAllTestimonials() {
    return this.request("/admin/testimonials");
  }

  async createTestimonial(data: {
    author: string;
    role: string;
    quote: string;
    rating?: number;
    image?: string;
    isActive?: boolean;
  }) {
    return this.request("/admin/testimonials", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTestimonial(id: string, data: Partial<{
    author: string;
    role: string;
    quote: string;
    rating: number;
    image: string;
    isActive: boolean;
  }>) {
    return this.request(`/admin/testimonials/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTestimonial(id: string) {
    return this.request(`/admin/testimonials/${id}`, {
      method: "DELETE",
    });
  }

  // System Settings
  async getSettings(): Promise<Record<string, any>> {
    return this.request('/site/settings');
  }

  async updateSetting(key: string, value: any): Promise<any> {
    return this.request(`/site/settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ value })
    });
  }
}

export const apiClient = new APIClient()