from PIL import Image
from pathlib import Path
p=Path('sprites/shop/Schurpf');im=Image.open(p/'idle.png').convert('RGBA');px=im.load();seen=set();todo=[]
for x in range(im.width):todo.extend([(x,0),(x,im.height-1)])
for y in range(im.height):todo.extend([(0,y),(im.width-1,y)])
while todo:
 x,y=todo.pop()
 if (x,y) in seen:continue
 seen.add((x,y));r,g,b,a=px[x,y]
 if max(abs(r-126),abs(g-125),abs(b-125))>3:continue
 px[x,y]=(0,0,0,0)
 for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
  if 0<=nx<im.width and 0<=ny<im.height:todo.append((nx,ny))
im.save(p/'idle-transparent.png')
# Aligned eye overlay preview, using tracked facial displacement.
eyes=Image.open(p/'eyes only.png').convert('RGBA');frames=[]
for i,dy in enumerate([0,5,8,10,10,10,9,6]):
 f=im.crop((i*247,0,(i+1)*247,247));f.alpha_composite(eyes,(2,dy));c=Image.new('RGB',(247,264),'#221e28');c.paste(f,(0,0),f);frames.append(c.resize((494,528),Image.Resampling.NEAREST))
frames[0].save('sprites/shop/previews/schurpf-idle-eyes.gif',save_all=True,append_images=frames[1:],duration=125,loop=0)
