# Portal Domain Configuration

This guide explains how to configure your portal domains for both development and production.

## Development (Current Setup)

In development, the system automatically uses `localhost:3000` with slug-based routing:

- **Company Login:** `http://localhost:3000/{company-slug}`
- **Client Portal:** `http://localhost:3000/{company-slug}/{client-slug}`
- **Magic Links:** `http://localhost:3000/{company-slug}?client={client-slug}&token={token}`

## Production Setup

When you're ready to deploy to production, you have two options:

### Option 1: Use Your Own Domain (Recommended)

1. **Set Environment Variable:**
   ```bash
   PORTAL_DOMAIN=yourdomain.com
   ```

2. **Configure DNS:**
   - Set up wildcard DNS: `*.yourdomain.com` → your server IP
   - Or configure specific subdomains for each company

3. **Portal URLs will be:**
   - **Company Login:** `https://{company-slug}.yourdomain.com`
   - **Client Portal:** `https://{company-slug}.{client-slug}.yourdomain.com`
   - **Magic Links:** `https://{company-slug}.{client-slug}.yourdomain.com?token={token}`

### Option 2: Use Default Domain

If you don't set `PORTAL_DOMAIN`, it defaults to `clientportalhq.com`:

- **Company Login:** `https://{company-slug}.clientportalhq.com`
- **Client Portal:** `https://{company-slug}.{client-slug}.clientportalhq.com`

## Environment Variables

Add these to your `.env.local` (development) and production environment:

```bash
# Required
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional - for production
PORTAL_DOMAIN=yourdomain.com  # Your custom domain
FROM_EMAIL=noreply@yourdomain.com  # For magic link emails
```

## How It Works

1. **Portal Creation:** When you create a portal, it stores the full URL in the database
2. **Portal Check:** The system checks if a portal exists by matching the URL pattern
3. **Magic Links:** Generated with the appropriate domain based on environment
4. **Flexible Routing:** Works with any domain you configure

## Testing

1. **Development:** Everything works with `localhost:3000`
2. **Production:** Just set `PORTAL_DOMAIN` and configure DNS
3. **No Code Changes:** The system automatically adapts to your domain

## Examples

### Development URLs
- `http://localhost:3000/acme-corp`
- `http://localhost:3000/acme-corp/tech-startup`
- `http://localhost:3000/acme-corp?client=tech-startup&token=abc123`

### Production URLs (with PORTAL_DOMAIN=mycompany.com)
- `https://acme-corp.mycompany.com`
- `https://acme-corp.tech-startup.mycompany.com`
- `https://acme-corp.tech-startup.mycompany.com?token=abc123`

The system is completely plug-and-play - just set your domain and it works! 🚀
