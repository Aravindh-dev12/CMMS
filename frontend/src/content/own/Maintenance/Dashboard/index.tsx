import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddTaskIcon from '@mui/icons-material/AddTask';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { MaintenanceDashboardStats } from '../../../../models/owns/maintenance';
import {
  getMaintenanceDashboardStats,
  seedMaintenanceDemoData
} from '../../../../services/maintenanceService';
import StatusBadge from '../Common/StatusBadge';

const MaintenanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<MaintenanceDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getMaintenanceDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await seedMaintenanceDemoData();
      await loadStats();
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const kpis = [
    {
      title: 'Total Bookings',
      count: stats?.totalBookings ?? 0,
      icon: <AssignmentIcon sx={{ fontSize: 32, color: '#3b82f6' }} />,
      color: '#3b82f6',
      bg: '#eff6ff'
    },
    {
      title: 'Pending Complaints',
      count: stats?.pendingComplaints ?? 0,
      icon: <PendingActionsIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
      color: '#f59e0b',
      bg: '#fffbeb'
    },
    {
      title: 'Assigned Work Orders',
      count: stats?.assignedWorkOrders ?? 0,
      icon: <AssignmentIndIcon sx={{ fontSize: 32, color: '#06b6d4' }} />,
      color: '#06b6d4',
      bg: '#ecfeff'
    },
    {
      title: 'In Progress',
      count: stats?.inProgress ?? 0,
      icon: <BuildIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />,
      color: '#8b5cf6',
      bg: '#f5f3ff'
    },
    {
      title: 'Completed Work',
      count: stats?.completedWork ?? 0,
      icon: <CheckCircleIcon sx={{ fontSize: 32, color: '#10b981' }} />,
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      title: 'Closed Work Orders',
      count: stats?.closedWorkOrders ?? 0,
      icon: <TaskAltIcon sx={{ fontSize: 32, color: '#64748b' }} />,
      color: '#64748b',
      bg: '#f8fafc'
    },
    {
      title: 'Overdue Maintenance',
      count: stats?.overdueMaintenance ?? 0,
      icon: <WarningIcon sx={{ fontSize: 32, color: '#ef4444' }} />,
      color: '#ef4444',
      bg: '#fef2f2'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Maintenance Dashboard</title>
      </Helmet>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header Banner */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Maintenance Dashboard
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Overview of maintenance bookings, active work orders, technician allocation & buildings
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStats}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AddTaskIcon />}
              onClick={handleSeedDemo}
              disabled={seeding}
            >
              {seeding ? 'Seeding...' : 'Load Demo Records'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/app/maintenance-booking-register')}
            >
              Go to Booking Register
            </Button>
          </Stack>
        </Box>

        {/* 7 KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpis.map((kpi, idx) => (
            <Grid item xs={12} sm={6} md={3} lg={1.714} key={idx} sx={{ flexGrow: 1 }}>
              <Card
                sx={{
                  p: 2,
                  borderLeft: `4px solid ${kpi.color}`,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  height: '100%'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                      {kpi.title}
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, color: '#1e293b' }}>
                      {loading ? '...' : kpi.count}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: kpi.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {kpi.icon}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* 14-Day Date Wise Maintenance Trend */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Date-wise Maintenance Activity (Last 14 Days)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Trend of incoming complaint bookings vs completed works
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.dateReport || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="New Bookings"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        name="Completed Works"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Building-wise Maintenance Summary */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Building-wise Complaints
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Complaint count distribution across campus buildings
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress size={32} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.buildingSummary || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Complaints" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Technician Summary & Recent Tables */}
        <Grid container spacing={3}>
          {/* Technician-wise Work Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title={<Typography variant="h4" fontWeight={700}>Technician Work Summary</Typography>}
                subheader="Active technician workload and attended tasks"
              />
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Technician</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Attended Tasks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(!stats?.technicianSummary || stats.technicianSummary.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No technician assignments yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.technicianSummary.map((tech, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{tech.name}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {tech.count}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Recent Bookings Table */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title={<Typography variant="h4" fontWeight={700}>Recent Maintenance Bookings</Typography>}
                action={
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/app/maintenance-booking-register')}
                  >
                    View All
                  </Button>
                }
              />
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reported By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Complaint</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(!stats?.recentBookings || stats.recentBookings.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No recent bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.recentBookings.slice(0, 5).map((b) => (
                        <TableRow key={b.bookingId} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            #{b.bookingId}
                          </TableCell>
                          <TableCell>
                            {b.date ? new Date(b.date).toLocaleDateString('en-GB') : '-'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{b.reportedBy}</TableCell>
                          <TableCell>{b.building} - {b.floor}</TableCell>
                          <TableCell sx={{ maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {b.complaintDetails}
                          </TableCell>
                          <TableCell align="center">
                            <StatusBadge status={b.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Recent Completed Work Table */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={<Typography variant="h4" fontWeight={700}>Recent Completed Work Records</Typography>}
                action={
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/app/maintenance-work-register')}
                  >
                    View All Work Register
                  </Button>
                }
              />
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Booking ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type of Work</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Attended By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Starting Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Finishing Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Time Taken</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Closed ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Work Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(!stats?.recentCompletedWork || stats.recentCompletedWork.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No completed work records recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.recentCompletedWork.slice(0, 5).map((w, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            #{w.bookingCode || w.booking?.bookingId}
                          </TableCell>
                          <TableCell>{w.typeOfWork || '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{w.attendedBy}</TableCell>
                          <TableCell>
                            {w.startingDate ? new Date(w.startingDate).toLocaleDateString('en-GB') : '-'}
                          </TableCell>
                          <TableCell>
                            {w.finishingDate ? new Date(w.finishingDate).toLocaleDateString('en-GB') : '-'}
                          </TableCell>
                          <TableCell>{w.timeTaken || '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                            {w.closedId || '-'}
                          </TableCell>
                          <TableCell>{w.workDetails || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default MaintenanceDashboard;
