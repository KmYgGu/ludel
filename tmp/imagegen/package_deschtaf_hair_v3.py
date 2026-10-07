"""Use requested palette, common character height and roomy canvas for all frames."""
import json
import sys
from pathlib import Path
from PIL import Image

colors = list(dict.fromkeys(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))))
rgb = [tuple(bytes.fromhex(color[1:])) for color in colors]
allowed = set(rgb)
palette = Image.new('P', (1, 1))
palette.putpalette([channel for color in rgb for channel in color] + list(rgb[0]) * (256-len(rgb)))
out = Path('sprites/bosses/stage2/previews/deschtaf-revolver-short-hair-v3')
out.mkdir(parents=True, exist_ok=True)
(out/'palette.json').write_text(json.dumps(colors, indent=2), encoding='utf-8')
frames = []
reports = []
for index, source in enumerate(sys.argv[2:], 1):
    image = Image.open(source).convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
    bounds = image.getbbox()
    assert bounds
    image = image.crop(bounds)
    # Match original large character scale rather than fitting into a narrow canvas.
    target_height = 252  # 1512 px after 6x nearest-neighbor pixel enlargement.
    width = round(image.width * target_height / image.height)
    image = image.resize((width, target_height), Image.Resampling.NEAREST)
    indexed = image.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
    sprite = indexed.convert('RGBA')
    sprite.putalpha(image.getchannel('A'))
    # Anchor by boots, not by changing width of the extended gun silhouette.
    boots = sprite.getchannel('A').crop((0, target_height-30, width, target_height)).getbbox()
    assert boots
    anchor_x = (boots[0]+boots[2])//2
    enlarged = sprite.resize((width*6, target_height*6), Image.Resampling.NEAREST)
    canvas = Image.new('RGBA', (2040,1920))
    x = 840-anchor_x*6
    y = 240
    assert x >= 96 and x+enlarged.width <= canvas.width-96, 'Insufficient side padding'
    canvas.alpha_composite(enlarged, (x,y))
    final_bounds = canvas.getbbox()
    assert final_bounds[3]-final_bounds[1] == 1512
    assert final_bounds[3] == 1752
    used = {pixel[:3] for pixel in canvas.getdata() if pixel[3]}
    assert used <= allowed
    canvas.save(out/f'frame-{index:02d}.png')
    preview = Image.new('RGBA', canvas.size, '#f8f4e9')
    preview.alpha_composite(canvas)
    frames.append(preview.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE))
    reports.append(f'Frame {index}: canvas 2040x1920; character height 1512; feet y=1752; bounds {final_bounds}; {len(used)} permitted colors.')
assert len(frames)==4
gif_path = out/'deschtaf-revolver-short-hair.gif'
frames[0].save(gif_path, save_all=True, append_images=frames[1:], duration=[240,180,180,1000], loop=0, disposal=2, optimize=False)
with Image.open(gif_path) as gif:
    assert gif.n_frames == 4
    for index in range(4):
        gif.seek(index)
        assert set(gif.convert('RGB').getdata()) <= allowed
(out/'validation.txt').write_text('\n'.join(reports), encoding='utf-8')
print('\n'.join(reports))
print(out.resolve())
