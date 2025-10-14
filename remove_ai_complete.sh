#!/bin/bash

echo "🧹 Removing all AI Assistant code from portal page..."

FILE="app/[company]/[client]/page.tsx"

# Backup
cp "$FILE" "${FILE}.backup_before_ai_removal"

# Remove imports (Sparkles, MessageCircle, Paperclip, Send)
sed -i '' '/^  Sparkles,$/d' "$FILE"
sed -i '' '/^  MessageCircle,$/d' "$FILE"
sed -i '' '/^  Paperclip,$/d' "$FILE"
sed -i '' '/^  Send,$/d' "$FILE"

# Remove state variables (lines 441-452)
sed -i '' '441,452d' "$FILE"

# Remove useEffect for AI (lines ~524-534, now shifted up by ~12 lines)
sed -i '' '512,522d' "$FILE"

# Remove AI functions and RichAIMessage component (lines ~1121-1358, shifted)
sed -i '' '1109,1346d' "$FILE"

# Remove AI UI section (lines ~2559-2858, shifted significantly)
sed -i '' '2321,2620d' "$FILE"

echo "✅ AI Assistant code removed from portal page!"
echo "📄 Backup saved as: ${FILE}.backup_before_ai_removal"
echo ""
echo "⚠️  Please check the file for any syntax errors:"
echo "   npm run build"

