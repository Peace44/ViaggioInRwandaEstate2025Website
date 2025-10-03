// Google Drive Integration Configuration
// This file contains methods to integrate your Google Drive media with the gallery

class GoogleDriveIntegration {
    constructor() {
        // You'll need to set these up in Google Cloud Console
        this.CLIENT_ID = '290448912885-j3ukltlamn3dv99ejoptqir4i9pdibho.apps.googleusercontent.com'; // Personal project
        this.API_KEY = 'AIzaSyAtE4pLQPi8QeWq3zLGfDjMD1B7dXjC8bw'; // Personal project
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
        
        // Your Google Drive folder structure
        this.FOLDERS = {
            '2024': '1Wf-Emzxn0DsqFCEq3FhlnTwk-kQFEc84',
            '2025': '18pJ_6rLcTpe2dMyutbkUN3TloFWGIEtM',
            '2026': '1Say7SV2rdSNIqPZlNiDwDxAumZl4i7nz',
            '2027': null  // For future trips
        };
        
        this.isInitialized = false;
        this.accessToken = null;
        this.tokenClient = null;
    }

    async initialize() {
        try {
            // Check if we're running on a proper HTTP server
            if (location.protocol === 'file:') {
                console.warn('Google Drive API requires HTTP server. Please use: python3 -m http.server 8000');
                return false;
            }

            // Load both GAPI and GIS libraries
            await Promise.all([
                this.loadGoogleAPIs(),
                this.loadGoogleIdentityServices()
            ]);
            
            // Initialize GAPI client without discovery docs (fallback approach)
            try {
                await gapi.client.init({
                    apiKey: this.API_KEY,
                    discoveryDocs: [this.DISCOVERY_DOC]
                });
                console.log('✅ GAPI initialized with discovery docs');
            } catch (discoveryError) {
                console.log('⚠️ Discovery docs failed, using direct API calls:', discoveryError.message);
                // Initialize without discovery docs
                await gapi.client.init({
                    apiKey: this.API_KEY
                });
                console.log('✅ GAPI initialized without discovery docs');
            }
            
            // Initialize GIS token client
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        console.log('✅ Google Drive authentication successful');
                    }
                }
            });
            
            this.isInitialized = true;
            console.log('Google Drive API initialized successfully (GIS)');
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
                gapi.load('client', resolve);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async loadGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            if (typeof google !== 'undefined' && google.accounts) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async signIn() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            return new Promise((resolve) => {
                // Update the callback to resolve the promise
                this.tokenClient.callback = (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        console.log('✅ Google Drive authentication successful');
                        resolve(true);
                    } else {
                        console.error('Authentication failed:', response);
                        resolve(false);
                    }
                };
                
                // Request access token
                this.tokenClient.requestAccessToken();
            });
        } catch (error) {
            console.error('Error signing in:', error);
            return false;
        }
    }

    async getFileComments(fileId) {
        try {
            // Try using GAPI client first
            if (gapi.client.drive && gapi.client.drive.comments) {
                const response = await gapi.client.drive.comments.list({
                    fileId: fileId,
                    fields: 'comments(content, author/displayName, createdTime)',
                    key: this.API_KEY
                });
                return response.result.comments || [];
            }
        } catch (error) {
            console.log('GAPI comments method failed, trying direct HTTP request...');
        }

        // Fallback: Direct HTTP request
        try {
            const params = new URLSearchParams({
                fields: 'comments(content, author/displayName, createdTime)',
                key: this.API_KEY
            });

            let response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/comments?${params}`);

            if (!response.ok && this.accessToken) {
                // Try with authentication
                params.delete('key');
                response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/comments?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (response.ok) {
                const data = await response.json();
                return data.comments || [];
            }
        } catch (error) {
            console.log('Error fetching comments for file:', fileId, error);
        }

        return [];
    }

    async getFolderContents(folderId) {
        try {
            // Try using GAPI client first (if discovery docs worked)
            if (gapi.client.drive && gapi.client.drive.files) {
                const response = await gapi.client.drive.files.list({
                    q: `'${folderId}' in parents and trashed=false`,
                    fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, parents, description)',
                    orderBy: 'createdTime desc',
                    key: this.API_KEY
                });
                return response.result.files;
            }
        } catch (error) {
            console.log('GAPI client method failed, trying direct HTTP request...');
        }

        // Fallback: Direct HTTP request to Google Drive API
        try {
            // Try without authentication first (for public folders)
            const params = new URLSearchParams({
                q: `'${folderId}' in parents and trashed=false`,
                fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, parents, description)',
                orderBy: 'createdTime desc',
                key: this.API_KEY
            });

            let response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
            
            if (!response.ok) {
                console.log('Public access failed, trying with authentication...');
                
                // Try with authentication
                if (!this.accessToken) {
                    console.log('🔐 No access token found, requesting authentication...');
                    const signInSuccess = await this.signIn();
                    if (!signInSuccess) {
                        console.error('❌ Authentication failed');
                        return [];
                    }
                    console.log('✅ Authentication completed, token obtained');
                }

                // Remove the API key and use access token instead
                params.delete('key');
                console.log('🔄 Making authenticated request to Google Drive...');
                response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    console.log('✅ Authenticated request successful');
                } else {
                    console.error('❌ Authenticated request failed:', response.status, response.statusText);
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('Error getting folder contents:', error);
            return [];
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
                // Check if this is a folder
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    console.log(`📁 Found subfolder: ${file.name}, loading its contents...`);
                    // Recursively load contents of subfolders
                    const subfolderFiles = await this.getFolderContents(file.id);
                    for (const subfile of subfolderFiles) {
                        const mediaItem = await this.processFile(subfile, year);
                        if (mediaItem) {
                            mediaItems.push(mediaItem);
                        }
                    }
                } else {
                    // Process regular files
                    const mediaItem = await this.processFile(file, year);
                    if (mediaItem) {
                        mediaItems.push(mediaItem);
                    }
                }
            }

            return mediaItems;
        } catch (error) {
            console.error('Error loading media for year:', year, error);
            return [];
        }
    }

    async processFile(file, year) {
        console.log('🔍 Processing file:', file.name, 'MIME:', file.mimeType);
        const mimeType = file.mimeType;

        // Skip Google Apps folders and other non-media files
        if (mimeType === 'application/vnd.google-apps.folder') {
            console.log('⏭️ Skipping folder:', file.name);
            return null;
        }

        let type = 'photos'; // default

        // Determine media type based on MIME type or file name
        // Check for JSON files first (before other type checks)
        if (mimeType === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
            // Handle JSON files - could be social media configurations
            return await this.processJsonFile(file, year);
        } else if (mimeType.startsWith('image/')) {
            type = 'photos';
        } else if (mimeType.startsWith('video/')) {
            type = 'videos';
        } else if (mimeType.includes('document') || mimeType.includes('pdf') || file.name.toLowerCase().includes('article')) {
            type = 'articles';
        } else if (file.name.toLowerCase().includes('social') || file.name.toLowerCase().includes('instagram')) {
            type = 'social';
        } else if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
            // Skip unsupported file types
            console.log('⏭️ Skipping unsupported file type:', file.name, mimeType);
            return null;
        }

        console.log('📂 File type determined:', type);

        // Fetch comments for this file
        console.log('💬 Fetching comments for:', file.name);
        const comments = await this.getFileComments(file.id);

        // Combine original description with comments
        let description = file.description || this.generateDescription(file.name, type);
        if (comments.length > 0) {
            // Use the most recent comment as the main description
            const latestComment = comments[0];
            description = latestComment.content || description;
            console.log('📝 Found comment for', file.name + ':', latestComment.content);
        }

        // Create media item object
        const mediaItem = {
            id: file.id,
            type: type,
            year: year,
            title: this.extractTitle(file.name),
            description: description,
            date: file.createdTime,
            location: 'Rwanda', // You can enhance this based on file metadata or naming
            tags: this.extractTags(file.name),
            googleDriveId: file.id,
            originalName: file.name,
            comments: comments // Store all comments for potential future use
        };

        // Set URLs based on type
        switch (type) {
            case 'photos':
                // Use Google's thumbnail URLs when available, they work better for embedding
                if (file.thumbnailLink) {
                    // Use high-res version of Google's thumbnail
                    const highResThumbnail = file.thumbnailLink.replace('=s220', '=s1000');
                    mediaItem.imageUrl = highResThumbnail;
                    mediaItem.thumbnailUrl = file.thumbnailLink;
                } else {
                    // Fallback to direct link
                    mediaItem.imageUrl = this.getDirectImageLink(file.id);
                    mediaItem.thumbnailUrl = this.getThumbnailLink(file.id);
                }
                console.log('🖼️ Photo URLs:', {
                    imageUrl: mediaItem.imageUrl,
                    thumbnailUrl: mediaItem.thumbnailUrl,
                    originalThumbnail: file.thumbnailLink
                });
                break;
            case 'videos':
                mediaItem.videoUrl = this.getDirectVideoLink(file.id);
                mediaItem.thumbnailUrl = file.thumbnailLink || 'images/video-placeholder.jpg';
                console.log('🎥 Video URLs:', {
                    videoUrl: mediaItem.videoUrl,
                    thumbnailUrl: mediaItem.thumbnailUrl,
                    originalThumbnail: file.thumbnailLink
                });
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

        // Try to make the file public for better access (optional - will fail silently if no permission)
        try {
            if (this.accessToken && (type === 'photos' || type === 'videos')) {
                await this.makeFilePublic(file.id);
            }
        } catch (error) {
            console.log('ℹ️ Could not make file public (this is normal):', file.name);
        }

        console.log('✅ Created media item:', mediaItem);
        return mediaItem;
    }

    async processJsonFile(file, year) {
        console.log('📄 Processing JSON file:', file.name);

        try {
            // Download and parse the JSON file content
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                console.log('❌ Failed to download JSON file:', file.name);
                return null;
            }

            const jsonContent = await response.json();
            console.log('📋 JSON content:', jsonContent);

            // Validate that this is a social media configuration
            if (!jsonContent.type || jsonContent.type !== 'social') {
                console.log('⏭️ Skipping non-social JSON file:', file.name);
                return null;
            }

            // Create media item from JSON configuration
            const mediaItem = {
                id: jsonContent.id || file.id,
                type: 'social',
                year: year,
                title: jsonContent.title || this.extractTitle(file.name),
                description: jsonContent.description || 'Social media content',
                date: jsonContent.date || file.createdTime,
                location: jsonContent.location || 'Rwanda',
                tags: jsonContent.tags || ['social'],
                socialUrl: jsonContent.socialUrl,
                embedCode: jsonContent.embedCode,
                thumbnailUrl: jsonContent.thumbnailUrl || 'images/social-placeholder.jpg',
                googleDriveId: file.id,
                originalName: file.name
            };

            console.log('✅ Created social media item from JSON:', mediaItem);
            return mediaItem;

        } catch (error) {
            console.error('❌ Error processing JSON file:', file.name, error);
            return null;
        }
    }

    getDirectImageLink(fileId) {
        // Multiple fallback options for Google Drive images
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    getDirectVideoLink(fileId) {
        // For videos, use the preview link which works better for embedding
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // Alternative image URL format
    getThumbnailLink(fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    // Helper method to make a file publicly readable
    async makeFilePublic(fileId) {
        if (!this.accessToken) return false;

        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: 'reader',
                    type: 'anyone'
                })
            });

            return response.ok;
        } catch (error) {
            return false;
        }
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

    generateDescription(_filename, type) {
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
            // Ensure we have authentication
            if (!this.accessToken) {
                await this.signIn();
            }

            // Try using GAPI client first (if available)
            if (gapi.client.drive && gapi.client.drive.permissions) {
                gapi.client.setToken({
                    access_token: this.accessToken
                });

                await gapi.client.drive.permissions.create({
                    fileId: fileId,
                    resource: {
                        role: 'reader',
                        type: 'anyone'
                    }
                });
            } else {
                // Fallback: Direct HTTP request
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        role: 'reader',
                        type: 'anyone'
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
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
                console.log('📋 Media items loaded:', mediaItems);
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