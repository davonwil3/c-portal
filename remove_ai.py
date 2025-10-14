#!/usr/bin/env python3
"""
Script to remove all AI Assistant code from the portal slug page
"""

def remove_ai_code():
    filepath = "app/[company]/[client]/page.tsx"
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Remove import: Sparkles, MessageCircle
    content = content.replace("  Sparkles,\n", "")
    content = content.replace("  MessageCircle,\n", "")
    content = content.replace("  Paperclip,\n", "")
    content = content.replace("  Send,\n", "")
    
    # Find and remove state variables
    lines = content.split('\n')
    new_lines = []
    skip_until = None
    in_ai_state = False
    in_ai_useeffect = False
    in_ai_functions = False
    in_rich_message = False
    in_ai_ui = False
    brace_count = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip AI state variables (lines 441-452)
        if "const [isAiAssistantOpen, setIsAiAssistantOpen]" in line:
            in_ai_state = True
            i += 1
            continue
        if in_ai_state and "const [isAiTyping, setIsAiTyping]" in line:
            in_ai_state = False
            i += 2  # Skip this line and next blank line
            continue
        if in_ai_state:
            i += 1
            continue
            
        # Skip AI useEffect (lines 524-534)
        if "// Reset AI chat when project changes" in line:
            in_ai_useeffect = True
            i += 1
            continue
        if in_ai_useeffect and "}, [selectedProject?.id])" in line:
            in_ai_useeffect = False
            i += 2  # Skip this line and next blank line
            continue
        if in_ai_useeffect:
            i += 1
            continue
            
        # Skip AI handler functions (lines 1133-1203)
        if "const handleSendAiMessage = async" in line:
            in_ai_functions = True
            brace_count = 0
            i += 1
            continue
        if in_ai_functions:
            if '{' in line:
                brace_count += line.count('{')
            if '}' in line:
                brace_count -= line.count('}')
            if brace_count == 0 and i > 1133:
                in_ai_functions = False
                # Check if next lines are handleQuickSuggestion, quickSuggestions, or RichAIMessage
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    if "const handleQuickSuggestion" in next_line or "const quickSuggestions" in next_line or "const RichAIMessage" in next_line or "// Component to render rich" in next_line:
                        i += 1
                        continue
            i += 1
            continue
            
        # Skip AI UI section (lines 2571-2870)
        if "AI Assistant Floating Button" in line or ("ai-assistant" in line and "portalModules" in line and "!isAiAssistantOpen" in line):
            in_ai_ui = True
            brace_count = 0
            i += 1
            continue
        if in_ai_ui:
            if '{' in line:
                brace_count += line.count('{')
            if '}' in line:
                brace_count -= line.count('}')
            # Look for "Invoice Preview Modal" to know when to stop
            if "Invoice Preview Modal" in line and brace_count <= 0:
                in_ai_ui = False
                new_lines.append(line)  # Keep the Invoice Preview Modal comment
                i += 1
                continue
            i += 1
            continue
        
        new_lines.append(line)
        i += 1
    
    # Write back
    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines))
    
    print("✅ AI Assistant code removed successfully!")
    print(f"   Original: {len(lines)} lines")
    print(f"   New: {len(new_lines)} lines")
    print(f"   Removed: {len(lines) - len(new_lines)} lines")

if __name__ == "__main__":
    remove_ai_code()

