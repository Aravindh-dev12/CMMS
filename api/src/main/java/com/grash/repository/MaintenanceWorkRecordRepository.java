package com.grash.repository;

import com.grash.model.MaintenanceWorkRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MaintenanceWorkRecordRepository extends JpaRepository<MaintenanceWorkRecord, Long>, JpaSpecificationExecutor<MaintenanceWorkRecord> {

    Collection<MaintenanceWorkRecord> findByCompany_Id(Long companyId);

    Page<MaintenanceWorkRecord> findByCompany_Id(Long companyId, Pageable pageable);

    Optional<MaintenanceWorkRecord> findByIdAndCompany_Id(Long id, Long companyId);

    List<MaintenanceWorkRecord> findByBooking_IdOrderByCreatedAtDesc(Long bookingId);

    List<MaintenanceWorkRecord> findByBooking_BookingIdOrderByCreatedAtDesc(String bookingId);

    List<MaintenanceWorkRecord> findByBookingCodeAndCompany_IdOrderByCreatedAtDesc(String bookingCode, Long companyId);

    @Query("SELECT r FROM MaintenanceWorkRecord r WHERE r.company.id = :companyId AND r.finishingDate IS NOT NULL ORDER BY r.finishingDate DESC")
    List<MaintenanceWorkRecord> findTopRecentCompleted(@Param("companyId") Long companyId, Pageable pageable);

    @Query("SELECT r.attendedBy, COUNT(r) FROM MaintenanceWorkRecord r WHERE r.company.id = :companyId AND r.attendedBy IS NOT NULL AND r.attendedBy <> '' GROUP BY r.attendedBy")
    List<Object[]> countByTechnicianSummary(@Param("companyId") Long companyId);
}
