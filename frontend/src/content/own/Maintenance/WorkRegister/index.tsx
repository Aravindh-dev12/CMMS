import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  Typography
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import SignatureCanvas from 'react-signature-canvas';

import {
  BookingStatus,
  MaintenanceBooking,
  MaintenanceWorkRecord,
  MaintenanceWorkRecordPostDTO
} from '../../../../models/owns/maintenance';
import {
  createMaintenanceWorkRecord,
  exportWorkRecordsToExcel,
  getMaintenanceBookings,
  getMaintenanceWorkRecords
} from '../../../../services/maintenanceService';

const workTypes = ['Plumbing', 'Electrical', 'HVAC / AC', 'Carpentry', 'Civil / Masonry', 'Painting', 'Appliance', 'General'];

const MaintenanceWorkRegister: React.FC = () => {
  const [workRecords, setWorkRecords] = useState<MaintenanceWorkRecord[]>([]);
  const [bookings, setBookings] = useState<MaintenanceBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [attendedByFilter, setAttendedByFilter] = useState<string>('');

  // Modal: Record Work
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedBookingForWork, setSelectedBookingForWork] = useState<MaintenanceBooking | null>(null);
  const [workFormData, setWorkFormData] = useState<{
    bookingId: number | '';
    typeOfWork: string;
    attendedBy: string;
    startingDate: string;
    finishingDate: string;
    timeTaken: string;
    workDetails: string;
    pendingReason: string;
    statusUpdate: BookingStatus;
  }>({
    bookingId: '',
    typeOfWork: 'Plumbing',
    attendedBy: '',
    startingDate: new Date().toISOString().substring(0, 10),
    finishingDate: '',
    timeTaken: '',
    workDetails: '',
    pendingReason: '',
    statusUpdate: 'IN_PROGRESS'
  });

  const [signatureImage, setSignatureImage] = useState<string>('');
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const sigPadRef = useRef<SignatureCanvas | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, allBookings] = await Promise.all([
        getMaintenanceWorkRecords(),
        getMaintenanceBookings()
      ]);
      setWorkRecords(records || []);
      setBookings(allBookings || []);
    } catch (err) {
      console.error('Failed to load maintenance work records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRecordWork = (preselectedBooking?: MaintenanceBooking) => {
    const booking = preselectedBooking || (bookings.length > 0 ? bookings[0] : null);
    setSelectedBookingForWork(booking);
    setWorkFormData({
      bookingId: booking?.id || '',
      typeOfWork: booking?.typeOfWork || 'Plumbing',
      attendedBy: booking?.assignedTechnician ? `${booking.assignedTechnician.firstName} ${booking.assignedTechnician.lastName}` : '',
      startingDate: new Date().toISOString().substring(0, 10),
      finishingDate: '',
      timeTaken: '',
      workDetails: '',
      pendingReason: '',
      statusUpdate: 'IN_PROGRESS'
    });
    setSignatureImage('');
    setShowSignaturePad(false);
    setErrorMessage('');
    setOpenModal(true);
  };

  const handleBookingChange = (bId: number) => {
    const found = bookings.find((b) => b.id === bId) || null;
    setSelectedBookingForWork(found);
    setWorkFormData((prev) => ({
      ...prev,
      bookingId: bId,
      typeOfWork: found?.typeOfWork || prev.typeOfWork,
      attendedBy: found?.assignedTechnician ? `${found.assignedTechnician.firstName} ${found.assignedTechnician.lastName}` : prev.attendedBy
    }));
  };

  const handleSaveSignature = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      setSignatureImage(sigPadRef.current.getTrimmedCanvas().toDataURL('image/png'));
      setShowSignaturePad(false);
    }
  };

  const handleClearSignature = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  const handleSaveWorkRecord = async () => {
    if (!workFormData.bookingId || !workFormData.attendedBy) {
      setErrorMessage('Please select a Booking ID and enter Attended By staff name.');
      return;
    }

    try {
      const dto: MaintenanceWorkRecordPostDTO = {
        bookingId: Number(workFormData.bookingId),
        typeOfWork: workFormData.typeOfWork,
        attendedBy: workFormData.attendedBy,
        startingDate: workFormData.startingDate ? new Date(workFormData.startingDate).toISOString() : undefined,
        finishingDate: workFormData.finishingDate ? new Date(workFormData.finishingDate).toISOString() : undefined,
        timeTaken: workFormData.timeTaken,
        workDetails: workFormData.workDetails,
        pendingReason: workFormData.pendingReason,
        statusUpdate: workFormData.statusUpdate,
        signature: signatureImage || undefined
      };

      await createMaintenanceWorkRecord(dto);
      setOpenModal(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving work record');
    }
  };

  const filteredRecords = workRecords.filter((r) => {
    const code = (r.bookingCode || r.booking?.bookingId || '').toLowerCase();
    const attended = (r.attendedBy || '').toLowerCase();
    const details = (r.workDetails || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = !search || code.includes(q) || attended.includes(q) || details.includes(q);
    const matchesType = typeFilter === 'ALL' || r.typeOfWork === typeFilter;
    const matchesAttended = !attendedByFilter || attended.includes(attendedByFilter.toLowerCase());

    return matchesSearch && matchesType && matchesAttended;
  });

  const handleExportExcel = () => {
    exportWorkRecordsToExcel(filteredRecords, 'Maintenance_Work_Register.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Maintenance Work Register</title>
      </Helmet>

      <Box sx={{ p: { xs: 2, md: 3 } }} className="maintenance-work-register-page">
        {/* Header */}
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
              Maintenance Work Register
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Record and track maintenance work executed against complaints and bookings
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
              onClick={() => handleOpenRecordWork()}
              size="medium"
              color="primary"
            >
              Record Maintenance Work
            </Button>
          </Stack>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3, p: 2, '@media print': { display: 'none' } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search Booking ID / Staff / Work Details"
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
            <Grid item xs={6} sm={3} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Type of Work"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                {workTypes.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Attended By (Staff)"
                placeholder="Filter by staff name"
                value={attendedByFilter}
                onChange={(e) => setAttendedByFilter(e.target.value)}
              />
            </Grid>
          </Grid>
        </Card>

        {/* Print Header */}
        <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 2, textAlign: 'center' } }}>
          <Typography variant="h4" fontWeight={800}>
            MAINTENANCE WORK REGISTER
          </Typography>
          <Typography variant="body2">
            Generated on: {new Date().toLocaleString()} | Total Work Entries: {filteredRecords.length}
          </Typography>
        </Box>

        {/* Table */}
        <Card sx={{ border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <TableContainer>
            <Table
              sx={{
                minWidth: 1000,
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
                  <TableCell width="60" align="center">S.No</TableCell>
                  <TableCell width="110">Booking ID</TableCell>
                  <TableCell width="130">Type of Work</TableCell>
                  <TableCell width="140">Attended By</TableCell>
                  <TableCell width="110">Starting Date</TableCell>
                  <TableCell width="110">Finishing Date</TableCell>
                  <TableCell width="90">Time</TableCell>
                  <TableCell width="180">Pending Reason</TableCell>
                  <TableCell width="110">Closed ID</TableCell>
                  <TableCell>Work Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={36} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading Maintenance Work Records...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                        No Work Records Found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        Click "Record Maintenance Work" to log technician updates.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((r, index) => {
                      const serialNo = page * rowsPerPage + index + 1;
                      const bookingCode = r.bookingCode || r.booking?.bookingId || '-';
                      const startFormatted = r.startingDate ? new Date(r.startingDate).toLocaleDateString('en-GB') : '-';
                      const finishFormatted = r.finishingDate ? new Date(r.finishingDate).toLocaleDateString('en-GB') : '-';
                      const attendedName = r.attendedBy || (r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : '-');

                      return (
                        <TableRow key={r.id || index} hover>
                          <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {serialNo}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            #{bookingCode}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{r.typeOfWork || '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{attendedName}</TableCell>
                          <TableCell>{startFormatted}</TableCell>
                          <TableCell>{finishFormatted}</TableCell>
                          <TableCell>{r.timeTaken || '-'}</TableCell>
                          <TableCell sx={{ color: r.pendingReason ? 'warning.main' : 'text.disabled' }}>
                            {r.pendingReason || '-'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: r.closedId ? 'success.main' : 'text.disabled' }}>
                            {r.closedId || '-'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{r.workDetails || '-'}</Typography>
                            {r.signature && (
                              <Box sx={{ mt: 0.5 }}>
                                <img
                                  src={r.signature}
                                  alt="Sign"
                                  style={{ height: 28, border: '1px solid #e0e0e0', borderRadius: 2 }}
                                />
                              </Box>
                            )}
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
            count={filteredRecords.length}
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

        {/* Modal: Record Maintenance Work */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Record Maintenance Work
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Log work progress, time taken, pending reasons and technician sign against booking
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenModal(false)} size="small">
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
              {/* Booking Selection */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Select Booking ID"
                  value={workFormData.bookingId}
                  onChange={(e) => handleBookingChange(Number(e.target.value))}
                  helperText="Choose booking to record work against"
                >
                  {bookings.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      #{b.bookingId} - {b.reportedBy} ({b.building} - {b.floor})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Type of Work"
                  value={workFormData.typeOfWork}
                  onChange={(e) => setWorkFormData({ ...workFormData, typeOfWork: e.target.value })}
                >
                  {workTypes.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Auto-retrieved Complaint & Location Info Card */}
              {selectedBookingForWork && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">Reported By</Typography>
                        <Typography variant="body2" fontWeight={600}>{selectedBookingForWork.reportedBy}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">Location Details</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedBookingForWork.building} – {selectedBookingForWork.floor} ({selectedBookingForWork.exactLocation})
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">Current Status</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {selectedBookingForWork.status}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Complaint Details</Typography>
                        <Typography variant="body2">{selectedBookingForWork.complaintDetails}</Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Attended By (Technician Name)"
                  placeholder="e.g. Rajesh, Suresh"
                  value={workFormData.attendedBy}
                  onChange={(e) => setWorkFormData({ ...workFormData, attendedBy: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  type="date"
                  fullWidth
                  label="Starting Date"
                  value={workFormData.startingDate}
                  onChange={(e) => setWorkFormData({ ...workFormData, startingDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  type="date"
                  fullWidth
                  label="Finishing Date"
                  value={workFormData.finishingDate}
                  onChange={(e) => setWorkFormData({ ...workFormData, finishingDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Time Taken / Duration"
                  placeholder="e.g. 1.5 hrs, 45 mins"
                  value={workFormData.timeTaken}
                  onChange={(e) => setWorkFormData({ ...workFormData, timeTaken: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Update Booking Status To"
                  value={workFormData.statusUpdate}
                  onChange={(e) => setWorkFormData({ ...workFormData, statusUpdate: e.target.value as BookingStatus })}
                >
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS (Work continuing / pending)</MenuItem>
                  <MenuItem value="COMPLETED">COMPLETED (Work finished)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Work Details / Actions Taken"
                  placeholder="Describe repair actions, parts replaced, etc."
                  value={workFormData.workDetails}
                  onChange={(e) => setWorkFormData({ ...workFormData, workDetails: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Pending Reason (If incomplete / parts awaited)"
                  placeholder="e.g. Spare valve required from store. Delivery tomorrow."
                  value={workFormData.pendingReason}
                  onChange={(e) => setWorkFormData({ ...workFormData, pendingReason: e.target.value })}
                  helperText="Fill if work could not be finished completely today"
                />
              </Grid>

              {/* Digital Signature */}
              <Grid item xs={12}>
                <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 2, backgroundColor: '#f8fafc' }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Technician Digital Signature
                  </Typography>

                  {signatureImage ? (
                    <Box display="flex" alignItems="center" gap={2}>
                      <img
                        src={signatureImage}
                        alt="Signature"
                        style={{ height: 60, border: '1px solid #94a3b8', background: '#fff', borderRadius: 4 }}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setSignatureImage('');
                          setShowSignaturePad(true);
                        }}
                      >
                        Clear & Re-sign
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowSignaturePad(!showSignaturePad)}
                        sx={{ mb: 1 }}
                      >
                        {showSignaturePad ? 'Hide Signature Pad' : 'Sign Digitally'}
                      </Button>

                      {showSignaturePad && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ border: '1px solid #94a3b8', borderRadius: 1, backgroundColor: '#fff', width: 340, height: 120 }}>
                            <SignatureCanvas
                              ref={sigPadRef}
                              canvasProps={{ width: 340, height: 120, className: 'sigCanvas' }}
                            />
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Button size="small" variant="contained" onClick={handleSaveSignature}>
                              Accept Signature
                            </Button>
                            <Button size="small" color="inherit" onClick={handleClearSignature}>
                              Clear
                            </Button>
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleSaveWorkRecord} variant="contained" color="primary">
              Save Work Record
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default MaintenanceWorkRegister;
