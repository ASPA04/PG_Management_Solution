// ===== API CONFIGURATION =====
const API_BASE_URL = 'http://localhost:3000/api';

// ===== DATA STORAGE =====
let tenants = [];
let notices = [];

// ===== API HELPER FUNCTIONS =====
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const contentType = response.headers.get('content-type') || '';
        let payload = null;
        if (contentType.includes('application/json')) {
            payload = await response.json();
        }

        if (!response.ok) {
            const message = payload?.error || `HTTP error ${response.status}`;
            throw new Error(message);
        }

        return payload;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('❌ Error: ' + error.message, 'error');
        throw error;
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', async function() {
    await loadTenants();
    await loadNotices();
    displayTenants();
    displayRentRecords();
    displayNotices();
    updateStats();
    populateMonthFilter();
});

// ===== NAVIGATION =====
function switchSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(sectionName).classList.add('active');
    event.target.classList.add('active');
}

// ===== TENANT FUNCTIONS =====
async function loadTenants() {
    try {
        tenants = await apiRequest('/tenants');
        console.log('Loaded tenants:', tenants);
    } catch (error) {
        tenants = [];
    }
}

// Show archive of all tenants including deleted ones
async function showArchiveModal() {
    try {
        const allTenants = await apiRequest('/tenants/all');
        const modal = document.createElement('div');
        modal.className = 'modal';

        if (!allTenants || allTenants.length === 0) {
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📁 Tenant Archive</h2>
                        <button class="close-btn" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="tenant-form">
                        <div class="empty-state"><p>No records found.</p></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            return;
        }

        const rows = allTenants.map(t => {
            const tenantId = t._id || t.id;
            const status = t.deleted ? 'Archived' : 'Active';
            const badgeClass = t.deleted ? 'badge-unpaid' : 'badge-paid';
            return `
                <tr>
                    <td><strong>${t.name}</strong></td>
                    <td>${t.roomNumber}</td>
                    <td>${t.contact}</td>
                    <td>₹${t.rentAmount.toLocaleString('en-IN')}</td>
                    <td>${t.joinDate ? new Date(t.joinDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td><span class="payment-badge ${badgeClass}">${status}</span></td>
                    <td>${t.deletedAt ? new Date(t.deletedAt).toLocaleDateString('en-IN') : '-'}</td>
                    <td>${t.rentHistory?.length || 0}</td>
                </tr>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>📁 Tenant Archive</h2>
                    <button class="close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="tenant-form">
                    <div class="rent-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Room</th>
                                    <th>Contact</th>
                                    <th>Rent</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                    <th>Deleted At</th>
                                    <th>Payments</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (error) {
        // error handled in apiRequest
    }
}

async function showAddTenantModal() {
    const modal = createTenantModal();
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('tenantName').focus(), 100);
}

function createTenantModal(tenant = null) {
    const isEdit = tenant !== null;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${isEdit ? '✏️ Edit Tenant' : '➕ Add Tenant'}</h2>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <form class="tenant-form" onsubmit="handleTenantSubmit(event, ${isEdit ? `'${tenant?._id || tenant?.id}'` : 'null'})">
                <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" id="tenantName" class="form-input" value="${tenant?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Room Number *</label>
                    <input type="text" id="roomNumber" class="form-input" value="${tenant?.roomNumber || ''}" required>
                </div>
                <div class="form-group">
                    <label>Contact Number *</label>
                    <input type="tel" id="contactNumber" class="form-input" value="${tenant?.contact || ''}" pattern="[0-9]{10}" required>
                </div>
                <div class="form-group">
                    <label>Monthly Rent (₹) *</label>
                    <input type="number" id="rentAmount" class="form-input" value="${tenant?.rentAmount || ''}" min="0" required>
                </div>
                <div class="form-group">
                    <label>Security Deposit (₹) *</label>
                    <input type="number" id="depositAmount" class="form-input" value="${tenant?.deposit || ''}" min="0" required>
                </div>
                <div class="form-group">
                    <label>Join Date *</label>
                    <input type="date" id="joinDate" class="form-input" value="${tenant?.joinDate ? tenant.joinDate.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? '💾 Update' : '➕ Add'}</button>
                </div>
            </form>
        </div>
    `;
    return modal;
}

async function handleTenantSubmit(event, tenantId) {
    event.preventDefault();
    
    const data = {
        name: document.getElementById('tenantName').value.trim(),
        roomNumber: document.getElementById('roomNumber').value.trim(),
        contact: document.getElementById('contactNumber').value.trim(),
        rentAmount: parseInt(document.getElementById('rentAmount').value),
        deposit: parseInt(document.getElementById('depositAmount').value),
        joinDate: document.getElementById('joinDate').value
    };

    try {
        if (tenantId) {
            await apiRequest(`/tenants/${tenantId}`, 'PUT', data);
            showNotification('✅ Tenant updated!', 'success');
        } else {
            await apiRequest('/tenants', 'POST', data);
            showNotification('✅ Tenant added!', 'success');
        }

        await loadTenants();
        displayTenants();
        displayRentRecords();
        updateStats();
        closeModal();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

async function editTenant(id) {
    const tenant = tenants.find(t => (t._id || t.id) === id);
    if (tenant) {
        const modal = createTenantModal(tenant);
        document.body.appendChild(modal);
    }
}

async function deleteTenant(id) {
    const tenant = tenants.find(t => (t._id || t.id) === id);
    if (confirm(`Delete ${tenant.name}? This will also delete all rent records.`)) {
        try {
            await apiRequest(`/tenants/${id}`, 'DELETE');
            showNotification('🗑️ Tenant deleted!', 'success');
            await loadTenants();
            displayTenants();
            displayRentRecords();
            updateStats();
        } catch (error) {
            // Error already handled in apiRequest
        }
    }
}

function displayTenants() {
    const container = document.getElementById('tenantsList');
    
    if (tenants.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tenants yet. Click "Add Tenant" to start!</p></div>';
        return;
    }

    const currentMonth = getCurrentMonthYear();
    container.innerHTML = tenants.map(t => {
        const tenantId = t._id || t.id;
        const isPaid = t.rentHistory?.some(r => r.month === currentMonth && r.paid);
        return `
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="tenant-avatar">${t.name.charAt(0).toUpperCase()}</div>
                    <div class="tenant-info">
                        <div class="tenant-name">${t.name}</div>
                        <div class="tenant-room">Room ${t.roomNumber}</div>
                    </div>
                    <span class="status-badge ${isPaid ? 'status-paid' : 'status-unpaid'}">
                        ${isPaid ? '✓ Paid' : '⏳ Pending'}
                    </span>
                </div>
                <div class="tenant-details">
                    <div class="detail-row">
                        <span class="detail-label">📞 Contact:</span>
                        <span class="detail-value">${t.contact}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">💰 Rent:</span>
                        <span class="detail-value">₹${t.rentAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🏦 Deposit:</span>
                        <span class="detail-value">₹${t.deposit.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">📅 Joined:</span>
                        <span class="detail-value">${new Date(t.joinDate).toLocaleDateString('en-IN')}</span>
                    </div>
                </div>
                <div class="tenant-actions">
                    <button class="btn-icon btn-edit" onclick="editTenant('${tenantId}')" title="Edit">✏️</button>
                    <button class="btn-icon btn-delete" onclick="deleteTenant('${tenantId}')" title="Delete">🗑️</button>
                    <button class="btn-icon btn-payment" onclick="showPaymentModal('${tenantId}')" title="Record Payment">💳</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== RENT TRACKING FUNCTIONS =====
function showPaymentModal(tenantId, preSelectedMonth = null) {
    const tenant = tenants.find(t => (t._id || t.id) === tenantId);
    if (!tenant) return;

    const currentMonth = preSelectedMonth || getCurrentMonthYear();
    const existingPayment = tenant.rentHistory?.find(r => r.month === currentMonth);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>💳 Record Rent Payment</h2>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <form class="payment-form" onsubmit="handlePaymentSubmit(event, '${tenantId}')">
                <div class="form-group">
                    <label>Tenant</label>
                    <input type="text" class="form-input" value="${tenant.name} - Room ${tenant.roomNumber}" readonly>
                </div>
                <div class="form-group">
                    <label>Month *</label>
                    <select id="paymentMonth" class="form-select" required>
                        ${generateMonthOptionsForTenant(tenant, currentMonth)}
                    </select>
                </div>
                <div class="form-group">
                    <label>Rent Amount (₹) *</label>
                    <input type="number" id="paymentAmount" class="form-input" value="${existingPayment?.amount || tenant.rentAmount}" min="0" required>
                </div>
                <div class="form-group">
                    <label>Payment Date *</label>
                    <input type="date" id="paymentDate" class="form-input" value="${existingPayment?.date ? existingPayment.date.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Status *</label>
                    <select id="paymentStatus" class="form-select" required>
                        <option value="true" ${existingPayment?.paid ? 'selected' : ''}>Paid</option>
                        <option value="false" ${existingPayment && !existingPayment.paid ? 'selected' : ''}>Unpaid</option>
                    </select>
            </div>
            <div class="form-group">
                <label>Proof of Payment (image URL, optional)</label>
                <input type="url" id="paymentProofUrl" class="form-input" value="${existingPayment?.proofUrl || ''}" placeholder="https://... (link to receipt/screenshot)">
                </div>
                ${tenant.rentHistory && tenant.rentHistory.length > 0 ? `
                <div class="form-group">
                    <label>Payment History</label>
                    <div class="payment-history">
                        ${tenant.rentHistory.map(r => `
                            <div class="payment-item">
                                <span>${formatMonthYear(r.month)}</span>
                                <span class="payment-badge ${r.paid ? 'badge-paid' : 'badge-unpaid'}">
                                    ${r.paid ? '✓ Paid' : '⏳ Unpaid'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-success">💾 Save Payment</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

async function handlePaymentSubmit(event, tenantId) {
    event.preventDefault();
    
    const month = document.getElementById('paymentMonth').value;
    const amount = parseInt(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const paid = document.getElementById('paymentStatus').value === 'true';
    const proofUrl = document.getElementById('paymentProofUrl')?.value?.trim() || '';

    const paymentData = {
        month: month,
        amount: amount,
        date: date,
        paid: paid,
        proofUrl: proofUrl
    };

    try {
        await apiRequest(`/tenants/${tenantId}/payment`, 'POST', paymentData);
        showNotification('✅ Payment recorded!', 'success');
        await loadTenants();
        displayTenants();
        displayRentRecords();
        updateStats();
        closeModal();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

function displayRentRecords() {
    const container = document.getElementById('rentTableContainer');
    
    if (tenants.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tenants yet. Add tenants first to track rent!</p></div>';
        return;
    }

    const monthFilter = document.getElementById('monthFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const allRecords = [];
    tenants.forEach(tenant => {
        const months = getMonthsFromJoinDate(tenant.joinDate);
        months.forEach(month => {
            const payment = tenant.rentHistory?.find(r => r.month === month);
            allRecords.push({
                tenantId: tenant._id || tenant.id,
                tenantName: tenant.name,
                roomNumber: tenant.roomNumber,
                month: month,
                amount: tenant.rentAmount,
                paid: payment?.paid || false,
                    paymentDate: payment?.date || '-',
                    proofUrl: payment?.proofUrl || ''
            });
        });
    });

    let filteredRecords = allRecords;
    if (monthFilter) {
        filteredRecords = filteredRecords.filter(r => r.month === monthFilter);
    }
    if (statusFilter === 'paid') {
        filteredRecords = filteredRecords.filter(r => r.paid);
    } else if (statusFilter === 'unpaid') {
        filteredRecords = filteredRecords.filter(r => !r.paid);
    }

    container.innerHTML = `
        <div class="rent-table">
            <table>
                <thead>
                    <tr>
                        <th>Tenant Name</th>
                        <th>Room</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                        <th>Proof</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredRecords.map(r => `
                        <tr>
                            <td><strong>${r.tenantName}</strong></td>
                            <td>${r.roomNumber}</td>
                            <td>${formatMonthYear(r.month)}</td>
                            <td>₹${r.amount.toLocaleString('en-IN')}</td>
                            <td>
                                <span class="payment-badge ${r.paid ? 'badge-paid' : 'badge-unpaid'}">
                                    ${r.paid ? '✓ Paid' : '⏳ Unpaid'}
                                </span>
                            </td>
                            <td>${r.paymentDate !== '-' ? new Date(r.paymentDate).toLocaleDateString('en-IN') : '-'}</td>
                            <td>
                                ${r.proofUrl ? `<a href="${r.proofUrl}" target="_blank" rel="noopener" class="btn btn-small btn-secondary">View Proof</a>` : '-'}
                            </td>
                            <td>
                                <button class="btn btn-small btn-primary" onclick="showPaymentModal('${r.tenantId}', '${r.month}')">
                                    ${r.paid ? 'Update' : 'Pay Now'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function filterRentRecords() {
    displayRentRecords();
}

// ===== NOTICE BOARD FUNCTIONS =====
async function loadNotices() {
    try {
        notices = await apiRequest('/notices');
        console.log('Loaded notices:', notices);
    } catch (error) {
        notices = [];
    }
}

function showAddNoticeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📝 Add Notice</h2>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <form class="notice-form" onsubmit="handleNoticeSubmit(event)">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="noticeTitle" class="form-input" placeholder="Enter notice title" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select id="noticeCategory" class="form-select" required>
                        <option value="maintenance">🔧 Maintenance</option>
                        <option value="complaint">⚠️ Complaint</option>
                        <option value="update">📢 Update</option>
                        <option value="announcement">📣 Announcement</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description *</label>
                    <textarea id="noticeContent" class="form-textarea" placeholder="Enter notice details..." required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">📝 Post Notice</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('noticeTitle').focus(), 100);
}

async function handleNoticeSubmit(event) {
    event.preventDefault();
    
    const notice = {
        title: document.getElementById('noticeTitle').value.trim(),
        category: document.getElementById('noticeCategory').value,
        content: document.getElementById('noticeContent').value.trim()
    };

    try {
        await apiRequest('/notices', 'POST', notice);
        showNotification('✅ Notice posted!', 'success');
        await loadNotices();
        displayNotices();
        closeModal();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

async function deleteNotice(id) {
    if (confirm('Delete this notice?')) {
        try {
            await apiRequest(`/notices/${id}`, 'DELETE');
            showNotification('🗑️ Notice deleted!', 'success');
            await loadNotices();
            displayNotices();
        } catch (error) {
            // Error already handled in apiRequest
        }
    }
}

function displayNotices(filterCategory = 'all') {
    const container = document.getElementById('noticesList');
    
    let filtered = notices;
    if (filterCategory !== 'all') {
        filtered = notices.filter(n => n.category === filterCategory);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No notices to display.</p></div>';
        return;
    }

    const categoryIcons = {
        maintenance: '🔧',
        complaint: '⚠️',
        update: '📢',
        announcement: '📣'
    };

    container.innerHTML = filtered.map(n => {
        const noticeId = n._id || n.id;
        return `
            <div class="notice-card">
                <div class="notice-header">
                    <span class="notice-category category-${n.category}">
                        ${categoryIcons[n.category]} ${n.category.toUpperCase()}
                    </span>
                    <h3 class="notice-title">${n.title}</h3>
                    <p class="notice-date">📅 ${new Date(n.date || n.createdAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
                <div class="notice-content">
                    ${n.content}
                </div>
                <div class="notice-footer">
                    <button class="btn btn-small btn-danger" onclick="deleteNotice('${noticeId}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterNotices(category) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayNotices(category);
}

// ===== UTILITY FUNCTIONS =====
function getCurrentMonthYear() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLast6Months() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
}

function getMonthsFromJoinDate(joinDateStr) {
    const months = [];
    const joinDate = new Date(joinDateStr);
    const now = new Date();
    
    let current = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    
    while (current <= now) {
        const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        months.push(monthStr);
        current.setMonth(current.getMonth() + 1);
    }
    
    return months.reverse();
}

function populateMonthFilter() {
    const select = document.getElementById('monthFilter');
    const months = getLast6Months();
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = formatMonthYear(month);
        select.appendChild(option);
    });
}

function generateMonthOptionsForTenant(tenant, selectedMonth) {
    const months = getMonthsFromJoinDate(tenant.joinDate);
    return months.map(month => 
        `<option value="${month}" ${month === selectedMonth ? 'selected' : ''}>${formatMonthYear(month)}</option>`
    ).join('');
}

function formatMonthYear(monthStr) {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

function updateStats() {
    const currentMonth = getCurrentMonthYear();
    document.getElementById('totalTenants').textContent = tenants.length;
    document.getElementById('occupiedRooms').textContent = tenants.length;
    
    let paidCount = 0;
    let unpaidCount = 0;
    
    tenants.forEach(tenant => {
        const isPaid = tenant.rentHistory?.some(r => r.month === currentMonth && r.paid);
        if (isPaid) paidCount++;
        else unpaidCount++;
    });
    
    document.getElementById('paidRent').textContent = paidCount;
    document.getElementById('pendingRent').textContent = unpaidCount;
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

function showNotification(message, type) {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

