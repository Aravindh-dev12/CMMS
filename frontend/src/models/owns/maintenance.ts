import { UserMiniDTO } from './user';

export type BookingStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

export interface MaintenanceWorkRecord {
  id?: number;
  booking?: MaintenanceBooking;
  bookingCode?: string;
  typeOfWork?: string;
  attendedBy?: string;
  technician?: UserMiniDTO | null;
  startingDate?: string;
  finishingDate?: string;
  timeTaken?: string;
  pendingReason?: string;
  closedId?: string;
  workDetails?: string;
  signature?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceBooking {
  id?: number;
  bookingId: string;
  date: string;
  reportedBy: string;
  building: string;
  floor: string;
  room?: string;
  exactLocation: string;
  complaintDetails: string;
  status: BookingStatus;
  typeOfWork?: string;
  assignedTechnician?: UserMiniDTO | null;
  closedId?: string;
  closedDate?: string;
  closingRemarks?: string;
  dueDate?: string;
  workRecords?: MaintenanceWorkRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceDashboardStats {
  totalBookings: number;
  pendingComplaints: number;
  assignedWorkOrders: number;
  inProgress: number;
  completedWork: number;
  closedWorkOrders: number;
  overdueMaintenance: number;
  recentBookings: MaintenanceBooking[];
  recentCompletedWork: MaintenanceWorkRecord[];
  technicianSummary: { name: string; count: number }[];
  buildingSummary: { name: string; count: number }[];
  dateReport: { date: string; count: number; completed: number }[];
}

export interface MaintenanceBookingPostDTO {
  bookingId?: string;
  date: string;
  reportedBy: string;
  building: string;
  floor: string;
  room?: string;
  exactLocation: string;
  complaintDetails: string;
  typeOfWork?: string;
  assignedTechnicianId?: number;
  dueDate?: string;
}

export interface MaintenanceWorkRecordPostDTO {
  bookingId: number;
  typeOfWork?: string;
  attendedBy: string;
  technicianId?: number;
  startingDate?: string;
  finishingDate?: string;
  timeTaken?: string;
  pendingReason?: string;
  closedId?: string;
  workDetails?: string;
  signature?: string;
  statusUpdate?: BookingStatus;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}
