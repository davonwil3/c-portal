# AI Assistant Cleanup Guide

## ✅ Completed
- Removed invoice/form/contract RAG uploads
- Deleted `lib/rag-upload-helpers.ts`
- Cleaned up unnecessary vector store logic

## 🔧 Still To Do

### 1. Portal Slug Page (`app/[company]/[client]/page.tsx`)

**Remove these imports (lines ~24-26):**
```typescript
MessageCircle,
Sparkles,
Paperclip,
Send,
```

**Remove state variables (lines ~441-452):**
```typescript
const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
const [aiMessages, setAiMessages] = useState([...])
const [aiInput, setAiInput] = useState("")
const [isAiTyping, setIsAiTyping] = useState(false)
```

**Remove useEffect (lines ~524-534):**
```typescript
// Reset AI chat when project changes
useEffect(() => {
  setAiMessages([...])
}, [selectedProject?.id])
```

**Remove handler functions (lines ~1133-end of RichAIMessage ~1370):**
- `handleSendAiMessage`
- `handleQuickSuggestion`
- `quickSuggestions` array
- `RichAIMessage` component

**Remove entire AI UI section (lines ~2571-2870):**
- AI Assistant Floating Button
- AI Assistant Panel (desktop)
- AI Assistant Panel (mobile)

### 2. Portal Settings (`app/dashboard/portals/[id]/portal-settings/page.tsx`)

**Remove AI Assistant settings tab:**
- Find and remove the AI Assistant tab/section from portal settings

### 3. Dashboard AI Page

**Delete entire file:**
```bash
rm -rf app/dashboard/ai-assistant
```

### 4. AI Library Files

**Delete these files:**
```bash
rm -f lib/ai/enhanced-rag-service.ts
rm -f lib/ai/function-handlers.ts
rm -f lib/ai/function-definitions.ts
rm -f lib/ai/types.ts
rm -f lib/ai/rag-service.ts
rm -f lib/ai/vector-store.ts
rm -f lib/ai/vector-store.server.ts
```

### 5. API Routes

**Delete AI API routes:**
```bash
rm -rf app/api/ai
```

### 6. Database

**Remove vector_store_id column from clients table:**
```sql
ALTER TABLE public.clients DROP COLUMN IF EXISTS vector_store_id;
```

**Delete OpenAI vector stores** (if any were created) from your OpenAI dashboard.

---

## 🚀 Quick Cleanup Script

Save this as `cleanup_ai.sh` and run with `bash cleanup_ai.sh`:

```bash
#!/bin/bash
echo "🧹 Cleaning up AI Assistant..."

# Delete AI library files
rm -f lib/ai/enhanced-rag-service.ts
rm -f lib/ai/function-handlers.ts  
rm -f lib/ai/function-definitions.ts
rm -f lib/ai/types.ts
rm -f lib/ai/rag-service.ts
rm -f lib/ai/vector-store.ts
rm -f lib/ai/vector-store.server.ts

# Delete AI API routes
rm -rf app/api/ai

# Delete AI dashboard page
rm -rf app/dashboard/ai-assistant

echo "✅ AI Assistant cleanup complete!"
echo "⚠️  Manual steps remaining:"
echo "   1. Remove AI code from app/[company]/[client]/page.tsx"
echo "   2. Remove AI settings from portal settings page"
echo "   3. Run database migration to remove vector_store_id column"
```

