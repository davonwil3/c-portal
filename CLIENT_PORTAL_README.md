# Client Portal System

This system provides a client portal flow where clients can access their portal through custom subdomains.

## 🚀 How It Works

### **URL Structure:**
- **Company Authentication**: `[company].clientportalhq.com` → Shows login page
- **Client Portal**: `[company].clientportalhq.com/portal/[client]` → Shows client dashboard

### **Examples:**
- `acme-co.clientportalhq.com` → Acme Corp login page
- `acme-co.clientportalhq.com/portal/sarah-johnson` → Sarah's client portal
- `techstart.clientportalhq.com` → TechStart login page
- `techstart.clientportalhq.com/portal/mike-chen` → Mike's client portal

## 📁 File Structure

```
app/
├── [company]/
│   ├── page.tsx              # Company authentication page
│   ├── loading.tsx           # Loading state for company page
│   └── [client]/
│       ├── page.tsx          # Client portal dashboard
│       └── loading.tsx       # Loading state for client portal
├── portal/                   # Legacy portal structure (kept for reference)
│   └── [client-slug]/
└── middleware.ts             # Handles subdomain routing
```

## 🔧 Setup Instructions

### **1. DNS Configuration**
Configure your DNS to handle wildcard subdomains:
```
*.clientportalhq.com → Your server IP
```

### **2. Environment Variables**
Add to your `.env.local`:
```bash
NEXT_PUBLIC_APP_DOMAIN=clientportalhq.com
```

### **3. Deploy**
The system will automatically handle subdomain routing through the middleware.

## 🎯 Features

### **Company Authentication Page (`[company]/page.tsx`)**
- ✅ Company-branded login form
- ✅ Email/password authentication
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

### **Client Portal (`[company]/[client]/page.tsx`)**
- ✅ Personalized client dashboard
- ✅ Project overview with progress
- ✅ Quick action items
- ✅ Recent files and invoices
- ✅ Message system
- ✅ Company branding integration

### **Middleware Routing**
- ✅ Automatic subdomain detection
- ✅ URL rewriting for clean URLs
- ✅ Handles both company and client routes

## 🎨 Customization

### **Adding New Companies**
1. Add company data to the `getClientData` function in `[company]/[client]/page.tsx`
2. Configure branding (logo, colors, background images)
3. Set up client-specific data

### **Branding Options**
```typescript
branding: {
  logo: "company-logo.png",
  primaryColor: "#3C3CFF",
  headerBackgroundImage: "header-bg.jpg",
  useBackgroundImage: true, // or false for solid color
}
```

### **Client Data Structure**
```typescript
{
  clientName: "Client Name",
  companyName: "Company Name",
  avatar: "CN",
  projects: [...],
  actionItems: [...],
  recentFiles: [...],
  invoices: [...]
}
```

## 🔐 Authentication

### **Current Implementation**
- Basic form validation
- Simulated login (redirects to portal)
- No persistent authentication

### **To Add Real Authentication**
1. Integrate with your auth system (Supabase, Auth0, etc.)
2. Add session management
3. Implement protected routes
4. Add logout functionality

## 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Responsive grid layouts
- ✅ Touch-friendly interactions
- ✅ Optimized for all screen sizes

## 🚀 Performance

- ✅ Loading states for better UX
- ✅ Optimized images and assets
- ✅ Efficient routing with middleware
- ✅ Minimal bundle size

## 🔍 Testing

### **Local Development**
1. Start your development server
2. Visit `localhost:3000/acme-co` (company page)
3. Visit `localhost:3000/acme-co/sarah-johnson` (client portal)

### **Production Testing**
1. Deploy to your domain
2. Test with real subdomains
3. Verify DNS routing works correctly

## 🐛 Troubleshooting

### **Common Issues**

**Subdomain not working:**
- Check DNS configuration
- Verify middleware is working
- Check server logs

**Routes not found:**
- Ensure file structure matches exactly
- Check Next.js routing configuration
- Verify middleware matcher patterns

**Authentication issues:**
- Check form validation
- Verify redirect logic
- Test with different browsers

## 🔮 Future Enhancements

- [ ] Real authentication system
- [ ] Database integration for dynamic data
- [ ] File upload/download functionality
- [ ] Real-time messaging
- [ ] Payment processing
- [ ] Multi-language support
- [ ] Advanced branding options
- [ ] Analytics and tracking

## 📞 Support

For questions or issues:
1. Check this README
2. Review the code structure
3. Test with different scenarios
4. Check browser console for errors

---

**Built with Next.js 14, TypeScript, and Tailwind CSS** 