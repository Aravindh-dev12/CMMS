package com.grash.dto.maintenance;

import com.grash.model.MaintenanceBooking;
import com.grash.model.MaintenanceWorkRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceDashboardStatsDTO {
    private long totalBookings;
    private long pendingComplaints;
    private long assignedWorkOrders;
    private long inProgress;
    private long completedWork;
    private long closedWorkOrders;
    private long overdueMaintenance;

    @Builder.Default
    private List<MaintenanceBooking> recentBookings = new ArrayList<>();

    @Builder.Default
    private List<MaintenanceWorkRecord> recentCompletedWork = new ArrayList<>();

    @Builder.Default
    private List<NameCountDTO> technicianSummary = new ArrayList<>();

    @Builder.Default
    private List<NameCountDTO> buildingSummary = new ArrayList<>();

    @Builder.Default
    private List<DateCountDTO> dateReport = new ArrayList<>();
}
