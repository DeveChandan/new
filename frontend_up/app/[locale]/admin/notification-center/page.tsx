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
import { Loader2, Send, Eye, Save, Trash2, Users, Check, ChevronsUpDown, X } from 'lucide-react'
import { toast } from 'sonner'
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
        }
    }, [user, authLoading, router])

    useEffect(() => {
        fetchTemplates()
    }, [activeTab])

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

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'worker' | 'employer')}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="worker">Workers</TabsTrigger>
                    <TabsTrigger value="employer">Employers</TabsTrigger>
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
            </Tabs>

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
        </div>
    )
}
