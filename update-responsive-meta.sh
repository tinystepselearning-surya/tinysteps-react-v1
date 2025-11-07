#!/bin/bash

# Script to update all HTML files with responsive viewport meta tags
# Updates files in app/public directory

echo "🚀 Starting responsive viewport meta tag updates..."

# Define the old and new viewport patterns
OLD_VIEWPORT='<meta name="viewport" content="width=device-width, initial-scale=1"'
NEW_VIEWPORT='<!-- Enhanced Responsive \& Touch-Optimized Viewport -->\n    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes, viewport-fit=cover">\n    <meta name="format-detection" content="telephone=no, date=no, email=no, address=no">\n    <meta name="mobile-web-app-capable" content="yes">\n    <meta name="HandheldFriendly" content="true"'

# Alternative old pattern
OLD_VIEWPORT2='<meta name="viewport" content="width=device-width,initial-scale=1"'

# Find all HTML files in public directory
find /Users/ravalipriya/Documents/Tinysteps-react-v1/app/public -name "*.html" -type f | while read file; do
    # Check if file contains old viewport tag
    if grep -q 'name="viewport"' "$file"; then
        # Check if already updated
        if grep -q "Enhanced Responsive" "$file"; then
            echo "✅ Already updated: $file"
        else
            echo "📝 Updating: $file"
            # Create backup
            cp "$file" "${file}.backup"
            
            # Replace old viewport with new (both patterns)
            sed -i '' "s|${OLD_VIEWPORT}|${NEW_VIEWPORT}|g" "$file"
            sed -i '' "s|${OLD_VIEWPORT2}|${NEW_VIEWPORT}|g" "$file"
            
            echo "✔️  Updated: $file"
        fi
    fi
done

echo ""
echo "✨ Viewport meta tag updates complete!"
echo "📌 Backup files created with .backup extension"
echo ""
echo "Next steps:"
echo "1. Test pages on different devices"
echo "2. Remove .backup files after verification: find . -name '*.backup' -delete"
