'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_price: number;
  property: {
    name: string;
    address: string;
    city: string;
    state: string;
  } | null;
  service_type: {
    name: string;
    description: string;
  } | null;
  cleaner_profile?: {
    user_profile: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
}

export interface HomeownerStats {
  totalCleanings: number;
  upcomingCleanings: number;
  totalSpent: number;
  favoriteCleaners: number;
}

export interface Message {
  id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

export interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paid_at?: string;
  created_at: string;
  appointment: {
    scheduled_date: string;
    service_type: {
      name: string;
    } | null;
  } | null;
}

export function useHomeownerAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_date,
            scheduled_time,
            status,
            total_price,
            property:properties(
              name,
              address,
              city,
              state
            ),
            service_type:service_types(
              name,
              description
            ),
            cleaner_profile:cleaner_profiles(
              user_profile:user_profiles(
                first_name,
                last_name
              )
            )
          `)
          .eq('homeowner_id', user.id)
          .order('scheduled_date', { ascending: true });

        if (error) throw error;
        
        // Transform the data to match our interface
        const transformedData = (data || []).map(appointment => ({
          ...appointment,
          property: Array.isArray(appointment.property) ? appointment.property[0] : appointment.property,
          service_type: Array.isArray(appointment.service_type) ? appointment.service_type[0] : appointment.service_type,
          cleaner_profile: appointment.cleaner_profile && Array.isArray(appointment.cleaner_profile) 
            ? {
                ...appointment.cleaner_profile[0],
                user_profile: Array.isArray(appointment.cleaner_profile[0]?.user_profile) 
                  ? appointment.cleaner_profile[0].user_profile[0] 
                  : appointment.cleaner_profile[0]?.user_profile
              }
            : appointment.cleaner_profile
        }));
        
        setAppointments(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.id]);

  return { appointments, loading, error, refetch: () => {} };
}

export function useHomeownerProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchProperties = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [user?.id]);

  return { properties, loading, error };
}

export function useHomeownerStats() {
  const [stats, setStats] = useState<HomeownerStats>({
    totalCleanings: 0,
    upcomingCleanings: 0,
    totalSpent: 0,
    favoriteCleaners: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get total cleanings (completed appointments)
        const { count: totalCleanings } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('homeowner_id', user.id)
          .eq('status', 'completed');

        // Get upcoming cleanings
        const { count: upcomingCleanings } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('homeowner_id', user.id)
          .in('status', ['pending', 'confirmed']);

        // Get total spent (from paid payments)
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, appointments!inner(homeowner_id)')
          .eq('appointments.homeowner_id', user.id)
          .eq('status', 'paid');

        const totalSpent = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

        // Get favorite cleaners count (cleaners with 2+ completed jobs)
        const { data: cleanerCounts } = await supabase
          .from('appointments')
          .select('cleaner_id')
          .eq('homeowner_id', user.id)
          .eq('status', 'completed')
          .not('cleaner_id', 'is', null);

        const cleanerJobCounts = cleanerCounts?.reduce((acc, appointment) => {
          const cleanerId = appointment.cleaner_id;
          if (cleanerId) {
            acc[cleanerId] = (acc[cleanerId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>) || {};

        const favoriteCleaners = Object.values(cleanerJobCounts).filter(count => count >= 2).length;

        setStats({
          totalCleanings: totalCleanings || 0,
          upcomingCleanings: upcomingCleanings || 0,
          totalSpent,
          favoriteCleaners
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  return { stats, loading, error };
}

export function useHomeownerMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            subject,
            content,
            is_read,
            created_at,
            sender:user_profiles!sender_id(
              first_name,
              last_name,
              role
            )
          `)
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform the data to match our interface
        const transformedData = (data || []).map(message => ({
          ...message,
          sender: Array.isArray(message.sender) ? message.sender[0] : message.sender
        }));
        
        setMessages(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user?.id]);

  return { messages, loading, error };
}

export function useHomeownerPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            status,
            paid_at,
            created_at,
            appointment:appointments!inner(
              scheduled_date,
              homeowner_id,
              service_type:service_types(
                name
              )
            )
          `)
          .eq('appointment.homeowner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform the data to match our interface
        const transformedData = (data || []).map(payment => ({
          ...payment,
          appointment: Array.isArray(payment.appointment) 
            ? {
                ...payment.appointment[0],
                service_type: Array.isArray(payment.appointment[0]?.service_type) 
                  ? payment.appointment[0].service_type[0] 
                  : payment.appointment[0]?.service_type
              }
            : payment.appointment
        }));
        
        setPayments(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch payments');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user?.id]);

  return { payments, loading, error };
}
