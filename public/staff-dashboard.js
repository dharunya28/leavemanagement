
const staffTable = document.getElementById("staffLeaveTable");

// LOAD DASHBOARD
async function loadStaffDashboard() {
    try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
            window.location.href = "staff-login.html";
            return;
        }

        const data = await response.json();

        if (data.role !== "staff") {
            window.location.href = "staff-login.html";
            return;
        }

        document.getElementById("staffName").textContent =
            data.user.name;

        document.getElementById("staffWelcome").textContent =
            data.user.name;

        await loadAllApplications();

    } catch (error) {
        alert("Unable to load staff dashboard.");
    }
}

// LOAD ALL APPLICATIONS
async function loadAllApplications() {
    try {
        const response = await fetch("/api/leaves/all");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load applications");
        }

        const leaves = Array.isArray(data) ? data : (data.leaves || []);

        document.getElementById("totalApplications").textContent =
            leaves.length;

        document.getElementById("pendingApplications").textContent =
            leaves.filter(l => l.status === "Pending").length;

        document.getElementById("approvedApplications").textContent =
            leaves.filter(l => l.status === "Approved").length;

        document.getElementById("rejectedApplications").textContent =
            leaves.filter(l => l.status === "Rejected").length;

        displayApplications(leaves);

    } catch (error) {
        staffTable.innerHTML = `
            <tr><td colspan="10">${escapeHTML(error.message)}</td></tr>
        `;
    }
}

// DISPLAY APPLICATIONS
function displayApplications(leaves) {
    if (!leaves.length) {
        staffTable.innerHTML = `
            <tr><td colspan="10">No leave applications found.</td></tr>
        `;
        return;
    }

    staffTable.innerHTML = leaves.map(leave => {
        const status = leave.status.toLowerCase();

        return `
            <tr>
                <td>${escapeHTML(leave.studentName || leave.student?.name || "-")}</td>
                <td>${escapeHTML(leave.registerNumber || "-")}</td>
                <td>${escapeHTML(leave.department || "-")}</td>
                <td>${escapeHTML(leave.leaveType)}</td>
                <td>${formatDate(leave.fromDate)}</td>
                <td>${formatDate(leave.toDate)}</td>
                <td>${Number(leave.totalDays) || 0}</td>
                <td>${escapeHTML(leave.reason)}</td>
                <td>
                    <span class="status ${status}">
                        ${escapeHTML(leave.status)}
                    </span>
                </td>
                <td>
                    ${
                        leave.status === "Pending"
                        ? `
                            <button class="refresh-btn"
                                onclick="updateLeaveStatus('${leave._id}', 'Approved')">
                                Approve
                            </button>

                            <button class="logout-btn"
                                onclick="updateLeaveStatus('${leave._id}', 'Rejected')">
                                Reject
                            </button>
                        `
                        : "Completed"
                    }
                </td>
            </tr>
        `;
    }).join("");
}

// APPROVE OR REJECT WITHOUT REMARK
async function updateLeaveStatus(leaveId, status) {
    const confirmation = confirm(
        `Are you sure you want to ${status.toLowerCase()} this leave application?`
    );

    if (!confirmation) return;

    try {
        const response = await fetch(`/api/leaves/${leaveId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Status update failed");
        }

        const message = document.getElementById("staffMessage");
        message.textContent = `Application ${status.toLowerCase()} successfully!`;
        message.className = "form-message success";

        await loadAllApplications();

    } catch (error) {
        const message = document.getElementById("staffMessage");
        message.textContent = error.message;
        message.className = "form-message error";
    }
}

// DATE FORMAT
function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN");
}

// SAFE HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// LOGOUT
async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "staff-login.html";
}

// START
loadStaffDashboard();
