# one-prompt-game-01

[![post-x-the-agent-builds-a-game-from-20261122-1709](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/WuYuanJie-211/one-prompt-game-01/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/WuYuanJie-211/one-prompt-game-01/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)

One prompt, one game, one video — an entry for the make.fun [The agent builds a game from one prompt](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709) bounty ($20, 10 places paid).

## The game: Star Dodge

A neon arcade dodger in a single self-contained `game/index.html` (285 lines, 0 dependencies, canvas + WebAudio). Fly the little rocket with the arrow keys or the mouse, catch golden stars (+10 points), dodge the falling meteors — 3 lives, speed ramps up, particle explosions, HUD with score / lives / level, start and game-over screens, restart on R or click. Open `game/index.html` in any browser to play; add `?autoplay=1` to watch it play itself.

## The one prompt

See `prompt.txt` — the exact prompt the game was built from, shown verbatim at the start of the video.

## The video

`star-dodge-01.mp4` — 44 s, 1920×1080, H.264 + AAC. It shows the prompt being typed, the real code streaming by, and the finished game running live (score 0 → 100 in the captured run), and ends on make.fun's referral end card from the press pack with referral code `yscmfwa4` typed into the field. The clip is posted on X from [@WuYuanJie17](https://x.com/WuYuanJie17) — see `POST.json` for the post address (filled in after posting; until then it holds a placeholder that `main.ts` refuses).

## The entry

- `main.ts` (Node 22, standard library only): validates `POST.json` (must be an `x.com/WuYuanJie17/status/<digits>` URL), verifies the bundled video is present, writes its SHA-256 fingerprint to `CHECK.json`, and copies both to `/output`. Run it the way the grader does: `mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `POST.json`: the X post address (the entry's link file).
- Play code for this bounty: `makefun-sled-sundial-calendar` (in the post text).
- Reward escrow: $20 USDC on Solana, escrow `GXC2ngBRHLPszcsCYBFKSTxJSKXFjRhDKmfPk51shHBh`.
- `tools/`: the scripts that made the video — `capture.js` (CDP screencast of real gameplay), `render-terminal.py` (prompt/code frames), `make-music.py` (chiptune bed), `assemble.sh` (ffmpeg assembly + end card).
