# ✅ Vector Store Integration - Complete Setup Guide

## Overview
Your application now uses **OpenAI Vector Stores** for RAG (Retrieval-Augmented Generation) functionality. Each client gets their own dedicated vector store where all their files (invoices, contracts, forms, and general files) are automatically uploaded.

---

## 🎯 How It Works

### 1. **Client Creation** → **Vector Store Creation**
When a new client is created in your system:
- **File**: `lib/clients.ts`
- **Function**: `createClient()`
- **Process**:
  1. Client record is created in Supabase
  2. `ensureVectorStore(accountId, clientId)` is called
  3. A new OpenAI Vector Store is created with name format: `cp:{accountId}:client:{clientId}`
  4. The `vector_store_id` is saved to the `clients` table in Supabase

### 2. **File Upload** → **Vector Store Upload**
When any document is created/updated, it's automatically sent to the client's vector store:

#### **Invoices** (`lib/invoices.ts`)
- Functions: `createInvoice()`, `updateInvoice()`
- Uploads text content containing: invoice number, amount, status, date, items

#### **Forms** (`lib/forms.ts`)
- Functions: `publishForm()`, `updateAndPublishForm()`
- **Note**: Only PUBLISHED forms are uploaded (drafts are NOT uploaded)
- Uploads form template and field information

#### **Contracts** (`lib/contracts.ts`)
- Functions: `createContract()`, `createContractFromTemplate()`
- Uploads contract title, terms, and metadata

#### **General Files** (`lib/files.ts`)
- Function: `createFile()`
- Uploads file metadata: name, type, description, tags

### 3. **AI Assistant** → **Vector Store Search**
When a client asks a question:
- **File**: `lib/ai/rag-service.ts`
- **Function**: `generateAnswer()`
- **Process**:
  1. Retrieves the client's `vector_store_id` from database
  2. Sends question to OpenAI with `file_search` tool
  3. OpenAI searches the vector store for relevant information
  4. Returns AI-generated answer based on client's documents

---

## 📋 Database Schema

### Added Column to `clients` Table
```sql
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS vector_store_id TEXT;

COMMENT ON COLUMN public.clients.vector_store_id IS 'OpenAI Vector Store ID for client-specific RAG';
```

**Migration File**: `supabase/add_vector_store_to_clients.sql`

---

## 🔧 Core Files

### Vector Store Service (`lib/ai/vector-store.ts`)
**Key Functions**:

1. **`ensureVectorStore(accountId, clientId)`**
   - Finds or creates a vector store for a client
   - Returns the `vector_store_id`
   
2. **`uploadTextToVectorStore(vectorStoreId, fileName, content)`**
   - Creates temporary file from text content
   - Uploads to OpenAI using `fs.createReadStream()`
   - Attaches file to the vector store
   - Cleans up temporary file

3. **`getVectorStoreIdForConversation(accountId, clientId)`**
   - Retrieves `vector_store_id` from Supabase `clients` table
   - Used by RAG service to find the correct vector store

### RAG Service (`lib/ai/rag-service.ts`)
**Key Functions**:

1. **`generateAnswer(question, accountId, clientId, projectId)`**
   - Gets the client's vector store ID
   - Calls OpenAI Responses API with `file_search` tool
   - Returns AI-generated answer

2. **`callLLM(context, vectorStoreId)`**
   - Private method that constructs the OpenAI API payload
   - Uses `gpt-5-nano` model
   - Includes `file_search` tool and vector store attachment

---

## 🔑 Environment Variables Required

```bash
OPENAI_API_KEY=sk-...
```

**Location**: `.env.local`

**Note**: The OpenAI client is initialized lazily to ensure environment variables are loaded in the Next.js runtime context.

---

## 🚀 Upload Flow Example

### Example: Creating an Invoice

```typescript
// 1. Invoice is created in database
const invoice = await createInvoice(invoiceData)

// 2. In createInvoice(), after DB insert:
if (invoice.client_id) {
  // Get client's vector store ID
  const vectorStoreId = await getVectorStoreIdForConversation(accountId, invoice.client_id)
  
  // Create text content for the invoice
  const invoiceText = createInvoiceTextForVector(invoice)
  
  // Upload to vector store
  await uploadTextToVectorStore(
    vectorStoreId,
    `invoice-${invoice.invoice_number}.txt`,
    invoiceText
  )
}
```

---

## 📊 What Gets Uploaded to Vector Stores

### Invoice Text Format:
```
INVOICE #INV-001
Date: 2024-01-15
Amount: $1,000.00
Status: Paid
Due Date: 2024-02-15

Items:
- Web Design Service: $800.00 x 1
- Hosting Setup: $200.00 x 1
```

### Form Text Format:
```
FORM: Client Onboarding Form
Status: Published

Fields:
- Full Name (text) - Required
- Email Address (email) - Required
- Company Name (text)
...
```

### Contract Text Format:
```
CONTRACT: Website Development Agreement
Status: Draft

Terms:
[Contract content here]

Metadata:
Client: Acme Corp
Value: $5,000
```

### File Text Format:
```
FILE: logo-design-v2.png
Type: Design Asset
Size: 245 KB
Description: Updated company logo with new color scheme

Tags:
- Design
- Branding
```

---

## ✅ Integration Checklist

- [x] SQL migration to add `vector_store_id` column to `clients` table
- [x] Vector store creation on client creation
- [x] Invoice uploads to vector store
- [x] Form uploads to vector store (published only)
- [x] Contract uploads to vector store
- [x] General file uploads to vector store
- [x] RAG service retrieves from vector stores
- [x] AI Assistant uses vector stores for answers
- [x] Environment variables configured correctly
- [x] Lazy initialization for OpenAI client

---

## 🧪 Testing

The integration has been tested and verified:
- ✅ Vector stores can be created
- ✅ Files can be uploaded using `fs.createReadStream()`
- ✅ Files can be attached to vector stores
- ✅ Files appear in vector store listings
- ✅ Environment variables load correctly in Next.js runtime

---

## 🎯 Next Steps

1. **Run the SQL migration** (if not already done):
   ```sql
   -- Execute: supabase/add_vector_store_to_clients.sql
   ```

2. **Create new clients** to test vector store creation

3. **Upload documents** (invoices, contracts, forms, files) to verify they're being sent to vector stores

4. **Test the AI Assistant** on the portal slug page to verify it can search and answer questions from the vector store

5. **Monitor OpenAI usage** in your OpenAI dashboard to see file uploads and storage usage

---

## 📝 Important Notes

- **Drafts are NOT uploaded**: Only published forms are sent to vector stores
- **Temporary files are cleaned up**: The system creates temp files for upload, then deletes them
- **Client isolation**: Each client has their own vector store, ensuring data privacy
- **Automatic updates**: When documents are updated, new versions are uploaded to the vector store
- **No beta API**: The implementation uses the stable OpenAI API (no `beta` prefix needed)

---

## 🔍 Debugging

If files aren't appearing in vector stores:

1. **Check logs** for upload messages:
   - `📤 Uploading file to OpenAI: {fileName}`
   - `✅ File uploaded to OpenAI: {fileId}`
   - `✅ File attached to vector store: {fileName}`

2. **Verify environment variables**:
   ```bash
   echo $OPENAI_API_KEY
   ```

3. **Check Supabase** for `vector_store_id` in clients table

4. **Check OpenAI dashboard** for:
   - Vector store count
   - File count in each vector store
   - Storage usage

---

## 🎉 Conclusion

Your RAG system is now fully integrated with OpenAI Vector Stores! Every client gets their own private knowledge base that the AI Assistant can search to answer questions about their projects, invoices, contracts, and files.

