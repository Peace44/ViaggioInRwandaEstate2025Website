// Google Drive Integration Configuration
// This file contains methods to integrate your Google Drive media with the gallery

class GoogleDriveIntegration {
    constructor() {
        // You'll need to set these up in Google Cloud Console
        this.CLIENT_ID = '544059189758-3rrcms327hfg52mrbt9jm4gu790se4ie.apps.googleusercontent.com';
        this.API_KEY = 'AIzaSyCE9xV9-tC9uRCrI2jlJ-H4SwntdQdEg68';
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
        
        // Your Google Drive folder structure
        this.FOLDERS = {
            '2025': '1JYQEunhTGq2vdns3qDZ1GEqXmsBgCOUH', // Replace with actual folder ID from Google Drive
            '2026': null, // For future trips
            '2027': null  // For future trips
        };
        
        this.isInitialized = false;
        this.isSignedIn = false;
    }

    async initialize() {
        try {
            // Check if we're running on a proper HTTP server
            if (location.protocol === 'file:') {
                console.warn('Google Drive API requires HTTP server. Please use: python3 -m http.server 8000');
                return false;
            }

            await this.loadGoogleAPIs();
            
            await new Promise((resolve, reject) => {
                gapi.load('auth2', resolve, reject);
            });
            
            await gapi.client.init({
                apiKey: this.API_KEY,
                clientId: this.CLIENT_ID,
                discoveryDocs: [this.DISCOVERY_DOC],
                scope: this.SCOPES,
                cookiepolicy: 'single_host_origin'
            });
            
            this.isInitialized = true;
            this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
            
            console.log('Google Drive API initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Google Drive API:', error);
            return false;
        }
    }

    async loadGoogleAPIs() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client:auth2', resolve);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async signIn() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            this.isSignedIn = true;
            return true;
        } catch (error) {
            console.error('Error signing in:', error);
            return false;
        }
    }

    async getFolderContents(folderId) {
        try {
            // Try without authentication first (for public folders)
            const response = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, parents, description)',
                orderBy: 'createdTime desc',
                key: this.API_KEY
            });

            return response.result.files;
        } catch (error) {
            console.log('Public access failed, trying with authentication...');
            
            // Fallback: try with authentication
            try {
                if (!this.isSignedIn) {
                    await this.signIn();
                }

                const response = await gapi.client.drive.files.list({
                    q: `'${folderId}' in parents and trashed=false`,
                    fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, parents, description)',
                    orderBy: 'createdTime desc'
                });

                return response.result.files;
            } catch (authError) {
                console.error('Error getting folder contents:', authError);
                return [];
            }
        }
    }

    async loadMediaForYear(year) {
        const folderId = this.FOLDERS[year];
        if (!folderId) {
            console.log(`No folder configured for year ${year}`);
            return [];
        }

        try {
            const files = await this.getFolderContents(folderId);
            const mediaItems = [];

            for (const file of files) {
                const mediaItem = await this.processFile(file, year);
                if (mediaItem) {
                    mediaItems.push(mediaItem);
                }
            }

            return mediaItems;
        } catch (error) {
            console.error('Error loading media for year:', year, error);
            return [];
        }
    }

    async processFile(file, year) {
        const mimeType = file.mimeType;
        let type = 'photos'; // default
        
        // Determine media type based on MIME type or file name
        if (mimeType.startsWith('image/')) {
            type = 'photos';
        } else if (mimeType.startsWith('video/')) {
            type = 'videos';
        } else if (mimeType.includes('document') || mimeType.includes('pdf') || file.name.toLowerCase().includes('article')) {
            type = 'articles';
        } else if (file.name.toLowerCase().includes('social') || file.name.toLowerCase().includes('instagram')) {
            type = 'social';
        }

        // Create media item object
        const mediaItem = {
            id: file.id,
            type: type,
            year: year,
            title: this.extractTitle(file.name),
            description: file.description || this.generateDescription(file.name, type),
            date: file.createdTime,
            location: 'Rwanda', // You can enhance this based on file metadata or naming
            tags: this.extractTags(file.name),
            googleDriveId: file.id,
            originalName: file.name
        };

        // Set URLs based on type
        switch (type) {
            case 'photos':
                mediaItem.imageUrl = this.getDirectImageLink(file.id);
                mediaItem.thumbnailUrl = file.thumbnailLink || this.getDirectImageLink(file.id);
                break;
            case 'videos':
                mediaItem.videoUrl = this.getDirectVideoLink(file.id);
                mediaItem.thumbnailUrl = file.thumbnailLink || 'images/video-placeholder.jpg';
                break;
            case 'articles':
                mediaItem.articleUrl = file.webViewLink;
                mediaItem.thumbnailUrl = 'images/article-placeholder.jpg';
                break;
            case 'social':
                mediaItem.socialUrl = file.webViewLink;
                mediaItem.embedCode = await this.extractEmbedCode(file);
                mediaItem.thumbnailUrl = 'images/social-placeholder.jpg';
                break;
        }

        return mediaItem;
    }

    getDirectImageLink(fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    getDirectVideoLink(fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    extractTitle(filename) {
        // Remove file extension and clean up filename
        let title = filename.replace(/\.[^/.]+$/, "");
        
        // Replace underscores and dashes with spaces
        title = title.replace(/[_-]/g, ' ');
        
        // Capitalize first letter of each word
        title = title.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        
        return title;
    }

    generateDescription(filename, type) {
        const typeDescriptions = {
            'photos': 'Una foto del nostro viaggio in Rwanda',
            'videos': 'Un video del nostro viaggio in Rwanda',
            'articles': 'Un articolo sulla nostra esperienza in Rwanda',
            'social': 'Contenuto dai nostri social media'
        };
        
        return typeDescriptions[type] || 'Contenuto del nostro viaggio in Rwanda';
    }

    extractTags(filename) {
        // Extract tags based on filename patterns
        const tags = [];
        const lowercaseFilename = filename.toLowerCase();
        
        // Common keywords to look for
        const keywords = {
            'kigali': 'kigali',
            'akagera': 'safari',
            'nyungwe': 'foresta',
            'bumazi': 'volontariato',
            'kibeho': 'spiritualità',
            'memorial': 'storia',
            'genocide': 'memoriale',
            'kids': 'bambini',
            'children': 'bambini',
            'school': 'scuola',
            'nature': 'natura',
            'animals': 'animali',
            'group': 'gruppo'
        };
        
        Object.entries(keywords).forEach(([key, tag]) => {
            if (lowercaseFilename.includes(key)) {
                tags.push(tag);
            }
        });
        
        return tags;
    }

    async extractEmbedCode(file) {
        // For social media files, you might store embed codes in the file description
        // or extract them from the file content if it's a text file
        if (file.description && file.description.includes('instagram.com')) {
            // Extract Instagram embed code from description
            const instagramMatch = file.description.match(/https:\/\/www\.instagram\.com\/p\/[^\/]+\//);
            if (instagramMatch) {
                const postUrl = instagramMatch[0];
                return `<blockquote class="instagram-media" data-instgrm-permalink="${postUrl}" data-instgrm-version="14"></blockquote>`;
            }
        }
        
        return '';
    }

    // Helper method to get public shareable link
    async getPublicLink(fileId) {
        try {
            // First, try to make the file publicly viewable
            await gapi.client.drive.permissions.create({
                fileId: fileId,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
            
            return `https://drive.google.com/file/d/${fileId}/view`;
        } catch (error) {
            console.error('Error making file public:', error);
            return `https://drive.google.com/file/d/${fileId}/view`;
        }
    }
}

// Integration with the main gallery
class GalleryGoogleDriveIntegration {
    constructor(gallery) {
        this.gallery = gallery;
        this.driveIntegration = new GoogleDriveIntegration();
    }

    async loadGalleryFromDrive() {
        console.log('🔄 Attempting to load gallery from Google Drive...');
        
        const initialized = await this.driveIntegration.initialize();
        if (!initialized) {
            if (location.protocol === 'file:') {
                console.log('⚠️ Google Drive API requires HTTP server. Start with: python3 -m http.server 8000');
                console.log('📁 Falling back to sample data');
            } else {
                console.log('❌ Google Drive API initialization failed. Falling back to sample data');
            }
            return;
        }

        try {
            console.log(`📂 Loading media for year: ${this.gallery.currentYear}`);
            // Load media for current year
            const mediaItems = await this.driveIntegration.loadMediaForYear(this.gallery.currentYear);
            
            if (mediaItems.length > 0) {
                console.log(`✅ Successfully loaded ${mediaItems.length} items from Google Drive`);
                this.gallery.galleryData = mediaItems;
                this.gallery.renderGallery();
            } else {
                console.log('📭 No media found in Google Drive folder, using sample data');
            }
        } catch (error) {
            console.error('❌ Error loading from Google Drive:', error);
            console.log('📁 Using sample data instead');
        }
    }

    async refreshGallery() {
        await this.loadGalleryFromDrive();
    }
}

// Export for use in main gallery script
window.GoogleDriveIntegration = GoogleDriveIntegration;
window.GalleryGoogleDriveIntegration = GalleryGoogleDriveIntegration;