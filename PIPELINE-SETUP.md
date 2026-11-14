# REALITY LAB automation

## Pipeline
1. Research starter pack: Wikipedia overview + OpenAlex scholarly-work metadata.
2. Claude creates an original script, storyboard, source list and claims-to-verify.
3. ElevenLabs creates narration audio.
4. GitHub Actions renders a 720p MP4 and thumbnail.
5. Title, description and tags are prepared.
6. Optional YouTube upload runs only after the GitHub environment approval gate and always uploads as PRIVATE.

The renderer is an initial storyboard-card video renderer, not yet the existing full Three.js character renderer. Human-check the science and inspect the video before upload.

## Add GitHub Actions secrets
Repository Settings -> Secrets and variables -> Actions -> New repository secret:
- ANTHROPIC_API_KEY
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID

For YouTube also add:
- YT_CLIENT_ID
- YT_CLIENT_SECRET
- YT_REFRESH_TOKEN

Never place keys in the webpage, code, commits, or chat. API billing is separate from consumer subscriptions.

Optional Actions variables: CLAUDE_MODEL and ELEVENLABS_MODEL_ID.

## Approval
Create a GitHub environment named youtube-approval in Settings -> Environments. Add required reviewers if available. The workflow upload job references that environment and only runs when upload_private is selected. It uploads PRIVATE only; change visibility manually in YouTube Studio after your own review.

YouTube setup needs a Google Cloud project, YouTube Data API v3 enabled, OAuth consent configuration and a refresh token with YouTube upload scope.

## Run
Repository -> Actions -> Create REALITY LAB episode -> Run workflow. Enter a topic. For the first run leave upload_private off. Download the reality-lab-episode artifact from the completed run and review all output.

GitHub Actions artifacts are temporary (14 days). Download the episode within that period. API costs may apply; set provider spending limits first.
