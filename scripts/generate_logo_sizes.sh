#!/bin/bash

# Source image
SOURCE="logo.png"

# Output directory
OUTPUT_DIR="../images"

# Create sizes
# PowerToys Image Resizer command
# Note: PowerToys Image Resizer uses a different command syntax
# The following commands are placeholders as PowerToys doesn't support CLI resizing
# You'll need to manually resize the images using PowerToys Image Resizer GUI
# or use a different tool that supports CLI resizing

# 128x128
cp "$SOURCE" "$OUTPUT_DIR/icon.png"
# Use PowerToys Image Resizer to resize to 128x128

# 64x64
cp "$SOURCE" "$OUTPUT_DIR/icon-64.png"
# Use PowerToys Image Resizer to resize to 64x64

# 32x32
cp "$SOURCE" "$OUTPUT_DIR/icon-32.png"
# Use PowerToys Image Resizer to resize to 32x32

# 16x16
cp "$SOURCE" "$OUTPUT_DIR/icon-16.png"
# Use PowerToys Image Resizer to resize to 16x16

echo "Logo sizes need to be manually resized using PowerToys Image Resizer in $OUTPUT_DIR"
