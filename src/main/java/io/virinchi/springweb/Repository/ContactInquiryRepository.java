package io.virinchi.springweb.repository;

import io.virinchi.springweb.domain.ContactInquiry;
import io.virinchi.springweb.domain.InquiryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContactInquiryRepository extends JpaRepository<ContactInquiry, Long> {
    List<ContactInquiry> findByStatusOrderByCreatedAtDesc(InquiryStatus status);
}
