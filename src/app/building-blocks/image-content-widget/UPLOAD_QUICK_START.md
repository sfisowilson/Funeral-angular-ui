# Image Content Widget - Quick Start Guide

## What's New
The Image Content Widget now supports **file uploads** in addition to URL-based images.

## Key Changes

### Files Modified
1. **image-content-editor.component.ts**
   - Added `@ViewChild('fileInput')` for file input reference
   - Added properties: `selectedFile`, `isUploading`, `uploadProgress`
   - Added methods: `onImageSelected()`, `uploadImage()`
   - Enhanced UI with file upload section
   - Added PrimeNG Toast for notifications
   - Integrated MessageService for user feedback

### UI Changes
In the Image Settings section:
- **Before**: Only URL input
- **After**: URL input + File upload with progress tracking

## How to Use

### For End Users
1. Open the Image Content Widget editor
2. Go to "Image Settings"
3. Choose:
   - Enter a direct image URL, OR
   - Click "Choose Image File" → Select a local image → Click "Upload"
4. Wait for upload to complete
5. Image URL auto-populates
6. Save widget changes

### For Developers
```typescript
// The upload happens via XMLHttpRequest
const formData = new FormData();
formData.append('file', this.selectedFile);
formData.append('entityType', 'WidgetImage');

const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (event) => {
  this.uploadProgress = Math.round((event.loaded / event.total) * 100);
});
xhr.addEventListener('load', () => {
  // Handle response and update imageUrl
});
xhr.open('POST', '/api/File_UploadFile');
xhr.send(formData);
```

## Validation Rules
- **File Types**: JPG, PNG, GIF, WebP
- **Max Size**: 5MB
- **Endpoint**: POST `/api/File_UploadFile?entityType=WidgetImage`
- **Response**: Returns file ID for downloading

## Testing Checklist
- [ ] Upload a small image (< 1MB) - should succeed
- [ ] Upload a large image (> 5MB) - should show error
- [ ] Try uploading non-image file - should show error
- [ ] Check upload progress indicator appears
- [ ] Verify imageUrl auto-populates after upload
- [ ] Verify image displays in preview
- [ ] Test URL-based images still work
- [ ] Verify form saves with uploaded image
- [ ] Check image persists after page refresh

## API Endpoint Reference

**Upload:**
```
POST /api/File_UploadFile?entityType=WidgetImage
FormData: { file: File }
Returns: { id, fileName, filePath, contentType, size, ... }
```

**Download:**
```
GET /api/File_DownloadFile/{fileId}
Returns: Binary image data with proper MIME type
```

## Error Handling
- Invalid file type → Toast: "Please select a valid image file"
- File too large → Toast: "Maximum file size is 5MB"
- Network error → Toast: "Network error during upload"
- Server error → Toast: "Server returned status {status}"
- Form validation → Messages show inline validation errors

## Features
✅ File type validation  
✅ File size validation (5MB limit)  
✅ Real-time upload progress  
✅ User-friendly notifications  
✅ Automatic URL population  
✅ Fallback to URL input  
✅ Responsive design  
✅ Tenant-scoped storage  

## Integration Notes
- Uses existing `/api/File_UploadFile` endpoint from `fileUploadService`
- No new backend code needed
- Files stored in `/uploads/{tenantId}/` directory
- FileMetadata model handles persistence
- All operations authenticated and tenant-aware
