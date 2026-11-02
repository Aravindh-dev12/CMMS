package com.grash.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.grash.model.abstracts.CompanyAudit;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Table(name = "maintenance_work_record")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"booking", "technicianUser"})
@ToString(exclude = {"booking"})
@Schema(description = "Work record entry tracking maintenance work against a booking")
public class MaintenanceWorkRecord extends CompanyAudit {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id_ref", nullable = false)
    @JsonIgnoreProperties({"workRecords", "hibernateLazyInitializer", "handler"})
    @Schema(description = "Associated booking")
    private MaintenanceBooking booking;

    @Column(name = "booking_code", length = 50)
    @Schema(description = "Booking ID code for direct lookup", example = "2100")
    private String bookingCode;

    @Column(name = "type_of_work")
    @Schema(description = "Type of work performed", example = "Plumbing")
    private String typeOfWork;

    @Column(name = "attended_by")
    @Schema(description = "Technician or maintenance staff name who attended", example = "Kumar")
    private String attendedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "company", "superAccountRelations"})
    @Schema(description = "Linked technician user account")
    private User technicianUser;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "starting_date")
    @Schema(description = "Work start date and time")
    private Date startingDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "finishing_date")
    @Schema(description = "Work finish date and time")
    private Date finishingDate;

    @Column(name = "time_taken", length = 100)
    @Schema(description = "Time taken or completion time", example = "2 hrs")
    private String timeTaken;

    @Column(name = "pending_reason", length = 2000)
    @Schema(description = "Reason for incomplete/pending work", example = "Spare part awaiting arrival")
    private String pendingReason;

    @Column(name = "closed_id", length = 100)
    @Schema(description = "Reference or closure identification number", example = "CL-2100")
    private String closedId;

    @Column(name = "work_details", length = 5000)
    @Schema(description = "Detailed description of work performed")
    private String workDetails;

    @Column(name = "signature", columnDefinition = "TEXT")
    @Schema(description = "Digital technician signature (base64 image or data URL)")
    private String signature;

    @Column(name = "before_photo_url", length = 1000)
    @Schema(description = "Before photo URL")
    private String beforePhotoUrl;

    @Column(name = "after_photo_url", length = 1000)
    @Schema(description = "After photo URL")
    private String afterPhotoUrl;
}
