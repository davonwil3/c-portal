# 🔧 OpenAI Function Calling Implementation Guide

## Overview

The AI Assistant now uses the **correct OpenAI Responses API function calling pattern** with:

1. **Proper function definitions** with `type: 'function'`, `strict: true`, and `additionalProperties: false`
2. **Multi-turn conversation flow** where functions are called, results are returned, and final response is generated
3. **Intelligent metadata filtering** for vector store document search
4. **Combined tools** including both `file_search` and function calling

---

## 🎯 How Function Calling Works

### **Step 1: Define Functions**

All functions are defined in `lib/ai/function-definitions.ts` following the OpenAI schema:

```typescript
{
  type: 'function',
  name: 'getProjectStatus',
  description: 'Get the current status, progress, and timeline of a specific project.',
  parameters: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'The ID of the project to get status for'
      }
    },
    required: ['projectId'],
    additionalProperties: false
  },
  strict: true
}
```

**Key Fields:**
- `type`: Always `'function'`
- `name`: Function identifier (e.g., `getProjectStatus`)
- `description`: When and how to use the function
- `parameters`: JSON schema defining input arguments
- `additionalProperties: false`: Enforces strict schema
- `strict: true`: Enables strict mode for better reliability

---

### **Step 2: Initial API Call**

```typescript
const tools = [
  {
    type: 'file_search',
    vector_store_ids: [vectorStoreId]
  },
  ...AI_FUNCTIONS  // All 10 function definitions
]

const input = [
  { role: 'user', content: 'What is my project status?' }
]

const response = await openai.responses.create({
  model: 'gpt-5-nano',
  instructions: '...',
  tools,
  input,
  attachments: [{
    vector_store_id: vectorStoreId,
    tools: [{ type: 'file_search' }]
  }]
})
```

---

### **Step 3: Process Function Calls**

The AI may return function calls in `response.output`:

```typescript
response.output.forEach((item) => {
  if (item.type === 'function_call') {
    // Extract function name and arguments
    const functionName = item.name  // e.g., 'getProjectStatus'
    const args = JSON.parse(item.arguments)  // e.g., { projectId: 'proj_123' }
    
    // Execute the function
    const result = executeFunctionCall(functionName, args, context)
    
    // Add result to input for next call
    input.push({
      type: 'function_call_output',
      call_id: item.call_id,
      output: JSON.stringify(result)
    })
  }
})
```

---

### **Step 4: Second API Call with Results**

```typescript
// Make another call with function results
const finalResponse = await openai.responses.create({
  model: 'gpt-5-nano',
  instructions: '...',
  tools,
  input,  // Now includes function_call_output items
  attachments: [{
    vector_store_id: vectorStoreId,
    tools: [{ type: 'file_search' }]
  }]
})

// Extract the final answer
const answer = finalResponse.output_text
```

---

## 📊 Complete Flow Example

### **Question:** "What's the status of my project?"

**Step 1: Build Input**
```javascript
input = [
  { role: 'user', content: "What's the status of my project?" }
]
```

**Step 2: First API Call**
```javascript
response = await openai.responses.create({
  model: 'gpt-5-nano',
  tools: [
    { type: 'file_search', vector_store_ids: ['vs_123'] },
    { type: 'function', name: 'getProjectStatus', ... },
    { type: 'function', name: 'getProjectTimeline', ... },
    // ... all other functions
  ],
  input
})
```

**Step 3: AI Decides to Call Functions**
```javascript
response.output = [
  {
    type: 'function_call',
    name: 'getProjectStatus',
    call_id: 'call_abc123',
    arguments: '{"projectId":"proj_456"}'
  },
  {
    type: 'function_call',
    name: 'getProjectTimeline',
    call_id: 'call_def456',
    arguments: '{"projectId":"proj_456"}'
  }
]
```

**Step 4: Execute Functions**
```javascript
// Execute getProjectStatus
const statusResult = await executeFunctionCall('getProjectStatus', 
  { projectId: 'proj_456' }, 
  { accountId, clientId, projectId }
)
// Returns: { project: { name: "Website", status: "in_progress", completion: 75 }, ... }

// Execute getProjectTimeline
const timelineResult = await executeFunctionCall('getProjectTimeline',
  { projectId: 'proj_456' },
  { accountId, clientId, projectId }
)
// Returns: { milestones: [ { title: "Design", status: "completed" }, ... ] }
```

**Step 5: Add Results to Input**
```javascript
input.push({
  type: 'function_call_output',
  call_id: 'call_abc123',
  output: JSON.stringify(statusResult)
})

input.push({
  type: 'function_call_output',
  call_id: 'call_def456',
  output: JSON.stringify(timelineResult)
})
```

**Step 6: Second API Call**
```javascript
finalResponse = await openai.responses.create({
  model: 'gpt-5-nano',
  tools,
  input  // Now has user message + function outputs
})

// AI generates final response using function results
answer = finalResponse.output_text
// "Your Website project is 75% complete and on track! Here's the status: ..."
```

---

## 🔍 Available Functions (10 Total)

### **Project Functions**
1. **`getProjectStatus`** - Current status, progress %, next milestone
2. **`getProjectTimeline`** - All milestones with dates and status
3. **`getRecentActivity`** - Activity log (last N days)

### **Financial Functions**
4. **`getInvoices`** - Invoice list with payment status
5. **`getOutstandingBalance`** - Total amount owed

### **File Functions**
6. **`getProjectFiles`** - Files with approval status

### **Action Functions**
7. **`getActionItems`** - All pending items (forms, files, invoices, contracts)
8. **`getPendingForms`** - Forms awaiting completion

### **Communication Functions**
9. **`getRecentMessages`** - Message history
10. **`getContractDetails`** - Contract terms and status

---

## 🎨 Function Definition Template

```typescript
{
  type: 'function',
  name: 'yourFunctionName',
  description: 'Clear description of what this function does and when to use it.',
  parameters: {
    type: 'object',
    properties: {
      paramName: {
        type: 'string',  // or 'number', 'boolean', etc.
        description: 'What this parameter represents',
        enum: ['option1', 'option2']  // Optional: for limited options
      }
    },
    required: ['paramName'],  // List required parameters
    additionalProperties: false  // Enforces strict schema
  },
  strict: true  // Enables strict mode
}
```

---

## 🚀 Combined Tools: File Search + Functions

The system uses **both** file search and function calling simultaneously:

```typescript
tools: [
  {
    type: 'file_search',
    vector_store_ids: [vectorStoreId],
    filters: {  // Optional metadata filtering
      type: 'eq',
      key: 'type',
      value: 'invoice'
    }
  },
  ...AI_FUNCTIONS  // All 10 functions
]
```

**Benefits:**
- **File Search**: Finds historical documents, contracts, policies
- **Functions**: Gets real-time data from database
- **AI Decides**: Which tool(s) to use based on the question

**Example:**
```
Question: "Show me my pending invoices"
→ AI calls: getInvoices(status='pending')  [Function]
→ AI searches: Vector store with filter type='invoice'  [File Search]
→ AI combines: Live payment status + invoice document details
```

---

## 📝 Input Format

The `input` array follows OpenAI Responses API format:

```typescript
input = [
  // User messages
  { role: 'user', content: 'What is my project status?' },
  
  // Assistant messages (from conversation history)
  { role: 'assistant', content: 'Your project is...' },
  
  // Function call outputs (added after executing functions)
  {
    type: 'function_call_output',
    call_id: 'call_abc123',
    output: JSON.stringify({ ... })
  }
]
```

---

## ✅ Implementation Checklist

- [x] Function definitions follow OpenAI schema with `type: 'function'`
- [x] All functions have `strict: true` and `additionalProperties: false`
- [x] Function descriptions clearly explain when to use each function
- [x] Parameters use proper JSON schema types
- [x] Required parameters are listed in `required` array
- [x] Multi-turn conversation flow implemented
- [x] Function calls are detected and executed
- [x] Results are added to input as `function_call_output`
- [x] Second API call made with function results
- [x] File search and functions combined in tools array
- [x] Conversation history included in input
- [x] Final answer extracted from response

---

## 🎯 Key Differences from Previous Implementation

### **Before:**
- Functions defined without `type: 'function'`
- No `strict: true` or `additionalProperties: false`
- Single API call (no multi-turn)
- Manual question analysis
- Separate function execution logic

### **Now:**
- Proper OpenAI function schema
- Strict mode enabled for reliability
- Multi-turn conversation flow
- AI automatically decides which functions to call
- Integrated function execution in response loop

---

## 💡 Best Practices

1. **Clear Descriptions**: Make function descriptions specific about when to use them
2. **Strict Schemas**: Always use `strict: true` and `additionalProperties: false`
3. **Error Handling**: Wrap function execution in try-catch
4. **Default Values**: Provide defaults for optional parameters (e.g., `limit: 10`)
5. **Context Injection**: Auto-inject `projectId` if available and relevant
6. **Multiple Calls**: Don't be afraid to let AI call multiple functions
7. **Conversation History**: Include recent messages for context

---

## 🔧 Debugging Tips

**Check if functions are being called:**
```typescript
console.log('Functions called:', functionsCalled)
```

**Inspect function arguments:**
```typescript
console.log('Function args:', JSON.parse(item.arguments))
```

**View function results:**
```typescript
console.log('Function result:', result)
```

**Monitor API calls:**
```typescript
console.log('API call 1 output:', response.output)
console.log('API call 2 output:', finalResponse.output)
```

---

## 🎉 Result

You now have a **fully compliant OpenAI Responses API implementation** with:

✅ Proper function calling schema  
✅ Multi-turn conversation flow  
✅ Combined file search + functions  
✅ Intelligent metadata filtering  
✅ Conversation history tracking  
✅ Error handling and logging  
✅ Automatic context injection  

**The AI can now intelligently call your database functions and search documents to answer any client question!** 🚀

