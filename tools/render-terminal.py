# Render terminal-style frames for the video: (A) the one prompt being typed,
# (B) the real game code streaming by. Pillow, DejaVu Sans Mono.
import sys
sys.path.insert(0, '/home/hatch/workspace/tools-venv/lib/python3.12/site-packages')
from PIL import Image, ImageDraw, ImageFont
import textwrap, os

W, H = 1280, 720
BG = (13, 17, 23)
BAR = (22, 27, 34)
GREEN = (63, 185, 80)
MAGENTA = (255, 46, 136)
FG = (230, 237, 243)
DIM = (139, 148, 158)
GOLD = (255, 211, 77)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
FONTB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'

def base(title):
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 46], fill=BAR)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([22 + i * 30, 15, 36 + i * 30, 29], fill=c)
    f = ImageFont.truetype(FONTB, 20)
    d.text((120, 12), title, font=f, fill=FG)
    return im, d

def save(im, path):
    im.save(path, optimize=True)

out = '/tmp/term-frames'
os.makedirs(out, exist_ok=True)

# ---------- Segment A: prompt typing ----------
prompt = open('/home/hatch/workspace/makefun/game-01/prompt.txt').read().strip()
lines = textwrap.wrap(prompt, width=76)
f_prompt = ImageFont.truetype(FONT, 24)
f_head = ImageFont.truetype(FONTB, 26)
f_small = ImageFont.truetype(FONT, 20)
total_chars = sum(len(l) for l in lines)
FPS_A, HOLD_A = 30, 45
type_frames = 150
chars_per_frame = total_chars / type_frames
for fr in range(type_frames + HOLD_A):
    im, d = base('muse  —  star-dodge')
    d.text((48, 66), 'ONE PROMPT  →  ONE GAME', font=f_head, fill=MAGENTA)
    shown = int(min(total_chars, chars_per_frame * fr))
    # draw revealed chars line by line
    y = 122
    left = shown
    for ln in lines:
        take = min(len(ln), left)
        d.text((48, y), ln[:take], font=f_prompt, fill=FG)
        left -= take
        y += 34
        if left <= 0 and take < len(ln):
            # cursor at end of this line
            cx = 48 + f_prompt.getlength(ln[:take])
            if fr % 30 < 20:
                d.rectangle([cx + 2, y - 34 + 4, cx + 14, y - 4], fill=FG)
            break
        if left <= 0:
            break
    if fr >= type_frames:
        d.text((48, 620), 'agent: on it — building Star Dodge…', font=f_small, fill=GREEN)
    save(im, f'{out}/a{fr:04d}.png')

# ---------- Segment B: real code streaming ----------
code_lines = open('/home/hatch/workspace/makefun/game-01/game/index.html').read().splitlines()
nlines = len(code_lines)
f_code = ImageFont.truetype(FONT, 19)
f_foot = ImageFont.truetype(FONTB, 22)
FPS_B, FR_B = 30, 240
VIEW = 26
max_off = max(0, nlines - VIEW)
for fr in range(FR_B):
    im, d = base('muse  —  star-dodge')
    d.text((48, 58), '$ cat index.html', font=f_code, fill=GOLD)
    off = int(max_off * min(1.0, fr / (FR_B - 60)))
    y = 96
    for i in range(VIEW):
        li = off + i
        if li >= nlines:
            break
        d.text((48, y), f'{li + 1:>3}', font=f_code, fill=DIM)
        d.text((96, y), code_lines[li][:104], font=f_code, fill=FG)
        y += 23
    if fr >= FR_B - 60:
        d.rectangle([48, 640, 1232, 700], fill=(16, 42, 24))
        d.text((64, 652), f'✓ built: index.html — {nlines} lines, 0 dependencies · game runs', font=f_foot, fill=GREEN)
    save(im, f'{out}/b{fr:04d}.png')

print('frames A:', type_frames + HOLD_A, 'B:', FR_B, 'code lines:', nlines)
