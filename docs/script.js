
const API_URL = window.location.origin.includes("github.io")
    ? "https://leavemanagement-2.onrender.com"
    : "";

// =====================================
// STUDENT REGISTRATION
// =====================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("registerMessage");

        const studentData = {
            name: document.getElementById("name").value.trim(),
            registerNumber: document.getElementById("registerNumber").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value,
            department: document.getElementById("department").value,
            year: document.getElementById("year").value
        };

        try {
            message.textContent = "Registering...";
            message.className = "form-message";

            const response = await fetch(`${API_URL}/api/auth/student/register`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(studentData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            message.textContent = data.message;
            message.className = "form-message success";

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "student-login.html";
            }, 1500);

        } catch (error) {
            message.textContent = error.message;
            message.className = "form-message error";
        }
    });
}


// =====================================
// STUDENT LOGIN
// =====================================

const studentLoginForm = document.getElementById("studentLoginForm");

if (studentLoginForm) {
    studentLoginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("loginMessage");

        const loginData = {
            email: document.getElementById("loginEmail").value.trim(),
            password: document.getElementById("loginPassword").value
        };

        try {
            message.textContent = "Logging in...";
            message.className = "form-message";

            const response = await fetch(`${API_URL}/api/auth/student/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            message.textContent = "Login successful! Opening dashboard...";
            message.className = "form-message success";

            window.location.href = "student-dashboard.html";

        } catch (error) {
            message.textContent = error.message;
            message.className = "form-message error";
        }
    });
}


// =====================================
// STAFF LOGIN
// =====================================

const staffLoginForm = document.getElementById("staffLoginForm");

if (staffLoginForm) {
    staffLoginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("staffLoginMessage");

        const loginData = {
            email: document.getElementById("staffEmail").value.trim(),
            password: document.getElementById("staffPassword").value
        };

        try {
            message.textContent = "Logging in...";
            message.className = "form-message";

            const response = await fetch(`${API_URL}/api/auth/staff/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Staff login failed");
            }

            message.textContent = "Login successful!";
            message.className = "form-message success";

            window.location.href = "staff-dashboard.html";

        } catch (error) {
            message.textContent = error.message;
            message.className = "form-message error";
        }
    });
}
