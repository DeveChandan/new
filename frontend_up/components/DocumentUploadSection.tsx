"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UploadCloud, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { apiClient, API_ROOT_URL } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"

interface Document {
  _id: string
  name: string
  url: string
  type: string
  status: "pending" | "approved" | "rejected"
  expiryDate?: string
}

const getDocumentUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith('http')) return url;
  return `${API_ROOT_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function DocumentUploadSection() {
  const { user } = useAuth()
  const t = useTranslations("Documents")
  const tCommon = useTranslations("Common")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [newDocument, setNewDocument] = useState({ name: "", type: "", expiryDate: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const workerDocumentTypes = ['Biodata', 'Bank_Account', 'Adhaar_Card', 'Voter_Id', 'Skill_Certificate', 'Experience Certificate', 'Other'];
  const employerDocumentTypes = ['Business_Registration', 'GST_Certificate', 'Other'];

  const currentDocumentTypes = user?.role === 'employer' ? employerDocumentTypes : workerDocumentTypes;

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getUserDocuments() as Document[]
      setDocuments(data)
    } catch (err: any) {
      setError(err.message || t('errorFetch'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user, fetchDocuments])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    } else {
      setSelectedFile(null)
    }
  }

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!selectedFile || !newDocument.name || !newDocument.type) {
      setError(t('errorFill'))
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const uploadResponse: any = await apiClient.uploadFile(formData)
      const fileUrl = uploadResponse.fileUrl

      await apiClient.uploadDocument({
        name: newDocument.name,
        url: fileUrl,
        type: newDocument.type,
        expiryDate: newDocument.expiryDate || undefined,
      })

      setNewDocument({ name: "", type: "", expiryDate: "" })
      setSelectedFile(null)
      fetchDocuments() // Refresh document list
    } catch (err: any) {
      setError(err.message || t('errorUpload'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="p-8 bg-card border-border">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-semibold text-foreground">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('uploadNew')}</h3>
          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div>
              <Label htmlFor="docName">{t('labels.name')}</Label>
              <Input
                id="docName"
                value={newDocument.name}
                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                placeholder={t('placeholders.name')}
                className="mt-1"
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="docType">{t('labels.type')}</Label>
              <Select
                onValueChange={(value) => setNewDocument({ ...newDocument, type: value })}
                value={newDocument.type}
                disabled={uploading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('placeholders.type')} />
                </SelectTrigger>
                <SelectContent>
                  {currentDocumentTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                      {t(`types.${type.toLowerCase().replace(' ', '_')}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expiryDate">{t('labels.expiryDate')}</Label>
              <Input
                id="expiryDate"
                type="date"
                value={newDocument.expiryDate}
                onChange={(e) => setNewDocument({ ...newDocument, expiryDate: e.target.value })}
                className="mt-1"
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="file">{t('labels.file')}</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="mt-1 file:text-primary"
                disabled={uploading}
              />
              {selectedFile && <p className="text-sm text-muted-foreground mt-2">{tCommon('labels.name')}: {selectedFile.name}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('uploading')}
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" /> {t('uploadBtn')}
                </>
              )}
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('uploaded')}</h3>
          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground">{t('noDocuments')}</p>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{t(`types.${doc.type}`)}</p>
                      {doc.expiryDate && (
                        <p className="text-xs text-muted-foreground">{t('status.expires', { date: new Date(doc.expiryDate).toLocaleDateString() })}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === "approved" && (
                      <span className="flex items-center gap-1 text-green-500 text-sm">
                        <CheckCircle className="w-4 h-4" /> {t('status.approved')}
                      </span>
                    )}
                    {doc.status === "pending" && (
                      <span className="flex items-center gap-1 text-yellow-500 text-sm">
                        <AlertCircle className="w-4 h-4" /> {t('status.pending')}
                      </span>
                    )}
                    {doc.status === "rejected" && (
                      <span className="flex items-center gap-1 text-red-500 text-sm">
                        <X className="w-4 h-4" /> {t('status.rejected')}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <a href={getDocumentUrl(doc.url)} target="_blank" rel="noopener noreferrer" className="text-primary">
                        {tCommon('buttons.view')}
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
