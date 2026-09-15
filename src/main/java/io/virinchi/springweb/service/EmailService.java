package io.virinchi.springweb.service;

import io.virinchi.springweb.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String baseUrl;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:no-reply@ecosnap.com}") String fromAddress,
                        @Value("${ecosnap.base-url:http://localhost:8080}") String baseUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress == null || fromAddress.isBlank() ? "no-reply@ecosnap.com" : fromAddress;
        this.baseUrl = baseUrl == null ? "http://localhost:8080" : baseUrl.replaceAll("/+$", "");
    }

    public void sendRegistrationPending(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("EcoSnap registration received");
        message.setText("Hello " + user.getFullName() + ",\n\n"
                + "Your EcoSnap account has been created and is waiting for administrator approval. "
                + "You will receive another email once your account is approved.\n\n"
                + "After approval, you can log in at " + baseUrl + "/pages/login.html");
        send(message);
    }

    public void sendApproval(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("Your EcoSnap account has been approved");
        message.setText("Hello " + user.getFullName() + ",\n\n"
                + "Your EcoSnap account has been approved. You can now log in at "
                + baseUrl + "/pages/login.html");
        send(message);
    }

    public void sendPasswordReset(User user, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("Reset your EcoSnap password");
        message.setText("Use this link to reset your EcoSnap password: "
                + baseUrl + "/pages/reset-password.html?token=" + token);
        send(message);
    }

    private void send(SimpleMailMessage message) {
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            String recipient = message.getTo() == null || message.getTo().length == 0
                    ? "unknown"
                    : message.getTo()[0];
            log.warn("Could not send EcoSnap email to {}", recipient, exception);
        }
    }
}
