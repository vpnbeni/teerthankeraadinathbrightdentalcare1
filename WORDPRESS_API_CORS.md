# WordPress API CORS Configuration

## Important: Enable CORS for Your Subdomains

Since your client and admin apps are on subdomains, you need to enable CORS on your WordPress API.

---

## Option 1: Using WordPress Plugin (Easiest)

### Install "WP CORS" Plugin:

1. Log in to WordPress admin
2. Go to **Plugins** → **Add New**
3. Search for **"WP CORS"**
4. Install and activate
5. Go to **Settings** → **WP CORS**
6. Add allowed origins:
   ```
   https://client.teerthankeraadinathbrightdentalcare.in
   https://admin.teerthankeraadinathbrightdentalcare.in
   ```

---

## Option 2: Add to .htaccess (Recommended)

Add this to your WordPress `.htaccess` file in `/public_html/`:

```apache
# CORS Headers for API
<IfModule mod_headers.c>
    # Allow requests from subdomains
    SetEnvIf Origin "^https?://(client|admin)\.teerthankeraadinathbrightdentalcare\.in$" AccessControlAllowOrigin=$0
    Header set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    
    # Allow methods
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    
    # Allow headers
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Allow credentials
    Header set Access-Control-Allow-Credentials "true"
    
    # Preflight cache
    Header set Access-Control-Max-Age "3600"
</IfModule>
```

**Location**: Add this at the **top** of `/public_html/.htaccess`

---

## Option 3: Add to functions.php

Add this to your WordPress theme's `functions.php`:

```php
<?php
// Enable CORS for API
function add_cors_http_header() {
    $allowed_origins = [
        'https://client.teerthankeraadinathbrightdentalcare.in',
        'https://admin.teerthankeraadinathbrightdentalcare.in'
    ];
    
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
    }
    
    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit();
    }
}
add_action('init', 'add_cors_http_header');
add_action('rest_api_init', 'add_cors_http_header');
?>
```

**Location**: Add to `wp-content/themes/YOUR_THEME/functions.php`

---

## Test CORS Configuration

### Using Browser Console:

```javascript
// Test from client.teerthankeraadinathbrightdentalcare.in
fetch('https://teerthankeraadinathbrightdentalcare.in/api/plans')
  .then(res => res.json())
  .then(data => console.log('API working:', data))
  .catch(err => console.error('API error:', err));
```

### Expected Response:

✅ No CORS errors in console
✅ Data returned successfully

### If CORS Error:

❌ Error: "Access to fetch at '...' has been blocked by CORS policy"

**Solution**: Apply one of the three options above

---

## Security Note

For production, consider:

1. **Limit to specific origins** (don't use `*`)
2. **Enable HTTPS only** (no HTTP)
3. **Add API authentication** (JWT tokens)
4. **Rate limiting** on API endpoints

---

## Verification Checklist

- [ ] CORS headers configured
- [ ] Client can fetch from API
- [ ] Admin can fetch from API
- [ ] No console errors
- [ ] Authentication working
- [ ] Preflight requests handled

---

## Common Issues

### Issue: OPTIONS request fails

**Solution**: Add OPTIONS handling in .htaccess or functions.php

### Issue: Credentials not sent

**Solution**: Set `Access-Control-Allow-Credentials: true`

### Issue: Wildcard not working

**Solution**: Don't use `*` with credentials, specify exact origins

---

## WordPress REST API Endpoints

Your API should be accessible at:

```
https://teerthankeraadinathbrightdentalcare.in/wp-json/
https://teerthankeraadinathbrightdentalcare.in/wp-json/wp/v2/
https://teerthankeraadinathbrightdentalcare.in/api/
```

Test these URLs directly in browser to verify WordPress REST API is working.

---

**Once CORS is configured, your React apps can communicate with WordPress API!** ✅

