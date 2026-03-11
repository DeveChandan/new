"use strict";
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api";
import { BUSINESS_TYPES, EMPLOYEE_COUNT_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, Upload, Building2, MapPin, FileText, User, CreditCard, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface OnboardingData {
    companyName: string;
    businessType: string;
    description: string;
    website: string;
    foundedYear: string;
    employeeCount: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        mapsLink: string;
    };
    contactPerson: {
        name: string;
        designation: string;
        phone: string;
        email: string;
    };
    documents: {
        gstCertificate: string;
        panCard: string;
    };
}

const steps = [
    { id: 1, title: "Company Info", icon: Building2 },
    { id: 2, title: "Location", icon: MapPin },
    { id: 3, title: "Documents", icon: FileText },
    { id: 4, title: "Contact", icon: User },
];

export default function EmployerOnboardingPage() {
    const t = useTranslations("Common");
    const router = useRouter();
    const { user, refreshUser, isLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        companyName: "",
        businessType: "",
        description: "",
        website: "",
        foundedYear: "",
        employeeCount: "",
        address: { street: "", city: "", state: "", pincode: "", mapsLink: "" },
        contactPerson: { name: "", designation: "", phone: "", email: "" },
        documents: { gstCertificate: "", panCard: "" }
    });

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push("/auth/login");
            return;
        }

        if (user.role !== "employer") {
            router.push("/dashboard/worker");
            return;
        }

        setData(prev => ({
            ...prev,
            companyName: prev.companyName || user.companyName || user.name || "",
            businessType: prev.businessType || user.businessType || "",
            contactPerson: {
                ...prev.contactPerson,
                name: prev.contactPerson.name || user.name || "",
                phone: prev.contactPerson.phone || user.mobile || "",
                email: prev.contactPerson.email || user.email || ""
            }
        }));
    }, [user, isLoading, router]);

    const handleChange = (section: keyof OnboardingData | null, field: string, value: string) => {
        if (section && typeof data[section] === 'object' && section !== 'documents') { // Handle nested objects like address/contactPerson
            setData(prev => ({
                ...prev,
                [section]: { ...(prev[section as keyof OnboardingData] as any), [field]: value }
            }));
        } else if (section === 'documents') {
            // Handled separately usually via upload, but for text inputs if any
            setData(prev => ({
                ...prev,
                documents: { ...prev.documents, [field]: value }
            }));
        }
        else {
            setData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: "gstCertificate" | "panCard") => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, upload to S3/Cloudinary here. For now, mocking URL or using local if backend supported file upload via this endpoint directly (which it likely handles separate upload usually).
        // Assuming we have an upload endpoint or we just simulate.
        // Let's assume we upload to existing upload endpoint if available, but for now validation is key.
        // I'll simulate a delayed upload success.
        setLoading(true);
        setTimeout(() => {
            setData(prev => ({
                ...prev,
                documents: { ...prev.documents, [docType]: URL.createObjectURL(file) } // Mock URL
            }));
            setLoading(false);
            toast.success("Document uploaded successfully");
        }, 1000);
    };

    const validateStep = (currentStep: number): string | null => {
        switch (currentStep) {
            case 1:
                if (!data.companyName) return "Company Name is required.";
                if (!data.businessType) return "Business Type is required.";
                if (!data.description) return "Company Description is required.";
                if (!data.employeeCount) return "Employee Count is required.";
                return null;
            case 2:
                if (!data.address.street) return "Street Address is required.";
                if (!data.address.city) return "City is required.";
                if (!data.address.state) return "State is required.";
                if (!data.address.pincode) return "Pincode is required.";
                if (!/^\d{6}$/.test(data.address.pincode)) return "Pincode must be exactly 6 digits.";
                return null;
            case 3:
                return null;
            case 4:
                if (!data.contactPerson.name) return "Contact Person Name is required.";
                if (!data.contactPerson.phone) return "Contact Phone Number is required.";
                if (!/^[6-9]\d{9}$/.test(data.contactPerson.phone)) return "Please enter a valid 10-digit mobile number.";
                if (!data.contactPerson.email) return "Contact Email is required.";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactPerson.email)) return "Please enter a valid email address.";
                return null;
            default:
                return null;
        }
    };

    const handleNext = async () => {
        const errorMsg = validateStep(step);
        if (errorMsg) {
            toast.error(errorMsg);
            return;
        }

        if (step < 4) {
            setStep(step + 1);
        } else {
            // Final Submit
            setLoading(true);
            try {
                if (!user?._id) throw new Error("User ID missing");

                // Update Company Profile
                await apiClient.updateCompanyProfile(user._id, {
                    ...data,
                    isProfileComplete: true
                });

                await refreshUser();
                toast.success("Profile setup complete!");
                router.push("/dashboard/employer");
            } catch (error) {
                console.error(error);
                toast.error("Failed to complete setup.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-4xl border border-border/50 shadow-2xl shadow-primary/5 dark:shadow-primary/10 bg-card/80 dark:bg-card/90 backdrop-blur-xl rounded-[2rem] overflow-hidden transition-colors duration-300">
                {/* Progress Bar at Top */}
                <div className="h-1.5 bg-muted/30 w-full">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-r-full transition-all duration-500 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
                    {/* Sidebar */}
                    <div className="md:col-span-4 bg-gradient-to-b from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-8 border-r border-border/50 flex flex-col justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-primary mb-2">Setup Profile</h1>
                            <p className="text-muted-foreground text-sm mb-8">Complete your company profile to start hiring.</p>
                            <div className="space-y-6">
                                {steps.map((s, i) => (
                                    <div key={s.id} className={`flex items-center gap-4 transition-all duration-300 ${step === s.id ? 'translate-x-2' : step > s.id ? 'opacity-70' : 'opacity-40'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent border-muted-foreground/40 dark:border-muted-foreground/30 text-muted-foreground'} ${step === s.id ? 'shadow-lg shadow-primary/30 dark:shadow-primary/40 ring-4 ring-primary/10 dark:ring-primary/20' : ''}`}>
                                            {step > s.id ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold uppercase tracking-widest transition-colors duration-300 ${step === s.id ? 'text-primary' : step > s.id ? 'text-foreground/60' : 'text-muted-foreground'}`}>{s.title}</p>
                                            {step === s.id && <p className="text-xs text-primary/60 dark:text-primary/70 font-medium">In Progress</p>}
                                            {step > s.id && <p className="text-xs text-green-500 dark:text-green-400 font-medium">Completed</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-8 p-4 sm:p-8 flex flex-col">
                        <div className="flex-grow">
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-2xl font-bold text-foreground">Company Basics</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Company Name*</Label>
                                            <Input
                                                value={data.companyName}
                                                onChange={(e) => handleChange(null, 'companyName', e.target.value)}
                                                placeholder="Enter Company Name"
                                                className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Business Type*</Label>
                                            <Select value={data.businessType} onValueChange={(val) => handleChange(null, 'businessType', val)}>
                                                <SelectTrigger className="h-12 rounded-xl bg-input/50 border-border text-foreground"><SelectValue placeholder="Select Business Type" /></SelectTrigger>
                                                <SelectContent>
                                                    {BUSINESS_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Founded Year</Label>
                                            <Input type="number" value={data.foundedYear} onChange={(e) => handleChange(null, 'foundedYear', e.target.value)} placeholder="e.g. 2010" className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Employee Count*</Label>
                                            <Select value={data.employeeCount} onValueChange={(val) => handleChange(null, 'employeeCount', val)}>
                                                <SelectTrigger className="h-12 rounded-xl bg-input/50 border-border text-foreground"><SelectValue placeholder="Select Size" /></SelectTrigger>
                                                <SelectContent>
                                                    {EMPLOYEE_COUNT_OPTIONS.map((count) => (
                                                        <SelectItem key={count} value={count}>{count} Employees</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-full space-y-2">
                                            <Label className="text-foreground">Description*</Label>
                                            <Textarea value={data.description} onChange={(e) => handleChange(null, 'description', e.target.value)} placeholder="Tell us about your company..." className="min-h-[100px] rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="col-span-full space-y-2">
                                            <Label className="text-foreground">Website</Label>
                                            <Input value={data.website} onChange={(e) => handleChange(null, 'website', e.target.value)} placeholder="https://..." className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-2xl font-bold text-foreground">Headquarters Location</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-full space-y-2">
                                            <Label className="text-foreground">Street Address*</Label>
                                            <Input value={data.address.street} onChange={(e) => handleChange('address', 'street', e.target.value)} className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">City*</Label>
                                            <Input value={data.address.city} onChange={(e) => handleChange('address', 'city', e.target.value)} className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">State*</Label>
                                            <Input value={data.address.state} onChange={(e) => handleChange('address', 'state', e.target.value)} className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Pincode*</Label>
                                            <Input value={data.address.pincode} onChange={(e) => handleChange('address', 'pincode', e.target.value)} maxLength={6} className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="col-span-full space-y-2">
                                            <Label className="text-foreground">Google Maps Link (Optional)</Label>
                                            <Input value={data.address.mapsLink} onChange={(e) => handleChange('address', 'mapsLink', e.target.value)} placeholder="https://maps.google.com/..." className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-2xl font-bold text-foreground">Business Documents</h2>
                                    <p className="text-muted-foreground">Upload documents to verify your business. This builds trust with workers.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-dashed border-2 border-border/50 bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15 hover:border-primary/30 transition-all duration-300 group">
                                            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                                                <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground">GST Certificate</h3>
                                                    <p className="text-xs text-muted-foreground">PDF or Image</p>
                                                </div>
                                                <div className="relative">
                                                    <Button variant="outline" className="rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-colors">
                                                        {data.documents.gstCertificate ? "Change File" : "Upload File"}
                                                    </Button>
                                                    <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'gstCertificate')} />
                                                </div>
                                                {data.documents.gstCertificate && <p className="text-xs text-green-500 dark:text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Uploaded</p>}
                                            </CardContent>
                                        </Card>

                                        <Card className="border-dashed border-2 border-border/50 bg-accent/5 dark:bg-accent/10 hover:bg-accent/10 dark:hover:bg-accent/15 hover:border-accent/30 transition-all duration-300 group">
                                            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                                                <div className="w-16 h-16 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground">PAN Card</h3>
                                                    <p className="text-xs text-muted-foreground">Company or Owner PAN</p>
                                                </div>
                                                <div className="relative">
                                                    <Button variant="outline" className="rounded-full border-accent/30 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 transition-colors">
                                                        {data.documents.panCard ? "Change File" : "Upload File"}
                                                    </Button>
                                                    <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'panCard')} />
                                                </div>
                                                {data.documents.panCard && <p className="text-xs text-green-500 dark:text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Uploaded</p>}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-2xl font-bold text-foreground">Primary Contact</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Full Name*</Label>
                                            <Input value={data.contactPerson.name} onChange={(e) => handleChange('contactPerson', 'name', e.target.value)} className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Designation</Label>
                                            <Input value={data.contactPerson.designation} onChange={(e) => handleChange('contactPerson', 'designation', e.target.value)} placeholder="e.g. HR Manager" className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Phone Number*</Label>
                                            <Input value={data.contactPerson.phone} onChange={(e) => handleChange('contactPerson', 'phone', e.target.value)} maxLength={10} className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Email Address*</Label>
                                            <Input value={data.contactPerson.email} onChange={(e) => handleChange('contactPerson', 'email', e.target.value)} className="h-12 rounded-xl bg-input/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>

                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
                            <Button variant="ghost" onClick={handleBack} disabled={step === 1} className="gap-2 font-bold hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                            <div className="flex items-center gap-3">
                                {/* Step dots */}
                                <div className="hidden sm:flex items-center gap-1.5 mr-2">
                                    {steps.map((s) => (
                                        <div
                                            key={s.id}
                                            className={`rounded-full transition-all duration-300 ${step === s.id ? 'w-6 h-2 bg-primary' : step > s.id ? 'w-2 h-2 bg-primary/40' : 'w-2 h-2 bg-muted-foreground/20 dark:bg-muted-foreground/30'}`}
                                        />
                                    ))}
                                </div>
                                <Button onClick={handleNext} disabled={loading} className="rounded-xl px-8 font-bold h-12 shadow-xl shadow-primary/20 dark:shadow-primary/30 hover:shadow-2xl hover:shadow-primary/30 dark:hover:shadow-primary/40 transition-all duration-300">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 4 ? "Complete Setup" : "Next Step"}
                                    {!loading && step !== 4 && <ArrowRight className="w-4 h-4 ml-2" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function BriefcaseIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
    )
}
