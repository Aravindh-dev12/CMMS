import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CreateIcon from '@mui/icons-material/Create';
import SignatureCanvas from 'react-signature-canvas';
import useAuth from '../../../../hooks/useAuth';

import { MaintenanceBooking } from '../../../../models/owns/maintenance';
import {
  getMaintenanceBookings,
  getNextBookingId
} from '../../../../services/maintenanceService';

interface FormRowItem {
  id: string;
  bookingId: string;
  startingDate: string;
  workDetails: string;
  bookingBy: string;
  finishedDate: string;
  signature: string;
}

const MaintenanceWorkOrderForm: React.FC = () => {
  const { user } = useAuth();
  const currentAdminName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Admin';

  const [formNumber, setFormNumber] = useState<string>('2100');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [technicianName, setTechnicianName] = useState<string>('Nandhini');
  const [adminSignerName, setAdminSignerName] = useState<string>(currentAdminName);
  const [availableBookings, setAvailableBookings] = useState<MaintenanceBooking[]>([]);

  const [rows, setRows] = useState<FormRowItem[]>([
    {
      id: 'row-1',
      bookingId: '2100',
      startingDate: '2026-07-01',
      workDetails: 'Ground floor water tap leakage - Replaced ceramic washer and tightened valve',
      bookingBy: 'Nandhini',
      finishedDate: '2026-07-01',
      signature: ''
    },
    {
      id: 'row-2',
      bookingId: '2101',
      startingDate: '2026-07-01',
      workDetails: 'Water tap broken - Installed new brass bib cock tap',
      bookingBy: 'Chandramohan',
      finishedDate: '2026-07-01',
      signature: ''
    }
  ]);

  // Row signature modal state
  const [activeSignRowIndex, setActiveSignRowIndex] = useState<number | null>(null);
  const [signModalOpen, setSignModalOpen] = useState<boolean>(false);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);

  // Bottom dual signatures state
  const [techSignature, setTechSignature] = useState<string>('');
  const [adminSignature, setAdminSignature] = useState<string>('');
  const [bottomSignTarget, setBottomSignTarget] = useState<'tech' | 'admin' | null>(null);
  const [bottomSignModalOpen, setBottomSignModalOpen] = useState<boolean>(false);
  const bottomSigCanvasRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [nextCodeRes, bookingsRes] = await Promise.all([
          getNextBookingId(),
          getMaintenanceBookings()
        ]);
        if (nextCodeRes?.nextBookingId) {
          setFormNumber(nextCodeRes.nextBookingId);
        }
        const list = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes as any)?.content || [];
        setAvailableBookings(list);
      } catch (err) {
        console.error(err);
        setAvailableBookings([]);
      }
    };
    init();
  }, []);

  const handleAddRow = () => {
    const newRow: FormRowItem = {
      id: `row-${Date.now()}`,
      bookingId: '',
      startingDate: new Date().toISOString().substring(0, 10),
      workDetails: '',
      bookingBy: '',
      finishedDate: '',
      signature: ''
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof FormRowItem, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleSelectBooking = (index: number, bCode: string) => {
    const safeList = Array.isArray(availableBookings) ? availableBookings : [];
    const booking = safeList.find((b) => b.bookingId === bCode);
    const updated = [...rows];
    if (booking) {
      const displayBookingBy = booking.bookedBy
        ? `${booking.bookedBy} (Rep: ${booking.reportedBy})`
        : (booking.reportedBy || '');

      updated[index] = {
        ...updated[index],
        bookingId: booking.bookingId,
        startingDate: booking.date ? booking.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
        bookingBy: displayBookingBy,
        workDetails: booking.complaintDetails || '',
        finishedDate: booking.closedDate ? booking.closedDate.substring(0, 10) : '',
        signature: booking.bookedBySignature || updated[index].signature || ''
      };

      if (booking.bookedBySignature && !adminSignature) {
        setAdminSignature(booking.bookedBySignature);
      }
      if (booking.bookedBy && (!adminSignerName || adminSignerName === 'Admin')) {
        setAdminSignerName(booking.bookedBy);
      }
    } else {
      updated[index] = { ...updated[index], bookingId: bCode };
    }
    setRows(updated);
  };

  const handleOpenBottomSignature = (target: 'tech' | 'admin') => {
    setBottomSignTarget(target);
    setBottomSignModalOpen(true);
  };

  const handleSaveBottomSignature = () => {
    if (bottomSigCanvasRef.current && !bottomSigCanvasRef.current.isEmpty()) {
      const dataUrl = bottomSigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      if (bottomSignTarget === 'tech') {
        setTechSignature(dataUrl);
      } else if (bottomSignTarget === 'admin') {
        setAdminSignature(dataUrl);
      }
      setBottomSignModalOpen(false);
      setBottomSignTarget(null);
    }
  };

  const handleClearBottomSignature = () => {
    if (bottomSigCanvasRef.current) {
      bottomSigCanvasRef.current.clear();
    }
  };

  const handleOpenSignature = (rowIndex: number) => {
    setActiveSignRowIndex(rowIndex);
    setSignModalOpen(true);
  };

  const handleSaveSignature = () => {
    if (sigCanvasRef.current && activeSignRowIndex !== null && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      const updated = [...rows];
      updated[activeSignRowIndex].signature = dataUrl;
      setRows(updated);
      setSignModalOpen(false);
      setActiveSignRowIndex(null);
    }
  };

  const handleClearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Maintenance Work Order Form</title>
      </Helmet>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Action Controls (Hidden when printing) */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          sx={{ '@media print': { display: 'none' } }}
        >
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Maintenance Work Order Form
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Printable paper-form reproduction with digital signature capture and auto-fill
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
            >
              Add Form Row
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print / Save as PDF
            </Button>
          </Stack>
        </Box>

        {/* Form Container with Paper Styling */}
        <Card
          sx={{
            p: { xs: 2, sm: 4 },
            maxWidth: 1000,
            mx: 'auto',
            border: '2px solid #334155',
            borderRadius: 1,
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            '@media print': {
              border: '2px solid #000',
              boxShadow: 'none',
              maxWidth: '100%',
              p: 1
            }
          }}
        >
          {/* Header Block */}
          <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '2px solid #334155' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                letterSpacing: 2,
                fontSize: { xs: '1.4rem', sm: '1.8rem' },
                textTransform: 'uppercase',
                color: '#0f172a'
              }}
            >
              MAINTENANCE WORK
            </Typography>

            <Box
              sx={{
                display: 'inline-block',
                mt: 1,
                px: 2,
                py: 0.5,
                border: '1px solid #64748b',
                borderRadius: 1,
                backgroundColor: '#f1f5f9'
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                Form No: {formNumber}
              </Typography>
            </Box>
          </Box>

          {/* Form Meta Fields */}
          <Box sx={{ py: 2, px: 1 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 60 }}>
                    Date:
                  </Typography>
                  <TextField
                    type="date"
                    size="small"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    sx={{
                      '& .MuiInputBase-root': { fontSize: '0.95rem', fontWeight: 600 },
                      '@media print': {
                        '& fieldset': { border: 'none' }
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ minWidth: 60 }}>
                    Name:
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Technician or staff name"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    sx={{
                      '& .MuiInputBase-root': { fontSize: '0.95rem', fontWeight: 600 },
                      '@media print': {
                        '& fieldset': { border: 'none' }
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Printable Register Table */}
          <TableContainer sx={{ border: '2px solid #334155', mt: 1 }}>
            <Table
              sx={{
                '& th': {
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRight: '1px solid #334155',
                  borderBottom: '2px solid #334155',
                  textAlign: 'center',
                  p: 1.2
                },
                '& td': {
                  borderRight: '1px solid #334155',
                  borderBottom: '1px solid #334155',
                  p: 1,
                  fontSize: '0.85rem'
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell width="6%">S.No</TableCell>
                  <TableCell width="14%">Booking ID</TableCell>
                  <TableCell width="15%">Starting Date</TableCell>
                  <TableCell width="28%">Work Details</TableCell>
                  <TableCell width="15%">Booking By</TableCell>
                  <TableCell width="14%">Finished Date</TableCell>
                  <TableCell width="14%">Sign</TableCell>
                  <TableCell width="4%" sx={{ '@media print': { display: 'none' } }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    {/* S.No */}
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      {index + 1}
                    </TableCell>

                    {/* Booking ID */}
                    <TableCell>
                      <TextField
                        size="small"
                        select
                        fullWidth
                        value={row.bookingId}
                        onChange={(e) => handleSelectBooking(index, e.target.value)}
                        sx={{
                          '& .MuiInputBase-root': { fontSize: '0.85rem', fontWeight: 700 },
                          '@media print': { '& fieldset': { border: 'none' } }
                        }}
                      >
                        <MenuItem value="">-- Select --</MenuItem>
                        {(Array.isArray(availableBookings) ? availableBookings : []).map((b) => (
                          <MenuItem key={b.bookingId} value={b.bookingId}>
                            #{b.bookingId}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    {/* Starting Date */}
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        fullWidth
                        value={row.startingDate}
                        onChange={(e) => handleRowChange(index, 'startingDate', e.target.value)}
                        sx={{
                          '& .MuiInputBase-root': { fontSize: '0.82rem' },
                          '@media print': { '& fieldset': { border: 'none' } }
                        }}
                      />
                    </TableCell>

                    {/* Work Details */}
                    <TableCell>
                      <TextField
                        multiline
                        maxRows={3}
                        size="small"
                        fullWidth
                        placeholder="Enter work details"
                        value={row.workDetails}
                        onChange={(e) => handleRowChange(index, 'workDetails', e.target.value)}
                        sx={{
                          '& .MuiInputBase-root': { fontSize: '0.82rem' },
                          '@media print': { '& fieldset': { border: 'none' } }
                        }}
                      />
                    </TableCell>

                    {/* Booking By */}
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Reported By"
                        value={row.bookingBy}
                        onChange={(e) => handleRowChange(index, 'bookingBy', e.target.value)}
                        sx={{
                          '& .MuiInputBase-root': { fontSize: '0.82rem', fontWeight: 600 },
                          '@media print': { '& fieldset': { border: 'none' } }
                        }}
                      />
                    </TableCell>

                    {/* Finished Date */}
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        fullWidth
                        value={row.finishedDate}
                        onChange={(e) => handleRowChange(index, 'finishedDate', e.target.value)}
                        sx={{
                          '& .MuiInputBase-root': { fontSize: '0.82rem' },
                          '@media print': { '& fieldset': { border: 'none' } }
                        }}
                      />
                    </TableCell>

                    {/* Sign */}
                    <TableCell align="center">
                      {row.signature ? (
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <img
                            src={row.signature}
                            alt="Sign"
                            style={{ height: 32, maxWidth: '100%', objectFit: 'contain' }}
                          />
                          <Button
                            size="small"
                            sx={{ fontSize: '0.65rem', p: 0, '@media print': { display: 'none' } }}
                            onClick={() => handleOpenSignature(index)}
                          >
                            Edit Sign
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CreateIcon fontSize="small" />}
                          onClick={() => handleOpenSignature(index)}
                          sx={{ fontSize: '0.72rem', py: 0.5, '@media print': { display: 'none' } }}
                        >
                          Sign
                        </Button>
                      )}
                    </TableCell>

                    {/* Delete action */}
                    <TableCell align="center" sx={{ '@media print': { display: 'none' } }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRow(index)}
                        disabled={rows.length <= 1}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Dual Official Signatures Section */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '2px solid #334155' }}>
            <Grid container spacing={3} justifyContent="space-between">
              {/* Technician Signature */}
              <Grid item xs={12} sm={5.5}>
                <Box
                  sx={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>
                    Technician Signature
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Attended By: <strong>{technicianName || 'Technician'}</strong>
                  </Typography>
                  <Box
                    sx={{
                      height: 65,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    {techSignature ? (
                      <img
                        src={techSignature}
                        alt="Tech Sign"
                        style={{ maxHeight: 58, maxWidth: '90%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        (Technician sign pad)
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ '@media print': { display: 'none' } }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CreateIcon fontSize="small" />}
                      onClick={() => handleOpenBottomSignature('tech')}
                    >
                      {techSignature ? 'Re-sign' : 'Sign as Technician'}
                    </Button>
                    {techSignature && (
                      <Button
                        size="small"
                        color="error"
                        sx={{ ml: 1 }}
                        onClick={() => setTechSignature('')}
                      >
                        Clear
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Supervisor / Admin (Booked By) Signature */}
              <Grid item xs={12} sm={5.5}>
                <Box
                  sx={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="#0f172a" gutterBottom>
                    Supervisor / Booked By Admin Signature
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Verified By:</Typography>
                    <TextField
                      size="small"
                      variant="standard"
                      value={adminSignerName}
                      onChange={(e) => setAdminSignerName(e.target.value)}
                      placeholder="Admin / Supervisor"
                      sx={{
                        '& input': { fontSize: '0.8rem', fontWeight: 700, p: 0, textAlign: 'center' },
                        maxWidth: 150
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      height: 65,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    {adminSignature ? (
                      <img
                        src={adminSignature}
                        alt="Admin Sign"
                        style={{ maxHeight: 58, maxWidth: '90%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        (Admin / Supervisor sign pad)
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ '@media print': { display: 'none' } }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CreateIcon fontSize="small" />}
                      onClick={() => handleOpenBottomSignature('admin')}
                    >
                      {adminSignature ? 'Re-sign' : 'Sign as Admin'}
                    </Button>
                    {adminSignature && (
                      <Button
                        size="small"
                        color="error"
                        sx={{ ml: 1 }}
                        onClick={() => setAdminSignature('')}
                      >
                        Clear
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Form Footer Note */}
          <Box sx={{ mt: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Verified by Maintenance Supervisor | Document Reference: MW-{formNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Maintenance Management System
            </Typography>
          </Box>
        </Card>

        {/* Row Signature Dialog */}
        <Dialog open={signModalOpen} onClose={() => setSignModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Capture Digital Signature</DialogTitle>
          <Divider />
          <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Please sign inside the box below
            </Typography>
            <Box
              sx={{
                border: '2px solid #334155',
                borderRadius: 1,
                display: 'inline-block',
                backgroundColor: '#ffffff'
              }}
            >
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{ width: 340, height: 140, className: 'dialogSigCanvas' }}
              />
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClearSignature} color="inherit">
              Clear
            </Button>
            <Button onClick={() => setSignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSignature} variant="contained" color="primary">
              Accept Signature
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bottom Signature Dialog (Tech or Admin) */}
        <Dialog
          open={bottomSignModalOpen}
          onClose={() => setBottomSignModalOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            {bottomSignTarget === 'tech'
              ? 'Technician Digital Signature'
              : 'Supervisor / Booked By Admin Digital Signature'}
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Sign below as{' '}
              <strong>
                {bottomSignTarget === 'tech'
                  ? technicianName || 'Technician'
                  : adminSignerName || 'Admin / Supervisor'}
              </strong>
            </Typography>
            <Box
              sx={{
                border: '2px solid #334155',
                borderRadius: 1,
                display: 'inline-block',
                backgroundColor: '#ffffff',
                touchAction: 'none'
              }}
            >
              <SignatureCanvas
                ref={bottomSigCanvasRef}
                canvasProps={{ width: 340, height: 140, className: 'dialogSigCanvas' }}
              />
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClearBottomSignature} color="inherit">
              Clear
            </Button>
            <Button onClick={() => setBottomSignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBottomSignature} variant="contained" color="primary">
              Accept Signature
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default MaintenanceWorkOrderForm;
