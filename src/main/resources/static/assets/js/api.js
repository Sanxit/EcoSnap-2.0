// EcoSnap Mock API & State Store
// Provides mock user accounts, authentication simulation, and role mapping.

const MOCK_USERS = [
  {
    id: "admin-001",
    role: "ADMIN",
    email: "admin@ecosnap.com",
    password: "admin123",
    name: "Anil Maharjan",
    fullName: "Anil Maharjan",
    initials: "AM",
    imageUrl: "",
  },
  {
    id: "client-001",
    role: "CUSTOMER",
    email: "client@ecosnap.com",
    password: "client123",
    name: "Priya Sharma",
    fullName: "Priya Sharma",
    initials: "PS",
    imageUrl: "",
  },
  {
    id: "photo-001",
    role: "PHOTOGRAPHER",
    email: "photo@ecosnap.com",
    password: "photo123",
    name: "Sangeeta Shrestha",
    fullName: "Sangeeta Shrestha",
    initials: "SS",
    imageUrl: "",
  },
];

const DASHBOARD_MAP = {
  admin: "dashboard-admin.html",
  ADMIN: "dashboard-admin.html",
  client: "dashboard-client.html",
  customer: "dashboard-client.html",
  CUSTOMER: "dashboard-client.html",
  photographer: "dashboard-photographer.html",
  PHOTOGRAPHER: "dashboard-photographer.html",
};

function loginUser(email, password) {
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (user) {
    const sessionUser = {
      id: user.id,
      fullName: user.fullName || user.name,
      name: user.fullName || user.name,
      email: user.email,
      role: user.role,
      initials: user.initials,
      imageUrl: user.imageUrl || "",
    };
    const token = "mock-token-" + Date.now();
    localStorage.setItem("ecosnap_token", token);
    localStorage.setItem("ecosnap_user", JSON.stringify(sessionUser));
    sessionStorage.setItem("ecosnap_token", token);
    sessionStorage.setItem("ecosnap_user", JSON.stringify(sessionUser));
    if (window.EcoSnapSession) {
      EcoSnapSession.applyNavbarAuth();
      EcoSnapSession.applyToUI(sessionUser);
    }
    return { success: true, user: sessionUser };
  }
  return { success: false, message: "Invalid email or password." };
}

function getCurrentUser() {
  if (window.EcoSnapSession) {
    return EcoSnapSession.getUser();
  }
  const raw = localStorage.getItem("ecosnap_user") || sessionStorage.getItem("ecosnap_user");
  return raw ? JSON.parse(raw) : null;
}

function logoutUser() {
  if (window.EcoSnapSession) {
    EcoSnapSession.logout();
    return;
  }
  localStorage.removeItem("ecosnap_user");
  localStorage.removeItem("ecosnap_token");
  sessionStorage.removeItem("ecosnap_user");
  sessionStorage.removeItem("ecosnap_token");
  window.location.href = "login.html";
}

function requireAuth(allowedRoles) {
  if (window.EcoSnapSession) {
    return EcoSnapSession.requireAuth(allowedRoles);
  }
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const normAllowed = allowedRoles.map((r) => {
      const u = String(r).toUpperCase();
      return u === "CLIENT" ? "CUSTOMER" : u;
    });
    const userRole = (user.role || "").toUpperCase();
    if (!normAllowed.includes(userRole)) {
      window.location.href = DASHBOARD_MAP[userRole] || "login.html";
      return null;
    }
  }
  return user;
}
