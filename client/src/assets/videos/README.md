# Video Assets

## Background Video for Login Page

**IMPORTANT**: Place your background video file in the `client/public/assets/videos/` folder with the name: `dental-background.mp4`

### Video Requirements:
- **Format**: MP4 (recommended for best browser compatibility)
- **Resolution**: 1920x1080 (Full HD) or higher
- **Duration**: 10-30 seconds (for smooth looping)
- **File Size**: Keep under 10MB for optimal loading performance
- **Content**: Should showcase your dental practice, modern equipment, or professional atmosphere

### Video Optimization Tips:
1. **Compress your video** to reduce file size while maintaining quality
2. **Use H.264 codec** for maximum browser compatibility
3. **Consider creating a poster image** (optional fallback)
4. **Test on mobile devices** to ensure smooth playback

### Alternative Options:
If you don't have a video ready, the page will fall back to a beautiful gradient background with your theme colors.

### File Path:
```
client/public/assets/videos/dental-background.mp4
```

**Note**: The video must be in the `public` folder so it can be accessed directly by the browser at runtime.

### Supported Formats:
- MP4 (primary)
- WebM (modern browsers)
- OGG (older browsers)

The video will automatically:
- Play on loop
- Be muted (for better user experience)
- Start automatically when the page loads
- Cover the entire right side of the login page
- Maintain aspect ratio
