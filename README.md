# Kairove for Windows

An initial Electron desktop assistant for meetings and interviews where participants consent and assistance is permitted. Includes microphone transcription in roughly six-second segments, editable transcripts, GPT response suggestions grounded in a pasted résumé and job description, plain-text résumé upload, and explicitly selected screen/window screenshots for coding questions.

## Develop on Windows

Install Node.js 22.12+ (Node 24 recommended), then run:

```powershell
npm ci
npm run build
npm start
```

After editing the UI, rebuild and restart. `npm run dev` also launches the built desktop app; it is not a hot-reload server. Run `npm test` for mocked API/capture integration checks. Build a Windows NSIS installer with `npm run dist:win` on Windows. Unsigned installers may trigger Windows SmartScreen. Signing and distribution are not configured.

## Use

Enter an OpenAI API key and click Connect. The key is kept only in the Electron main process memory for this session and never written to disk. OpenAI billing and model access are required. Paste your résumé and job/meeting context. Start microphone capture after obtaining consent. Stop it to pause. Type a question or use the latest conversation and select Suggest a response. For coding prompts, select Choose capture source, choose a screen/window, Capture, and review the preview before generating. Remove the screenshot when finished: an attached screenshot is included in subsequent requests until removed.

Audio is uploaded to OpenAI while recording; transcripts, context, and screenshots are uploaded when generating an answer. Provider retention policies apply. Kairove does not persist sessions; closing the app clears its in-memory key and context. API requests can take up to 60 seconds. Transcription segments are queued sequentially and may lag on slow connections. Suggestions are manual, not automatically triggered, and should be reviewed for accuracy.

## Current limits

Microphone input only: system/call audio capture is not implemented. Use a microphone that audibly receives the other speaker only with their consent; headphones will generally prevent this. No web research, PDF/DOCX parsing, streaming answer output, Anthropic/Google integration, background overlay, or concealment/proctoring evasion. This is an MVP, not a finished Parakeet replacement.

The cloud host can build the renderer and test mocked request handling. Actual Windows microphone permissions, desktop capture, API calls, installer creation, and full UI behavior must be validated on Windows with an authorized key. Do not consider those tested based on cloud checks alone.

Cloud dependency installation requires a writable npm/Electron cache and the supplied network proxy. The saved environment installation script configures these. Desktop launch on the current Linux cloud host fails Electron's SUID sandbox configuration check; sandboxing has not been disabled. Windows runtime validation is still required.
