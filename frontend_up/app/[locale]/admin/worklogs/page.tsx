'use client';

import { useState, useEffect } from 'react';
import { Link } from "@/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button'; // Import Button from UI components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import {
  Search,
  User,
  Calendar,
  Clock,
  Briefcase,
  Loader2,
  ChevronRight,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import moment from 'moment';
import { useTranslations } from 'next-intl'

interface WorkLog {
  _id: string;
  job: {
    _id: string;
    title: string;
  };
  workDate: string;
  startTime: string;
  endTime: string;
  startPhoto: string;
  endPhoto: string;
  status: string;
}

interface WorkerWithWorklogs {
  workerId: string;
  workerName: string;
  profilePicture?: string;
  worklogsByDate: Record<string, WorkLog[]>;
}

const AdminWorklogsPage = () => {
  const t = useTranslations('Admin.worklogs')
  const tCommon = useTranslations('Common')
  const [workers, setWorkers] = useState<WorkerWithWorklogs[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const fetchWorklogs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.getAdminWorklogs({
          search: searchTerm || undefined,
          date: selectedDate || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        });
        setWorkers(response || []);
      } catch (error: any) {
        setError(error.message || t('errors.fetchFailed'));
        console.error('Error fetching worklogs:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchWorklogs();
    }, 500);

    return () => clearTimeout(debounceFetch);
  }, [searchTerm, selectedDate, selectedStatus]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setSelectedStatus('all');
  };

  const getWorkLogStats = (worker: WorkerWithWorklogs) => {
    const allLogs = Object.values(worker.worklogsByDate).flat();
    const totalWorklogs = allLogs.length;
    const pendingWorklogs = allLogs.filter(log => log.status === 'pending').length;
    const assignedWorklogs = allLogs.filter(log => log.status === 'assigned').length;
    const inProgressWorklogs = allLogs.filter(log => log.status === 'in-progress').length;
    const completedWorklogs = allLogs.filter(log => log.status === 'completed').length;
    const approvedWorklogs = allLogs.filter(log => log.status === 'approved').length;
    const rejectedWorklogs = allLogs.filter(log => log.status === 'rejected').length;
    const incompleteWorklogs = allLogs.filter(log => log.status === 'incomplete').length;
    const cancelledWorklogs = allLogs.filter(log => log.status === 'cancelled').length;

    return {
      total: totalWorklogs,
      pending: pendingWorklogs,
      assigned: assignedWorklogs,
      inProgress: inProgressWorklogs,
      completed: completedWorklogs,
      approved: approvedWorklogs,
      rejected: rejectedWorklogs,
      incomplete: incompleteWorklogs,
      cancelled: cancelledWorklogs,
    };
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'approved': 'bg-green-500',
      'rejected': 'bg-red-500',
      'pending': 'bg-yellow-500',
      'in-progress': 'bg-blue-500',
      'completed': 'bg-purple-500',
      'assigned': 'bg-indigo-500',
      'incomplete': 'bg-gray-500',
      'cancelled': 'bg-red-700',
    };
    return statusColors[status] || 'bg-gray-300';
  };

  if (loading && workers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
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

      {/* Filters Section */}
      <Card className={`bg-card border-border ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Search className="h-4 w-4 md:h-5 md:w-5" />
              {t('search')}
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
              <User className="h-3 w-3 md:h-4 md:w-4" />
              {t('searchWorker')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 md:h-4 md:w-4" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                {t('filterByDate')}
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium flex items-center gap-2">
                <Clock className="h-3 w-3 md:h-4 md:w-4" />
                {t('filterByStatus')}
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t('filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tCommon('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{tCommon('pending')}</SelectItem>
                  <SelectItem value="assigned">{tCommon('assigned')}</SelectItem>
                  <SelectItem value="in-progress">{tCommon('inProgress')}</SelectItem>
                  <SelectItem value="completed">{tCommon('completed')}</SelectItem>
                  <SelectItem value="approved">{tCommon('approved')}</SelectItem>
                  <SelectItem value="rejected">{tCommon('rejected')}</SelectItem>
                  <SelectItem value="incomplete">{tCommon('incomplete')}</SelectItem>
                  <SelectItem value="cancelled">{tCommon('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {workers.map((worker) => {
          const stats = getWorkLogStats(worker);
          const lastWorkDate = Object.keys(worker.worklogsByDate).sort().reverse()[0];
          const recentLogs = lastWorkDate ? worker.worklogsByDate[lastWorkDate] : [];

          return (
            <Card key={worker.workerId} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/admin/worklogs/${worker.workerId}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={worker.profilePicture} alt={worker.workerName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {worker.workerName?.charAt(0).toUpperCase() || 'W'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base md:text-lg truncate">
                        {worker.workerName}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">
                        {t('logsCount', { count: stats.total })}
                      </p>
                    </div>
                  </Link>
                  <Link href={`/admin/worklogs/${worker.workerId}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 rounded-lg bg-primary/5">
                    <p className="text-lg font-bold text-primary">{stats.total}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t('stats.total')}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                    <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t('stats.pending')}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-500/10">
                    <p className="text-lg font-bold text-green-600">{stats.approved}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t('stats.approved')}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-red-500/10">
                    <p className="text-lg font-bold text-red-600">{stats.rejected}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{t('stats.rejected')}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                {recentLogs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t('recent', { date: moment(lastWorkDate).format('MMM D') })}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {t('logsCountShort', { count: recentLogs.length })}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {recentLogs.slice(0, 2).map((log) => (
                        <div key={log._id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 truncate">
                            <Briefcase className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate text-xs">{log.job.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs">
                              {moment(log.startTime, 'HH:mm:ss').format('h:mm A')}
                            </span>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className="text-xs">
                              {moment(log.endTime, 'HH:mm:ss').format('h:mm A')}
                            </span>
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${getStatusColor(log.status)}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <div className="pt-2 border-t">
                  <Link href={`/admin/worklogs/${worker.workerId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 rounded-full gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      {t('viewDetails')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {workers.length === 0 && !loading && (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center">
              <User className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('noWorkers')}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchTerm || selectedDate || selectedStatus !== 'all'
                  ? t('noWorkersFiltered')
                  : t('noWorkersEmpty')}
              </p>
              {(searchTerm || selectedDate || selectedStatus !== 'all') && (
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

      {/* Loading More State */}
      {loading && workers.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loadingMore')}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorklogsPage;