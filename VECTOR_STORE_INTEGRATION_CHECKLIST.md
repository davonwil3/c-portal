# OpenAI Vector Store Integration Checklist

## ✅ Database Schema
- [ ] Run SQL migration: `supabase/add_vector_store_to_clients.sql`
- [ ] Verify `clients.vector_store_id` column exists
- [ ] Test client creation to ensure vector store ID is stored

## ✅ Client Creation
- [ ] **File**: `lib/clients.ts` - `createClient()` function
- [ ] **Logic**: Creates OpenAI Vector Store when client is created
- [ ] **Storage**: Stores `vector_store_id` in `clients` table
- [ ] **Naming**: Vector stores named `cp:{accountId}:client:{clientId}`

## ✅ File Type Uploads to Vector Store

### Invoices
- [ ] **File**: `lib/invoices.ts` - `createInvoice()` and `updateInvoice()`
- [ ] **Helper**: `lib/rag-upload-helpers.ts` - `uploadInvoiceToRAG()`
- [ ] **Text Function**: `createInvoiceTextForVector()` creates structured text
- [ ] **Upload**: Uses `uploadTextToVectorStore()` to add to client's vector store

### Forms
- [ ] **File**: `lib/forms.ts` - `publishForm()` and `updateAndPublishForm()`
- [ ] **Helper**: `lib/rag-upload-helpers.ts` - `uploadFormToRAG()`
- [ ] **Text Function**: `createFormTextForVector()` creates structured text
- [ ] **Upload**: Uses `uploadTextToVectorStore()` to add to client's vector store

### Contracts
- [ ] **File**: `lib/contracts.ts` - `createContract()` and `createContractFromTemplate()`
- [ ] **Text Function**: `createContractTextForVector()` creates structured text
- [ ] **Upload**: Direct vector store upload in contract creation functions

### Files
- [ ] **File**: `lib/files.ts` - `createFile()` function
- [ ] **Text Function**: `createFileTextForVector()` creates metadata text
- [ ] **Upload**: Direct vector store upload in file creation function

## ✅ AI Query System
- [ ] **File**: `lib/ai/rag-service.ts` - Simplified to use only vector stores
- [ ] **Method**: Uses OpenAI Responses API with `file_search` tool
- [ ] **Vector Store**: Gets client's vector store ID from database
- [ ] **Context**: Includes conversation history + vector store search

## ✅ Vector Store Management
- [ ] **File**: `lib/ai/vector-store.ts` - Core vector store functions
- [ ] **Creation**: `ensureVectorStore()` creates/finds vector stores
- [ ] **Upload**: `uploadTextToVectorStore()` adds files to vector stores
- [ ] **Retrieval**: `getVectorStoreIdForConversation()` gets stored vector store ID

## ✅ Testing Checklist

### Client Creation Test
1. Create a new client via dashboard
2. Verify vector store is created in OpenAI
3. Verify `vector_store_id` is stored in database
4. Check vector store name format: `cp:{accountId}:client:{clientId}`

### File Upload Tests
1. **Invoice**: Create invoice → Check vector store has `invoice-{id}.txt`
2. **Form**: Publish form → Check vector store has `form-{id}.txt`
3. **Contract**: Create contract → Check vector store has `contract-{id}.txt`
4. **File**: Upload file → Check vector store has `file-{id}.txt`

### AI Query Test
1. Ask AI: "What invoices do I have?"
2. Ask AI: "Show me my contracts"
3. Ask AI: "What files are available?"
4. Verify AI can find and reference uploaded content

## ✅ Environment Variables
- [ ] `OPENAI_API_KEY` is set
- [ ] OpenAI account has Vector Stores access
- [ ] Vector Stores API is enabled

## ✅ Error Handling
- [ ] Vector store creation failures don't break client creation
- [ ] File upload failures don't break file creation
- [ ] AI queries gracefully handle missing vector stores
- [ ] Proper error logging for debugging

## ✅ Performance Considerations
- [ ] Vector store creation is async and non-blocking
- [ ] File uploads to vector store are non-blocking
- [ ] AI queries use efficient file_search
- [ ] Vector stores are per-client for isolation

## 🔧 Debugging Tools

### Check Vector Store Status
```javascript
// Check if client has vector store ID
const { data: client } = await supabase
  .from('clients')
  .select('vector_store_id')
  .eq('id', clientId)
  .single()
console.log('Client vector store ID:', client.vector_store_id)
```

### List Vector Stores
```javascript
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const stores = await openai.vectorStores.list()
console.log('All vector stores:', stores.data)
```

### Check Vector Store Files
```javascript
const files = await openai.vectorStores.files.list(vectorStoreId)
console.log('Vector store files:', files.data)
```

## 📋 Implementation Status

- ✅ Vector store creation on client creation
- ✅ Invoice upload to vector store
- ✅ Form upload to vector store  
- ✅ Contract upload to vector store
- ✅ File upload to vector store
- ✅ AI query using vector stores
- ✅ Proper OpenAI SDK usage
- ✅ Error handling and logging
- ✅ Database schema updates

## 🚀 Next Steps

1. Run SQL migration to add `vector_store_id` column
2. Test client creation to verify vector store creation
3. Test each file type upload to verify vector store population
4. Test AI queries to verify vector store search works
5. Monitor OpenAI usage and costs
6. Consider cleanup of old vector stores for deleted clients
