package com.grash.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.grash.model.abstracts.CompanyAudit;
import com.grash.model.enums.BookingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "maintenance_booking")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"workRecords", "assignedTechnician"})
@ToString(exclude = {"workRecords"})
@Schema(description = "Maintenance booking record representing a complaint or maintenance booking")
public class MaintenanceBooking extends CompanyAudit {

    @NotNull
    @Column(name = "booking_id", nullable = false, unique = true, length = 50)
    @Schema(description = "Unique auto-generated booking number", example = "2100")
    private String bookingId;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "date")
    @Schema(description = "Complaint registration date")
    private Date date;

    @Column(name = "reported_by")
    @Schema(description = "Name of the person reporting the issue", example = "Nandhini")
    private String reportedBy;

    @Column(name = "building")
    @Schema(description = "Building", example = "B1")
    private String building;

    @Column(name = "floor")
    @Schema(description = "Floor", example = "Ground Floor")
    private String floor;

    @Column(name = "room")
    @Schema(description = "Room", example = "Room 101")
    private String room;

    @Column(name = "exact_location", length = 500)
    @Schema(description = "Exact location details", example = "Near washroom")
    private String exactLocation;

    @Column(name = "complaint_details", length = 5000)
    @Schema(description = "Complaint or maintenance details", example = "Ground floor water tap leakage.")
    private String complaintDetails;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    @Schema(description = "Booking status")
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "type_of_work")
    @Schema(description = "Type of work needed or assigned", example = "Plumbing")
    private String typeOfWork;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "company", "superAccountRelations"})
    @Schema(description = "Technician assigned to this booking")
    private User assignedTechnician;

    @Column(name = "closed_id", length = 100)
    @Schema(description = "Reference or closure identification number", example = "CL-2100")
    private String closedId;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "closed_date")
    @Schema(description = "Date when booking was closed")
    private Date closedDate;

    @Column(name = "closing_remarks", length = 2000)
    @Schema(description = "Supervisor closure remarks")
    private String closingRemarks;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "due_date")
    @Schema(description = "Due date for overdue tracking")
    private Date dueDate;

    @Column(name = "booked_by")
    @Schema(description = "Name of the admin or staff who entered the booking", example = "Super Admin")
    private String bookedBy;

    @Column(name = "booked_by_signature", columnDefinition = "TEXT")
    @Schema(description = "Base64 digital signature of the person creating the booking")
    private String bookedBySignature;

    @Column(name = "remarks", length = 2000)
    @Schema(description = "Initial remarks or notes entered during booking")
    private String remarks;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnoreProperties({"booking"})
    private List<MaintenanceWorkRecord> workRecords = new ArrayList<>();
}
