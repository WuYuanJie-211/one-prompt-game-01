// one-prompt-game-01 entry: validate POST.json and the bundled video, then
// copy them to /output
//
// This is the whole program. The entry is the X video itself: an agent built
// a tiny browser game ("Star Dodge") from ONE prompt while the user watched,
// filmed the prompt, the build and the game running, and posted the clip on X
// with the make.fun referral end card. The post's address goes in POST.json
// at this repository's root. The house reads the post's views, likes,
// reposts, quotes and replies through FxTwitter's public read; nothing this
// program writes about the post is scored.
//
// Before copying, the program reads POST.json and checks it is a JSON object
// with a string "url" that is an X post address, so a bad or mistyped
// POST.json fails loudly instead of being published silently. It also checks
// the bundled video file (star-dodge-01.mp4) is present in the repository,
// records its byte size and SHA-256, and writes that manifest as CHECK.json
// next to the copied POST.json, so a missing or swapped video fails loudly
// too. After copying, it reads the output back and confirms it is
// byte-identical to the source. On success it prints the post URL, the video
// fingerprint and the output paths.
//
// Node 22, standard library only. No network, no wall clock, no files
// outside this repository. The two runs of an entry must write the same bytes.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const srcPath = join(botDir, 'POST.json');
const dstPath = join(outDir, 'POST.json');
const videoName = 'star-dodge-01.mp4';
const videoPath = join(botDir, videoName);

// 1. Read and validate POST.json before copying anything.
let raw: Buffer;
try {
  raw = readFileSync(srcPath);
} catch (err) {
  console.error(`could not read POST.json from ${srcPath}: ${(err as Error).message}`);
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(raw.toString('utf8'));
} catch (err) {
  console.error(`POST.json at ${srcPath} is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

if (typeof data !== 'object' || data === null || Array.isArray(data)) {
  console.error(`POST.json at ${srcPath} must be a JSON object, got ${Array.isArray(data) ? 'an array' : typeof data}`);
  process.exit(1);
}

const url = (data as Record<string, unknown>).url;
if (typeof url !== 'string') {
  console.error(`POST.json at ${srcPath} must have a string "url" field, got ${typeof url}`);
  process.exit(1);
}

const postPattern = /^https:\/\/(x\.com|twitter\.com)\/WuYuanJie17\/status\/[0-9]+$/;
if (!postPattern.test(url)) {
  console.error(`POST.json "url" must be an X post URL of the form https://x.com/WuYuanJie17/status/<digits>, got ${url}`);
  process.exit(1);
}

// 2. Copy, then verify the copy is byte-identical to the source.
mkdirSync(outDir, { recursive: true });
try {
  copyFileSync(srcPath, dstPath);
} catch (err) {
  console.error(`could not copy POST.json from ${srcPath} to ${dstPath}: ${(err as Error).message}`);
  process.exit(1);
}

let copied: Buffer;
try {
  copied = readFileSync(dstPath);
} catch (err) {
  console.error(`could not read back the copied POST.json at ${dstPath}: ${(err as Error).message}`);
  process.exit(1);
}

if (!copied.equals(raw)) {
  console.error(`copied POST.json at ${dstPath} is not byte-identical to ${srcPath}`);
  process.exit(1);
}

// 3. Verify the bundled video and write its fingerprint as CHECK.json.
let videoStat;
try {
  videoStat = statSync(videoPath);
} catch (err) {
  console.error(`bundled video ${videoName} missing from ${botDir}: ${(err as Error).message}`);
  process.exit(1);
}
if (!videoStat.isFile() || videoStat.size === 0) {
  console.error(`bundled video ${videoName} in ${botDir} is not a non-empty file`);
  process.exit(1);
}
let videoBytes: Buffer;
try {
  videoBytes = readFileSync(videoPath);
} catch (err) {
  console.error(`could not read bundled video ${videoPath}: ${(err as Error).message}`);
  process.exit(1);
}
const videoSha256 = createHash('sha256').update(videoBytes).digest('hex');
const check = {
  post_url: url,
  video_file: videoName,
  video_bytes: videoStat.size,
  video_sha256: videoSha256,
};
const checkPath = join(outDir, 'CHECK.json');
try {
  writeFileSync(checkPath, JSON.stringify(check, null, 2) + '\n', 'utf8');
} catch (err) {
  console.error(`could not write CHECK.json to ${checkPath}: ${(err as Error).message}`);
  process.exit(1);
}

console.log(`post: ${url}`);
console.log(`video: ${videoName} (${videoStat.size} bytes, sha256 ${videoSha256})`);
console.log(`output: ${dstPath}`);
console.log(`check: ${checkPath}`);
