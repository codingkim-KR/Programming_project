// Original Canvas2D tile artwork. One game tile is 16 deliberately placed pixels.
// No projected meshes, images of meshes, gradients or fractional pixel painting.
export const TILE = 16;
const C = Object.freeze({
  ink:'#192c36', deep:'#253b44', stone:'#809399', stoneLight:'#a9b6ae', stoneDark:'#607681',
  wood:'#ad7044', woodLight:'#d59b59', woodDark:'#6c4738', gold:'#e9be69', cream:'#f7e6b0',
  grass:'#55784b', grassLight:'#719653', grassDark:'#365a41', leaf:'#3e7548', leafLight:'#74a04e',
  greenDeep:'#294b3f', earth:'#796348', earthLight:'#9a8055', earthDark:'#5b5141',
  blue:'#426979', blueLight:'#7ab1b5', red:'#9b4854', redLight:'#c96968', white:'#e5e5ce',
});
export const TERRAIN_PALETTE = C;
const hash=(x,y,s=0)=>{let n=Math.imul(x+191,374761393)^Math.imul(y+73,668265263)^Math.imul(s+1,1274126177);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;};
const rect=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const regions=scene=>scene.layout?.floorRegions?.length?scene.layout.floorRegions:[{x:scene.width/2,z:scene.depth/2,w:scene.width,d:scene.depth}];

export function floorContains(scene,x,z) {
  if(scene.layout?.boundary==='ellipse')return ((x-scene.width/2)/(scene.width/2))**2+((z-scene.depth/2)/(scene.depth/2))**2<=1;
  return regions(scene).some(r=>x>=r.x-r.w/2&&x<=r.x+r.w/2&&z>=r.z-r.d/2&&z<=r.z+r.d/2);
}

function tile(ctx,theme,x,y,tx,ty) {
  const h=hash(tx,ty),alternate=h%7===0;
  if(theme==='coast'||theme==='train'||theme==='library') {
    const base=theme==='library'?'#825943':theme==='train'?'#986645':C.wood;
    rect(ctx,base,x,y,16,16);rect(ctx,C.woodDark,x,y+15,16,1);
    rect(ctx,theme==='library'?'#9a7151':C.woodLight,x,y,16,1);
    const seam=((ty%2)*16+tx*16)%48===0; if(seam){rect(ctx,C.woodDark,x,y,1,16);rect(ctx,'#554137',x+2,y+3,1,1);}
    rect(ctx,theme==='library'?'#76523f':'#97613d',x+3,y+5,8+(h%4),1);
    if(alternate){rect(ctx,C.woodDark,x+9,y+9,3,1);rect(ctx,C.woodLight,x+8,y+10,5,1);}
    return;
  }
  if(['forest','garden','flight'].includes(theme)) {
    const forest=theme==='forest',base=forest?'#456549':theme==='flight'?(Math.floor(tx/5)%2?'#63884b':'#5c8047'):C.grass;
    rect(ctx,base,x,y,16,16);
    const dark=forest?'#38593f':C.grassDark,light=forest?'#5d7e4b':C.grassLight;
    for(let i=0;i<2;i++){const px=x+2+(hash(tx,ty,i+2)%11),py=y+3+(hash(tx,ty,i+7)%10);rect(ctx,dark,px,py,1,2);rect(ctx,light,px+1,py-1,1,2);}
    if(forest&&h%11===0){rect(ctx,'#8c8051',x+5,y+9,3,1);rect(ctx,'#b4a56b',x+7,y+8,2,1);}
    return;
  }
  const bath=theme==='bathroom',alley=theme==='alley',mirror=theme==='mirror';
  const base=bath?(tx+ty)%2?'#b7c8be':'#9db8ae':alley?'#7a8082':mirror?'#757fa0':theme==='puzzle'?'#8a8a97':C.stone;
  const seam=bath?'#73998f':alley?'#596672':mirror?'#535e82':C.stoneDark;
  rect(ctx,base,x,y,16,16);
  if(bath){rect(ctx,'#d0d8c5',x+1,y+1,14,1);rect(ctx,seam,x,y+15,16,1);rect(ctx,seam,x+15,y,1,16);}
  else if(alley){
    rect(ctx,seam,x,y+7,16,1);rect(ctx,seam,x,y+15,16,1);
    rect(ctx,seam,x+(ty%2?5:11),y,1,8);rect(ctx,seam,x+(ty%2?13:3),y+8,1,8);
    rect(ctx,'#969994',x+1,y+1,Math.min(11,ty%2?3:9),1);rect(ctx,'#969994',x+5,y+9,7,1);
  }else{
    if(ty%2===1)rect(ctx,seam,x,y+15,16,1);
    if((tx+Math.floor(ty/2))%2===0)rect(ctx,seam,x+15,y,1,16);
    if(ty%2===0)rect(ctx,mirror?'#939cba':'#9ba9a6',x+2,y+1,11,1);
    if(h%17===0){rect(ctx,seam,x+5,y+7,3,1);rect(ctx,seam,x+7,y+8,1,3);}
  }
}

function floorPath(ctx,scene) {
  // Ground markings never alter the walkable union or cover its boundary.
  const theme=scene.theme;
  if(theme==='garden'||theme==='forest') {
    const points=[scene.spawn,...(scene.entities||[]).filter(e=>!['enemy','boss'].includes(e.type)).map(e=>({x:e.x,z:e.z})),scene.exit].filter(Boolean);
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)*2);
      for(let n=0;n<=steps;n++){
        const x=a.x+(b.x-a.x)*n/Math.max(1,steps),z=a.z+(b.z-a.z)*n/Math.max(1,steps);
        const px=Math.floor(x*16/4)*4,py=Math.floor(z*16/4)*4;
        for(let yy=-8;yy<=8;yy+=4)for(let xx=-8;xx<=8;xx+=4){
          if(!floorContains(scene,(px+xx+2)/16,(py+yy+2)/16))continue;
          if(xx*xx+yy*yy>85)continue;
          rect(ctx,theme==='forest'?(hash(px+xx,py+yy)%5?'#686448':'#777153'):(hash(px+xx,py+yy)%5?'#a38b5d':'#b49b68'),px+xx,py+yy,4,4);
        }
      }
    }
  }
  if(theme==='train') {
    const y=Math.floor(scene.depth*8-11);
    rect(ctx,C.woodDark,1,y-2,scene.width*16-2,26);rect(ctx,C.gold,1,y-1,scene.width*16-2,1);
    rect(ctx,'#813d4e',1,y,scene.width*16-2,22);rect(ctx,'#b15b62',1,y+2,scene.width*16-2,2);
    rect(ctx,C.gold,1,y+22,scene.width*16-2,1);
    for(let x=11;x<scene.width*16;x+=32){rect(ctx,'#c88b70',x,y+9,3,3);rect(ctx,'#c88b70',x+1,y+8,1,5);}
  }
  if(theme==='coast')rug(ctx,scene.width*8,scene.depth*8+25,104,58,'#94634d');
  if(theme==='castle')for(const r of regions(scene)){
    const w=Math.min(64,(r.w-2)*16),h=Math.min(80,(r.d-2)*16);
    rug(ctx,r.x*16,r.z*16,w,h,'#843f4e');
  }
  if(theme==='library')rug(ctx,scene.width*8,scene.depth*8+80,58,134,'#385b68');
  if(theme==='puzzle'){
    const r=regions(scene).at(-1),cx=r.x*16,cy=(r.z+3)*16;
    for(let j=0;j<6;j++)for(let i=0;i<6;i++)if(floorContains(scene,(cx-48+i*16+8)/16,(cy-48+j*16+8)/16))rect(ctx,(i+j)%2?'#595b70':'#c4c0a9',cx-48+i*16,cy-48+j*16,16,16);
  }
  if(theme==='flight') {
    // Dashed pitch lines are raster-authored at logical pixel boundaries.
    const x0=48,x1=scene.width*16-48,y0=40,y1=scene.depth*16-40;
    for(let x=x0;x<x1;x+=12){rect(ctx,'#d3d8a1',x,y0,7,1);rect(ctx,'#d3d8a1',x,y1,7,1);}
    for(let y=y0;y<y1;y+=12){rect(ctx,'#d3d8a1',x0,y,1,7);rect(ctx,'#d3d8a1',x1,y,1,7);}
    for(let y=y0;y<y1;y+=10)rect(ctx,'#d3d8a1',scene.width*8,y,1,5);
  }
  if(theme==='mirror') {
    const cx=scene.width*8,cy=scene.depth*8;
    pixelRing(ctx,cx,cy,82,'#b9a573');pixelRing(ctx,cx,cy,85,'#4f5a7d');
    for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.round(cx+Math.sin(a)*80),y=Math.round(cy+Math.cos(a)*80);rect(ctx,C.gold,x-2,y-2,5,5);rect(ctx,C.cream,x,y-1,1,3);}
  }
}

function pixelRing(ctx,cx,cy,r,color) {
  for(let y=-r;y<=r;y++){const x=Math.round(Math.sqrt(r*r-y*y));rect(ctx,color,cx-x,cy+y,1,1);rect(ctx,color,cx+x,cy+y,1,1);}
}
function rug(ctx,cx,cy,w,h,color) {
  const x=Math.round(cx-w/2),y=Math.round(cy-h/2);
  rect(ctx,C.ink,x,y,w,h);rect(ctx,C.gold,x+1,y+1,w-2,h-2);rect(ctx,color,x+3,y+3,w-6,h-6);
  rect(ctx,'#bc8361',x+6,y+6,w-12,1);rect(ctx,'#bc8361',x+6,y+h-7,w-12,1);
  for(let yy=y+11;yy<y+h-9;yy+=12)for(let xx=x+11;xx<x+w-9;xx+=12){rect(ctx,'#bc8361',xx,yy,1,3);rect(ctx,'#bc8361',xx-1,yy+1,3,1);}
  for(let xx=x+3;xx<x+w-3;xx+=4){rect(ctx,C.cream,xx,y-2,1,2);rect(ctx,C.cream,xx,y+h,1,2);}
}

/** Call once into a cached map canvas; camera translation belongs to the caller. */
export function paintGround(ctx,scene,unit=TILE) {
  ctx.save();if(unit!==16)ctx.scale(unit/16,unit/16);ctx.imageSmoothingEnabled=false;
  const natural=['garden','forest','flight'].includes(scene.theme);
  rect(ctx,scene.theme==='coast'?'#315b70':natural?'#213f38':'#223340',-64,-64,scene.width*16+128,scene.depth*16+128);
  // Clip once to the exact authored floor, including fractional region edges.
  ctx.save();ctx.beginPath();
  if(scene.layout?.boundary==='ellipse'){
    const rx=scene.width*8,ry=scene.depth*8;
    for(let y=0;y<scene.depth*16;y++){
      const half=rx*Math.sqrt(Math.max(0,1-((y+.5-ry)/ry)**2));
      const left=Math.ceil(rx-half-.5),right=Math.floor(rx+half-.5);
      ctx.rect(left,y,right-left+1,1);
    }
  }
  else for(const r of regions(scene))ctx.rect((r.x-r.w/2)*16,(r.z-r.d/2)*16,r.w*16,r.d*16);
  ctx.clip();
  for(let ty=0;ty<Math.ceil(scene.depth);ty++)for(let tx=0;tx<Math.ceil(scene.width);tx++){
    if(!floorContains(scene,tx+.5,ty+.5)&&!floorContains(scene,tx,ty)&&!floorContains(scene,tx+1,ty+1))continue;
    tile(ctx,scene.theme,tx*16,ty*16,tx,ty);
  }
  floorPath(ctx,scene);
  ctx.restore();
  if(scene.theme==='coast'){
    for(let y=-32;y<scene.depth*16+48;y+=19)for(let x=-48;x<scene.width*16+48;x+=37){
      if(floorContains(scene,x/16,y/16))continue;
      rect(ctx,'#558496',x+(Math.floor(y/19)%2)*13,y,12,1);rect(ctx,'#91b2b2',x+2,y+1,5,1);
    }
  }
  // Crisp one-pixel contour and shallow front riser. Never turn the whole floor
  // into an extruded 3D slab: this is the edge of a 2D tile map.
  for(let y=0;y<scene.depth*16;y++)for(let x=0;x<scene.width*16;x++){
    if(!floorContains(scene,(x+.5)/16,(y+.5)/16))continue;
    if(!floorContains(scene,(x+.5)/16,(y+1.5)/16))rect(ctx,natural?'#83a15c':C.ink,x,y,1,1);
    else if(!floorContains(scene,(x-.5)/16,(y+.5)/16)||!floorContains(scene,(x+1.5)/16,(y+.5)/16))rect(ctx,natural?'#365a41':'#334c5a',x,y,1,1);
  }
  ctx.restore();
}

function plant(ctx,x,y,small=false) {
  if(small){rect(ctx,C.woodDark,x-3,y-5,6,5);rect(ctx,C.woodLight,x-4,y-6,8,2);rect(ctx,C.leaf,x-2,y-12,5,6);rect(ctx,C.leafLight,x,y-14,2,5);return;}
  rect(ctx,C.ink,x-7,y-12,14,12);rect(ctx,'#a66049',x-6,y-10,12,9);rect(ctx,'#ce8c5b',x-8,y-14,16,5);
  rect(ctx,C.greenDeep,x-8,y-25,16,12);rect(ctx,C.leaf,x-10,y-23,20,7);rect(ctx,C.leaf,x-6,y-29,12,17);rect(ctx,C.leafLight,x-6,y-27,5,4);rect(ctx,'#a6bc68',x-3,y-29,2,2);
}
function tree(ctx,x,y,variant=0) {
  rect(ctx,'#263c32',x-18,y-4,36,7);
  rect(ctx,C.ink,x-5,y-26,10,29);rect(ctx,C.woodDark,x-4,y-26,8,27);rect(ctx,'#ad7b50',x-2,y-20,3,20);
  rect(ctx,C.woodDark,x-9,y,18,3);rect(ctx,C.woodLight,x-2,y-2,2,3);
  const dark=variant%3===0?'#264e43':C.greenDeep,mid=variant%3===0?'#3a6b4c':C.leaf,light=variant%3===0?'#6a9155':C.leafLight;
  // Stepped crown silhouette; clusters use whole pixels, not circles/blur.
  for(const [xx,yy,w,h]of[[-14,-54,28,10],[-21,-47,42,15],[-25,-34,50,13],[-18,-22,36,8]])rect(ctx,C.ink,x+xx,y+yy,w,h);
  for(const [xx,yy,w,h]of[[-13,-52,26,13],[-19,-45,38,14],[-23,-32,46,9],[-16,-25,32,9]])rect(ctx,dark,x+xx,y+yy,w,h);
  for(const [xx,yy,w,h]of[[-10,-51,18,11],[-17,-43,29,9],[-21,-32,32,7],[-11,-24,22,6],[8,-40,10,8]])rect(ctx,mid,x+xx,y+yy,w,h);
  for(const [xx,yy,w,h]of[[-8,-51,11,3],[-15,-42,10,3],[-20,-32,9,2],[7,-39,7,2]])rect(ctx,light,x+xx,y+yy,w,h);
  rect(ctx,'#9db36a',x-7,y-50,4,1);rect(ctx,'#9db36a',x-13,y-41,3,1);
}
function pillar(ctx,x,y,w,d,cracked=false) {
  w=Math.max(16,Math.round(w));d=Math.max(10,Math.round(d));const left=Math.round(x-w/2),top=y-d-25;
  rect(ctx,C.ink,left-2,y-d,w+4,d+1);rect(ctx,C.stoneDark,left,y-d,w,d-2);rect(ctx,C.stoneLight,left+1,y-4,w-2,2);
  rect(ctx,C.ink,left+3,top+7,w-6,d+18);rect(ctx,C.stone,left+4,top+9,w-8,d+14);rect(ctx,'#b5bda9',left+5,top+10,3,d+13);rect(ctx,'#5a6e7a',left+w-8,top+10,3,d+13);
  rect(ctx,C.ink,left-1,top,w+2,10);rect(ctx,C.stoneLight,left,top+1,w,5);rect(ctx,C.stoneDark,left,top+6,w,3);rect(ctx,'#e0dbc0',left+2,top+1,w-4,1);
  if(cracked){rect(ctx,C.ink,x+2,top+16,1,8);rect(ctx,C.ink,x,top+23,3,1);rect(ctx,C.ink,x-1,top+24,1,7);}
}
function table(ctx,x,y,w,d,garden=false) {
  const l=x-w/2,t=y-d-8;
  rect(ctx,C.ink,l+2,y-9,5,10);rect(ctx,C.ink,l+w-7,y-9,5,10);rect(ctx,C.woodLight,l+3,y-8,2,7);rect(ctx,C.woodLight,l+w-6,y-8,2,7);
  rect(ctx,C.ink,l-1,t-1,w+2,d+8);rect(ctx,C.woodDark,l,t+1,w,d+5);rect(ctx,C.wood,l+1,t+1,w-2,d);rect(ctx,C.woodLight,l+1,t+1,w-2,2);
  for(let yy=t+12;yy<t+d;yy+=12)rect(ctx,C.woodDark,l+1,yy,w-2,1);
  for(let xx=l+8;xx<l+w-7;xx+=22){
    if(garden)plant(ctx,xx,t+Math.max(13,d-3),true);
    else{rect(ctx,C.ink,xx-3,t+4,10,8);rect(ctx,'#d2c7a2',xx-2,t+4,8,6);rect(ctx,C.white,xx-2,t+4,4,5);rect(ctx,'#8a5b4e',xx+1,t+4,1,5);rect(ctx,C.ink,xx+9,t+5,3,4);rect(ctx,C.blueLight,xx+9,t+5,2,1);}
  }
}
function shelf(ctx,x,y,w,d) {
  const l=x-w/2,t=y-d-19;rect(ctx,C.ink,l-1,t-1,w+2,d+20);rect(ctx,C.woodDark,l,t,w,d+18);rect(ctx,C.woodLight,l,t,w,3);rect(ctx,C.woodLight,l,t+3,2,d+14);rect(ctx,C.wood,l+w-3,t+3,2,d+14);
  const colors=['#c76661','#d2b16e','#6d9c92','#587f9a','#a087a5'];
  for(let yy=t+5;yy<y-4;yy+=14){
    rect(ctx,'#392d35',l+3,yy,w-6,11);
    for(let xx=l+4;xx<l+w-5;xx+=5){const n=hash(xx,yy)%5,h=7+(n%3);rect(ctx,C.ink,xx,yy+10-h,4,h);rect(ctx,colors[n],xx,yy+10-h,3,h-1);rect(ctx,'#e8cb8c',xx+1,yy+10-h+2,1,1);}
    rect(ctx,C.woodLight,l+2,yy+11,w-4,2);
  }
}
function shop(ctx,x,y,w,d,index) {
  const l=x-w/2,t=y-d-28,awning=['#965064','#507e7b','#60749c'][index%3];
  rect(ctx,C.ink,l-2,t-2,w+4,d+29);rect(ctx,'#715b61',l,t,w,d+26);rect(ctx,'#a58679',l+2,t+2,w-4,4);
  const door=x-10;rect(ctx,C.ink,door,y-d+5,20,d-5);rect(ctx,'#5d403b',door+2,y-d+7,16,d-7);rect(ctx,C.gold,door+14,y-12,2,2);
  for(let xx=l+8;xx<l+w-16;xx+=32){
    if(Math.abs(xx-x)<21)continue;
    rect(ctx,C.ink,xx,y-d+8,23,d-13);rect(ctx,'#315469',xx+2,y-d+10,19,d-17);rect(ctx,'#7ba6a8',xx+3,y-d+11,7,2);rect(ctx,C.woodLight,xx+10,y-d+10,2,d-17);rect(ctx,C.woodLight,xx+2,y-d+Math.floor(d/2),19,2);
  }
  for(let xx=l-2;xx<l+w+2;xx+=8){rect(ctx,C.ink,xx,t+17,8,17);rect(ctx,Math.floor((xx-l)/8)%2?C.cream:awning,xx,t+17,8,13);rect(ctx,Math.floor((xx-l)/8)%2?'#cab68e':awning,xx,t+30,7,3);}
  rect(ctx,C.ink,x-20,t+3,40,12);rect(ctx,C.gold,x-19,t+4,38,10);rect(ctx,'#4d3e47',x-18,t+5,36,8);
  // Three pictographic shop signs: wand, open book, potion bottle.
  if(index%3===0){for(let i=0;i<10;i++)rect(ctx,C.cream,x-5+i,t+11-i/2,2,1);rect(ctx,'#f8d686',x+5,t+6,3,3);}
  else if(index%3===1){rect(ctx,C.cream,x-7,t+6,6,5);rect(ctx,C.gold,x,t+6,6,5);rect(ctx,C.ink,x-1,t+6,1,6);}
  else{rect(ctx,C.blueLight,x-3,t+7,7,5);rect(ctx,C.cream,x-1,t+5,3,3);rect(ctx,C.gold,x-2,t+5,5,1);}
}
function bench(ctx,x,y,w,d) {
  const l=x-w/2,t=y-d-13;
  rect(ctx,C.ink,l,t,w,d+14);rect(ctx,C.woodDark,l+1,t+1,w-2,d+11);rect(ctx,'#7d394c',l+4,t+3,w-8,d+3);rect(ctx,'#c2676b',l+4,t+3,w-8,3);
  for(let xx=l+18;xx<l+w-6;xx+=22)rect(ctx,'#542f42',xx,t+5,1,d);
  rect(ctx,C.gold,l+1,t+3,2,d+9);rect(ctx,C.gold,l+w-3,t+3,2,d+9);rect(ctx,'#c2676b',l+4,y-7,w-8,2);rect(ctx,'#542f42',l+4,y-3,w-8,2);
}
function basin(ctx,x,y,w,d) {
  const l=x-w/2,t=y-d-7;rect(ctx,C.ink,l-1,t-1,w+2,d+8);rect(ctx,'#86ada9',l,t,w,d+5);rect(ctx,'#d1ddd0',l+1,t+1,w-2,d-2);rect(ctx,'#5e8989',l+4,t+5,w-8,d-10);rect(ctx,'#adcac0',l+5,t+6,w-10,d-12);rect(ctx,C.ink,x-2,t-3,4,7);rect(ctx,C.gold,x-1,t-2,2,5);rect(ctx,C.ink,x,t+9,2,2);
}
function rocks(ctx,x,y,w,d) {
  const l=x-w/2,t=y-d-8;
  rect(ctx,C.ink,l+3,t,w-8,d+8);rect(ctx,C.ink,l,t+6,w,d+1);rect(ctx,'#687d7a',l+2,t+5,w-4,d);rect(ctx,'#81938a',l+5,t+1,w-12,d-1);rect(ctx,'#a9b09a',l+6,t+2,w-15,3);rect(ctx,'#465e60',l+2,y-6,w-4,5);rect(ctx,'#46654b',l+w-10,y-5,9,3);
}
function wall(ctx,x,y,w,h=24,theme='castle') {
  const l=x-w/2,t=y-h;
  rect(ctx,C.ink,l,t,w,h+1);rect(ctx,theme==='coast'?'#715847':'#607889',l+1,t+2,w-2,h-3);rect(ctx,theme==='coast'?'#c29b6b':'#a8b8b4',l,t,w,3);
  const c=theme==='coast'?'#4c423b':'#405969';
  for(let yy=t+9;yy<y;yy+=8){rect(ctx,c,l+1,yy,w-2,1);for(let xx=l+((yy-t)%16?6:17);xx<l+w;xx+=24)rect(ctx,c,xx,yy-7,1,7);}
  rect(ctx,theme==='coast'?'#a07d56':'#7f9c9e',l+1,y-3,w-2,2);
}
function window(ctx,x,y,train=false) {
  rect(ctx,C.ink,x-11,y-28,22,25);rect(ctx,C.woodLight,x-10,y-27,20,23);rect(ctx,'#3c667f',x-8,y-25,16,18);rect(ctx,'#91bbc0',x-7,y-24,6,9);rect(ctx,'#b3d2c9',x-6,y-24,4,3);rect(ctx,C.woodDark,x-1,y-25,2,19);rect(ctx,C.woodDark,x-8,y-15,16,2);rect(ctx,C.cream,x-12,y-5,24,3);
  if(train){rect(ctx,C.red,x-14,y-28,4,24);rect(ctx,C.red,x+10,y-28,4,24);}
}
function lantern(ctx,x,y) {
  rect(ctx,C.ink,x-1,y-33,2,32);rect(ctx,C.ink,x-5,y-32,10,13);rect(ctx,C.gold,x-4,y-30,8,9);rect(ctx,C.cream,x-2,y-29,4,6);rect(ctx,C.woodDark,x-4,y-20,8,2);rect(ctx,C.ink,x-3,y-1,6,2);
}
function flag(ctx,x,y,color) {
  rect(ctx,C.ink,x-1,y-45,3,45);rect(ctx,C.gold,x,y-44,1,42);rect(ctx,C.gold,x-2,y-47,5,3);rect(ctx,C.ink,x+1,y-43,20,17);rect(ctx,color,x+2,y-42,17,14);rect(ctx,C.cream,x+8,y-40,3,10);rect(ctx,C.gold,x+5,y-37,9,3);rect(ctx,C.ink,x+17,y-29,4,3);rect(ctx,C.ink,x-4,y-1,9,2);
}

/** Depth-sort these with actors. Only authored blockers have solid footprints. */
export function environmentSprites(scene,unit=TILE) {
  const objects=[],theme=scene.theme;
  const add=(kind,x,z,w,h,paint)=>objects.push({kind,x,z,width:Math.round(w*unit/16),height:Math.round(h*unit/16),draw(ctx,px,py){ctx.save();ctx.translate(Math.round(px),Math.round(py));if(unit!==16)ctx.scale(unit/16,unit/16);paint(ctx);ctx.restore();}});
  for(const [i,b]of(scene.blockers||[]).entries()) {
    const w=Math.max(8,Math.round(b.w*16)),d=Math.max(8,Math.round(b.d*16)),z=b.z+b.d/2;
    if(theme==='alley')add('shop',b.x,z,w+8,d+36,c=>shop(c,0,0,w,d,i));
    else if(theme==='train')add('bench',b.x,z,w+4,d+18,c=>bench(c,0,0,w,d));
    else if(theme==='library')add('bookshelf',b.x,z,w+4,d+24,c=>shelf(c,0,0,w,d));
    else if(theme==='classroom'){
      const count=Math.max(1,Math.round(b.d/2.5)),partDepth=d/count;
      for(let row=0;row<count;row++)add('desk',b.x,b.z-b.d/2+(row+1)*b.d/count,w+4,partDepth+16,c=>table(c,0,0,w,partDepth-2));
    }
    else if(theme==='garden')add('table',b.x,z,w+4,d+16,c=>table(c,0,0,w,d,true));
    else if(theme==='forest')add('rock',b.x,z,w+6,d+12,c=>rocks(c,0,0,w,d));
    else if(theme==='bathroom'&&b.w>b.d*1.5)add('basin',b.x,z,w+4,d+15,c=>basin(c,0,0,w,d));
    else add('pillar',b.x,z,w+8,d+30,c=>pillar(c,0,0,w,d,theme==='bathroom'));
  }
  const natural=['forest','garden','flight'].includes(theme);
  // Every exposed northern edge gets a short vertical wall, never a ceiling.
  if(!natural&&theme!=='mirror') {
    for(let x=0;x<scene.width;x+=2)for(let z=0;z<=scene.depth;z++){
      if(!floorContains(scene,x+.9,z+.1)||floorContains(scene,x+.9,z-.1))continue;
      const w=Math.min(2,scene.width-x)*16;
      add('wall',x+w/32,z,w+1,28,c=>wall(c,0,0,w,24,theme));
      if((x/2)%4===1&&['coast','train','library','castle'].includes(theme))add('window',x+1,z-.1,30,32,c=>window(c,0,0,theme==='train'));
    }
  }
  if(theme==='coast') {
    // Wall-hung details remain outside the traversable room.
    for(const z of[3,8,13])add('lantern',-.25,z,16,40,c=>lantern(c,0,0));
    add('plant',scene.width+.5,scene.depth-2,26,34,c=>plant(c,0,0));
  }
  if(theme==='alley') {
    for(let x=3;x<scene.width;x+=9)add('lantern',x,scene.depth+.2,16,40,c=>lantern(c,0,0));
    for(let x=6;x<scene.width;x+=15)add('plant',x,-.3,26,34,c=>plant(c,0,0));
  }
  if(theme==='garden'||theme==='forest') {
    const seen=new Set();
    for(const r of regions(scene)){
      for(let x=r.x-r.w/2-1.5;x<=r.x+r.w/2+1.5;x+=3.8)for(const z of[r.z-r.d/2-.8,r.z+r.d/2+2]){
        if(floorContains(scene,x,z))continue;const key=`${Math.round(x/3)},${Math.round(z/3)}`;if(seen.has(key))continue;seen.add(key);add('tree',x,z,54,60,c=>tree(c,0,0,hash(Math.round(x),Math.round(z))));
      }
      for(let z=r.z-r.d/2+2;z<r.z+r.d/2;z+=4.6)for(const x of[r.x-r.w/2-1.6,r.x+r.w/2+1.7]){
        if(floorContains(scene,x,z))continue;const key=`${Math.round(x/3)},${Math.round(z/3)}`;if(seen.has(key))continue;seen.add(key);add('tree',x,z,54,60,c=>tree(c,0,0,hash(Math.round(x),Math.round(z))));
      }
    }
    if(theme==='garden')for(let x=4;x<18;x+=3.2)add('plant',x,29.4,26,34,c=>plant(c,0,0));
  }
  if(theme==='flight')for(let x=4;x<scene.width;x+=7){add('flag',x,-.3,28,52,c=>flag(c,0,0,x%2?C.red:C.blue));add('flag',x,scene.depth+1,28,52,c=>flag(c,0,0,C.red));}
  if(['castle','classroom','library','puzzle'].includes(theme)) {
    for(const r of regions(scene)){
      for(let x=r.x-r.w/2+2;x<r.x+r.w/2;x+=7){const z=r.z-r.d/2-.2;if(!floorContains(scene,x,z))add('lantern',x,z,16,40,c=>lantern(c,0,0));}
    }
  }
  if(theme==='classroom'||theme==='library')for(let z=5;z<scene.depth-1;z+=5){
    add('wall-bookshelf',-1.3,z,40,49,c=>shelf(c,0,0,36,25));
  }
  if(theme==='mirror') {
    for(let i=0;i<10;i++){const a=i*Math.PI/5,x=scene.width/2+Math.sin(a)*(scene.width/2+1),z=scene.depth/2+Math.cos(a)*(scene.depth/2+1);add('outer-pillar',x,z,30,58,c=>pillar(c,0,0,24,20));}
  }
  return objects;
}
