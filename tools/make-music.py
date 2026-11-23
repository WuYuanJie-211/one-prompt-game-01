# Tiny chiptune bed for the video: square-wave lead arpeggio + sine bass, 112 BPM.
import math, wave, struct

SR = 22050
BPM = 112
STEP = 60.0 / BPM / 4  # 16th note
DUR = 44.0

# frequencies
C5, D5, E5, G5, A5, C6 = 523.25, 587.33, 659.25, 783.99, 880.0, 1046.50
C3, F2, G2, A2 = 130.81, 87.31, 98.0, 110.0
R = 0.0
LEAD = [C5, R, E5, R, G5, R, E5, R, A5, R, G5, E5, D5, R, E5, R,
        C5, R, E5, R, G5, R, A5, R, G5, E5, D5, R, C5, R, R, R]
BASS = [C3, C3, F2, G2, C3, C3, F2, G2]  # one per beat (4 steps)

n = int(SR * DUR)
out = [0.0] * n
steps = int(DUR / STEP)
for s in range(steps):
    t0 = int(s * STEP * SR)
    ln = LEAD[s % len(LEAD)]
    if ln:
        L = int(STEP * SR * 0.92)
        for i in range(L):
            t = i / SR
            env = math.exp(-t * 9.0)
            # soft square: sign(sin) smoothed by adding 3rd harmonic
            v = math.sin(2 * math.pi * ln * t) + 0.3 * math.sin(2 * math.pi * ln * 3 * t)
            v = max(-1.0, min(1.0, v))
            if t0 + i < n:
                out[t0 + i] += 0.11 * env * v
    if s % 4 == 0:
        bn = BASS[(s // 4) % len(BASS)]
        L = int(STEP * 4 * SR * 0.95)
        for i in range(L):
            t = i / SR
            env = math.exp(-t * 3.0)
            if t0 + i < n:
                out[t0 + i] += 0.13 * env * math.sin(2 * math.pi * bn * t)

# master fade out over last 2 s + normalize
peak = max(abs(v) for v in out) or 1.0
fade = int(2.0 * SR)
for i in range(n):
    g = 0.55 / peak
    if i > n - fade:
        g *= (n - i) / fade
    out[i] *= g

with wave.open('/tmp/music.wav', 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(max(-1.0, min(1.0, v)) * 32767)) for v in out))
print('music.wav written', DUR, 's')
