package com.grash.controller;

import com.grash.dto.SuccessResponse;
import com.grash.dto.maintenance.*;
import com.grash.model.MaintenanceBooking;
import com.grash.model.MaintenanceWorkRecord;
import com.grash.model.User;
import com.grash.service.MaintenanceRegisterService;
import com.grash.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/maintenance")
@Tag(name = "Maintenance Registers", description = "Operations for Maintenance Booking Register, Work Register, and Work Orders")
@RequiredArgsConstructor
public class MaintenanceRegisterController {

    private final MaintenanceRegisterService maintenanceRegisterService;
    private final UserService userService;

    @GetMapping("/bookings")
    @Operation(summary = "Get list of maintenance bookings with search and filters")
    public ResponseEntity<Page<MaintenanceBooking>> getBookings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) String floor,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            HttpServletRequest req) {

        User user = userService.whoami(req);
        // Ensure sample data is available for demonstration
        maintenanceRegisterService.seedInitialDataIfEmpty(user.getCompany(), user);

        Sort sort = Sort.by(sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<MaintenanceBooking> bookings = maintenanceRegisterService.getBookings(
                search, building, floor, status, technicianId, startDate, endDate, pageable, user);

        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/bookings/{id}")
    @Operation(summary = "Get booking by ID")
    public ResponseEntity<MaintenanceBooking> getBookingById(@PathVariable Long id, HttpServletRequest req) {
        User user = userService.whoami(req);
        return ResponseEntity.ok(maintenanceRegisterService.getBookingById(id, user));
    }

    @GetMapping("/bookings/by-code/{bookingId}")
    @Operation(summary = "Get booking by Booking ID code")
    public ResponseEntity<MaintenanceBooking> getBookingByCode(@PathVariable String bookingId, HttpServletRequest req) {
        User user = userService.whoami(req);
        return ResponseEntity.ok(maintenanceRegisterService.getBookingByBookingId(bookingId, user));
    }

    @GetMapping("/bookings/next-id")
    @Operation(summary = "Get auto-generated next Booking ID")
    public ResponseEntity<Map<String, String>> getNextBookingId(HttpServletRequest req) {
        User user = userService.whoami(req);
        String nextId = maintenanceRegisterService.generateNextBookingId(user.getCompany().getId());
        Map<String, String> response = new HashMap<>();
        response.put("nextBookingId", nextId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bookings")
    @Operation(summary = "Create a new maintenance booking")
    public ResponseEntity<MaintenanceBooking> createBooking(
            @Valid @RequestBody MaintenanceBookingPostDTO dto, HttpServletRequest req) {
        User user = userService.whoami(req);
        MaintenanceBooking created = maintenanceRegisterService.createBooking(dto, user);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PatchMapping("/bookings/{id}")
    @Operation(summary = "Update an existing maintenance booking")
    public ResponseEntity<MaintenanceBooking> updateBooking(
            @PathVariable Long id,
            @RequestBody MaintenanceBookingPostDTO dto,
            HttpServletRequest req) {
        User user = userService.whoami(req);
        MaintenanceBooking updated = maintenanceRegisterService.updateBooking(id, dto, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/bookings/{id}")
    @Operation(summary = "Delete a maintenance booking")
    public ResponseEntity<SuccessResponse> deleteBooking(@PathVariable Long id, HttpServletRequest req) {
        User user = userService.whoami(req);
        maintenanceRegisterService.deleteBooking(id, user);
        return ResponseEntity.ok(new SuccessResponse(true, "Booking deleted successfully"));
    }

    @PostMapping("/bookings/{id}/close")
    @Operation(summary = "Supervisor verify and close maintenance booking")
    public ResponseEntity<MaintenanceBooking> closeBooking(
            @PathVariable Long id,
            @RequestBody CloseBookingRequest request,
            HttpServletRequest req) {
        User user = userService.whoami(req);
        MaintenanceBooking closed = maintenanceRegisterService.closeBooking(id, request, user);
        return ResponseEntity.ok(closed);
    }

    @GetMapping("/work-records")
    @Operation(summary = "Get list of maintenance work records with filters")
    public ResponseEntity<Page<MaintenanceWorkRecord>> getWorkRecords(
            @RequestParam(required = false) String bookingCode,
            @RequestParam(required = false) String attendedBy,
            @RequestParam(required = false) String typeOfWork,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            HttpServletRequest req) {

        User user = userService.whoami(req);
        maintenanceRegisterService.seedInitialDataIfEmpty(user.getCompany(), user);

        Sort sort = Sort.by(sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<MaintenanceWorkRecord> records = maintenanceRegisterService.getWorkRecords(
                bookingCode, attendedBy, typeOfWork, startDate, endDate, pageable, user);

        return ResponseEntity.ok(records);
    }

    @GetMapping("/work-records/booking/{bookingId}")
    @Operation(summary = "Get work history for a specific booking")
    public ResponseEntity<List<MaintenanceWorkRecord>> getWorkHistory(@PathVariable Long bookingId, HttpServletRequest req) {
        User user = userService.whoami(req);
        return ResponseEntity.ok(maintenanceRegisterService.getWorkHistoryForBooking(bookingId, user));
    }

    @PostMapping("/work-records")
    @Operation(summary = "Record work against an existing maintenance booking")
    public ResponseEntity<MaintenanceWorkRecord> createWorkRecord(
            @Valid @RequestBody MaintenanceWorkRecordPostDTO dto, HttpServletRequest req) {
        User user = userService.whoami(req);
        MaintenanceWorkRecord created = maintenanceRegisterService.createWorkRecord(dto, user);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PatchMapping("/work-records/{id}")
    @Operation(summary = "Update an existing maintenance work record")
    public ResponseEntity<MaintenanceWorkRecord> updateWorkRecord(
            @PathVariable Long id,
            @RequestBody MaintenanceWorkRecordPostDTO dto,
            HttpServletRequest req) {
        User user = userService.whoami(req);
        MaintenanceWorkRecord updated = maintenanceRegisterService.updateWorkRecord(id, dto, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/work-records/{id}")
    @Operation(summary = "Delete a maintenance work record")
    public ResponseEntity<SuccessResponse> deleteWorkRecord(@PathVariable Long id, HttpServletRequest req) {
        User user = userService.whoami(req);
        maintenanceRegisterService.deleteWorkRecord(id, user);
        return ResponseEntity.ok(new SuccessResponse(true, "Work record deleted successfully"));
    }

    @GetMapping("/dashboard-stats")
    @Operation(summary = "Get maintenance dashboard KPI metrics, summaries, and trends")
    public ResponseEntity<MaintenanceDashboardStatsDTO> getDashboardStats(HttpServletRequest req) {
        User user = userService.whoami(req);
        maintenanceRegisterService.seedInitialDataIfEmpty(user.getCompany(), user);
        return ResponseEntity.ok(maintenanceRegisterService.getDashboardStats(user));
    }

    @PostMapping("/seed-demo")
    @Operation(summary = "Seed sample maintenance records")
    public ResponseEntity<SuccessResponse> seedDemo(HttpServletRequest req) {
        User user = userService.whoami(req);
        maintenanceRegisterService.seedInitialDataIfEmpty(user.getCompany(), user);
        return ResponseEntity.ok(new SuccessResponse(true, "Sample records seeded successfully"));
    }
}
