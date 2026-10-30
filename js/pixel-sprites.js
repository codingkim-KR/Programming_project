// Native 2D pixel drawings. Every mark is an authored integer grid cell;
// no 3D rendering, scaled photographs, filters or interpolated edges are used.
export const ACTOR_PALETTE = Object.freeze({
  ink:'#242238', skin:'#efb77f', skinLight:'#ffe0a4', skinShade:'#bd775d',
  cream:'#fff1bd', gold:'#e7b958', red:'#a84843', blue:'#385d88',
  moss:'#7d9c55', mossLight:'#a7bf6b', mossShade:'#4d6a43',
});

const PEOPLE = {
  bellatrix: {hair:'#201e2c',hairMid:'#403547',hairLight:'#69506a',robe:'#473448',robeLight:'#70516b',robeShade:'#292735',accent:'#9a647a',trim:'#c9a1a3',longHair:true,curlyHair:true,corset:true},
  slughorn: {hair:'#a99573',hairMid:'#d3c3a0',hairLight:'#f1dfb8',robe:'#5b6050',robeLight:'#899373',robeShade:'#39453e',accent:'#b78e56',trim:'#f2d18b',bald:true,moustache:true,waistcoat:true,big:true},
  umbridge: {hair:'#624332',hairMid:'#94684d',hairLight:'#c18d67',robe:'#ad5a7e',robeLight:'#df8ea2',robeShade:'#7a4166',accent:'#eeafba',trim:'#ffdbca',bob:true,bow:true},
  tonks: {hair:'#6e3165',hairMid:'#bc568b',hairLight:'#ed9ab9',robe:'#354853',robeLight:'#587780',robeShade:'#25343e',accent:'#9b667a',trim:'#d4c6a4',spikyHair:true,shortJacket:true},
  luna: {hair:'#b39b60',hairMid:'#d4be83',hairLight:'#f5e6b1',robe:'#4d6283',robeLight:'#8093b0',robeShade:'#33435f',accent:'#a88cc0',trim:'#d3d7cc',longHair:true,earrings:true},
  neville: {hair:'#49382c',hairMid:'#74553b',hairLight:'#a47c50',robe:'#4e594e',robeLight:'#7b8d6b',robeShade:'#303d39',accent:'#b4594d',trim:'#e7bd69',shortHair:true,patched:true},
  draco: {hair:'#a5a386',hairMid:'#d5cfb0',hairLight:'#f3e9ce',robe:'#263d41',robeLight:'#496265',robeShade:'#192c35',accent:'#7f9c82',trim:'#c4cebb',slickHair:true},
  dumbledore: {hair:'#a6b6c0',hairMid:'#cbd8d5',hairLight:'#f0eee1',robe:'#63729d',robeLight:'#94a1be',robeShade:'#424f77',accent:'#a999c2',trim:'#e8d4a0',longHair:true,longBeard:true,glasses:true,cap:true},
  'duelist-elite': {hair:'#212738',hairMid:'#3f4c64',hairLight:'#65788f',skin:'#b8bfbc',skinLight:'#e0e4d4',skinShade:'#81959c',robe:'#354660',robeLight:'#617693',robeShade:'#233046',accent:'#967884',trim:'#d6bb84',mask:true,hood:true,shoulders:true},
  lupin: {hair:'#625245',hairMid:'#8f7a61',hairLight:'#b6a088',robe:'#615d48',robeLight:'#8d8b65',robeShade:'#3f453d',accent:'#a38965',trim:'#c4b28b'},
  sirius: {hair:'#34313b',hairMid:'#55515d',hairLight:'#837b81',robe:'#4d5263',robeLight:'#767d8c',robeShade:'#313744',accent:'#8c6f72',trim:'#b5b5ab',longHair:true,beard:true},
  pettigrew: {hair:'#696151',hairMid:'#8f8370',hairLight:'#b0a38c',robe:'#74644e',robeLight:'#a49168',robeShade:'#493f38',accent:'#8c695a',trim:'#b4a17e'},
  moody: {hair:'#665c52',hairMid:'#9e9076',hairLight:'#c4b494',robe:'#696547',robeLight:'#929260',robeShade:'#424638',accent:'#86694f',trim:'#b8aa72',magicEye:true},
  cedric: {hair:'#483529',hairMid:'#755441',hairLight:'#ad8051',robe:'#514c42',robeLight:'#7e7661',robeShade:'#333434',accent:'#d5ae50',trim:'#f0d48b'},
  fleur: {hair:'#ad9a72',hairMid:'#d4c594',hairLight:'#f6e4b7',robe:'#5186a0',robeLight:'#87bdce',robeShade:'#345b78',accent:'#b6d4dc',trim:'#e4ead5',longHair:true,hat:true},
  krum: {hair:'#292c32',hairMid:'#45434a',hairLight:'#69636b',robe:'#793a3c',robeLight:'#a96051',robeShade:'#492f36',accent:'#b78159',trim:'#dfbb75'},
  voldemort: {hair:'#bbd0ba',hairMid:'#d9dfc7',hairLight:'#edf0d7',skin:'#c5d1bc',skinLight:'#e8e9ce',skinShade:'#91aa9e',robe:'#253d3b',robeLight:'#43605b',robeShade:'#1c2b31',accent:'#4c7165',trim:'#98b397',bald:true},
  'death-eater': {hair:'#252c3b',hairMid:'#3a4557',hairLight:'#57677b',skin:'#adb7b5',skinLight:'#dde3d1',skinShade:'#788d98',robe:'#303548',robeLight:'#4f5971',robeShade:'#1d2536',accent:'#6b7189',trim:'#a2abb7',mask:true},

  malfoy: {hair:'#9a976e',hairMid:'#c9c39a',hairLight:'#f0e5b8',robe:'#34594f',robeLight:'#5b8270',robeShade:'#243e3c',accent:'#b0b9a6',trim:'#d2d4b3'},
  ginny: {hair:'#77362d',hairMid:'#bd5e37',hairLight:'#eea45e',robe:'#3e4c6a',robeLight:'#637c9b',robeShade:'#28344b',accent:'#b34d48',trim:'#e5bd67',longHair:true},
  molly: {hair:'#743d31',hairMid:'#a86742',hairLight:'#d9945b',robe:'#846348',robeLight:'#b08a61',robeShade:'#584638',accent:'#c3915d',trim:'#e5bd7a',apron:true},
  arthur: {hair:'#8c5037',hairMid:'#bb7850',hairLight:'#dca36b',robe:'#55745c',robeLight:'#86a076',robeShade:'#365344',accent:'#b88a56',trim:'#dac18b',glasses:true},
  lockhart: {hair:'#a17b39',hairMid:'#d0aa54',hairLight:'#f0d57a',robe:'#735b9a',robeLight:'#a48ac4',robeShade:'#4c4074',accent:'#d0a75c',trim:'#f4d986'},
  myrtle: {hair:'#506e87',hairMid:'#789db0',hairLight:'#acced5',robe:'#608a9b',robeLight:'#9bc6cb',robeShade:'#43697e',accent:'#c5dedc',trim:'#e0ede0',skin:'#b0d3d5',skinLight:'#daeeE3',skinShade:'#7daab9',longHair:true,glasses:true},
  riddle: {hair:'#282a38',hairMid:'#424454',hairLight:'#656776',robe:'#354a48',robeLight:'#59756c',robeShade:'#243738',accent:'#82a293',trim:'#c2c7a5'},
  duelist: {hair:'#403543',hairMid:'#6e5362',hairLight:'#a17479',robe:'#4f5274',robeLight:'#777fa0',robeShade:'#323952',accent:'#a55c69',trim:'#d9c087'},
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
  '벨라트릭스':'bellatrix','슬러그혼':'slughorn','엄브리지':'umbridge','통스':'tonks','루나':'luna','네빌':'neville','드레이코':'draco','덤블도어':'dumbledore','크리처':'kreacher','세스트랄':'thestral','테스트랄':'thestral','인페리':'inferius','돌 수호상':'stone-guardian',
  '루핀':'lupin','시리우스':'sirius','페티그루':'pettigrew','무디':'moody','세드릭':'cedric','플뢰르':'fleur','크룸':'krum','벅빅':'buckbeak','볼드모트':'voldemort',
  '말포이':'malfoy','도비':'dobby','지니':'ginny','몰리':'molly','아서':'arthur','록하트':'lockhart','로크하트':'lockhart','머틀':'myrtle','톰 리들':'riddle','톰리들':'riddle',
  '해리':'harry','론':'ron','헤르미온느':'hermione','하그리드':'hagrid','플리트윅':'flitwick',
  '맥고나걸':'mcgonagall','스네이프':'snape','스프라우트':'sprout','후치':'hooch',
  '올리밴더':'ollivander','서점':'bookseller','약재상':'apothecary','수리공':'repairer',
  '관리인':'filch','필치':'filch','퀴렐':'quirrell','간식':'trolley_witch',
});
export function actorKind(entity={}) {
  if((entity.name||'').includes('아라고그'))return 'aragog';
  if(['tree','whomping-willow'].includes(entity.kind))return 'tree';
  if(entity.type==='player'||entity.id==='player')return 'harry';
  if(Object.hasOwn(PEOPLE,entity.kind))return entity.kind;
  if(['troll','spider','bat','armor','cursed-book','pixie','venom-spider','duelist','serpent','basilisk','dobby','aragog','dementor','boggart','dragon','voldemort','death-eater','grindylow','wolf','buckbeak','kreacher','thestral','inferius','stone-guardian'].includes(entity.kind))return entity.kind;
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
    s:style.skin||ACTOR_PALETTE.skin,S:style.skinLight||ACTOR_PALETTE.skinLight,d:style.skinShade||ACTOR_PALETTE.skinShade,
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
  if(style.bald){
    if(back){stamp(['...000000...','..0dSSSSd0..','.0dSSSSSSd0.','0dSSSSSSSSd0','0dSSSSSSSSd0','.0dSSSSSSd0.','..0dddddd0..'],4,y);}
    else if(side){stamp(['..000000..','.0dSSSSd0.','0dSSSSSSd0','0dSSSSSSd0','0dSSSSSSd0'],4,y);}
    else{stamp(['...000000...','..0dSSSSd0..','.0dSSSSSSd0.','0dSSSSSSSSd0','0dSSSSSSSSd0'],4,y);dot(9,9+y,'0');dot(11,9+y,'0');}
  }
  if(style.mask&&!back){
    stamp(['.0000000.','0dSSSSSd0','0S00S00S0','0SSSdSSS0','.0S000S0.','..0SSS0..','...000...'],6,5+y);
  }
  if(style.magicEye&&!back){rect(side?12:6,6+y,3,3,'0');dot(side?13:7,7+y,'w');dot(side?13:7,6+y,'R');}
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
  // Later-year cast is identified by silhouettes as well as costume colours.
  if(style.curlyHair){
    stamp(['.00.000.00.','0hH0HHH0Hh0','0HHHHHHHHH0','.0HHHHHHH0.'],4,y-1);
    stamp(['.00.','0Hh0','0HH0','.0H0','0Hh0','.00.'],2,8+y);stamp(['.00.','0hH0','0HH0','0H0.','0hH0','.00.'],14,8+y);
    if(!back){rect(8,18+bounce,5,5,'b');dot(9,18+bounce,'g');dot(11,20+bounce,'g');dot(9,22+bounce,'g');}
  }
  if(style.bob){stamp(['.0000','0hHH0','0HHh0','00000'],3,8+y);stamp(['0000.','0HHh0','0hHH0','00000'],13,8+y);}
  if(style.bow){stamp(['00..00','0a00a0','0agaa0','00..00'],11,y);if(!back){rect(6,14+bounce,8,2,'g');rect(6,15+bounce,2,3,'a');rect(12,15+bounce,2,3,'a');}}
  if(style.spikyHair){stamp(['...0...0....','.00H0.0H00..','0hHHH0HHHJ0.','.0HHJJHHHh0.','0hHHHHHHHh0.'],3,y-1);}
  if(style.shortHair){rect(6,y+2,8,2,'h');rect(6,y+2,7,1,'H');if(!back)dot(8,y+6,'J');}
  if(style.slickHair){
    stamp(['...000000...','..0JJJJJJ0..','.0HHJJJJHh0.','0hHHHHHHHhh0'],4,y);if(!back){rect(side?7:11,y+4,3,1,'h');rect(9,16+bounce,3,6,'a');}
  }
  if(style.earrings&&!back){rect(4,y+10,1,4,'g');dot(4,y+14,'a');if(!side){rect(15,y+10,1,4,'g');dot(15,y+14,'a');}dot(9,18+bounce,'g');}
  if(style.moustache&&!back){stamp(side?['.HHHH.','HHhHh0']:['.HHHHHH.','HHHhhHHH'],side?8:6,9+y);}
  if(style.waistcoat&&!back){rect(7,16+bounce,7,7,'a');rect(8,17+bounce,2,5,'g');for(const py of [18,20,22])dot(11,py+bounce,'0');}
  if(style.shortJacket){rect(5,22+bounce,10,2,'0');rect(6,23+bounce,3,2,'b');rect(12,23+bounce,3,2,'b');if(!back){rect(5,16+bounce,3,2,'g');dot(13,19+bounce,'g');}}
  if(style.patched){rect(12,20+bounce,3,3,'a');dot(13,21+bounce,'g');if(!back){rect(7,16+bounce,2,6,'a');rect(7,19+bounce,2,1,'g');}}
  if(style.longBeard&&!back){stamp(side?['.0JHH0.','0JJJHh0','.0JJHh0','.0JHH0.','..0HH0.','..0J0..','...0...']:['0HHJJJHH0','0HJJJJJH0','.0HJJJH0.','.0HJJH0..','..0JJH0..','...0H0...','....0....'],side?9:6,10+y);}
  if(style.cap){stamp(['...000000...','..0RRRrrb0..','.0RRRrrrbb0.','0RRRrrrbbb00','00gggggggg00'],4,0);dot(10,1,'g');}
  if(style.hood){stamp(['....000000....','...0bRRRRb0...','..0bRrrrrRb0..','.0bRrrrrrrRb0.','0bRr000000rRb0','0br0......0rb0','0br0......0rb0'],3,0);}
  if(style.shoulders){stamp(['.00000.','0gRRRb0','0Rrrrb0','.00000.'],1,13+bounce);stamp(['.00000.','0RRRbg0','0rrrbR0','.00000.'],12,13+bounce);}

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

function chapterCreature(kind,direction,frame,pose) {
  const p={0:'#1e2935',a:'#3f6646',b:'#6f9851',c:'#a8be67',d:'#dce398',e:'#f4c960',r:'#bd5154',w:'#fff2c8',s:'#294c41',v:'#8e4f99',V:'#ca8dce',B:'#427ea5',C:'#83c1d2',D:'#c6e8e3',h:'#966c51',H:'#d7aa76'};
  const large=kind==='basilisk',snake=large||kind==='serpent';
  if(snake){
    const d=drawing(large?88:38,large?70:31,p),{rect,dot,stamp}=d;
    const ellipse=(cx,cy,rx,ry,key)=>{for(let yy=-ry;yy<=ry;yy++){const x=Math.floor(rx*Math.sqrt(Math.max(0,1-(yy/ry)**2)));rect(cx-x,cy+yy,x*2+1,1,key);}};
    const coil=(cx,cy,rx,ry,thickness)=>{ellipse(cx,cy,rx,ry,'0');ellipse(cx,cy-1,rx-1,ry-1,'a');ellipse(cx,cy-2,rx-2,ry-2,'b');ellipse(cx-1,cy-3,rx-4,ry-3,'c');ellipse(cx,cy-2,Math.max(1,rx-thickness),Math.max(1,ry-thickness),'0');};
    if(large){
      // A broad curled body, raised neck and toothed jaw; never a scaled human.
      coil(43,52,39,14,9);coil(40,43,30,13,9);
      for(let i=0;i<7;i++){const x=13+i*9;rect(x,54+(i%2),3,2,'a');rect(x+1,53+(i%2),1,1,'d');}
      for(let y=20;y<=51;y++){const cx=48-Math.round(((y-20)/31)**2*9);rect(cx-9,y,19,1,'0');rect(cx-8,y,17,1,'a');rect(cx-7,y,13,1,'b');rect(cx-6,y,5,1,'c');rect(cx-3,y,7,1,y%4===0?'a':'d');}
      const raise=['attack','windup','cast'].includes(pose),hy=raise?1:5+(frame%2);
      stamp([
        '........000000000000........',
        '.....000aabbbbbbbbaa000.....',
        '...00abbccccccccccbbbaa00...',
        '..0abbccccddccddccccbbaa0...',
        '.0abbcccccccccccccccbbaaa0..',
        '0abbbccc000cccc000ccbbbaaa0.',
        '0abbcccew00cccc00weccbbbaa0.',
        '0abbccccccccccccccccbbbaa0.',
        '.0abbcccccdddddccccbbbaa0..',
        '..0abbccccdddcccccbbbaa0...',
        '...0abbbccccccccbbbbaa0....',
        '....0a000000000000aa0.....',
      ],34,hy);
      if(raise){for(let y=0;y<13;y++){const half=10-Math.floor(y/4);rect(49-half,hy+12+y,half*2,1,'0');if(y<11)rect(51-half,hy+13+y,half*2-4,1,'r');}rect(42,hy+12,3,7,'w');rect(43,hy+19,1,2,'w');rect(53,hy+12,3,7,'w');rect(54,hy+19,1,2,'w');rect(47,hy+20,4,3,'v');}
      else{rect(40,hy+12,18,5,'0');rect(42,hy+12,2,4,'w');rect(54,hy+12,2,4,'w');rect(45,hy+15,7,2,'c');}
      if(direction==='up'){rect(39,hy+6,19,5,'b');rect(41,hy+7,8,2,'c');}
      if(pose==='hit'){dot(32,hy+2,'w');dot(63,hy+6,'w');dot(62,hy+5,'w');}
      d.anchorX=44;d.anchorY=48;return direction==='left'?mirror(d):d;
    }
    coil(18,22,16,6,5);rect(18,9,9,15,'0');rect(19,9,7,14,'b');rect(20,10,3,12,'d');
    stamp(['...00000000...','.00abbccbaa00.','0abbccccccbba0','0abbe0cc0ebba0','0abccccccccba0','.0abccddccba0.','..0a00000aa0..','...0w0r0w0....','....00000.....'],15,2+(frame%2));
    if(['attack','windup'].includes(pose)){rect(21,10,2,5,'r');rect(20,14,1,2,'r');rect(23,14,1,2,'r');}
    if(direction==='up'){rect(18,6,10,4,'b');rect(19,6,5,1,'c');}
    d.anchorX=19;d.anchorY=26;return direction==='left'?mirror(d):d;
  }
  if(kind==='pixie'){
    const d=drawing(30,30,p),{stamp,rect}=d,flap=frame%2;
    stamp(flap?['..0000..........0000..','.0DCCB0........0BCCD0.','0DDCCBB0......0BBCCDD0','0DDDCCBB0....0BBCCDDD0','.0DDDCCB000000BCCDDD0.','..000CCBBBBBBBBCC000..','.....000000000000.....']:['......................','......................','..00000........00000..','.0DCCCBB000000BBCCCD0.','0DDCCCCBBBBBBBBCCCCDD0','.0DDDCCBB0000BBCCDDD0.','..00000........00000..'],4,7);
    stamp(['...000000...','..0BCCCB0...','00BCCCCCBB00','0CB0eCCe0BC0','.0BCCCCCBB0.','..0BBrrBB0..','...0BBB0....','..0BCCCBB0..','.0BBCCBBBC0.','0CB0CCB0BCB0','.000BB00000.','...0BB0.....','..0B00B0....','.0B0..0B0...','..00..00....'],9,6+(flap?1:0));
    if(pose==='attack'||pose==='cast'){rect(24,13,2,7,'e');rect(22,15,6,2,'w');}
    d.anchorX=15;d.anchorY=25;return direction==='left'?mirror(d):d;
  }
  if(kind==='dobby'){
    const d=drawing(28,29,p),{stamp,rect}=d;
    stamp(['...00000000...','..0HHHHHHHH0..','00HHHHHHHHHH00','0HH0w0HH0w0HH0','.0HHHHHHHHHH0.','..0HHHhhHHH0..','...0HHHHHH0...','....0HhhH0....','.....0000.....'],7,4);
    stamp(['0000....','0HHH00..','.0HHHH00','..0HHHH0','...0000.'],0,5);
    stamp(['....0000','..00HHH0','00HHHH0.','0HHHH0..','.0000...'],20,5);
    stamp(['...000000...','..0DDDDDD0..','.0H0DDDD0H0.','0HH0DDDD0HH0','.000DDDD000.','...0DDDD0...','..0DDDDDD0..','...000000...','...0H00H0...','..0HH00HH0..','..00000000..'],8,15);
    if(pose==='cast'||pose==='talk'){rect(2,17,4,2,'H');rect(4,15,2,3,'H');}
    d.anchorX=14;d.anchorY=27;return direction==='left'?mirror(d):d;
  }
  if(kind==='aragog'){
    const base=creature('spider',direction,frame,pose),d=drawing(56,40,p);
    for(let y=0;y<base.h;y++)for(let x=0;x<base.w;x++){const c=base.pixels[y][x];if(!c)continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)d.pixels[y*2+yy][x*2+xx]=c;}
    d.anchorX=28;d.anchorY=34;return d;
  }
  // Venom spiders retain the same collision footprint but vivid green glands.
  const base=creature('spider',direction,frame,pose);
  const colors={'#684a63':'#324c4c','#997186':'#4d7470','#c3949c':'#779e77','#efb36c':'#dae983'};
  base.pixels=base.pixels.map(row=>row.map(c=>colors[c]||c));
  for(const [x,y]of[[11,7],[16,7],[10,8],[17,8]])if(base.pixels[y]?.[x])base.pixels[y][x]='#c2db64';
  return base;
}

function attackingWillow(direction,frame,pose){
  const p={o:'#203437',b:'#594a3d',m:'#806445',l:'#b18c59',s:'#374c3d',g:'#526b44',G:'#7d9255',h:'#a5af70',e:'#dfc576'};
  const art=drawing(80,66,p),{rect,dot}=art;
  const line=(x0,y0,x1,y1,c,width=1)=>{const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;for(;;){rect(x0,y0,width,width,c);if(x0===x1&&y0===y1)break;const twice=2*err;if(twice>=dy){err+=dy;x0+=sx;}if(twice<=dx){err+=dx;y0+=sy;}}};
  const ellipse=(cx,cy,rx,ry,c)=>{for(let y=-ry;y<=ry;y++){const x=Math.floor(rx*Math.sqrt(Math.max(0,1-(y/ry)**2)));rect(cx-x,cy+y,x*2+1,1,c);}};
  const raised=['attack','windup','cast'].includes(pose),sway=frame%2;
  // Root fans and a knotted, split trunk keep the hostile tree visibly grounded.
  for(const [x,y]of[[18,62],[26,63],[55,62],[63,60]]){line(38,47,x,y,'o',5);line(39,47,x+1,y,'m',3);line(40,49,x+2,y-1,'l');}
  for(let y=23;y<60;y++){const inset=y<36?Math.floor((36-y)/3):0;rect(29+inset,y,23-inset,1,'o');rect(31+inset,y,19-inset,1,'b');rect(33+inset,y,7,1,'m');rect(34+inset,y,2,1,'l');}
  const branches=raised?[[31,35,13,18,4,4],[47,34,62,16,73,4]]:[[31,35,16,37,3,31],[47,34,61,39,73,30]];
  for(const [x,y,mx,my,ex,ey]of branches){line(x,y,mx,my,'o',7);line(mx,my,ex,ey,'o',5);line(x+1,y,mx+1,my,'m',4);line(mx+1,my,ex+1,ey,'l',2);line(mx,my,mx-4,my-9,'b',3);}
  // Crown clusters and falling fronds, with deliberate gaps around the arms.
  for(const [x,y,rx,ry]of[[23,14,13,8],[40,10,18,9],[58,15,14,9],[35,20,20,9]]){
    ellipse(x,y,rx,ry,'o');ellipse(x,y-1,rx-1,ry-1,'s');ellipse(x-2,y-2,rx-3,ry-3,'g');rect(x-5,y-ry+1,7,2,'G');
  }
  for(const [x,y,len]of[[13,15,20],[20,18,19],[27,20,13],[50,20,13],[58,19,19],[67,17,20]]){
    const dx=x<40?-sway:sway;line(x,y,x+dx,y+len,'s',2);line(x+1,y,x+1+dx,y+len-2,'g');
    for(let yy=y+4;yy<y+len;yy+=5){rect(x-1+dx,yy,3,2,'G');dot(x+2+dx,yy-1,'h');}
  }
  // Eye-shaped knots and a dark split are bark, without a humanoid face outline.
  rect(34,33,5,3,'o');rect(44,32,5,3,'o');dot(36,34,'e');dot(46,33,'e');
  line(41,39,38,43,'o',2);line(38,43,42,48,'o',2);line(45,49,43,57,'b');
  if(direction==='up'){rect(34,32,15,7,'b');line(38,33,37,39,'m');}
  if(pose==='hit'){dot(28,26,'e');dot(29,25,'e');dot(51,30,'h');}
  art.anchorX=40;art.anchorY=61;return direction==='left'?mirror(art):art;
}

function laterCreature(kind,direction,frame,pose){
  const p={o:'#182a35',s:'#2d4552',m:'#526877',l:'#87999b',w:'#dae7d9',a:'#2a705f',b:'#52a581',c:'#a6d4a0',e:'#e6c477',r:'#9c4c3c',R:'#ca7140',g:'#efad57',d:'#633c39',B:'#667b96',f:'#a8c8da'};
  const large=kind==='dragon',hippo=kind==='buckbeak',wolf=kind==='wolf';
  const art=drawing(large?90:hippo?60:wolf?44:kind==='dementor'?32:34,large?66:hippo?46:wolf?30:kind==='dementor'?42:36,p);
  const {rect,dot,stamp}=art;
  const ellipse=(cx,cy,rx,ry,c)=>{for(let y=-ry;y<=ry;y++){const x=Math.floor(rx*Math.sqrt(Math.max(0,1-(y/ry)**2)));rect(cx-x,cy+y,x*2+1,1,c);}};
  const line=(x0,y0,x1,y1,c,width=1)=>{const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;for(;;){rect(x0,y0,width,width,c);if(x0===x1&&y0===y1)break;const twice=2*err;if(twice>=dy){err+=dy;x0+=sx;}if(twice<=dx){err+=dx;y0+=sy;}}};
  const triangle=(ax,ay,bx,by,cx,cy,c)=>{
    const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(!area)return;
    for(let y=Math.min(ay,by,cy);y<=Math.max(ay,by,cy);y++)for(let x=Math.min(ax,bx,cx);x<=Math.max(ax,bx,cx);x++){
      const e0=(bx-ax)*(y-ay)-(by-ay)*(x-ax),e1=(cx-bx)*(y-by)-(cy-by)*(x-bx),e2=(ax-cx)*(y-cy)-(ay-cy)*(x-cx);
      if(area>0?e0>=0&&e1>=0&&e2>=0:e0<=0&&e1<=0&&e2<=0)dot(x,y,c);
    }
  };
  const attack=['cast','attack','windup'].includes(pose),step=['walk','run'].includes(pose)?frame%3-1:0;
  if(kind==='dementor'){
    const lift=frame%2;
    // Empty hood and articulated bony hands, with a deliberately torn lower edge.
    for(let y=5;y<37;y++){const half=Math.min(14,5+Math.floor((y-5)/3));rect(16-half,y-lift,half*2+1,1,'o');rect(17-half,y-lift,half*2-2,1,'s');}
    ellipse(16,10-lift,8,9,'o');ellipse(16,10-lift,6,7,'m');ellipse(16,11-lift,4,6,'o');
    for(let x=5;x<28;x+=5){line(x,25-lift,x-2+(frame%2),39-lift,'s',2);line(x+2,22-lift,x+1,36-lift,'m');}
    line(8,17-lift,attack?2:5,attack?12:25,'o',3);line(23,17-lift,attack?28:27,attack?12:25,'o',3);
    for(let i=0;i<3;i++){line(attack?2:4,attack?12+i:25+i,attack?0:2,attack?9+i:29+i,'l');line(attack?28:27,attack?12+i:25+i,attack?31:30,attack?9+i:29+i,'l');}
    if(direction==='up'){ellipse(16,10-lift,6,7,'s');line(14,5-lift,12,14-lift,'m');}
    art.anchorX=16;art.anchorY=38;
  }else if(kind==='dragon'){
    // Original 90x66 horned dragon: vast angular wings, long tail and clawed feet.
    const wingY=attack?1:7+(frame%2)*2;
    for(const mirrorWing of[false,true]){
      const sx=x=>mirrorWing?89-x:x;
      triangle(sx(41),39,sx(8),wingY,sx(0),36,'o');
      triangle(sx(39),36,sx(9),wingY+3,sx(3),33,'d');
      triangle(sx(36),34,sx(10),wingY+6,sx(7),27,'r');
      triangle(sx(40),39,sx(1),35,sx(18),48,'o');
      triangle(sx(38),38,sx(5),36,sx(18),44,'R');
      line(sx(10),wingY+3,sx(39),38,'g');line(sx(9),wingY+4,sx(15),38,'R');
    }
    line(37,49,17,56,'o',5);line(17,56,6,49,'o',4);line(38,49,17,56,'r',3);line(17,56,7,50,'R',2);
    ellipse(46,43,16,16,'o');ellipse(46,42,14,14,'r');ellipse(43,41,10,13,'R');ellipse(43,43,6,10,'g');
    for(const x of[34,53]){line(x,48,x+(x<45?-4:4),59-step,'o',6);rect(x-6,58-step,13,5,'o');rect(x-5,58-step,11,3,'R');for(let c=0;c<3;c++)rect(x-5+c*4,61-step,2,2,'w');}
    const hy=attack?5:9;
    line(44,35,50,hy+13,'o',13);line(45,34,51,hy+13,'r',10);line(46,33,52,hy+13,'g',4);
    triangle(42,hy+7,39,hy-5,48,hy+3,'o');triangle(42,hy+5,41,hy-2,46,hy+3,'w');
    triangle(59,hy+6,63,hy-5,55,hy+3,'o');triangle(59,hy+4,61,hy-2,57,hy+3,'w');
    ellipse(51,hy+9,12,10,'o');ellipse(51,hy+9,10,8,'R');rect(40,hy+12,22,7,'o');rect(41,hy+12,20,4,'r');
    rect(43,hy+8,5,3,'o');rect(55,hy+8,5,3,'o');dot(45,hy+9,'e');dot(57,hy+9,'e');
    rect(45,hy+14,2,4,'w');rect(56,hy+14,2,4,'w');rect(49,hy+12,5,2,'d');
    if(attack){rect(47,hy+18,10,7,'o');triangle(49,hy+20,54,hy+20,53,hy+28,'g');dot(53,hy+25,'e');}
    for(let y=32;y<52;y+=5){dot(52,y,'g');dot(55,y+2,'d');dot(48,y+1,'e');}
    if(direction==='up'){rect(43,hy+7,17,7,'r');rect(47,hy+6,5,2,'R');}
    art.anchorX=45;art.anchorY=57;
  }else if(kind==='wolf'||kind==='buckbeak'){
    const q=hippo?1:0,cx=hippo?30:22,cy=hippo?31:18;
    const body=hippo?'B':'m',light=hippo?'f':'l';
    ellipse(cx,cy,hippo?17:14,hippo?9:7,'o');ellipse(cx,cy-1,hippo?15:12,hippo?7:5,body);
    line(cx+11,cy,cx+19,cy-6,'o',4);line(cx+11,cy-1,cx+18,cy-7,body,3);
    for(const [x,delta]of[[cx-10,step],[cx-3,-step],[cx+7,step],[cx+13,-step]]){rect(x,cy+3,4,hippo?9:7,'o');rect(x+1,cy+3,2,hippo?8:6,light);rect(x-1,cy+(hippo?11:9)+delta,5,2,hippo?'e':'o');}
    if(hippo){
      triangle(25,31,30,3+(frame%2)*2,48,27,'o');triangle(27,29,31,7+(frame%2)*2,44,26,'B');
      for(let i=0;i<5;i++)line(30,12+i*3,42-i,25+i,'f');
      ellipse(13,22,8,11,'o');ellipse(13,21,6,9,'w');triangle(7,22,0,25,8,29,'e');dot(10,20,'o');dot(11,19,'e');
      line(13,13,16,7,'o',2);line(14,13,17,8,'w');
    }else{
      ellipse(12,12,9,8,'o');ellipse(12,12,7,6,'l');triangle(5,8,6,1,12,7,'o');triangle(13,7,18,0,19,10,'o');
      triangle(7,8,7,4,10,7,'m');triangle(15,7,17,3,17,9,'m');
      rect(1,13,10,6,'o');rect(2,13,9,4,'l');dot(1,14,'o');rect(7,10,2,2,'e');rect(14,10,2,2,'e');
      if(attack){rect(3,18,9,3,'o');rect(5,18,2,2,'w');rect(10,18,2,2,'w');}
      if(direction==='up')rect(5,10,14,6,'m');
    }
    art.anchorX=hippo?30:22;art.anchorY=hippo?42:27;
  }else if(kind==='grindylow'){
    const bob=frame%2;
    // Wide fingers and green sucker limbs remain readable against teal water.
    for(const [x,end]of[[10,1],[22,31]]){line(x,20,end,15+bob,'o',4);line(x,19,end,14+bob,'b',2);for(let i=0;i<3;i++)line(end,14+bob,end+(end<10?i:-i),8+i*2,'c');}
    ellipse(16,22,7,8,'o');ellipse(16,21,5,7,'a');ellipse(16,11+bob,10,9,'o');ellipse(16,11+bob,8,7,'b');
    triangle(8,7+bob,7,1,13,5+bob,'c');triangle(22,7+bob,25,1,18,5+bob,'c');
    rect(10,10+bob,4,3,'e');rect(20,10+bob,4,3,'e');dot(12,11+bob,'o');dot(21,11+bob,'o');rect(13,16+bob,8,2,'o');
    for(const [x,ex]of[[12,5],[17,18],[20,29]]){line(x,25,ex,31+bob,'o',3);line(x,25,ex,30+bob,'b');}
    if(direction==='up')ellipse(16,11+bob,7,6,'a');
    art.anchorX=17;art.anchorY=32;
  }else{
    // The classroom fear is a smoky, asymmetric figure with a comic second pose.
    for(let y=10;y<33;y++){const half=5+Math.floor((y-10)/4),shift=Math.round(Math.sin((y+frame*4)/5)*2);rect(17-half+shift,y,half*2,1,'o');rect(18-half+shift,y,half*2-2,1,'s');}
    ellipse(17,10,9,8,'o');ellipse(17,9,7,6,'B');rect(12,9,4,2,'e');rect(20,9,4,2,'e');
    if(pose==='stunned'||pose==='hit'){rect(10,5,16,3,'r');rect(12,2,12,4,'R');rect(14,14,9,2,'w');rect(7,31,8,3,'g');rect(21,31,9,3,'g');}
    else{line(10,17,2,22+frame,'s',3);line(23,17,30,22-frame,'s',3);rect(16,14,5,3,'o');}
    art.anchorX=17;art.anchorY=32;
  }
  if(pose==='hit'){dot(2,7,'w');dot(3,6,'w');dot(art.w-3,9,'w');}
  return direction==='left'?mirror(art):art;
}

function finalYearCreature(kind,direction,frame,pose){
  const back=direction==='up',side=direction==='left'||direction==='right';
  const striking=['cast','attack','windup'].includes(pose),walking=['walk','run'].includes(pose);
  const step=walking?(frame%3===1?-2:frame%3===2?2:0):0;
  const p={0:'#222637',s:'#b5b99a',S:'#e1dcc0',d:'#7e8f7e',r:'#697369',R:'#a0a78b',b:'#444f4d',h:'#858c83',H:'#bdc2ae',g:'#d4b778',w:'#edf1d5',a:'#7fc6bd',v:'#394554',V:'#586578'};
  if(kind==='kreacher'){
    const d=drawing(28,32,p),{stamp,rect,dot}=d;
    stamp(['..00000.....00000..','.0brrr0.....0rrrb0.','0000000.....0000000'],4,27);
    stamp(['....00000000....','...0RRRrrrbb0...','..0RRrrrrrbbb0..','.0Rrrrrrrrrrbb0.','.0Rrrrrrrrrrbb0.','0Rrrrrrrrrrrrbb0','0Rrrrrrrrrrrrbb0','.0rrbrrrbrrrbb0.','..00b000b00000..'],6,18);
    stamp(['000..............000','0Sd00..........00dS0','.0SSd00......00dSS0.','..0SSdd000000ddSS0..','...0SddddddddddS0...','....000dddddd000....'],4,6);
    stamp(['...0000000000...','..0dSSSSSSSSd0..','.0dSSSSSSSSSSd0.','0dSSSSddSSSSSSd0','0dSSSSSSSSSSSSd0','0dS0wSSSSSSw0Sd0','.0dSSSddddSSSd0.','..0dSSdSSdSSd0..','...0dSddddSd0...','....0dddddd0....','.....000000.....'],6,5);
    if(back){rect(8,10,13,8,'d');rect(9,10,11,5,'s');rect(10,8,9,2,'S');}
    else{rect(side?17:13,13,2,6,'d');dot(side?18:14,13,'S');stamp(['.000.','0ddd0','.000.'],12,18);}
    stamp(['.0H0.','0Hh0.','.00..'],12,3);
    rect(8,23,12,1,'b');rect(10,25,2,2,'R');rect(17,20,2,3,'b');
    for(const [x,dy] of [[4,step],[23,-step]]){rect(x,20+dy,2,6,'0');rect(x,21+dy,1,4,'s');rect(x-1,25+dy,3,2,'S');}
    if(striking){rect(23,14,2,7,'s');rect(23,12,3,3,'S');dot(24,10,'a');dot(26,12,'w');}
    if(pose==='hit'){dot(2,10,'w');dot(25,8,'w');}
    if(pose==='down'){
      d.pixels.forEach(row=>row.fill(null));stamp(['...00000000.............','000dSSSSSSd000000000....','0SSdSSSddddd0RRrrrrb00...','.000dSSSSdd0Rrrrrrrbb00..','....000000000000000000..'],2,24);
    }
    d.anchorX=14;d.anchorY=30;return direction==='left'?mirror(d):d;
  }
  if(kind==='inferius'){
    const d=drawing(28,34,p),{stamp,rect,dot}=d;
    if(pose==='down'){
      stamp(['...000000.................','..0dSSSSd0000000000000....','00dSS0SSd0SSdSSdSSdSb00...','0dSSSSSdd0ddSSdSSdSbbb000.','.000dddd00000000b0000000..','....00000.....0ddd0.......'],0,26);
      rect(10,29,6,1,'H');dot(5,29,'0');
    }else{
      const lean=striking?1:0;
      stamp(['.0000......0000.','0dSSd0....0dSSd0','0dSdd0....0ddSd0','.0Sd0......0dS0.','.0Sd0......0dS0.','00dd0......0dd00','00000......00000'],6,25);
      if(step){rect(7,31,4,2,'0');rect(17,31,4,2,'0');rect(6,29+step/2,3,3,'d');rect(19,29-step/2,3,3,'d');}
      stamp(['..0000000000..','.0dSSSSSSSSd0.','0dSSSddSSSSSd0','0dSSdSSdSSSSd0','.0dSSddSSSSd0.','..0dSSSSSSd0..','..0brrrbbb0...','.0bbrrrbbbb0..','..0bbb0bbb0...'],7,16);
      for(const y of [18,20,22]){rect(11,y,3,1,'H');rect(16,y,3,1,'d');}rect(14,17,1,7,'d');
      stamp(['..00000000..','.0dSSSSSSd0.','0dSSSSSSSSd0','0dSS0SS0SSd0','0dSS0SS0SSd0','.0dSSddSSd0.','.0dSdSSdSd0.','..0d0000d0..','...0dddd0...','....0000....'],8+lean,6);
      if(back){rect(10,9,8,7,'s');rect(11,9,6,1,'S');rect(11,16,6,2,'d');}
      else{dot(12+lean,10,'a');dot(16+lean,10,'a');rect(13+lean,13,2,1,'0');}
      const reach=striking?7:0;
      stamp(['000','0Sd','0Sd','0Sd','0dd','0Sd','.00'],4,18-reach+step/2);
      stamp(['000','dS0','dS0','dS0','dd0','dS0','00.'],22,18-reach-step/2);
      rect(3,24-reach+step/2,4,2,'d');rect(22,24-reach-step/2,4,2,'d');
      if(striking){rect(2,9,5,2,'S');rect(22,9,5,2,'S');dot(3,8,'d');dot(25,8,'d');}
      if(pose==='hit'){dot(2,15,'w');dot(24,6,'w');}
    }
    d.anchorX=14;d.anchorY=32;return direction==='left'?mirror(d):d;
  }
  if(kind==='stone-guardian'){
    const d=drawing(42,50,p),{stamp,rect,dot}=d;
    // Separate block joints, raised fists and a carved face read at native size.
    rect(10,38,8,10,'0');rect(11,39,6,8,'r');rect(12,39,2,7,'H');
    rect(25,38,8,10,'0');rect(26,39,6,8,'r');rect(27,39,2,7,'H');
    rect(7,46-step/2,12,3,'0');rect(24,46+step/2,12,3,'0');
    rect(18,15,7,7,'0');rect(19,16,5,5,'r');rect(19,16,2,5,'H');
    rect(7,21,7,5,'b');rect(30,21,6,5,'b');rect(8,21,5,2,'R');rect(30,21,5,2,'R');
    rect(16,26,12,4,'b');
    stamp(['...000000000000000000...','..0RRRRRRRRRRrrrrrrrb0..','.0RHHHHHHRRRrrrrrrrrb0.','0RHHHRRRRRRRrrrrrrrrbb0','0RHRRRRRRRRRrrrrrrrrbb0','.0RRRRRRRRRRrrrrrrrbb0.','..0RRRRRRRrrrrrrrrbb0..','...0rrrrrrrrrrrrbb0...'],10,20);
    rect(10,29,23,8,'0');rect(11,30,21,6,'r');rect(12,30,5,5,'R');rect(25,30,6,5,'b');rect(13,36,18,4,'b');
    stamp(['....0000000000....','..00RRRRRRrrrr00..','.0RHHHHHHHrrrrrb0.','0RHHHHHHHrrrrrrbb0','0RHHHHHHHrrrrrrbb0','0RRRRRRRRrrrrrrbb0','.0RR000RR000rrb0..','.0RR0a0RR0a0rrb0..','.0RRRRRrrrrrrrb0..','..0RRRR000rrrr0...','...0RRRRrrrrr0....','....000000000.....'],12,4);
    if(back){rect(15,10,12,9,'r');rect(15,10,4,8,'R');rect(19,10,8,2,'H');}
    else{rect(19,22,5,6,'0');rect(20,23,3,4,'a');dot(21,23,'w');}
    for(const [x,up]of[[3,striking&&frame%2===0],[33,striking&&frame%2!==0]]){
      const y=up?9:25;rect(x,y,8,12,'0');rect(x+1,y+1,6,10,'r');rect(x+1,y+1,2,9,'H');rect(x,y+8,8,1,'b');rect(x+3,y+9,1,2,'R');
      rect(x+1,up?20:19,5,7,'0');rect(x+2,up?21:20,3,5,'R');
    }
    rect(14,5,3,2,'b');rect(17,6,1,4,'b');rect(28,31,1,5,'b');dot(27,35,'0');
    if(pose==='hit'){dot(3,18,'w');dot(38,15,'w');}
    if(pose==='down'){
      d.pixels.forEach(row=>row.fill(null));rect(8,39,24,8,'0');rect(9,40,22,6,'r');rect(11,39,8,2,'H');rect(5,44,8,5,'b');rect(28,43,9,6,'b');rect(16,42,9,2,'R');
    }
    d.anchorX=21;d.anchorY=48;return direction==='left'?mirror(d):d;
  }
  const d=drawing(64,52,p),{stamp,rect,dot}=d;
  const line=(x0,y0,x1,y1,key)=>{const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;for(;;){dot(x0,y0,key);if(x0===x1&&y0===y1)break;const twice=err*2;if(twice>=dy){err+=dy;x0+=sx;}if(twice<=dx){err+=dx;y0+=sy;}}};
  // Thestral: leathery angular wings, narrow neck, horse muzzle and visible ribs.
  const lift=striking?5:walking&&frame===1?2:0;
  stamp(['..............00.........','............00v0.........','..........00vvV0.........','........00vvvVV0.........','......00vvvvVVv0.........','....00vvvvvVVvv0.........','...0vvvvvvVVvvv00........','..0vvvvvvVVvvvvv00.......','.0vvvvvvVVvvvvvvvv00.....','0vvvvvvVVvvvvvvvvvv00....','00000vVVvvvvvvvvvvvvv00..','.....0VVvv0000vvvvvvvv00.','......0V00....0000vvvvv00','.......0..........0000000'],7,9-lift);
  for(const [tx,ty]of[[8,19-lift],[17,18-lift],[28,11-lift]])line(31,29,tx,ty,'H');
  stamp(['....000000000000000000.....','..00vvvvVVVVVVVVvvvvvv00...','.0vvvVVVVVVVVVvvvvvvvvv00..','0vvvVVVVVVVvvvvvvvvvvvvvv0.','0vvVVVVVVvvvvvvvvvvvvvvv0.','.0vvvvvvvvvvvvvvvvvvvvv0..','..00vvvvvvvvvvvvvvvvv00...','....00000000000000000.....'],16,27);
  stamp(['....000000..','...0VVVVVv0.','..0VVVVVVv0.','.0VVVVVVVv0.','0VVVVVVVVv0.','0VVVVVVVVv0.','0VVVVVVVVv0.','.0VVVVVVVv0.','..0VVVVVVv0.','...0VVVVv0..','....000000..'],37,25);
  for(let x=24;x<=38;x+=4){line(x,29,x-1,34,'H');dot(x,28,'V');}
  rect(22,30,21,1,'H');line(43,28,43,33,'H');
  for(const [x,shift]of[[19,step],[28,-step],[40,-step],[45,step]]){
    rect(x,34,3,8,'0');rect(x+1,35,1,6,'H');line(x+1,41,x+shift,47,'V');rect(x+shift-1,47,4,2,'0');
  }
  stamp(['.....000.....','....0VH0.....','...0VVH0.....','..0VVVH0.....','.0VVVVH0.....','0VVVVVH0.....','0VVVVVH0.....','0VVVVVH0.....','0VVVVVH0.....','.0VVVVH0.....','..000000.....'],41,17);
  stamp(['..00....00.......','.0V0...0V0.......','0VV0000VV0.......','0VVVVVVVV00......','0VVVVVVVVVV000...','0VVwVVVVVVVVVV0..','.0VVVVVVVVVVVV0..','..0VVVVVVVV000...','...00000000......'],44,12);
  if(back){rect(47,16,8,5,'v');rect(48,16,3,4,'V');}else dot(side?51:48,17,'w');
  line(18,31,9,36,'V');line(9,36,6,42,'V');stamp(['.00.','0vv0','0vv0','.00.'],4,40);
  if(pose==='hit'){dot(38,20,'w');dot(6,28,'w');}
  if(pose==='down'){
    d.pixels.forEach(row=>row.fill(null));rect(18,42,32,6,'0');rect(20,43,28,4,'v');rect(25,43,15,1,'H');stamp(['.000000.','0VVVVVv0','0VVwVVv0','.000000.'],46,42);line(12,46,24,43,'H');
  }
  d.anchorX=32;d.anchorY=49;return direction==='left'?mirror(d):d;
}

/** Pure pixels are exposed for deterministic canvas-free inspection and tests. */
export function actorPixels(kind='harry',{direction='down',frame=0,pose='idle',variant='normal'}={}){
  direction=['up','down','left','right'].includes(direction)?direction:'down';
  frame=Math.abs(Math.trunc(frame))%3;
  const picture=['kreacher','thestral','inferius','stone-guardian'].includes(kind)?finalYearCreature(kind,direction,frame,pose):['tree','whomping-willow'].includes(kind)?attackingWillow(direction,frame,pose):['dementor','boggart','dragon','grindylow','wolf','buckbeak'].includes(kind)?laterCreature(kind,direction,frame,pose):['pixie','venom-spider','serpent','basilisk','dobby','aragog'].includes(kind)?chapterCreature(kind,direction,frame,pose):kind==='troll'?troll(direction,frame,pose):['spider','bat','armor','cursed-book'].includes(kind)?creature(kind,direction,frame,pose):human(kind,direction,frame,pose);
  if(kind==='basilisk'&&variant==='blind')picture.pixels=picture.pixels.map(row=>row.map(c=>c==='#f4c960'?'#c8d6cb':c));
  return {w:picture.w,h:picture.h,pixels:picture.pixels,anchorX:picture.anchorX??Math.floor(picture.w/2),anchorY:picture.anchorY??picture.h-1};
}

export function createActorSprites(makeCanvas=()=>document.createElement('canvas')){
  const cache=new Map();
  return {
    get(kind='harry',options={}){
      const direction=options.direction||'down',frame=Math.abs(Math.trunc(options.frame||0))%3,pose=options.pose||'idle';
      const variant=options.variant==='blind'?'blind':'normal';
      const key=`${kind}|${direction}|${frame}|${pose}|${variant}`;
      if(cache.has(key))return cache.get(key);
      const data=actorPixels(kind,{direction,frame,pose,variant});
      const canvas=makeCanvas();canvas.width=data.w;canvas.height=data.h;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      for(let y=0;y<data.h;y++)for(let x=0;x<data.w;x++){const color=data.pixels[y][x];if(color){ctx.fillStyle=color;ctx.fillRect(x,y,1,1);}}
      const sprite={canvas,w:data.w,h:data.h,anchorX:data.anchorX,anchorY:data.anchorY};cache.set(key,sprite);return sprite;
    },
    clear(){cache.clear();},
  };
}
