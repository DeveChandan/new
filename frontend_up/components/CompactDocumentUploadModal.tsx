"use client"

import React, { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useTranslations } from "next-intl"

interface CompactDocumentUploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUploadSuccess: (cvId?: string) => void
    onSkip: () => void
}

export function CompactDocumentUploadModal({ isOpen, onClose, onUploadSuccess, onSkip }: CompactDocumentUploadModalProps) {
    const t = useTranslations("Common.UploadModal")
    const tCommon = useTranslations("Common.buttons")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [existingCVs, setExistingCVs] = useState<any[]>([])
    const [fetchingCVs, setFetchingCVs] = useState(false)
    const [selectedCVId, setSelectedCVId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (isOpen) {
            fetchExistingCVs();
        }
    }, [isOpen]);

    const fetchExistingCVs = async () => {
        try {
            setFetchingCVs(true);
            const docs = await apiClient.getUserDocuments() as any[];
            const cvs = docs.filter(doc =>
                doc.type === 'biodata' ||
                doc.name.toLowerCase().includes('resume') ||
                doc.name.toLowerCase().includes('cv') ||
                doc.name.toLowerCase().includes('biodata')
            );
            setExistingCVs(cvs);
        } catch (err) {
            console.error("Failed to fetch CVs", err);
        } finally {
            setFetchingCVs(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
            setSelectedCVId(null) // Reset selection if new file chosen
            setError("")
        } else {
            setSelectedFile(null)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedCVId) {
            onUploadSuccess(selectedCVId);
            onClose();
            return;
        }

        if (!selectedFile) {
            setError(t('errorSelectFile'))
            return
        }

        setLoading(true)
        setError("")

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const uploadResponse: any = await apiClient.uploadFile(formData)
            const fileUrl = uploadResponse.fileUrl

            // Upload as "Biodata" type automatically
            const newDoc = await apiClient.uploadDocument({
                name: `Resume - ${new Date().toLocaleDateString()}`,
                url: fileUrl,
                type: "biodata",
            }) as any;

            onUploadSuccess(newDoc._id)
            onClose()
        } catch (err: any) {
            console.error(err)
            setError(err.message || t('errorUpload'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm w-[95vw] max-w-[350px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpload} className="space-y-4 py-2">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Existing CVs Section */}
                    {existingCVs.length > 0 && (
                        <div className="space-y-2">
                            <Label>{t('selectExistingCV') || "Select Existing CV"}</Label>
                            <div className="flex flex-col gap-2">
                                {existingCVs.map((cv) => (
                                    <div
                                        key={cv._id}
                                        onClick={() => {
                                            if (selectedCVId === cv._id) {
                                                setSelectedCVId(null);
                                            } else {
                                                setSelectedCVId(cv._id);
                                                setSelectedFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = "";
                                                }
                                            }
                                        }}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedCVId === cv._id
                                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                                            : "border-border hover:bg-accent/50"
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCVId === cv._id ? "border-primary bg-primary" : "border-border"
                                            }`}>
                                            {selectedCVId === cv._id && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold truncate">{cv.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{new Date(cv.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                {existingCVs.length > 0 ? (t('orUploadNew') || "Or Upload New") : t('selectFile')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                disabled={loading}
                                className="cursor-pointer"
                                ref={fileInputRef}
                            />
                        </div>
                        {selectedFile && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <FileText className="w-3 h-3" />
                                {selectedFile.name}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <Button
                            type="submit"
                            disabled={(!selectedFile && !selectedCVId) || loading}
                            className="w-full bg-primary text-primary-foreground h-12 rounded-xl"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('uploading')}
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    {selectedCVId ? (t('useSelectedAndApply') || "Use Selected & Apply") : t('uploadAndApply')}
                                </>
                            )}
                        </Button>

                        <div className="flex items-center justify-between gap-2 mt-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground">
                                {tCommon('cancel')}
                            </Button>
                            <Button type="button" variant="outline" onClick={onSkip} disabled={loading} className="text-xs text-primary border-primary/20 hover:bg-primary/10 hover:text-primary rounded-lg h-9">
                                {t('skipAndApply')}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
