package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.ContactInquiry;
import io.virinchi.springweb.domain.InquiryStatus;
import io.virinchi.springweb.dto.ApiDtos.ContactInquiryRequest;
import io.virinchi.springweb.dto.ApiDtos.ContactInquiryResponse;
import io.virinchi.springweb.exception.NotFoundException;
import io.virinchi.springweb.repository.ContactInquiryRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService {
    private final ContactInquiryRepository inquiryRepository;

    public ContactService(ContactInquiryRepository inquiryRepository) {
        this.inquiryRepository = inquiryRepository;
    }

    @Transactional
    public ContactInquiryResponse create(ContactInquiryRequest request) {
        ContactInquiry inquiry = new ContactInquiry();
        inquiry.setName(request.name().trim());
        inquiry.setEmail(request.email().trim().toLowerCase());
        inquiry.setSubject(request.subject().trim());
        inquiry.setMessage(request.message().trim());
        inquiryRepository.save(inquiry);
        return toResponse(inquiry);
    }

    public List<ContactInquiryResponse> list(String status) {
        List<ContactInquiry> inquiries = status == null || status.isBlank()
                ? inquiryRepository.findAll()
                : inquiryRepository.findByStatusOrderByCreatedAtDesc(InquiryStatus.valueOf(status.trim().toUpperCase()));
        return inquiries.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ContactInquiryResponse updateStatus(Long id, InquiryStatus status) {
        ContactInquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact inquiry not found"));
        inquiry.setStatus(status);
        inquiryRepository.save(inquiry);
        return toResponse(inquiry);
    }

    private ContactInquiryResponse toResponse(ContactInquiry inquiry) {
        return new ContactInquiryResponse(inquiry.getId(), inquiry.getName(), inquiry.getEmail(),
                inquiry.getSubject(), inquiry.getMessage(), inquiry.getStatus(), inquiry.getCreatedAt());
    }
}
