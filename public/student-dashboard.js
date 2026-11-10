
const API = "/api";

// Load student details, leave balance and history
async function loadDashboard() {
    try {
        const response = await fetch(`${API}/auth/me`);
        const data = await response.json();

        if (!response.ok || !data.success || data.role !== "student") {
            window.location.href = "student-login.html";
            return;
        }

        const student = data.user;

        document.getElementById("studentName").textContent = student.name;
        document.getElementById("studentWelcome").textContent = student.name;
        document.getElementById("profileName").textContent = student.name;
        document.getElementById("profileRegister").textContent = student.registerNumber;
        document.getElementById("profileEmail").textContent = student.email;
        document.getElementById("profileDepartment").textContent = student.department;
        document.getElementById("profileYear").textContent = student.year;

        await loadBalance();
        await loadLeaveHistory();

    } catch (error) {
        console.error("Dashboard loading error:", error);
        alert("Unable to load dashboard. Please check your server.");
    }
}

// Load leave balance
async function loadBalance() {
    try {
        const response = await fetch(`${API}/leaves/balance`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load leave balance");
        }

        const balance = data.balance || data;

        const total = balance.totalLeave ?? 12;
        const used = balance.usedLeave ?? 0;
        const remaining = balance.remainingLeave ?? (total - used);

        document.getElementById("totalLeave").textContent = total;
        document.getElementById("usedLeave").textContent = used;
        document.getElementById("remainingLeave").textContent = remaining;

    } catch (error) {
        console.error("Balance error:", error);
    }
}

// Load leave application history
async function loadLeaveHistory() {
    const tableBody = document.getElementById("leaveHistory");

    try {
        const response = await fetch(`${API}/leaves/my-leaves`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load leave history");
        }

        const leaves = data.leaves || [];

        if (leaves.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">No leave applications found.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = leaves.map(leave => `
            <tr>
                <td>${escapeHTML(leave.leaveType)}</td>
                <td>${formatDate(leave.fromDate)}</td>
                <td>${formatDate(leave.toDate)}</td>
                <td>${leave.totalDays}</td>
                <td>${escapeHTML(leave.reason)}</td>
                <td>
                    <span class="status ${leave.status.toLowerCase()}">
                        ${escapeHTML(leave.status)}
                    </span>
                </td>
                <td>${escapeHTML(leave.staffRemark || "-")}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("History error:", error);
        tableBody.innerHTML = `
            <tr><td colspan="7">Unable to load leave history.</td></tr>
        `;
    }
}

// Submit a new leave application
document.getElementById("leaveForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const leaveType = document.getElementById("leaveType").value;
    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;
    const reason = document.getElementById("reason").value.trim();
    const message = document.getElementById("leaveMessage");

    if (new Date(toDate) < new Date(fromDate)) {
        message.textContent = "To Date cannot be earlier than From Date.";
        message.className = "form-message error";
        return;
    }

    const submitButton = this.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        const response = await fetch(`${API}/leaves/apply`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                leaveType,
                fromDate,
                toDate,
                reason
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Leave application failed");
        }

        message.textContent = data.message || "Leave application submitted successfully!";
        message.className = "form-message success";

        this.reset();

        await loadBalance();
        await loadLeaveHistory();

    } catch (error) {
        message.textContent = error.message;
        message.className = "form-message error";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Leave Application";
    }
});

// Logout
async function logout() {
    try {
        await fetch(`${API}/auth/logout`, {
            method: "POST"
        });

        window.location.href = "student-login.html";

    } catch (error) {
        alert("Unable to logout. Please try again.");
    }
}

// Format date
function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Display user-provided text safely
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Set minimum date to today
const today = new Date();
const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");

document.getElementById("fromDate").min = todayString;
document.getElementById("toDate").min = todayString;

document.getElementById("fromDate").addEventListener("change", function() {
    document.getElementById("toDate").min = this.value;
});

// Start dashboard
loadDashboard();
