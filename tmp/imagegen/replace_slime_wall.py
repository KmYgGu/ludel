import sys, re
from pathlib import Path
from PIL import Image

root=Path('sprites/bosses')
old=Image.open(root/'slime_reactions_sheet.png').convert('RGBA')
im=Image.open(sys.argv[1]).convert('RGBA')
cells=[];bounds=[]
for i in range(4):
    cell=im.crop((round(i*im.width/4),0,round((i+1)*im.width/4),im.height))
    a=cell.getchannel('A')
    rows=[y for y in range(cell.height) if sum(v>=128 for v in a.crop((0,y,cell.width,y+1)).get_flattened_data())>=8]
    cols=[x for x in range(cell.width) if sum(v>=128 for v in a.crop((x,0,x+1,cell.height)).get_flattened_data())>=8]
    cells.append(cell);bounds.append((min(cols),min(rows),max(cols)+1,max(rows)+1))
x0=max(0,min(b[0] for b in bounds)-4)
x1=min(min(c.width for c in cells),max(b[2] for b in bounds)+4)
height=max(b[3]-b[1] for b in bounds)+8
new=old.copy();new.paste(Image.new('RGBA',(768,219)),(0,0))
for i,(cell,b) in enumerate(zip(cells,bounds)):
    frame=cell.crop((x0,b[3]+4-height,x1,b[3]+4)).resize((128,155),Image.Resampling.NEAREST)
    new.paste(frame,(i*192+32,32))
colors=sorted({p[:3] for p in old.get_flattened_data() if p[3]})
lookup={c:i for i,c in enumerate(colors)};indices=[]
for r,g,b,a in new.get_flattened_data():
    if a<128:indices.append(23);continue
    rgb=(r,g,b)
    if rgb not in lookup:lookup[rgb]=min(range(len(colors)),key=lambda i:sum((colors[i][j]-rgb[j])**2 for j in range(3)))
    indices.append(lookup[rgb])
out=Image.new('P',new.size);palette=[v for c in colors for v in c];palette += [0]*(768-len(palette))
out.putpalette(palette);out.putdata(indices);out.save(root/'slime_reactions_sheet.png',transparency=23)
final=Image.open(root/'slime_reactions_sheet.png').convert('RGBA')
assert final.crop((0,219,768,438)).tobytes()==old.crop((0,219,768,438)).tobytes()
assert len(set(final.get_flattened_data())|set(old.get_flattened_data()))<=24
edges=[]
for i in range(4):
    frame=final.crop((i*192,0,(i+1)*192,219));b=frame.getchannel('A').getbbox()
    assert b and b[0]>=32 and b[1]>=32 and b[2]<=160 and b[3]<=187
    edges.append(b[2]-32)
frames=[out.crop((i*192,0,(i+1)*192,219)) for i in range(4)]
frames[0].save(root/'slime_wall_preview.gif',save_all=True,append_images=frames[1:],duration=[50,70,50,150],loop=0,disposal=2,transparency=23,optimize=False)
p=Path('js/bosses/slime.js');s=p.read_text(encoding='utf-8');s=re.sub(r'wallRightEdges: \[[^\]]*\]',f'wallRightEdges: {edges}',s);p.write_text(s,encoding='utf-8')
print('PASS: corrected side-wall squash, hit row unchanged, <=24 colors, 32px margins; wall anchors:',edges)
