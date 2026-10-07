from PIL import Image
import numpy as np
from pathlib import Path
p=Path('sprites/shop/Schurpf'); ref=np.array(Image.open(p/'reference.png').convert('RGBA')); idle=Image.open(p/'idle.png').convert('RGBA')
# Mouth/nose skin region below eyes, used to track facial displacement.
template=ref[78:98,108:143,:3].astype(float)
for i in range(8):
 a=np.array(idle.crop((247*i,0,247*(i+1),247)))
 scores=[]
 for dy in range(-12,17):
  for dx in range(-12,17):
   patch=a[78+dy:98+dy,108+dx:143+dx,:3].astype(float)
   scores.append((float(np.mean((patch-template)**2)),dx,dy))
 print(i,min(scores))

