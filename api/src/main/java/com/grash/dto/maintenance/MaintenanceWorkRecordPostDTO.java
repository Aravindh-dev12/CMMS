package com.grash.dto.maintenance;

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
public class MaintenanceWorkRecordPostDTO {
    @Schema(description = "Primary ID of associated booking")
    private Long bookingId;

    @Schema(description = "Booking ID code (e.g. 2100)")
    private String bookingCode;

    @Schema(description = "Type of work", example = "Plumbing")
    private String typeOfWork;

    @Schema(description = "Attended by technician name", example = "Kumar")
    private String attendedBy;

    @Schema(description = "Linked technician user ID")
    private Long technicianUserId;

    @Schema(description = "Work start date and time")
    private Date startingDate;

    @Schema(description = "Work finish date and time")
    private Date finishingDate;

    @Schema(description = "Time taken or completion time", example = "2 hrs")
    private String timeTaken;

    @Schema(description = "Pending reason if incomplete")
    private String pendingReason;

    @Schema(description = "Reference or closure identification number", example = "CL-2100")
    private String closedId;

    @Schema(description = "Work details description")
    private String workDetails;

    @Schema(description = "Base64 digital signature")
    private String signature;

    @Schema(description = "Before photo URL")
    private String beforePhotoUrl;

    @Schema(description = "After photo URL")
    private String afterPhotoUrl;

    @Schema(description = "Optional override for booking status")
    private String bookingStatus;
}
