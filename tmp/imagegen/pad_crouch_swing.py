from PIL import Image, ImageDraw
from pathlib import Path
import json
exec(Path('tmp/imagegen/prepare_crouch2.py').read_text().split("root = Path")[0])
src=Image.open('C:/Users/09/.codex/generated_images/01a0f611-f78b-7523-9651-0f4d2cd679de/exec-b289b3b3-ec4a-4820-bfc8-0e720b8c42a5.png').convert('RGBA')
pix=src.load(); seen=set(); groups=[]
for y in range(src.height):
 for x in range(src.width):
  if (x,y) in seen or pix[x,y][3]<8: continue
  group=[]; todo=[(x,y)]; seen.add((x,y))
  while todo:
   xx,yy=todo.pop(); group.append((xx,yy))
   for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
    if 0<=nx<src.width and 0<=ny<src.height and (nx,ny) not in seen and pix[nx,ny][3]>=8:
     seen.add((nx,ny));todo.append((nx,ny))
  groups.append(group)
main=sorted(sorted(groups,key=len,reverse=True)[:8],key=lambda g:sum(x for x,y in g)/len(g))
print('Main components:',[len(g) for g in main])
frames=[]
for g in main:
 x0=min(x for x,y in g); y0=min(y for x,y in g); x1=max(x for x,y in g)+1; y1=max(y for x,y in g)+1
 cell=Image.new('RGBA',(x1-x0,y1-y0))
 for x,y in g:cell.putpixel((x-x0,y-y0),pix[x,y])
 cell=cell.resize((round(cell.width*.82),round(cell.height*.82)),Image.Resampling.NEAREST)
 a=anchor(cell); out=Image.new('RGBA',(640,320));out.paste(cell,(170-a['x'],270-a['y']))
 frames.append(out)
root=Path('sprites/rubania'); sheet=Image.new('RGBA',(640*8,320))
for i,f in enumerate(frames):sheet.paste(f,(640*i,0))
sheet.save(root/'crouchfrontattack_sheet2.png')
full=Image.new('RGBA',(640,320));full.paste(frames[-1].crop((0,0,225,320)),(0,0))
ys=[y for y in range(320) if frames[-1].getpixel((225,y))[3]>=8]; y=sum(ys)//len(ys)
d=ImageDraw.Draw(full); d.line([(225,y),(590,y),(615,y+7)],fill=(13,12,12,255),width=5);d.line([(225,y),(590,y),(615,y+7)],fill=(43,40,40,255),width=3)
assert full.crop((0,0,225,320)).tobytes()==frames[-1].crop((0,0,225,320)).tobytes()
full.save(root/'attackCrouch_fullwhip2.png')
p=Path('js/sprite-fit.js'); prefix,raw=p.read_text().split('Game.spriteFit = ',1);data=json.loads(raw.split(';',1)[0]);data['attackCrouch']=[anchor(f) for f in frames]+[anchor(full)];p.write_text(prefix+'Game.spriteFit = '+json.dumps(data,separators=(',',':'))+';\n')
preview=[]
for f,a in zip(frames+[full],data['attackCrouch']):
 bbox=f.getchannel('A').getbbox();assert bbox[0]>8 and bbox[1]>8 and bbox[2]<632 and bbox[3]<312,bbox
 c=Image.new('RGB',(680,300),'#303640');c.paste(f,(190-a['x'],270-a['y']),f);preview.append(c)
preview[0].save(root/'previews/crouch2-attack-applied.gif',save_all=True,append_images=preview[1:],duration=[90]*8+[300],loop=0)
print('PASS: equal 640x320 cells, same scale, transparent margins and identical final character.')
