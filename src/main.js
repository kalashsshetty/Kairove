import './style.css';
document.querySelector('#app').innerHTML = `
<aside><div class="brand">◈ Kairove</div><span class="tag">WINDOWS · EARLY ACCESS</span><nav><b>◉ Live workspace</b><span>◎ Personal context</span></nav><div class="privacy">Your session, your control.<p>Audio is sent to OpenAI while recording. Context and selected screenshots are sent when you request an answer. Nothing is saved by this app.</p></div></aside>
<main><header><div><span class="eyebrow">YOUR CONVERSATION COPILOT</span><h1>Stay present. Find your words.</h1><p>Live notes and thoughtful suggestions, grounded in your experience.</p></div><span id="badge">● Not recording</span></header>
<section class="setup"><div><h3>Connect your assistant</h3><p>Your API key stays in memory for this session.</p></div><input id="key" type="password" placeholder="OpenAI API key" autocomplete="off"><button id="connect">Connect</button></section>
<div class="grid"><section class="panel"><div class="panelhead"><h2>Conversation</h2><button id="record">● Start microphone</button></div><p class="hint">Use only with participant consent and where assistance is allowed. Transcription arrives in approximately 6-second segments.</p><textarea id="transcript" class="transcript" placeholder="Your live transcript will appear here. You can also paste or edit a conversation…"></textarea><div class="foot"><span id="status" role="status" aria-live="polite">Ready when you are</span><button class="quiet" id="clear">Clear transcript</button></div></section>
<section class="panel answer"><div class="panelhead"><h2>Suggested response</h2><span class="tag">GPT-4.1 MINI</span></div><div id="answer" class="answerbody" aria-live="polite">The next good answer starts with context. Add a conversation or question, then ask your assistant.</div><textarea id="question" rows="2" placeholder="Ask a question, or leave blank to address the latest conversation…"></textarea><button id="generate" class="primary">✦ Suggest a response</button></section></div>
<section class="panel context"><div class="panelhead"><h2>Make it personal</h2><span class="hint">Used only when generating a response</span></div><div class="grid"><label>Résumé / experience <input id="resumeFile" type="file" accept=".txt,.md"><textarea id="resume" rows="5" placeholder="Paste your résumé, strengths, and real examples. Text or Markdown uploads supported."></textarea></label><label>Role / meeting context<textarea id="job" rows="6" placeholder="Paste the job description, meeting agenda, or goals…"></textarea></label></div></section>
<section class="panel capture"><div><h2>Discuss a coding prompt</h2><p class="hint">Explicitly capture a window or screen. Review it before sending.</p></div><button id="choose">Choose capture source</button><select id="sources" aria-label="Capture source" hidden></select><button id="capture" hidden>Capture</button><button id="remove" class="quiet" hidden>Remove screenshot</button><img id="preview" alt="Selected screenshot to include in your next request" hidden></section><footer>No web research yet · No session storage · No hidden capture or proctoring evasion</footer></main>`;
const $ = id => document.getElementById(id);
const api = window.kairove;
let recorder, stream, timer, recording = false, pending = Promise.resolve(), screenshot = null;
const status = message => { $('status').textContent = message; };
const fail = error => status(error.message || String(error));
$('connect').onclick = async () => { try { if (!api) throw new Error('Open the desktop app to connect.'); const ok = await api.setKey($('key').value); $('key').value=''; status(ok?'API key set. Requests will verify access.':'API key cleared.'); } catch(e){fail(e);} };
function segment() {
 const chunks=[];
 recorder = new MediaRecorder(stream, {mimeType:'audio/webm'});
 recorder.ondataavailable = e => {if(e.data.size) chunks.push(e.data);};
 recorder.onstop = () => {
  const blob = new Blob(chunks,{type:'audio/webm'});
  if(blob.size>1000) pending = pending.then(async()=>{
   status('Transcribing audio…');
   const text = await api.transcribe(new Uint8Array(await blob.arrayBuffer()));
   if(text) $('transcript').value += ($('transcript').value?'\n':'')+text;
   status(recording?'Listening…':'Microphone stopped.');
  }).catch(fail);
  if(recording) segment();
 };
 recorder.start();
 timer=setTimeout(()=>{if(recorder.state==='recording') recorder.stop();},6000);
}
function stop() {
 recording=false; clearTimeout(timer);
 if(recorder?.state==='recording') recorder.stop();
 stream?.getTracks().forEach(t=>t.stop());
 $('record').textContent='● Start microphone'; $('badge').textContent='● Not recording'; $('badge').classList.remove('live');
}
$('record').onclick = async()=>{
 if(recording){stop();return;}
 try {
  if(!api) throw new Error('Microphone transcription requires the desktop app.');
  stream=await navigator.mediaDevices.getUserMedia({audio:true});recording=true;segment();
  stream.getAudioTracks()[0].onended=stop;
  $('record').textContent='■ Stop microphone';$('badge').textContent='● Recording microphone';$('badge').classList.add('live');status('Listening…');
 }catch(e){stop();fail(e);}
};
$('generate').onclick=async()=>{
 try {
  if(!api) throw new Error('Open the desktop app to generate responses.');
  if(!$('transcript').value.trim()&&!$('question').value.trim()&&!screenshot) throw new Error('Add a question, conversation, or screenshot first.');
  $('generate').disabled=true;$('answer').textContent='Thinking through your context…';
  $('answer').textContent=await api.answer({transcript:$('transcript').value,resume:$('resume').value,job:$('job').value,question:$('question').value,screenshot});status('Response ready.');
 }catch(e){$('answer').textContent='Could not generate a response. See the session status.';fail(e);}finally{$('generate').disabled=false;}
};
$('clear').onclick=()=>{if(recording){status('Stop recording before clearing the transcript.');return;} pending.then(()=>{$('transcript').value='';status('Transcript cleared.');});};
$('resumeFile').onchange=async e=>{try{const f=e.target.files[0];if(f){if(f.size>100000)throw new Error('Use a text résumé under 100 KB.');$('resume').value=await f.text();}}catch(e){fail(e);}};
$('choose').onclick=async()=>{try{const sources=await api.sources();$('sources').replaceChildren(...sources.map(s=>new Option(s.name,s.id)));$('sources').hidden=false;$('capture').hidden=false;}catch(e){fail(e);}};
$('capture').onclick=async()=>{try{screenshot=await api.screenshot($('sources').value);$('preview').src=screenshot;$('preview').hidden=false;$('remove').hidden=false;status('Screenshot attached. It will be sent with your next response request.');}catch(e){fail(e);}};
$('remove').onclick=()=>{screenshot=null;$('preview').removeAttribute('src');$('preview').hidden=true;$('remove').hidden=true;status('Screenshot removed.');};
window.addEventListener('beforeunload',stop);
