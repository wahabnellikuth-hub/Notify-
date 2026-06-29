const STORAGE_KEY = 'food_service_data';

const DEFAULT_TEMPLATE = `السلام عليكم ورحمة الله وبركاته

നാളെ ({{Date}}) താങ്കളുടെ ഭക്ഷണ സേവനത്തിന്റെ ദിവസമാണ്.

നാളത്തെ ഉസ്താദുമാരുടെ എണ്ണം:
*{{ReceiversCount}}*

അല്ലാഹു താങ്കളുടെ സേവനം സ്വീകരിക്കുകയും അതിന് അർഹമായ പ്രതിഫലം നൽകുകയും ചെയ്യട്ടെ.

جزاكم الله خيرًا`;

const defaultState = {
    providers: [],
    startDate: null,
    skipDates: [], // Array of YYYY-MM-DD
    settings: {
        reminderTime: '20:00', // Default 8 PM
        messageTemplate: DEFAULT_TEMPLATE,
        organizerNumber: ''
    },
    registrationCompleted: false,
    hasUnfinalizedChanges: false,
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

    addProvider(provider) {
        provider.id = Date.now().toString();
        this.data.providers.push(provider);
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
        return this.data.hasUnfinalizedChanges || false;
    },

    setUnfinalizedChanges(status) {
        this.data.hasUnfinalizedChanges = status;
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

    resetData() {
        this.data = JSON.parse(JSON.stringify(defaultState));
        this.save();
    }
};

// Initialize Store
Store.init();
