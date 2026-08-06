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
    providers: [
    {
        "id": "17860143824141",
        "name": "Shukkoor Ka Kk",
        "phone": "9946656351",
        "status": "pending"
    },
    {
        "id": "17860143824142",
        "name": "Salam ka Nalakath (Hous)",
        "phone": "+91 97441 33363",
        "status": "pending"
    },
    {
        "id": "17860143824143",
        "name": "Rasheed ka Nalakath",
        "phone": "+971 50 825 9079",
        "status": "pending"
    },
    {
        "id": "17860143824144",
        "name": "Ali ka Pp",
        "phone": "+91 98478 80168",
        "status": "pending"
    },
    {
        "id": "17860143824145",
        "name": "Hamza Haji C",
        "phone": "+91 90742 76406",
        "status": "pending"
    },
    {
        "id": "17860143824146",
        "name": "Swamad C",
        "phone": "+91 75589 90139",
        "status": "pending"
    },
    {
        "id": "17860143824147",
        "name": "Rasheed KS",
        "phone": "8157973858",
        "status": "pending"
    },
    {
        "id": "17860143824148",
        "name": "Shafi KS",
        "phone": "+91 94964 06047",
        "status": "pending"
    },
    {
        "id": "17860143824149",
        "name": "Anfal Ks",
        "phone": "7907662471",
        "status": "pending"
    },
    {
        "id": "178601438241410",
        "name": "Hamza Musliyar .PP",
        "phone": "9562157005",
        "status": "pending"
    },
    {
        "id": "178601438241411",
        "name": "Abdul Qadir.PP",
        "phone": "+91 82811 80644",
        "status": "pending"
    },
    {
        "id": "178601438241412",
        "name": "Shajeer ks",
        "phone": "+91 75109 94667",
        "status": "pending"
    },
    {
        "id": "178601438241413",
        "name": "Abbas Ks",
        "phone": "+91 88484 76956",
        "status": "pending"
    },
    {
        "id": "178601438241414",
        "name": "Muhammad Ali Cp",
        "phone": "+91 96058 78643",
        "status": "pending"
    },
    {
        "id": "178601438241415",
        "name": "Muhammad kutti PP",
        "phone": "+91 96459 05911",
        "status": "pending"
    },
    {
        "id": "178601438241416",
        "name": "Naushad.Pp",
        "phone": "+91 89215 15605",
        "status": "pending"
    },
    {
        "id": "178601438241417",
        "name": "Ibrahim.Pp",
        "phone": "+91 98471 76103",
        "status": "pending"
    },
    {
        "id": "178601438241418",
        "name": "Hamzu .Pp",
        "phone": "+91 79091 24032",
        "status": "pending"
    },
    {
        "id": "178601438241419",
        "name": "Kunchu Hamzu.PP",
        "phone": "9544524565",
        "status": "pending"
    },
    {
        "id": "178601438241420",
        "name": "Muhammad.PP",
        "phone": "91 9562400146",
        "status": "pending"
    },
    {
        "id": "178601438241421",
        "name": "Shaukath.m(Mubaris)",
        "phone": "+91 90485 26609",
        "status": "pending"
    },
    {
        "id": "178601438241422",
        "name": "Muhammad Ali.P",
        "phone": "9847948696",
        "status": "pending"
    },
    {
        "id": "178601438241423",
        "name": "Saleem N.",
        "phone": "+91 75940 00337",
        "status": "pending"
    },
    {
        "id": "178601438241424",
        "name": "Basheer.N(shahabad)",
        "phone": "+91 95447 61059",
        "status": "pending"
    },
    {
        "id": "178601438241425",
        "name": "Latheef.pp (Muthu)",
        "phone": "+91 98478 58371",
        "status": "pending"
    },
    {
        "id": "178601438241426",
        "name": "Hakeem PP",
        "phone": "+91 95267 92390",
        "status": "pending"
    },
    {
        "id": "178601438241427",
        "name": "Jabir PP",
        "phone": "+91 97474 60543",
        "status": "pending"
    },
    {
        "id": "178601438241428",
        "name": "Ishaque PP",
        "phone": "+91 99471 14321",
        "status": "pending"
    },
    {
        "id": "178601438241429",
        "name": "Ubaid KS",
        "phone": "+91 86067 21715",
        "status": "pending"
    },
    {
        "id": "178601438241430",
        "name": "Salam KS",
        "phone": "91 94472 06893",
        "status": "pending"
    },
    {
        "id": "178601438241431",
        "name": "Abdul Kareem",
        "phone": "+91 98475 48281",
        "status": "pending"
    },
    {
        "id": "178601438241432",
        "name": "Nusrath (ajvad)",
        "phone": "9544343163",
        "status": "pending"
    },
    {
        "id": "178601438241433",
        "name": "Nisar .K",
        "phone": "8113094348",
        "status": "pending"
    },
    {
        "id": "178601438241434",
        "name": "Faisal .Pp",
        "phone": "9747769905",
        "status": "pending"
    },
    {
        "id": "178601438241435",
        "name": "Ashraf.Kk",
        "phone": "7593075611",
        "status": "pending"
    },
    {
        "id": "178601438241436",
        "name": "Shareef KS",
        "phone": "+91 75580 02301",
        "status": "pending"
    },
    {
        "id": "178601438241437",
        "name": "Shabeeb Saqufi",
        "phone": "+91 97462 44565",
        "status": "pending"
    },
    {
        "id": "178601438241438",
        "name": "Basheer PP(ijaz)",
        "phone": "+91 99469 86742",
        "status": "pending"
    },
    {
        "id": "178601438241439",
        "name": "Ali haji ks",
        "phone": "+91 94008 93291",
        "status": "pending"
    },
    {
        "id": "178601438241440",
        "name": "Rafi ks",
        "phone": "+91 98468 48598",
        "status": "pending"
    },
    {
        "id": "178601438241441",
        "name": "Ibrahim sir ks",
        "phone": "+91 98953 13738",
        "status": "pending"
    },
    {
        "id": "178601438241442",
        "name": "Nisar .kk(mushiya)",
        "phone": "6238364012",
        "status": "pending"
    },
    {
        "id": "178601438241443",
        "name": "Ubaid MM",
        "phone": "+91 81369 45759",
        "status": "pending"
    },
    {
        "id": "178601438241444",
        "name": "Mansoor .MM(mubaris)",
        "phone": "91 9048526609",
        "status": "pending"
    },
    {
        "id": "178601438241445",
        "name": "Ubaid P.(Manu)",
        "phone": "9778089451",
        "status": "pending"
    },
    {
        "id": "178601438241446",
        "name": "Sidheeq M.",
        "phone": "8921439073",
        "status": "pending"
    },
    {
        "id": "178601438241447",
        "name": "Vappu Haji",
        "phone": "8075963830",
        "status": "pending"
    },
    {
        "id": "178601438241448",
        "name": "Rafeeq .M",
        "phone": "9747411381",
        "status": "pending"
    },
    {
        "id": "178601438241449",
        "name": "Ibrahim N(sahul)",
        "phone": "9605215981",
        "status": "pending"
    },
    {
        "id": "178601438241450",
        "name": "Haris(Ashiq)N",
        "phone": "+91 79022 57940",
        "status": "pending"
    },
    {
        "id": "178601438241451",
        "name": "Muhammad Ali N.(Rifa)",
        "phone": "+91 95620 50856",
        "status": "pending"
    },
    {
        "id": "178601438241452",
        "name": "Abdulla kk",
        "phone": "9061742312",
        "status": "pending"
    },
    {
        "id": "178601438241453",
        "name": "Daleef .KK",
        "phone": "7909119307",
        "status": "pending"
    },
    {
        "id": "178601438241454",
        "name": "Riyas M",
        "phone": "+91 98472 94489",
        "status": "pending"
    },
    {
        "id": "178601438241455",
        "name": "Ansar kk",
        "phone": "8111915414",
        "status": "pending"
    },
    {
        "id": "178601438241456",
        "name": "Ramla .P",
        "phone": "9544626713",
        "status": "pending"
    },
    {
        "id": "178601438241457",
        "name": "Abu M",
        "phone": "9048045492",
        "status": "pending"
    },
    {
        "id": "178601438241458",
        "name": "Alavi C (Anfas)",
        "phone": "9656302023",
        "status": "pending"
    },
    {
        "id": "178601438241459",
        "name": "Zakariyya Latheefi",
        "phone": "9539611452",
        "status": "pending"
    },
    {
        "id": "178601438241460",
        "name": "Shareef kk",
        "phone": "8606765918",
        "status": "pending"
    },
    {
        "id": "178601438241461",
        "name": "Latheef kk",
        "phone": "9961264533",
        "status": "pending"
    }
],
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
    lastSkippedProviderId: null,
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
        if (this.data.providers.length === 0) { this.data.providers = defaultState.providers; this.data.registrationCompleted = true; this.data.startDate = '2026-07-04'; this.data.activeProviderId = this.data.providers[0].id; this.save(); } this.fetchFromFirebase();
        
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
                
                if (status === 'skipped') {
                    this.data.lastSkippedProviderId = provider.id;
                } else if (status === 'sent') {
                    this.data.lastSkippedProviderId = null;
                }
            }

            let nextIndex = currentIndex;
            let loopCount = 0;
            let found = false;
            
            while (loopCount < this.data.providers.length) {
                nextIndex++;
                if (nextIndex >= this.data.providers.length) {
                    if (this.data.settings.loopTo === 'custom' && this.data.settings.customStartProviderId) {
                        const customIndex = this.data.providers.findIndex(p => p.id === this.data.settings.customStartProviderId);
                        nextIndex = customIndex !== -1 ? customIndex : 0;
                    } else {
                        nextIndex = 0;
                    }
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
                
                // If we looped back to the beginning, reset all other providers' statuses
                if (nextIndex <= currentIndex && this.data.providers.length > 1) {
                    this.data.providers.forEach(p => {
                        if (p.id !== nextProvider.id) {
                            p.status = 'pending';
                            delete p.statusDate;
                        }
                    });
                }
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
            
            if (this.data.lastSkippedProviderId === id) {
                this.data.lastSkippedProviderId = null;
            }
            
            if (this.data.rotationEnded) {
                this.data.rotationEnded = false;
            }
            
            // Clear last sent date to bring back the normal home view if it was sent today
            this.data.lastSentDate = null;
            
            this.data.activeProviderId = id;
            this.save();
        }
    },

    autoCatchUpProviders() {
        if (!this.data.registrationCompleted || !this.data.providers || this.data.providers.length === 0) return false;

        let startDateStr = this.getStartDate();
        if (!startDateStr) return false;

        const getYYYYMMDD = (date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getYYYYMMDD(tomorrow);

        const skipDates = this.getSkipDates();
        const settings = this.getSettings();

        // 1. Reset everyone to pending first (to start fresh based on math)
        this.data.providers.forEach(p => {
            p.status = 'pending';
            delete p.statusDate;
        });

        let currentIndex = 0;
        let currentDate = new Date(startDateStr);
        let activeId = null;
        this.data.rotationEnded = false;

        // Loop limit to prevent infinite loops
        let loopLimit = 3650; 
        
        while (getYYYYMMDD(currentDate) <= tomorrowStr && loopLimit-- > 0) {
            if (skipDates.includes(getYYYYMMDD(currentDate))) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            let loopCount = 0;
            while (this.data.providers[currentIndex] && this.data.providers[currentIndex].isPaused && loopCount < this.data.providers.length) {
                currentIndex++;
                if (currentIndex >= this.data.providers.length) {
                    if (settings.loopTo === 'custom' && settings.customStartProviderId) {
                        const customIndex = this.data.providers.findIndex(prov => prov.id === settings.customStartProviderId);
                        currentIndex = customIndex !== -1 ? customIndex : 0;
                    } else {
                        currentIndex = 0;
                    }
                }
                loopCount++;
            }

            if (loopCount >= this.data.providers.length) {
                this.data.rotationEnded = true;
                break;
            }

            let p = this.data.providers[currentIndex];

            if (getYYYYMMDD(currentDate) < tomorrowStr) {
                // Past date -> Mark as sent
                p.status = 'sent';
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                p.statusDate = days[currentDate.getDay()];
                
                // Advance index
                currentIndex++;
                if (currentIndex >= this.data.providers.length) {
                    if (settings.loopTo === 'custom' && settings.customStartProviderId) {
                        const customIndex = this.data.providers.findIndex(prov => prov.id === settings.customStartProviderId);
                        currentIndex = customIndex !== -1 ? customIndex : 0;
                    } else {
                        currentIndex = 0;
                    }
                }
            } else {
                // Today/Tomorrow's active provider
                activeId = p.id;
                p.status = 'pending';
                delete p.statusDate;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (activeId) {
            this.data.activeProviderId = activeId;
        }

        this.save();
        return true;
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

    removeSkipDate(dateStr) {
        if (this.data.skipDates) {
            this.data.skipDates = this.data.skipDates.filter(d => d !== dateStr);
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

    getLastSkippedProvider() {
        if (this.data.lastSkippedProviderId) {
            const p = this.data.providers.find(prov => prov.id === this.data.lastSkippedProviderId);
            if (p && p.status === 'skipped') {
                return p;
            }
        }
        return null;
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
