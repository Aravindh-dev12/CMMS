package com.grash.dto.maintenance;

import com.grash.model.enums.BookingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceBookingPostDTO {
    @Schema(description = "Booking ID code (if omitted, auto-generated)", example = "2100")
    private String bookingId;

    @Schema(description = "Complaint registration date")
    private Date date;

    @Schema(description = "Name of person reporting the issue", example = "Nandhini")
    private String reportedBy;

    @Schema(description = "Building", example = "B1")
    private String building;

    @Schema(description = "Floor", example = "Ground Floor")
    private String floor;

    @Schema(description = "Room", example = "Room 101")
    private String room;

    @Schema(description = "Exact location details", example = "Near washroom")
    private String exactLocation;

    @Schema(description = "Complaint or maintenance details", example = "Ground floor water tap leakage.")
    private String complaintDetails;

    @Schema(description = "Status of the booking")
    private BookingStatus status;

    @Schema(description = "Type of work", example = "Plumbing")
    private String typeOfWork;

    @Schema(description = "User ID of assigned technician")
    private Long assignedTechnicianId;

    @Schema(description = "Closure reference ID", example = "CL-2100")
    private String closedId;

    @Schema(description = "Supervisor closing remarks")
    private String closingRemarks;

    @Schema(description = "Due date")
    private Date dueDate;
}
