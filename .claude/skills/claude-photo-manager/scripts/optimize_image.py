#!/usr/bin/env python3
"""
STEEB Image Optimizer
Optimizes images for web use, documentation, and Claude Code
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageEnhance, ImageFilter
    import os
except ImportError as e:
    print(f"❌ Missing required packages: {e}")
    print("Install with: pip install Pillow")
    sys.exit(1)

def get_image_info(image_path):
    """Get basic image information"""
    try:
        with Image.open(image_path) as img:
            return {
                'format': img.format,
                'mode': img.mode,
                'size': img.size,
                'file_size': image_path.stat().st_size
            }
    except Exception as e:
        print(f"❌ Error getting image info: {e}")
        return None

def resize_image(image, max_width=None, max_height=None, maintain_aspect=True):
    """Resize image while maintaining aspect ratio"""
    if not max_width and not max_height:
        return image

    width, height = image.size

    if maintain_aspect:
        if max_width and width > max_width:
            ratio = max_width / width
            height = int(height * ratio)
            width = max_width

        if max_height and height > max_height:
            ratio = max_height / height
            width = int(width * ratio)
            height = max_height

    return image.resize((width, height), Image.Resampling.LANCZOS)

def optimize_for_web(input_path, output_path, quality=85, max_width=1920, max_height=1080):
    """Optimize image for web use"""
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if necessary (for JPEG)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')

            # Resize if too large
            img = resize_image(img, max_width, max_height)

            # Apply slight sharpening after resize
            img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))

            # Save with optimization
            save_kwargs = {
                'format': 'JPEG',
                'quality': quality,
                'optimize': True,
                'progressive': True
            }

            # Handle transparency for PNG
            if input_path.suffix.lower() == '.png':
                save_kwargs['format'] = 'PNG'
                save_kwargs['optimize'] = True
                del save_kwargs['progressive']

            img.save(output_path, **save_kwargs)

        return True

    except Exception as e:
        print(f"❌ Error optimizing image: {e}")
        return False

def optimize_for_claude(input_path, output_path, max_size_mb=5):
    """Optimize image specifically for Claude Code"""
    try:
        # Check original size
        original_size = input_path.stat().st_size / (1024 * 1024)  # MB

        if original_size <= max_size_mb:
            # Already under size limit, just optimize quality
            return optimize_for_web(input_path, output_path, quality=95)
        else:
            # Need to reduce size significantly
            quality = max(60, 85 - int((original_size - max_size_mb) * 10))
            max_width = min(1920, int(1920 * (max_size_mb / original_size)))
            max_height = min(1080, int(1080 * (max_size_mb / original_size)))

            return optimize_for_web(input_path, output_path, quality=quality, max_width=max_width, max_height=max_height)

    except Exception as e:
        print(f"❌ Error optimizing for Claude: {e}")
        return False

def create_thumbnail(input_path, output_path, size=(150, 150)):
    """Create a thumbnail version"""
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Create thumbnail
            img.thumbnail(size, Image.Resampling.LANCZOS)

            # Create square thumbnail if needed
            if img.size[0] != img.size[1]:
                # Create new square image
                new_img = Image.new('RGB', size, (255, 255, 255))
                # Paste centered
                offset = ((size[0] - img.size[0]) // 2, (size[1] - img.size[1]) // 2)
                new_img.paste(img, offset)
                img = new_img

            img.save(output_path, 'JPEG', quality=85, optimize=True)
            return True

    except Exception as e:
        print(f"❌ Error creating thumbnail: {e}")
        return False

def enhance_image(input_path, output_path, brightness=1.0, contrast=1.0, sharpness=1.0):
    """Enhance image quality"""
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Apply enhancements
            if brightness != 1.0:
                enhancer = ImageEnhance.Brightness(img)
                img = enhancer.enhance(brightness)

            if contrast != 1.0:
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(contrast)

            if sharpness != 1.0:
                enhancer = ImageEnhance.Sharpness(img)
                img = enhancer.enhance(sharpness)

            img.save(output_path, 'JPEG', quality=95, optimize=True)
            return True

    except Exception as e:
        print(f"❌ Error enhancing image: {e}")
        return False

def batch_optimize(input_dir, output_dir, **kwargs):
    """Optimize all images in a directory"""
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    if not input_path.exists():
        print(f"❌ Input directory not found: {input_path}")
        return False

    output_path.mkdir(parents=True, exist_ok=True)

    # Supported formats
    supported_formats = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'}

    images = list(input_path.rglob('*'))
    images = [img for img in images if img.suffix.lower() in supported_formats]

    if not images:
        print(f"❌ No supported images found in: {input_path}")
        return False

    print(f"📁 Found {len(images)} images to optimize")

    success_count = 0
    total_saved = 0

    for img_path in images:
        # Calculate relative path
        rel_path = img_path.relative_to(input_path)
        output_img_path = output_path / rel_path

        # Create output directory if needed
        output_img_path.parent.mkdir(parents=True, exist_ok=True)

        # Get original size
        original_size = img_path.stat().st_size

        # Optimize
        if optimize_for_web(img_path, output_img_path, **kwargs):
            new_size = output_img_path.stat().st_size
            saved = original_size - new_size
            total_saved += saved
            success_count += 1

            saved_kb = saved / 1024
            print(f"✅ {rel_path}: {saved_kb:.1f} KB saved")

    print(f"\n🎉 Optimization complete!")
    print(f"✅ Successfully optimized: {success_count}/{len(images)} images")
    print(f"💾 Total space saved: {total_saved / 1024 / 1024:.2f} MB")

    return True

def generate_optimization_report(input_path, output_path, original_info, optimized_info):
    """Generate optimization report"""
    original_size = original_info['file_size']
    optimized_size = optimized_info['file_size']
    size_reduction = original_size - optimized_size
    size_reduction_percent = (size_reduction / original_size) * 100

    report = []
    report.append("📸 STEEB Image Optimization Report")
    report.append("─" * 40)
    report.append(f"📁 Input file: {input_path.name}")
    report.append(f"📤 Output file: {output_path.name}")
    report.append("")
    report.append("📊 Original Image:")
    report.append(f"  • Format: {original_info.get('format', 'Unknown')}")
    report.append(f"  • Size: {original_info.get('size', 'Unknown')}")
    report.append(f"  • File size: {original_size / 1024:.1f} KB")
    report.append("")
    report.append("✨ Optimized Image:")
    report.append(f"  • Size: {optimized_info.get('size', 'Unknown')}")
    report.append(f"  • File size: {optimized_size / 1024:.1f} KB")
    report.append("")
    report.append("💾 Optimization Results:")
    report.append(f"  • Space saved: {size_reduction / 1024:.1f} KB")
    report.append(f"  • Size reduction: {size_reduction_percent:.1f}%")
    report.append("")
    report.append("🎯 Usage Recommendations:")
    if size_reduction_percent > 50:
        report.append("  • Excellent optimization! Great for web use")
    elif size_reduction_percent > 25:
        report.append("  • Good optimization. Suitable for most purposes")
    else:
        report.append("  • Minimal optimization. Image was already well-optimized")

    report.append("  • Perfect for Claude Code uploads")
    report.append("  • Ready for web documentation")
    report.append("  • Optimized for fast loading")

    return "\n".join(report)

def main():
    parser = argparse.ArgumentParser(description='Optimize STEEB images for web and Claude Code')
    parser.add_argument('input_path', type=Path, help='Input image or directory')
    parser.add_argument('output_path', nargs='?', type=Path, help='Output image or directory')
    parser.add_argument('--quality', '-q', type=int, default=85, help='JPEG quality (1-100)')
    parser.add_argument('--max-width', type=int, default=1920, help='Maximum width in pixels')
    parser.add_argument('--max-height', type=int, default=1080, help='Maximum height in pixels')
    parser.add_argument('--claude', '-c', action='store_true', help='Optimize specifically for Claude Code (max 5MB)')
    parser.add_argument('--thumbnail', '-t', action='store_true', help='Create thumbnail (150x150)')
    parser.add_argument('--batch', '-b', action='store_true', help='Process directory of images')
    parser.add_argument('--enhance', action='store_true', help='Enhance image quality')
    parser.add_argument('--brightness', type=float, default=1.0, help='Brightness adjustment (0.5-2.0)')
    parser.add_argument('--contrast', type=float, default=1.0, help='Contrast adjustment (0.5-2.0)')
    parser.add_argument('--sharpness', type=float, default=1.0, help='Sharpness adjustment (0.5-3.0)')

    args = parser.parse_args()

    if not args.input_path.exists():
        print(f"❌ Input path not found: {args.input_path}")
        sys.exit(1)

    # Batch processing
    if args.batch or args.input_path.is_dir():
        output_dir = args.output_path or args.input_path.parent / "optimized"
        return batch_optimize(
            args.input_path,
            output_dir,
            quality=args.quality,
            max_width=args.max_width,
            max_height=args.max_height
        )

    # Single file processing
    if not args.output_path:
        # Generate output filename
        suffix = "_optimized"
        if args.thumbnail:
            suffix = "_thumbnail"
        elif args.claude:
            suffix = "_claude"
        elif args.enhance:
            suffix = "_enhanced"

        args.output_path = args.input_path.parent / f"{args.input_path.stem}{suffix}{args.input_path.suffix}"

    print(f"🔧 Processing: {args.input_path}")
    print(f"📤 Output: {args.output_path}")

    # Get original info
    original_info = get_image_info(args.input_path)
    if not original_info:
        sys.exit(1)

    success = False

    # Apply appropriate processing
    if args.thumbnail:
        success = create_thumbnail(args.input_path, args.output_path)
    elif args.claude:
        success = optimize_for_claude(args.input_path, args.output_path)
    elif args.enhance:
        success = enhance_image(
            args.input_path,
            args.output_path,
            brightness=args.brightness,
            contrast=args.contrast,
            sharpness=args.sharpness
        )
    else:
        success = optimize_for_web(
            args.input_path,
            args.output_path,
            quality=args.quality,
            max_width=args.max_width,
            max_height=args.max_height
        )

    if success:
        # Get optimized info
        optimized_info = get_image_info(args.output_path)

        # Generate report
        report = generate_optimization_report(args.input_path, args.output_path, original_info, optimized_info)
        print("\n" + report)
    else:
        print(f"❌ Failed to optimize image")
        sys.exit(1)

if __name__ == "__main__":
    main()