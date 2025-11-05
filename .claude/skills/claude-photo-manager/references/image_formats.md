# Image Formats Reference for STEEB

## Supported Formats

### Recommended Formats

#### PNG (Portable Network Graphics)
- **Best for:** Screenshots, UI mockups, diagrams, text-heavy images
- **Pros:** Lossless compression, supports transparency, sharp text
- **Cons:** Larger file sizes than JPEG
- **Use case:** STEEB UI screenshots, error messages, code snippets

#### JPEG (Joint Photographic Experts Group)
- **Best for:** Photographs, complex images, gradients
- **Pros:** Small file sizes, widely supported
- **Cons:** Lossy compression, no transparency
- **Use case:** Product photos, team pictures, event images

#### WebP (Web Picture Format)
- **Best for:** Web applications, modern browsers
- **Pros:** Excellent compression, supports both lossy and lossless
- **Cons:** Not supported by all older systems
- **Use case:** Modern web deployments, progressive loading

### Secondary Formats

#### GIF (Graphics Interchange Format)
- **Best for:** Simple animations, limited colors
- **Pros:** Supports animation, widely supported
- **Cons:** Limited to 256 colors, larger than WebP
- **Use case:** STEEB loading animations, simple UI demos

#### SVG (Scalable Vector Graphics)
- **Best for:** Icons, logos, simple illustrations
- **Pros:** Infinitely scalable, small file sizes
- **Cons:** Not for photographs
- **Use case:** STEEB logo, icons, diagrams

## Format Conversion Guidelines

### Screenshots → PNG
```
# Always save screenshots as PNG
# Maintains text readability and UI clarity
```

### Photos → JPEG
```
# Use JPEG for photographs
# Better compression with acceptable quality loss
```

### Web Optimization → WebP
```
# Convert to WebP for web deployment
# Better performance with modern browsers
```

## File Size Optimization

### Target Sizes
- **Claude Code:** < 5MB per image
- **Web:** < 500KB for UI images, < 1MB for photos
- **Documentation:** < 200KB for diagrams, < 500KB for screenshots

### Compression Settings
```
JPEG Quality:
- High quality: 90-95% (documentation)
- Medium quality: 80-85% (web use)
- Low quality: 60-75% (thumbnails)

PNG Compression:
- Use PNG-8 for simple images (max 256 colors)
- Use PNG-24 for complex images with transparency
```

## Resolution Guidelines

### Screenshots and UI
- **Minimum:** 1280x720 (HD)
- **Recommended:** 1920x1080 (Full HD)
- **Maximum:** 2560x1440 (2K)

### Photographs
- **Web:** 1920x1080 maximum
- **Print:** 300 DPI at target size
- **Thumbnails:** 150x150 or 300x300

### Diagrams and Documentation
- **Vector:** SVG when possible
- **Raster:** Minimum 2x actual display size
- **Text readability:** Minimum 14px equivalent

## Color Considerations

### STEEB Brand Colors
```css
--primary-black: #000000
--primary-white: #FFFFFF
--accent-blue: #3B82F6
--accent-green: #10B981
--accent-red: #EF4444
--accent-yellow: #F59E0B
```

### Color Accessibility
- **Contrast ratio:** Minimum 4.5:1 for WCAG AA compliance
- **Color blind friendly:** Test with color blindness simulators
- **Dark mode:** Ensure visibility in both light and dark modes

## Best Practices

### Naming Conventions
```
screenshots/
  ├── steeb-dashboard-2024-01-15.png
  ├── task-management-mobile-view.png
  └── error-message-bug-report.png

photos/
  ├── team-photo-2024-q1.jpg
  ├── product-launch-event.jpg
  └── office-workspace.jpg
```

### Metadata
```
# Include relevant metadata for better organization
- Date taken/created
- Context/purpose
- Environment/device
- Version information
```

### Backup Strategy
```
1. Original high-resolution images
2. Web-optimized versions
3. Thumbnail versions
4. Source files (PSD, AI, etc.)
```

## Troubleshooting

### Common Issues

#### Text Not Readable in Screenshots
- Increase display scaling before capturing
- Use PNG format instead of JPEG
- Capture at higher resolution
- Check font rendering settings

#### File Size Too Large
- Optimize with image compression tools
- Reduce resolution if appropriate
- Use more efficient formats (WebP)
- Crop unnecessary areas

#### Color Inconsistencies
- Use sRGB color profile
- Avoid color profile conversions
- Test on different displays
- Maintain consistent color space

#### Upload Failures
- Check file format compatibility
- Verify file size limits
- Ensure proper file permissions
- Test with different browsers

### Tools and Resources

#### Image Optimization Tools
- **Online:** TinyPNG, Squoosh, ImageOptim
- **Desktop:** ImageOptim (Mac), FileOptimizer (Windows)
- **Command Line:** `optimizilla`, `cwebp`, `pngquant`

#### Image Analysis Tools
- **Color picker:** ColorZilla, Adobe Color
- **Accessibility:** Contrast Checker, WAVE
- **Performance:** PageSpeed Insights, Lighthouse

#### Format Converters
- **Online:** CloudConvert, Zamzar
- **Desktop:** XnConvert, IrfanView
- **Command Line:** `convert` (ImageMagick), `ffmpeg`