import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {google} from 'googleapis';
for(const k of ['YT_CLIENT_ID','YT_CLIENT_SECRET','YT_REFRESH_TOKEN'])if(!process.env[k])throw new Error('Missing '+k);
const meta=JSON.parse(await fs.readFile('output/metadata.json','utf8'));
const auth=new google.auth.OAuth2(process.env.YT_CLIENT_ID,process.env.YT_CLIENT_SECRET);
auth.setCredentials({refresh_token:process.env.YT_REFRESH_TOKEN});
const youtube=google.youtube({version:'v3',auth});
const result=await youtube.videos.insert({part:['snippet','status'],requestBody:{snippet:{title:String(meta.title).slice(0,100),description:meta.description,tags:(meta.tags||[]).slice(0,15),categoryId:meta.categoryId||'27'},status:{privacyStatus:'private',selfDeclaredMadeForKids:false}},media:{body:createReadStream('output/reality-lab-episode.mp4')}});
const videoId=result.data.id;if(!videoId)throw new Error('YouTube returned no video ID.');
try{await youtube.thumbnails.set({videoId,media:{body:createReadStream('output/thumbnail.png')}});}catch(e){console.warn('Thumbnail upload failed: '+e.message);}
await fs.writeFile('output/youtube-upload.json',JSON.stringify({videoId,url:'https://www.youtube.com/watch?v='+videoId,privacyStatus:'private',uploadedAt:new Date().toISOString()},null,2));
console.log('Uploaded privately. Review in YouTube Studio before changing visibility.');
