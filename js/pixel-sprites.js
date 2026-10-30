// Native 2D pixel drawings. Every mark is an authored integer grid cell;
// no 3D rendering, scaled photographs, filters or interpolated edges are used.
export const ACTOR_PALETTE = Object.freeze({
  ink:'#242238', skin:'#efb77f', skinLight:'#ffe0a4', skinShade:'#bd775d',
  cream:'#fff1bd', gold:'#e7b958', red:'#a84843', blue:'#385d88',
  moss:'#7d9c55', mossLight:'#a7bf6b', mossShade:'#4d6a43',
});

const PEOPLE = {
  harry: {hair:'#4e302a',hairMid:'#754636',hairLight:'#a46743',robe:'#34455f',robeLight:'#526c87',robeShade:'#243348',accent:'#b85e46',trim:'#e9bb5e',glasses:true},
  ron: {hair:'#733728',hairMid:'#b9562d',hairLight:'#ea9750',robe:'#3c475f',robeLight:'#64758f',robeShade:'#293147',accent:'#b85e46',trim:'#e9bb5e'},
  hermione: {hair:'#503129',hairMid:'#86563b',hairLight:'#b98451',robe:'#3b455f',robeLight:'#63728d',robeShade:'#292d43',accent:'#b85e46',trim:'#e9bb5e',longHair:true},
  hagrid: {hair:'#392b2a',hairMid:'#674232',hairLight:'#946440',robe:'#796140',robeLight:'#a18455',robeShade:'#4a3c31',accent:'#a5764c',trim:'#d7ab69',beard:true,big:true},
  flitwick: {hair:'#898c91',hairMid:'#b9c0bf',hairLight:'#e2e0c4',robe:'#54637a',robeLight:'#8c9aab',robeShade:'#344253',accent:'#b77b58',trim:'#e9c786',beard:true,glasses:true},
  mcgonagall: {hair:'#46454e',hairMid:'#77737a',hairLight:'#a19a96',robe:'#3c6e5b',robeLight:'#6b9b77',robeShade:'#294d47',accent:'#a87a48',trim:'#e7be72',hat:true},
  snape: {hair:'#222334',hairMid:'#3c3d50',hairLight:'#606276',robe:'#3b3656',robeLight:'#635676',robeShade:'#29243e',accent:'#657488',trim:'#a5b2bf',longHair:true},
  sprout: {hair:'#684637',hairMid:'#9b6e4e',hairLight:'#c79b69',robe:'#718447',robeLight:'#a0ad61',robeShade:'#465a3b',accent:'#bb7249',trim:'#e0b960',hat:true},
  hooch: {hair:'#b6a26e',hairMid:'#decb8b',hairLight:'#fff0b7',robe:'#6c695e',robeLight:'#a39c78',robeShade:'#484a46',accent:'#9b6648',trim:'#e8bf6d',glasses:true},
  ollivander: {hair:'#878482',hairMid:'#bbb5a6',hairLight:'#e5dbc3',robe:'#61587b',robeLight:'#9188a1',robeShade:'#3f3a58',accent:'#b08b63',trim:'#dec095'},
  bookseller: {hair:'#5d3c30',hairMid:'#996b49',hairLight:'#c8935e',robe:'#78567a',robeLight:'#a378a0',robeShade:'#503c59',accent:'#c58d53',trim:'#e4be79',glasses:true},
  apothecary: {hair:'#453b31',hairMid:'#716451',hairLight:'#a39370',robe:'#55704f',robeLight:'#849769',robeShade:'#374d40',accent:'#c58a52',trim:'#e2c589',beard:true},
  repairer: {hair:'#693f2e',hairMid:'#a56b42',hairLight:'#d49d62',robe:'#657783',robeLight:'#95abb4',robeShade:'#3d525e',accent:'#b57849',trim:'#ddae70',apron:true},
  filch: {hair:'#666044',hairMid:'#9a8e69',hairLight:'#c6b58b',robe:'#665a4b',robeLight:'#958367',robeShade:'#453d37',accent:'#a66c4b',trim:'#ccaa72',beard:true},
  trolley_witch: {hair:'#857d76',hairMid:'#b9afa1',hairLight:'#e7d7be',robe:'#775a78',robeLight:'#aa81a0',robeShade:'#513f58',accent:'#bb8053',trim:'#e5c590',hat:true},
  quirrell: {hair:'#583e70',hairMid:'#866397',hairLight:'#b18abb',robe:'#62466f',robeLight:'#92729b',robeShade:'#3b304e',accent:'#b78c5a',trim:'#f0ca7d',turban:true},
  guide: {hair:'#533e31',hairMid:'#8d6c4b',hairLight:'#bd9864',robe:'#356c78',robeLight:'#66a1a3',robeShade:'#264956',accent:'#c09356',trim:'#f0cf86'},
};

const NPC_NAMES = Object.freeze({
  '해리':'harry','론':'ron','헤르미온느':'hermione','하그리드':'hagrid','플리트윅':'flitwick',
  '맥고나걸':'mcgonagall','스네이프':'snape','스프라우트':'sprout','후치':'hooch',
  '올리밴더':'ollivander','서점':'bookseller','약재상':'apothecary','수리공':'repairer',
  '관리인':'filch','필치':'filch','퀴렐':'quirrell','간식':'trolley_witch',
});
export function actorKind(entity={}) {
  if(entity.type==='player'||entity.id==='player')return 'harry';
  if(['troll','spider','bat','armor','cursed-book'].includes(entity.kind))return entity.kind;
  for(const [name,key] of Object.entries(NPC_NAMES))if((entity.name||'').includes(name))return key;
  const suffix=entity.id?.split('.').at(-1);
  return PEOPLE[suffix]?suffix:suffix==='professor'?'flitwick':suffix==='keeper'?'filch':'guide';
}

function drawing(w,h,palette) {
  const pixels=Array.from({length:h},()=>Array(w).fill(null));
  const dot=(x,y,key)=>{if(x>=0&&x<w&&y>=0&&y<h&&palette[key])pixels[y][x]=palette[key];};
  const rect=(x,y,rw,rh,key)=>{for(let py=y;py<y+rh;py++)for(let px=x;px<x+rw;px++)dot(px,py,key);};
  const stamp=(rows,x,y)=>rows.forEach((row,dy)=>[...row].forEach((key,dx)=>dot(x+dx,y+dy,key)));
  return {w,h,pixels,dot,rect,stamp};
}
function mirror(picture){picture.pixels=picture.pixels.map(row=>row.slice().reverse());return picture;}

function human(kind,direction,frame,pose) {
  const style=PEOPLE[kind]||PEOPLE.guide;
  const p={0:ACTOR_PALETTE.ink,h:style.hair,H:style.hairMid,J:style.hairLight,
    s:ACTOR_PALETTE.skin,S:ACTOR_PALETTE.skinLight,d:ACTOR_PALETTE.skinShade,
    w:ACTOR_PALETTE.cream,r:style.robe,R:style.robeLight,b:style.robeShade,
    a:style.accent,g:style.trim,c:'#cc8065',t:'#956443'};
  const d=drawing(20,28,p), {stamp,rect,dot}=d;
  const walking=pose==='walk'||pose==='run';
  const stride=walking?(frame%3===1?-1:frame%3===2?1:0):0;
  const bounce=walking&&frame%3!==0?1:0;
  const y=1+bounce;
  // Separate boots and sleeves allow stepping without rotating/resampling art.
  stamp(['0000','0bb0','0rr0','0000'],5,23+(stride>0?-1:0));
  stamp(['0000','0bb0','0rr0','0000'],11,23+(stride<0?-1:0));
  rect(8,12+bounce,4,4,'0');rect(9,12+bounce,2,3,'s');
  const back=direction==='up',side=direction==='left'||direction==='right';
  if(side){
    stamp(['..000000..','.0RRrrrb0.','0RRRrrrbb0','0Rrrrbrbb0','0Rrrrbrbb0','0rrrbrbbb0','0rrrbrbbb0','0Rrrbrbbb0','0rrrbrbbb0','0000000000'],5,14+bounce);
  }else{
    stamp(['...000000...','..0RRrrbb0..','.0RRRrrrbb0.','0RRRrrrrrbb0','0Rrrrrrrrrb0','0Rrrrrrrrrb0','0Rrrrrrrrrb0','0RRrrrrrrbb0','.0Rrrrrrbb0.','.0000000000.'],4,14+bounce);
  }
  if(!back){
    // Cream collar, striped scarf and coat fastenings.
    rect(side?10:8,14+bounce,side?3:4,2,'w');
    rect(side?11:9,16+bounce,2,5,'a');dot(side?11:9,17+bounce,'g');dot(side?11:9,20+bounce,'g');
    if(!side){dot(10,22+bounce,'g');rect(8,21+bounce,1,2,'R');}
    if(style.apron){rect(7,18+bounce,7,6,'a');rect(8,18+bounce,1,5,'g');rect(9,20+bounce,3,2,'t');}
  }else{rect(9,15+bounce,2,6,'R');dot(8,21+bounce,'r');}

  if(side){
    stamp(['..000000....','.0hHHJHh0...','0hHJHHHHh0..','0HHHHHHHh0..','0hHHHHHss00.','0hHHHssSsS0.','.0hHssS0sS0.','..0HssSSss00','...0ssSssSd0','...0dssssd00','....0ddd00..','.....000....'],4,y);
  }else if(back){
    stamp(['...000000...','..0hHHJJh0..','.0hHJHHHHh0.','0hHHHHHHHhh0','0hHHHHHHHHh0','0hHHHHHHHHh0','.0hHHHHHHh0.','.0hhhHHhhh0.','..0hhhhhh0..','...0hhhh0...','....0dd0....','....0000....'],4,y);
  }else{
    stamp(['...000000...','..0hHHJJh0..','.0hHJHHHHh0.','0hHHHHHHHhh0','0hHsHHsssHh0','0hSSsSSSSsh0','0sSSSSSSSSs0','.0s0wSSw0s0.','.0sSSSdSSs0.','..0scSSsc0..','...0sdds0...','....0000....'],4,y);
    if(style.glasses){stamp(['000.000','0w000w0','000.000'],6,6+y);}
    if(pose==='talk'&&frame%2===1){dot(9,10+y,'0');dot(10,10+y,'0');}
  }
  if(style.longHair){
    if(!side){stamp(['0hH0','0HH0','0Hh0','.0h0'],3,10+y);stamp(['0HH0','0hH0','0hh0','0h0.'],13,10+y);}
    else stamp(['0hHh0','0HHh0','0HHh0','.0Hh0','.0hh0','..00.'],4,8+y);
  }
  if(style.beard&&!back){
    stamp(side?['.0hHh0','0HHhh0','.0Hh0.','..00..']:['.0hhHHhh0.','0hHHJJHhh0','.0hHHHHh0.','..0hHHh0..','...0000...'],side?8:5,10+y);
  }
  if(style.hat){
    stamp(['....00....','...0rr0...','..0rRrb0..','.0rRRrbb0.','0rRRRrrbb0','000gggg000'],5,0);
    rect(3,5,14,1,'0');rect(4,4,12,1,'r');
  }
  if(style.turban){
    stamp(['..000000..','.0JHHHHh0.','0HJHHHHHh0','0HHHHJJHh0','.0HJHHHh0.'],5,0+y);dot(10,2+y,'g');
  }

  // Hands and wand sit on discrete grid positions in every pose.
  if(pose==='cast'||pose==='attack'||pose==='windup'){
    stamp(['.000','0SS0','0ss0','.00.'],14,11+bounce);
    rect(17,7+bounce,1,6,'0');rect(17,7+bounce,1,1,'w');rect(17,9+bounce,1,2,'g');
    dot(18,6+bounce,'g');dot(16,5+bounce,'w');dot(19,8+bounce,'w');
  }else if(pose==='guard'){
    stamp(['000000','0SssS0','.0000.'],7,18+bounce);
    rect(6,17+bounce,8,1,'g');
  }else{
    const armY=18+bounce+(stride<0?1:0);
    if(!back||!side)stamp(['000','0Ss','0sd','.00'],side?13:3,armY);
    stamp(['000','sS0','ds0','00.'],side?7:14,18+bounce+(stride>0?1:0));
    if(kind==='harry'||kind==='quirrell'){rect(16,20+bounce,1,5,'t');dot(16,20+bounce,'g');}
  }
  if(pose==='hit'){dot(2,11,'w');dot(1,10,'w');dot(17,10,'w');dot(18,9,'w');}
  if(pose==='down'){
    // Hand-authored low silhouette rather than rotating a standing sprite.
    const fallen=drawing(28,14,p);fallen.stamp(['..000000.................','00hHHHHh00000000000......','0hHJHHHhss0RRrrrrrr00000..','0HHHHHhssS0Rrrrrrbbb0bb0..','.0hHHhsssd0rrrrrbbb00000..','..00000000000000000......'],1,6);fallen.anchorX=14;fallen.anchorY=12;return fallen;
  }
  if(style.big){
    const big=drawing(26,34,p);
    // Two added columns and six rows give the gentle giant a broad coat.
    for(let py=0;py<d.h;py++)for(let px=0;px<d.w;px++){
      const color=d.pixels[py][px];if(!color)continue;
      const nx=px+3+(px>=10?2:0),ny=py+(py>=14?3:0);
      big.pixels[ny][nx]=color;
      if(px===9){big.pixels[ny][nx+1]=color;big.pixels[ny][nx+2]=color;}
      if(py===13)for(let dy=1;dy<=3;dy++)big.pixels[ny+dy][nx]=color;
    }
    big.anchorX=14;big.anchorY=31;return direction==='left'?mirror(big):big;
  }
  d.anchorX=10;d.anchorY=27;return direction==='left'?mirror(d):d;
}

function troll(direction,frame,pose){
  const p={0:'#252b32',a:'#597345',b:'#789251',c:'#a5b868',d:'#cad58a',s:'#38543b',r:'#886043',R:'#b78951',h:'#583f37',g:'#cbb779',w:'#fff0bd',e:'#d89156'};
  const d=drawing(44,52,p),{rect,stamp}=d;
  const stride=(pose==='walk'||pose==='run')?(frame%3===1?-1:frame%3===2?1:0):0;
  // Club silhouette is part of this sprite, with explicit raised/low positions.
  const raised=['windup','attack','cast'].includes(pose);
  if(raised){
    stamp(['..000000..','.0RRRrrr0.','0RRRRRrrh0','0RrRRRrrh0','0RRRrrrhh0','.0rrrrhh0.','..000000..'],32,1);
    rect(35,7,3,17,'0');rect(36,7,1,16,'R');
  }else{
    stamp(['..000000..','.0RRRrrr0.','0RRRRRrrh0','0RrRRRrrh0','0RRRrrrhh0','.0rrrrhh0.','..000000..'],33,34);
    rect(35,25,3,12,'0');rect(36,26,1,10,'R');
  }
  stamp(['.000000.','0abbbaa0','0abbba00','0abbbb0.','0abcba0.','0abbbba0','00000000'],8,44+(stride>0?-1:0));
  stamp(['.000000.','0abbbaa0','00abbba0','.0bbbba0','.0abcba0','0abbbba0','00000000'],23,44+(stride<0?-1:0));
  stamp([
    '.......000000000000.......',
    '....000abbbbbbbbaaa000....',
    '..00abbccccccccbbbbaaa00..',
    '.0abbccccdccccccbbbaaaa0..',
    '0abbccccccccccccbbbbaaa00.',
    '0abbccccccccccccbbbbaaaa0.',
    '0abbccccccccccccbbbbaaaa0.',
    '0abbccccccccccccbbbbaaaa0.',
    '.0bbccccccccccccbbbaaaa0..',
    '..0bccccccccccccbbbaaa0...',
    '..0bbcccccccccccbbbaaa0...',
    '..0bbbccccccccccbbbaaa0...',
    '...0bbccccccccccbbbaa0....',
    '...0bbbcccccccccbbbaa0....',
    '...0bbbbbbbbbbbbbbbaa0...',
    '...0hrrrRRrrrrrrhhhh0....',
    '..0hrrRRRRrrrrrhhhhh0....',
    '..0hrrrRRrrrhhhhrhhh0....',
    '..0hrrrRRrrrhhhrhhhh0....',
    '..0hhrrrrrrrhhhhrhhh0....',
    '...00hrrrhhh00hrrhh0.....',
    '.....0000000..00000......',
  ],5,23);
  // Knobbly shoulders, belly, ears and asymmetrical brow define the creature.
  stamp([
    '.....00000000.....',
    '...00abbccbaa00...',
    '..0abbccccccbba0..',
    '.0abcccdccccbbaa0.',
    '.0abcccccccccbaa0.',
    '0abcccccccccbbbaa0',
    '0abcccccccccbbbaa0',
    '0abbccbbcccbbbaaa0',
    '0abb000bb000bbaaa0',
    '.0bcw0bcccw0bbaa0.',
    '.0bcccccccccbaa0..',
    '..0bcccddccbbaa0..',
    '..0bcccdcccbbaa0..',
    '..0bbcccccbbbaa0..',
    '...0b00000bbaa0...',
    '...0bw0w0wbbba0...',
    '....0bbccbbbaa0...',
    '.....00bbbaa00....',
    '.......00000......',
  ],11,7);
  stamp(['.0000.','0bccb0','0bcca0','0bbaa0','.0000.'],8,16);
  stamp(['.0000.','0bccb0','0bcca0','0bbaa0','.0000.'],29,16);
  // Hand grips shift to the raised club position during windup.
  stamp(['.00000.','0bcccb0','0bcccba','0bbccba','.00000.'],31,raised?20:29);
  stamp(['.00000.','0bcccb0','0bcccba','0bbccba','.00000.'],4,31);
  if(pose==='hit'||pose==='stunned'){stamp(['..w..','.www.','wwwww','.www.','..w..'],9,2);stamp(['.g.','ggg','.g.'],27,0);}
  if(pose==='sweep'){rect(32,29,11,3,'0');rect(33,30,10,1,'R');}
  if(direction==='up'){rect(15,15,12,9,'b');rect(15,16,2,6,'c');}
  d.anchorX=22;d.anchorY=51;return direction==='left'?mirror(d):d;
}

function creature(kind,direction,frame,pose){
  const p={0:'#282238',a:'#684a63',b:'#997186',c:'#c3949c',e:'#efb36c',w:'#fff0bd',r:'#ad505a',g:'#b9c3c3',s:'#6d8196',h:'#4b5d78',G:'#e1d8b7'};
  if(kind==='spider'){
    const d=drawing(28,20,p),{stamp}=d,step=frame%2;
    stamp(['.00....00........00....00.','..0a0...0a0....0a0...0a0..','...0aa0..0a0..0a0..0aa0...','....0aaa00aaaaaa00aaa0....'],0,step?2:1);
    stamp(['......0000000000......','....00aabbbbaa00......','...0aabbccbbbbaa0.....','...0abbcccccbbbaa0....','...0abbccccccbaa0.....','....0aaabbbbaa00......','.....00aaabaa00.......','.....0wee0wee0........','......0aaaa00.........','.......00000..........'],3,4);
    stamp(['...0aa0..0a0..0a0..0aa0...','..0a0...0a0....0a0...0a0..','.00....00........00....00.'],0,step?14:15);
    d.anchorX=14;d.anchorY=17;return direction==='left'?mirror(d):d;
  }
  if(kind==='bat'){
    const d=drawing(28,20,p),{stamp}=d;
    stamp(frame%2?['.00.........00.........00.','0ab00......0aa0......00ba0','0abbc00...0abba0...00cbba0','0abcccb000abccba000bccba0.','.0abcccbbabbccbabbccba0..','..00abccbbabccbbccba00...','....00bbbbbccbbbbb00.....','......000abccba000.......','.........0e00e0..........','..........0aa0...........']:['...........00............','..........0aa0...........','...000...0abba0...000.....','..0acc000abccba000cca0...','.0abccbbabbccbabbccba0...','0abccccbbabccbbccccba0...','0abcc0000e00e0000ccba0...','.0aa0....0aa0....0aa0....','..00......00......00.....'],0,3);
    d.anchorX=14;d.anchorY=16;return d;
  }
  if(kind==='cursed-book'){
    const d=drawing(24,24,p),{stamp}=d;
    stamp(['....000000000000....','...0rccccccccrrr0...','..0rcccGGGGccrrr0...','..0rcccGccGccrrr0...','..0rcccGGGGccrrr0...','..0rcccccccccrrr0...','..0rccce00e0crrr0...','..0rcccccccccrrr0...','..0rrrrrrrrrrrrr0...','...0wwwwwwwwwww0....','....00000000000.....'],1,5+(frame%2));d.anchorX=12;d.anchorY=20;return d;
  }
  const d=drawing(22,30,p),{stamp,rect}=d;
  stamp(['....00000000....','...0hsggggsh0...','..0hsgGGggssh0..','..0hsgggggssh0..','..0h0000000sh0..','..0hGe00eGGsh0..','...0hggggssh0...','....00000000....','...0hsggggsh0...','..0sgGGggggsh0..','.0sgggGGggggsh0.','0hsgggggggggssh0','0hsgggggggggssh0','.00hsggggssh00..','...0hssssssh0...','...0000000000...','....0hss0hss0...','....0hgs0hgs0...','...0hgss0hgss0..','...00000000000..'],3,7);
  rect(18,pose==='windup'?3:13,2,11,'G');rect(17,pose==='windup'?13:23,4,1,'0');
  d.anchorX=11;d.anchorY=28;return direction==='left'?mirror(d):d;
}

/** Pure pixels are exposed for deterministic canvas-free inspection and tests. */
export function actorPixels(kind='harry',{direction='down',frame=0,pose='idle'}={}){
  direction=['up','down','left','right'].includes(direction)?direction:'down';
  frame=Math.abs(Math.trunc(frame))%3;
  const picture=kind==='troll'?troll(direction,frame,pose):['spider','bat','armor','cursed-book'].includes(kind)?creature(kind,direction,frame,pose):human(kind,direction,frame,pose);
  return {w:picture.w,h:picture.h,pixels:picture.pixels,anchorX:picture.anchorX??Math.floor(picture.w/2),anchorY:picture.anchorY??picture.h-1};
}

export function createActorSprites(makeCanvas=()=>document.createElement('canvas')){
  const cache=new Map();
  return {
    get(kind='harry',options={}){
      const direction=options.direction||'down',frame=Math.abs(Math.trunc(options.frame||0))%3,pose=options.pose||'idle';
      const key=`${kind}|${direction}|${frame}|${pose}`;
      if(cache.has(key))return cache.get(key);
      const data=actorPixels(kind,{direction,frame,pose});
      const canvas=makeCanvas();canvas.width=data.w;canvas.height=data.h;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      for(let y=0;y<data.h;y++)for(let x=0;x<data.w;x++){const color=data.pixels[y][x];if(color){ctx.fillStyle=color;ctx.fillRect(x,y,1,1);}}
      const sprite={canvas,w:data.w,h:data.h,anchorX:data.anchorX,anchorY:data.anchorY};cache.set(key,sprite);return sprite;
    },
    clear(){cache.clear();},
  };
}
