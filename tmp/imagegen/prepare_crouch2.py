import json
from pathlib import Path
from PIL import Image, ImageDraw

def anchor(im):
    a = im.convert('RGBA').getchannel('A')
    cols = [sum(v >= 8 for v in a.crop((x, 0, x+1, im.height)).getdata()) for x in range(im.width)]
    peak = max(cols)
    px = cols.index(peak)
    lo = hi = px
    while lo > 0 and cols[lo-1] >= peak * .45: lo -= 1
    while hi+1 < im.width and cols[hi+1] >= peak * .45: hi += 1
    ys = [y for y in range(im.height) if any(cols[x] >= 12 and a.getpixel((x,y)) >= 8 for x in range(im.width))]
    return dict(x=(lo+hi)//2, y=max(ys)+1, h=max(ys)-min(ys)+1)

root = Path('sprites/rubania')
sheet = Image.open(root/'crouchfrontattack_sheet2.png').convert('RGBA')
frames = [sheet.crop((i*256,0,(i+1)*256,256)) for i in range(8)]
last = frames[-1]
out = Image.new('RGBA', (550,256))
# Copy the actual character and handle without rescaling or redrawing any pixels.
body = last.crop((0,0,134,256))
out.paste(body, (0,0))
# Extend only the whip using the original whip's dark pixel colors.
draw = ImageDraw.Draw(out)
draw.line([(134,177),(500,177),(516,179),(526,183)], fill=(13,12,12,255), width=6)
draw.line([(134,176),(500,176),(516,178),(526,182)], fill=(43,40,40,255), width=3)
draw.line([(135,175),(500,175)], fill=(61,57,57,255), width=1)
assert out.crop((0,0,134,256)).tobytes() == body.tobytes()
out.save(root/'attackCrouch_fullwhip2.png')
path = Path('js/sprite-fit.js')
text = path.read_text(encoding='utf-8')
prefix, raw = text.split('Game.spriteFit = ',1)
data = json.loads(raw.split(';',1)[0])
data['crouch'] = [anchor(Image.open(root/'crouch2.png'))]
data['attackCrouch'] = [anchor(f) for f in frames] + [anchor(out)]
path.write_text(prefix+'Game.spriteFit = '+json.dumps(data,separators=(',',':'))+';\n', encoding='utf-8')
print(data['crouch'], data['attackCrouch'])

# Preview at the actual unscaled game size with the same ground/body anchors.
preview = []
for frame, a in zip(frames+[out],data['attackCrouch']):
    canvas = Image.new('RGB',(600,180),'#303640')
    canvas.paste(frame,(100-a['x'],155-a['y']),frame)
    preview.append(canvas)
preview[0].save(root/'previews/crouch2-attack-applied.gif',save_all=True,
    append_images=preview[1:],duration=[100]*8+[350],loop=0)
