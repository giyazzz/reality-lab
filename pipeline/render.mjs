import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import sharp from 'sharp';
const episode=JSON.parse(await fs.readFile('output/episode.json','utf8'));
const metadata=JSON.parse(await fs.readFile('output/metadata.json','utf8'));
const scenes=episode.scenes||[];
if(!scenes.length)throw new Error('No storyboard scenes.');
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:'inherit'});p.on('error',reject);p.on('close',c=>c===0?resolve():reject(new Error(cmd+' exit '+c)));});
const duration=await new Promise((resolve,reject)=>{const p=spawn('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1','output/narration.mp3']);let x='';p.stdout.on('data',d=>x+=d);p.on('error',reject);p.on('close',c=>c===0?resolve(Number(x.trim())):reject(new Error('ffprobe failed')));});
await fs.mkdir('output/frames',{recursive:true});
const weights=scenes.map(s=>Math.max(1,String(s.narration||'').trim().split(/\s+/).length));
const sum=weights.reduce((a,b)=>a+b,0),concat=[];
const esc=x=>String(x||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const poses={point:'M0 -50L48 -95',think:'M0 -50L25 -95',wave:'M0 -50L40 -105',explain:'M0 -50L-38 -78 M0 -50L38 -78',celebrate:'M0 -50L-45 -115 M0 -50L45 -115',reach:'M0 -50L55 -60',walk:'M0 -50L-28 -20 M0 -50L28 -80',run:'M0 -50L-42 -10 M0 -50L42 -90',jump:'M0 -50L-45 -115 M0 -50L45 -115'};
for(let i=0;i<scenes.length;i++){
 const s=scenes[i],sec=Math.max(1,duration*weights[i]/sum),label=esc(s.label||'REALITY LAB'),caption=esc(s.narration||''),arms=poses[s.action]||'M0 -50L-18 -45 M0 -50L18 -45';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="#142d4b"/><stop offset="1" stop-color="#070c15"/></linearGradient></defs><rect width="1280" height="720" fill="url(#b)"/><text x="70" y="75" fill="#9bcfff" font-size="25" letter-spacing="7" font-family="Arial">REALITY LAB</text><text x="70" y="145" fill="white" font-size="40" font-weight="bold" font-family="Arial">'+label+'</text><g transform="translate(320 400)" stroke="#dcecff" stroke-width="14" stroke-linecap="round" fill="none"><circle cy="-125" r="38" fill="#dcecff" stroke="none"/><path d="M0 -85V45 '+arms+' M0 45L-40 140 M0 45L40 140"/></g><g transform="translate(890 360)" fill="none" stroke="#62b7ff" stroke-width="9"><circle r="115"/><ellipse rx="115" ry="42" transform="rotate(-28)"/><ellipse rx="115" ry="42" transform="rotate(55)"/><circle r="19" fill="#b9e2ff"/></g><rect x="60" y="555" width="1160" height="115" rx="18" fill="#081321" stroke="#294563"/><foreignObject x="85" y="570" width="1110" height="90"><div xmlns="http://www.w3.org/1999/xhtml" style="font:22px/1.35 Arial;color:#eef4ff">'+caption.slice(0,420)+'</div></foreignObject><text x="1200" y="45" fill="#91a9c5" text-anchor="end" font-size="16" font-family="Arial">'+(i+1)+' / '+scenes.length+'</text></svg>';
 const png='output/frames/'+String(i).padStart(3,'0')+'.png';await sharp(Buffer.from(svg)).png().toFile(png);
 const mp4='output/frames/'+String(i).padStart(3,'0')+'.mp4';
 await run('ffmpeg',['-y','-loop','1','-i',png,'-t',String(sec),'-vf','scale=1280:720,zoompan=z=min(zoom+0.0003\\,1.03):d=1:x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):s=1280x720:fps=30,format=yuv420p','-r','30','-an','-c:v','libx264','-preset','veryfast','-crf','24',mp4]);
 concat.push("file '"+mp4+"'");
}
await fs.writeFile('output/frames/concat.txt',concat.join('\n'));
await run('ffmpeg',['-y','-f','concat','-safe','0','-i','output/frames/concat.txt','-i','output/narration.mp3','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart','output/reality-lab-episode.mp4']);
const title=esc(metadata.title).slice(0,75);
const thumb='<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#081321"/><circle cx="970" cy="350" r="190" fill="none" stroke="#4caeff" stroke-width="18"/><ellipse cx="970" cy="350" rx="190" ry="75" fill="none" stroke="#b5e2ff" stroke-width="12" transform="rotate(-28 970 350)"/><circle cx="970" cy="350" r="45" fill="#80caff"/><text x="70" y="115" font-family="Arial" font-size="28" letter-spacing="8" fill="#9bcfff">REALITY LAB</text><foreignObject x="70" y="190" width="760" height="390"><div xmlns="http://www.w3.org/1999/xhtml" style="font:bold 64px/1.1 Arial;color:white">'+title+'</div></foreignObject><text x="75" y="650" font-family="Arial" font-size="25" fill="#8ca8c7">EXPLORE. IMAGINE. DISCOVER.</text></svg>';
await sharp(Buffer.from(thumb)).png().toFile('output/thumbnail.png');
console.log('Rendered MP4 and thumbnail.');
