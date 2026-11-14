import fs from 'node:fs/promises';
const style=process.env.STYLE||'midnight';
const premise=(process.env.PREMISE||'').trim();
const seconds=Number(process.env.SECONDS||65);
const bank={
midnight:{title:"Don't Answer Your Mom at 3:17 AM",messages:[
["Alex","Are you awake?",0],["You","Yeah. Why?",1],["Alex","Mom just called me. It's 3:17.",0],["You","So? Answer it.",1],["Alex","She's asleep. She's literally in the room next to me.",0],["You","Then who's calling?",1],["Alex","I don't know. But the caller ID says MOM.",0],["You","Don't pick up. Wake her up.",1],["Alex","I did. She checked her phone. No call.",0],["You","Alex, block the number.",1],["Alex","Wait. She's calling again.",0],["You","DO NOT ANSWER.",1],["Alex","Too late. It was Mom's voice.",0],["Alex","It said: 'Don't let me in.'",0],["You","Alex... your mom just texted me. She says she's outside your house.",1]]},
woods:{title:"Something Is Running Beside Our Car",messages:[
["Maya","I think something is following our car.",0],["You","We're on an empty road. It's probably another car.",1],["Maya","There are no headlights behind us.",0],["You","Then what are you seeing?",1],["Maya","A person. Running between the trees.",0],["You","Stop looking at it. Keep driving.",1],["Maya","It keeps appearing next to the road.",0],["You","How is it keeping up?",1],["Maya","We just passed the same broken sign twice.",0],["You","That's impossible. Turn around.",1],["Maya","I can see our car ahead.",0],["You","What do you mean ahead?",1],["Maya","There's someone driving it.",0],["Maya","They're waving at me.",0],["You","Maya, I'm in the passenger seat. Who are you texting?",1]]},
group:{title:"Nobody Added the New Person",messages:[
["Noah","Who added a new person to the group?",0],["Ivy","Nobody. Why?",1],["Unknown","Hey guys.",0],["Noah","Who is this?",0],["Unknown","You can see me.",0],["Ivy","Is this one of your friends?",1],["Unknown","I'm in the photo you just sent.",0],["Noah","What photo?",0],["Unknown","The one from your kitchen. Look at the window.",0],["Ivy","Noah, delete that picture.",1],["Noah","There's someone behind me.",0],["Unknown","There isn't.",0],["Ivy","I can see them too.",1],["Unknown","Stop turning around.",0],["Unknown","I'm not behind you anymore.",0]]},
apartment:{title:"The Apartment Above Mine Is Empty",messages:[
["Sam","Do you hear that knocking?",0],["You","From where?",1],["Sam","The ceiling. Same time every night.",0],["You","Maybe the upstairs neighbours.",1],["Sam","There is no upstairs apartment.",0],["You","What? You live on the top floor.",1],["Sam","Exactly.",0],["You","Call the building manager.",1],["Sam","I did. He said the apartment above mine was sealed years ago.",0],["You","Then what's making the noise?",1],["Sam","It stopped when I started recording.",0],["You","Send me the recording.",1],["Sam","I did. Listen to the end.",0],["You","That's your voice.",1],["Sam","I haven't said anything out loud tonight.",0]]}
};
if(!bank[style])throw new Error('Unknown STYLE. Use midnight, woods, group, or apartment.');
const chosen=bank[style];
let messages=chosen.messages.map(([speaker,text,side],index)=>({speaker,text,side:side?'out':'in',voice:side?'voice_b':'voice_a',index}));
if(premise)messages[0].text=premise.replace(/[.!?]+$/,'')+'...';
const episode={title:chosen.title,style,premise,seconds,messages,characters:[...new Set(messages.map(m=>m.speaker))],created_at:new Date().toISOString(),fictional:true};
await fs.mkdir('horror-factory/output',{recursive:true});
await fs.writeFile('horror-factory/output/episode.json',JSON.stringify(episode,null,2));
await fs.writeFile('horror-factory/output/script.txt',episode.title+'\n\n'+messages.map(m=>m.speaker+': '+m.text).join('\n'));
await fs.writeFile('horror-factory/output/metadata.json',JSON.stringify({title:episode.title,description:'An original fictional horror chat story. #horror #scarystories #shorts',tags:['horror','scary stories','chat story','fiction','shorts']},null,2));
console.log('Created episode:',episode.title,'—',messages.length,'messages.');
