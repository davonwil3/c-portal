# Tour Dummy Data System

This document explains how the tour dummy data system works and how to add it to new pages.

## Overview

The tour dummy data system automatically displays realistic dummy data when a tour is running, making the UI look full and professional. When the tour ends, the page reverts to showing real data.

## Architecture

### Key Files

1. **`lib/tour-dummy-data.ts`** - Centralized dummy data for all pages
2. **`contexts/TourContext.tsx`** - Tour context that exposes `isTourRunning` boolean

### How It Works

1. Pages import `useTour` hook from `TourContext`
2. Pages check `isTourRunning` boolean
3. When `true`, pages display dummy data instead of real data
4. When `false`, pages display real data from API/database

## Adding Tour Support to a New Page

### Step 1: Import Dependencies

```typescript
import { useTour } from "@/contexts/TourContext"
import { dummyClients } from "@/lib/tour-dummy-data" // Import relevant dummy data
```

### Step 2: Add Tour Hook

```typescript
export default function MyPage() {
  const { isTourRunning } = useTour()
  // ... rest of component
}
```

### Step 3: Update Data Loading Logic

#### Option A: For API-based data loading

```typescript
useEffect(() => {
  async function loadData() {
    // Skip loading real data during tours
    if (isTourRunning) {
      setData(dummyData) // Use dummy data
      setLoading(false)
      return
    }
    
    // Load real data from API
    const realData = await fetchData()
    setData(realData)
    setLoading(false)
  }
  
  loadData()
}, [isTourRunning]) // Re-run when tour status changes
```

#### Option B: For computed/derived data

```typescript
const displayData = useMemo(() => {
  if (isTourRunning) {
    return dummyData
  }
  return realData
}, [isTourRunning, realData])
```

### Step 4: Update Render Logic

Use the conditional data in your render:

```typescript
return (
  <div>
    {displayData.map(item => (
      <Card key={item.id}>{item.name}</Card>
    ))}
  </div>
)
```

## Currently Supported Pages

### Core Dashboard Pages
- ✅ **Dashboard (main page)** - `/app/dashboard/page.tsx`
  - Shows analytics KPIs, revenue data, active clients/projects
- ✅ **Automations** - `/app/dashboard/automations/page.tsx`
  - Displays 6 realistic automation workflows with triggers and actions
- ✅ **Clients** - `/app/dashboard/clients/page.tsx`
  - Shows 4 dummy clients with full contact details
- ✅ **Portals** - `/app/dashboard/portals/page.tsx`
  - Displays 3 active client portals with activity metrics
- ✅ **Projects** - `/app/dashboard/projects/page.tsx`
  - Shows 4 projects in various stages with budgets and progress
- ✅ **Messages** - `/app/dashboard/messages/page.tsx`
  - Displays project-based messaging with conversation threads
- ✅ **Pipeline** - `/app/dashboard/pipeline/page.tsx`
  - Shows kanban board with leads across 7 pipeline stages

## Available Dummy Data

See `lib/tour-dummy-data.ts` for all available dummy data:

### Business Data
- `dummyClients` (4 items) - Client records with contact details, revenue, projects
- `dummyProjects` (4 items) - Projects with status, budget, progress, team size
- `dummyContracts` (3 items) - Contracts with signing status and values
- `dummyInvoices` (4 items) - Invoices with payment status, line items, due dates
- `dummyProposals` (3 items) - Proposals with status, expiry, and values

### Lead Management
- `dummyLeads` (3 items) - Individual leads with source, status, value
- `dummyPipelineLeads` (object) - Organized leads across 7 pipeline stages (new, contacted, qualified, proposal, negotiation, won, lost)

### Communications
- `dummyMessages` (3 items) - Client messages with timestamps
- `dummyForms` (3 items) - Form data with submission counts
- `dummyFiles` (4 items) - File uploads with metadata and approval status

### Operations
- `dummyAutomations` (6 items) - Automation workflows with triggers and actions
- `dummyPortals` (3 items) - Portal configurations with activity data
- `dummyTimeEntries` (3 items) - Time tracking with billable hours
- `dummyTasks` (5 items) - Tasks with assignees, priorities, due dates
- `dummyMeetings` (4 items) - Scheduled meetings with clients

### Analytics & Activity
- `dummyAnalytics` (object) - Revenue, clients, projects, invoices metrics
- `dummyActivities` (5 items) - Activity log entries with types and timestamps
- `dummyNotifications` (4 items) - System notifications with read status

### Team
- `dummyTeamMembers` (3 items) - Team members with roles and status

## Adding New Dummy Data

To add dummy data for a new page:

1. Open `lib/tour-dummy-data.ts`
2. Add a new exported constant with realistic data
3. Follow the existing patterns for structure
4. Export it at the bottom of the file

Example:

```typescript
export const dummyInvoices = [
  {
    id: "inv-1",
    number: "INV-001",
    client: "Acme Corporation",
    amount: 5000,
    status: "paid",
    dueDate: "2024-01-15",
  },
  // ... more dummy invoices
]
```

## Best Practices

1. **Realistic Data** - Use realistic names, dates, and values
2. **Sufficient Volume** - Include enough items to make the UI look full (5-10 items minimum)
3. **Variety** - Include different statuses, types, and states
4. **Consistency** - Use the same client names across different dummy data sets
5. **Type Safety** - Ensure dummy data matches the expected TypeScript types

## Troubleshooting

### Dummy data not showing during tour

- Check that `isTourRunning` is properly imported and used
- Verify the useEffect dependency array includes `isTourRunning`
- Ensure dummy data is properly imported from `lib/tour-dummy-data.ts`

### Type errors with dummy data

- Ensure dummy data structure matches the expected interface/type
- Add type casting if necessary: `as MyType`
- Check for required vs optional fields

### Data not reverting after tour ends

- Verify useEffect includes `isTourRunning` in dependency array
- Check that data loading logic properly handles both tour and non-tour states
- Ensure there's no caching preventing reload

## Future Enhancements

- Add dummy data for additional pages (invoices, proposals, etc.)
- Create a visual indicator showing "Tour Mode"
- Add ability to customize dummy data per tour
- Implement dummy data persistence across tour steps

