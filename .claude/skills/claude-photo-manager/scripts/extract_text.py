#!/usr/bin/env python3
"""
STEEB OCR Text Extractor
Extracts text from images using multiple OCR engines
"""

import argparse
import sys
import re
from pathlib import Path

try:
    from PIL import Image
    import cv2
    import numpy as np
except ImportError as e:
    print(f"❌ Missing required packages: {e}")
    print("Install with: pip install Pillow opencv-python")
    sys.exit(1)

# Try to import OCR engines
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("⚠️  Tesseract not available. Install with: pip install pytesseract")

try:
    import easyocr
    EASYOCR_AVAILABLE = True
    READER = easyocr.Reader(['es', 'en'])
except ImportError:
    EASYOCR_AVAILABLE = False
    print("⚠️  EasyOCR not available. Install with: pip install easyocr")

def preprocess_image(image_path):
    """Preprocess image for better OCR results"""
    try:
        # Load image
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Could not load image: {image_path}")

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Noise reduction
        denoised = cv2.fastNlMeansDenoising(gray)

        # Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # Binarization
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        return binary

    except Exception as e:
        print(f"❌ Error preprocessing image: {e}")
        return None

def extract_with_tesseract(image_path):
    """Extract text using Tesseract OCR"""
    if not TESSERACT_AVAILABLE:
        return None

    try:
        # Preprocess for better results
        processed = preprocess_image(image_path)
        if processed is None:
            # Fallback to original image
            img = Image.open(image_path)
        else:
            img = Image.fromarray(processed)

        # Configure Tesseract for better results
        custom_config = r'--oem 3 --psm 6 -l spa+eng'
        text = pytesseract.image_to_string(img, config=custom_config)

        return text.strip()

    except Exception as e:
        print(f"⚠️  Tesseract OCR failed: {e}")
        return None

def extract_with_easyocr(image_path):
    """Extract text using EasyOCR"""
    if not EASYOCR_AVAILABLE:
        return None

    try:
        # EasyOCR works with file paths directly
        results = READER.readtext(str(image_path))

        # Extract and combine text
        text_parts = []
        for (bbox, text, confidence) in results:
            if confidence > 0.5:  # Filter low confidence results
                text_parts.append(text.strip())

        return ' '.join(text_parts)

    except Exception as e:
        print(f"⚠️  EasyOCR failed: {e}")
        return None

def clean_extracted_text(text):
    """Clean and format extracted text"""
    if not text:
        return ""

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove common OCR artifacts
    text = re.sub(r'[^\w\s\.,!?;:()\[\]{}"\'-@#%&*+=<>\\/`~|]', '', text)

    # Fix common spacing issues
    text = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', text)

    return text.strip()

def extract_code_snippets(text):
    """Extract potential code snippets from text"""
    # Common code patterns
    code_patterns = [
        r'```[\s\S]*?```',
        r'`[^`]+`',
        r'function\s+\w+\s*\([^)]*\)\s*{[^}]*}',
        r'const\s+\w+\s*=\s*[^;]+;',
        r'<[^>]+>',
        r'\{\s*"[^"]+"\s*:\s*[^}]+\}',
    ]

    snippets = []
    for pattern in code_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        snippets.extend(matches)

    return list(set(snippets))

def categorize_extracted_text(text):
    """Categorize the type of content in the text"""
    categories = []

    text_lower = text.lower()

    # Error messages
    error_patterns = ['error', 'exception', 'failed', 'cannot', 'unable', 'undefined']
    if any(pattern in text_lower for pattern in error_patterns):
        categories.append('errors')

    # Code indicators
    code_patterns = ['function', 'const', 'let', 'var', 'class', 'import', 'export', '{', '}', ';', '()']
    if any(pattern in text_lower for pattern in code_patterns):
        categories.append('code')

    # UI elements
    ui_patterns = ['button', 'input', 'div', 'span', 'class', 'style', 'css', 'html', 'react']
    if any(pattern in text_lower for pattern in ui_patterns):
        categories.append('ui_elements')

    # Task/Project management
    task_patterns = ['task', 'project', 'deadline', 'todo', 'complete', 'pending', 'assign']
    if any(pattern in text_lower for pattern in task_patterns):
        categories.append('tasks')

    # STEEB-specific
    steeb_patterns = ['steeb', 'santi', 'billy', 'procrastination', 'productivity']
    if any(pattern in text_lower for pattern in steeb_patterns):
        categories.append('steeb_app')

    return categories or ['general']

def generate_extraction_report(image_path, extracted_text, engine, categories, code_snippets):
    """Generate comprehensive extraction report"""
    report = []
    report.append(f"📝 STEEB OCR Text Extraction Report")
    report.append(f"📁 Image: {image_path.name}")
    report.append(f"🔧 Engine: {engine}")
    report.append(f"📏 Characters extracted: {len(extracted_text)}")
    report.append("")

    # Categorized content
    report.append(f"🏷️  Content Categories: {', '.join(categories)}")
    report.append("")

    # Extracted text
    if extracted_text:
        report.append("📄 Extracted Text:")
        report.append("─" * 50)
        report.append(extracted_text)
        report.append("─" * 50)
        report.append("")
    else:
        report.append("⚠️  No text could be extracted")
        report.append("")

    # Code snippets
    if code_snippets:
        report.append("💻 Code Snippets Found:")
        for i, snippet in enumerate(code_snippets[:5]):
            report.append(f"  {i+1}. {snippet}")
        report.append("")

    # STEEB-specific analysis
    if 'steeb_app' in categories:
        report.append("🎯 STEEB-Specific Insights:")
        report.append("  • This appears to be STEEB app content")
        report.append("  • Check for task management issues")
        report.append("  • Review UI component references")

    if 'errors' in categories:
        report.append("🐛 Error Analysis:")
        report.append("  • Error messages detected in text")
        report.append("  • Look for stack traces or error codes")
        report.append("  • Check for common patterns: TypeError, undefined, null")

    if 'code' in categories:
        report.append("💻 Code Content Detected:")
        report.append("  • Code snippets identified")
        report.append("  • Check for syntax errors")
        report.append("  • Review programming patterns")

    # Recommendations
    report.append("")
    report.append("💡 Recommendations:")
    report.append("  • Verify extracted text accuracy manually")
    report.append("  • Use this text for searchability and documentation")
    report.append("  • Consider improving image quality for better OCR results")
    report.append("  • Try different OCR engines if results are poor")

    return "\n".join(report)

def main():
    parser = argparse.ArgumentParser(description='Extract text from STEEB images using OCR')
    parser.add_argument('image_path', type=Path, help='Path to the image file')
    parser.add_argument('--output', '-o', type=Path, help='Output file for extracted text')
    parser.add_argument('--engine', '-e', choices=['tesseract', 'easyocr', 'both'], default='both', help='OCR engine to use')
    parser.add_argument('--clean', '-c', action='store_true', help='Clean and format extracted text')

    args = parser.parse_args()

    if not args.image_path.exists():
        print(f"❌ Image file not found: {args.image_path}")
        sys.exit(1)

    # Supported formats
    supported_formats = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'}
    if args.image_path.suffix.lower() not in supported_formats:
        print(f"❌ Unsupported format: {args.image_path.suffix}")
        sys.exit(1)

    print(f"🔍 Extracting text from: {args.image_path}")
    print(f"🔧 OCR Engine: {args.engine}")

    extracted_text = None
    engine_used = "None"

    # Try different OCR engines
    if args.engine in ['tesseract', 'both']:
        print("📖 Trying Tesseract OCR...")
        tesseract_text = extract_with_tesseract(args.image_path)
        if tesseract_text:
            extracted_text = tesseract_text
            engine_used = "Tesseract"
            print("✅ Tesseract succeeded")

    if not extracted_text and args.engine in ['easyocr', 'both']:
        print("📖 Trying EasyOCR...")
        easyocr_text = extract_with_easyocr(args.image_path)
        if easyocr_text:
            extracted_text = easyocr_text
            engine_used = "EasyOCR"
            print("✅ EasyOCR succeeded")

    if not extracted_text:
        print("❌ All OCR engines failed")
        print("💡 Suggestions:")
        print("  • Ensure image is clear and high-resolution")
        print("  • Try different image formats (PNG works best)")
        print("  • Increase image size if text is too small")
        print("  • Check image contrast and lighting")
        sys.exit(1)

    # Clean text if requested
    if args.clean:
        extracted_text = clean_extracted_text(extracted_text)

    # Analyze content
    categories = categorize_extracted_text(extracted_text)
    code_snippets = extract_code_snippets(extracted_text)

    # Generate report
    report = generate_extraction_report(args.image_path, extracted_text, engine_used, categories, code_snippets)

    # Output results
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"✅ Extraction report saved to: {args.output}")
    else:
        print("\n" + report)

if __name__ == "__main__":
    main()