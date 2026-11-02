package com.grash.dto.maintenance;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloseBookingRequest {
    @Schema(description = "Closure reference number", example = "CL-2100")
    private String closedId;

    @Schema(description = "Closing remarks / supervisor notes")
    private String closingRemarks;
}
