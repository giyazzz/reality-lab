import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import sharp from 'sharp';
const root='horror-factory/output';
const episode=JSON.parse(await fs.readFile(root+'/episode.json','utf8'));
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:'inherit'});p.on('error',reject);p.on('close',c=>c===0?resolve():reject(new Error(cmd+' exited '+c)));});
const capture=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args);let out='';p.stdout.on('data',d=>out+=d);p.on('error',reject);p.on('close',c=>c===0?resolve(out.trim()):reject(new Error(cmd+' failed')));});
await fs.mkdir(root+'/frames',{recursive:true});
await fs.mkdir(root+'/audio',{recursive:true});
await run('ffmpeg',['-y','-f','lavfi','-i','sine=frequency=880:duration=0.11','-af','afade=t=out:st=0.02:d=0.09,volume=0.10','-ar','22050',root+'/notification.wav']);
const concat=[];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function wrap(text,max=34){const words=String(text).split(/\s+/),lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>max&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return lines.slice(0,4);}
for(let i=0;i<episode.messages.length;i++){
 const m=episode.messages[i],visible=episode.messages.slice(Math.max(0,i-5),i+1);
 let y=420;const bubbles=[];
 for(const item of visible){const lines=wrap(item.text);const h=62+lines.length*42;const x=item.side==='out'?270:55;const w=item.side==='out'?755:755;const fill=item.side==='out'?'#285742':'#282d39';const name=item.side==='out'?'#a8e0bc':'#f0a1a8';const text=lines.map((line,j)=>'<text x="'+(x+22)+'" y="'+(y+61+j*42)+'" fill="#f4f5f8" font-size="29" font-family="Arial">'+esc(line)+'</text>').join('');bubbles.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="24" fill="'+fill+'"/><text x="'+(x+22)+'" y="'+(y+32)+'" fill="'+name+'" font-size="20" font-weight="bold" font-family="Arial">'+esc(item.speaker)+'</text>'+text);y+=h+17;}
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#111722"/><stop offset="1" stop-color="#080a0f"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#bg)"/><rect x="0" y="0" width="1080" height="250" fill="#141923"/><text x="54" y="82" fill="#a6adba" font-size="24" font-family="Arial">9:41</text><text x="1020" y="82" fill="#a6adba" font-size="24" text-anchor="end" font-family="Arial">●●●  ▰</text><circle cx="91" cy="170" r="37" fill="#56333b"/><text x="91" y="181" fill="#ffd4d7" font-size="30" text-anchor="middle" font-family="Arial">?</text><text x="150" y="165" fill="#fff" font-size="31" font-weight="bold" font-family="Arial">'+esc(episode.messages[0].speaker)+'</text><text x="150" y="203" fill="#8993a3" font-size="20" font-family="Arial">last seen recently</text><text x="540" y="310" fill="#758093" font-size="19" text-anchor="middle" letter-spacing="3" font-family="Arial">TODAY · 2:17 AM</text>'+bubbles.join('')+'<rect x="45" y="1790" width="990" height="78" rx="38" fill="#1b202b" stroke="#343b49"/><text x="83" y="1838" fill="#788394" font-size="24" font-family="Arial">Message</text><text x="990" y="1838" fill="#a6dfbd" font-size="25" text-anchor="end" font-family="Arial">➤</text><text x="540" y="1895" fill="#687183" font-size="15" text-anchor="middle" font-family="Arial">FICTIONAL CHAT STORY</text></svg>';
 const png=root+'/frames/'+String(i).padStart(3,'0')+'.png';await sharp(Buffer.from(svg)).png().toFile(png);
 const wav=root+'/audio/'+String(i).padStart(3,'0')+'.wav';
 const pitch=m.side==='out'?'68':'42';const speed=m.text.length>90?'155':'170';
 await run('espeak-ng',['-v','en-us','-p',pitch,'-s',speed,'-a','165','-w',wav,m.speaker+': '+m.text]);
 const voiceDuration=Number(await capture('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',wav]));
 const total=Math.max(1.3,voiceDuration+0.55);
 const segment=root+'/frames/'+String(i).padStart(3,'0')+'.mp4';
 if(m.side==='in'){
  await run('ffmpeg',['-y','-loop','1','-i',png,'-i',wav,'-i',root+'/notification.wav','-filter_complex','[1:a][2:a]amix=inputs=2:duration=first,apad=pad_dur=0.55[a]','-map','0:v','-map','[a]','-t',String(total),'-vf','scale=1080:1920,format=yuv420p','-r','30','-c:v','libx264','-preset','ultrafast','-crf','25','-c:a','aac','-b:a','128k',segment]);
 }else{
  await run('ffmpeg',['-y','-loop','1','-i',png,'-i',wav,'-af','apad=pad_dur=0.55','-t',String(total),'-vf','scale=1080:1920,format=yuv420p','-r','30','-c:v','libx264','-preset','ultrafast','-crf','25','-c:a','aac','-b:a','128k',segment]);
 }
 concat.push("file '"+segment+"'");
}
await fs.writeFile(root+'/frames/concat.txt',concat.join('\n'));
await run('ffmpeg',['-y','-f','concat','-safe','0','-i',root+'/frames/concat.txt','-c','copy','-movflags','+faststart',root+'/horror-short.mp4']);
const meta=JSON.parse(await fs.readFile(root+'/metadata.json','utf8'));
const thumb='<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#090c12"/><circle cx="1010" cy="360" r="190" fill="none" stroke="#9b3f4b" stroke-width="12"/><path d="M940 310Q1010 210 1080 310L1080 450Q1010 520 940 450Z" fill="#241820"/><text x="75" y="120" fill="#ee737d" font-size="28" letter-spacing="8" font-family="Arial">HORROR FACTORY</text><text x="75" y="290" fill="#fff" font-size="66" font-weight="bold" font-family="Arial">'+esc(episode.title.slice(0,24))+'</text><text x="78" y="650" fill="#929aaa" font-size="24" font-family="Arial">A FICTIONAL CHAT HORROR STORY</text></svg>';
await sharp(Buffer.from(thumb)).png().toFile(root+'/thumbnail.png');
console.log('Finished:',root+'/horror-short.mp4','—',meta.title);
