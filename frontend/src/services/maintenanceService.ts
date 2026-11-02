import api from '../utils/api';
import {
  MaintenanceBooking,
  MaintenanceBookingPostDTO,
  MaintenanceDashboardStats,
  MaintenanceWorkRecord,
  MaintenanceWorkRecordPostDTO
} from '../models/owns/maintenance';
import * as XLSX from 'xlsx';

export const getMaintenanceBookings = async (params?: {
  search?: string;
  status?: string;
  building?: string;
  floor?: string;
  reportedBy?: string;
  startDate?: string;
  endDate?: string;
}): Promise<MaintenanceBooking[]> => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status && params.status !== 'ALL') query.append('status', params.status);
  if (params?.building && params.building !== 'ALL') query.append('building', params.building);
  if (params?.floor && params.floor !== 'ALL') query.append('floor', params.floor);
  if (params?.reportedBy) query.append('reportedBy', params.reportedBy);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return api.get<MaintenanceBooking[]>(`maintenance/bookings${qs}`);
};

export const getMaintenanceBookingById = async (id: number): Promise<MaintenanceBooking> => {
  return api.get<MaintenanceBooking>(`maintenance/bookings/${id}`);
};

export const getMaintenanceBookingByCode = async (code: string): Promise<MaintenanceBooking> => {
  return api.get<MaintenanceBooking>(`maintenance/bookings/by-code/${code}`);
};

export const getNextBookingId = async (): Promise<{ nextBookingId: string }> => {
  return api.get<{ nextBookingId: string }>('maintenance/bookings/next-id');
};

export const createMaintenanceBooking = async (
  dto: MaintenanceBookingPostDTO
): Promise<MaintenanceBooking> => {
  return api.post<MaintenanceBooking>('maintenance/bookings', dto);
};

export const updateMaintenanceBooking = async (
  id: number,
  dto: Partial<MaintenanceBookingPostDTO>
): Promise<MaintenanceBooking> => {
  return api.patch<MaintenanceBooking>(`maintenance/bookings/${id}`, dto);
};

export const assignBookingTechnician = async (
  id: number,
  technicianId?: number,
  technicianName?: string
): Promise<MaintenanceBooking> => {
  return api.patch<MaintenanceBooking>(`maintenance/bookings/${id}`, {
    assignedTechnicianId: technicianId,
    status: 'ASSIGNED',
    attendedBy: technicianName
  });
};

export const closeMaintenanceBooking = async (
  id: number,
  closingRemarks: string,
  closedId?: string
): Promise<MaintenanceBooking> => {
  return api.post<MaintenanceBooking>(`maintenance/bookings/${id}/close`, {
    closingRemarks,
    closedId
  });
};

export const getMaintenanceWorkRecords = async (
  bookingId?: number
): Promise<MaintenanceWorkRecord[]> => {
  const endpoint = bookingId
    ? `maintenance/work-records/booking/${bookingId}`
    : 'maintenance/work-records';
  return api.get<MaintenanceWorkRecord[]>(endpoint);
};

export const createMaintenanceWorkRecord = async (
  dto: MaintenanceWorkRecordPostDTO
): Promise<MaintenanceWorkRecord> => {
  return api.post<MaintenanceWorkRecord>('maintenance/work-records', dto);
};

export const getMaintenanceDashboardStats = async (): Promise<MaintenanceDashboardStats> => {
  return api.get<MaintenanceDashboardStats>('maintenance/dashboard-stats');
};

export const seedMaintenanceDemoData = async (): Promise<{ message: string; count: number }> => {
  return api.post<{ message: string; count: number }>('maintenance/seed-demo', {});
};

export const exportBookingsToExcel = (bookings: MaintenanceBooking[], filename = 'Maintenance_Booking_Register.xlsx') => {
  const rows = bookings.map((b, index) => ({
    'S.No': index + 1,
    'Booking ID': b.bookingId,
    'Date': b.date ? new Date(b.date).toLocaleDateString() : '',
    'Reported By': b.reportedBy,
    'Booked By (Admin)': b.bookedBy || '',
    'Building': b.building,
    'Floor': b.floor,
    'Room': b.room || '',
    'Exact Location': b.exactLocation,
    'Complaint / Maintenance Details': b.complaintDetails,
    'Remarks': b.remarks || '',
    'Status': b.status,
    'Assigned Technician': b.assignedTechnician ? `${b.assignedTechnician.firstName} ${b.assignedTechnician.lastName}` : '',
    'Closed ID': b.closedId || '',
    'Closed Date': b.closedDate ? new Date(b.closedDate).toLocaleDateString() : '',
    'Closing Remarks': b.closingRemarks || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Booking Register');
  XLSX.writeFile(workbook, filename);
};

export const exportWorkRecordsToExcel = (records: MaintenanceWorkRecord[], filename = 'Maintenance_Work_Register.xlsx') => {
  const rows = records.map((r, index) => ({
    'S.No': index + 1,
    'Booking ID': r.bookingCode || r.booking?.bookingId || '',
    'Type of Work': r.typeOfWork || '',
    'Attended By': r.attendedBy || (r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : ''),
    'Starting Date': r.startingDate ? new Date(r.startingDate).toLocaleDateString() : '',
    'Finishing Date': r.finishingDate ? new Date(r.finishingDate).toLocaleDateString() : '',
    'Time': r.timeTaken || '',
    'Pending Reason': r.pendingReason || '',
    'Closed ID': r.closedId || '',
    'Work Details': r.workDetails || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Register');
  XLSX.writeFile(workbook, filename);
};
