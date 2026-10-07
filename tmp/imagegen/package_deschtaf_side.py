"""Enforce the requested JSON color list and package four separately drawn frames."""
import json
import sys
from pathlib import Path
from PIL import Image

palette_file = Path(sys.argv[1])
colors = list(dict.fromkeys(json.loads(palette_file.read_text(encoding='utf-8-sig'))))
rgb = [tuple(bytes.fromhex(color.lstrip('#'))) for color in colors]
allowed = set(rgb)
palette_image = Image.new('P', (1, 1))
palette_image.putpalette([channel for color in rgb for channel in color] + list(rgb[0]) * (256 - len(rgb)))
out = Path('sprites/bosses/stage2/previews/deschtaf-revolver-side-v2')
out.mkdir(parents=True, exist_ok=True)
(out / 'palette.json').write_text(json.dumps(colors, indent=2), encoding='utf-8')
frames = []
report = []
for index, source in enumerate(sys.argv[2:], 1):
    with Image.open(source) as original:
        rgba = original.convert('RGBA')
    # Reconstruct the reference's enlarged square pixel grid before palette conversion.
    original_size = rgba.size
    logical_size = (rgba.width // 6, rgba.height // 6)
    rgba = rgba.resize(logical_size, Image.Resampling.NEAREST)
    rgb_art = rgba.convert('RGB')
    # The user explicitly requires only the JSON colors: nearest palette, no dithering.
    indexed = rgb_art.quantize(palette=palette_image, dither=Image.Dither.NONE)
    final = indexed.convert('RGBA')
    final.putalpha(rgba.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
    final = final.resize((logical_size[0] * 6, logical_size[1] * 6), Image.Resampling.NEAREST)
    padded = Image.new('RGBA', original_size)
    padded.alpha_composite(final, ((original_size[0] - final.width) // 2, 0))
    final = padded
    final.save(out / f'frame-{index:02d}.png')
    used = {pixel[:3] for pixel in final.getdata() if pixel[3]}
    assert used <= allowed, f'Frame {index} has forbidden colors'
    assert set(final.getchannel('A').getdata()) <= {0, 255}
    # GIF preview uses one of the same allowed colors as its solid backdrop.
    background = Image.new('RGBA', final.size, '#f8f4e9')
    background.alpha_composite(final)
    preview = background.convert('RGB').quantize(palette=palette_image, dither=Image.Dither.NONE)
    frames.append(preview)
    report.append(f'Frame {index}: {final.width}x{final.height}, {len(used)} permitted colors, binary alpha.')
assert len(frames) == 4
assert len({frame.size for frame in frames}) == 1
gif_path = out / 'deschtaf-revolver-side.gif'
frames[0].save(gif_path, save_all=True, append_images=frames[1:],
               duration=[240, 180, 180, 1000], loop=0, disposal=2, optimize=False)
with Image.open(gif_path) as gif:
    assert gif.n_frames == 4
    for index in range(4):
        gif.seek(index)
        assert set(gif.convert('RGB').getdata()) <= allowed
(out / 'validation.txt').write_text('\n'.join(report) + '\nGIF: 4 frames; all colors match palette.json.\n', encoding='utf-8')
print('\n'.join(report))
print(out.resolve())
