import sys
from pathlib import Path
from PIL import Image

im = Image.open(sys.argv[1]).convert('RGBA')
cells = []
bounds = []
x_bounds = []
for i in range(8):
    col, row = i % 4, i // 4
    cell = im.crop((round(col * im.width / 4), round(row * im.height / 2),
                    round((col + 1) * im.width / 4), round((row + 1) * im.height / 2)))
    alpha = cell.getchannel('A')
    rows = [y for y in range(cell.height)
            if sum(v >= 128 for v in alpha.crop((0, y, cell.width, y + 1)).get_flattened_data()) >= 8]
    if not rows:
        raise ValueError(f'Empty frame {i}')
    cells.append(cell)
    bounds.append((min(rows), max(rows) + 1))
    cols = [x for x in range(cell.width)
            if sum(v >= 128 for v in alpha.crop((x, 0, x + 1, cell.height)).get_flattened_data()) >= 8]
    x_bounds.append((min(cols), max(cols) + 1))
height = max(bottom - top for top, bottom in bounds) + 8
x0 = max(0, min(a for a, b in x_bounds) - 4)
x1 = min(min(c.width for c in cells), max(b for a, b in x_bounds) + 4)
padding = 32
cell_w, cell_h = 192, 219
sheet = Image.new('RGBA', (cell_w * 4, cell_h * 2))
for i, (cell, (_, bottom)) in enumerate(zip(cells, bounds)):
    frame = cell.crop((x0, bottom + 4 - height, x1, bottom + 4)).resize((128, 155), Image.Resampling.NEAREST)
    sheet.paste(frame, ((i % 4) * cell_w + padding, (i // 4) * cell_h + padding))
# Share a single 23-color palette across all frames; the 24th entry is transparency.
alpha = sheet.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
rgb = sheet.convert('RGB')
indexed = rgb.quantize(colors=23, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
palette = indexed.getpalette()
palette += [0] * (768 - len(palette))
pixels = list(indexed.get_flattened_data())
mask = list(alpha.get_flattened_data())
indexed.putdata([p if a else 23 for p, a in zip(pixels, mask)])
indexed.putpalette(palette)
indexed.info['transparency'] = 23
root = Path('sprites/bosses')
indexed.save(root / 'slime_idle_sheet.png', transparency=23)
frames = [indexed.crop(((i % 4) * cell_w, (i // 4) * cell_h, (i % 4 + 1) * cell_w, (i // 4 + 1) * cell_h)) for i in range(8)]
frames[0].save(root / 'slime_idle_preview.gif', save_all=True, append_images=frames[1:],
               duration=130, loop=0, disposal=2, transparency=23, optimize=False)
assert len(indexed.getcolors()) <= 24
assert len(set(f.tobytes() for f in frames)) == 8
print('PASS:', len(indexed.getcolors()), 'palette entries including transparency; 8 distinct frames; shared palette and aligned baseline.')
