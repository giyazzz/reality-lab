import fs from 'node:fs/promises';
const topic=process.env.TOPIC?.trim();
if(!topic)throw new Error('Set TOPIC.');
await fs.mkdir('output',{recursive:true});
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'REALITY-LAB-educational-project/1.0'}});if(!r.ok)throw new Error('Research request failed: '+r.status);return r.json();}
const summary=await get('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(topic.replaceAll(' ','_')));
const openalex=await get('https://api.openalex.org/works?search='+encodeURIComponent(topic)+'&per-page=6&select=title,publication_year,doi');
const sources=[{name:summary.title||topic,url:summary.content_urls?.desktop?.page||'https://en.wikipedia.org/wiki/'+encodeURIComponent(topic.replaceAll(' ','_')),excerpt:summary.extract||''},...(openalex.results||[]).map(w=>({name:w.title,year:w.publication_year,url:w.doi?'https://doi.org/'+w.doi:''}))];
if(!summary.extract)throw new Error('No Wikipedia summary found. Try a more specific topic or exact encyclopedia page title.');
const facts=summary.extract.split(/(?<=[.!?])\s+/).filter(x=>x.length>35);
const script=[
'Welcome to REALITY LAB. Today, we are exploring '+topic+'.',
'Before we begin, this episode is an automatically assembled research draft. Check the sources and verify every scientific claim before publishing.',
...facts,
'So what should we take away from this? The overview gives us a starting point, but a short summary is not the whole scientific story. The details, limitations and current research matter.',
'For a deeper investigation, consult the linked research papers and primary sources listed with this episode. Our goal is not just to imagine what is possible, but to understand what the evidence actually supports.',
'This is REALITY LAB. Explore. Imagine. Discover.'
].join('\n\n');
const sentences=script.split(/(?<=[.!?])\s+/).filter(Boolean);
const actions=['think','point','explain','reach','idle','walk'];
const scenes=sentences.map((sentence,i)=>({action:actions[i%actions.length],duration:Math.max(2200,Math.min(6500,sentence.split(/\s+/).length*330)),label:sentence.slice(0,58),narration:sentence}));
const episode={topic,title:'Could '+topic+'? | REALITY LAB',description:'An automatically assembled research draft. Please fact-check all claims and improve the script before publishing.',tags:['science','engineering','reality lab',topic.toLowerCase()],script,scenes,claims_to_verify:['Verify every factual statement against primary sources.','Review scientific accuracy, context and limitations.'],sources,generated_at:new Date().toISOString(),draft_only:true};
await fs.writeFile('output/research.json',JSON.stringify({topic,sources},null,2));
await fs.writeFile('output/episode.json',JSON.stringify(episode,null,2));
await fs.writeFile('output/metadata.json',JSON.stringify({title:episode.title.slice(0,95),description:episode.description+'\n\nSources:\n'+sources.map(x=>x.name+': '+x.url).join('\n'),tags:episode.tags},null,2));
await fs.writeFile('output/script.txt',script);
const {spawn}=await import('node:child_process');
await new Promise((resolve,reject)=>{const p=spawn('espeak-ng',['-v','en-us','-s','148','-f','output/script.txt','-w','output/narration.wav'],{stdio:'inherit'});p.on('error',reject);p.on('close',c=>c===0?resolve():reject(new Error('eSpeak NG failed: '+c)));});
console.log('Free research draft, storyboard, metadata and narration generated. Fact-check before publishing.');
