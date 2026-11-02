package com.grash.repository;

import com.grash.model.MaintenanceBooking;
import com.grash.model.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface MaintenanceBookingRepository extends JpaRepository<MaintenanceBooking, Long>, JpaSpecificationExecutor<MaintenanceBooking> {

    Collection<MaintenanceBooking> findByCompany_Id(Long companyId);

    Page<MaintenanceBooking> findByCompany_Id(Long companyId, Pageable pageable);

    Optional<MaintenanceBooking> findByIdAndCompany_Id(Long id, Long companyId);

    Optional<MaintenanceBooking> findByBookingIdAndCompany_Id(String bookingId, Long companyId);

    Optional<MaintenanceBooking> findByBookingId(String bookingId);

    boolean existsByBookingId(String bookingId);

    boolean existsByBookingIdAndCompany_Id(String bookingId, Long companyId);

    long countByCompany_Id(Long companyId);

    long countByCompany_IdAndStatus(Long companyId, BookingStatus status);

    @Query("SELECT COUNT(b) FROM MaintenanceBooking b WHERE b.company.id = :companyId AND b.dueDate IS NOT NULL AND b.dueDate < :now AND b.status NOT IN ('COMPLETED', 'CLOSED')")
    long countOverdueBookings(@Param("companyId") Long companyId, @Param("now") Date now);

    @Query("SELECT b.bookingId FROM MaintenanceBooking b WHERE b.company.id = :companyId")
    List<String> findAllBookingIdsByCompany(@Param("companyId") Long companyId);

    @Query("SELECT b.bookingId FROM MaintenanceBooking b")
    List<String> findAllBookingIds();

    @Query("SELECT b FROM MaintenanceBooking b WHERE b.company.id = :companyId ORDER BY b.createdAt DESC")
    List<MaintenanceBooking> findTop10RecentByCompany(@Param("companyId") Long companyId, Pageable pageable);

    @Query("SELECT b.building, COUNT(b) FROM MaintenanceBooking b WHERE b.company.id = :companyId AND b.building IS NOT NULL AND b.building <> '' GROUP BY b.building")
    List<Object[]> countByBuildingSummary(@Param("companyId") Long companyId);

    @Query("SELECT b.status, COUNT(b) FROM MaintenanceBooking b WHERE b.company.id = :companyId GROUP BY b.status")
    List<Object[]> countByStatusSummary(@Param("companyId") Long companyId);
}
