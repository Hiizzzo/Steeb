#!/usr/bin/env python3
"""
STEEB Screenshot Analyzer
Analyzes UI screenshots for debugging and design review
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
    import cv2
    import numpy as np
except ImportError as e:
    print(f"❌ Missing required packages: {e}")
    print("Install with: pip install Pillow opencv-python")
    sys.exit(1)

def analyze_ui_elements(image_path):
    """Analyze UI elements in the screenshot"""
    try:
        # Load image
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Could not load image: {image_path}")

        # Convert to different color spaces for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Find contours (potential UI elements)
        contours, _ = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filter significant contours
        significant_contours = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 1000:  # Filter out small noise
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h
                significant_contours.append({
                    'area': area,
                    'bounds': (x, y, w, h),
                    'aspect_ratio': aspect_ratio
                })

        # Sort by area (largest first)
        significant_contours.sort(key=lambda x: x['area'], reverse=True)

        return significant_contours

    except Exception as e:
        print(f"❌ Error analyzing UI elements: {e}")
        return []

def detect_text_regions(image_path):
    """Detect potential text regions in the image"""
    try:
        img = cv2.imread(str(image_path))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Use morphological operations to find text regions
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 20))
        morph = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)

        # Find potential text areas
        contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        text_regions = []
        for contour in contours:
            area = cv2.contourArea(contour)
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / h

            # Text-like characteristics
            if (area > 500 and
                aspect_ratio > 2 and aspect_ratio < 10 and
                h > 10 and h < 100):
                text_regions.append({
                    'bounds': (x, y, w, h),
                    'area': area,
                    'aspect_ratio': aspect_ratio
                })

        return text_regions

    except Exception as e:
        print(f"❌ Error detecting text regions: {e}")
        return []

def analyze_color_scheme(image_path):
    """Analyze the color scheme of the image"""
    try:
        img = Image.open(image_path)
        img = img.convert('RGB')

        # Get dominant colors using k-means clustering
        import numpy as np
        data = np.array(img)
        data = data.reshape((-1, 3))
        data = np.float32(data)

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
        _, labels, centers = cv2.kmeans(data, 5, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

        centers = np.uint8(centers)

        # Convert to hex colors
        hex_colors = []
        for color in centers:
            hex_color = '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])
            hex_colors.append(hex_color)

        return hex_colors

    except Exception as e:
        print(f"❌ Error analyzing color scheme: {e}")
        return []

def generate_analysis_report(image_path, ui_elements, text_regions, colors):
    """Generate a comprehensive analysis report"""
    report = []
    report.append(f"📸 STEEB Screenshot Analysis Report")
    report.append(f"📁 File: {image_path.name}")
    report.append(f"📏 Size: {image_path.stat().st_size // 1024} KB")
    report.append("")

    # UI Elements Analysis
    report.append("🔘 UI Elements Detected:")
    if ui_elements:
        for i, element in enumerate(ui_elements[:10]):  # Show top 10
            x, y, w, h = element['bounds']
            report.append(f"  • Element {i+1}: {w}x{h} at ({x}, {y}) - Aspect: {element['aspect_ratio']:.2f}")
    else:
        report.append("  • No significant UI elements detected")
    report.append("")

    # Text Regions
    report.append("📝 Potential Text Regions:")
    if text_regions:
        for i, region in enumerate(text_regions[:10]):
            x, y, w, h = region['bounds']
            report.append(f"  • Text {i+1}: {w}x{h} at ({x}, {y})")
    else:
        report.append("  • No text regions detected")
    report.append("")

    # Color Scheme
    report.append("🎨 Dominant Colors:")
    if colors:
        for i, color in enumerate(colors):
            report.append(f"  • Color {i+1}: {color}")
    else:
        report.append("  • Could not analyze color scheme")
    report.append("")

    # STEEB-specific recommendations
    report.append("💡 STEEB-Specific Recommendations:")
    if ui_elements:
        report.append("  • Check for consistent spacing between task items")
        report.append("  • Verify button sizing matches design system")
        report.append("  • Ensure proper contrast ratios for accessibility")

    if text_regions:
        report.append("  • Review text readability and font consistency")
        report.append("  • Check for proper text alignment and hierarchy")

    report.append("")
    report.append("🔍 Debugging Tips:")
    report.append("  • Use browser dev tools to inspect specific elements")
    report.append("  • Check for CSS conflicts or missing styles")
    report.append("  • Verify responsive behavior at different screen sizes")
    report.append("  • Test dark/light mode compatibility")

    return "\n".join(report)

def main():
    parser = argparse.ArgumentParser(description='Analyze STEEB UI screenshots')
    parser.add_argument('image_path', type=Path, help='Path to the screenshot image')
    parser.add_argument('--output', '-o', type=Path, help='Output file for analysis report')

    args = parser.parse_args()

    if not args.image_path.exists():
        print(f"❌ Image file not found: {args.image_path}")
        sys.exit(1)

    # Supported formats
    supported_formats = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'}
    if args.image_path.suffix.lower() not in supported_formats:
        print(f"❌ Unsupported format: {args.image_path.suffix}")
        print(f"Supported formats: {', '.join(supported_formats)}")
        sys.exit(1)

    print(f"🔍 Analyzing screenshot: {args.image_path}")

    # Perform analysis
    ui_elements = analyze_ui_elements(args.image_path)
    text_regions = detect_text_regions(args.image_path)
    colors = analyze_color_scheme(args.image_path)

    # Generate report
    report = generate_analysis_report(args.image_path, ui_elements, text_regions, colors)

    # Output report
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"✅ Analysis report saved to: {args.output}")
    else:
        print("\n" + report)

if __name__ == "__main__":
    main()