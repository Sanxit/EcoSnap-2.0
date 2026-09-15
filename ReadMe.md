<p align="center">
  <img align="center" src=".\src\main\resources\static\assets\img\logo.png" width="180">
</p>

<h1 align="center">EcoSnap</h1>

<p align="center">
  <strong>Event Photography Booking and Management Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/Sanxit/EcoSnap-2.0">
    <img alt="GitHub Repository" src="https://img.shields.io/badge/GitHub-EcoSnap--2.0-181717?style=for-the-badge&logo=github">
  </a>
  <a href="https://github.com/Sanxit/EcoSnap-2.0/commits/main">
    <img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/Sanxit/EcoSnap-2.0?style=for-the-badge&logo=github">
  </a>
  <a href="https://github.com/Sanxit/EcoSnap-2.0">
    <img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/Sanxit/EcoSnap-2.0?style=for-the-badge&logo=java">
  </a>
</p>

<p align="center">
  EcoSnap is a full-stack web application that connects customers with professional
  photographers for weddings, events, birthdays, corporate functions, and other
  special occasions.
</p>

---

## 📸 About EcoSnap

EcoSnap provides a centralized platform where customers can discover photographers,
explore their portfolios and photography packages, submit booking requests, and
manage their bookings.

Photographers can manage their profiles, portfolios, packages, and booking requests,
while administrators can manage users, photographers, bookings, packages, and other
platform activities.

The project is developed as a **BICT 4th Semester project** with a focus on
Spring MVC, layered architecture, database management, authentication, and
responsive web design.

---

## ✨ Features

### 👤 Customer

- User registration and login
- Browse photographers
- Search and filter photographers
- View photographer profiles
- View photography portfolios
- Explore photography packages
- Submit booking requests
- View booking history
- Track booking status
- Submit reviews and ratings
- Receive notifications
- Manage personal profile

### 📷 Photographer

- Photographer registration and profile management
- Manage photography packages
- Upload and manage portfolio images
- View booking requests
- Accept or reject booking requests
- Manage booking status
- View customer reviews
- Receive booking notifications

### 🛡️ Administrator

- Admin dashboard
- Manage users
- Manage photographers
- Manage photography packages
- Manage bookings
- Manage reviews
- Monitor platform activities

### 🔔 Notifications

- Booking request notifications
- Booking status notifications
- Account-related notifications
- Email notifications through SMTP where applicable

---

## 🏗️ System Architecture

EcoSnap follows a **layered Spring MVC architecture**:

```text
┌──────────────────────────────┐
│       Client Browser         │
│ HTML / CSS / JS / Bootstrap  │
│          Thymeleaf           │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│     Spring MVC Controller    │
│      REST API Endpoints      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        Service Layer         │
│      Business Logic          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Repository Layer       │
│      Spring Data JPA         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        Hibernate / JPA       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       PostgreSQL             │
│          Database            │
└──────────────────────────────┘

        ┌──────────────────┐
        │ Spring Security  │
        │ JWT / RBAC       │
        └──────────────────┘

        ┌──────────────────┐
        │ SMTP Email       │
        │ Service          │
        └──────────────────┘
```

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Java | Primary programming language |
| Spring Boot | Application framework |
| Spring MVC | Web and REST architecture |
| Spring Security | Authentication and authorization |
| Spring Data JPA | Data access |
| Hibernate | ORM |
| PostgreSQL | Relational database |
| Maven | Dependency and build management |

### Frontend

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling |
| Bootstrap 5 | Responsive UI |
| JavaScript | Client-side interactions |
| Thymeleaf | Server-side templates |

### Security & Communication

| Technology | Purpose |
|---|---|
| JWT | Authentication |
| Spring Security | Role-based authorization |
| SMTP | Email notifications |
| REST API | Client-server communication |

---

## 👥 User Roles

EcoSnap provides three main user roles:

```text
                    EcoSnap
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Customer      Photographer      Admin
        │              │              │
     Booking        Packages       Management
     Reviews        Portfolio       Users
     Browse         Bookings        Bookings
     Profile        Reviews         Reports
```

---

## 📋 Core Modules

```text
Authentication
     │
     ├── Registration
     ├── Login
     ├── Password Reset
     └── Role Management

Photographer Management
     │
     ├── Profiles
     ├── Portfolio
     └── Packages

Booking Management
     │
     ├── Booking Requests
     ├── Accept / Reject
     ├── Booking Status
     └── Booking History

Review Management
     │
     ├── Ratings
     └── Reviews

Notification System
     │
     ├── In-App Notifications
     └── Email Notifications

Administration
     │
     ├── Users
     ├── Photographers
     ├── Bookings
     ├── Packages
     └── Reviews
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

- **Java 21** or the Java version specified by the project
- **Maven**
- **PostgreSQL**
- **Git**
- IDE such as IntelliJ IDEA, Spring Tool Suite, or VS Code

---

## Clone the Repository

```bash
git clone https://github.com/Sanxit/EcoSnap-2.0.git
```

Navigate to the project:

```bash
cd EcoSnap-2.0
```

---

## Database Configuration

Create a PostgreSQL database for EcoSnap.

Example:

```sql
CREATE DATABASE ecosnap;
```

Configure the database connection using environment variables or your local
Spring configuration.

Example:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ecosnap
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

**Do not commit real database credentials, JWT secrets, or email passwords to GitHub.**

---

## Run the Application

Using Maven:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Or build the project:

```bash
./mvnw clean package
```

Then run the generated JAR:

```bash
java -jar target/ecosnap-*.jar
```

---

# 📁 Project Structure

```text
EcoSnap-2.0/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/ecosnap/
│       │       ├── controller/
│       │       ├── service/
│       │       ├── repository/
│       │       ├── entity/
│       │       ├── dto/
│       │       ├── security/
│       │       ├── config/
│       │       ├── exception/
│       │       └── EcoSnapApplication.java
│       │
│       └── resources/
│           ├── templates/
│           ├── static/
│           │   ├── css/
│           │   ├── js/
│           │   ├── images/
│           │   └── icons/
│           └── application.properties
│
├── pom.xml
├── .gitignore
└── README.md
```

---

# 🔄 Booking Workflow

The primary EcoSnap workflow is:

```text
Customer
   │
   ▼
Browse Photographers
   │
   ▼
View Photographer Profile
   │
   ▼
Select Package
   │
   ▼
Submit Booking Request
   │
   ▼
Booking Status: PENDING
   │
   ▼
Photographer Receives Request
   │
   ├───────────────┐
   ▼               ▼
Accept           Reject
   │               │
   ▼               ▼
CONFIRMED        REJECTED
   │
   ▼
Event Completed
   │
   ▼
Customer Review
```

---

# 🔐 Security

EcoSnap uses Spring Security to protect application resources and implement
role-based authorization.

Supported roles:

```text
ROLE_CUSTOMER
ROLE_PHOTOGRAPHER
ROLE_ADMIN
```

Security features include:

- Authentication
- Password hashing
- Role-based authorization
- Protected API endpoints
- JWT-based authentication where applicable
- Input validation

---

# 🗄️ Database

EcoSnap uses **PostgreSQL** with **Hibernate/JPA**.

Core entities include:

```text
User
Role
PhotographerProfile
Package
Booking
Review
PortfolioImage
Notification
Payment
```

---

# 📧 Email Service

EcoSnap can use an SMTP service for system-generated emails such as:

- Registration confirmation
- Password reset
- Booking notifications
- Booking status updates

SMTP credentials must be stored securely using environment variables.

---

# 📱 Responsive Design

The frontend is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

Bootstrap 5 is used to support responsive layouts and reusable UI components.

---

# 🧪 Testing

Testing covers:

- Authentication
- User registration
- Role authorization
- Photographer management
- Package management
- Booking workflow
- Review management
- Notification functionality
- Database operations
- Responsive UI

---

# 📚 Academic Project

**Project:** EcoSnap – Event Photography Booking and Management Platform

**Program:** Bachelor of Information and Communication Technology (BICT)

**Semester:** 4th Semester

**Architecture:** Layered Architecture / Spring MVC

---

# 📄 Documentation

Project documentation includes:

- Software Requirements Specification (SRS)
- Use Case Diagram
- ER Diagram
- System Architecture Diagram
- Database Design
- UI/UX Design
- API Documentation
- Testing Documentation

---

# 📜 License

This project is developed for academic and educational purposes.

See the [`LICENSE`](./LICENSE) file for more information.

---

## 👨‍💻 Author

**Sanxit Sapkota**

GitHub:

https://github.com/Sanxit

---

<p align="center">
  Built with Java, Spring Boot, PostgreSQL and modern web technologies.
</p>