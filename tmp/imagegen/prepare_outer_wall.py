import sys,json
from pathlib import Path
from PIL import Image

im=Image.open(sys.argv[1]).convert('RGB')
source_floor = round(im.height * 0.872)
small=Image.new('RGB',(320,180))
small.paste(im.crop((0,0,im.width,source_floor)).resize((320,165),Image.Resampling.NEAREST),(0,0))
small.paste(im.crop((0,source_floor,im.width,im.height)).resize((320,15),Image.Resampling.NEAREST),(0,165))
# Reserve rare torch and moon colors instead of losing them to the dark masonry.
base=small.quantize(colors=19,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
base_colors=sorted(set(base.convert('RGB').get_flattened_data()))
fixed=base_colors+[(125,54,27),(198,107,40),(229,170,77),(248,220,128),(189,194,208)]
palette=[v for color in fixed for v in color]
palette += list(fixed[0]) * (256-len(fixed))
reference=Image.new('P',(1,1));reference.putpalette(palette)
indexed=small.quantize(palette=reference,dither=Image.Dither.NONE)
final=indexed.resize((1280,720),Image.Resampling.NEAREST)
root=Path('sprites/stages');root.mkdir(parents=True,exist_ok=True)
final.save(root/'outer_wall.png')
colors=sorted(set(final.convert('RGB').get_flattened_data()))
assert len(colors)<=24
def nearest(rgb):
    color=min(colors,key=lambda c:sum((c[i]-rgb[i])**2 for i in range(3)))
    return '#'+''.join(f'{v:02x}' for v in color)
stage={'name':'외벽 회랑','sprite':'sprites/stages/outer_wall.png',
       'palette':['#'+''.join(f'{v:02x}' for v in c) for c in colors],
       'stone':{'shadow':nearest((15,18,25)),'face':nearest((44,45,54)),
                'edge':nearest((78,77,84)),'highlight':nearest((128,124,117))}}
p=Path('js/stages/outer-wall.js')
p.write_text('window.Game = window.Game || {};\nGame.Stages = Game.Stages || {};\n\nGame.Stages.outerWall = '+json.dumps(stage,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
assert len(set(stage['stone'].values())|set(stage['palette']))<=24
print('PASS: 1280x720 pixel background,',len(colors),'colors; foreground stone colors share background palette.')
