# Image Content Widget

A flexible section widget that combines an image with compelling content (title, subtitle, text, and action button) in a highly customizable layout.

## Features

- **4 Layout Positions**: Place the image on the left, right, above, or below the content
- **Image Customization**: Border radius, shadow effects, responsive sizing
- **Rich Content**: Title, subtitle, descriptive text with independent styling
- **Call-to-Action Button**: Optional action button with custom styling
- **Responsive Design**: Automatically adapts to mobile, tablet, and desktop screens
- **Modern Styling**: Shadow effects, smooth transitions, and professional appearance

## Widget Configuration

### Image Position Options
- **Left**: Image on the left, content on the right (default)
- **Right**: Image on the right, content on the left
- **Above**: Image above, content below
- **Below**: Image below, content above

### Default Configuration

```typescript
{
    imagePosition: 'left',
    imageUrl: '',
    imageBorderRadius: 8,
    enableImageShadow: true,
    title: 'Section Title',
    titleColor: '#000000',
    titleSize: 32,
    subtitle: '',
    subtitleColor: '#333333',
    subtitleSize: 20,
    text: 'Add your content here...',
    textColor: '#666666',
    textSize: 16,
    lineHeight: '1.6',
    showButton: true,
    buttonText: 'Learn More',
    buttonLink: '#',
    buttonColor: '#007bff',
    buttonTextColor: '#ffffff',
    buttonTextSize: 16,
    buttonPadding: '12px 24px',
    backgroundColor: '#ffffff',
    padding: 40,
    titleMarginBottom: 16,
    subtitleMarginBottom: 12,
    textMarginBottom: 24
}
```

## Usage Example

In the page builder, you can:

1. Add a new "Image Content" widget
2. Select the image position (left, right, above, or below)
3. **Upload or provide an image**:
   - Enter a URL directly in the "Image URL" field for remote images
   - Or click "Choose Image File" to upload a local file
   - Click "Upload" to process the upload
   - Supported formats: JPG, PNG, GIF, WebP (max 5MB)
4. Customize the title, subtitle, and description text
5. Configure the action button
6. Customize colors, sizes, and spacing
7. Save your changes

## Editor Features

The editor component (`ImageContentEditorComponent`) provides:

- **Visual Position Selector**: Interactive buttons to preview and select image position
- **Image Settings**: 
  - URL input for remote images
  - File upload for local images (JPG, PNG, GIF, WebP, etc.)
  - Upload progress tracking
  - File validation (max 5MB)
  - Border radius customization
  - Shadow effect toggle
- **Content Settings**: Title, subtitle, text with independent color and size controls
- **Button Settings**: Optional button with full customization
- **Layout Settings**: Background color and padding controls

## Responsive Behavior

- **Desktop (≥1025px)**: Full layout with image and content side-by-side (for left/right positions) or stacked (for above/below)
- **Tablet (769px-1024px)**: Adjusted spacing and proportions
- **Mobile (<768px)**: Stacks image and content vertically regardless of position setting

## Styling

The widget uses:
- Flexbox for responsive layouts
- CSS Grid for layout variations
- Smooth transitions for hover effects
- Professional shadows and border radius
- Tailwind CSS compatible

## Component Files

- `image-content-widget.component.ts` - Widget display component
- `image-content-editor.component.ts` - Widget editor for page builder
- Registered in `widget-registry.ts` as `'image-content'`

## Notes

- Image can be provided via URL or file upload
- Uploaded images are stored on the server with unique IDs
- File upload supports JPG, PNG, GIF, WebP formats with 5MB maximum size
- Upload progress is displayed to the user
- Image dimensions are responsive and maintain aspect ratio
- If no image is provided, a placeholder is displayed
- All text content supports multi-line text
- Button is optional and can be hidden
- Colors are fully customizable
