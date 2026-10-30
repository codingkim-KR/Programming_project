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
  if(theme==='headquarters'){
    rect(ctx,'#594943',x,y,16,16);rect(ctx,'#342f35',x,y+15,16,1);rect(ctx,'#80705a',x,y+1,16,1);
    if((tx+ty%2)%3===0){rect(ctx,'#342f35',x,y,1,16);rect(ctx,'#a18a66',x+2,y+3,1,1);}
    rect(ctx,'#6c594c',x+2,y+6,10,1);rect(ctx,'#493d3b',x+5,y+10,7,1);
    if(h%5===0){rect(ctx,'#302f34',x+9,y+8,3,2);rect(ctx,'#897358',x+8,y+10,5,1);}return;
  }
  if(theme==='ministry'){
    const light=(Math.floor(tx/2)+Math.floor(ty/2))%2===0;
    rect(ctx,light?'#344d4b':'#2f4746',x,y,16,16);
    if(ty%2===1)rect(ctx,'#253c3d',x,y+15,16,1);
    if(tx%2===1)rect(ctx,'#253c3d',x+15,y,1,16);
    if(ty%2===0)rect(ctx,'#435e57',x,y,16,1);
    if(h%19===0)rect(ctx,'#49635b',x+3,y+6,7,1);
    if(tx%12===6&&ty%12===6){rect(ctx,'#95865c',x+7,y+5,2,6);rect(ctx,'#95865c',x+5,y+7,6,2);}return;
  }
  if(theme==='hospital'){
    rect(ctx,(tx+ty)%2?'#c3d2bf':'#a4beb2',x,y,16,16);rect(ctx,'#7e9e97',x,y+15,16,1);rect(ctx,'#7e9e97',x+15,y,1,16);
    rect(ctx,'#e1e5ce',x+1,y+1,13,1);rect(ctx,'#d3dec9',x+1,y+2,1,11);
    if(h%9===0){rect(ctx,'#8eafa2',x+9,y+10,3,1);rect(ctx,'#adbfad',x+10,y+11,3,1);}return;
  }
  if(theme==='cave'){
    rect(ctx,alternate?'#2c4148':'#293e45',x,y,16,16);
    if(h%3===0){rect(ctx,'#21363e',x+3,y+4,1,5);rect(ctx,'#21363e',x+4,y+8,6,1);rect(ctx,'#3d5559',x+5,y+9,5,1);}
    if(h%7===0){rect(ctx,'#385154',x+8,y+3,4,2);rect(ctx,'#4c6260',x+9,y+3,2,1);}
    if(h%11===0){rect(ctx,'#476364',x+2,y+12,2,1);rect(ctx,'#476364',x+11,y+10,1,1);}return;
  }
  if(theme==='observatory'){
    rect(ctx,'#4c526c',x,y,16,16);rect(ctx,'#353c56',x,y+15,16,1);rect(ctx,'#353c56',x+15,y,1,16);rect(ctx,'#778099',x+1,y+1,13,1);
    if((tx+ty)%6===0){rect(ctx,'#c0b17e',x+7,y+6,1,5);rect(ctx,'#c0b17e',x+5,y+8,5,1);rect(ctx,'#ede0ab',x+7,y+8,1,1);}return;
  }
  if(theme==='night-castle'){
    rect(ctx,'#465363',x,y,16,16);rect(ctx,'#293949',x,y+15,16,1);rect(ctx,'#293949',x+(ty%2?7:15),y,1,15);rect(ctx,'#657488',x+1,y+1,13,1);
    if(h%4===0){rect(ctx,'#293949',x+5,y+5,4,1);rect(ctx,'#293949',x+8,y+6,1,4);rect(ctx,'#81908c',x+10,y+11,3,2);}return;
  }
  if(theme==='village'){
    rect(ctx,'#a8bec4',x,y,16,16);rect(ctx,'#c7d7d6',x,y,16,2);
    if(h%4===0){rect(ctx,'#dfe5dc',x+1,y+2,9,3);rect(ctx,'#dfe5dc',x+3,y+5,6,1);}
    rect(ctx,'#7e9ba8',x+2+h%8,y+10,4,1);rect(ctx,'#dbe4dc',x+4+h%6,y+8,3,1);return;
  }
  if(theme==='underwater'){
    rect(ctx,'#365f6e',x,y,16,16);rect(ctx,'#284e61',x,y+15,16,1);
    if(h%3===0){rect(ctx,'#5a8990',x+2,y+3,5,1);rect(ctx,'#4c7e87',x+6,y+4,5,1);rect(ctx,'#6c9b9c',x+3,y+2,2,1);}
    if(h%13===0){rect(ctx,'#274e5e',x+8,y+7,3,3);rect(ctx,'#b1b69b',x+8,y+7,2,1);}
    return;
  }
  if(['lake','camp','maze','graveyard'].includes(theme)){
    const palettes={lake:['#405d59','#2a464a','#6c8371'],camp:['#668058','#456043','#8ca166'],maze:['#77816a','#596953','#a0aa7b'],graveyard:['#3b4e50','#293b45','#68766c']};
    const [base,dark,light]=palettes[theme];rect(ctx,base,x,y,16,16);
    for(let i=0;i<2;i++){const px=x+2+hash(tx,ty,i+4)%11,py=y+3+hash(tx,ty,i+7)%9;rect(ctx,dark,px,py,2,2);rect(ctx,light,px+1,py-1,1,2);}
    if(theme==='maze'&&h%7===0){rect(ctx,'#b3ad7f',x+7,y+6,2,5);rect(ctx,'#a2a77a',x+5,y+8,6,1);}
    if(theme==='graveyard'&&h%9===0){rect(ctx,'#768477',x+4,y+10,6,1);rect(ctx,'#4d5d5d',x+3,y+11,8,1);}return;
  }

  if(theme==='coast'||theme==='train'||theme==='library'||theme==='burrow') {
    const base=theme==='library'?'#825943':theme==='train'?'#986645':theme==='burrow'?'#b08154':C.wood;
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
  if(theme==='sky'){
    rect(ctx,'#7ca9b2',x,y,16,16);
    if(h%29===0){rect(ctx,'#bbd1cb',x+1,y+6,14,4);rect(ctx,'#dbe3d2',x+4,y+4,8,3);}
    return;
  }
  if(theme==='sewer'||theme==='chamber'){
    const chamber=theme==='chamber';rect(ctx,chamber?'#55716c':'#667d76',x,y,16,16);
    rect(ctx,chamber?'#344f52':'#415e61',x,y+15,16,1);
    if((tx+ty)%2===0)rect(ctx,chamber?'#344f52':'#415e61',x+15,y,1,16);
    rect(ctx,chamber?'#859685':'#93a397',x+2,y+1,11,1);
    if(h%9===0){rect(ctx,'#37544d',x+3,y+9,6,2);rect(ctx,'#70906a',x+4,y+9,3,1);}
    if(chamber&&(tx+ty)%7===0){rect(ctx,'#9f9e71',x+7,y+6,2,5);rect(ctx,'#b7b68a',x+5,y+8,6,1);}
    return;
  }
  if(theme==='courtyard'){
    rect(ctx,'#a0a58b',x,y,16,16);rect(ctx,'#6b8074',x,y+15,16,1);rect(ctx,'#6b8074',x+15,y,1,16);rect(ctx,'#c1c4a5',x+1,y+1,13,1);
    if(h%5===0){rect(ctx,'#5a7957',x+13,y+11,2,4);rect(ctx,'#75945e',x+12,y+13,2,2);}return;
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
  if(theme==='headquarters')for(const room of regions(scene)){
    if(room.w>=5&&room.d>=5)rug(ctx,room.x*16,room.z*16,Math.min(80,(room.w-2)*16),Math.min(100,(room.d-2)*16),'#6c3d4f');
  }
  if(theme==='ministry')for(const room of regions(scene)){
    const l=(room.x-room.w/2)*16+8,t=(room.z-room.d/2)*16+8,w=room.w*16-16,d=room.d*16-16;
    if(w>16&&d>16){rect(ctx,'#b6a271',l,t,w,1);rect(ctx,'#b6a271',l,t+d,w,1);rect(ctx,'#b6a271',l,t,1,d);rect(ctx,'#b6a271',l+w,t,1,d);}
  }
  if(theme==='observatory'){
    const room=regions(scene).at(-1),radius=Math.max(10,Math.floor(Math.min(room.w,room.d)*6));
    pixelRing(ctx,room.x*16,room.z*16,radius,'#bcb18b');pixelRing(ctx,room.x*16,room.z*16,radius-3,'#717f9a');
    for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.round(room.x*16+Math.sin(a)*radius),y=Math.round(room.z*16+Math.cos(a)*radius);rect(ctx,'#ead7a0',x-1,y-2,3,5);rect(ctx,'#ead7a0',x-2,y-1,5,3);}
  }
  if(['garden','forest','camp','village','graveyard','lake'].includes(theme)) {
    const points=[scene.spawn,...(scene.entities||[]).filter(e=>!['enemy','boss'].includes(e.type)).map(e=>({x:e.x,z:e.z})),scene.exit].filter(Boolean);
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)*2);
      for(let n=0;n<=steps;n++){
        const x=a.x+(b.x-a.x)*n/Math.max(1,steps),z=a.z+(b.z-a.z)*n/Math.max(1,steps);
        const px=Math.floor(x*16/4)*4,py=Math.floor(z*16/4)*4;
        for(let yy=-8;yy<=8;yy+=4)for(let xx=-8;xx<=8;xx+=4){
          if(!floorContains(scene,(px+xx+2)/16,(py+yy+2)/16))continue;
          if(xx*xx+yy*yy>85)continue;
          rect(ctx,theme==='village'?(hash(px+xx,py+yy)%5?'#83969e':'#9eafb2'):theme==='graveyard'?'#536468':theme==='lake'?'#6f8072':theme==='forest'?(hash(px+xx,py+yy)%5?'#686448':'#777153'):(hash(px+xx,py+yy)%5?'#a38b5d':'#b49b68'),px+xx,py+yy,4,4);
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
  if(theme==='burrow'){rug(ctx,scene.width*8,scene.depth*8,118,68,'#8b554d');for(let i=0;i<3;i++)rug(ctx,48+i*80,32,42,22,['#6d784f','#6e657c','#995f4d'][i]);}
  if(theme==='sewer')for(const r of regions(scene)){for(let x=r.x-r.w/2+3;x<r.x+r.w/2-1;x+=8){const y=(r.z+r.d/2-1)*16;rect(ctx,C.ink,x*16-6,y-5,14,10);for(let j=0;j<4;j++)rect(ctx,'#82998b',x*16-4+j*3,y-4,1,8);}}
  if(theme==='chamber'){const cx=scene.width*8,cy=scene.depth*8;pixelRing(ctx,cx,cy,72,'#829679');pixelRing(ctx,cx,cy,75,'#314e4f');for(let yy=-32;yy<=32;yy++){const xx=Math.round(Math.sin(yy/14)*19);rect(ctx,'#344f4d',cx+xx-3,cy+yy,7,1);rect(ctx,'#acaa77',cx+xx-2,cy+yy,2,1);}}
  if(theme==='courtyard'){for(let x=2;x<scene.width-1;x+=3)for(const z of[2,scene.depth-2]){rect(ctx,'#57764c',x*16-5,z*16-4,10,8);rect(ctx,'#8a9d5d',x*16-3,z*16-3,6,5);rect(ctx,['#dcac78','#e1d2a6','#a88ea5'][Math.floor(x)%3],x*16,z*16-3,2,2);}}
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
  if(theme==='flight'&&scene.layout?.vehicle!=='car') {
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
  const natural=['garden','forest','flight','courtyard','village','lake','underwater','camp','maze','graveyard'].includes(scene.theme);
  const laterBackdrop={headquarters:'#25232e',ministry:'#172e34',hospital:'#425b62',cave:'#132e3a',observatory:'#192439','night-castle':'#1c2a3c'};
  rect(ctx,laterBackdrop[scene.theme]||(scene.theme==='lake'?'#203d4e':scene.theme==='underwater'?'#193e54':scene.theme==='village'?'#6e8898':scene.theme==='flight'&&scene.layout?.vehicle==='car'?'#7ca9b2':['sewer','chamber'].includes(scene.theme)?'#294e59':scene.theme==='coast'?'#315b70':natural?'#213f38':'#223340'),-64,-64,scene.width*16+128,scene.depth*16+128);
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
    tile(ctx,scene.theme==='flight'&&scene.layout?.vehicle==='car'?'sky':scene.theme,tx*16,ty*16,tx,ty);
  }
  floorPath(ctx,scene);
  ctx.restore();
  if(['coast','sewer','chamber','lake','underwater','cave'].includes(scene.theme)){
    for(let y=-32;y<scene.depth*16+48;y+=19)for(let x=-48;x<scene.width*16+48;x+=37){
      if(floorContains(scene,x/16,y/16))continue;
      rect(ctx,scene.theme==='cave'?'#315563':'#558496',x+(Math.floor(y/19)%2)*13,y,12,1);rect(ctx,scene.theme==='cave'?'#527a82':'#91b2b2',x+2,y+1,5,1);
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
function pipe(ctx,x,y,w,d) {
  const l=x-w/2,t=y-d-10;
  rect(ctx,C.ink,l-2,t-2,w+4,d+13);rect(ctx,'#3e6668',l,t,w,d+9);
  rect(ctx,'#86a29a',l+2,t+1,w-4,3);rect(ctx,'#284a53',l+2,y-5,w-4,4);
  for(let xx=l+5;xx<l+w-2;xx+=20){rect(ctx,C.ink,xx,t-2,5,d+13);rect(ctx,'#9a9981',xx+1,t-1,3,d+11);rect(ctx,C.gold,xx+2,t+3,1,2);}
}
function snakePillar(ctx,x,y,w,d) {
  pillar(ctx,x,y,w,d,false);
  const top=y-d-25;
  rect(ctx,'#324f4c',x-5,top+13,11,13);rect(ctx,'#7c9a77',x-4,top+14,9,10);
  rect(ctx,C.gold,x-3,top+17,2,2);rect(ctx,C.gold,x+2,top+17,2,2);
  rect(ctx,C.ink,x-1,top+21,3,4);rect(ctx,C.cream,x-2,top+21,1,3);rect(ctx,C.cream,x+2,top+21,1,3);
  rect(ctx,'#60816d',x-2,y-7,5,4);
}
function hearth(ctx,x,y) {
  rect(ctx,C.ink,x-19,y-35,38,36);rect(ctx,'#9b7255',x-17,y-33,34,32);rect(ctx,C.woodLight,x-20,y-36,40,5);
  rect(ctx,'#463a36',x-11,y-24,22,23);rect(ctx,'#bd6442',x-8,y-13,16,10);rect(ctx,'#e8a85b',x-5,y-17,10,14);rect(ctx,C.cream,x-2,y-12,4,8);
  rect(ctx,C.woodDark,x-13,y-3,26,3);rect(ctx,C.woodLight,x-11,y-4,22,1);
  rect(ctx,C.ink,x-4,y-47,9,10);rect(ctx,'#c0a075',x-3,y-46,7,8);rect(ctx,C.ink,x,y-45,1,5);rect(ctx,C.ink,x,y-42,3,1);
}
function laundry(ctx,x,y) {
  rect(ctx,C.woodDark,x-26,y-31,2,31);rect(ctx,C.woodDark,x+25,y-31,2,31);
  rect(ctx,C.cream,x-25,y-29,52,1);
  for(let i=0;i<4;i++){const xx=x-22+i*13,c=['#b67861','#b9bb8a','#6f9498','#c1a66d'][i];rect(ctx,C.ink,xx,y-28,11,15);rect(ctx,c,xx+1,y-27,9,13);rect(ctx,C.cream,xx+4,y-27,1,9);rect(ctx,C.woodDark,xx+2,y-30,1,3);}
}

function hedge(ctx,x,y,w,d){
  const l=x-w/2,t=y-d-13;
  rect(ctx,'#192f32',l,t,w,d+14);rect(ctx,'#2e5140',l+1,t+2,w-2,d+10);
  rect(ctx,'#416a46',l+1,t+2,w-2,Math.max(3,d-2));rect(ctx,'#709454',l+2,t+2,w-4,2);
  for(let yy=t+5;yy<y;yy+=7)for(let xx=l+3;xx<l+w-3;xx+=9){rect(ctx,'#557d49',xx,yy,5,2);rect(ctx,'#263e35',xx+3,yy+3,4,1);}
  rect(ctx,'#263c34',l+1,y-3,w-2,4);
}
function snowHouse(ctx,x,y,w,d,index){
  shop(ctx,x,y,w,d,index);
  const top=y-d-29,l=x-w/2;
  rect(ctx,'#d9e4db',l-2,top-2,w+4,4);rect(ctx,'#a7bcc5',l-2,top+2,w+4,2);
  for(let xx=l+4;xx<l+w;xx+=13)rect(ctx,'#d9e4db',xx,top+2,3,4);
}
function campsite(ctx,x,y,w,d,index){
  const l=x-w/2,t=y-d-13,c=['#a86550','#476e7c','#8a8053'][index%3];
  rect(ctx,C.ink,l,t,w,d+14);rect(ctx,c,l+2,t+2,w-4,d+10);
  for(let yy=t;yy<t+18;yy++){const inset=Math.max(0,Math.round((18-(yy-t))*w/40));rect(ctx,C.ink,l+inset,yy,w-inset*2,1);rect(ctx,c,l+inset+2,yy+1,Math.max(1,w-inset*2-4),1);}
  rect(ctx,C.cream,l+3,t+18,w-6,2);rect(ctx,C.ink,x-5,y-16,10,16);rect(ctx,C.gold,x-1,t-5,2,6);
}
function gravestone(ctx,x,y,w,d){
  const l=x-w/2,t=y-d-16;
  rect(ctx,C.ink,l,t+6,w,d+11);rect(ctx,'#647b80',l+2,t+7,w-4,d+7);
  rect(ctx,C.ink,l+3,t+1,w-6,8);rect(ctx,'#8ba1a0',l+4,t+2,w-8,7);
  rect(ctx,'#a6b2a6',l+3,t+8,2,d+4);rect(ctx,'#344e58',x-1,t+6,3,11);rect(ctx,'#344e58',x-5,t+10,11,3);
  rect(ctx,C.ink,l-2,y-3,w+4,5);rect(ctx,'#526c6b',l-1,y-2,w+2,3);
}
function reed(ctx,x,y,underwater=false){
  const dark=underwater?'#345d58':'#526c4d',light=underwater?'#82bca1':'#9baf6b';
  for(let i=0;i<4;i++){const xx=x-6+i*4,top=y-10-(i%3)*4;rect(ctx,dark,xx,top,2,y-top);rect(ctx,light,xx+1,top-2,1,5);rect(ctx,light,xx-2,top+3,3,1);}
}

// The later interiors use detailed, footprint-sized furniture and masonry.
// Raised artwork may extend north of its base, but no block changes collision.
function masonry(ctx,x,y,w,d,theme='night-castle'){
  const l=Math.round(x-w/2),t=Math.round(y-d-14),pal=theme==='ministry'?['#3b5c55','#9c9672','#223d40']:theme==='observatory'?['#525c77','#808aa0','#303c54']:['#465a6a','#778999','#2c3c4d'];
  rect(ctx,C.ink,l,t+3,w,d+11);rect(ctx,pal[0],l+1,t+4,w-2,d+9);rect(ctx,pal[1],l+1,t+4,w-2,2);
  for(let yy=t+11;yy<y-1;yy+=8){
    rect(ctx,pal[2],l+1,yy,w-2,1);
    for(let xx=l+1+((yy-t)%16?5:11);xx<l+w-1;xx+=14){rect(ctx,pal[2],xx,yy-6,1,6);if(xx+3<l+w-1)rect(ctx,pal[1],xx+2,yy-5,2,1);}
  }
  for(let xx=l+2;xx<l+w-2;xx+=11){const span=Math.min(8,l+w-1-xx);rect(ctx,pal[2],xx,t,span,4);rect(ctx,pal[1],xx+1,t,Math.max(1,span-2),1);}
  rect(ctx,pal[2],l+1,y-3,w-2,3);rect(ctx,pal[1],l+2,y-3,Math.max(2,w-5),1);
  const crack=l+Math.floor(w*.6);rect(ctx,C.ink,crack,t+6,1,5);rect(ctx,C.ink,crack-1,t+11,1,4);rect(ctx,pal[1],crack+1,t+7,1,3);
}
function archiveShelf(ctx,x,y,w,d){
  const l=Math.round(x-w/2),t=Math.round(y-d-25);
  rect(ctx,C.ink,l,t,w,d+25);rect(ctx,'#294b48',l+1,t+1,w-2,d+22);
  rect(ctx,'#a8996b',l+1,t+1,w-2,2);rect(ctx,'#688776',l+1,t+3,2,d+19);rect(ctx,'#172e34',l+w-3,t+3,2,d+19);
  for(let yy=t+11;yy<y-2;yy+=11){
    rect(ctx,'#192f35',l+3,yy-7,w-6,7);rect(ctx,'#b4a272',l+2,yy,w-4,2);
    for(let xx=l+5;xx<l+w-4;xx+=9){rect(ctx,'#346776',xx,yy-6,4,4);rect(ctx,'#92c4bf',xx,yy-6,2,2);rect(ctx,'#bfae7d',xx,yy-2,4,1);}
  }
  rect(ctx,'#688776',l+1,y-2,w-2,2);
}
function hospitalBed(ctx,x,y,w,d){
  const l=Math.round(x-w/2),t=Math.round(y-d-8),inner=Math.max(2,w-6);
  rect(ctx,C.ink,l,t,w,d+8);rect(ctx,'#749892',l+1,t+1,w-2,d+6);rect(ctx,'#c7d8cc',l+2,t+2,w-4,d+4);
  rect(ctx,'#edf0d9',l+3,t+4,inner,Math.max(2,Math.min(9,d-3)));rect(ctx,'#a4bbb0',l+4,t+5,Math.max(1,inner-2),1);
  const blanketTop=t+Math.min(15,d+2);rect(ctx,'#80aa9d',l+3,blanketTop,inner,Math.max(2,y-blanketTop-3));
  rect(ctx,'#b9d0bb',l+3,blanketTop,inner,2);rect(ctx,'#63918b',l+w-5,blanketTop+2,2,Math.max(1,y-blanketTop-5));
  for(let xx=l+6;xx<l+w-6;xx+=7){rect(ctx,'#9fc2ad',xx,blanketTop+3,1,Math.max(1,y-blanketTop-7));rect(ctx,'#56817d',xx,y-3,1,1);}
  rect(ctx,'#c5d9bf',l+5,blanketTop+3,Math.max(1,w-12),1);rect(ctx,'#d5dfcb',l+4,t+8,Math.max(1,w-10),1);
  rect(ctx,'#dae3ce',l+1,t+1,2,d+6);rect(ctx,'#dae3ce',l+w-3,t+1,2,d+6);
  rect(ctx,'#4e7472',l+1,y-3,w-2,3);rect(ctx,'#e4e8d2',l+1,y-4,w-2,1);
}
function cavernRock(ctx,x,y,w,d){
  const l=Math.round(x-w/2),t=Math.round(y-d-12),cols=Math.max(1,Math.ceil(w/22)),rows=Math.max(1,Math.ceil(d/20));
  // Low bedrock fills the authored footprint. Unequal stepped boulders rise from
  // it; their facets and silhouettes avoid the old rectangular pillar look.
  rect(ctx,'#243e48',l,y-d,w,d);rect(ctx,'#42645f',l+1,y-2,w-2,2);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const bx=l+Math.floor(col*w/cols),bw=Math.floor((col+1)*w/cols)-Math.floor(col*w/cols);
    const by=t+Math.floor(row*(d+11)/rows)+hash(col,row)%4,bottom=t+Math.floor((row+1)*(d+11)/rows),bh=Math.max(8,bottom-by);
    const cut=Math.min(3,Math.floor(bw/4)),base=hash(row,col)%2?'#4d6570':'#5b7176';
    rect(ctx,'#1b323d',bx+cut,by,bw-cut*2,bh);rect(ctx,'#1b323d',bx,by+3,bw,bh-6);
    rect(ctx,base,bx+cut,by+1,bw-cut*2,bh-2);rect(ctx,base,bx+1,by+4,bw-2,bh-8);
    rect(ctx,'#81918a',bx+cut+1,by+2,Math.max(1,bw-cut*2-3),1);rect(ctx,'#6b817f',bx+2,by+5,2,Math.max(1,bh-10));
    rect(ctx,'#344d59',bx+cut,by+bh-4,bw-cut*2,3);rect(ctx,'#253e49',bx+bw-4,by+6,2,Math.max(1,bh-11));
    const crack=bx+Math.floor(bw*.6);rect(ctx,'#29444e',crack,by+5,1,4);rect(ctx,'#29444e',crack-1,by+9,1,2);rect(ctx,'#9a9f8c',bx+cut+1,by+4,2,1);
  }
}
function observatoryStand(ctx,x,y,w,d){
  masonry(ctx,x,y,w,d,'observatory');
  if(w<20)return;
  const cy=Math.round(y-d-12),radius=Math.max(4,Math.min(12,Math.floor(w/2)-3));
  pixelRing(ctx,x,cy-radius,radius,'#bca36d');pixelRing(ctx,x,cy-radius,radius-2,'#ded0a3');
  rect(ctx,'#314151',x-2,cy-radius*2+2,4,radius*2+3);rect(ctx,'#bca36d',x-1,cy-radius*2+3,2,radius*2+1);
  rect(ctx,'#bca36d',x-radius,cy-radius,2*radius+1,1);rect(ctx,'#e5dbae',x-1,cy-radius-1,3,3);
}
function portrait(ctx,x,y){
  rect(ctx,C.ink,x-11,y-33,22,31);rect(ctx,C.gold,x-10,y-32,20,29);rect(ctx,C.woodDark,x-8,y-30,16,25);rect(ctx,'#454355',x-7,y-29,14,23);
  rect(ctx,'#aaa28a',x-3,y-25,7,8);rect(ctx,'#d0c2a0',x-2,y-24,4,5);rect(ctx,'#2c3442',x-5,y-17,10,10);rect(ctx,'#7e8294',x-3,y-17,2,7);rect(ctx,C.gold,x-5,y-4,10,1);
}

function wall(ctx,x,y,w,h=24,theme='castle') {
  const l=x-w/2,t=y-h;
  const later={headquarters:['#62534f','#a49072','#3d363d'],ministry:['#315953','#9b9872','#1e3f41'],hospital:['#b3c9bb','#e3e6cb','#7faaa0'],observatory:['#414e6c','#8c96b0','#29364e'],'night-castle':['#3a4d61','#78899b','#23374b']}[theme];
  rect(ctx,C.ink,l,t,w,h+1);rect(ctx,later?.[0]||(theme==='burrow'?'#bcab83':theme==='coast'?'#715847':'#607889'),l+1,t+2,w-2,h-3);rect(ctx,later?.[1]||(theme==='coast'?'#c29b6b':'#a8b8b4'),l,t,w,3);
  const c=later?.[2]||(theme==='coast'?'#4c423b':'#405969');
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
    const later=theme==='ministry'&&scene.layout?.kind==='atrium'?['atrium-pier',d+14,c=>masonry(c,0,0,w,d,'ministry')]:{headquarters:['headquarters-shelf',d+26,c=>shelf(c,0,0,w,d)],ministry:['archive-shelf',d+26,c=>archiveShelf(c,0,0,w,d)],hospital:['hospital-bed',d+10,c=>hospitalBed(c,0,0,w,d)],cave:['cave-rock',d+15,c=>cavernRock(c,0,0,w,d)],observatory:['orrery-plinth',d+42,c=>observatoryStand(c,0,0,w,d)],'night-castle':['broken-masonry',d+16,c=>masonry(c,0,0,w,d)]}[theme];
    if(later){
      add(later[0],b.x,z,w,later[1],later[2]);
      objects.at(-1).footprint={x:b.x,z:b.z,w:b.w,d:b.d};objects.at(-1).blocker=true;
    }
    else if(theme==='maze')add('hedge',b.x,z,w+4,d+18,c=>hedge(c,0,0,w,d));
    else if(theme==='graveyard')add('gravestone',b.x,z,w+6,d+22,c=>gravestone(c,0,0,w,d));
    else if(theme==='village')add('snow-house',b.x,z,w+8,d+42,c=>snowHouse(c,0,0,w,d,i));
    else if(theme==='camp')add('tent',b.x,z,w+4,d+24,c=>campsite(c,0,0,w,d,i));
    else if(theme==='lake'||theme==='underwater')add('lake-rock',b.x,z,w+6,d+12,c=>rocks(c,0,0,w,d));
    else if(theme==='burrow')add('kitchen-table',b.x,z,w+4,d+16,c=>table(c,0,0,w,d));
    else if(theme==='sewer')add('pipe',b.x,z,w+6,d+18,c=>pipe(c,0,0,w,d));
    else if(theme==='chamber')add('serpent-pillar',b.x,z,w+8,d+30,c=>snakePillar(c,0,0,w,d));
    else if(theme==='alley')add('shop',b.x,z,w+8,d+36,c=>shop(c,0,0,w,d,i));
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
  const natural=['forest','garden','flight','courtyard','village','lake','underwater','camp','maze','graveyard','cave'].includes(theme);
  // Every exposed northern edge gets a short vertical wall, never a ceiling.
  if(!natural&&theme!=='mirror') {
    for(let x=0;x<scene.width;x+=2)for(let z=0;z<=scene.depth;z++){
      if(!floorContains(scene,x+.9,z+.1)||floorContains(scene,x+.9,z-.1))continue;
      const w=Math.min(2,scene.width-x)*16;
      add('wall',x+w/32,z,w+1,28,c=>wall(c,0,0,w,24,theme));
      if((x/2)%4===1&&['coast','train','library','castle','burrow'].includes(theme))add('window',x+1,z-.1,30,32,c=>window(c,0,0,theme==='train'));
    }
  }
  if(['village','camp','graveyard'].includes(theme))for(let x=3;x<scene.width;x+=9){
    add('lantern',x,-.4,16,40,c=>lantern(c,0,0));
    if(theme==='village')add('snow-pine',x,scene.depth+2,54,60,c=>{tree(c,0,0,1);rect(c,'#dbe5dc',-14,-45,23,3);rect(c,'#b9d1d0',-21,-31,29,2);});
  }
  if(theme==='lake'||theme==='underwater')for(const r of regions(scene)){
    for(let x=r.x-r.w/2+1;x<r.x+r.w/2;x+=3.5)for(const z of[r.z-r.d/2-.4,r.z+r.d/2+.8]){
      if(!floorContains(scene,x,z))add('reeds',x,z,20,24,c=>reed(c,0,0,theme==='underwater'));
    }
  }
  if(theme==='maze'){
    const seen=new Set();
    for(const r of regions(scene))for(let x=r.x-r.w/2;x<r.x+r.w/2;x+=1)for(const z of[r.z-r.d/2-.5,r.z+r.d/2+.5]){
      if(floorContains(scene,x+.5,z))continue;const key=`${x},${z}`;if(seen.has(key))continue;seen.add(key);add('border-hedge',x+.5,z+.5,18,34,c=>hedge(c,0,0,16,16));
    }
    for(const r of regions(scene))for(let z=r.z-r.d/2;z<r.z+r.d/2;z+=1)for(const x of[r.x-r.w/2-.5,r.x+r.w/2+.5]){
      if(floorContains(scene,x,z+.5))continue;const key=`${x},${z}`;if(seen.has(key))continue;seen.add(key);add('border-hedge',x,z+1,18,34,c=>hedge(c,0,0,16,16));
    }
  }
  if(theme==='burrow'){add('hearth',scene.width/2,-.1,46,52,c=>hearth(c,0,0));add('laundry',scene.width-3,scene.depth+1,58,36,c=>laundry(c,0,0));for(let z=5;z<scene.depth;z+=7)add('plant',-.5,z,26,34,c=>plant(c,0,0));}
  if(theme==='sewer'||theme==='chamber'){for(let x=3;x<scene.width;x+=8){add('lantern',x,-.2,16,40,c=>lantern(c,0,0));if(theme==='chamber')add('serpent-carving',x,scene.depth+1,30,58,c=>snakePillar(c,0,0,24,20));}}
  if(theme==='courtyard'){for(let x=4;x<scene.width;x+=7){add('tree',x,-1,54,60,c=>tree(c,0,0,1));add('plant',x,scene.depth+1,26,34,c=>plant(c,0,0));}for(let z=4;z<scene.depth;z+=8)add('flag',-.8,z,28,52,c=>flag(c,0,0,C.red));}
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
  if(theme==='flight'&&scene.layout?.vehicle!=='car')for(let x=4;x<scene.width;x+=7){add('flag',x,-.3,28,52,c=>flag(c,0,0,x%2?C.red:C.blue));add('flag',x,scene.depth+1,28,52,c=>flag(c,0,0,C.red));}
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
  if(['headquarters','ministry','hospital','cave','observatory','night-castle'].includes(theme)){
    // Check each decoration's entire ground footprint against the region union.
    // A neighbouring room cannot accidentally acquire an invisible obstruction.
    const outside=(x,z,w,d)=>{
      const l=x-w/2,r=x+w/2,t=z-d/2,b=z+d/2;
      for(let px=l;px<=r+.001;px+=Math.min(.25,w))for(let pz=t;pz<=b+.001;pz+=Math.min(.25,d))if(floorContains(scene,px,pz))return false;
      return !(scene.blockers||[]).some(s=>Math.abs(s.x-x)<(s.w+w)/2&&Math.abs(s.z-z)<(s.d+d)/2);
    };
    const seen=new Set();
    for(const room of regions(scene))for(let x=room.x-room.w/2+2;x<room.x+room.w/2;x+=6){
      const z=room.z-room.d/2-.8,key=`${x},${z}`;
      if(seen.has(key)||!outside(x,z,2,.5))continue;seen.add(key);
      if(theme==='headquarters')add('wall-portrait',x,z,24,36,c=>portrait(c,0,0));
      if(theme==='ministry')add('ministry-lamp',x,z,16,40,c=>lantern(c,0,0));
      if(theme==='hospital')add('medicine-shelf',x,z,28,42,c=>shelf(c,0,0,24,18));
      if(theme==='cave')add('outer-stalagmite',x,z,30,35,c=>cavernRock(c,0,0,28,20));
      if(theme==='observatory')add('outer-astrolabe',x,z,30,54,c=>observatoryStand(c,0,0,28,16));
      if(theme==='night-castle')add('night-banner',x,z,28,52,c=>flag(c,0,0,'#515c88'));
      objects.at(-1).decoration=true;objects.at(-1).footprint={x,z,w:2,d:.5};
    }
  }
  return objects;
}
