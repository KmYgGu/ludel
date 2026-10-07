"""Package separately generated frames and make a GIF preview without altering PNG art."""
import sys
import shutil
from pathlib import Path
from PIL import Image

out = Path('sprites/bosses/stage2/previews/deschtaf-revolver-aim-v1')
out.mkdir(parents=True, exist_ok=True)
frames = []
for index, source in enumerate(sys.argv[1:], 1):
    target = out / f'frame-{index:02d}.png'
    shutil.copy2(source, target)
    with Image.open(target) as image:
        rgba = image.convert('RGBA')
        background = Image.new('RGBA', rgba.size, '#221e28')
        background.alpha_composite(rgba)
        frames.append(background.convert('RGB'))
assert len(frames) == 4
assert len({frame.size for frame in frames}) == 1, 'Frame canvases must match'
frames[0].save(out / 'deschtaf-revolver-aim.gif', save_all=True,
               append_images=frames[1:], duration=[240, 180, 180, 1000],
               loop=0, disposal=2, optimize=False)
with Image.open(out / 'deschtaf-revolver-aim.gif') as gif:
    assert gif.n_frames == 4
    print(f'Created four individual PNGs and {gif.n_frames}-frame GIF: {out.resolve()}')
