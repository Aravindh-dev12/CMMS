import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import CreateIcon from '@mui/icons-material/Create';
import SignatureCanvas from 'react-signature-canvas';
import useAuth from '../../../../hooks/useAuth';

import {
  MaintenanceBooking,
  MaintenanceBookingPostDTO
} from '../../../../models/owns/maintenance';
import {
  assignBookingTechnician,
  closeMaintenanceBooking,
  createMaintenanceBooking,
  exportBookingsToExcel,
  getMaintenanceBookings,
  getNextBookingId
} from '../../../../services/maintenanceService';
import StatusBadge from '../Common/StatusBadge';
import api from '../../../../utils/api';
import { UserMiniDTO } from '../../../../models/owns/user';

const buildingsList = ['ALL', 'B1', 'B2', 'Block C', 'Main Admin', 'Workshop'];
const floorsList = ['ALL', 'Basement', 'Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Rooftop'];
const statusOptions = ['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];

const MaintenanceBookingRegister: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<MaintenanceBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [buildingFilter, setBuildingFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [openNewModal, setOpenNewModal] = useState<boolean>(false);
  const [nextBookingCode, setNextBookingCode] = useState<string>('');
  const [bookingSigModalOpen, setBookingSigModalOpen] = useState<boolean>(false);
  const bookingSigRef = useRef<SignatureCanvas | null>(null);

  const [newBookingData, setNewBookingData] = useState<MaintenanceBookingPostDTO>({
    bookingId: '',
    date: new Date().toISOString().substring(0, 10),
    reportedBy: '',
    bookedBy: '',
    bookedBySignature: '',
    remarks: '',
    building: 'B1',
    floor: 'Ground Floor',
    room: '',
    exactLocation: '',
    complaintDetails: '',
    typeOfWork: 'Plumbing'
  });

  // Action Modals
  const [selectedBooking, setSelectedBooking] = useState<MaintenanceBooking | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState<boolean>(false);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false);
  const [closingRemarks, setClosingRemarks] = useState<string>('');
  const [technicians, setTechnicians] = useState<UserMiniDTO[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>('');
  const [customTechName, setCustomTechName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data: any = await getMaintenanceBookings({
        search,
        status: statusFilter,
        building: buildingFilter,
        floor: floorFilter,
        startDate,
        endDate
      });
      const list = Array.isArray(data) ? data : data?.content || [];
      setBookings(list);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const users: any = await api.get('users/mini?withRequesters=true');
      const list = Array.isArray(users) ? users : users?.content || [];
      setTechnicians(list);
    } catch (err) {
      console.error('Failed to load technicians:', err);
      setTechnicians([]);
    }
  };

  useEffect(() => {
    loadData();
    loadTechnicians();
  }, [statusFilter, buildingFilter, floorFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenNewModal = async () => {
    try {
      const currentAdminName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Admin';
      const res = await getNextBookingId();
      setNextBookingCode(res.nextBookingId);
      setNewBookingData((prev) => ({
        ...prev,
        bookingId: res.nextBookingId,
        date: new Date().toISOString().substring(0, 10),
        reportedBy: '',
        bookedBy: currentAdminName,
        bookedBySignature: '',
        remarks: '',
        room: '',
        exactLocation: '',
        complaintDetails: ''
      }));
      setErrorMessage('');
      setOpenNewModal(true);
    } catch (err) {
      console.error(err);
      setOpenNewModal(true);
    }
  };

  const handleSaveBookingSignature = () => {
    if (bookingSigRef.current && !bookingSigRef.current.isEmpty()) {
      const dataUrl = bookingSigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setNewBookingData((prev) => ({ ...prev, bookedBySignature: dataUrl }));
      setBookingSigModalOpen(false);
    }
  };

  const handleClearBookingSignature = () => {
    if (bookingSigRef.current) {
      bookingSigRef.current.clear();
    }
  };

  const handleCreateBooking = async () => {
    if (!newBookingData.reportedBy || !newBookingData.exactLocation || !newBookingData.complaintDetails) {
      setErrorMessage('Please fill in all required fields (Reported By, Exact Location, Complaint Details).');
      return;
    }
    try {
      await createMaintenanceBooking({
        ...newBookingData,
        date: new Date(newBookingData.date).toISOString()
      });
      setOpenNewModal(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating booking');
    }
  };

  const handleOpenAssign = (booking: MaintenanceBooking) => {
    setSelectedBooking(booking);
    setSelectedTechId(booking.assignedTechnician?.id || '');
    setCustomTechName('');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedBooking?.id) return;
    try {
      const tech = technicians.find((t) => t.id === selectedTechId);
      const techName = tech ? `${tech.firstName} ${tech.lastName}` : customTechName || 'Technician';
      await assignBookingTechnician(selectedBooking.id, typeof selectedTechId === 'number' ? selectedTechId : undefined, techName);
      setAssignModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenClose = (booking: MaintenanceBooking) => {
    setSelectedBooking(booking);
    setClosingRemarks('');
    setCloseModalOpen(true);
  };

  const handleCloseSubmit = async () => {
    if (!selectedBooking?.id) return;
    try {
      await closeMaintenanceBooking(selectedBooking.id, closingRemarks);
      setCloseModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    exportBookingsToExcel(safeBookings, 'Maintenance_Booking_Register.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeTechnicians = Array.isArray(technicians) ? technicians : [];

  return (
    <>
      <Helmet>
        <title>Maintenance Booking Register</title>
      </Helmet>

      <Box sx={{ p: { xs: 2, md: 3 } }} className="maintenance-booking-register-page">
        {/* Header Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2}
          mb={3}
          sx={{ '@media print': { display: 'none' } }}
        >
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Maintenance Booking Register
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Digital Maintenance Complaint & Booking Register with full lifecycle tracking
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              size="medium"
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportExcel}
              size="medium"
              color="secondary"
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="medium"
            >
              Print Register
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenNewModal}
              size="medium"
              color="primary"
            >
              New Booking
            </Button>
          </Stack>
        </Box>

        {/* Search & Filter Bar */}
        <Card sx={{ mb: 3, p: 2, '@media print': { display: 'none' } }}>
          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search Booking ID / Reporter"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s === 'ALL' ? 'All Statuses' : s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Building"
                  value={buildingFilter}
                  onChange={(e) => setBuildingFilter(e.target.value)}
                >
                  {buildingsList.map((b) => (
                    <MenuItem key={b} value={b}>
                      {b === 'ALL' ? 'All Buildings' : b}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Floor"
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                >
                  {floorsList.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f === 'ALL' ? 'All Floors' : f}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="From Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3} md={1.5}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="To Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </form>
        </Card>

        {/* Printable Register Title (visible during print only) */}
        <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2, textAlign: 'center' } }}>
          <Typography variant="h4" fontWeight={800}>
            MAINTENANCE BOOKING REGISTER
          </Typography>
          <Typography variant="body2">
            Generated on: {new Date().toLocaleString()} | Total Bookings: {safeBookings.length}
          </Typography>
        </Box>

        {/* Table Register Card */}
        <Card sx={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <TableContainer>
            <Table
              sx={{
                minWidth: 900,
                '& th': {
                  backgroundColor: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid #cbd5e1'
                },
                '& td': {
                  fontSize: '0.85rem',
                  borderBottom: '1px solid #e2e8f0',
                  py: 1.5
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell width="50" align="center">S.No</TableCell>
                  <TableCell width="105">Booking ID</TableCell>
                  <TableCell width="100">Date</TableCell>
                  <TableCell width="125">Reported By</TableCell>
                  <TableCell width="135">Booked By (Admin)</TableCell>
                  <TableCell width="175">Location Details</TableCell>
                  <TableCell>Complaint / Maintenance Details</TableCell>
                  <TableCell width="115" align="center">Booking Status</TableCell>
                  <TableCell width="80" align="center">Sign</TableCell>
                  <TableCell width="130" align="center" sx={{ '@media print': { display: 'none' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={36} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading Maintenance Bookings...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : safeBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                        No Maintenance Bookings Found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Try clearing filters or click "New Booking" to create a complaint.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  safeBookings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((b, index) => {
                      const serialNo = page * rowsPerPage + index + 1;
                      const formattedDate = b.date
                        ? new Date(b.date).toLocaleDateString('en-GB')
                        : '-';
                      return (
                        <TableRow key={b.id || b.bookingId} hover>
                          <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {serialNo}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            #{b.bookingId}
                          </TableCell>
                          <TableCell>{formattedDate}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{b.reportedBy}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {b.bookedBy || 'Admin'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {b.building} – {b.floor}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {b.exactLocation} {b.room ? `(${b.room})` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography variant="body2">{b.complaintDetails}</Typography>
                            {b.remarks && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                Remarks: {b.remarks}
                              </Typography>
                            )}
                            {b.typeOfWork && (
                              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'block' }}>
                                Type: {b.typeOfWork}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <StatusBadge status={b.status} />
                          </TableCell>
                          <TableCell align="center">
                            {b.bookedBySignature ? (
                              <Tooltip title="Digital Signature Attached">
                                <img
                                  src={b.bookedBySignature}
                                  alt="Sign"
                                  style={{
                                    height: 24,
                                    maxWidth: 60,
                                    objectFit: 'contain',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 2,
                                    backgroundColor: '#fff',
                                    padding: 1
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ '@media print': { display: 'none' } }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setDetailsDrawerOpen(true);
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {b.status === 'PENDING' && (
                                <Tooltip title="Assign Technician">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleOpenAssign(b)}
                                  >
                                    <AssignmentIndIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {(b.status === 'COMPLETED' || b.status === 'IN_PROGRESS') && (
                                <Tooltip title="Supervisor Close">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleOpenClose(b)}
                                  >
                                    <CheckCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={safeBookings.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ '@media print': { display: 'none' } }}
          />
        </Card>

        {/* Modal: New Booking / Complaint */}
        <Dialog
          open={openNewModal}
          onClose={() => setOpenNewModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                New Maintenance Booking
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Auto-generated Booking ID: #{nextBookingCode || '...'}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenNewModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2.5 }}>
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Booking ID"
                  value={newBookingData.bookingId || nextBookingCode}
                  helperText="Auto-generated sequential number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  fullWidth
                  required
                  label="Complaint Date"
                  value={newBookingData.date}
                  onChange={(e) => setNewBookingData({ ...newBookingData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Reported By (Name)"
                  placeholder="e.g. Nandhini"
                  value={newBookingData.reportedBy}
                  onChange={(e) => setNewBookingData({ ...newBookingData, reportedBy: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Booked / Entered By (Admin)"
                  placeholder="e.g. Super Admin"
                  value={newBookingData.bookedBy || ''}
                  onChange={(e) => setNewBookingData({ ...newBookingData, bookedBy: e.target.value })}
                  helperText="Admin or staff member entering this record"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Type of Work"
                  value={newBookingData.typeOfWork || 'Plumbing'}
                  onChange={(e) => setNewBookingData({ ...newBookingData, typeOfWork: e.target.value })}
                >
                  {['Plumbing', 'Electrical', 'HVAC / AC', 'Carpentry', 'Civil / Masonry', 'Painting', 'Appliance', 'General'].map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Building"
                  value={newBookingData.building}
                  onChange={(e) => setNewBookingData({ ...newBookingData, building: e.target.value })}
                >
                  {buildingsList.filter((b) => b !== 'ALL').map((b) => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Floor"
                  value={newBookingData.floor}
                  onChange={(e) => setNewBookingData({ ...newBookingData, floor: e.target.value })}
                >
                  {floorsList.filter((f) => f !== 'ALL').map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room / Department"
                  placeholder="e.g. Restroom 101, Lab 2"
                  value={newBookingData.room}
                  onChange={(e) => setNewBookingData({ ...newBookingData, room: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Exact Location"
                  placeholder="e.g. B1 – Ground Floor"
                  value={newBookingData.exactLocation}
                  onChange={(e) => setNewBookingData({ ...newBookingData, exactLocation: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  required
                  label="Complaint / Maintenance Details"
                  placeholder="Describe the issue, e.g. Ground floor water tap leakage."
                  value={newBookingData.complaintDetails}
                  onChange={(e) => setNewBookingData({ ...newBookingData, complaintDetails: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Remarks / Initial Notes (Optional)"
                  placeholder="e.g. Priority high, reported in person at reception desk."
                  value={newBookingData.remarks || ''}
                  onChange={(e) => setNewBookingData({ ...newBookingData, remarks: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Admin / Reporter Digital Signature
                </Typography>
                <Box
                  sx={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  {newBookingData.bookedBySignature ? (
                    <Box>
                      <img
                        src={newBookingData.bookedBySignature}
                        alt="Booking Signature"
                        style={{
                          maxHeight: 60,
                          maxWidth: 220,
                          display: 'inline-block',
                          border: '1px solid #cbd5e1',
                          borderRadius: 4,
                          backgroundColor: '#fff',
                          padding: 4
                        }}
                      />
                      <Box mt={1}>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setNewBookingData({ ...newBookingData, bookedBySignature: '' })}
                        >
                          Clear Sign
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                          onClick={() => setBookingSigModalOpen(true)}
                        >
                          Re-sign
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<CreateIcon />}
                      onClick={() => setBookingSigModalOpen(true)}
                      size="small"
                    >
                      Sign Complaint Form
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenNewModal(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleCreateBooking} variant="contained" color="primary">
              Register Complaint
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Signature Pad for Booking */}
        <Dialog
          open={bookingSigModalOpen}
          onClose={() => setBookingSigModalOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              Sign Complaint Form
            </Typography>
            <IconButton onClick={() => setBookingSigModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Sign in the box below using your mouse, stylus, or fingertip.
            </Typography>
            <Box
              sx={{
                border: '2px solid #0284c7',
                borderRadius: 1,
                backgroundColor: '#ffffff',
                display: 'inline-block',
                touchAction: 'none'
              }}
            >
              <SignatureCanvas
                ref={bookingSigRef}
                penColor="black"
                canvasProps={{
                  width: 360,
                  height: 160,
                  className: 'sigCanvas'
                }}
              />
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClearBookingSignature} color="inherit">
              Clear
            </Button>
            <Button onClick={handleSaveBookingSignature} variant="contained" color="primary">
              Save Signature
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Assign Technician */}
        <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Assign Maintenance Work</DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Booking #{selectedBooking?.bookingId}: {selectedBooking?.complaintDetails}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 2, fontWeight: 600 }}>
              Location: {selectedBooking?.building} - {selectedBooking?.floor} ({selectedBooking?.exactLocation})
            </Typography>
            <TextField
              select
              fullWidth
              label="Select Technician"
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value as any)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">-- Select or enter custom below --</MenuItem>
              {safeTechnicians.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.email})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Or Attended By Staff Name"
              placeholder="e.g. Suresh, Rajesh"
              value={customTechName}
              onChange={(e) => setCustomTechName(e.target.value)}
              helperText="Fill technician name to assign"
            />
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAssignSubmit} color="info">
              Assign & Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal: Close Booking */}
        <Dialog open={closeModalOpen} onClose={() => setCloseModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Supervisor Verification & Closure</DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Close Booking #{selectedBooking?.bookingId}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 2 }}>
              Closed ID will be generated automatically: <strong>CL-{selectedBooking?.bookingId}</strong>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              required
              label="Closing Remarks / Verification Notes"
              placeholder="e.g. Tap repaired and verified. No leakages observed."
              value={closingRemarks}
              onChange={(e) => setClosingRemarks(e.target.value)}
            />
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCloseModalOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCloseSubmit}
              color="success"
              disabled={!closingRemarks.trim()}
            >
              Verify & Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Drawer: View Booking Details & Work History */}
        <Drawer
          anchor="right"
          open={detailsDrawerOpen}
          onClose={() => setDetailsDrawerOpen(false)}
          PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3 } }}
        >
          {selectedBooking && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" fontWeight={700}>
                  Booking #{selectedBooking.bookingId}
                </Typography>
                <IconButton onClick={() => setDetailsDrawerOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <StatusBadge status={selectedBooking.status} size="medium" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Reported Date</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString('en-GB') : '-'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Reported By</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedBooking.reportedBy}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Booked By (Admin)</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedBooking.bookedBy || 'Admin'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Location</Typography>
                  <Typography variant="body2" fontWeight={600} textAlign="right">
                    {selectedBooking.building} – {selectedBooking.floor} <br />
                    {selectedBooking.exactLocation} {selectedBooking.room ? `(${selectedBooking.room})` : ''}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Type of Work</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedBooking.typeOfWork || 'General'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Complaint Details
                  </Typography>
                  <Card variant="outlined" sx={{ p: 1.5, backgroundColor: '#f9fafb' }}>
                    <Typography variant="body2">{selectedBooking.complaintDetails}</Typography>
                  </Card>
                </Box>
                {selectedBooking.remarks && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Remarks / Notes
                    </Typography>
                    <Card variant="outlined" sx={{ p: 1.5, backgroundColor: '#f9fafb' }}>
                      <Typography variant="body2">{selectedBooking.remarks}</Typography>
                    </Card>
                  </Box>
                )}
                {selectedBooking.bookedBySignature && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Booking Digital Signature
                    </Typography>
                    <Card variant="outlined" sx={{ p: 1, display: 'inline-block', backgroundColor: '#fff' }}>
                      <img
                        src={selectedBooking.bookedBySignature}
                        alt="Booking Signature"
                        style={{ height: 48, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </Card>
                  </Box>
                )}

                {selectedBooking.closedId && (
                  <Card variant="outlined" sx={{ p: 1.5, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <Typography variant="subtitle2" color="success.main" fontWeight={700}>
                      Closure Record
                    </Typography>
                    <Typography variant="body2">
                      Closed ID: <strong>{selectedBooking.closedId}</strong>
                    </Typography>
                    <Typography variant="caption" display="block">
                      Closed On: {selectedBooking.closedDate ? new Date(selectedBooking.closedDate).toLocaleString() : '-'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Remarks: {selectedBooking.closingRemarks}
                    </Typography>
                  </Card>
                )}

                <Divider sx={{ my: 1 }} />

                {/* Associated Work Progress Records */}
                <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" gap={1}>
                  <HistoryIcon fontSize="small" /> Work Progress Records
                </Typography>

                {(!selectedBooking.workRecords || !Array.isArray(selectedBooking.workRecords) || selectedBooking.workRecords.length === 0) ? (
                  <Typography variant="body2" color="text.secondary">
                    No work records logged yet against this booking.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {selectedBooking.workRecords.map((w, idx) => (
                      <Card key={idx} variant="outlined" sx={{ p: 1.5, backgroundColor: '#f8fafc' }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Update #{idx + 1} - Attended By: {w.attendedBy || (w.technician ? `${w.technician.firstName} ${w.technician.lastName}` : 'Technician')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Start: {w.startingDate ? new Date(w.startingDate).toLocaleDateString() : '-'} | Finish: {w.finishingDate ? new Date(w.finishingDate).toLocaleDateString() : '-'} | Time: {w.timeTaken || '-'}
                        </Typography>
                        {w.workDetails && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Work: {w.workDetails}
                          </Typography>
                        )}
                        {w.pendingReason && (
                          <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.5, fontWeight: 600 }}>
                            Pending Reason: {w.pendingReason}
                          </Typography>
                        )}
                        {w.signature && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">Digital Signature:</Typography>
                            <img src={w.signature} alt="Sign" style={{ height: 40, border: '1px solid #ccc', display: 'block', marginTop: 4 }} />
                          </Box>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          )}
        </Drawer>
      </Box>
    </>
  );
};

export default MaintenanceBookingRegister;
