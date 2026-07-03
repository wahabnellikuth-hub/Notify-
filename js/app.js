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

        const activeCard = document.getElementById('active-provider-card');
        const actionsCard = document.getElementById('active-provider-actions');
        const completeCard = document.getElementById('rotation-complete-card');
        const btnPrepare = document.getElementById('btn-prepare-msg-home');
        const btnSkipTomorrow = document.getElementById('btn-skip-tomorrow');
        const btnSkipProvider = document.getElementById('btn-skip-provider');

        if (!Store.isRegistrationCompleted() || Store.getProviders().length === 0) {
            completeCard.style.display = 'none';
            activeCard.style.display = 'block';
            actionsCard.style.display = 'block';
            
            document.getElementById('provider-name').textContent = "Registration Incomplete";
            document.getElementById('provider-phone').textContent = "Complete setup in Members tab";
            btnPrepare.disabled = true;
            btnSkipTomorrow.disabled = true;
            btnSkipProvider.disabled = true;
            return;
        }

        if (Store.isRotationEnded()) {
            completeCard.style.display = 'block';
            activeCard.style.display = 'none';
            actionsCard.style.display = 'none';
            return;
        } else {
            completeCard.style.display = 'none';
            activeCard.style.display = 'block';
            actionsCard.style.display = 'block';
        }

        const skipDates = Store.getSkipDates();
        const targetStr = getYYYYMMDD(tomorrow);
        const isTomorrowSkipped = skipDates.includes(targetStr);

        if (isTomorrowSkipped) {
            document.getElementById('provider-name').textContent = "No reminder for tomorrow.";
            document.getElementById('provider-phone').textContent = "(Day Skipped)";
            btnPrepare.disabled = true;
            btnSkipTomorrow.disabled = true;
            btnSkipProvider.disabled = true;
            tomorrowProvider = null;
        } else {
            tomorrowProvider = Store.getActiveProvider();
            document.getElementById('provider-name').textContent = tomorrowProvider ? tomorrowProvider.name : "None";
            document.getElementById('provider-phone').textContent = tomorrowProvider ? tomorrowProvider.phone : "--";
            btnPrepare.disabled = !tomorrowProvider;
            btnSkipTomorrow.disabled = false;
            btnSkipProvider.disabled = !tomorrowProvider;
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

    // Rotation Completion Actions
    document.getElementById('btn-restart-rotation')?.addEventListener('click', () => {
        Store.restartRotation();
        showToast("Rotation restarted with the same members.");
        renderHome();
        renderMembers();
    });

    document.getElementById('btn-edit-rotation')?.addEventListener('click', () => {
        Store.setUnfinalizedChanges(true);
        showToast("List unlocked for changes. Finalize when done.");
        switchView('view-members');
    });

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
        const activeProvider = Store.getActiveProvider();
        
        let currentDate = null;
        let skipDates = [];
        if (isCompleted) {
            let startDateStr = Store.getStartDate();
            currentDate = startDateStr ? new Date(startDateStr) : new Date();
            skipDates = Store.getSkipDates();
        }

        if (providers.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No members added yet.</div>';
        } else {
            providers.forEach((provider, index) => {
                let scheduledDateHtml = '';
                if (isCompleted && !provider.isPaused) {
                    while (skipDates.includes(getYYYYMMDD(currentDate))) {
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                    const dateStr = formatDate(currentDate);
                    scheduledDateHtml = ` <span style="font-size: 0.85rem; color: var(--primary-color);">(${dateStr})</span>`;
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                const item = document.createElement('div');
                item.className = 'member-item';
                
                const isActive = activeProvider && provider.id === activeProvider.id;
                
                // Show status marks if present
                let statusMark = '';
                let statusClass = provider.isPaused ? 'opacity-50' : '';
                if (provider.isPaused) {
                    statusMark = `<span class="status-badge" style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;"><i class="fa-solid fa-pause"></i> Paused</span>`;
                } else if (isActive) {
                    statusMark = `<span class="status-badge" style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">Next</span>`;
                } else if (provider.status === 'sent') {
                    statusMark = `<span class="status-badge sent" title="Sent on ${provider.statusDate}">✅</span>`;
                    statusClass = 'opacity-75';
                } else if (provider.status === 'skipped') {
                    statusMark = `<span class="status-badge skipped" title="Skipped on ${provider.statusDate}">⏭️</span>`;
                    statusClass = 'opacity-75';
                }

                // Show alt phone if exists
                const altPhoneHtml = provider.altPhone ? `<br><small class="text-muted"><i class="fa-solid fa-phone"></i> ${provider.altPhone}</small>` : '';

                // Sequential serial number
                const serialNum = index + 1;

                item.innerHTML = `
                    <div class="member-sl">${serialNum}</div>
                    <div class="member-info ${statusClass}">
                        <div class="member-name-list">
                            ${provider.name} ${scheduledDateHtml}
                            ${statusMark}
                        </div>
                        <div class="member-phone-list">${provider.phone} ${altPhoneHtml}</div>
                    </div>
                    ${isCompleted ? `
                    <div class="member-actions">
                        <button class="btn-icon" onclick="togglePauseProvider('${provider.id}')" title="${provider.isPaused ? 'Resume' : 'Pause'}">
                            <i class="fa-solid ${provider.isPaused ? 'fa-play' : 'fa-pause'}"></i>
                        </button>
                    </div>` : `
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
        const btnExportSchedule = document.getElementById('btn-export-schedule');

        if (isCompleted) {
            btnComplete.style.display = 'none';
            if (btnAdd) btnAdd.style.display = 'none';
            if (btnEditList) btnEditList.style.display = 'inline-block';
            if (btnExportSchedule) btnExportSchedule.style.display = 'block';
        } else {
            btnComplete.style.display = providers.length > 0 ? 'block' : 'none';
            if (btnAdd) btnAdd.style.display = 'inline-block';
            if (btnEditList) btnEditList.style.display = 'none';
            if (btnExportSchedule) btnExportSchedule.style.display = 'none';
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

    window.togglePauseProvider = function(id) {
        Store.togglePauseProvider(id);
        renderHome();
        renderMembers();
    };

    window.editProvider = function(id) {
        const provider = Store.getProviders().find(p => p.id === id);
        if (provider) {
            editingProviderId = id;
            document.getElementById('member-name').value = provider.name;
            document.getElementById('member-phone').value = provider.phone;
            document.getElementById('member-alt-phone').value = provider.altPhone || '';
            
            const positionGroup = document.getElementById('group-insert-position');
            const positionSelect = document.getElementById('member-position');
            positionSelect.innerHTML = '';
            
            const providers = Store.getProviders();
            const currentIndex = providers.findIndex(p => p.id === id);
            
            for (let i = 0; i < providers.length; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i + 1;
                if (i === currentIndex) {
                    opt.selected = true;
                }
                positionSelect.appendChild(opt);
            }
            positionGroup.style.display = 'block';
            
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
        
        const positionGroup = document.getElementById('group-insert-position');
        const positionSelect = document.getElementById('member-position');
        positionSelect.innerHTML = '';
        
        const providers = Store.getProviders();
        for (let i = 0; i <= providers.length; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            if (i === providers.length) {
                opt.textContent = `${i + 1} (At the End)`;
            } else {
                opt.textContent = i + 1;
            }
            positionSelect.appendChild(opt);
        }
        positionSelect.value = providers.length;
        positionGroup.style.display = 'block';

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
        const position = parseInt(document.getElementById('member-position').value, 10);
        
        if (!name || !phone) {
            alert("Please enter both name and phone number.");
            return;
        }

        if (editingProviderId) {
            Store.updateProvider(editingProviderId, { name, phone, altPhone });
            
            const currentProviders = Store.getProviders();
            const oldIndex = currentProviders.findIndex(p => p.id === editingProviderId);
            if (oldIndex !== position && oldIndex !== -1 && position >= 0 && position < currentProviders.length) {
                const newProviders = [...currentProviders];
                const [movedProvider] = newProviders.splice(oldIndex, 1);
                newProviders.splice(position, 0, movedProvider);
                Store.reorderProviders(newProviders.map(p => p.id));
            }
            
            checkScheduleUpdate();
        } else {
            Store.addProvider({ name, phone, altPhone }, position);
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

    document.getElementById('btn-export-schedule')?.addEventListener('click', () => {
        const providers = Store.getProviders();
        if (providers.length === 0) {
            showToast("No members to export.");
            return;
        }

        let startDateStr = Store.getStartDate();
        let currentDate = startDateStr ? new Date(startDateStr) : new Date();
        const skipDates = Store.getSkipDates();
        
        let csvContent = "Serial Number,Name,Primary Number,Alternative Number,Scheduled Date\n";
        
        providers.forEach((provider, index) => {
            if (provider.isPaused) return; // Skip paused members from export
            
            while (skipDates.includes(getYYYYMMDD(currentDate))) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            const dateStr = formatDate(currentDate);
            const escapeCSV = (str) => '"' + String(str).replace(/"/g, '""') + '"';
            csvContent += `${index + 1},${escapeCSV(provider.name)},${escapeCSV(provider.phone)},${escapeCSV(provider.altPhone || '')},${escapeCSV(dateStr)}\n`;
            currentDate.setDate(currentDate.getDate() + 1);
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `food_service_schedule_${getYYYYMMDD(new Date())}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Schedule exported successfully!");
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

    document.getElementById('btn-cancel-update').addEventListener('click', () => {
        modalUpdatePrompt.classList.remove('active');
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

    function executeSendAndMark() {
        const today = new Date();
        const todayStr = getYYYYMMDD(today);
        Store.markSent(todayStr);
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'MARK_SENT',
                date: todayStr
            });
        }
        
        Store.advanceQueue('sent');
        showToast("Reminder marked as sent!");
        modalWhatsApp.classList.remove('active');
        renderHome();
        renderMembers();
    }

    document.getElementById('btn-open-whatsapp').addEventListener('click', () => {
        const waUrl = prepareWhatsAppUrl(tomorrowProvider.phone);
        window.open(waUrl, '_blank');
        executeSendAndMark();
    });

    document.getElementById('btn-open-whatsapp-alt').addEventListener('click', () => {
        const waUrl = prepareWhatsAppUrl(tomorrowProvider.altPhone);
        window.open(waUrl, '_blank');
        executeSendAndMark();
    });

    document.getElementById('btn-mark-sent').addEventListener('click', () => {
        executeSendAndMark();
    });


    // === Settings View ===
    function renderSettings() {
        const settings = Store.getSettings();
        document.getElementById('setting-reminder-time').value = settings.reminderTime;
        document.getElementById('setting-template').value = settings.messageTemplate;
        document.getElementById('setting-organizer-phone').value = settings.organizerNumber || '';
        document.getElementById('setting-start-date').value = Store.getStartDate() || '';
        
        const customStartSelect = document.getElementById('setting-custom-start');
        customStartSelect.innerHTML = '<option value="">Default (First Person)</option>';
        Store.getProviders().forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            customStartSelect.appendChild(opt);
        });
        customStartSelect.value = settings.customStartProviderId || '';
        
        document.getElementById('setting-loop-to').value = settings.loopTo || 'beginning';
        
        // Local device setting
        document.getElementById('setting-is-organizer').checked = localStorage.getItem('food_service_is_organizer') === 'true';
        updateNotificationStatusUI();
    }

    function updateNotificationStatusUI() {
        const statusEl = document.getElementById('notification-status');
        if (!statusEl) return;
        
        if (!("Notification" in window)) {
            statusEl.innerHTML = '<span style="color: #dc3545;"><i class="fa-solid fa-triangle-exclamation"></i> Not supported on this browser/device.</span>';
            return;
        }

        const isOrganizer = localStorage.getItem('food_service_is_organizer') === 'true';
        if (!isOrganizer) {
            statusEl.innerHTML = 'Notifications are currently <strong>Off</strong> for this device.';
            return;
        }

        if (Notification.permission === 'granted') {
            const time = Store.getSettings().reminderTime;
            const time12hr = new Date('1970-01-01T' + time).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            statusEl.innerHTML = `<span style="color: #198754;"><i class="fa-solid fa-check-circle"></i> Active! You will be notified daily at ${time12hr}.</span>`;
        } else if (Notification.permission === 'denied') {
            statusEl.innerHTML = '<span style="color: #dc3545;"><i class="fa-solid fa-ban"></i> Blocked by your browser. Please enable them in site settings.</span>';
        } else {
            statusEl.innerHTML = '<span style="color: #fd7e14;"><i class="fa-solid fa-circle-info"></i> Permission required. Save settings to prompt.</span>';
        }
    }

    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const reminderTime = document.getElementById('setting-reminder-time').value;
        const messageTemplate = document.getElementById('setting-template').value;
        const organizerNumber = document.getElementById('setting-organizer-phone').value.trim();
        const startDate = document.getElementById('setting-start-date').value;
        const customStartProviderId = document.getElementById('setting-custom-start').value;
        const loopTo = document.getElementById('setting-loop-to').value;
        const isOrganizer = document.getElementById('setting-is-organizer').checked;

        Store.updateSettings({ reminderTime, messageTemplate, organizerNumber, customStartProviderId, loopTo });
        if (startDate) {
            Store.setStartDate(startDate);
            Store.setRegistrationCompleted(true);
        }
        
        // Save local setting
        localStorage.setItem('food_service_is_organizer', isOrganizer ? 'true' : 'false');

        // Reschedule notification
        scheduleNextNotification();

        showToast("Settings saved!");
    });

    document.getElementById('btn-force-start').addEventListener('click', () => {
        if (confirm("This will change the current turn to the Rotation Start Person. Are you sure?")) {
            Store.resetToStartPerson();
            showToast("Turn reset to Start Person");
            renderHome();
            renderMembers();
        }
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
        if (confirm("WARNING: This will reset all your Settings back to default (except your custom WhatsApp template). Your member list will NOT be deleted. Are you sure?")) {
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
        
        const isOrganizer = localStorage.getItem('food_service_is_organizer') === 'true';
        if (!isOrganizer) {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CANCEL_NOTIFICATION' });
            }
            return;
        }

        Notification.requestPermission().then(permission => {
            updateNotificationStatusUI();
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
