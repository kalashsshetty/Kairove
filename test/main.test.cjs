const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup() {
 const handlers={},requests=[];
 const electron={app:{whenReady:()=>({then:()=>{}}),on:()=>{}},ipcMain:{handle:(name,fn)=>handlers[name]=fn},desktopCapturer:{getSources:async()=>[{id:'screen:1',name:'Screen 1',thumbnail:{isEmpty:()=>false,toDataURL:()=> 'data:image/png;base64,aGVsbG8='}}]}};
 vm.runInNewContext(fs.readFileSync('electron/main.cjs','utf8'),{require:n=>n==='electron'?electron:require(n),__dirname:process.cwd()+'/electron',Blob,FormData,Uint8Array,AbortSignal,fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>url.endsWith('transcriptions')?{text:'Tell me about your experience.'}:{choices:[{message:{content:'Suggested talking points'}}]}}}});
 return {handlers,requests};
}
test('API key required before transcription',async()=>{const {handlers}=setup();await assert.rejects(handlers.transcribe(null,new Uint8Array([1])),/API key/);});
test('audio transcription uses multipart API and session key',async()=>{const {handlers,requests}=setup();handlers.key(null,'test-key');assert.equal(await handlers.transcribe(null,new Uint8Array([1,2,3])),'Tell me about your experience.');assert.equal(requests[0].options.headers.Authorization,'Bearer test-key');assert.equal(requests[0].options.body.get('model'),'gpt-4o-mini-transcribe');});
test('answer includes context and screenshot, preserves untrusted data boundary',async()=>{const {handlers,requests}=setup();handlers.key(null,'test-key');const screenshot=await handlers.screenshot(null,'screen:1');assert.equal(await handlers.answer(null,{resume:'Engineer',job:'Developer',transcript:'Experience?',question:'Help',screenshot}),'Suggested talking points');const body=JSON.parse(requests[0].options.body);assert.match(body.messages[0].content,/untrusted/);assert.equal(JSON.parse(body.messages[1].content[0].text).resume,'Engineer');assert.equal(body.messages[1].content[1].image_url.url,screenshot);});
test('capture rejects a stale source and non-image payload',async()=>{const {handlers}=setup();await assert.rejects(handlers.screenshot(null,'missing'),/unavailable/);await assert.rejects(handlers.answer(null,{screenshot:'https://example.com'}),/Invalid screenshot/);});
