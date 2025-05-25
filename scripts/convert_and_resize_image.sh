#!/bin/bash

# Source image
SOURCE="Gemini_Generated_Image_d.o. vscode-lm Explorer-gallery.jpeg"

# Output directory
OUTPUT_DIR="../images"

# Output file
OUTPUT_FILE="$OUTPUT_DIR/gallery.png"

# Copy the image to the output directory
cp "$SOURCE" "$OUTPUT_FILE"

echo "Image copied to $OUTPUT_FILE"
echo "Please manually resize the image to 1376x626 pixels using PowerToys Image Resizer"
