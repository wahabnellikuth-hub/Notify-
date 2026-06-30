document.addEventListener('DOMContentLoaded', () => {
    // === UI Elements ===
    const views = document.querySelectorAll('.view');
    const navBtns = document.querySelectorAll('.nav-btn');
    const toast = document.getElementById('toast');

    // Modals
    const modalMember = document.getElementById('modal-member');
    const modalWhatsApp = document.getElementById('modal-whatsapp');
    const modalUpdatePrompt = document.getElementById('modal-update-prompt');

    // State
    let editingProviderId = null;
    let tomorrowProvider = null;
    let tomorrowDateObj = null;

    // === Navigation ===
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = btn.id.replace('nav-', 'view-');
            switchView(viewId);
        });
    });

    function switchView(viewId) {
        views.forEach(view => view.classList.remove('active'));
        navBtns.forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(viewId).classList.add('active');
        document.getElementById(viewId.replace('view-', 'nav-')).classList.add('active');

        if (viewId === 'view-home') renderHome();
        if (viewId === 'view-members') renderMembers();
        if (viewId === 'view-settings') renderSettings();
    }

    // === Helpers ===
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    function getYYYYMMDD(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // === Date & Schedule Logic ===
    // (Legacy date-math removed, now using Queue logic)

    // === Home View ===
    function renderHome() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        tomorrowDateObj = tomorrow;

        document.getElementById('today-date').textContent = formatDate(today);
        document.getElementById('tomorrow-date').textContent = formatDate(tomorrow);

        const settings = Store.getSettings();
        const time12hr = new Date('1970-01-01T' + settings.reminderTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        document.getElementById('display-reminder-time').textContent = time12hr;

        if (!Store.isRegistrationCompleted() || Store.getProviders().length === 0) {
            document.getElementById('provider-name').textContent = "Registration Incomplete";
            document.getElementById('provider-phone').textContent = "Complete setup in Members tab";
            document.getElementById('btn-prepare-msg-home').disabled = true;
            document.getElementById('btn-skip-tomorrow').disabled = true;
            document.getElementById('btn-skip-provider').disabled = true;
            return;
        }

        const providers = Store.getProviders();
        
        const skipDates = Store.getSkipDates();
        const targetStr = getYYYYMMDD(tomorrow);
        const isTomorrowSkipped = skipDates.includes(targetStr);

        const btnPrepare = document.getElementById('btn-prepare-msg-home');
        const btnSkipTomorrow = document.getElementById('btn-skip-tomorrow');
        const btnSkipProvider = document.getElementById('btn-skip-provider');

        if (isTomorrowSkipped) {
            document.getElementById('provider-name').textContent = "No reminder for tomorrow.";
            document.getElementById('provider-phone').textContent = "(Day Skipped)";
            btnPrepare.disabled = true;
            btnSkipTomorrow.disabled = true;
            btnSkipProvider.disabled = true;
            tomorrowProvider = null;
        } else {
            tomorrowProvider = providers[0];
            document.getElementById('provider-name').textContent = tomorrowProvider.name;
            document.getElementById('provider-phone').textContent = tomorrowProvider.phone;
            btnPrepare.disabled = false;
            btnSkipTomorrow.disabled = false;
            btnSkipProvider.disabled = false;
        }

        updateCountdown();
    }

    function updateCountdown() {
        const settings = Store.getSettings();
        const now = new Date();
        const [hours, minutes] = settings.reminderTime.split(':');
        
        let reminderDate = new Date();
        reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (now > reminderDate) {
            // Next reminder is tomorrow
            reminderDate.setDate(reminderDate.getDate() + 1);
        }

        const diff = reminderDate - now;
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('reminder-countdown').textContent = 
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    setInterval(updateCountdown, 1000);

    // Skip Day
    document.getElementById('btn-skip-tomorrow').addEventListener('click', () => {
        if (confirm("Are you sure you want to skip tomorrow's service entirely? The provider queue will NOT advance.")) {
            Store.addSkipDate(getYYYYMMDD(tomorrowDateObj));
            showToast("Tomorrow's service skipped.");
            renderHome();
        }
    });

    // Skip Provider
    document.getElementById('btn-skip-provider').addEventListener('click', () => {
        if (confirm(`Are you sure you want to skip ${tomorrowProvider.name}? They will lose their turn and move to the back.`)) {
            Store.advanceQueue('skipped');
            showToast("Provider skipped.");
            renderHome();
            renderMembers();
        }
    });


    // === Members View ===
    function renderMembers() {
        const listContainer = document.getElementById('members-list');
        const providers = Store.getProviders();
        
        listContainer.innerHTML = '';

        const isCompleted = Store.isRegistrationCompleted() && !Store.hasUnfinalizedChanges();

        if (providers.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No members added yet.</div>';
        } else {
            providers.forEach((provider, index) => {
                const item = document.createElement('div');
                item.className = 'member-item';
                
                // Show status marks if present
                let statusMark = '';
                let statusClass = '';
                if (provider.status === 'sent') {
                    statusMark = `<span class="status-badge sent" title="Sent on ${provider.statusDate}">✅</span>`;
                    statusClass = 'opacity-75';
                } else if (provider.status === 'skipped') {
                    statusMark = `<span class="status-badge skipped" title="Skipped on ${provider.statusDate}">⏭️</span>`;
                    statusClass = 'opacity-75';
                }

                // Show alt phone if exists
                const altPhoneHtml = provider.altPhone ? `<br><small class="text-muted"><i class="fa-solid fa-phone"></i> ${provider.altPhone}</small>` : '';

                // Serial number fallback
                const serialNum = provider.originalIndex || (index + 1);

                item.innerHTML = `
                    <div class="member-sl">${serialNum}</div>
                    <div class="member-info ${statusClass}">
                        <div class="member-name-list">
                            ${provider.name} 
                            ${statusMark}
                        </div>
                        <div class="member-phone-list">${provider.phone} ${altPhoneHtml}</div>
                    </div>
                    ${isCompleted ? '' : `
                    <div class="member-actions">
                        <button class="btn-icon" onclick="moveProvider(${index}, -1)" ${index === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
                        <button class="btn-icon" onclick="moveProvider(${index}, 1)" ${index === providers.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
                        <button class="btn-icon edit" onclick="editProvider('${provider.id}')"><i class="fa-solid fa-pencil"></i></button>
                        <button class="btn-icon delete" onclick="deleteProvider('${provider.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>`}
                `;
                listContainer.appendChild(item);
            });
        }

        const btnComplete = document.getElementById('btn-complete-registration');
        const btnAdd = document.getElementById('btn-add-member');
        const btnEditList = document.getElementById('btn-edit-list');

        if (isCompleted) {
            btnComplete.style.display = 'none';
            if (btnAdd) btnAdd.style.display = 'none';
            if (btnEditList) btnEditList.style.display = 'inline-block';
        } else {
            btnComplete.style.display = providers.length > 0 ? 'block' : 'none';
            if (btnAdd) btnAdd.style.display = 'inline-block';
            if (btnEditList) btnEditList.style.display = 'none';
        }
    }

    // Global expose for inline onclick
    window.moveProvider = function(index, direction) {
        const providers = Store.getProviders();
        if (index + direction < 0 || index + direction >= providers.length) return;
        
        const newProviders = [...providers];
        const temp = newProviders[index];
        newProviders[index] = newProviders[index + direction];
        newProviders[index + direction] = temp;
        
        Store.reorderProviders(newProviders.map(p => p.id));
        checkScheduleUpdate();
        renderMembers();
    };

    window.editProvider = function(id) {
        const provider = Store.getProviders().find(p => p.id === id);
        if (provider) {
            editingProviderId = id;
            document.getElementById('member-name').value = provider.name;
            document.getElementById('member-phone').value = provider.phone;
            document.getElementById('member-alt-phone').value = provider.altPhone || '';
            document.getElementById('modal-member-title').textContent = 'Edit Member';
            modalMember.classList.add('active');
        }
    };

    window.deleteProvider = function(id) {
        if (confirm("Are you sure you want to delete this member?")) {
            Store.deleteProvider(id);
            checkScheduleUpdate();
            renderMembers();
        }
    };

    // Edit List
    document.getElementById('btn-edit-list').addEventListener('click', () => {
        Store.setUnfinalizedChanges(true);
        renderMembers();
    });

    // Add Member
    document.getElementById('btn-add-member').addEventListener('click', () => {
        editingProviderId = null;
        document.getElementById('member-name').value = '';
        document.getElementById('member-phone').value = '';
        document.getElementById('member-alt-phone').value = '';
        document.getElementById('modal-member-title').textContent = 'Add Member';
        modalMember.classList.add('active');
    });

    document.getElementById('btn-cancel-member').addEventListener('click', () => {
        modalMember.classList.remove('active');
    });

    document.getElementById('btn-save-member').addEventListener('click', () => {
        const name = document.getElementById('member-name').value.trim();
        const phone = document.getElementById('member-phone').value.trim();
        const altPhone = document.getElementById('member-alt-phone').value.trim();
        
        if (!name || !phone) {
            alert("Please enter both name and phone number.");
            return;
        }

        if (editingProviderId) {
            Store.updateProvider(editingProviderId, { name, phone, altPhone });
            checkScheduleUpdate();
        } else {
            Store.addProvider({ name, phone, altPhone });
            if (Store.isRegistrationCompleted()) checkScheduleUpdate();
        }
        
        modalMember.classList.remove('active');
        renderMembers();
    });

    function checkScheduleUpdate() {
        Store.setUnfinalizedChanges(true);
    }

    document.getElementById('btn-complete-registration').addEventListener('click', () => {
        if (!Store.isRegistrationCompleted()) {
            Store.setRegistrationCompleted(true);
            Store.setUnfinalizedChanges(false);
            showToast("Registration Complete! Schedule ready.");
            switchView('view-home');
        } else {
            modalUpdatePrompt.classList.add('active');
        }
    });

    // Schedule Update Prompts
    document.getElementById('btn-update-next-rotation').addEventListener('click', () => {
        // No action needed for "Next Rotation" since calculation modulo handles it.
        // The list order just changes for the future automatically.
        Store.setUnfinalizedChanges(false);
        renderMembers();
        modalUpdatePrompt.classList.remove('active');
        showToast("Will apply changes continuously.");
    });

    document.getElementById('btn-update-regenerate').addEventListener('click', () => {
        Store.setUnfinalizedChanges(false);
        renderMembers();
        modalUpdatePrompt.classList.remove('active');
        switchView('view-settings');
        showToast("Please select a new Start Date to regenerate the schedule.");
    });


    // === WhatsApp Modal Flow ===
    document.getElementById('btn-prepare-msg-home').addEventListener('click', () => {
        document.getElementById('wa-provider-name').textContent = tomorrowProvider.name;
        document.getElementById('receivers-breakfast').value = '';
        document.getElementById('receivers-lunch').value = '';
        document.getElementById('receivers-dinner').value = '';
        
        if (tomorrowProvider.altPhone) {
            document.getElementById('btn-open-whatsapp-alt').style.display = 'block';
        } else {
            document.getElementById('btn-open-whatsapp-alt').style.display = 'none';
        }

        modalWhatsApp.classList.add('active');
    });

    document.getElementById('btn-cancel-whatsapp').addEventListener('click', () => {
        modalWhatsApp.classList.remove('active');
    });

    function prepareWhatsAppUrl(phoneStr) {
        const breakfast = document.getElementById('receivers-breakfast').value.trim();
        const lunch = document.getElementById('receivers-lunch').value.trim();
        const dinner = document.getElementById('receivers-dinner').value.trim();

        const template = Store.getSettings().messageTemplate;
        const dateStr = formatDate(tomorrowDateObj);
        
        let message = template
            .replace('{{Date}}', dateStr)
            .replace('{{Breakfast}}', breakfast || '0')
            .replace('{{Lunch}}', lunch || '0')
            .replace('{{Dinner}}', dinner || '0')
            .replace('{{ReceiversCount}}', (parseInt(breakfast || 0) + parseInt(lunch || 0) + parseInt(dinner || 0)).toString());
        
        const phone = phoneStr.replace(/\D/g, ''); // strip non-digits
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }

    document.getElementById('btn-open-whatsapp').addEventListener('click', () => {
        const waUrl = prepareWhatsAppUrl(tomorrowProvider.phone);
        window.open(waUrl, '_blank');
    });

    document.getElementById('btn-open-whatsapp-alt').addEventListener('click', () => {
        const waUrl = prepareWhatsAppUrl(tomorrowProvider.altPhone);
        window.open(waUrl, '_blank');
    });

    document.getElementById('btn-mark-sent').addEventListener('click', () => {
        const today = new Date();
        const todayStr = getYYYYMMDD(today);
        Store.markSent(todayStr);
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'MARK_SENT',
                date: todayStr
            });
        }
        
        // Advance the queue
        Store.advanceQueue('sent');
        showToast("Reminder marked as sent!");
        modalWhatsApp.classList.remove('active');
        renderHome();
        renderMembers();
    });


    // === Settings View ===
    function renderSettings() {
        const settings = Store.getSettings();
        document.getElementById('setting-reminder-time').value = settings.reminderTime;
        document.getElementById('setting-template').value = settings.messageTemplate;
        document.getElementById('setting-organizer-phone').value = settings.organizerNumber || '';
        document.getElementById('setting-start-date').value = Store.getStartDate() || '';
    }

    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const reminderTime = document.getElementById('setting-reminder-time').value;
        const messageTemplate = document.getElementById('setting-template').value;
        const organizerNumber = document.getElementById('setting-organizer-phone').value.trim();
        const startDate = document.getElementById('setting-start-date').value;

        Store.updateSettings({ reminderTime, messageTemplate, organizerNumber });
        if (startDate) {
            Store.setStartDate(startDate);
            Store.setRegistrationCompleted(true);
        }

        // Reschedule notification
        scheduleNextNotification();

        showToast("Settings saved!");
    });

    // Import/Export/Reset
    document.getElementById('btn-export-data').addEventListener('click', () => {
        Store.exportData();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            if (Store.importData(event.target.result)) {
                showToast("Data imported successfully!");
                renderHome();
                renderMembers();
                renderSettings();
            } else {
                alert("Invalid JSON format.");
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('btn-reset-settings').addEventListener('click', () => {
        if (confirm("WARNING: This will reset all your Settings (including the template) back to default. Your member list will NOT be deleted. Are you sure?")) {
            Store.resetSettings();
            showToast("Settings reset.");
            location.reload();
        }
    });

    document.getElementById('btn-reset-members').addEventListener('click', () => {
        if (confirm("WARNING: This will delete ALL members and reset your schedule. Your Settings will remain intact. Are you sure?")) {
            Store.resetMembers();
            showToast("Members list reset.");
            location.reload();
        }
    });

    // === Notifications & PWA ===
    function scheduleNextNotification() {
        if (!("Notification" in window)) return;

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SCHEDULE_NOTIFICATION',
                        time: Store.getSettings().reminderTime,
                        lastSentDate: Store.getLastSentDate()
                    });
                }
            }
        });
    }

    // === Notifications & PWA ===
    function notifyAppOpened() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                const today = new Date();
                const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                if (reg.active) {
                    reg.active.postMessage({
                        type: 'APP_OPENED',
                        date: todayStr
                    });
                }
            });
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            notifyAppOpened();
        }
    });

    // === Global Sync Event ===
    window.addEventListener('store-synced', () => {
        renderHome();
        renderMembers();
        renderSettings();
        // showToast("Data synced from cloud");
    });

    // Initialize App
    renderHome();
    scheduleNextNotification();
    notifyAppOpened();
});
