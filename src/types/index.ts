export interface User {
  id: string;
  email: string;
  role: 'homeowner' | 'cleaner' | 'admin';
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  avatarUrl?: string;
}

export interface Property {
  id: string;
  homeownerId: string;
  address: string;
  notes?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  homeownerId: string;
  cleanerId?: string;
  propertyId: string;
  dateTime: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
  beforePhotos: string[];
  afterPhotos: string[];
  createdAt: string;
  updatedAt: string;
  property?: Property;
  homeowner?: User;
  cleaner?: User;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  timestamp: string;
  sender?: User;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  stripePaymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export interface Payout {
  id: string;
  cleanerId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface BookingFormData {
  propertyId?: string;
  address: string;
  dateTime: string;
  notes?: string;
  recurringWeekly?: boolean;
  recurringBiweekly?: boolean;
}

export interface CleanerStats {
  totalJobs: number;
  completedJobs: number;
  totalEarnings: number;
  pendingPayouts: number;
  rating: number;
}

export interface AdminStats {
  totalBookings: number;
  activeCleaners: number;
  totalRevenue: number;
  pendingApprovals: number;
  monthlyGrowth: number;
}

export interface ChatRoom {
  id: string;
  bookingId: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface ServiceArea {
  zipCode: string;
  city: string;
  state: string;
  isActive: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  features: string[];
}
