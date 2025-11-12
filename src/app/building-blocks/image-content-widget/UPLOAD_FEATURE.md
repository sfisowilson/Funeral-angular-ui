# Image Upload Feature - Image Content Widget

## Overview
The Image Content Widget now supports **dual image source options**:
1. **URL-based images** - Direct image URLs for remote hosting
2. **File upload** - Upload local image files to the server

## Features Added

### File Upload Capability
- ✅ Client-side file selection and validation
- ✅ File type validation (JPG, PNG, GIF, WebP)
- ✅ File size validation (max 5MB)
- ✅ Real-time upload progress tracking
- ✅ Server integration via `/api/File_UploadFile` endpoint
- ✅ Automatic image URL population after successful upload

### User Experience
- Visual file selection button with drag-friendly appearance
- Display of selected filename and size
- Upload progress percentage indicator
- Toast notifications for success, errors, and warnings
- Disabled upload button until file is selected

## How It Works

### Frontend Flow
1. User clicks "Choose Image File" button
2. File input dialog opens with image file filter
3. User selects an image file
4. File is validated:
   - Type check (must be image/*)
   - Size check (max 5MB)
   - Validation errors shown as toast notifications
5. User clicks "Upload" button
6. XMLHttpRequest uploads file to server:
   - Endpoint: `/api/File_UploadFile`
   - Query params: `entityType=WidgetImage`
   - Request: FormData with file
7. Upload progress is tracked and displayed
8. Server returns file metadata with ID
9. Image URL is automatically set to: `/api/File_DownloadFile/{fileId}`
10. Success notification is displayed

### Backend Integration
The upload uses the existing `fileUploadService`:

```typescript
// File upload endpoint
POST /api/File_UploadFile
Query Params:
  - entityType: 'WidgetImage'
Response:
  {
    id: string,
    fileName: string,
    filePath: string,
    contentType: string,
    size: number,
    tenantId: string,
    createdAt: string
  }

// Download endpoint
GET /api/File_DownloadFile/{fileId}
```

## Configuration in Editor

### Image Settings Section
```
┌─ Image Settings ─────────────────────────┐
│                                          │
│ Image URL                                │
│ [Enter URL or use upload below...]      │
│                                          │
│ Or Upload Image                          │
│ [Choose Image File] [Upload]            │
│ Selected: photo.jpg (1.2 MB)            │
│ Upload progress: 65%                    │
│                                          │
│ Border Radius (px): [8]                 │
│ ☑ Enable Image Shadow                   │
│                                          │
└──────────────────────────────────────────┘
```

## Validation Rules

### File Type
- Allowed: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Error: "Please select a valid image file"

### File Size
- Maximum: 5 MB (5,242,880 bytes)
- Error: "Maximum file size is 5MB"

### Error Messages
1. **No file selected**: "Please select an image file first"
2. **Invalid file type**: "Please select a valid image file (JPG, PNG, GIF, WebP, etc.)"
3. **File too large**: "Maximum file size is 5MB"
4. **Upload failed**: "Server returned status {status}"
5. **Network error**: "Network error during upload"

## Success Workflow Example

```
User Action                    System State
───────────────────────────────────────────────────────
Click file button         →    File dialog opens
Select image file         →    Filename displayed: "banner.jpg"
                              File size shown: "2.45 MB"
Click Upload button       →    Upload starts
                              Progress: 0% → 100%
                              Toast: "Upload Successful"
                              Image URL populated
                              Form updated with new image
```

## Technical Implementation

### Component Properties
```typescript
selectedFile: File | null = null;      // Currently selected file
isUploading = false;                   // Upload in progress
uploadProgress = 0;                    // Progress percentage (0-100)
```

### Component Methods
```typescript
onImageSelected(event: Event)  // File selection handler
uploadImage()                  // Upload file to server
```

### Form Integration
- Image URL field automatically populated with: `/api/File_DownloadFile/{fileId}`
- Form submits with imageUrl containing the server file path
- Can still be edited manually if needed

## Usage in Page Builder

1. Open Image Content Widget editor
2. Go to "Image Settings" section
3. Choose one of two options:
   - **Option A: Enter URL** - Type image URL directly
   - **Option B: Upload File** - Click "Choose Image File" → Select image → Click "Upload"
4. Wait for upload to complete (if uploading)
5. Image URL is automatically set
6. Continue editing other widget properties
7. Save changes

## API Integration

### Endpoint: `/api/File_UploadFile`
**Request:**
```
POST /api/File_UploadFile?entityType=WidgetImage
Content-Type: multipart/form-data

file: <binary image data>
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "tenant-123",
  "userId": "user-456",
  "fileName": "banner.jpg",
  "filePath": "/uploads/tenant-123/banner.jpg",
  "contentType": "image/jpeg",
  "size": 2560000,
  "entityType": "WidgetImage",
  "verificationStatus": "Pending",
  "createdAt": "2025-11-09T14:30:00Z"
}
```

### Download Endpoint: `/api/File_DownloadFile/{fileId}`
**Request:**
```
GET /api/File_DownloadFile/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
- Content-Type: image/jpeg (or appropriate image type)
- Body: Binary image data
- Headers: Content-Disposition: attachment; filename="banner.jpg"

## Notes

- Uploaded files are stored with tenant isolation
- File metadata includes user, tenant, entity type, and timestamp
- Upload endpoint already exists in `fileUploadService.ts`
- No database migrations needed (uses existing FileMetadata model)
- Files are persisted to disk in `/uploads/{tenantId}/` directory
- Download endpoint serves files with proper MIME types
- All uploads are authenticated and tenant-scoped
