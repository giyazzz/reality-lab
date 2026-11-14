import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs/promises';
const topic=process.env.TOPIC?.trim();
if(!topic) throw new Error('Set TOPIC.');
for(const k of ['ANTHROPIC_API_KEY','ELEVENLABS_API_KEY','ELEVENLABS_VOICE_ID']) if(!process.env[k]) throw new Error('Missing '+k);
await fs.mkdir('output',{recursive:true});
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'RealityLab/1.0 science video research'}});if(!r.ok)throw new Error('Research HTTP '+r.status);return r.json();}
const wiki=await get('https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&exintro=1&titles='+encodeURIComponent(topic));
const page=Object.values(wiki.query?.pages||{})[0];
const works=await get('https://api.openalex.org/works?search='+encodeURIComponent(topic)+'&per-page=6&select=title,publication_year,doi,authorships');
const sources=[{name:'Wikipedia overview',url:'https://en.wikipedia.org/wiki/'+encodeURIComponent(topic.replaceAll(' ','_')),excerpt:(page?.extract||'').slice(0,10000)},...(works.results||[]).map(w=>({name:w.title,year:w.publication_year,url:w.doi||'',authors:(w.authorships||[]).slice(0,3).map(a=>a.author?.display_name)}))];
await fs.writeFile('output/research.json',JSON.stringify({topic,gathered_at:new Date().toISOString(),sources},null,2));
const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
const prompt='Create an original REALITY LAB science explainer about: '+topic+'. Use only supplied research for factual claims; do not invent studies, statistics, quotes or certainty. Write 900-1300 spoken words. Return ONLY valid JSON with title,description,tags array,script string,scenes array,claims_to_verify array,sources array. Each scene has narration (verbatim script excerpt), action (idle/walk/run/jump/point/think/wave/reach/explain/celebrate), visual, label. Make 18-35 scenes in narration order covering the full script. Flag important facts needing human verification. Sources must be selected from supplied research and include name and URL. Research: '+JSON.stringify(sources);
const msg=await client.messages.create({model:process.env.CLAUDE_MODEL||'claude-3-7-sonnet-latest',max_tokens:12000,temperature:0.35,messages:[{role:'user',content:prompt}]});
const raw=msg.content.filter(x=>x.type==='text').map(x=>x.text).join('\n').trim();
const tick=String.fromCharCode(96);
const fence=new RegExp('^'+tick+'{3}(?:json)?\\s*|\\s*'+tick+'{3}$','gi');
const episode=JSON.parse(raw.replace(fence,''));
if(!episode.script||!Array.isArray(episode.scenes)||!episode.scenes.length)throw new Error('Invalid AI episode JSON.');
episode.topic=topic;episode.generated_at=new Date().toISOString();
await fs.writeFile('output/episode.json',JSON.stringify(episode,null,2));
await fs.writeFile('output/metadata.json',JSON.stringify({title:String(episode.title||topic).slice(0,95),description:String(episode.description||'')+'\n\nSources:\n'+(episode.sources||[]).map(x=>(x.name||x.title)+': '+x.url).join('\n'),tags:(episode.tags||[]).slice(0,15),categoryId:'27',privacyStatus:'private'},null,2));
const sentences=episode.script.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[episode.script];
const chunks=[];let chunk='';
for(const sentence of sentences){if((chunk+' '+sentence).length>4300&&chunk){chunks.push(chunk.trim());chunk=sentence;}else chunk+=' '+sentence;}
if(chunk.trim())chunks.push(chunk.trim());
const concat=[];
for(let i=0;i<chunks.length;i++){
 const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(process.env.ELEVENLABS_VOICE_ID),{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY,'Content-Type':'application/json','Accept':'audio/mpeg'},body:JSON.stringify({text:chunks[i],model_id:process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2',voice_settings:{stability:0.48,similarity_boost:0.78,style:0.2,use_speaker_boost:true}})});
 if(!response.ok)throw new Error('ElevenLabs TTS failed '+response.status+': '+(await response.text()).slice(0,500));
 const name='output/narration-'+String(i).padStart(3,'0')+'.mp3';
 await fs.writeFile(name,Buffer.from(await response.arrayBuffer()));
 concat.push("file '"+name+"'");
}
if(chunks.length===1) await fs.copyFile('output/narration-000.mp3','output/narration.mp3');
else {
 await fs.writeFile('output/narration-concat.txt',concat.join('\n'));
 const {spawn}=await import('node:child_process');
 await new Promise((resolve,reject)=>{const p=spawn('ffmpeg',['-y','-f','concat','-safe','0','-i','output/narration-concat.txt','-c','copy','output/narration.mp3'],{stdio:'inherit'});p.on('error',reject);p.on('close',c=>c===0?resolve():reject(new Error('MP3 chunk join failed: '+c)));});
}
console.log('Research, script, storyboard, metadata and narration generated.');
