package com.grash.model.enums;

import java.util.Arrays;
import java.util.List;

public enum BookingStatus {
    PENDING(Arrays.asList("PENDING", "Pending")),
    ASSIGNED(Arrays.asList("ASSIGNED", "Assigned")),
    IN_PROGRESS(Arrays.asList("IN_PROGRESS", "In Progress")),
    COMPLETED(Arrays.asList("COMPLETED", "Completed")),
    CLOSED(Arrays.asList("CLOSED", "Closed"));

    private final List<String> aliases;

    BookingStatus(List<String> aliases) {
        this.aliases = aliases;
    }

    public static BookingStatus fromString(String text) {
        if (text == null || text.trim().isEmpty()) {
            return PENDING;
        }
        for (BookingStatus status : BookingStatus.values()) {
            if (status.name().equalsIgnoreCase(text) ||
                status.aliases.stream().anyMatch(a -> a.equalsIgnoreCase(text))) {
                return status;
            }
        }
        return PENDING;
    }
}
