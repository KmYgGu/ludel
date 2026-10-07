import sys
from pathlib import Path
from PIL import Image

root = Path('sprites/bosses')
im = Image.open(sys.argv[1]).convert('RGBA')
cells, bounds = [], []
for i in range(8):
    col, row = i % 4, i // 4
    cell = im.crop((round(col * im.width / 4), round(row * im.height / 2),
                    round((col + 1) * im.width / 4), round((row + 1) * im.height / 2)))
    alpha = cell.getchannel('A')
    rows = [y for y in range(cell.height) if sum(v >= 128 for v in alpha.crop((0,y,cell.width,y+1)).get_flattened_data()) >= 8]
    cols = [x for x in range(cell.width) if sum(v >= 128 for v in alpha.crop((x,0,x+1,cell.height)).get_flattened_data()) >= 8]
    cells.append(cell)
    bounds.append((min(cols),min(rows),max(cols)+1,max(rows)+1))
x0 = max(0,min(b[0] for b in bounds)-4)
x1 = min(min(c.width for c in cells),max(b[2] for b in bounds)+4)
height = max(b[3]-b[1] for b in bounds)+8
sheet = Image.new('RGBA',(768,438))
for i,(cell,b) in enumerate(zip(cells,bounds)):
    f = cell.crop((x0,b[3]+4-height,x1,b[3]+4)).resize((128,155),Image.Resampling.NEAREST)
    sheet.paste(f,(i%4*192+32,i//4*219+32))
# Use only existing idle sprite colors, so all slime animations share <=24 colors.
idle = Image.open(root/'slime_idle_sheet.png').convert('RGBA')
colors = sorted({p[:3] for p in idle.get_flattened_data() if p[3]})
assert len(colors)<=23
lookup = {}
indices=[]
for r,g,b,a in sheet.get_flattened_data():
    if a<128:
        indices.append(23)
        continue
    rgb=(r,g,b)
    if rgb not in lookup:
        lookup[rgb]=min(range(len(colors)),key=lambda i:sum((colors[i][j]-rgb[j])**2 for j in range(3)))
    indices.append(lookup[rgb])
palette=[v for rgb in colors for v in rgb]
palette += [0]*(768-len(palette))
out=Image.new('P',sheet.size)
out.putpalette(palette)
out.putdata(indices)
out.save(root/'slime_reactions_sheet.png',transparency=23)
for row,name in [(0,'wall'),(1,'hit')]:
    frames=[out.crop((c*192,row*219,(c+1)*192,(row+1)*219)) for c in range(4)]
    frames[0].save(root/f'slime_{name}_preview.gif',save_all=True,append_images=frames[1:],
                   duration=[50,70,50,150],loop=0,disposal=2,transparency=23,optimize=False)
final=Image.open(root/'slime_reactions_sheet.png').convert('RGBA')
assert len(set(final.get_flattened_data()) | set(idle.get_flattened_data()))<=24
for i in range(8):
    b=final.crop((i%4*192,i//4*219,(i%4+1)*192,(i//4+1)*219)).getchannel('A').getbbox()
    assert b and b[0]>=32 and b[1]>=32 and b[2]<=160 and b[3]<=187
print('PASS: shared idle palette <=24 colors including transparency, eight reaction frames, 32px margins.')
