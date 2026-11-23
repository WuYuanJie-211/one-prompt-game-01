#!/bin/bash
# Assemble star-dodge-01.mp4: prompt typing + code streaming + real gameplay,
# then the make.fun 16:9 referral end card (transparent webm) over the held
# last frame, referral code yscmfwa4 typed into the field.
set -e
cd /home/hatch/workspace/makefun/game-01
CARD=/tmp/game-presskit/make-fun-press-kit/referral-card/16x9/makefun-card-16x9-transparent.webm
FONTB=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
CODE=yscmfwa4

# 1. segments (1280x720, 30fps, no audio yet)
ffmpeg -y -v error -framerate 30 -i /tmp/term-frames/a%04d.png -c:v libx264 -pix_fmt yuv420p -r 30 seg-prompt.mp4
ffmpeg -y -v error -framerate 30 -i /tmp/term-frames/b%04d.png -c:v libx264 -pix_fmt yuv420p -r 30 seg-code.mp4
ffmpeg -y -v error -framerate 30 -i /tmp/game-frames/f%04d.jpg -frames:v 720 -vf "drawbox=x=0:y=668:w=1280:h=52:color=black@0.55:t=fill:enable='lt(t,4)',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='STAR DODGE — built from one prompt, now running':fontsize=30:fontcolor=white:x=(w-text_w)/2:y=678:enable='lt(t,4)'" -c:v libx264 -pix_fmt yuv420p -r 30 seg-game.mp4

# 2. concat -> main (38.5s)
printf "file 'seg-prompt.mp4'\nfile 'seg-code.mp4'\nfile 'seg-game.mp4'\n" > concat.txt
ffmpeg -y -v error -f concat -safe 0 -i concat.txt -c copy main.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 main.mp4

# 3. end card: HOLD the last frame 2.5s, card over the last 2.5s (T=38.5),
# code appears when the field rests (T+1.433), then hold the finished frame 3s.
# Total 44.0s. Scale to 1920x1080 for the 16:9 card.
ffmpeg -y -v error -i main.mp4 -c:v libvpx-vp9 -i "$CARD" -i /tmp/music.wav -filter_complex "
[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30,tpad=stop_mode=clone:stop_duration=2.5,format=yuva420p,split[clip][soft];
[soft]gblur=sigma=28,eq=saturation=0.35,fade=t=in:st=38.5:d=0.8:alpha=1[soft];
[clip][soft]overlay[bg];
[1:v]format=yuva420p,setpts=PTS-STARTPTS+38.5/TB[card];
[bg][card]overlay=eof_action=pass,
drawbox=x=430:y=692:w=9:h=81:color=white:t=fill:enable='gte(t,39.933)',
drawtext=fontfile=$FONTB:text=$CODE:fontsize=62:fontcolor=0x191419:x=432:y=733-(ascent-descent)/2:enable='gte(t,39.933)',
tpad=stop_mode=clone:stop_duration=3[v]" \
-map '[v]' -map 2:a -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 96k -movflags +faststart -t 44 star-dodge-01.mp4

ffprobe -v error -show_entries format=duration,size -of default=nw=1 star-dodge-01.mp4
ls -la star-dodge-01.mp4
