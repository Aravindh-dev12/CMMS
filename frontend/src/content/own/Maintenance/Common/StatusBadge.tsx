import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { BookingStatus } from '../../../../models/owns/maintenance';

interface StatusBadgeProps {
  status: BookingStatus | string;
  size?: ChipProps['size'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  let color: ChipProps['color'] = 'default';
  let label = status;

  switch (status) {
    case 'PENDING':
      color = 'warning';
      label = 'Pending';
      break;
    case 'ASSIGNED':
      color = 'info';
      label = 'Assigned';
      break;
    case 'IN_PROGRESS':
      color = 'primary';
      label = 'In Progress';
      break;
    case 'COMPLETED':
      color = 'success';
      label = 'Completed';
      break;
    case 'CLOSED':
      color = 'default';
      label = 'Closed';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      size={size}
      color={color}
      label={label}
      sx={{
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontSize: size === 'small' ? '0.75rem' : '0.85rem'
      }}
    />
  );
};

export default StatusBadge;
