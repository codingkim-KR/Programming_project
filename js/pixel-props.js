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
  if(kind==='prophecy-orb'){
    pedestal(p,5,29,26);frame(13,24,10,7,'goldDark');r(14,25,3,5,'gold');
    if(state==='broken'){
      for(const [x,y]of[[7,26],[22,28],[13,31],[26,34]]){diamond(x,y,3,2,'blueDark');r(x,y-1,2,1,'blueLight');}
      r(14,26,8,2,'stone');return;
    }
    oval(18,15,12,12,'ink');oval(18,15,10,10,'blueDark');oval(17,14,8,9,'blue');
    oval(19,17,6,6,state==='active'?'violetLight':'violet');r(10,9,2,7,'white');r(12,7,5,2,'blueLight');
    line(16,13,21,17,'blueLight');line(21,17,15,19,'blueLight');r(23,21,2,2,'blueLight');
    if(state==='active'){sparkle(4,15,'white');sparkle(30,5,'violetLight');}return;
  }
  if(kind==='veil'){
    // A freestanding arch; the curtain is an opaque pixel weave, never a blur.
    frame(3,61,58,6,'shadow');r(5,62,54,2,'stoneLight');frame(7,58,50,5,'stone');
    frame(9,19,8,40,'stone');frame(47,19,8,40,'stone');
    r(10,20,2,37,'stoneLight');r(48,20,2,37,'stoneLight');
    for(let y=25;y<56;y+=8){r(10,y,6,1,'shadow');r(48,y,6,1,'shadow');}
    r(20,5,24,2,'ink');r(14,7,36,2,'ink');r(10,9,44,12,'ink');r(14,9,36,2,'stoneLight');
    r(11,11,42,8,'stone');r(16,13,32,7,'shadow');r(18,15,28,7,'#2d3041');
    for(const x of[17,25,33,41]){r(x,11,1,3,'shadow');r(x+1,11,4,1,'stoneLight');}
    r(12,16,6,6,'stone');r(46,16,6,6,'stone');r(17,18,30,3,'shadow');
    for(let x=18;x<46;x+=4){
      const shift=state==='active'&&x>30?3:0,shade=x%8===2?'#454657':'#2d3041';
      r(x+shift,21,3,34-(x%3),shade);
      r(x+shift+1,23,1,28,'#606271');r(x+shift,52-(x%3),2,5,'#343745');
    }
    // Opening the folds changes the visible gap without changing the collision.
    if(state==='active'){r(29,23,5,30,'#171f2d');r(30,54,4,3,'#2b3647');sparkle(32,34,'blueLight');}
    r(11,29,3,1,'shadow');r(51,45,2,4,'shadow');r(18,13,4,1,'cream');return;
  }
  if(kind==='ritual-basin'){
    frame(9,38,36,7,'shadow');r(11,39,32,2,'stoneLight');frame(16,28,22,12,'stone');r(17,29,4,9,'stoneLight');
    for(const x of[21,29,35]){r(x,30,1,7,'shadow');r(x+1,31,1,4,'stoneLight');}
    oval(27,24,23,11,'ink');oval(27,23,21,9,'stone');oval(27,20,21,8,'stoneLight');oval(27,19,18,6,'shadow');
    oval(27,18,16,4,state==='spent'?'stone':state==='active'?'blueLight':'greenDark');
    if(state!=='spent'){
      r(16,17,9,1,state==='active'?'white':'greenLight');r(29,19,10,1,state==='active'?'blue':'green');
      if(state==='active'){sparkle(8,10,'blueLight');sparkle(44,9,'white');line(24,5,24,11,'blueLight');line(31,7,31,13,'white');}
    }else{line(21,17,29,20,'shadow');line(29,20,32,17,'shadow');}
    r(8,25,5,2,'stoneLight');r(39,27,5,2,'shadow');return;
  }
  if(kind==='brazier'){
    frame(7,38,20,5,'shadow');r(8,39,18,1,'stoneLight');frame(14,28,6,11,'stone');r(15,29,2,8,'stoneLight');
    line(8,26,14,33,'goldDark',2);line(25,26,19,33,'goldDark',2);
    oval(17,26,13,6,'ink');oval(17,24,12,4,'goldDark');oval(17,23,10,3,'shadow');
    for(const x of[7,12,17,22,26]){r(x,23,1,6,'gold');r(x,22,1,2,'cream');}
    if(state==='lit'){
      const shift=frameIndex;
      pattern(['......r......','.....rr......','....rgr......','....rgr..r...','...rggr.rr...','r..rggrrgr...','rrrgccgggr...','rggcccccgr...','.rggcccgr....','..rggggr.....','...rrrr......'],11-shift,9,{r:'red',g:'gold',c:'cream'});
      r(13,20,7,3,'gold');r(16,19,3,4,'cream');sparkle(25,10+shift,'gold');r(9,7+shift,1,2,'redLight');
    }else{r(11,22,6,2,'woodDark');r(17,23,5,1,'wood');r(18,21,3,1,'stone');}return;
  }
  if(kind==='ward-gate'){
    frame(2,51,60,4,'shadow');r(3,52,58,1,'stoneLight');
    if(state==='broken'){
      for(const [x,y,sw,sh]of[[5,43,10,8],[48,42,11,9],[18,48,8,4],[34,47,11,5]]){frame(x,y,sw,sh,'stone');r(x+1,y+1,sw-3,1,'stoneLight');}
      line(9,45,13,49,'shadow');r(29,51,3,1,'blueDark');return;
    }
    frame(5,12,10,40,'stone');frame(49,12,10,40,'stone');
    r(6,13,3,37,'stoneLight');r(50,13,3,37,'stoneLight');
    frame(3,9,14,5,'stone');frame(47,9,14,5,'stone');
    for(const x of[10,54]){diamond(x,7,5,5,'ink');diamond(x,7,3,3,state==='damaged'?'gold':'blueLight');}
    for(let y=18;y<48;y+=9){r(6,y,8,1,'shadow');r(50,y,8,1,'shadow');}
    const glow=state==='damaged'?'#b99d9c':'#91d4d0',dark=state==='damaged'?'#78667d':'#467d94';
    for(let x=19;x<=45;x+=7){
      for(let y=14;y<49;y+=7){if(state==='damaged'&&((x+y)%3===0))continue;r(x,y,2,5,dark);r(x,y+1,1,3,glow);}
    }
    for(const y of[18,35,47]){line(15,y,48,y,dark);for(let x=19;x<46;x+=7)diamond(x,y,2,2,glow);}
    if(state==='damaged'){line(10,16,7,25,'ink');line(7,25,12,32,'ink');line(55,34,51,42,'ink');r(43,49,3,2,'stoneLight');}
    return;
  }
  if(kind==='vanishing-cabinet'){
    frame(4,12,38,41,'woodDark');frame(2,8,42,5,'wood');r(3,9,40,1,'woodLight');
    frame(6,53,8,4,'woodDark');frame(32,53,8,4,'woodDark');
    pattern(['.......kkkkkkkkkk.......','.....kkwwwwwwwwwwkk.....','...kkwwwwllllllwwwwkk...','..kwwllwwwwwwwwwwllwwk..','.kwwlwwwwkkkkwwwwwwlwwk.','kkkkkkkkkkkkkkkkkkkkkkkk'],11,2,{k:'ink',w:'wood',l:'woodLight'});
    const active=state==='activated';
    frame(8,15,30,35,active?'shadow':'wood');
    if(active){
      r(10,17,26,31,'#1f3440');r(14,20,18,25,'#385b64');r(18,23,10,20,'#527d7b');
      for(let y=22;y<43;y+=5){r(14+(y%3)*3,y,10,1,'#85b4a4');}
      frame(7,16,7,33,'woodDark');r(8,17,2,30,'woodLight');r(12,18,1,27,'goldDark');sparkle(26,30,'blueLight');
    }else{
      frame(10,18,11,29,'woodDark');frame(25,18,11,29,'woodDark');r(11,19,9,1,'woodLight');r(26,19,9,1,'woodLight');
      r(11,22,1,23,'wood');r(26,22,1,23,'wood');r(22,16,2,33,'ink');r(20,32,2,3,'gold');r(25,32,2,3,'gold');
      line(29,22,32,28,'ink');line(32,28,29,34,'ink');
    }
    r(5,15,2,35,'woodLight');r(39,15,2,35,'wood');r(6,51,34,1,'woodLight');return;
  }
  if(kind==='phoenix-coin'){
    oval(16,16,13,13,'ink');oval(16,15,12,12,'goldDark');oval(16,14,11,11,'gold');oval(16,14,9,9,'goldDark');oval(16,14,8,8,'gold');
    pattern(['r.......r','rr..r..rr','rgrrrrgrr','.rgrgrgr.','..rrgrr..','...rgr...','..rgrgr..','.r..r..r.'],12,9,{r:'redDark',g:'cream'});
    r(9,5,6,1,'cream');r(24,11,1,7,'cream');r(9,24,5,1,'woodDark');
    if(state==='active'){sparkle(5,5,'white');sparkle(27,24,'gold');}return;
  }
  if(kind==='locket'){
    oval(17,11,10,9,'goldDark');oval(17,11,8,7,'ink');r(12,4,3,1,'gold');r(23,8,1,4,'gold');
    frame(14,16,6,5,'gold');oval(17,27,11,9,'ink');oval(17,26,9,8,'gold');oval(17,26,7,6,'greenDark');
    line(20,22,14,22,'gold');line(14,22,14,25,'gold');line(14,25,20,27,'gold');line(20,27,20,30,'gold');line(20,30,14,30,'gold');
    r(9,23,1,4,'cream');r(16,18,2,1,'cream');r(20,22,1,1,'red');
    if(state==='active'){sparkle(4,27,'violetLight');sparkle(29,18,'blueLight');r(16,25,2,2,'greenLight');}
    return;
  }
  if(kind==='patronus-ward'){
    const active=state==='active',spent=state==='spent';
    oval(20,33,17,6,'ink');oval(20,32,15,5,spent?'stone':'blueDark');
    const glow=active?'#dafbf2':spent?'#799ca1':'#5e9ea6';
    for(const [dx,dy]of[[0,-4],[-12,0],[12,0],[0,4]])r(19+dx,31+dy,3,2,glow);
    frame(15,23,10,9,'stone');r(16,24,3,7,'stoneLight');
    diamond(20,15,8,10,'ink');diamond(20,15,6,8,active?'blueLight':spent?'stone':'blueDark');
    line(20,8,20,23,glow);line(15,14,20,19,glow);line(25,14,20,19,glow);
    if(active){sparkle(5,12+frameIndex,'white');sparkle(34,8-frameIndex,'blueLight');r(19,3,3,2,'white');}
    return;
  }
  if(kind==='time-turner'){
    oval(17,16,13,13,'ink');oval(17,16,11,11,'gold');oval(17,16,9,9,'ink');oval(17,16,8,8,'blueDark');
    frame(11,7,13,3,'cream');frame(11,23,13,3,'goldDark');
    line(13,10,20,22,'cream');line(21,10,14,22,'cream');
    r(14,11,7,3,state==='active'?'blueLight':'gold');r(16,14,3,6,'gold');r(14,21,7,2,'gold');
    line(8,5,3,0,'gold');line(26,5,31,0,'gold');frame(14,28,7,4,'goldDark');
    if(state==='active'){sparkle(3,26,'blueLight');sparkle(30,27,'white');}return;
  }
  if(kind==='golden-egg'){
    pedestal(p,4,30,26);oval(17,19,11,15,'ink');oval(17,18,9,13,'goldDark');oval(16,17,8,12,'gold');
    oval(13,13,3,5,'cream');line(17,5,17,30,'goldDark');line(9,20,25,20,'goldDark');
    if(state==='active'){line(17,5,15,13,'ink',2);line(15,13,19,18,'ink',2);line(19,18,16,27,'ink',2);sparkle(29,9,'blueLight');}
    else{r(19,9,3,3,'goldDark');r(22,24,2,3,'wood');}return;
  }
  if(kind==='cup'){
    pedestal(p,6,31,24);frame(17,23,6,10,'goldDark');r(18,24,2,7,'cream');
    frame(4,7,10,15,'gold');r(6,9,6,11,'ink');frame(26,7,10,15,'gold');r(28,9,6,11,'ink');
    frame(11,5,18,19,'blueDark');r(12,6,16,3,'blueLight');r(13,10,14,11,'blue');
    r(14,10,3,10,'white');r(25,9,2,11,'stone');frame(15,22,10,4,'gold');
    r(10,4,20,3,'gold');r(12,5,16,1,'cream');
    if(state==='active'){sparkle(5,2,'blueLight');sparkle(34,28,'white');sparkle(21,12,'white');}return;
  }
  if(kind==='tombstone'){
    frame(2,29,32,7,'shadow');r(4,30,28,2,'stone');frame(7,9,22,21,'stone');
    oval(18,10,10,8,'ink');oval(18,10,8,6,'stone');r(9,9,18,19,'stone');r(9,10,3,17,'stoneLight');
    r(17,8,3,12,'shadow');r(13,12,11,3,'shadow');r(14,23,10,1,'shadow');
    if(state==='active'){line(23,8,19,16,'ink');line(19,16,23,22,'ink');r(25,28,4,3,'stoneLight');}return;
  }
  if(kind==='bubble'){
    oval(18,19,15,15,'blueDark');oval(18,18,14,14,'blue');oval(18,18,12,12,'blueLight');oval(20,20,10,10,'blue');
    r(7,12,2,8,'white');r(9,9,4,2,'white');r(12,7,5,1,'white');r(24,26,3,2,'blueLight');
    if(state==='active'){sparkle(18,17,'white');oval(30,4,3,3,'blueLight');r(30,3,1,1,'white');}return;
  }
  if(kind==='tent'){
    // Striped canvas, pegged ropes and dark open flap; scale is fixed to native pixels.
    line(5,38,27,2,'ink',2);line(27,2,56,38,'ink',2);
    for(let y=3;y<39;y++){const half=Math.floor(y*.67);r(28-half,y,half*2+1,1,Math.floor((y+frameIndex)/7)%2?'red':'redDark');}
    line(28,3,8,38,'cream',2);line(28,3,48,38,'cream',2);
    for(let y=16;y<39;y++){const half=Math.floor((y-15)*.28);r(28-half,y,half*2+1,1,'ink');}
    line(8,28,1,41,'cream');line(48,28,59,41,'cream');r(0,40,3,4,'woodDark');r(58,40,3,4,'woodDark');
    r(26,0,3,4,'gold');r(28,1,10,3,'gold');return;
  }
  if(kind==='harp'){
    frame(4,31,29,5,'goldDark');r(5,32,27,2,'gold');
    line(7,31,13,3,'ink',5);line(8,30,14,4,'woodLight',3);line(13,3,31,10,'ink',4);line(14,4,30,11,'gold',2);
    line(31,10,29,31,'ink',4);line(31,11,29,31,'gold',2);
    for(let i=0;i<5;i++)line(14+i*3,7+i,12+i*3,30,state==='active'?'blueLight':'cream');
    if(state==='active'){sparkle(3,10+frameIndex,'white');r(34,8,2,8,'gold');r(31,15,4,2,'gold');}return;
  }
  if(kind==='boggart-cabinet'){
    frame(2,4,36,37,'woodDark');r(4,5,32,3,'woodLight');r(4,10,32,28,'ink');
    frame(4,9,state==='active'?7:15,29,'wood');frame(state==='active'?29:21,9,state==='active'?7:15,29,'wood');
    r(5,10,state==='active'?2:12,2,'woodLight');r(state==='active'?30:22,10,state==='active'?2:12,2,'woodLight');
    if(state==='active'){r(13,17,3,2,'gold');r(25,17,3,2,'gold');r(17,22,7,3,'violet');sparkle(20,8,'violetLight');}
    else{r(14,23,3,3,'gold');r(23,23,3,3,'gold');}
    r(4,40,5,3,'ink');r(31,40,5,3,'ink');return;
  }

  if(kind==='diary'){
    frame(5,9,23,23,'shadow');frame(4,6,22,24,'woodDark');r(5,7,20,22,'#343647');
    r(5,8,2,20,'goldDark');r(8,9,15,1,'gold');r(8,26,15,1,'goldDark');
    frame(11,13,10,9,'goldDark');r(13,15,6,5,'shadow');r(15,14,2,7,'gold');
    if(state==='active'){line(17,9,13,18,'ink',2);line(13,18,18,26,'ink',2);r(10,22,5,3,'ink');r(26,28,4,2,'ink');}
    else{r(25,9,1,20,'paper');r(26,11,1,18,'goldDark');}
    return;
  }
  if(kind==='mandrake'){
    frame(7,25,21,4,'woodLight');frame(9,29,17,8,'redDark');r(10,30,15,2,'red');oval(17,26,9,2,'woodDark');
    if(state==='harvested'){r(13,25,2,3,'greenDark');r(20,24,2,4,'green');r(23,31,4,2,'wood');}
    else{
      for(const [x,y,f]of[[16,7,false],[14,12,true],[19,10,false]]){line(x,y,17,23,'greenDark',2);leaf(p,x,y,f,'greenLight');}
      oval(17,22,6,8,'ink');oval(17,21,5,7,'woodLight');r(13,19,2,2,'ink');r(20,19,2,2,'ink');r(16,23,3,2,'woodDark');
      line(12,23,8,27,'woodLight',2);line(22,23,27,26,'woodLight',2);line(15,27,13,30,'woodLight');line(20,27,22,30,'woodLight');
    }
    return;
  }
  if(kind==='cauldron'){
    r(8,34,5,5,'ink');r(29,34,5,5,'ink');oval(21,24,17,13,'ink');oval(21,24,15,11,'shadow');
    r(8,22,3,8,'stone');r(11,32,20,2,'blueDark');oval(21,15,17,5,'ink');oval(21,14,15,3,'goldDark');oval(21,14,13,2,state==='active'?'greenLight':'violet');
    frame(1,19,6,10,'stone');frame(35,19,6,10,'stone');r(3,21,2,6,'ink');r(37,21,2,6,'ink');
    for(const [x,y]of[[13,7],[22,3],[28,8]]){r(x,y-frameIndex,3,3,state==='active'?'blueLight':'violetLight');r(x+1,y-2-frameIndex,2,2,'cream');}
    return;
  }
  if(kind==='valve'){
    frame(12,4,9,29,'stone');r(13,5,2,26,'stoneLight');frame(5,27,24,7,'stone');r(7,28,20,2,'stoneLight');
    oval(17,17,12,12,'ink');oval(17,17,10,10,state==='active'?'green':'redDark');oval(17,17,7,7,'shadow');
    const points=state==='active'?[[7,0],[-7,0],[0,7],[0,-7]]:[[5,5],[-5,5],[5,-5],[-5,-5]];
    for(const [dx,dy]of points)line(17,17,17+dx,17+dy,'gold',2);
    frame(14,14,7,7,'goldDark');r(16,16,3,3,'cream');r(7,7,4,2,state==='active'?'greenLight':'redLight');
    if(state==='active')sparkle(29,6,'blueLight');return;
  }
  if(kind==='car'){
    // Front-facing 1960s-shaped blue motorcar, deliberately drawn at 64×46px.
    frame(6,29,9,14,'shadow');frame(49,29,9,14,'shadow');r(7,32,2,8,'stone');r(54,32,2,8,'stone');
    frame(16,4,32,22,'blueDark');frame(19,7,26,17,'blueLight');r(21,8,22,12,'blueDark');
    r(22,9,6,3,'blueLight');r(33,9,7,2,'blueLight');r(31,7,2,17,'stone');
    oval(26,17,3,3,'wood');r(24,14,5,2,'woodDark');oval(38,17,3,3,'woodLight');r(36,14,5,2,'redDark');
    frame(10,23,44,16,'blue');r(12,24,40,3,'blueLight');r(15,28,34,2,'stoneLight');
    frame(5,28,54,12,'blueDark');r(7,29,50,9,'blue');frame(9,30,9,6,'cream');frame(46,30,9,6,'cream');
    frame(23,31,18,7,'shadow');for(let x=25;x<40;x+=3)r(x,32,1,4,'stoneLight');
    frame(7,38,50,4,'stone');r(9,39,46,1,'white');frame(26,39,13,5,'cream');r(28,41,9,1,'ink');
    r(9,20,6,3,'stone');r(49,20,6,3,'stone');return;
  }
  if(kind==='fang'){
    pedestal(p,5,25,24);
    pattern(['.....kkkk......','....kwwcck.....','...kwwccck.....','...kwwcck......','..kwwccck......','..kwwcck.......','.kwwcck........','.kwwck.........','kwwck..........','kcck...........','kk.............'],11,10,{k:'ink',w:'white',c:'cream'});
    r(19,7,3,6,'goldDark');r(18,7,4,2,'gold');sparkle(7,12,'cream');return;
  }
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
  }else if(kind==='brush'){
    // One tile of a continuous path barrier. The footprint, not a lone icon,
    // spans the walkable route; burnt remains stay low enough to read as open.
    if(state==='active'){
      oval(10,22,9,3,'#343c35');
      line(3,22,7,19,'#282e31',2);line(8,23,13,20,'#282e31',2);line(13,22,17,24,'#282e31',2);
      r(5,21,2,1,'woodDark');r(11,23,2,1,'redDark');r(15,22,1,1,'goldDark');
    }else{
      oval(10,20,10,5,'ink');frame(8,16,4,9,'woodDark');
      for(const [x,y,rx,ry]of[[5,14,5,7],[14,13,5,8],[10,7,6,6],[9,17,7,6]]){
        oval(x,y,rx,ry,'ink');oval(x,y-1,rx-1,ry-1,'greenDark');
        oval(x-1,y-2,Math.max(1,rx-2),Math.max(1,ry-3),'green');
        r(x-2,y-4,3,1,'greenLight');
      }
      line(5,21,10,16,'woodDark');line(11,20,15,17,'woodDark');
    }
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
  'prophecy-orb':[36,42],veil:[64,70],'ritual-basin':[54,48],brazier:[34,46],'ward-gate':[64,58],'vanishing-cabinet':[46,60],'phoenix-coin':[32,32],locket:[34,38],
  'patronus-ward':[40,42],'time-turner':[34,36],'golden-egg':[36,44],cup:[40,44],tombstone:[36,39],bubble:[38,38],tent:[62,46],harp:[38,40],'boggart-cabinet':[40,46],
  diary:[34,36],mandrake:[36,40],cauldron:[44,42],valve:[36,38],car:[64,46],fang:[34,38],
  letter:[32,34],chest:[30,30],herbs:[32,34],machine:[32,34],mirror:[32,40],ward:[32,38],feather:[32,36],
  lamp:[32,38],tracks:[32,32],gift:[32,34],door:[32,42],vines:[40,40],brush:[21,27],key:[34,36],chess:[32,38],
  crystal:[32,38],'flight-ring':[64,64],snitch:[34,30],potions:[40,42],book:[32,36],sign:[32,35],club:[40,30],target:[34,39],
});

export function propVisualState(entity={}) {
  // These explicit states survive activated=true so saved damage stays visible.
  if(entity.kind==='ward-gate')return entity.visualState==='broken'||entity.destroyed?'broken':entity.visualState==='damaged'||entity.damageRatio>.3?'damaged':'intact';
  if(entity.kind==='brazier')return entity.visualState==='unlit'?'unlit':entity.visualState==='lit'||entity.activated?'lit':'unlit';
  if(entity.kind==='vanishing-cabinet')return entity.visualState==='closed'?'closed':['active','activated'].includes(entity.visualState)||entity.activated?'activated':'closed';
  if(entity.kind==='ritual-basin'&&entity.visualState==='spent')return 'spent';
  if(entity.kind==='prophecy-orb'&&(entity.visualState==='broken'||entity.destroyed))return 'broken';
  if(['prophecy-orb','veil','ritual-basin','phoenix-coin','locket'].includes(entity.kind))return entity.visualState==='active'||entity.activated?'active':'intact';
  if(entity.kind==='patronus-ward'&&entity.visualState==='spent')return 'spent';
  if(entity.type==='target'||entity.kind==='target')return entity.visualState==='broken'||entity.destroyed?'broken':entity.visualState==='damaged'||entity.damageRatio>.3?'damaged':'intact';
  if(['herbs','mandrake'].includes(entity.kind))return entity.visualState==='harvested'||entity.consumed?'harvested':'intact';
  return entity.activated?'active':'intact';
}

/** Finite cache: arbitrary IDs/times never become keys. Sprites are foot anchored. */
export function createPropSprites(makeCanvas=()=>document.createElement('canvas')) {
  const cache=new Map();
  return {
    get(entity={},time=0) {
      const requested=entity.type==='target'&&entity.kind!=='ward-gate'?'target':entity.kind;
      const kind=Object.hasOwn(DIMENSIONS,requested)?requested:'book';
      const state=propVisualState({...entity,kind});
      const frameIndex=['machine','snitch','crystal','flight-ring','cauldron','patronus-ward','harp','brazier'].includes(kind)?Math.floor(Math.max(0,Number(time)||0)*4)%2:0;
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
