/**
 * Al-Quran - Premium Digital Quran Reading Application
 * API: https://api.alquran.cloud
 * Design: Apple/Tesla/Stripe inspired minimalism with premium interactions
 */

// ===========================
// STATE MANAGEMENT
// ===========================

const state = {
    surahs: [],
    currentSurah: null,
    verses: [],
    isDarkMode: true,
    isLoading: false,
};

// ===========================
// DOM SELECTORS
// ===========================

const DOM = {
    surahList: document.getElementById('surahList'),
    surahContent: document.getElementById('surahContent'),
    emptyState: document.getElementById('emptyState'),
    loadingState: document.getElementById('loadingState'),
    searchInput: document.getElementById('searchInput'),
    themeToggle: document.getElementById('themeToggle'),
    errorToast: document.getElementById('errorToast'),
};

// ===========================
// API HANDLERS
// ===========================

/**
 * Fetch all Surahs from Quran API
 */
async function fetchAllSurahs() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        
        if (data.status === 'OK') {
            state.surahs = data.data;
            renderSurahList();
            return true;
        } else {
            throw new Error('Failed to fetch Surahs');
        }
    } catch (error) {
        console.error('Error fetching Surahs:', error);
        showErrorToast('فشل تحميل السور. يرجى التحقق من الاتصال بالإنترنت.');
        return false;
    }
}

/**
 * Fetch Ayahs (verses) for a specific Surah
 * @param {number} surahNumber - The Surah number
 */
async function fetchSurahVerses(surahNumber) {
    state.isLoading = true;
    showLoadingState();
    
    try {
        // Using the Arabic edition for better Arabic typography
        const response = await fetch(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`
        );
        const data = await response.json();
        
        if (data.status === 'OK') {
            state.verses = data.data.ayahs;
            state.currentSurah = data.data;
            renderSurahContent();
            state.isLoading = false;
            return true;
        } else {
            throw new Error('Failed to fetch verses');
        }
    } catch (error) {
        console.error('Error fetching verses:', error);
        showErrorToast('فشل تحميل الآيات. يرجى حاول مرة أخرى.');
        state.isLoading = false;
        hideLoadingState();
        return false;
    }
}

// ===========================
// RENDERING FUNCTIONS
// ===========================

/**
 * Render the list of Surahs in the sidebar
 */
function renderSurahList() {
    DOM.surahList.innerHTML = '';
    
    state.surahs.forEach((surah) => {
        const li = document.createElement('li');
        li.className = 'surah-item';
        li.innerHTML = `
            <span class="surah-name">${surah.name}</span>
            <span class="surah-number">${surah.number}</span>
        `;
        
        li.addEventListener('click', () => {
            // Remove active class from all items
            document.querySelectorAll('.surah-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            li.classList.add('active');
            
            // Fetch and display verses
            fetchSurahVerses(surah.number);
            
            // Smooth scroll to top of reading area
            document.querySelector('.reading-area').scrollTop = 0;
        });
        
        DOM.surahList.appendChild(li);
    });
}

/**
 * Render the Surah content with header and verses
 */
function renderSurahContent() {
    DOM.surahContent.innerHTML = '';
    
    // Hide empty state
    DOM.emptyState.style.display = 'none';
    hideLoadingState();
    
    const surah = state.currentSurah;
    const verses = state.verses;
    
    // Create Surah header
    const header = document.createElement('div');
    header.className = 'surah-header';
    
    const revelation = surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية';
    
    header.innerHTML = `
        <h1 class="surah-title">${surah.name}</h1>
        <div class="surah-info">
            <div class="surah-info-item">
                <span class="surah-info-label">السورة</span>
                <span class="surah-info-value">${surah.number}</span>
            </div>
            <div class="surah-info-item">
                <span class="surah-info-label">الآيات</span>
                <span class="surah-info-value">${verses.length}</span>
            </div>
            <div class="surah-info-item">
                <span class="surah-info-label">النوع</span>
                <span class="surah-info-value">${revelation}</span>
            </div>
        </div>
    `;
    
    DOM.surahContent.appendChild(header);
    
    // Create verses container
    const versesContainer = document.createElement('div');
    versesContainer.className = 'verses-container';
    
    // Render each verse
    verses.forEach((verse, index) => {
        const verseElement = document.createElement('div');
        verseElement.className = 'verse';
        
        const verseText = verse.text;
        
        // Get English translation (if available)
        let englishTranslation = '';
        
        verseElement.innerHTML = `
            <div class="verse-number">${verse.numberInSurah}</div>
            <p class="verse-text">${verseText}</p>
        `;
        
        versesContainer.appendChild(verseElement);
    });
    
    DOM.surahContent.appendChild(versesContainer);
}

// ===========================
// SEARCH FUNCTIONALITY
// ===========================

/**
 * Filter and search Surahs by name or number
 */
function handleSearch(query) {
    const searchTerm = query.toLowerCase();
    const surahItems = document.querySelectorAll('.surah-item');
    
    surahItems.forEach((item) => {
        const surahName = item.querySelector('.surah-name').textContent.toLowerCase();
        const surahNumber = item.querySelector('.surah-number').textContent;
        
        // Check if search term matches name or number
        const matches = surahName.includes(searchTerm) || surahNumber.includes(searchTerm);
        
        item.style.display = matches ? 'flex' : 'none';
    });
}

DOM.searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
});

// ===========================
// THEME TOGGLE
// ===========================

/**
 * Toggle between dark and light mode
 */
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    
    if (state.isDarkMode) {
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
    }
    
    // Save preference to localStorage
    localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
}

/**
 * Load saved theme preference
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        state.isDarkMode = false;
        document.body.classList.add('light-mode');
    } else {
        state.isDarkMode = true;
        document.body.classList.remove('light-mode');
    }
}

DOM.themeToggle.addEventListener('click', toggleTheme);

// ===========================
// LOADING STATES
// ===========================

/**
 * Show loading skeleton
 */
function showLoadingState() {
    DOM.loadingState.style.display = 'block';
    DOM.surahContent.innerHTML = '';
    DOM.emptyState.style.display = 'none';
}

/**
 * Hide loading skeleton
 */
function hideLoadingState() {
    DOM.loadingState.style.display = 'none';
}

// ===========================
// ERROR HANDLING
// ===========================

/**
 * Show error toast notification
 * @param {string} message - Error message to display
 */
function showErrorToast(message) {
    DOM.errorToast.textContent = message;
    DOM.errorToast.classList.add('show');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        DOM.errorToast.classList.remove('show');
    }, 4000);
}

// ===========================
// INITIALIZATION
// ===========================

/**
 * Initialize the application
 */
async function initialize() {
    // Load theme preference
    initializeTheme();
    
    // Fetch and render Surahs
    const success = await fetchAllSurahs();
    
    if (!success) {
        console.error('Failed to initialize app');
        return;
    }
    
    // Log successful initialization
    console.log('✨ Al-Quran app initialized successfully');
    console.log(`📖 Loaded ${state.surahs.length} Surahs`);
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

/**
 * Utility: Add smooth scroll behavior for verses
 * This enhances the premium reading experience
 */
document.addEventListener('scroll', () => {
    // Subtle parallax effect on background (optional enhancement)
    const scrollY = window.scrollY;
    const bg = document.querySelector('.animated-bg');
    
    if (bg) {
        bg.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
}, { passive: true });

// ===========================
// KEYBOARD SHORTCUTS (Optional Enhancement)
// ===========================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        DOM.searchInput.focus();
    }
    
    // Ctrl/Cmd + L to toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        toggleTheme();
    }


    
});
