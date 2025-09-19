'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  DollarSign, 
  BarChart3, 
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Home,
  Loader2
} from 'lucide-react';
import {
  useAdminAppointments,
  useAdminCleaners,
  useAdminStats,
  useAdminPayments,
  useAdminMessages,
  updateAppointmentStatus,
  assignCleanerToAppointment
} from '../../hooks/useAdminData';

export default function AdminDashboard() {
  const { user, enterBypassMode } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Real data hooks - must be called at top level
  const { appointments, loading: appointmentsLoading, error: appointmentsError } = useAdminAppointments();
  const { cleaners, loading: cleanersLoading, error: cleanersError } = useAdminCleaners();
  const { stats, loading: statsLoading, error: statsError } = useAdminStats();
  const { payments, loading: paymentsLoading, error: paymentsError } = useAdminPayments();
  const { messages, loading: messagesLoading, error: messagesError } = useAdminMessages();

  // If no user, show Enter button
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
            <p className="text-gray-600">
              Access your administrative dashboard to manage cleaners, bookings, and business operations.
            </p>
          </div>
          <button
            onClick={() => enterBypassMode('admin')}
            className="w-full btn-primary text-lg py-3"
          >
            Enter Portal
          </button>
        </div>
      </div>
    );
  }

  // Helper functions
  const formatDateTime = (date: string, time: string) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${formattedDate} at ${time}`;
  };

  const getHomeownerName = (appointment: any) => {
    if (appointment.homeowner) {
      const { first_name, last_name } = appointment.homeowner;
      return `${first_name} ${last_name}`;
    }
    return 'Unknown';
  };

  const getCleanerName = (appointment: any) => {
    if (appointment.cleaner_profile?.user_profile) {
      const { first_name, last_name } = appointment.cleaner_profile.user_profile;
      return `${first_name} ${last_name}`;
    }
    return null;
  };

  const getPropertyAddress = (appointment: any) => {
    if (appointment.property) {
      const { address, city, state } = appointment.property;
      return `${address}, ${city}, ${state}`;
    }
    return 'Address not available';
  };

  const getCleanerFullName = (cleaner: any) => {
    if (cleaner.user_profile) {
      const { first_name, last_name } = cleaner.user_profile;
      return `${first_name} ${last_name}`;
    }
    return 'Unknown';
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    const result = await updateAppointmentStatus(appointmentId, 'confirmed');
    if (result.success) {
      // Refresh data or show success message
      window.location.reload(); // Simple refresh for now
    } else {
      alert('Failed to approve appointment: ' + result.error);
    }
  };

  const handleDeclineAppointment = async (appointmentId: string) => {
    const result = await updateAppointmentStatus(appointmentId, 'cancelled');
    if (result.success) {
      // Refresh data or show success message
      window.location.reload(); // Simple refresh for now
    } else {
      alert('Failed to decline appointment: ' + result.error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'bookings', label: 'All Bookings', icon: Calendar },
    { id: 'cleaners', label: 'Cleaners', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Admin Dashboard
        </h2>
        <p className="text-primary-100">
          Manage your cleaning business operations from one central location.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Cleaners</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.activeCleaners}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Growth</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyGrowth}%</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          {appointmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading appointments...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.filter(appointment => appointment.status === 'pending').slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{getHomeownerName(appointment)}</p>
                    <p className="text-sm text-gray-600">{formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}</p>
                    <p className="text-sm text-gray-600">{getPropertyAddress(appointment)}</p>
                    {appointment.service_type && (
                      <p className="text-sm text-gray-600">Service: {appointment.service_type.name}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleApproveAppointment(appointment.id)}
                      className="btn-primary text-sm"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleDeclineAppointment(appointment.id)}
                      className="btn-secondary text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {appointments.filter(appointment => appointment.status === 'pending').length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-600">No pending approvals</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cleaners</h3>
          {cleanersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading cleaners...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {cleaners.slice(0, 3).map((cleaner) => (
                <div key={cleaner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getCleanerFullName(cleaner)}</p>
                      <p className="text-sm text-gray-600">{cleaner.total_jobs} jobs • {cleaner.rating}★</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    cleaner.is_available ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                  }`}>
                    {cleaner.is_available ? 'active' : 'inactive'}
                  </span>
                </div>
              ))}
              {cleaners.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No cleaners found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
        <div className="flex space-x-2">
          <select className="input-field">
            <option>All Status</option>
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <button className="btn-primary">Export</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {appointmentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading appointments...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Homeowner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cleaner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}
                        </div>
                        <div className="text-sm text-gray-500">{getPropertyAddress(appointment)}</div>
                        {appointment.service_type && (
                          <div className="text-sm text-gray-500">{appointment.service_type.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getHomeownerName(appointment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCleanerName(appointment) || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${appointment.total_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No appointments found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderCleaners = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Cleaner Management</h2>
        <button className="btn-primary">Add New Cleaner</button>
      </div>

      {cleanersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading cleaners...</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {cleaners.map((cleaner) => (
            <div key={cleaner.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{getCleanerFullName(cleaner)}</h3>
                    <p className="text-sm text-gray-600">
                      {cleaner.total_jobs} completed jobs • {cleaner.rating}★ rating
                    </p>
                    {cleaner.experience_years && (
                      <p className="text-sm text-gray-600">{cleaner.experience_years} years experience</p>
                    )}
                    {cleaner.hourly_rate && (
                      <p className="text-sm text-gray-600">${cleaner.hourly_rate}/hour</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      cleaner.is_available ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                    }`}>
                      {cleaner.is_available ? 'Available' : 'Unavailable'}
                    </span>
                    <div className="mt-1 text-xs text-gray-500">
                      {cleaner.background_check_verified && '✓ Background Check '}
                      {cleaner.insurance_verified && '✓ Insured'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-secondary text-sm">View Profile</button>
                    <button className="btn-primary text-sm">Assign Job</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {cleaners.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No cleaners found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Message Center</h2>
      {messagesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading messages...</span>
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-4">
          {messages.slice(0, 10).map((message) => (
            <div key={message.id} className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">
                      {message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : 'Unknown'}
                    </p>
                    <span className="text-sm text-gray-500">→</span>
                    <p className="text-sm text-gray-600">
                      {message.recipient ? `${message.recipient.first_name} ${message.recipient.last_name}` : 'Unknown'}
                    </p>
                  </div>
                  {message.subject && (
                    <p className="text-sm font-medium text-gray-800 mt-1">{message.subject}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="ml-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    message.is_read ? 'text-gray-600 bg-gray-100' : 'text-blue-600 bg-blue-100'
                  }`}>
                    {message.is_read ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages</h3>
          <p className="text-gray-600">
            All conversations between homeowners and cleaners will appear here.
          </p>
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          {statsLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          ) : (
            <p className="text-3xl font-bold text-green-600">${stats.totalRevenue}</p>
          )}
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Payouts</h3>
          <p className="text-3xl font-bold text-yellow-600">$2,340</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">This Month</h3>
          <p className="text-3xl font-bold text-blue-600">$4,250</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        {paymentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading payments...</span>
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-4">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    ${payment.amount} - {payment.appointment?.service_type?.name || 'Service'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {payment.appointment?.homeowner ? 
                      `${payment.appointment.homeowner.first_name} ${payment.appointment.homeowner.last_name}` : 
                      'Unknown Customer'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  payment.status === 'paid' ? 'text-green-600 bg-green-100' :
                  payment.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                  payment.status === 'failed' ? 'text-red-600 bg-red-100' :
                  'text-gray-600 bg-gray-100'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions</h3>
            <p className="text-gray-600">
              Payment transactions will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends</h3>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chart visualization coming soon</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Growth</h3>
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Revenue chart coming soon</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading analytics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.avgJobsPerDay}</p>
              <p className="text-sm text-gray-600">Avg Jobs/Day</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">${stats.avgJobValue}</p>
              <p className="text-sm text-gray-600">Avg Job Value</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'bookings':
        return renderBookings();
      case 'cleaners':
        return renderCleaners();
      case 'messages':
        return renderMessages();
      case 'payments':
        return renderPayments();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>
    </div>
  );
}
