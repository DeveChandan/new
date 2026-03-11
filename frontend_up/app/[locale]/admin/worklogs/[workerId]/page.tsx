'use client';

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";;
import { Link } from "@/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  Briefcase,
  Image as ImageIcon,
  Building,
  Filter,
  Download,
  Loader2,
  X,
  Eye,
  CheckCircle,
  XCircle,
  CalendarDays,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface WorkLog {
  _id: string;
  job: {
    _id: string;
    title: string;
    employer?: {
      companyName?: string;
    };
  };
  workDate: string;
  startTime: string;
  endTime: string;
  startPhoto: string;
  endPhoto: string;
  status: string;
}

interface WorkerDetailedWorklogs {
  workerId: string;
  workerName: string;
  profilePicture?: string;
  worklogsByDate: Record<string, WorkLog[]>;
}

const WorkerDetailedWorklogsPage = () => {
  const t = useTranslations('Admin.worklogs')
  const tCommon = useTranslations('Common')
  const { workerId } = useParams();
  const [workerData, setWorkerData] = useState<WorkerDetailedWorklogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchJobTitle, setSearchJobTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  const openImageModal = (imageUrl: string, altText: string) => {
    setCurrentImageUrl(imageUrl);
    setCurrentImageAlt(altText);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageUrl('');
    setCurrentImageAlt('');
  };

  useEffect(() => {
    if (workerId) {
      const fetchDetailedWorklogs = async () => {
        setLoading(true);
        setError('');
        try {
          const params = {
            jobTitle: searchJobTitle || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          };

          const response = await apiClient.getWorkerWorklogs(workerId as string, params);
          setWorkerData(response);
        } catch (error: any) {
          setError(error.message || t('errors.fetchFailed'));
          console.error('Error fetching detailed worklogs:', error);
          setWorkerData(null);
        } finally {
          setLoading(false);
        }
      };

      const debounceFetch = setTimeout(() => {
        fetchDetailedWorklogs();
      }, 500);

      return () => clearTimeout(debounceFetch);
    }
  }, [workerId, searchJobTitle, startDate, endDate]);

  const fetchDetailedWorklogs = async () => {
    if (!workerId) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        jobTitle: searchJobTitle || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const response = await apiClient.getWorkerWorklogs(workerId as string, params);
      setWorkerData(response);
    } catch (error: any) {
      setError(error.message || t('errors.fetchFailed'));
      console.error('Error fetching detailed worklogs:', error);
      setWorkerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (worklogId: string, newStatus: string) => {
    try {
      await apiClient.updateAdminWorklogStatus(worklogId, newStatus);
      toast.success(tCommon('messages.success'));
      fetchDetailedWorklogs(); // Refresh
    } catch (error: any) {
      toast.error(error.message || tCommon('errors.failed'));
    }
  };

  const handleDeleteWorklog = async (worklogId: string) => {
    if (!window.confirm(tCommon('confirmDelete') || "Are you sure you want to delete this worklog?")) return;
    try {
      await apiClient.deleteAdminWorklog(worklogId);
      toast.success(tCommon('messages.success'));
      fetchDetailedWorklogs(); // Refresh
    } catch (error: any) {
      toast.error(error.message || tCommon('errors.failed'));
    }
  };

  const clearFilters = () => {
    setSearchJobTitle('');
    setStartDate('');
    setEndDate('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, {
      variant: "default" | "secondary" | "destructive" | "outline",
      className: string,
      icon: typeof CheckCircle
    }> = {
      "approved": {
        variant: "default",
        className: "bg-green-500/10 text-green-600 border-green-200",
        icon: CheckCircle
      },
      "pending": {
        variant: "outline",
        className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
        icon: Clock
      },
      "rejected": {
        variant: "destructive",
        className: "bg-red-500/10 text-red-600 border-red-200",
        icon: XCircle
      },
    };

    const config = statusConfig[status.toLowerCase()] || {
      variant: "outline",
      className: "",
      icon: Clock
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {tCommon(status.toLowerCase())}
      </Badge>
    );
  };

  if (loading && !workerData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!workerData && !loading) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">{t('details.notFound')}</h3>
        <p className="text-muted-foreground mb-6">{t('details.notFoundSubtitle')}</p>
        <Link href="/admin/worklogs">
          <Button variant="outline" className="rounded-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('details.back')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/worklogs">
            <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {t('details.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('details.history', { name: workerData?.workerName || '' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden rounded-full"
          >
            <Filter className="h-4 w-4 mr-1" />
            {tCommon('filters')}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Download className="h-4 w-4 mr-1" />
            {tCommon('export')}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 md:p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Worker Profile Card */}
      {workerData && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-primary/20">
                <AvatarImage src={workerData.profilePicture} alt={workerData.workerName} />
                <AvatarFallback className="text-lg md:text-xl bg-primary/10 text-primary font-medium">
                  {workerData.workerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {workerData.workerName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {tCommon('workerId', { id: workerData.workerId })}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="h-3 w-3" />
                    {t('details.totalWorklogs', { count: Object.values(workerData.worklogsByDate).flat().length })}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {t('details.days', { count: Object.keys(workerData.worklogsByDate).length })}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Card */}
      <Card className={`bg-card border-border ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Search className="h-4 w-4 md:h-5 md:w-5" />
              {t('details.search')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              {t('clearAll')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-3 w-3 md:h-4 md:w-4" />
              {t('details.searchJob')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
              <Input
                placeholder={t('details.searchJobPlaceholder')}
                value={searchJobTitle}
                onChange={(e) => setSearchJobTitle(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Date Range Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                {t('details.startDate')}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                {t('details.endDate')}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setShowFilters(false)}
              className="flex-1 sm:hidden"
              size="sm"
            >
              {t('details.apply')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(false)}
              className="sm:hidden flex-1"
              size="sm"
            >
              {t('details.close')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Worklogs by Date */}
      {workerData && (
        <div className="space-y-4">
          {Object.keys(workerData.worklogsByDate).length > 0 ? (
            Object.entries(workerData.worklogsByDate)
              .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
              .map(([date, logs]) => (
                <Card key={date} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {moment(date).format('dddd, MMMM D, YYYY')}
                      <Badge variant="outline" className="ml-2">
                        {t('details.worklogCount', { count: logs.length })}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6">
                    <div className="space-y-4">
                      {logs.map((log) => (
                        <div key={log._id} className="border rounded-lg p-3 md:p-4 space-y-3">
                          {/* Job Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                                <h3 className="font-semibold text-foreground truncate">
                                  {log.job.title}
                                </h3>
                              </div>
                              {log.job.employer?.companyName && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Building className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {log.job.employer.companyName}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              {getStatusBadge(log.status)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{tCommon('actions') || 'Actions'}</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(log._id, 'approved')}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    {tCommon('approved') || 'Approve'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(log._id, 'rejected')}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                    {tCommon('rejected') || 'Reject'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(log._id, 'incomplete')}>
                                    <CalendarDays className="mr-2 h-4 w-4 text-yellow-500" />
                                    {tCommon('incomplete') || 'Mark Incomplete'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={() => handleDeleteWorklog(log._id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {tCommon('delete') || 'Delete'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Time Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-green-600" />
                                <span className="font-medium">{t('details.startTime')}</span>
                              </div>
                              <p className="pl-5">
                                {moment(log.startTime, 'HH:mm:ss').format('h:mm A')}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-red-600" />
                                <span className="font-medium">{t('details.endTime')}</span>
                              </div>
                              <p className="pl-5">
                                {moment(log.endTime, 'HH:mm:ss').format('h:mm A')}
                              </p>
                            </div>
                          </div>

                          {/* Photos Section */}
                          <div className="pt-2 border-t">
                            <div className="flex flex-col sm:flex-row gap-4">
                              {/* Start Photo */}
                              {log.startPhoto && (
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ImageIcon className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-sm">{t('details.startPhoto')}</span>
                                  </div>
                                  <div
                                    className="relative cursor-pointer group"
                                    onClick={() => openImageModal(log.startPhoto, 'Start Work Photo')}
                                  >
                                    <img
                                      src={log.startPhoto}
                                      alt="Start Work"
                                      className="w-full h-32 object-cover rounded-lg border shadow-sm group-hover:opacity-90 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* End Photo */}
                              {log.endPhoto && (
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ImageIcon className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-sm">{t('details.endPhoto')}</span>
                                  </div>
                                  <div
                                    className="relative cursor-pointer group"
                                    onClick={() => openImageModal(log.endPhoto, 'End Work Photo')}
                                  >
                                    <img
                                      src={log.endPhoto}
                                      alt="End Work"
                                      className="w-full h-32 object-cover rounded-lg border shadow-sm group-hover:opacity-90 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">{t('details.noLogs')}</h3>
                  <p className="text-muted-foreground">
                    {searchJobTitle || startDate || endDate
                      ? t('details.noLogsMatch')
                      : t('details.noLogsNone')}
                  </p>
                  {(searchJobTitle || startDate || endDate) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-4 rounded-full"
                    >
                      {t('clearFilters')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Loading More State */}
      {loading && workerData && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loadingMoreLogs')}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">{currentImageAlt}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeImageModal}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-black rounded-lg overflow-hidden">
              <img
                src={currentImageUrl}
                alt={currentImageAlt}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={closeImageModal}
                className="rounded-full text-white border-white/30 hover:bg-white/10"
              >
                {tCommon('closePreview')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDetailedWorklogsPage;