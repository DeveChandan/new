"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "@/navigation";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2, FileText, MapPin, Briefcase, User, Phone, Mail, Building2, Calendar, DollarSign, Star, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { Separator } from "@/components/ui/separator"

export default function AdminUserDetailsPage() {
  const t = useTranslations('Admin.users')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const params = useParams()
  const { user: adminUser, isLoading: authLoading } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const userId = params.id as string

  const fetchUser = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const userData = await apiClient.getPublicUserProfile(userId)
      setUser(userData)
    } catch (err: any) {
      setError(err.message || "Failed to fetch user details")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!authLoading && adminUser?.role !== "admin") {
      router.push("/")
      return
    }
    if (adminUser) {
      fetchUser()
    }
  }, [adminUser, authLoading, router, fetchUser])

  const handleApproveUser = async () => {
    try {
      await apiClient.approveUser(userId)
      toast.success("User Approved", { description: "The user has been successfully approved." })
      fetchUser() // Refresh user data
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "Failed to approve user.",
      })
    }
  }

  const handleDocumentStatusUpdate = async (documentId: string, status: "approved" | "rejected") => {
    try {
      await apiClient.updateDocumentStatus(documentId, status)
      toast.success(`Document ${status}`, {
        description: `The document has been successfully ${status}.`,
      })
      fetchUser() // Refresh user data
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "Failed to update document status.",
      })
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>
  }

  if (!user) {
    return <div className="text-center py-10">User not found.</div>
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-muted">
              <AvatarImage src={user.profilePicture} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-3xl">{user.name}</CardTitle>
                <Badge variant={user.role === 'employer' ? 'default' : 'secondary'} className="capitalize">
                  {user.role}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 mt-1 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> <span>{user.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> <span>{user.mobile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> <span>{user.locationName || user.location || "N/A"}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Member since: {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Account Status:</span>
              <Badge variant={user.accountStatus === 'active' ? 'default' : 'destructive'} className="capitalize">
                {user.accountStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Verification:</span>
              {user.isVerified ? (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" /> Verified
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-4 h-4 mr-1" /> Not Verified
                </Badge>
              )}
            </div>

            {!user.isVerified && (
              <Button onClick={handleApproveUser} className="mt-2" size="sm">
                Approve User & Verify
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Role Specific Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* WORKER DETAILS */}
          {user.role === "worker" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" /> Professional Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.workerType?.map((type: string) => (
                      <Badge key={type} variant="secondary">{type}</Badge>
                    ))}
                    {user.skills?.map((skill: string) => (
                      <Badge key={skill} variant="outline" className="border-primary/20">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{user.isFresher ? "Fresher" : `${user.experience} Years`}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="font-medium flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" /> {user.hourlyRate}/hr
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Role</p>
                    <p className="font-medium">{user.currentJobTitle || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <Badge variant={user.availability === 'available' ? 'default' : 'secondary'}>
                      {user.availability}
                    </Badge>
                  </div>
                </div>

                {user.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                    <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">{user.bio}</p>
                  </div>
                )}

                {user.languages && user.languages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Languages</h3>
                    <p className="text-sm">{user.languages.join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* EMPLOYER DETAILS */}
          {user.role === "employer" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Company Name</p>
                        <p className="font-semibold text-lg">{user.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Business Type</p>
                        <p className="font-medium">{user.businessType || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">GST Number</p>
                        <p className="font-mono bg-muted px-2 py-1 rounded inline-block text-sm">
                          {user.gstNumber || "Not Provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        {user.companyDetails?.website ? (
                          <a href={user.companyDetails.website} target="_blank" className="text-primary hover:underline flex items-center gap-1">
                            {user.companyDetails.website}
                          </a>
                        ) : <span className="text-sm">N/A</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-muted/20 rounded-lg border">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" /> Contact Person
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {user.companyDetails?.contactPerson?.name || "N/A"}</p>
                          <p><span className="text-muted-foreground">Role:</span> {user.companyDetails?.contactPerson?.designation || "N/A"}</p>
                          <p><span className="text-muted-foreground">Phone:</span> {user.companyDetails?.contactPerson?.phone || "N/A"}</p>
                          <p><span className="text-muted-foreground">Email:</span> {user.companyDetails?.contactPerson?.email || "N/A"}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="font-medium">{user.companyDetails?.employeeCount || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {user.companyDetails?.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">About Company</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {user.companyDetails.description}
                      </p>
                    </div>
                  )}

                  {user.companyDetails?.address && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Office Address</p>
                      <div className="text-sm flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <p>{user.companyDetails.address.street}</p>
                          <p>
                            {user.companyDetails.address.city}, {user.companyDetails.address.state} - {user.companyDetails.address.pincode}
                          </p>
                          {user.companyDetails.address.mapsLink && (
                            <a href={user.companyDetails.address.mapsLink} target="_blank" className="text-primary text-xs hover:underline mt-1 inline-block">
                              View on Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* DOCUMENTS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.documents && user.documents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {user.documents.map((doc: any) => (
                    <div key={doc._id} className="border rounded-lg p-4 flex flex-col justify-between gap-3 bg-card hover:bg-muted/5 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[150px]" title={doc.name}>{doc.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                          </div>
                        </div>
                        <Badge
                          variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "outline"}
                          className="capitalize"
                        >
                          {doc.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                          View Document
                        </a>

                        {doc.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleDocumentStatusUpdate(doc._id, "approved")}
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDocumentStatusUpdate(doc._id, "rejected")}
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>No documents uploaded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bank & System Info */}
        <div className="space-y-6">
          {/* VERIFICATION CARD FOR EMPLOYER */}
          {user.role === 'employer' && (
            <Card className={user.companyDetails?.verificationStatus === 'verified' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-center">
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Base Account</span>
                    {user.isVerified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Company Details</span>
                    <Badge variant={user.companyDetails?.verificationStatus === 'verified' ? 'default' : 'secondary'} className="capitalize">
                      {user.companyDetails?.verificationStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SUBSCRIPTION STATUS FOR EMPLOYER */}
          {user.role === 'employer' && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.subscription ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <Badge variant="outline" className="uppercase font-bold">{user.subscription.planType}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={user.subscription.status === 'active' ? 'default' : 'destructive'}>
                        {user.subscription.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expires</span>
                        <span className="font-medium">{new Date(user.subscription.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unlocks Used</span>
                        <span className="font-medium">{user.subscription.databaseUnlocksUsed} / {user.subscription.maxDatabaseUnlocks}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No active subscription</p>
                    <Badge variant="secondary" className="mt-2">Free Tier</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {user.role === 'worker' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.bankDetails ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{user.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-mono bg-muted p-1 rounded text-sm">{user.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">IFSC Code</p>
                      <p className="font-mono">{user.bankDetails.ifscCode}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bank details provided.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* RATING (Only for Workers mostly) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5" /> Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-bold">{user.rating?.toFixed(1) || "0.0"}</span>
                <div className="flex text-yellow-500">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-4 h-4 ${star <= (user.rating || 0) ? 'fill-current' : 'text-muted'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Based on overall performance</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
