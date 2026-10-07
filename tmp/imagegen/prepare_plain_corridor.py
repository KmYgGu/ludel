import sys,json
from pathlib import Path
from PIL import Image

root=Path('sprites/stages')
im=Image.open(sys.argv[1]).convert('RGB').resize((320,180),Image.Resampling.NEAREST)
base=im.quantize(colors=18,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
colors=sorted(set(base.convert('RGB').get_flattened_data()))
colors += [(16,21,29),(52,62,76),(88,102,120),(139,155,171),(177,187,197),(36,46,63)]
palette=[v for c in colors for v in c];palette += list(colors[0])*(256-len(colors))
reference=Image.new('P',(1,1));reference.putpalette(palette)
out=im.quantize(palette=reference,dither=Image.Dither.NONE).resize((1280,720),Image.Resampling.NEAREST)
out.save(root/'outer_wall.png')
stage={'name':'외벽 회랑','sprite':'sprites/stages/outer_wall.png','batSprite':'sprites/stages/bat_sheet.png',
       'palette':['#'+''.join(f'{v:02x}' for v in c) for c in colors],
       'stone':{'shadow':'#10151d','face':'#343e4c','edge':'#586678',
                'platform':'#8b9bab','highlight':'#b1bbc5'}}
Path('js/stages/outer-wall.js').write_text('window.Game = window.Game || {};\nGame.Stages = Game.Stages || {};\n\nGame.Stages.outerWall = '+json.dumps(stage,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
bat=Image.open(sys.argv[2]).convert('RGBA')
cells=[];bounds=[]
for i in range(4):
    cell=bat.crop((round(i*bat.width/4),0,round((i+1)*bat.width/4),bat.height))
    alpha=cell.getchannel('A')
    rows=[y for y in range(cell.height) if sum(v>=128 for v in alpha.crop((0,y,cell.width,y+1)).get_flattened_data())>=5]
    cols=[x for x in range(cell.width) if sum(v>=128 for v in alpha.crop((x,0,x+1,cell.height)).get_flattened_data())>=5]
    cells.append(cell);bounds.append((min(cols),min(rows),max(cols)+1,max(rows)+1))
box=(min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds))
sheet=Image.new('RGBA',(128,20))
for i,cell in enumerate(cells):
    a=cell.crop(box).resize((32,20),Image.Resampling.NEAREST).getchannel('A').point(lambda v:255 if v>=128 else 0)
    frame=Image.new('RGBA',(32,20),(88,102,120,255));frame.putalpha(a)
    sheet.paste(frame,(i*32,0))
sheet.save(root/'bat_sheet.png')
assert len(set(out.convert('RGB').get_flattened_data())|{(88,102,120)}|{tuple(int(c[i:i+2],16) for i in [1,3,5]) for c in stage['stone'].values()})<=24
assert len({cell.tobytes() for cell in [sheet.crop((i*32,0,(i+1)*32,20)) for i in range(4)]})==4
print('PASS: quiet 1280x720 background, four bat poses, shared 24-color palette for background/bats/solid surfaces.')
