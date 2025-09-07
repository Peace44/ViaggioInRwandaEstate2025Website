// Gallery functionality
class GalleryManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentYear = '2025';
        this.currentView = 'grid';
        this.galleryData = [];
        this.currentLightboxIndex = 0;
        this.filteredItems = [];
        
        this.init();
    }

    init() {
        this.loadGalleryData();
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupBackToTop();
    }

    // Load gallery data from Google Drive
    async loadGalleryData() {
        // Try to load from Google Drive first
        try {
            // Check if Google Drive integration is available
            if (typeof window.GalleryGoogleDriveIntegration !== 'undefined') {
                console.log('🔄 Google Drive integration found, attempting to load...');
                const driveIntegration = new window.GalleryGoogleDriveIntegration(this);
                await driveIntegration.loadGalleryFromDrive();
                
                // If Google Drive data is loaded successfully, return
                if (this.galleryData && this.galleryData.length > 0) {
                    console.log(`✅ Successfully loaded ${this.galleryData.length} items from Google Drive`);
                    this.renderGallery();
                    return;
                }
            } else {
                console.log('⚠️ Google Drive integration not available (google-drive-config.js may not be loaded)');
            }
        } catch (error) {
            console.log('❌ Google Drive integration failed, using sample data:', error.message);
        }
        
        // Fallback to sample data if Google Drive fails
        this.galleryData = [
            {
                id: 1,
                type: 'photos',
                year: '2025',
                title: 'Arrivo a Kigali',
                description: 'Il nostro gruppo all\'aeroporto internazionale di Kigali, pronti per iniziare l\'avventura.',
                imageUrl: 'images/kigali-international-airport.jpg',
                thumbnailUrl: 'images/kigali-international-airport.jpg',
                date: '2025-07-15',
                location: 'Kigali, Rwanda',
                tags: ['arrivo', 'aeroporto', 'gruppo']
            },
            {
                id: 2,
                type: 'photos',
                year: '2025',
                title: 'Memoriale del Genocidio',
                description: 'Momento di riflessione al Memoriale del Genocidio dei Tutsi a Gisozi.',
                imageUrl: 'images/KigaliGenocideMemorial.jpg',
                thumbnailUrl: 'images/KigaliGenocideMemorial.jpg',
                date: '2025-07-16',
                location: 'Kigali, Rwanda',
                tags: ['memoriale', 'storia', 'riflessione']
            },
            {
                id: 3,
                type: 'photos',
                year: '2025',
                title: 'Safari all\'Akagera',
                description: 'Incredibili avvistamenti di fauna selvatica nel Parco Nazionale dell\'Akagera.',
                imageUrl: 'images/AkageraNationalPark.jpg',
                thumbnailUrl: 'images/AkageraNationalPark.jpg',
                date: '2025-07-17',
                location: 'Parco Nazionale Akagera, Rwanda',
                tags: ['safari', 'natura', 'animali']
            },
            {
                id: 4,
                type: 'videos',
                year: '2025',
                title: 'Scimmie nella Foresta di Nyungwe',
                description: 'Video delle scimmie nella splendida Foresta di Nyungwe.',
                videoUrl: 'videos/nyungwe_monkeys.mp4',
                thumbnailUrl: 'images/NyungweForest.jpeg',
                date: '2025-07-24',
                location: 'Foresta di Nyungwe, Rwanda',
                tags: ['natura', 'primati', 'foresta']
            },
            {
                id: 5,
                type: 'photos',
                year: '2025',
                title: 'Attività con i bambini di Bumazi',
                description: 'Momenti indimenticabili con i bambini della Scuola Primaria di Bumazi.',
                imageUrl: 'images/Bumazi.jpg',
                thumbnailUrl: 'images/Bumazi.jpg',
                date: '2025-07-20',
                location: 'Bumazi, Rwanda',
                tags: ['volontariato', 'bambini', 'scuola']
            },
            {
                id: 6,
                type: 'articles',
                year: '2025',
                title: 'La nostra esperienza su Scuola Europa',
                description: 'Leggi il racconto completo della nostra indimenticabile esperienza in Rwanda.',
                articleUrl: 'https://www.scuolaeuropa.it/viaggio-in-ruanda/',
                thumbnailUrl: 'images/Kigali.png',
                date: '2025-08-01',
                location: 'Online',
                tags: ['racconto', 'esperienza', 'articolo']
            },
            {
                id: 7,
                type: 'social',
                year: '2025',
                title: 'Post Instagram del viaggio',
                description: 'I nostri momenti condivisi sui social media.',
                socialUrl: 'https://www.instagram.com/p/CxNMk-3qn-i/?igshid=MTc4MmM1YmI2Ng',
                embedCode: '<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/CxNMk-3qn-i/?igshid=MTc4MmM1YmI2Ng" data-instgrm-version="14"></blockquote>',
                thumbnailUrl: 'images/traditionalRwandanDance.jpg',
                date: '2025-07-22',
                location: 'Rwanda',
                tags: ['social', 'instagram', 'condivisione']
            }
        ];

        // Render gallery with sample data
        this.renderGallery();
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Year buttons
        document.querySelectorAll('.year-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setYear(e.target.dataset.year);
            });
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setView(e.target.dataset.view);
            });
        });

        // Lightbox controls
        document.getElementById('lightboxClose').addEventListener('click', () => {
            this.closeLightbox();
        });

        document.getElementById('lightboxPrev').addEventListener('click', () => {
            this.navigateLightbox(-1);
        });

        document.getElementById('lightboxNext').addEventListener('click', () => {
            this.navigateLightbox(1);
        });

        // Lightbox overlay click to close
        document.getElementById('lightboxOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('lightboxOverlay').style.display === 'block') {
                switch(e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.navigateLightbox(-1);
                        break;
                    case 'ArrowRight':
                        this.navigateLightbox(1);
                        break;
                }
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderGallery();
    }

    setYear(year) {
        this.currentYear = year;
        
        // Update active button
        document.querySelectorAll('.year-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-year="${year}"]`).classList.add('active');
        
        this.renderGallery();
    }

    setView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update grid class
        const grid = document.getElementById('galleryGrid');
        if (view === 'masonry') {
            grid.classList.add('masonry');
        } else {
            grid.classList.remove('masonry');
        }
    }

    filterItems() {
        return this.galleryData.filter(item => {
            const matchesFilter = this.currentFilter === 'all' || item.type === this.currentFilter;
            const matchesYear = item.year === this.currentYear;
            return matchesFilter && matchesYear;
        });
    }

    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        this.filteredItems = this.filterItems();
        
        if (this.filteredItems.length === 0) {
            grid.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Nessun contenuto disponibile per questa selezione.</p>
                </div>
            `;
            return;
        }

        // Add loading state
        grid.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Caricamento contenuti...</p>
            </div>
        `;

        // Simulate loading delay for better UX
        setTimeout(() => {
            grid.innerHTML = '';
            
            this.filteredItems.forEach((item, index) => {
                const galleryItem = this.createGalleryItem(item, index);
                grid.appendChild(galleryItem);
            });

            // Animate items
            this.animateItems();
        }, 500);
    }

    createGalleryItem(item, index) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.dataset.index = index;
        div.addEventListener('click', () => this.openLightbox(index));

        let mediaContent = '';
        let itemTypeClass = '';

        switch(item.type) {
            case 'photos':
                mediaContent = `<img src="${item.thumbnailUrl}" alt="${item.title}" class="item-image" loading="lazy">`;
                itemTypeClass = 'item-photo';
                break;
            case 'videos':
                mediaContent = `
                    <div style="position: relative;">
                        <img src="${item.thumbnailUrl}" alt="${item.title}" class="item-video" loading="lazy">
                        <div class="video-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                `;
                itemTypeClass = 'item-video-container';
                break;
            case 'articles':
                mediaContent = '';
                itemTypeClass = 'item-article';
                break;
            case 'social':
                mediaContent = '';
                itemTypeClass = 'item-social';
                break;
        }

        div.innerHTML = `
            ${mediaContent}
            <div class="item-content ${itemTypeClass}">
                <h3 class="item-title">${item.title}</h3>
                <p class="item-description">${item.description}</p>
                <div class="item-meta">
                    <span class="item-date">${this.formatDate(item.date)}</span>
                    <span class="item-type">${this.getTypeLabel(item.type)}</span>
                </div>
            </div>
        `;

        return div;
    }

    animateItems() {
        const items = document.querySelectorAll('.gallery-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.style.animationDelay = `${index * 0.1}s`;
            }, 50);
        });
    }

    openLightbox(index) {
        this.currentLightboxIndex = index;
        const item = this.filteredItems[index];
        
        const overlay = document.getElementById('lightboxOverlay');
        const content = document.getElementById('lightboxContent');
        const info = document.getElementById('lightboxInfo');

        // Clear previous content
        content.innerHTML = '';

        // Create content based on type
        switch(item.type) {
            case 'photos':
                content.innerHTML = `
                    <img src="${item.imageUrl}" alt="${item.title}" 
                         onerror="console.error('Failed to load image:', '${item.imageUrl}'); this.style.display='none'; this.parentNode.innerHTML='<p>❌ Image failed to load</p>';">
                `;
                break;
            case 'videos':
                // Use iframe for Google Drive videos
                content.innerHTML = `
                    <iframe src="${item.videoUrl}" 
                            width="100%" 
                            height="400" 
                            frameborder="0" 
                            allow="autoplay; encrypted-media" 
                            allowfullscreen>
                    </iframe>
                `;
                break;
            case 'articles':
                content.innerHTML = `<iframe src="${item.articleUrl}"></iframe>`;
                break;
            case 'social':
                content.innerHTML = item.embedCode;
                // Reinitialize Instagram embeds
                if (window.instgrm) {
                    window.instgrm.Embeds.process();
                }
                break;
        }

        // Update info
        info.querySelector('.lightbox-title').textContent = item.title;
        info.querySelector('.lightbox-description').textContent = item.description;
        info.querySelector('.lightbox-date').textContent = this.formatDate(item.date);
        info.querySelector('.lightbox-location').textContent = item.location;

        // Show lightbox
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Update navigation buttons
        this.updateLightboxNav();
    }

    closeLightbox() {
        document.getElementById('lightboxOverlay').style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Stop any videos
        const videos = document.querySelectorAll('#lightboxContent video');
        videos.forEach(video => video.pause());
    }

    navigateLightbox(direction) {
        const newIndex = this.currentLightboxIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.filteredItems.length) {
            this.openLightbox(newIndex);
        }
    }

    updateLightboxNav() {
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');
        
        prevBtn.style.display = this.currentLightboxIndex > 0 ? 'block' : 'none';
        nextBtn.style.display = this.currentLightboxIndex < this.filteredItems.length - 1 ? 'block' : 'none';
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, options);

        // Observe gallery items as they're added
        const observeNewItems = () => {
            document.querySelectorAll('.gallery-item').forEach(item => {
                observer.observe(item);
            });
        };

        // Initial observation
        setTimeout(observeNewItems, 100);
        
        // Re-observe after filter changes
        document.addEventListener('galleryUpdated', observeNewItems);
    }

    setupBackToTop() {
        const backToTop = document.getElementById('backToTop');
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getTypeLabel(type) {
        const labels = {
            'photos': 'Foto',
            'videos': 'Video',
            'articles': 'Articolo',
            'social': 'Social'
        };
        return labels[type] || type;
    }

    // Google Drive Integration Methods
    // These methods will be implemented when you provide your Google Drive setup

    async loadFromGoogleDrive() {
        // This will be implemented based on your Google Drive folder structure
        // Example structure:
        // /Rwanda 2025/
        //   /Photos/
        //   /Videos/
        //   /Articles/
        //   /Social Media/
        
        console.log('Google Drive integration will be implemented here');
    }

    async authenticateGoogleDrive() {
        // Google Drive API authentication
        console.log('Google Drive authentication will be implemented here');
    }

    processGoogleDriveFiles(files) {
        // Process files from Google Drive API response
        console.log('Processing Google Drive files:', files);
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new GalleryManager();
    
    // Load Instagram embed script
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.head.appendChild(script);
    }
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GalleryManager;
}