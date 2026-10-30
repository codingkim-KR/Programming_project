/** Hand-authored integer pixel shapes. No 3D projection, texture resizing or filters. */
export const PROP_PALETTE = Object.freeze({
  ink:'#242238', shadow:'#384052', woodDark:'#654335', wood:'#956443', woodLight:'#c78c52',
  goldDark:'#a46e38', gold:'#e7b958', cream:'#fff1bd', paper:'#fff0bf',
  redDark:'#7c3544', red:'#c75452', redLight:'#ee9470',
  greenDark:'#4d6a43', green:'#7d9c55', greenLight:'#a7bf6b',
  blueDark:'#31556b', blue:'#5e9ea6', blueLight:'#a9ddd2',
  violet:'#7963a9', violetLight:'#bea5df', stone:'#788791', stoneLight:'#b1bfbd', white:'#edf0d2',
});
const P=PROP_PALETTE;

function painter(ctx) {
  const r=(x,y,w,h,color)=>{if(w<=0||h<=0)return;ctx.fillStyle=P[color]||color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const frame=(x,y,w,h,fill,border='ink')=>{r(x,y,w,h,border);r(x+1,y+1,w-2,h-2,fill);};
  const line=(x0,y0,x1,y1,color,width=1)=>{
    x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
    const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let err=dx+dy;
    for(;;){r(x0,y0,width,width,color);if(x0===x1&&y0===y1)break;const twice=2*err;if(twice>=dy){err+=dy;x0+=sx;}if(twice<=dx){err+=dx;y0+=sy;}}
  };
  const oval=(cx,cy,rx,ry,color)=>{
    for(let y=-ry;y<=ry;y++){const half=Math.floor(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry))));r(cx-half,cy+y,half*2+1,1,color);}
  };
  const diamond=(cx,cy,rx,ry,color)=>{
    for(let y=-ry;y<=ry;y++){const half=Math.floor(rx*(1-Math.abs(y)/ry));r(cx-half,cy+y,half*2+1,1,color);}
  };
  const sparkle=(x,y,color='cream')=>{r(x,y-2,1,5,color);r(x-2,y,5,1,color);};
  const pattern=(rows,x,y,colors)=>rows.forEach((row,j)=>[...row].forEach((c,i)=>{if(colors[c])r(x+i,y+j,1,1,colors[c]);}));
  return {r,frame,line,oval,diamond,sparkle,pattern};
}

function pedestal(p,x=5,y=23,w=22){
  p.frame(x+3,y,w-6,5,'stone');p.r(x+4,y+1,w-8,1,'stoneLight');
  p.frame(x,y+5,w,5,'stone');p.r(x+1,y+6,w-2,1,'stoneLight');p.r(x+2,y+9,w-4,1,'shadow');
}
function leaf(p,x,y,flip=false,color='green'){
  const d=flip?-1:1;
  p.line(x,y,x+4*d,y-3,'greenDark',2);p.line(x+d,y-1,x+4*d,y-4,color,2);p.r(x+4*d,y-4,2,1,'greenLight');
}
function bottle(p,x,y,color='red',light='redLight'){
  p.frame(x+3,y,4,4,'woodLight');p.frame(x+3,y+4,4,3,'blueLight');
  p.frame(x+1,y+7,8,2,'blueLight');p.frame(x,y+9,10,9,color);
  p.r(x+1,y+9,8,2,light);p.r(x+2,y+10,1,5,'white');p.r(x+1,y+16,8,1,'shadow');
  p.r(x+4,y+12,4,3,'cream');p.r(x+5,y+13,2,1,'goldDark');
}
function feather(p,x,y,raised){
  p.pattern([
    '.....kk..','....kcck.','...kwwck.','..kwwwck.','.kwwcwk..','kwwcwk...','kcwwk....','.kwk.....','..k......',
  ],x,y,{k:'ink',w:'white',c:'blueLight'});
  p.line(x+1,y+10,x+6,y+1,'stoneLight');
  if(raised){p.sparkle(x-2,y+3,'blueLight');p.sparkle(x+10,y+7,'blueLight');}
}

function drawProp(ctx,kind,state,frameIndex,w,h) {
  const p=painter(ctx),{r,frame,line,oval,diamond,sparkle,pattern}=p;
  if(kind==='letter'){
    // Small reading table and a parchment envelope, seal clearly visible.
    frame(3,17,26,10,'woodDark');r(5,25,3,6,'woodDark');r(24,25,3,6,'woodDark');
    frame(1,12,30,11,'wood');r(2,13,28,2,'woodLight');r(3,21,26,1,'woodDark');
    frame(7,8,18,12,'paper');line(8,10,15,15,'goldDark');line(23,10,16,15,'goldDark');
    r(13,14,6,4,'redDark');r(14,13,4,4,'red');r(15,14,2,1,'redLight');
  }else if(kind==='chest'){
    // Leather satchel: rounded flap, strap, brass clasp and sewn edge.
    frame(9,6,10,5,'wood');r(11,7,6,3,'ink');
    frame(4,11,22,15,'woodDark');r(3,14,1,9,'ink');r(26,14,1,9,'ink');
    frame(4,10,22,9,'wood');r(6,11,18,2,'woodLight');r(7,17,16,1,'goldDark');
    r(6,20,2,3,'woodLight');r(22,20,2,3,'woodLight');
    frame(12,14,6,7,'gold');r(14,15,2,3,'woodDark');r(13,20,4,1,'cream');
    r(6,25,18,1,'ink');
  }else if(kind==='herbs'){
    frame(6,20,20,4,'woodLight');frame(8,24,16,8,'redDark');r(9,25,14,2,'red');r(10,29,12,1,'woodDark');
    oval(16,21,8,2,'woodDark');r(9,21,4,1,'wood');r(18,22,4,1,'wood');
    if(state==='harvested'){
      for(const [x,y]of[[12,19],[17,18],[21,20]]){r(x,y,2,4,'greenDark');r(x,y,2,1,'greenLight');}
      r(8,19,3,1,'green');r(24,24,3,1,'green');
    }else{
      for(const [x,y,side]of[[16,8,false],[13,13,true],[19,14,false],[11,16,true],[21,17,false]]){
        line(x,y,x,22,'greenDark',2);leaf(p,x,y+3,side);leaf(p,x,y+6,!side,'greenLight');
      }
      r(15,6,3,2,'greenLight');
    }
  }else if(kind==='machine'){
    frame(2,24,28,7,'woodDark');r(4,25,24,2,'woodLight');
    frame(5,9,4,16,'wood');frame(24,7,4,18,'wood');r(5,7,23,3,'woodDark');r(6,8,21,1,'woodLight');
    if(state==='active'){
      oval(16,18,9,9,'ink');oval(16,18,8,8,'goldDark');oval(16,18,6,6,'gold');oval(16,18,4,4,'woodDark');
      const offsets=frameIndex%2?[[0,-7],[7,0],[0,7],[-7,0]]:[[5,-5],[5,5],[-5,5],[-5,-5]];
      for(const [x,y]of offsets)line(16,18,16+x,18+y,'cream');
      frame(14,16,5,5,'gold');sparkle(27,4,'blueLight');
    }else{
      oval(15,19,8,8,'ink');oval(15,19,7,7,'goldDark');oval(15,19,4,4,'woodDark');
      line(11,11,17,19,'ink',2);line(17,19,13,24,'ink',2);r(20,24,4,3,'gold');r(26,26,3,2,'stone');
      frame(13,17,4,4,'gold');
    }
  }else if(kind==='mirror'){
    frame(3,31,26,6,'goldDark');r(5,32,22,2,'gold');r(4,37,4,2,'ink');r(24,37,4,2,'ink');
    frame(4,7,24,25,'goldDark');frame(6,8,20,22,'gold');frame(8,10,16,18,'blueDark');
    r(9,11,14,16,'blue');r(9,11,4,16,'blueLight');r(9,11,14,2,'blueLight');
    line(12,21,20,13,'white',2);line(15,24,22,17,'blueLight');
    r(8,5,16,3,'ink');r(10,3,12,3,'goldDark');r(12,2,8,3,'gold');r(14,0,4,3,'cream');
    r(5,9,1,21,'cream');r(25,9,1,21,'woodDark');
    if(state==='active')sparkle(20,17,'cream');
  }else if(kind==='ward'){
    pedestal(p,4,25,24);const active=state!=='active';
    diamond(16,14,10,13,'ink');diamond(16,14,8,11,active?'violet':'shadow');
    diamond(14,12,4,7,active?'violetLight':'stone');
    line(16,4,16,23,active?'white':'stoneLight');line(9,14,16,23,active?'blue':'shadow');
    if(active){sparkle(3,9,'violetLight');sparkle(29,19,'violetLight');}
  }else if(kind==='feather'){
    pedestal(p,4,25,24);feather(p,11,state==='active'?5:15,state==='active');
  }else if(kind==='lamp'){
    frame(13,17,5,17,'woodDark');r(14,18,1,15,'goldDark');frame(8,32,15,4,'shadow');
    frame(8,7,15,14,'goldDark');frame(10,9,11,9,state==='active'?'gold':'blueDark');
    r(10,8,11,2,'gold');r(15,9,1,10,'goldDark');r(10,18,11,2,'gold');
    frame(10,4,11,4,'shadow');r(12,2,7,2,'goldDark');r(14,0,3,3,'gold');
    if(state==='active'){r(12,11,3,5,'cream');r(17,12,2,3,'cream');sparkle(4,13,'gold');sparkle(27,9,'cream');}
  }else if(kind==='tracks'){
    const c=state==='active'?'gold':'woodDark';
    for(const [x,y]of[[7,6],[16,11],[8,19],[18,24]]){oval(x,y,2,3,c);r(x-1,y+4,3,2,c);r(x-1,y-1,1,2,state==='active'?'cream':'wood');}
  }else if(kind==='gift'){
    frame(4,15,24,15,'redDark');r(5,16,22,4,'red');r(15,16,3,13,'gold');
    frame(3,12,26,7,'red');r(4,13,24,2,'redLight');r(15,13,3,5,'cream');
    pattern(['..kkkk...kkkk..','.kggggk.kggggk.','kggk.kgkgk.kggk','kggkkgggggkkggk','.kgggggggggggk.','..kkkkgggkkkk..'],8,5,{k:'ink',g:'gold'});
    r(16,10,2,3,'cream');
  }else if(kind==='door'){
    frame(3,3,26,37,'stone');r(4,4,24,3,'stoneLight');
    frame(7,7,18,33,'woodDark');
    if(state==='active'){
      r(8,8,16,31,'ink');frame(8,9,5,29,'wood');r(9,10,1,25,'woodLight');
      r(17,33,7,5,'shadow');
    }else{
      r(8,8,16,31,'wood');r(9,9,2,29,'woodLight');line(15,8,15,38,'woodDark');line(21,8,21,38,'woodDark');
      r(8,17,16,3,'ink');r(9,18,14,1,'stone');frame(17,24,5,7,'gold');r(19,26,1,3,'woodDark');
    }
    for(let y=11;y<36;y+=8){r(4,y,3,1,'shadow');r(25,y+4,3,1,'shadow');}
  }else if(kind==='vines'){
    if(state==='active'){
      for(const [x,y]of[[7,32],[15,28],[24,31],[33,29]]){line(x,y,x+4,y+4,'woodDark',3);r(x+1,y,2,1,'red');}
      r(17,33,3,1,'redLight');r(29,35,2,1,'goldDark');
    }else{
      for(const [x,dx]of[[8,7],[20,-6],[31,4]]){
        line(x,35,x+dx,21,'ink',4);line(x+dx,21,x-2,6,'ink',4);
        line(x+1,34,x+dx+1,21,'greenDark',2);line(x+dx+1,21,x-1,7,'green',2);
        leaf(p,x+dx,21,false);leaf(p,x+dx,18,true);leaf(p,x,10,x<20);leaf(p,x,30,x>20);
      }
      r(17,5,4,2,'greenLight');r(7,17,2,2,'cream');
    }
  }else if(kind==='key'){
    const lift=state==='active'?5:0;
    if(state!=='active'){
      pattern(['..kkkk....','kkwwwwkk..','kwwwwwwwk.','.kkkkwwwk.','.....kkwk.','.......k..'],0,6,{k:'ink',w:'white'});
      pattern(['....kkkk..','..kkwwwwkk','.kwwwwwwwk','.kwwwkkkk.','.kwkk.....','..k.......'],22,6,{k:'ink',w:'white'});
    }
    oval(16,9+lift,6,6,'ink');oval(16,9+lift,5,5,'gold');oval(16,9+lift,2,2,'ink');
    frame(14,14+lift,5,13,'gold');r(17,21+lift,6,3,'gold');r(21,24+lift,2,3,'gold');r(15,15+lift,1,10,'cream');
  }else if(kind==='chess'){
    frame(3,30,26,5,'stone');r(4,31,24,1,'white');frame(6,26,20,5,'stoneLight');
    frame(10,18,12,9,'stoneLight');r(11,19,4,7,'white');frame(7,14,18,5,'stone');
    frame(10,7,12,8,'stoneLight');r(11,8,3,6,'white');frame(14,0,4,10,'cream');frame(10,3,12,4,'cream');
    if(state==='active'){sparkle(3,18,'blueLight');sparkle(29,11,'blueLight');}
  }else if(kind==='crystal'){
    pedestal(p,4,25,24);diamond(16,13,8,11,'ink');diamond(16,13,6,9,'red');
    diamond(14,10,3,5,'redLight');line(16,5,16,21,'cream');line(10,13,16,21,'redDark');
    sparkle(frameIndex?28:3,frameIndex?12:7,'gold');
  }else if(kind==='flight-ring'){
    const c=w>>1,radius=(w-6)>>1;
    for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
      const distance=x*x+y*y;if(distance>radius*radius||distance<(radius-3)*(radius-3))continue;
      r(c+x,c+y,1,1,distance>(radius-1)*(radius-1)?'ink':y<0?'cream':'goldDark');
    }
    // Four inset seams and a clear transparent playable centre.
    r(c-2,c-radius,5,3,'gold');r(c-2,c+radius-2,5,3,'gold');r(c-radius,c-2,3,5,'gold');r(c+radius-2,c-2,3,5,'gold');
    sparkle(c+(frameIndex?8:-8),c-radius-2,'white');
  }else if(kind==='snitch'){
    const wing=frameIndex?0:3;
    pattern(['....kkkk','..kkwwwk','kkwwwwk.','kwwwwk..','.kkkk...'],1,7+wing,{k:'ink',w:'white'});
    pattern(['kkkk....','kwwwkk..','.kwwwwkk','..kwwwwk','...kkkk.'],23,7+wing,{k:'ink',w:'white'});
    oval(16,17,7,7,'ink');oval(16,17,6,6,'goldDark');oval(15,16,5,5,'gold');r(12,13,4,2,'cream');
    line(17,12,17,22,'goldDark');sparkle(28,3,'cream');
  }else if(kind==='potions'){
    frame(1,26,38,9,'woodDark');r(3,27,34,2,'woodLight');r(3,34,3,5,'woodDark');r(34,34,3,5,'woodDark');
    bottle(p,4,9,'red','redLight');bottle(p,16,5,'goldDark','gold');bottle(p,28,9,'blueDark','blue');
    r(5,31,8,1,'redLight');r(17,31,8,1,'gold');r(29,31,8,1,'blueLight');
  }else if(kind==='book'){
    frame(13,19,6,11,'woodDark');frame(6,29,20,4,'wood');
    frame(2,6,28,16,'woodDark');frame(3,4,26,16,'redDark');
    r(4,5,11,13,'paper');r(17,5,11,13,'cream');r(15,5,2,14,'goldDark');
    for(const y of[8,11,14]){r(6,y,7,1,'woodLight');r(19,y,6,1,'woodLight');}
    r(20,17,3,6,'red');
  }else if(kind==='sign'){
    frame(13,17,5,15,'wood');r(14,18,1,12,'woodLight');
    frame(3,5,26,15,'wood');r(4,6,24,2,'woodLight');
    r(8,10,11,3,'cream');r(18,8,3,7,'cream');r(21,10,2,3,'cream');
    r(6,8,1,1,'goldDark');r(25,16,1,1,'goldDark');r(4,18,24,1,'woodDark');
  }else if(kind==='club'){
    // Horizontal club, independent of the troll's carried weapon.
    frame(3,21,20,5,'woodDark');r(4,22,20,2,'woodLight');
    pattern(['....kkkkkk......','..kkwwwwwwkk....','.kwwwwwdddwwk...','kwwwwwddddwwwk..','kwwwddddddwwwk..','kwwdddddddwwwk..','.kwwddddddwwk...','..kkwwwwwwkk....','....kkkkkk......'],17,14,{k:'ink',w:'wood',d:'woodDark'});
    r(22,16,8,1,'woodLight');r(30,19,2,4,'woodLight');
    if(state==='active'){sparkle(10,14,'blueLight');sparkle(33,11,'blueLight');}
  }else if(kind==='target'){
    if(state==='broken'){
      frame(14,24,4,10,'woodDark');frame(6,33,21,3,'woodDark');
      pattern(['.....kkkk.........','..kkkrrrkk........','.krrccllrrkk......','krrcclllcrrrkk....','krcclrrrllccrrk...','.krrllccclrrrk....','..kkrrrrrrrkk.....','....kkkkkkk.......'],3,26,{k:'ink',r:'redDark',c:'cream',l:'gold'});
      r(4,23,4,2,'woodLight');r(27,28,3,2,'gold');
    }else{
      frame(14,19,4,15,'woodDark');r(15,20,1,13,'woodLight');frame(7,33,18,3,'woodDark');
      oval(16,15,13,13,'ink');oval(16,15,12,12,'woodDark');oval(16,15,10,10,'cream');
      oval(16,15,7,7,'red');oval(16,15,4,4,'cream');oval(16,15,2,2,'redDark');
      r(7,8,2,2,'paper');
      if(state==='damaged'){line(19,4,14,11,'ink');line(14,11,18,17,'ink');line(18,17,12,27,'ink');r(27,20,3,2,'woodLight');}
    }
  }
}

const DIMENSIONS=Object.freeze({
  letter:[32,34],chest:[30,30],herbs:[32,34],machine:[32,34],mirror:[32,40],ward:[32,38],feather:[32,36],
  lamp:[32,38],tracks:[32,32],gift:[32,34],door:[32,42],vines:[40,40],key:[34,36],chess:[32,38],
  crystal:[32,38],'flight-ring':[64,64],snitch:[34,30],potions:[40,42],book:[32,36],sign:[32,35],club:[40,30],target:[34,39],
});

export function propVisualState(entity={}) {
  if(entity.type==='target'||entity.kind==='target')return entity.visualState==='broken'||entity.destroyed?'broken':entity.visualState==='damaged'||entity.damageRatio>.3?'damaged':'intact';
  if(entity.kind==='herbs')return entity.visualState==='harvested'||entity.consumed?'harvested':'intact';
  return entity.activated?'active':'intact';
}

/** Finite cache: arbitrary IDs/times never become keys. Sprites are foot anchored. */
export function createPropSprites(makeCanvas=()=>document.createElement('canvas')) {
  const cache=new Map();
  return {
    get(entity={},time=0) {
      const requested=entity.type==='target'?'target':entity.kind;
      const kind=Object.hasOwn(DIMENSIONS,requested)?requested:'book';
      const state=propVisualState({...entity,kind});
      const frameIndex=['machine','snitch','crystal','flight-ring'].includes(kind)?Math.floor(Math.max(0,Number(time)||0)*4)%2:0;
      const key=`${kind}:${state}:${frameIndex}`;
      if(!cache.has(key)){
        const [w,h]=DIMENSIONS[kind],canvas=makeCanvas();canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');if(!ctx)throw new Error('도트 소품을 그릴 수 없습니다.');
        ctx.imageSmoothingEnabled=false;drawProp(ctx,kind,state,frameIndex,w,h);
        cache.set(key,{canvas,w,h,anchorX:w>>1,anchorY:kind==='flight-ring'?h>>1:h-3});
      }
      return cache.get(key);
    },
    clear(){cache.clear();},
    get size(){return cache.size;},
  };
}
