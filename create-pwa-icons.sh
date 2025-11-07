#!/bin/bash

# Script to create PWA icon placeholders for Tiny Steps Learning
# This creates simple colored PNG files as PWA icons

echo "🎨 Creating PWA icons for Tiny Steps Learning..."

# Create images directory if it doesn't exist
mkdir -p /Users/ravalipriya/Documents/Tinysteps-react-v1/app/public/assets/images

# Define icon sizes
declare -a sizes=("72x72" "96x96" "128x128" "144x144" "152x152" "192x192" "384x384" "512x512")

# Tiny Steps brand color (orange)
BRAND_COLOR="#ff751f"

cd /Users/ravalipriya/Documents/Tinysteps-react-v1/app/public/assets/images

echo "📱 Generating icon files..."

for size in "${sizes[@]}"; do
    # Extract width and height
    width=$(echo $size | cut -d'x' -f1)
    height=$(echo $size | cut -d'x' -f2)
    
    filename="icon-${size}.png"
    
    # Create a simple colored square using ImageMagick (if available)
    if command -v convert &> /dev/null; then
        convert -size ${width}x${height} xc:"${BRAND_COLOR}" \
                -gravity center \
                -pointsize $((width/4)) \
                -fill white \
                -annotate +0+0 "TS" \
                "$filename"
        echo "✅ Created $filename"
    else
        echo "⚠️  ImageMagick not found. Please install it or create $filename manually"
        # Create a simple HTML file that can generate the icon
        cat > "generate_${filename}.html" << EOF
<!DOCTYPE html>
<html>
<head><title>Generate Icon</title></head>
<body>
    <canvas id="canvas" width="${width}" height="${height}"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Fill with brand color
        ctx.fillStyle = '${BRAND_COLOR}';
        ctx.fillRect(0, 0, ${width}, ${height});
        
        // Add "TS" text
        ctx.fillStyle = 'white';
        ctx.font = 'bold ' + (${width}/4) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TS', ${width}/2, ${height}/2);
        
        // Download the image
        const link = document.createElement('a');
        link.download = '${filename}';
        link.href = canvas.toDataURL();
        document.body.appendChild(link);
        link.click();
    </script>
    <p>Click to download ${filename}</p>
</body>
</html>
EOF
        echo "📄 Created generate_${filename}.html - Open in browser to download"
    fi
done

echo ""
echo "🎯 Icon generation complete!"
echo ""
echo "If ImageMagick is not available:"
echo "1. Open each generate_*.html file in a browser"
echo "2. The icon will download automatically"
echo "3. Move the downloaded files to this directory"
echo ""
echo "Alternative: Use an online favicon generator with your logo:"
echo "- https://realfavicongenerator.net/"
echo "- https://favicon.io/"
echo ""
echo "🔧 Next steps:"
echo "1. Replace placeholder icons with actual logo-based icons"
echo "2. Test PWA installation"
echo "3. Verify manifest.json validation"