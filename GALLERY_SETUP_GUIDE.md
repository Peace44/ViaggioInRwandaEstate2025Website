# Rwanda Gallery Setup Guide

## Overview
You now have a modern, professional gallery system for your Rwanda travel website. This guide will help you set up the Google Drive integration to display your trip media.

## 🎯 What's Been Created

### 1. New Gallery Page (`gallery.html`)
- **Modern Design**: Professional, attractive layout optimized for showcasing travel content
- **Filtering System**: Filter by media type (Photos, Videos, Articles, Social Media) and year (ready for future trips)
- **Lightbox Viewer**: Click any item to view in full-screen with navigation
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Fast Loading**: Optimized with lazy loading and smooth animations

### 2. Main Page Integration
- Updated navigation to link to the new gallery
- Beautiful gallery preview section on the main page that promotes the full gallery
- Maintains existing design aesthetic while modernizing the experience

### 3. Google Drive Integration (Ready to Configure)
- Automatic media loading from Google Drive folders
- Smart file type detection and categorization
- Year-based organization for future trips
- Metadata extraction from filenames and descriptions

## 🚀 Quick Start (Using Sample Data)

The gallery is **already functional** with sample data. You can:
1. Open `gallery.html` in your browser
2. Test the filtering, lightbox, and responsive features
3. See how it will look with your real media

## 🔧 Google Drive Setup (Optional but Recommended)

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Drive API**

### Step 2: Create API Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the API key
4. Click **Create Credentials > OAuth 2.0 Client IDs**
5. Configure for web application
6. Add your website domain to authorized origins
7. Copy the Client ID

### Step 3: Configure API Keys
Edit `google-drive-config.js`:
```javascript
this.CLIENT_ID = 'your-actual-client-id-here';
this.API_KEY = 'your-actual-api-key-here';
```

### Step 4: Organize Your Google Drive
Create a folder structure like this:
```
📁 Rwanda Travel Gallery/
  📁 2025/
    📁 Photos/
    📁 Videos/
    📁 Articles/
    📁 Social Media/
  📁 2026/ (for future trips)
  📁 2027/
```

### Step 5: Get Folder IDs
1. Navigate to your main year folder (e.g., "2025") in Google Drive
2. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. Update `google-drive-config.js`:
```javascript
this.FOLDERS = {
    '2025': 'your-2025-folder-id-here',
    '2026': null, // Add when ready
    '2027': null  // Add when ready
};
```

### Step 6: Enable Google Drive Integration
In `gallery.html`, add the Google Drive config:
```html
<script src="google-drive-config.js"></script>
```

Then update `gallery-script.js` to use Google Drive:
```javascript
// In the loadGalleryData() method, replace the sample data loading with:
const driveIntegration = new GalleryGoogleDriveIntegration(this);
await driveIntegration.loadGalleryFromDrive();
```

## 📁 File Organization Tips

### Naming Conventions for Auto-Categorization
The system automatically categorizes files based on:

**Photos**: `.jpg`, `.jpeg`, `.png`, `.webp`
**Videos**: `.mp4`, `.mov`, `.avi`
**Articles**: Files containing "article" in name, PDFs
**Social Media**: Files containing "social", "instagram", "facebook"

### Filename Examples for Better Titles
- `Kigali_Airport_Arrival.jpg` → "Kigali Airport Arrival"
- `Bumazi_School_Kids_Playing.mp4` → "Bumazi School Kids Playing"
- `Memorial_Visit_Reflection.jpg` → "Memorial Visit Reflection"

### Adding Captions/Descriptions
Use Google Drive's "Description" field for each file to add contextual information that will appear in the lightbox.

## 🎨 Customization Options

### Adding More Years
As you plan future trips, simply:
1. Add new year buttons in `gallery.html`:
```html
<button class="year-btn" data-year="2026">2026</button>
```
2. Update the folder configuration in `google-drive-config.js`

### Changing Colors/Styling
Edit `gallery-styles.css` to match your brand colors:
- Primary color: `rgb(0, 218, 255)` (currently cyan)
- Accent color: `#ff4500` (currently orange)

### Adding New Media Types
1. Add filter button in `gallery.html`
2. Update filtering logic in `gallery-script.js`
3. Add corresponding styles in `gallery-styles.css`

## 📱 Mobile Optimization

The gallery is fully responsive and includes:
- Touch-friendly navigation
- Optimized image loading
- Mobile-specific layouts
- Gesture support for lightbox

## 🔒 Privacy & Security

- Google Drive API access is read-only
- No sensitive data is stored in the website code
- Files remain private until you choose to make them public
- Authentication happens client-side

## 🚀 Performance Features

- **Lazy Loading**: Images load only when visible
- **Optimized Thumbnails**: Uses Google Drive's built-in thumbnail service
- **Smooth Animations**: CSS-based animations for better performance
- **Caching**: Browser caching for repeat visits

## 📈 Future-Proof Design

This gallery system is designed to grow with your travel business:
- **Multi-year Support**: Easy to add new years
- **Scalable**: Handles hundreds of media items efficiently
- **SEO Friendly**: Proper metadata and structured content
- **Analytics Ready**: Easy to integrate with Google Analytics

## 🆘 Troubleshooting

### Gallery Shows "Loading..." Forever
- Check browser console for JavaScript errors
- Verify Google Drive API credentials
- Ensure folder IDs are correct
- Check internet connection

### Images Not Loading
- Verify Google Drive files are accessible
- Check if files need to be made public
- Ensure file formats are supported

### Filters Not Working
- Check that files are properly categorized
- Verify folder structure matches configuration
- Look for naming convention issues

## 📞 Support

The gallery system is now complete and ready to showcase your Rwanda 2025 trip! You can start using it immediately with the sample data, then gradually migrate to Google Drive integration when ready.

### Ready to Use Features:
✅ Modern, professional design  
✅ Full responsive layout  
✅ Filtering and search  
✅ Lightbox viewing  
✅ Multi-year support  
✅ Performance optimized  
✅ SEO friendly  

### Next Steps:
1. Add your real media to replace sample data
2. Set up Google Drive integration (optional)
3. Update metadata and descriptions
4. Test on different devices
5. Launch and start attracting customers!

The new gallery will significantly improve your website's ability to attract travelers and showcase the amazing Rwanda experience you offer.