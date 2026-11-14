# Horror Factory — chat-story video generator

A first working, no-paid-API starter for making fictional horror chat Shorts.

## What it does

- Browser dashboard to preview and export a chat episode.
- Four original starter story formats.
- Node script to generate an episode JSON file from a selected format and optional premise.
- eSpeak NG character voice tracks (free, but synthetic/robotic).
- Notification sound on incoming messages.
- FFmpeg rendering to a vertical 1080×1920 MP4.
- Thumbnail and basic upload metadata.

## Preview the dashboard

Open `horror-factory/index.html` in a browser. The dashboard runs locally and does not need a server.

## Render a video using GitHub Actions

1. Open the repository on GitHub.
2. Select **Actions**.
3. Select **Render horror chat Short**.
4. Click **Run workflow**.
5. Choose a format: `midnight`, `woods`, `group`, or `apartment`.
6. Optionally enter a premise for the opening message.
7. Keep the target duration at 65 seconds for the first test.
8. Run the workflow and wait for it to finish.
9. Open the completed run and download the **horror-factory-short** artifact.
10. Unzip it and review `horror-short.mp4` and `thumbnail.png`.

## Run locally (Node 22, FFmpeg, eSpeak NG)

From the repository root:

```bash
npm install
STYLE=midnight PREMISE="I heard someone outside" node horror-factory/scripts/generate.mjs
node horror-factory/scripts/render.mjs
```

On Windows, set environment variables using PowerShell before running Node:

```powershell
$env:STYLE="midnight"
$env:PREMISE="I heard someone outside"
node horror-factory/scripts/generate.mjs
node horror-factory/scripts/render.mjs
```

## Current limitations — important

- This first version uses hand-written story blueprints with small variations, not a generative AI model. This keeps the first version free and dependable, but the story library must be expanded before publishing at scale.
- eSpeak NG is fully free but does not sound like a natural human voice. It is a placeholder voice engine; replace it with a properly licensed, natural-sounding TTS provider when one is available within your budget.
- The opening premise currently changes the first message only; it does not rewrite the entire plot.
- The workflow generates a video artifact. It does not upload to YouTube. Review the story, voice quality, rights and metadata, then upload manually.
- GitHub Actions usage and artifact retention are subject to GitHub's current limits.
- All stories are fictional. Do not present invented incidents as verified real events.

## Next development milestones

1. Add more story blueprints and a better branching story engine.
2. Add optional natural TTS provider integration.
3. Add richer chat animations, typing pauses and sound controls.
4. Add a review/approval upload workflow only after credentials and YouTube API access are deliberately configured.
