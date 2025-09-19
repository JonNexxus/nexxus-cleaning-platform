'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Calendar, 
  Home, 
  MessageCircle, 
  CreditCard, 
  Camera, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Loader2
} from 'lucide-react';
import {
  useHomeownerAppointments,
  useHomeownerProperties,
  useHomeownerStats,
  useHomeownerMessages,
  useHomeownerPayments
} from '../../hooks/useHomeownerData';

export default function HomeownerDashboard() {
  const { user, enterBypassMode } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Real data hooks - must be called at top level
  const { appointments, loading: appointmentsLoading, error: appointmentsError } = useHomeownerAppointments();
  const { properties, loading: propertiesLoading, error: propertiesError } = useHomeownerProperties();
  const { stats, loading: statsLoading, error: statsError } = useHomeownerStats();
  const { messages, loading: messagesLoading, error: messagesError } = useHomeownerMessages();
  const { payments, loading: paymentsLoading, error: paymentsError } = useHomeownerPayments();

  // If no user, show Enter button
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Homeowner Portal</h2>
            <p className="text-gray-600">
              Access your cleaning dashboard to manage appointments, properties, and payments.
            </p>
          </div>
          <button
            onClick={() => enterBypassMode('homeowner')}
            className="w-full btn-primary text-lg py-3"
          >
            Enter Portal
          </button>
        </div>
      </div>
    );
  }

  // Helper function to format date and time
  const formatDateTime = (date: string, time: string) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${formattedDate} at ${time}`;
  };

  // Helper function to get cleaner name
  const getCleanerName = (appointment: any) => {
    if (appointment.cleaner_profile?.user_profile) {
      const { first_name, last_name } = appointment.cleaner_profile.user_profile;
      return `${first_name} ${last_name}`;
    }
    return null;
  };

  // Helper function to get property address
  const getPropertyAddress = (appointment: any) => {
    if (appointment.property) {
      const { address, city, state } = appointment.property;
      return `${address}, ${city}, ${state}`;
    }
    return 'Address not available';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'properties', label: 'Properties', icon: Camera }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
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
          Welcome back, {user?.profile?.firstName || user?.email}!
        </h2>
        <p className="text-primary-100">
          Your home cleaning dashboard is ready. Book your next cleaning or manage existing appointments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cleanings</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalCleanings}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingCleanings}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">${stats.totalSpent}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Favorite Cleaners</p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.favoriteCleaners}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary flex items-center justify-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Book New Cleaning</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Contact Support</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>View Schedule</span>
          </button>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
        {appointmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading appointments...</span>
          </div>
        ) : appointmentsError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
            <p className="text-red-600">Failed to load appointments</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No appointments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.slice(0, 3).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Calendar className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}
                    </p>
                    <p className="text-sm text-gray-600">{getPropertyAddress(appointment)}</p>
                    {getCleanerName(appointment) && (
                      <p className="text-sm text-gray-600">Cleaner: {getCleanerName(appointment)}</p>
                    )}
                    {appointment.service_type && (
                      <p className="text-sm text-gray-600">Service: {appointment.service_type.name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-1">${appointment.total_price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Booking</span>
        </button>
      </div>

      {appointmentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading appointments...</span>
        </div>
      ) : appointmentsError ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load appointments</h3>
          <p className="text-gray-600">{appointmentsError}</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
          <p className="text-gray-600">Book your first cleaning to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-primary-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {formatDateTime(appointment.scheduled_date, appointment.scheduled_time)}
                    </h3>
                    <p className="text-sm text-gray-600">{getPropertyAddress(appointment)}</p>
                    {appointment.service_type && (
                      <p className="text-sm text-gray-600">Service: {appointment.service_type.name}</p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>
              
              {getCleanerName(appointment) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Assigned Cleaner:</strong> {getCleanerName(appointment)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">
                  ${appointment.total_price}
                </div>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">
                    View Details
                  </button>
                  {appointment.status === 'pending' && (
                    <button className="btn-primary text-sm">
                      Modify
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Messages</h2>
      {messagesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading messages...</span>
        </div>
      ) : messagesError ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load messages</h3>
          <p className="text-gray-600">{messagesError}</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-600">
            Messages with your cleaners and support team will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`p-4 rounded-lg border ${message.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-primary-600" />
                  {message.sender && (
                    <span className="font-medium text-gray-900">
                      {message.sender.first_name} {message.sender.last_name}
                    </span>
                  )}
                  {message.sender?.role && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {message.sender.role}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(message.created_at).toLocaleDateString()}
                </span>
              </div>
              {message.subject && (
                <h4 className="font-medium text-gray-900 mb-1">{message.subject}</h4>
              )}
              <p className="text-gray-700">{message.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPayments = () => (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>
      {paymentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading payments...</span>
        </div>
      ) : paymentsError ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load payments</h3>
          <p className="text-gray-600">{paymentsError}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
          <p className="text-gray-600">
            Your payment history and receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      ${payment.amount}
                    </p>
                    {payment.appointment?.service_type && (
                      <p className="text-sm text-gray-600">
                        {payment.appointment.service_type.name}
                      </p>
                    )}
                    {payment.appointment?.scheduled_date && (
                      <p className="text-sm text-gray-600">
                        {new Date(payment.appointment.scheduled_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    payment.status === 'paid' ? 'text-green-600 bg-green-100' :
                    payment.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                    payment.status === 'failed' ? 'text-red-600 bg-red-100' :
                    'text-gray-600 bg-gray-100'
                  }`}>
                    {payment.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 
                     new Date(payment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProperties = () => (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Properties</h2>
      {propertiesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading properties...</span>
        </div>
      ) : propertiesError ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load properties</h3>
          <p className="text-gray-600">{propertiesError}</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties added</h3>
          <p className="text-gray-600 mb-4">
            Add your properties to make booking faster and easier.
          </p>
          <button className="btn-primary">
            Add Property
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Home className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">{property.name}</h3>
                    <p className="text-sm text-gray-600">
                      {property.address}, {property.city}, {property.state} {property.zip_code}
                    </p>
                    {(property.bedrooms || property.bathrooms || property.square_feet) && (
                      <div className="flex space-x-4 mt-1 text-sm text-gray-500">
                        {property.bedrooms && <span>{property.bedrooms} bed</span>}
                        {property.bathrooms && <span>{property.bathrooms} bath</span>}
                        {property.square_feet && <span>{property.square_feet} sq ft</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">
                    Edit
                  </button>
                  <button className="btn-primary text-sm">
                    Book Cleaning
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'bookings':
        return renderBookings();
      case 'messages':
        return renderMessages();
      case 'payments':
        return renderPayments();
      case 'properties':
        return renderProperties();
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
