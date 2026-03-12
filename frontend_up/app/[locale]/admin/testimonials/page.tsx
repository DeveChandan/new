"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "@/navigation"
import { useTranslations } from "next-intl"
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Star,
  CheckCircle2,
  XCircle,
  MoreVertical,
  User,
  Quote,
  Eye,
  EyeOff,
  StarHalf,
  Star as StarIcon,
  Upload,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AdminTestimonialsPage() {
  const tCommon = useTranslations("Common")
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null)
  const [formData, setFormData] = useState({
    author: "",
    role: "",
    quote: "",
    rating: 5,
    isActive: true,
    image: ""
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAllTestimonials()
      setTestimonials(data as any[])
    } catch (err: any) {
      setError(err.message || "Failed to fetch testimonials")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/auth/login")
      return
    }
    if (!authLoading) {
      fetchTestimonials()
    }
  }, [authLoading, user, fetchTestimonials, router])

  const handleOpenCreate = () => {
    setEditingTestimonial(null)
    setFormData({
      author: "",
      role: "",
      quote: "",
      rating: 5,
      isActive: true,
      image: ""
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (testimonial: any) => {
    setEditingTestimonial(testimonial)
    setFormData({
      author: testimonial.author || "",
      role: testimonial.role || "",
      quote: testimonial.quote || "",
      rating: testimonial.rating || 5,
      isActive: testimonial.isActive ?? true,
      image: testimonial.image || ""
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading("form")
      if (editingTestimonial) {
        await apiClient.updateTestimonial(editingTestimonial._id, formData)
      } else {
        await apiClient.createTestimonial(formData)
      }
      setIsFormOpen(false)
      fetchTestimonials()
    } catch (err: any) {
      alert(err.message || "Operation failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this testimonial?")) {
      try {
        setActionLoading(id)
        await apiClient.deleteTestimonial(id)
        fetchTestimonials()
      } catch (err: any) {
        alert(err.message || "Failed to delete testimonial")
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      const data = await apiClient.uploadFile(formDataUpload)
      setFormData({ ...formData, image: data.fileUrl })
    } catch (err: any) {
      alert(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: "" })
  }

  const handleToggleStatus = async (testimonial: any) => {
    try {
      setActionLoading(testimonial._id)
      await apiClient.updateTestimonial(testimonial._id, { isActive: !testimonial.isActive })
      fetchTestimonials()
    } catch (err: any) {
      alert(err.message || "Failed to update status")
    } finally {
      setActionLoading(null)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`w-3.5 h-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} 
          />
        ))}
      </div>
    )
  }

  if (authLoading || (loading && testimonials.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials Management</h1>
          <p className="text-muted-foreground">Manage user testimonials displayed on the landing page</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add Testimonial
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-border/50">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Quote className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold">No testimonials yet</h3>
            <p className="text-muted-foreground mb-6">Create your first testimonial to show it on the landing page.</p>
            <Button variant="outline" onClick={handleOpenCreate}>Add Testimonial</Button>
          </div>
        ) : (
          testimonials.map((test) => (
            <Card key={test._id} className={`group overflow-hidden transition-all hover:shadow-lg ${!test.isActive ? "opacity-60 grayscale-[0.5]" : ""}`}>
              <CardHeader className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant={test.isActive ? "default" : "outline"} className={test.isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20" : ""}>
                    {test.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(test)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleStatus(test)}>
                          {test.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                          {test.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(test._id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    {test.image ? (
                      <AvatarImage src={test.image} alt={test.author} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary uppercase">
                        {test.author.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h4 className="font-bold leading-none">{test.author}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{test.role}</p>
                  </div>
                </div>

                {renderStars(test.rating)}
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-sm text-foreground/80 italic line-clamp-4 leading-relaxed">
                  "{test.quote}"
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            <DialogDescription>
              Create or modify a testimonial for the landing page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author Name</Label>
              <Input 
                id="author"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role / Designation</Label>
              <Input 
                id="role"
                required
                placeholder="e.g. Software Engineer"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="quote">Quote</Label>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${formData.quote.length > 180 ? "bg-orange-100 text-orange-600" : "bg-muted text-muted-foreground"}`}>
                  {formData.quote.length} / 200
                </span>
              </div>
              <Textarea 
                id="quote"
                required
                maxLength={200}
                placeholder="What did they say about Shramik Seva? (Max 200 chars)"
                className="min-h-[100px] resize-none"
                value={formData.quote}
                onChange={(e) => setFormData({...formData, quote: e.target.value})}
              />
              <p className="text-[11px] text-muted-foreground italic">
                Keep it concise (1-2 sentences) to maintain the landing page layout.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Select 
                  value={formData.rating.toString()} 
                  onValueChange={(val) => setFormData({...formData, rating: parseInt(val)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} Stars</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center space-x-2 h-10">
                  <Switch 
                    id="isActive" 
                    checked={formData.isActive}
                    onCheckedChange={(val) => setFormData({...formData, isActive: val})}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Avatar Image</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    id="image"
                    placeholder="e.g. https://example.com/avatar.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                  />
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="gap-2"
                    disabled={uploading}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </Button>
                </div>
              </div>
              {formData.image && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={formData.image} />
                    <AvatarFallback><ImageIcon className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate flex-1">Previewing image</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === "form"}>
                {actionLoading === "form" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTestimonial ? "Save Changes" : "Create Testimonial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Select components to avoid errors
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
