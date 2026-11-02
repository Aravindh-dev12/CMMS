package com.grash.service;

import com.grash.dto.maintenance.*;
import com.grash.exception.CustomException;
import com.grash.model.Company;
import com.grash.model.MaintenanceBooking;
import com.grash.model.MaintenanceWorkRecord;
import com.grash.model.User;
import com.grash.model.enums.BookingStatus;
import com.grash.repository.MaintenanceBookingRepository;
import com.grash.repository.MaintenanceWorkRecordRepository;
import com.grash.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceRegisterService {

    private final MaintenanceBookingRepository bookingRepository;
    private final MaintenanceWorkRecordRepository workRecordRepository;
    private final UserRepository userRepository;

    public synchronized String generateNextBookingId(Long companyId) {
        List<String> existingIds = bookingRepository.findAllBookingIdsByCompany(companyId);
        long maxNum = 2099;
        Pattern pattern = Pattern.compile("(\\d+)");
        for (String id : existingIds) {
            if (id != null) {
                Matcher matcher = pattern.matcher(id);
                if (matcher.find()) {
                    try {
                        long num = Long.parseLong(matcher.group(1));
                        if (num > maxNum) {
                            maxNum = num;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return String.valueOf(maxNum + 1);
    }

    @Transactional
    public MaintenanceBooking createBooking(MaintenanceBookingPostDTO dto, User user) {
        Company company = user.getCompany();
        String bookingId = dto.getBookingId();
        if (bookingId == null || bookingId.trim().isEmpty()) {
            bookingId = generateNextBookingId(company.getId());
        } else {
            bookingId = bookingId.trim();
            if (bookingRepository.existsByBookingIdAndCompany_Id(bookingId, company.getId())) {
                throw new CustomException("Booking ID already exists: " + bookingId, HttpStatus.CONFLICT);
            }
        }

        User technician = null;
        if (dto.getAssignedTechnicianId() != null) {
            technician = userRepository.findByIdAndCompany_Id(dto.getAssignedTechnicianId(), company.getId())
                    .orElse(null);
        }

        BookingStatus status = dto.getStatus();
        if (status == null) {
            status = technician != null ? BookingStatus.ASSIGNED : BookingStatus.PENDING;
        }

        MaintenanceBooking booking = MaintenanceBooking.builder()
                .bookingId(bookingId)
                .date(dto.getDate() != null ? dto.getDate() : new Date())
                .reportedBy(dto.getReportedBy())
                .building(dto.getBuilding())
                .floor(dto.getFloor())
                .room(dto.getRoom())
                .exactLocation(dto.getExactLocation())
                .complaintDetails(dto.getComplaintDetails())
                .status(status)
                .typeOfWork(dto.getTypeOfWork())
                .assignedTechnician(technician)
                .closedId(dto.getClosedId())
                .closingRemarks(dto.getClosingRemarks())
                .dueDate(dto.getDueDate())
                .build();
        booking.setCompany(company);

        return bookingRepository.save(booking);
    }

    @Transactional
    public MaintenanceBooking updateBooking(Long id, MaintenanceBookingPostDTO dto, User user) {
        Company company = user.getCompany();
        MaintenanceBooking booking = bookingRepository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Maintenance Booking not found with id: " + id, HttpStatus.NOT_FOUND));

        if (dto.getDate() != null) booking.setDate(dto.getDate());
        if (dto.getReportedBy() != null) booking.setReportedBy(dto.getReportedBy());
        if (dto.getBuilding() != null) booking.setBuilding(dto.getBuilding());
        if (dto.getFloor() != null) booking.setFloor(dto.getFloor());
        if (dto.getRoom() != null) booking.setRoom(dto.getRoom());
        if (dto.getExactLocation() != null) booking.setExactLocation(dto.getExactLocation());
        if (dto.getComplaintDetails() != null) booking.setComplaintDetails(dto.getComplaintDetails());
        if (dto.getTypeOfWork() != null) booking.setTypeOfWork(dto.getTypeOfWork());
        if (dto.getDueDate() != null) booking.setDueDate(dto.getDueDate());

        if (dto.getAssignedTechnicianId() != null) {
            User tech = userRepository.findByIdAndCompany_Id(dto.getAssignedTechnicianId(), company.getId()).orElse(null);
            booking.setAssignedTechnician(tech);
            if (booking.getStatus() == BookingStatus.PENDING && tech != null) {
                booking.setStatus(BookingStatus.ASSIGNED);
            }
        }

        if (dto.getStatus() != null) {
            booking.setStatus(dto.getStatus());
            if (dto.getStatus() == BookingStatus.CLOSED && booking.getClosedDate() == null) {
                booking.setClosedDate(new Date());
            }
        }

        if (dto.getClosedId() != null) booking.setClosedId(dto.getClosedId());
        if (dto.getClosingRemarks() != null) booking.setClosingRemarks(dto.getClosingRemarks());

        return bookingRepository.save(booking);
    }

    @Transactional
    public void deleteBooking(Long id, User user) {
        Company company = user.getCompany();
        MaintenanceBooking booking = bookingRepository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Booking not found: " + id, HttpStatus.NOT_FOUND));
        bookingRepository.delete(booking);
    }

    public MaintenanceBooking getBookingById(Long id, User user) {
        Company company = user.getCompany();
        return bookingRepository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Booking not found: " + id, HttpStatus.NOT_FOUND));
    }

    public MaintenanceBooking getBookingByBookingId(String bookingId, User user) {
        Company company = user.getCompany();
        return bookingRepository.findByBookingIdAndCompany_Id(bookingId, company.getId())
                .orElseThrow(() -> new CustomException("Booking not found with Booking ID: " + bookingId, HttpStatus.NOT_FOUND));
    }

    public Page<MaintenanceBooking> getBookings(String search, String building, String floor,
                                                String statusStr, Long technicianId,
                                                Date startDate, Date endDate,
                                                Pageable pageable, User user) {
        Company company = user.getCompany();

        Specification<MaintenanceBooking> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), company.getId()));

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate byBookingId = cb.like(cb.lower(root.get("bookingId")), searchPattern);
                Predicate byReportedBy = cb.like(cb.lower(root.get("reportedBy")), searchPattern);
                Predicate byComplaint = cb.like(cb.lower(root.get("complaintDetails")), searchPattern);
                predicates.add(cb.or(byBookingId, byReportedBy, byComplaint));
            }

            if (building != null && !building.trim().isEmpty() && !building.equalsIgnoreCase("all")) {
                predicates.add(cb.equal(cb.lower(root.get("building")), building.trim().toLowerCase()));
            }

            if (floor != null && !floor.trim().isEmpty() && !floor.equalsIgnoreCase("all")) {
                predicates.add(cb.equal(cb.lower(root.get("floor")), floor.trim().toLowerCase()));
            }

            if (statusStr != null && !statusStr.trim().isEmpty() && !statusStr.equalsIgnoreCase("all")) {
                BookingStatus status = BookingStatus.fromString(statusStr);
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (technicianId != null) {
                predicates.add(cb.equal(root.get("assignedTechnician").get("id"), technicianId));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return bookingRepository.findAll(spec, pageable);
    }

    @Transactional
    public MaintenanceWorkRecord createWorkRecord(MaintenanceWorkRecordPostDTO dto, User user) {
        Company company = user.getCompany();
        MaintenanceBooking booking = null;

        if (dto.getBookingId() != null) {
            booking = bookingRepository.findByIdAndCompany_Id(dto.getBookingId(), company.getId()).orElse(null);
        }
        if (booking == null && dto.getBookingCode() != null && !dto.getBookingCode().trim().isEmpty()) {
            booking = bookingRepository.findByBookingIdAndCompany_Id(dto.getBookingCode().trim(), company.getId()).orElse(null);
        }

        if (booking == null) {
            throw new CustomException("A valid Booking ID is required to record maintenance work.", HttpStatus.BAD_REQUEST);
        }

        User technician = null;
        if (dto.getTechnicianUserId() != null) {
            technician = userRepository.findByIdAndCompany_Id(dto.getTechnicianUserId(), company.getId()).orElse(null);
        }

        String attendedBy = dto.getAttendedBy();
        if ((attendedBy == null || attendedBy.trim().isEmpty()) && technician != null) {
            attendedBy = technician.getFirstName() + " " + technician.getLastName();
        }

        MaintenanceWorkRecord record = MaintenanceWorkRecord.builder()
                .booking(booking)
                .bookingCode(booking.getBookingId())
                .typeOfWork(dto.getTypeOfWork() != null ? dto.getTypeOfWork() : booking.getTypeOfWork())
                .attendedBy(attendedBy)
                .technicianUser(technician)
                .startingDate(dto.getStartingDate() != null ? dto.getStartingDate() : new Date())
                .finishingDate(dto.getFinishingDate())
                .timeTaken(dto.getTimeTaken())
                .pendingReason(dto.getPendingReason())
                .closedId(dto.getClosedId())
                .workDetails(dto.getWorkDetails())
                .signature(dto.getSignature())
                .beforePhotoUrl(dto.getBeforePhotoUrl())
                .afterPhotoUrl(dto.getAfterPhotoUrl())
                .build();
        record.setCompany(company);

        // Auto-update booking status according to the workflow
        if (dto.getBookingStatus() != null && !dto.getBookingStatus().trim().isEmpty()) {
            booking.setStatus(BookingStatus.fromString(dto.getBookingStatus()));
        } else if (dto.getClosedId() != null && !dto.getClosedId().trim().isEmpty()) {
            booking.setStatus(BookingStatus.CLOSED);
            booking.setClosedId(dto.getClosedId());
            booking.setClosedDate(new Date());
        } else if (dto.getFinishingDate() != null) {
            booking.setStatus(BookingStatus.COMPLETED);
        } else if (dto.getPendingReason() != null && !dto.getPendingReason().trim().isEmpty()) {
            booking.setStatus(BookingStatus.IN_PROGRESS);
        } else if (dto.getStartingDate() != null) {
            booking.setStatus(BookingStatus.IN_PROGRESS);
        } else if (technician != null || (attendedBy != null && !attendedBy.trim().isEmpty())) {
            if (booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.ASSIGNED);
            }
        }

        if (technician != null && booking.getAssignedTechnician() == null) {
            booking.setAssignedTechnician(technician);
        }

        bookingRepository.save(booking);
        return workRecordRepository.save(record);
    }

    @Transactional
    public MaintenanceWorkRecord updateWorkRecord(Long id, MaintenanceWorkRecordPostDTO dto, User user) {
        Company company = user.getCompany();
        MaintenanceWorkRecord record = workRecordRepository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Work record not found: " + id, HttpStatus.NOT_FOUND));

        if (dto.getTypeOfWork() != null) record.setTypeOfWork(dto.getTypeOfWork());
        if (dto.getAttendedBy() != null) record.setAttendedBy(dto.getAttendedBy());
        if (dto.getStartingDate() != null) record.setStartingDate(dto.getStartingDate());
        if (dto.getFinishingDate() != null) record.setFinishingDate(dto.getFinishingDate());
        if (dto.getTimeTaken() != null) record.setTimeTaken(dto.getTimeTaken());
        if (dto.getPendingReason() != null) record.setPendingReason(dto.getPendingReason());
        if (dto.getClosedId() != null) record.setClosedId(dto.getClosedId());
        if (dto.getWorkDetails() != null) record.setWorkDetails(dto.getWorkDetails());
        if (dto.getSignature() != null) record.setSignature(dto.getSignature());
        if (dto.getBeforePhotoUrl() != null) record.setBeforePhotoUrl(dto.getBeforePhotoUrl());
        if (dto.getAfterPhotoUrl() != null) record.setAfterPhotoUrl(dto.getAfterPhotoUrl());

        MaintenanceBooking booking = record.getBooking();
        if (booking != null) {
            if (dto.getBookingStatus() != null && !dto.getBookingStatus().trim().isEmpty()) {
                booking.setStatus(BookingStatus.fromString(dto.getBookingStatus()));
            } else if (dto.getClosedId() != null && !dto.getClosedId().trim().isEmpty()) {
                booking.setStatus(BookingStatus.CLOSED);
                booking.setClosedId(dto.getClosedId());
                booking.setClosedDate(new Date());
            } else if (dto.getFinishingDate() != null) {
                booking.setStatus(BookingStatus.COMPLETED);
            }
            bookingRepository.save(booking);
        }

        return workRecordRepository.save(record);
    }

    @Transactional
    public void deleteWorkRecord(Long id, User user) {
        Company company = user.getCompany();
        MaintenanceWorkRecord record = workRecordRepository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Work record not found: " + id, HttpStatus.NOT_FOUND));
        workRecordRepository.delete(record);
    }

    public Page<MaintenanceWorkRecord> getWorkRecords(String bookingCode, String attendedBy,
                                                      String typeOfWork, Date startDate, Date endDate,
                                                      Pageable pageable, User user) {
        Company company = user.getCompany();

        Specification<MaintenanceWorkRecord> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), company.getId()));

            if (bookingCode != null && !bookingCode.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("bookingCode")), "%" + bookingCode.trim().toLowerCase() + "%"));
            }

            if (attendedBy != null && !attendedBy.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("attendedBy")), "%" + attendedBy.trim().toLowerCase() + "%"));
            }

            if (typeOfWork != null && !typeOfWork.trim().isEmpty() && !typeOfWork.equalsIgnoreCase("all")) {
                predicates.add(cb.equal(cb.lower(root.get("typeOfWork")), typeOfWork.trim().toLowerCase()));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startingDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startingDate"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return workRecordRepository.findAll(spec, pageable);
    }

    public List<MaintenanceWorkRecord> getWorkHistoryForBooking(Long bookingId, User user) {
        Company company = user.getCompany();
        MaintenanceBooking booking = bookingRepository.findByIdAndCompany_Id(bookingId, company.getId())
                .orElseThrow(() -> new CustomException("Booking not found: " + bookingId, HttpStatus.NOT_FOUND));
        return workRecordRepository.findByBooking_IdOrderByCreatedAtDesc(booking.getId());
    }

    @Transactional
    public MaintenanceBooking closeBooking(Long id, CloseBookingRequest req, User user) {
        Company company = user.getCompany();
        MaintenanceBooking booking = bookingRepository.findByIdAndCompany_Id(id, company.getId())
                .orElseThrow(() -> new CustomException("Booking not found: " + id, HttpStatus.NOT_FOUND));

        String closedId = req.getClosedId();
        if (closedId == null || closedId.trim().isEmpty()) {
            closedId = "CL-" + booking.getBookingId();
        }

        booking.setStatus(BookingStatus.CLOSED);
        booking.setClosedId(closedId.trim());
        booking.setClosedDate(new Date());
        if (req.getClosingRemarks() != null) {
            booking.setClosingRemarks(req.getClosingRemarks());
        }

        return bookingRepository.save(booking);
    }

    public MaintenanceDashboardStatsDTO getDashboardStats(User user) {
        Company company = user.getCompany();
        Long companyId = company.getId();

        long totalBookings = bookingRepository.countByCompany_Id(companyId);
        long pending = bookingRepository.countByCompany_IdAndStatus(companyId, BookingStatus.PENDING);
        long assigned = bookingRepository.countByCompany_IdAndStatus(companyId, BookingStatus.ASSIGNED);
        long inProgress = bookingRepository.countByCompany_IdAndStatus(companyId, BookingStatus.IN_PROGRESS);
        long completed = bookingRepository.countByCompany_IdAndStatus(companyId, BookingStatus.COMPLETED);
        long closed = bookingRepository.countByCompany_IdAndStatus(companyId, BookingStatus.CLOSED);
        long overdue = bookingRepository.countOverdueBookings(companyId, new Date());

        Pageable top10 = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<MaintenanceBooking> recentBookings = bookingRepository.findTop10RecentByCompany(companyId, top10);
        List<MaintenanceWorkRecord> recentCompleted = workRecordRepository.findTopRecentCompleted(companyId, top10);

        List<NameCountDTO> technicianSummary = workRecordRepository.countByTechnicianSummary(companyId).stream()
                .map(row -> new NameCountDTO((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        List<NameCountDTO> buildingSummary = bookingRepository.countByBuildingSummary(companyId).stream()
                .map(row -> new NameCountDTO((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        // Date-wise counts for the last 14 days
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Map<String, long[]> dateCounts = new LinkedHashMap<>();
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_YEAR, -13);
        for (int i = 0; i < 14; i++) {
            dateCounts.put(sdf.format(cal.getTime()), new long[]{0, 0});
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }

        for (MaintenanceBooking b : bookingRepository.findByCompany_Id(companyId)) {
            if (b.getDate() != null) {
                String dStr = sdf.format(b.getDate());
                if (dateCounts.containsKey(dStr)) {
                    dateCounts.get(dStr)[0]++;
                    if (b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.CLOSED) {
                        dateCounts.get(dStr)[1]++;
                    }
                }
            }
        }

        List<DateCountDTO> dateReport = dateCounts.entrySet().stream()
                .map(e -> new DateCountDTO(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .collect(Collectors.toList());

        return MaintenanceDashboardStatsDTO.builder()
                .totalBookings(totalBookings)
                .pendingComplaints(pending)
                .assignedWorkOrders(assigned)
                .inProgress(inProgress)
                .completedWork(completed)
                .closedWorkOrders(closed)
                .overdueMaintenance(overdue)
                .recentBookings(recentBookings)
                .recentCompletedWork(recentCompleted)
                .technicianSummary(technicianSummary)
                .buildingSummary(buildingSummary)
                .dateReport(dateReport)
                .build();
    }

    @Transactional
    public void seedInitialDataIfEmpty(Company company, User adminUser) {
        if (bookingRepository.countByCompany_Id(company.getId()) == 0) {
            log.info("Seeding initial maintenance register sample records for company: {}", company.getId());
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            Date sampleDate;
            try {
                sampleDate = sdf.parse("01/07/2026");
            } catch (Exception e) {
                sampleDate = new Date();
            }

            String id1 = bookingRepository.existsByBookingId("2100") ? generateNextBookingId() : "2100";
            String id2 = bookingRepository.existsByBookingId("2101") ? generateNextBookingId() : "2101";
            String id3 = bookingRepository.existsByBookingId("2102") ? generateNextBookingId() : "2102";

            MaintenanceBooking b1 = MaintenanceBooking.builder()
                    .bookingId(id1)
                    .date(sampleDate)
                    .reportedBy("Nandhini")
                    .building("B1")
                    .floor("Ground Floor")
                    .room("Washroom Area")
                    .exactLocation("B1 - Ground Floor Washroom")
                    .complaintDetails("Ground floor water tap leakage.")
                    .status(BookingStatus.COMPLETED)
                    .typeOfWork("Plumbing")
                    .assignedTechnician(adminUser)
                    .closedId("CL-" + id1)
                    .build();
            b1.setCompany(company);
            b1 = bookingRepository.save(b1);

            MaintenanceWorkRecord w1 = MaintenanceWorkRecord.builder()
                    .booking(b1)
                    .bookingCode(id1)
                    .typeOfWork("Plumbing")
                    .attendedBy("Naveen Kumar")
                    .technicianUser(adminUser)
                    .startingDate(sampleDate)
                    .finishingDate(sampleDate)
                    .timeTaken("1.5 hrs")
                    .workDetails("Replaced worn out ceramic tap washer and resealed valve.")
                    .closedId("CL-" + id1)
                    .build();
            w1.setCompany(company);
            workRecordRepository.save(w1);

            MaintenanceBooking b2 = MaintenanceBooking.builder()
                    .bookingId(id2)
                    .date(sampleDate)
                    .reportedBy("Chandramohan")
                    .building("B1")
                    .floor("Second Floor")
                    .room("Room 204")
                    .exactLocation("B1 - Second Floor Restroom")
                    .complaintDetails("Water tap broken.")
                    .status(BookingStatus.IN_PROGRESS)
                    .typeOfWork("Plumbing")
                    .assignedTechnician(adminUser)
                    .build();
            b2.setCompany(company);
            b2 = bookingRepository.save(b2);

            MaintenanceWorkRecord w2 = MaintenanceWorkRecord.builder()
                    .booking(b2)
                    .bookingCode(id2)
                    .typeOfWork("Plumbing")
                    .attendedBy("Suresh")
                    .technicianUser(adminUser)
                    .startingDate(sampleDate)
                    .pendingReason("Awaiting replacement tap fitting from central store")
                    .workDetails("Isolated water supply and removed broken tap fixture.")
                    .build();
            w2.setCompany(company);
            workRecordRepository.save(w2);

            MaintenanceBooking b3 = MaintenanceBooking.builder()
                    .bookingId(id3)
                    .date(new Date())
                    .reportedBy("Ramesh")
                    .building("B2")
                    .floor("First Floor")
                    .room("Conference Hall")
                    .exactLocation("Main Conference Stage")
                    .complaintDetails("AC cooling insufficient and blower humming loudly.")
                    .status(BookingStatus.PENDING)
                    .typeOfWork("HVAC")
                    .build();
            b3.setCompany(company);
            bookingRepository.save(b3);
        }
    }
}

