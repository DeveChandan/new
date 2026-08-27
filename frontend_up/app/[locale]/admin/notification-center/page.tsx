'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/navigation'
import { useAuth } from '@/hooks/use-auth'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Loader2,
    Send,
    Eye,
    Save,
    Trash2,
    Users,
    Check,
    ChevronsUpDown,
    X,
    Megaphone,
    Wrench,
    AlertTriangle,
    ShieldAlert,
    Sparkles,
    Power,
    Plus,
    Radio,
    Clock,
    Smartphone,
    Globe
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import moment from 'moment'
import { workerTypeSkills } from "@/lib/worker-data"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Template {
    _id: string
    name: string
    targetAudience: 'worker' | 'employer'
    title: string
    message: string
    variables: string[]
    actionUrl?: string
}

interface User {
    _id: string
    name: string
    email: string
    mobile?: string
    workerType?: string[]
    location?: { city?: string }
    companyName?: string
}

export default function NotificationCenterPage() {
    const { user, isLoading: authLoading } = useAuth()
    const router = useRouter()

    // State
    const [activeTab, setActiveTab] = useState<'worker' | 'employer'>('worker')
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [actionUrl, setActionUrl] = useState('')
    const [templateName, setTemplateName] = useState('')
    const [saveAsTemplate, setSaveAsTemplate] = useState(false)

    // Worker filters
    const [workerTypes, setWorkerTypes] = useState<string[]>([])
    const [location, setLocation] = useState('')

    // Employer filters
    const [hasActiveJobs, setHasActiveJobs] = useState(true)
    const [employerJobTypes, setEmployerJobTypes] = useState<string[]>([])
    const [employerLocation, setEmployerLocation] = useState('')
    const [openEmployerJobType, setOpenEmployerJobType] = useState(false)

    // Recipients
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])

    // Channels
    const [inApp, setInApp] = useState(true)
    const [whatsApp, setWhatsApp] = useState(false)

    // Loading states
    const [loading, setLoading] = useState(false)
    const [filtering, setFiltering] = useState(false)
    const [sending, setSending] = useState(false)

    // Announcements & Maintenance Alerts State
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
    const [creatingAnnouncement, setCreatingAnnouncement] = useState(false)
    const [annTitle, setAnnTitle] = useState('')
    const [annMessage, setAnnMessage] = useState('')
    const [annType, setAnnType] = useState<'maintenance' | 'info' | 'warning' | 'critical' | 'success'>('maintenance')
    const [annTarget, setAnnTarget] = useState<'all' | 'worker' | 'employer'>('all')
    const [annPlatform, setAnnPlatform] = useState<'all' | 'web' | 'mobile'>('all')
    const [annDismissible, setAnnDismissible] = useState(true)
    const [annSendPush, setAnnSendPush] = useState(false)
    const [annActionUrl, setAnnActionUrl] = useState('')
    const [annActionLabel, setAnnActionLabel] = useState('Learn More')
    const [annStartDate, setAnnStartDate] = useState('')
    const [annEndDate, setAnnEndDate] = useState('')

    // Dropdown state
    const [openWorkerType, setOpenWorkerType] = useState(false)
    const workerRoles = Object.keys(workerTypeSkills)

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/auth/login')
            return
        }

        if (!authLoading) {
            fetchTemplates()
            fetchAnnouncements()
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (activeTab === 'worker' || activeTab === 'employer') {
            fetchTemplates()
        } else if (activeTab === ('announcements' as any)) {
            fetchAnnouncements()
        }
    }, [activeTab])

    const fetchAnnouncements = async () => {
        try {
            setLoadingAnnouncements(true)
            const res = await apiClient.getAllAnnouncements()
            if (res.success && Array.isArray(res.announcements)) {
                setAnnouncements(res.announcements)
            }
        } catch (err: any) {
            console.error('Failed to fetch announcements:', err)
        } finally {
            setLoadingAnnouncements(false)
        }
    }

    const fetchTemplates = async () => {
        try {
            const data = await apiClient.getNotificationTemplates(activeTab)
            setTemplates(data as Template[])
        } catch (error: any) {
            console.error('Error fetching templates:', error)
        }
    }

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t._id === templateId)
        if (template) {
            setSelectedTemplate(templateId)
            setTitle(template.title)
            setMessage(template.message)
            setActionUrl(template.actionUrl || '')
            setTemplateName(template.name)
        }
    }

    const handleFilterUsers = async () => {
        try {
            setFiltering(true)
            let data: any

            if (activeTab === 'worker') {
                data = await apiClient.getFilteredWorkers({
                    workerTypes: workerTypes.length > 0 ? workerTypes : undefined,
                    location: location || undefined
                })
            } else {
                data = await apiClient.getFilteredEmployers({
                    hasActiveJobs,
                    jobTypes: employerJobTypes.length > 0 ? employerJobTypes : undefined,
                    location: employerLocation || undefined
                })
            }

            setFilteredUsers(data.workers || data.employers || [])
            setSelectedUsers((data.workers || data.employers || []).map((u: User) => u._id))
            toast.success(`Found ${data.count} ${activeTab}s`)
        } catch (error: any) {
            toast.error(error.message || 'Failed to filter users')
        } finally {
            setFiltering(false)
        }
    }

    const handlePreview = async () => {
        try {
            const data = await apiClient.previewNotification({
                title,
                message,
                targetAudience: activeTab
            })

            const preview = data as any
            toast.info(
                <div>
                    <div className="font-bold">{preview.preview.title}</div>
                    <div className="text-sm mt-1">{preview.preview.message}</div>
                    <div className="text-xs mt-2 text-muted-foreground">
                        Sample: {preview.preview.sampleUser.name}
                    </div>
                </div>,
                { duration: 5000 }
            )
        } catch (error: any) {
            toast.error(error.message || 'Failed to preview')
        }
    }

    const handleSaveTemplate = async () => {
        try {
            if (!templateName) {
                toast.error('Please enter a template name')
                return
            }

            await apiClient.createNotificationTemplate({
                name: templateName,
                targetAudience: activeTab,
                title,
                message,
                variables: [],
                actionUrl
            })

            toast.success('Template saved successfully')
            fetchTemplates()
            setSaveAsTemplate(false)
            setTemplateName('')
            setActionUrl('')
        } catch (error: any) {
            toast.error(error.message || 'Failed to save template')
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        try {
            await apiClient.deleteNotificationTemplate(id)
            toast.success('Template deleted')
            fetchTemplates()
            if (selectedTemplate === id) {
                setSelectedTemplate('')
                setTitle('')
                setMessage('')
                setActionUrl('')
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete template')
        }
    }

    const handleCreateAnnouncement = async () => {
        if (!annTitle.trim() || !annMessage.trim()) {
            toast.error('Title and announcement message are required')
            return
        }

        try {
            setCreatingAnnouncement(true)
            const res = await apiClient.createAnnouncement({
                title: annTitle.trim(),
                message: annMessage.trim(),
                type: annType,
                targetAudience: annTarget,
                platform: annPlatform,
                isDismissible: annDismissible,
                sendPush: annSendPush,
                actionUrl: annActionUrl.trim() || undefined,
                actionLabel: annActionLabel.trim() || undefined,
                startDate: annStartDate || undefined,
                endDate: annEndDate || undefined,
            })

            if (res.success) {
                toast.success('Service announcement broadcasted successfully!')
                setAnnTitle('')
                setAnnMessage('')
                setAnnActionUrl('')
                setAnnStartDate('')
                setAnnEndDate('')
                setAnnSendPush(false)
                fetchAnnouncements()
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to broadcast announcement')
        } finally {
            setCreatingAnnouncement(false)
        }
    }

    const handleToggleAnnouncement = async (id: string) => {
        try {
            const res = await apiClient.toggleAnnouncementStatus(id)
            if (res.success) {
                toast.success(res.message || 'Status updated')
                fetchAnnouncements()
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update status')
        }
    }

    const handleDeleteAnnouncement = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return
        try {
            const res = await apiClient.deleteAnnouncement(id)
            if (res.success) {
                toast.success('Announcement deleted')
                fetchAnnouncements()
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete announcement')
        }
    }

    const handleSend = async () => {
        try {
            if (!title || !message) {
                toast.error('Title and message are required')
                return
            }

            if (selectedUsers.length === 0) {
                toast.error('No recipients selected')
                return
            }

            if (!inApp && !whatsApp) {
                toast.error('Select at least one delivery channel')
                return
            }

            setSending(true)

            const result = await apiClient.sendBulkNotification({
                userIds: selectedUsers,
                title,
                message,
                actionUrl: actionUrl || undefined,
                channels: { inApp, whatsApp }
            })

            const res = result as any
            toast.success(
                <div>
                    <div className="font-bold">Notifications sent!</div>
                    {inApp && <div className="text-sm">In-App: {res.results.inApp.success} sent, {res.results.inApp.failed} failed</div>}
                    {whatsApp && <div className="text-sm">WhatsApp: {res.results.whatsApp.success} sent, {res.results.whatsApp.failed} failed</div>}
                </div>,
                { duration: 5000 }
            )

            // Reset form
            setTitle('')
            setMessage('')
            setActionUrl('')
            setSelectedUsers([])
            setFilteredUsers([])
        } catch (error: any) {
            toast.error(error.message || 'Failed to send notifications')
        } finally {
            setSending(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold">Notification Center</h1>
                <p className="text-muted-foreground mt-2">Send targeted notifications to workers and employers</p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="worker" className="gap-2">
                        <Users className="w-4 h-4" />
                        Targeted Workers
                    </TabsTrigger>
                    <TabsTrigger value="employer" className="gap-2">
                        <Users className="w-4 h-4" />
                        Targeted Employers
                    </TabsTrigger>
                    <TabsTrigger value="announcements" className="gap-2">
                        <Radio className="w-4 h-4 text-amber-500" />
                        Service & Maintenance Alerts
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="worker" className="space-y-6">
                    {/* Worker Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter Workers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Job Roles</label>
                                <Popover open={openWorkerType} onOpenChange={setOpenWorkerType}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openWorkerType}
                                            className="w-full justify-between"
                                        >
                                            {workerTypes.length > 0
                                                ? `${workerTypes.length} selected`
                                                : "Select job roles..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search job role..." />
                                            <CommandList>
                                                <CommandEmpty>No job role found.</CommandEmpty>
                                                <CommandGroup>
                                                    {workerRoles.map((role) => (
                                                        <CommandItem
                                                            key={role}
                                                            value={role}
                                                            onSelect={(currentValue) => {
                                                                setWorkerTypes(prev =>
                                                                    prev.includes(currentValue)
                                                                        ? prev.filter(item => item !== currentValue)
                                                                        : [...prev, currentValue]
                                                                )
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    workerTypes.includes(role) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {role}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {workerTypes.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {workerTypes.map(type => (
                                            <div key={type} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                                {type}
                                                <X
                                                    className="w-3 h-3 cursor-pointer"
                                                    onClick={() => setWorkerTypes(prev => prev.filter(t => t !== type))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location (City)</label>
                                <Input
                                    placeholder="Enter city name (e.g., Mumbai, Pune)..."
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to search in all locations
                                </p>
                            </div>

                            <Button onClick={handleFilterUsers} disabled={filtering} className="w-full">
                                {filtering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                                Filter Workers
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="employer" className="space-y-6">
                    {/* Employer Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter Employers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={hasActiveJobs}
                                    onChange={(e) => setHasActiveJobs(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-medium">Only employers with active jobs</label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Job Types Posted</label>
                                <Popover open={openEmployerJobType} onOpenChange={setOpenEmployerJobType}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openEmployerJobType}
                                            className="w-full justify-between"
                                        >
                                            {employerJobTypes.length > 0
                                                ? `${employerJobTypes.length} selected`
                                                : "Select job types..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search job type..." />
                                            <CommandList>
                                                <CommandEmpty>No job type found.</CommandEmpty>
                                                <CommandGroup>
                                                    {workerRoles.map((role) => (
                                                        <CommandItem
                                                            key={role}
                                                            value={role}
                                                            onSelect={(currentValue) => {
                                                                setEmployerJobTypes(prev =>
                                                                    prev.includes(currentValue)
                                                                        ? prev.filter(item => item !== currentValue)
                                                                        : [...prev, currentValue]
                                                                )
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    employerJobTypes.includes(role) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {role}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {employerJobTypes.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {employerJobTypes.map(type => (
                                            <div key={type} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                                {type}
                                                <X
                                                    className="w-3 h-3 cursor-pointer"
                                                    onClick={() => setEmployerJobTypes(prev => prev.filter(t => t !== type))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location (City)</label>
                                <Input
                                    placeholder="Enter city name..."
                                    value={employerLocation}
                                    onChange={(e) => setEmployerLocation(e.target.value)}
                                />
                            </div>

                            <Button onClick={handleFilterUsers} disabled={filtering} className="w-full">
                                {filtering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                                Filter Employers
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Announcements & Maintenance Alerts Content */}
                <TabsContent value="announcements" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Create Announcement Form (2 cols) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-amber-500" />
                                        Broadcast New Service Announcement / Maintenance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">Alert Type</label>
                                            <select
                                                value={annType}
                                                onChange={(e) => setAnnType(e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="maintenance">🛠️ Maintenance Notice</option>
                                                <option value="critical">🚨 Critical Alert</option>
                                                <option value="warning">⚠️ Important Warning</option>
                                                <option value="info">📢 General Info</option>
                                                <option value="success">✨ Feature / Success</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">Target Audience</label>
                                            <select
                                                value={annTarget}
                                                onChange={(e) => setAnnTarget(e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="all">Everyone (All Users)</option>
                                                <option value="worker">Workers Only</option>
                                                <option value="employer">Employers Only</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">Platform</label>
                                            <select
                                                value={annPlatform}
                                                onChange={(e) => setAnnPlatform(e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                <option value="all">All (Web & Mobile)</option>
                                                <option value="web">Web App Only</option>
                                                <option value="mobile">Mobile App Only</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">Title / Headline</label>
                                        <Input
                                            placeholder="e.g., Scheduled Platform Maintenance on Sunday 2 AM - 4 AM IST"
                                            value={annTitle}
                                            onChange={(e) => setAnnTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">Detailed Message</label>
                                        <Textarea
                                            placeholder="Explain the alert clearly to users (e.g. Services will be momentarily paused for database optimization)..."
                                            value={annMessage}
                                            onChange={(e) => setAnnMessage(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">Action Link (Optional URL)</label>
                                            <Input
                                                placeholder="https://..."
                                                value={annActionUrl}
                                                onChange={(e) => setAnnActionUrl(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">Button Label</label>
                                            <Input
                                                placeholder="Learn More"
                                                value={annActionLabel}
                                                onChange={(e) => setAnnActionLabel(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">Start Schedule (Optional)</label>
                                            <Input
                                                type="datetime-local"
                                                value={annStartDate}
                                                onChange={(e) => setAnnStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">End / Expiry Schedule (Optional)</label>
                                            <Input
                                                type="datetime-local"
                                                value={annEndDate}
                                                onChange={(e) => setAnnEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 bg-muted/40 rounded-lg space-y-2 border border-border/50">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="dismissibleCheck"
                                                checked={annDismissible}
                                                onChange={(e) => setAnnDismissible(e.target.checked)}
                                                className="w-4 h-4 text-primary rounded"
                                            />
                                            <label htmlFor="dismissibleCheck" className="text-xs font-medium cursor-pointer">
                                                Allow users to dismiss the top banner (Uncheck for critical lockouts)
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="pushBlastCheck"
                                                checked={annSendPush}
                                                onChange={(e) => setAnnSendPush(e.target.checked)}
                                                className="w-4 h-4 text-primary rounded"
                                            />
                                            <label htmlFor="pushBlastCheck" className="text-xs font-medium cursor-pointer text-amber-700 dark:text-amber-400">
                                                Also blast as In-App Notification & Mobile Push to all targeted accounts
                                            </label>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCreateAnnouncement}
                                        disabled={creatingAnnouncement}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold"
                                    >
                                        {creatingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                                        Broadcast Live Announcement
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Live Banner Preview (1 col) */}
                        <div className="space-y-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Live Top Banner Preview
                            </div>

                            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-md">
                                <div className={`p-3 rounded-lg text-white text-xs space-y-2 shadow-sm ${
                                    annType === 'maintenance' ? 'bg-amber-600' :
                                    annType === 'critical' ? 'bg-rose-600' :
                                    annType === 'warning' ? 'bg-amber-500 text-slate-950' :
                                    annType === 'success' ? 'bg-emerald-600' : 'bg-indigo-600'
                                }`}>
                                    <div className="flex items-center justify-between font-bold">
                                        <div className="flex items-center gap-1.5">
                                            {annType === 'maintenance' ? <Wrench className="w-3.5 h-3.5" /> :
                                             annType === 'critical' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                                             annType === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                             annType === 'success' ? <Sparkles className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                                            <span className="uppercase text-[10px] tracking-wider bg-black/20 px-1.5 py-0.5 rounded">
                                                {annType}
                                            </span>
                                        </div>
                                        {annDismissible && <X className="w-3.5 h-3.5 opacity-80" />}
                                    </div>
                                    <div className="font-semibold">
                                        {annTitle || 'Scheduled Maintenance Notice'}
                                    </div>
                                    <p className="opacity-90 leading-relaxed text-[11px]">
                                        {annMessage || 'Services will be temporarily paused for routine server upgrades.'}
                                    </p>
                                    {annActionUrl && (
                                        <div className="pt-1">
                                            <span className="inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] font-medium">
                                                {annActionLabel || 'Learn More'} →
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg space-y-1">
                                    <div>• Target: <span className="font-semibold capitalize text-foreground">{annTarget}</span></div>
                                    <div>• Platform: <span className="font-semibold capitalize text-foreground">{annPlatform}</span></div>
                                    <div>• Push Blast: <span className="font-semibold text-foreground">{annSendPush ? 'Enabled' : 'Disabled'}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active & Past Announcements Table */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Active & Historical Broadcasts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingAnnouncements ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    No broadcast announcements found. Create one above to notify all users.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                                            <tr>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">Title & Message</th>
                                                <th className="p-3">Audience</th>
                                                <th className="p-3">Schedule</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {announcements.map((ann) => (
                                                <tr key={ann._id} className="hover:bg-muted/20">
                                                    <td className="p-3">
                                                        <Badge variant={ann.isActive ? "default" : "outline"} className={ann.isActive ? "bg-emerald-600 text-white" : ""}>
                                                            {ann.isActive ? "Active" : "Disabled"}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-medium capitalize">{ann.type}</span>
                                                    </td>
                                                    <td className="p-3 max-w-xs">
                                                        <div className="font-semibold text-foreground">{ann.title}</div>
                                                        <div className="text-muted-foreground truncate">{ann.message}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="capitalize">{ann.targetAudience} ({ann.platform})</div>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground text-[11px]">
                                                        {ann.startDate ? moment(ann.startDate).format("MMM DD, HH:mm") : "Immediate"}
                                                        {ann.endDate ? ` → ${moment(ann.endDate).format("MMM DD, HH:mm")}` : " (No Expiry)"}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleToggleAnnouncement(ann._id)}
                                                                className="h-7 px-2 text-[11px] gap-1"
                                                            >
                                                                <Power className="w-3 h-3" />
                                                                {ann.isActive ? "Disable" : "Enable"}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteAnnouncement(ann._id)}
                                                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Targeted Notification Composer (Only for worker / employer tabs) */}
            {activeTab !== ('announcements' as any) && (
              <>
                {/* Recipients Count */}
                {filteredUsers.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">
                                <Users className="w-4 h-4 inline mr-2" />
                                {selectedUsers.length} of {filteredUsers.length} recipients selected
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Template Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {templates.map((template) => (
                                <div key={template._id} className="flex items-center gap-2">
                                    <Button
                                        variant={selectedTemplate === template._id ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleTemplateSelect(template._id)}
                                        className="flex-1"
                                    >
                                        {template.name}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTemplate(template._id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Message Composer */}
                <Card>
                    <CardHeader>
                        <CardTitle>Compose Notification</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Notification title"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Use variables: {name}, {jobRole}, {location}, {companyName}"
                                rows={5}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Available variables: {'{name}'}, {'{jobRole}'}, {'{location}'}, {'{companyName}'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Action URL (Optional)</label>
                            <Input
                                value={actionUrl}
                                onChange={(e) => setActionUrl(e.target.value)}
                                placeholder="e.g., /dashboard/worker/jobs or https://shramikseva.com/offers"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Where should the user go when they click the notification?
                            </p>
                        </div>

                        {/* Save as Template */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={saveAsTemplate}
                                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <label className="text-sm font-medium">Save as template</label>
                        </div>

                        {saveAsTemplate && (
                            <div className="flex gap-2">
                                <Input
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Template name"
                                />
                                <Button onClick={handleSaveTemplate}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delivery Channels */}
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Channels</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={inApp}
                                onChange={(e) => setInApp(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <label className="text-sm font-medium">In-App Notification</label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={whatsApp}
                                onChange={(e) => setWhatsApp(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <label className="text-sm font-medium">WhatsApp Message</label>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                    <Button onClick={handlePreview} variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                    </Button>
                    <Button onClick={handleSend} disabled={sending || selectedUsers.length === 0}>
                        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Send to {selectedUsers.length} Recipients
                    </Button>
                </div>
              </>
            )}
        </div>
    )
}
