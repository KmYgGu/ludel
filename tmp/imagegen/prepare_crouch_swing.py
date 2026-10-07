import json
from pathlib import Path
from PIL import Image
from prepare_crouch2 import anchor

root=Path('sprites/rubania')
original=root/'crouchfrontattack_sheet2-original.png'
if not original.exists():
    original.write_bytes((root/'crouchfrontattack_sheet2.png').read_bytes())
source=Image.open('C:/Users/09/.codex/generated_images/01a0f611-f78b-7523-9651-0f4d2cd679de/exec-b289b3b3-ec4a-4820-bfc8-0e720b8c42a5.png').convert('RGBA')
def isolate(cell):
    # Discard fragments of neighboring sprites intruding into generated grid cells.
    alpha=cell.getchannel('A'); seen=set(); groups=[]
    for y in range(cell.height):
        for x in range(cell.width):
            if (x,y) in seen or alpha.getpixel((x,y))<8: continue
            todo=[(x,y)]; seen.add((x,y)); group=[]
            while todo:
                xx,yy=todo.pop(); group.append((xx,yy))
                for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                    if 0<=nx<cell.width and 0<=ny<cell.height and (nx,ny) not in seen and alpha.getpixel((nx,ny))>=8:
                        seen.add((nx,ny)); todo.append((nx,ny))
            groups.append(group)
    clean=Image.new('RGBA',cell.size)
    for xy in max(groups,key=len): clean.putpixel(xy,cell.getpixel(xy))
    return clean
frames=[]
for i in range(8):
    cell=source.crop((round(i*source.width/8),0,round((i+1)*source.width/8),source.height))
    cell=isolate(cell)
    a=anchor(cell)
    # Match the last source pose's body height and anchor, preserving pixel sampling.
    # Raised whip must not determine character scale.
    body=cell.crop((0,round(source.height*.44),cell.width,cell.height))
    # Fixed scale shared across every generated cell to avoid breathing/shrinking.
    scale=.82
    small=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.NEAREST)
    a=anchor(small)
    canvas=Image.new('RGBA',(256,256))
    canvas.paste(small,(77-a['x'],219-a['y']))
    frames.append(canvas)
sheet=Image.new('RGBA',(2048,256))
for i,f in enumerate(frames): sheet.paste(f,(256*i,0))
sheet.save(root/'crouchfrontattack_sheet2.png')
# Rebuild extension from the corrected final character, without regenerating it.
full=Image.new('RGBA',(550,256))
full.paste(frames[-1].crop((0,0,134,256)),(0,0))
from PIL import ImageDraw
draw=ImageDraw.Draw(full)
# Attach at final pose's actual whip height.
ys=[y for y in range(256) if frames[-1].getpixel((134,y))[3]>8]
y=sum(ys)//len(ys)
draw.line([(134,y),(500,y),(526,y+7)],fill=(13,12,12,255),width=5)
draw.line([(134,y),(500,y),(526,y+7)],fill=(43,40,40,255),width=3)
full.save(root/'attackCrouch_fullwhip2.png')
assert full.crop((0,0,134,256)).tobytes()==frames[-1].crop((0,0,134,256)).tobytes()
path=Path('js/sprite-fit.js')
prefix,raw=path.read_text().split('Game.spriteFit = ',1)
data=json.loads(raw.split(';',1)[0]); data['attackCrouch']=[anchor(f) for f in frames]+[anchor(full)]
segments=[]
for i,frame in enumerate(frames+[full]):
    boxes=[]
    if i>=3:
        for x in range(134,frame.width,8):
            points=[]
            for xx in range(x,min(x+8,frame.width)):
                for yy in range(frame.height):
                    r,g,b,a=frame.getpixel((xx,yy))
                    if a>=128 and max(r,g,b)<110 and max(r,g,b)-min(r,g,b)<22:
                        points.append((xx,yy))
            if points:
                x0=min(p[0] for p in points); x1=max(p[0] for p in points)
                y0=min(p[1] for p in points); y1=max(p[1] for p in points)
                boxes.append(dict(x=x0-2,y=y0-2,w=x1-x0+5,h=y1-y0+5))
    segments.append(boxes)
path.write_text(prefix+'Game.spriteFit = '+json.dumps(data,separators=(',',':'))+';\nGame.crouchWhipSegments = '+json.dumps(segments,separators=(',',':'))+';\n')
preview=[]
for f,a in zip(frames+[full],data['attackCrouch']):
    c=Image.new('RGB',(600,240),'#303640'); c.paste(f,(100-a['x'],220-a['y']),f); preview.append(c)
preview[0].save(root/'previews/crouch2-attack-applied.gif',save_all=True,append_images=preview[1:],duration=[90]*8+[300],loop=0)
print('Swing frames, identical final character, and per-frame whip segments generated:',[len(s) for s in segments])
