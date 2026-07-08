const STORAGE_KEY = 'food_service_data';

const DEFAULT_TEMPLATE = `السلام عليكم ورحمة الله وبركاته

നാളെ ({{Date}}) താങ്കളുടെ ഭക്ഷണ സേവനത്തിന്റെ ദിവസമാണ്.

നാളത്തെ ഉസ്താദുമാരുടെ എണ്ണം:
നാസ്ത: *{{Breakfast}}*
ഉച്ച: *{{Lunch}}*
രാത്രി: *{{Dinner}}*

അല്ലാഹു താങ്കളുടെ സേവനം സ്വീകരിക്കുകയും അതിന് അർഹമായ പ്രതിഫലം നൽകുകയും ചെയ്യട്ടെ.

جزاكم الله خيرًا`;

const defaultState = {
    providers: [],
    activeProviderId: null,
    startDate: null,
    skipDates: [], // Array of YYYY-MM-DD
    settings: {
        reminderTime: '20:00', // Default 8 PM
        messageTemplate: DEFAULT_TEMPLATE,
        organizerNumber: '',
        loopTo: 'first', // 'first' or 'custom'
        customStartProviderId: null,
        alarmEnabled: true,
        alarmRepetition: '3' // '1', '3', '5', or 'continuous'
    },
    registrationCompleted: false,
    hasUnfinalizedChanges: false,
    rotationEnded: false,
    lastSentDate: null,
    lastUpdated: 0
};

const FIREBASE_URL = 'https://notify-9aa17-default-rtdb.firebaseio.com/appData.json';

const Store = {
    data: null,

    init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
                // Ensure all default properties exist if upgrading from older version
                this.data = { ...defaultState, ...this.data, settings: { ...defaultState.settings, ...this.data.settings } };
            } catch (e) {
                console.error("Failed to parse store data", e);
                this.data = JSON.parse(JSON.stringify(defaultState));
            }
        } else {
            this.data = JSON.parse(JSON.stringify(defaultState));
        }
        
        // Fetch from Firebase in the background
        this.fetchFromFirebase();
        
        // Poll Firebase periodically for global updates (every 30 seconds)
        setInterval(() => {
            this.fetchFromFirebase();
        }, 30000);
    },

    save() {
        this.data.lastUpdated = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.pushToFirebase();
    },

    async fetchFromFirebase() {
        try {
            const response = await fetch(FIREBASE_URL);
            if (!response.ok) return;
            const data = await response.json();
            
            if (data && typeof data === 'object') {
                const merged = { ...defaultState, ...data };
                merged.providers = data.providers || [];
                merged.skipDates = data.skipDates || [];
                merged.settings = { ...defaultState.settings, ...data.settings };
                
                const localTime = this.data.lastUpdated || 0;
                const remoteTime = data.lastUpdated || 0;
                
                // Only update if remote is newer or same and different
                if (remoteTime >= localTime && JSON.stringify(this.data) !== JSON.stringify(merged)) {
                    this.data = merged;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
                    window.dispatchEvent(new Event('store-synced'));
                } else if (localTime > remoteTime) {
                    // Local is newer, push to Firebase to update it
                    this.pushToFirebase();
                }
            }
        } catch (e) {
            console.error("Firebase fetch failed", e);
        }
    },

    async pushToFirebase() {
        try {
            fetch(FIREBASE_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data)
            }).catch(e => console.error("Firebase push background fail", e));
        } catch (e) {
            console.error("Firebase push failed", e);
        }
    },

    // Providers
    getProviders() {
        return this.data.providers;
    },

    addProvider(provider, insertIndex = null) {
        provider.id = Date.now().toString();
        provider.status = 'pending';
        if (insertIndex !== null && insertIndex >= 0 && insertIndex < this.data.providers.length) {
            this.data.providers.splice(insertIndex, 0, provider);
        } else {
            this.data.providers.push(provider);
        }
        if (this.data.providers.length === 1) {
            this.data.activeProviderId = provider.id;
        }
        this.save();
        return provider;
    },

    updateProvider(id, updatedProvider) {
        const index = this.data.providers.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.providers[index] = { ...this.data.providers[index], ...updatedProvider };
            this.save();
        }
    },

    deleteProvider(id) {
        this.data.providers = this.data.providers.filter(p => p.id !== id);
        if (this.data.activeProviderId === id) {
            this.data.activeProviderId = null;
        }
        this.save();
    },

    reorderProviders(newOrderIds) {
        const newProviders = [];
        newOrderIds.forEach(id => {
            const provider = this.data.providers.find(p => p.id === id);
            if (provider) newProviders.push(provider);
        });
        this.data.providers = newProviders;
        this.save();
    },

    getActiveProvider() {
        if (!this.data.providers || this.data.providers.length === 0) return null;
        
        let active = null;
        if (this.data.activeProviderId) {
            active = this.data.providers.find(p => p.id === this.data.activeProviderId);
        }
        
        if (!active) {
            // Default to custom start if set, else first non-paused person
            if (this.data.settings.customStartProviderId) {
                const customStart = this.data.providers.find(p => p.id === this.data.settings.customStartProviderId);
                if (customStart && !customStart.isPaused) active = customStart;
            }
            if (!active) active = this.data.providers.find(p => !p.isPaused);
            
            if (active) {
                this.data.activeProviderId = active.id;
                this.save();
            }
        } else if (active.isPaused) {
            // The currently active provider was paused, find the next unpaused provider
            let currentIndex = this.data.providers.findIndex(p => p.id === active.id);
            let loopCount = 0;
            let nextIndex = currentIndex;
            do {
                nextIndex++;
                if (nextIndex >= this.data.providers.length) {
                    if (this.data.settings.loopTo === 'custom' && this.data.settings.customStartProviderId) {
                        const customIndex = this.data.providers.findIndex(p => p.id === this.data.settings.customStartProviderId);
                        nextIndex = customIndex !== -1 ? customIndex : 0;
                    } else {
                        nextIndex = 0;
                    }
                }
                loopCount++;
                if (loopCount > this.data.providers.length + 1) break;
            } while (this.data.providers[nextIndex] && this.data.providers[nextIndex].isPaused);
            
            active = this.data.providers[nextIndex];
            if (active && !active.isPaused) {
                this.data.activeProviderId = active.id;
                this.save();
            } else {
                active = null;
            }
        }
        return active;
    },

    advanceQueue(status) {
        if (this.data.providers.length > 0) {
            let currentProvider = null;
            if (this.data.activeProviderId) {
                currentProvider = this.data.providers.find(p => p.id === this.data.activeProviderId);
            }
            if (!currentProvider) return;

            let currentIndex = this.data.providers.findIndex(p => p.id === currentProvider.id);
            if (currentIndex === -1) currentIndex = 0;
            
            const provider = this.data.providers[currentIndex];
            if (status !== 'pending' && provider) {
                provider.status = status;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const todayStr = days[new Date().getDay()];
                provider.statusDate = todayStr;
            }

            let nextIndex = currentIndex;
            let loopCount = 0;
            let found = false;
            
            while (loopCount < this.data.providers.length) {
                nextIndex++;
                if (nextIndex >= this.data.providers.length) {
                    break;
                }
                if (!this.data.providers[nextIndex].isPaused) {
                    found = true;
                    break;
                }
                loopCount++;
            }
            
            if (!found) {
                this.data.rotationEnded = true;
                this.data.activeProviderId = null;
            } else {
                const nextProvider = this.data.providers[nextIndex];
                this.data.activeProviderId = nextProvider.id;
                nextProvider.status = 'pending';
                delete nextProvider.statusDate;
            }

            this.save();
        }
    },

    restartRotation() {
        this.data.rotationEnded = false;
        
        let nextIndex;
        if (this.data.settings.loopTo === 'custom' && this.data.settings.customStartProviderId) {
            const customIndex = this.data.providers.findIndex(p => p.id === this.data.settings.customStartProviderId);
            nextIndex = customIndex !== -1 ? customIndex : 0;
        } else {
            nextIndex = 0;
        }

        let loopCount = 0;
        while (this.data.providers[nextIndex] && this.data.providers[nextIndex].isPaused) {
            nextIndex++;
            if (nextIndex >= this.data.providers.length) nextIndex = 0;
            loopCount++;
            if (loopCount > this.data.providers.length) break;
        }

        const nextProvider = this.data.providers[nextIndex];
        if (nextProvider && !nextProvider.isPaused) {
            this.data.activeProviderId = nextProvider.id;
            nextProvider.status = 'pending';
            delete nextProvider.statusDate;
        }
        
        this.data.providers.forEach(p => {
            if (p.id !== this.data.activeProviderId) {
                p.status = 'pending';
                delete p.statusDate;
            }
        });

        this.save();
    },
    
    togglePauseProvider(id) {
        const index = this.data.providers.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.providers[index].isPaused = !this.data.providers[index].isPaused;
            if (this.data.providers[index].isPaused && this.data.activeProviderId === id) {
                this.advanceQueue('pending');
            } else if (!this.data.providers[index].isPaused) {
                // If unpausing, check if they should become active again
                if (this.data.activeProviderId) {
                    const activeIndex = this.data.providers.findIndex(p => p.id === this.data.activeProviderId);
                    if (index < activeIndex && this.data.providers[index].status === 'pending') {
                        this.data.activeProviderId = id;
                    }
                } else if (this.data.rotationEnded) {
                    this.data.activeProviderId = id;
                    this.data.rotationEnded = false;
                }
                this.save();
            } else {
                this.save();
            }
        }
    },

    undoSendProvider(id) {
        const provider = this.data.providers.find(p => p.id === id);
        if (provider) {
            provider.status = 'pending';
            delete provider.statusDate;
            
            if (this.data.rotationEnded) {
                this.data.rotationEnded = false;
            }
            
            this.data.activeProviderId = id;
            this.save();
        }
    },

    // State
    getStartDate() {
        return this.data.startDate;
    },

    setStartDate(dateStr) {
        this.data.startDate = dateStr;
        this.save();
    },

    getSkipDates() {
        return this.data.skipDates || [];
    },

    addSkipDate(dateStr) {
        if (!this.data.skipDates) this.data.skipDates = [];
        if (!this.data.skipDates.includes(dateStr)) {
            this.data.skipDates.push(dateStr);
            this.save();
        }
    },

    isRegistrationCompleted() {
        return this.data.registrationCompleted;
    },

    setRegistrationCompleted(status) {
        this.data.registrationCompleted = status;
        this.save();
    },

    hasUnfinalizedChanges() {
        return this.data.hasUnfinalizedChanges;
    },

    isRotationEnded() {
        return this.data.rotationEnded;
    },

    setUnfinalizedChanges(value) {
        this.data.hasUnfinalizedChanges = value;
        if (value) {
            this.data.rotationEnded = false;
        }
        this.save();
    },

    getLastSentDate() {
        return this.data.lastSentDate;
    },

    markSent(dateStr) {
        this.data.lastSentDate = dateStr;
        this.save();
    },

    // Settings
    getSettings() {
        return this.data.settings;
    },

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    },

    // Export/Import
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `food-service-backup-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (parsed.providers && Array.isArray(parsed.providers)) {
                this.data = { ...defaultState, ...parsed };
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Invalid JSON", e);
            return false;
        }
    },

    resetSettings() {
        const currentTemplate = this.data.settings.messageTemplate;
        this.data.settings = JSON.parse(JSON.stringify(defaultState.settings));
        this.data.settings.messageTemplate = currentTemplate;
        this.save();
    },

    resetMembers() {
        this.data.providers = [];
        this.data.activeProviderId = null;
        this.data.startDate = null;
        this.data.skipDates = [];
        this.data.registrationCompleted = false;
        this.data.hasUnfinalizedChanges = false;
        this.save();
    },
    
    resetToStartPerson() {
        const customId = this.data.settings.customStartProviderId;
        if (customId && this.data.providers.find(p => p.id === customId)) {
            this.data.activeProviderId = customId;
        } else if (this.data.providers.length > 0) {
            this.data.activeProviderId = this.data.providers[0].id;
        }
        
        if (this.data.activeProviderId) {
            const active = this.data.providers.find(p => p.id === this.data.activeProviderId);
            if (active) {
                active.status = 'pending';
                delete active.statusDate;
            }
        }
        this.save();
    }
};

// Initialize Store
Store.init();
