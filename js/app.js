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
    function calculateProviderForDate(targetDate) {
        const providers = Store.getProviders();
        const startDateStr = Store.getStartDate();
        
        if (!startDateStr || providers.length === 0) return null;

        // Use UTC midnight to avoid timezone daylight saving issues
        const start = new Date(startDateStr + 'T00:00:00');
        const target = new Date(getYYYYMMDD(targetDate) + 'T00:00:00');
        
        if (target < start) return null; // Date is before rotation started

        // Total days between start and target
        const diffTime = Math.abs(target - start);
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Subtract skipped dates that fall between start and target
        const skipDates = Store.getSkipDates();
        let skipsToDeduct = 0;
        
        for (let dateStr of skipDates) {
            const skipDate = new Date(dateStr + 'T00:00:00');
            if (skipDate >= start && skipDate <= target) {
                skipsToDeduct++;
            }
        }

        // Check if target date itself is skipped
        const targetStr = getYYYYMMDD(targetDate);
        if (skipDates.includes(targetStr)) {
            return { skipped: true };
        }

        const effectiveDays = totalDays - skipsToDeduct;
        const providerIndex = effectiveDays % providers.length;
        
        return providers[providerIndex];
    }

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

        if (!Store.isRegistrationCompleted() || Store.getProviders().length === 0 || !Store.getStartDate()) {
            document.getElementById('provider-name').textContent = "Registration Incomplete";
            document.getElementById('provider-phone').textContent = "Complete setup in Members tab";
            document.getElementById('btn-prepare-msg-home').disabled = true;
            document.getElementById('btn-skip-tomorrow').disabled = true;
            return;
        }

        tomorrowProvider = calculateProviderForDate(tomorrow);

        const btnPrepare = document.getElementById('btn-prepare-msg-home');
        const btnSkip = document.getElementById('btn-skip-tomorrow');

        if (tomorrowProvider && tomorrowProvider.skipped) {
            document.getElementById('provider-name').textContent = "No reminder for tomorrow.";
            document.getElementById('provider-phone').textContent = "(Service Skipped)";
            btnPrepare.disabled = true;
            btnSkip.disabled = true;
        } else if (tomorrowProvider) {
            document.getElementById('provider-name').textContent = tomorrowProvider.name;
            document.getElementById('provider-phone').textContent = tomorrowProvider.phone;
            btnPrepare.disabled = false;
            btnSkip.disabled = false;
        } else {
            document.getElementById('provider-name').textContent = "Not Started Yet";
            document.getElementById('provider-phone').textContent = `Starts on ${Store.getStartDate()}`;
            btnPrepare.disabled = true;
            btnSkip.disabled = true;
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

    // Skip Tomorrow
    document.getElementById('btn-skip-tomorrow').addEventListener('click', () => {
        if (confirm("Are you sure you want to skip tomorrow's service? The rotation will move to the next day.")) {
            Store.addSkipDate(getYYYYMMDD(tomorrowDateObj));
            showToast("Tomorrow's service skipped.");
            renderHome();
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
                item.innerHTML = `
                    <div class="member-sl">${index + 1}</div>
                    <div class="member-info">
                        <div class="member-name-list">${provider.name}</div>
                        <div class="member-phone-list">${provider.phone}</div>
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
        document.getElementById('modal-member-title').textContent = 'Add Member';
        modalMember.classList.add('active');
    });

    document.getElementById('btn-cancel-member').addEventListener('click', () => {
        modalMember.classList.remove('active');
    });

    document.getElementById('btn-save-member').addEventListener('click', () => {
        const name = document.getElementById('member-name').value.trim();
        const phone = document.getElementById('member-phone').value.trim();
        
        if (!name || !phone) {
            alert("Please enter both name and phone number.");
            return;
        }

        if (editingProviderId) {
            Store.updateProvider(editingProviderId, { name, phone });
            checkScheduleUpdate();
        } else {
            Store.addProvider({ name, phone });
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
            const today = new Date();
            Store.setStartDate(getYYYYMMDD(today));
            document.getElementById('setting-start-date').value = getYYYYMMDD(today);
            Store.setUnfinalizedChanges(false);
            showToast("Registration Complete! Schedule generated.");
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
        document.getElementById('receivers-count').value = '';
        modalWhatsApp.classList.add('active');
    });

    document.getElementById('btn-cancel-whatsapp').addEventListener('click', () => {
        modalWhatsApp.classList.remove('active');
    });

    document.getElementById('btn-open-whatsapp').addEventListener('click', () => {
        const count = document.getElementById('receivers-count').value.trim();
        if (!count) {
            alert("Please enter the number of receivers.");
            return;
        }

        const template = Store.getSettings().messageTemplate;
        const dateStr = formatDate(tomorrowDateObj);
        
        let message = template
            .replace('{{Date}}', dateStr)
            .replace('{{ReceiversCount}}', count);
        
        const phone = tomorrowProvider.phone.replace(/\D/g, ''); // strip non-digits
        
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    });

    document.getElementById('btn-alert-organizer').addEventListener('click', () => {
        const count = document.getElementById('receivers-count').value.trim();
        if (!count) {
            alert("Please enter the number of receivers.");
            return;
        }

        const settings = Store.getSettings();
        if (!settings.organizerNumber) {
            alert("Please set the Organizer's WhatsApp Number in Settings first.");
            return;
        }

        const dateStr = formatDate(tomorrowDateObj);
        
        let message = `*Food Service Reminder Alert*\n\nTomorrow (${dateStr})'s provider is *${tomorrowProvider.name}* (${tomorrowProvider.phone}).\n\nReceivers count: ${count}.`;
        
        const phone = settings.organizerNumber.replace(/\D/g, ''); // strip non-digits
        
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    });

    document.getElementById('btn-mark-sent').addEventListener('click', () => {
        showToast("Reminder marked as sent!");
        modalWhatsApp.classList.remove('active');
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

    document.getElementById('btn-reset-data').addEventListener('click', () => {
        if (confirm("WARNING: This will delete ALL data. Are you sure?")) {
            Store.resetData();
            showToast("All data reset.");
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
                        time: Store.getSettings().reminderTime
                    });
                }
            }
        });
    }

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
});
