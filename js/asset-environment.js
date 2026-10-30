/**
 * Presentation-only layout for the supplied Chapter 1 GLBs.
 * Existing blockers remain the sole source of solid collision. Decorations are
 * outside the walkable union; ground-level platforms do not change movement.
 * All coordinates are T (one glTF unit), with +Y up and +Z forward.
 */
const SIZES = {
  wall_module:[2,3,.22], greenhouse_wall:[2.08,2.86,.1], window_module:[2,3,.5],
  fireplace:[1.9,2.6,.85], bed:[1.1,1,2.12], dining_table:[1.6,.96,.8],
  wand_shop_front:[2.8,3.4,1.229474719122833], book_shop_front:[2.8,3.4,1.229474719122833], potion_shop_front:[2.8,3.4,1.229474719122833],
  bench:[2.02,1.8,.8], luggage_stack:[1,.88,.635], compartment_window:[2.4,2.8,.275],
  pillar_intact:[1.3,3.15,1.3], pillar_cracked:[1.3,3.15,1.3], pillar_rubble:[1.4142562584,.66,.975],
  classroom_desk:[1.2,1.406762692,.75], bookshelf:[1.8,2.25,.55],
  washbasin_intact:[1.56,1.335,.7], washbasin_shattered:[1.38,.9,.7657797702],
  moving_stairs:[1.4,1.9400842841,2.26], repair_workbench:[1.8,1.175,.8],
  herb_full:[.9487067165,1.19,.8559508647], supply_crate:[1.09,1,1.01],
  rocks:[1.2585149326,1.02,1.0572461436], fallen_wagon:[1.7530996908,2.0415843894,1.5532350967],
};

export function environmentRegions(data) {
  return data.layout?.floorRegions?.length ? data.layout.floorRegions : [{x:data.width/2,z:data.depth/2,w:data.width,d:data.depth}];
}

export function insideEnvironmentFloor(data,x,z) {
  if(data.layout?.boundary==='ellipse') return ((x-data.width/2)/(data.width/2))**2+((z-data.depth/2)/(data.depth/2))**2<=1;
  return environmentRegions(data).some(r=>x>=r.x-r.w/2 && x<=r.x+r.w/2 && z>=r.z-r.d/2 && z<=r.z+r.d/2);
}

/** Exact exposed boundary segments of the rectangular floor-region union. */
export function environmentBoundary(data) {
  if(data.layout?.boundary==='ellipse') return [];
  const regions=environmentRegions(data), xs=[...new Set(regions.flatMap(r=>[r.x-r.w/2,r.x+r.w/2]))].sort((a,b)=>a-b), zs=[...new Set(regions.flatMap(r=>[r.z-r.d/2,r.z+r.d/2]))].sort((a,b)=>a-b), result=[];
  for(const axis of ['x','z']) {
    const fixed=axis==='x'?xs:zs, varying=axis==='x'?zs:xs;
    for(const edge of fixed) {
      let previous=null;
      for(let i=0;i<varying.length-1;i++) {
        const start=varying[i],end=varying[i+1],mid=(start+end)/2;
        const lower=axis==='x'?insideEnvironmentFloor(data,edge-.001,mid):insideEnvironmentFloor(data,mid,edge-.001);
        const upper=axis==='x'?insideEnvironmentFloor(data,edge+.001,mid):insideEnvironmentFloor(data,mid,edge+.001);
        if(lower===upper){previous=null;continue;}
        const side=lower?1:-1;
        if(previous&&previous.side===side&&previous.end===start)previous.end=end;
        else {previous={axis,edge,start,end,side};result.push(previous);}
      }
    }
  }
  return result;
}

/** GLB placements. Asset selection cannot mutate scenes, enemies or save data. */
export function sceneEnvironmentPlacements(data) {
  const out=[],w=data.width,d=data.depth,theme=data.theme,boundary=environmentBoundary(data);
  const add=(pack,file,x,z,options={})=>{const item={pack,file:`${file}.glb`,x,y:0,z,rotation:0,scale:[1,1,1],role:'decoration',...options};out.push(item);return item;};
  const fit=(pack,file,b,height,options={})=>{
    const size=SIZES[file],rotation=options.rotation||0,quarterTurn=Math.abs(Math.sin(rotation))>.5,sw=quarterTurn?size[2]:size[0],sd=quarterTurn?size[0]:size[2];
    const scale=quarterTurn?[b.d/sd,height/size[1],b.w/sw]:[b.w/sw,height/size[1],b.d/sd];
    return add(pack,file,b.x,b.z,{scale,role:'blocker',...options});
  };
  const walls=(pack,file='wall_module',height=2.8)=>{
    // Only back-facing boundaries rise above the camera-side floor trim.
    for(const e of boundary.filter(e=>e.side<0)) {
      const count=Math.ceil((e.end-e.start)/4),length=(e.end-e.start)/count;
      for(let i=0;i<count;i++) {
        const mid=e.start+(i+.5)*length;
        add(pack,file,e.axis==='x'?e.edge-.22:mid,e.axis==='z'?e.edge-.22:mid,{rotation:e.axis==='x'?Math.PI/2:0,scale:[length/SIZES[file][0],height/SIZES[file][1],1]});
      }
    }
  };
  const alongEdges=(spacing,offset,callback)=>{
    let n=0;
    for(const e of boundary){const count=Math.max(1,Math.floor((e.end-e.start)/spacing));for(let i=0;i<count;i++){
      const mid=e.start+(i+.5)*(e.end-e.start)/count,x=e.axis==='x'?e.edge+e.side*offset:mid,z=e.axis==='z'?e.edge+e.side*offset:mid;
      if(!insideEnvironmentFloor(data,x,z))callback(x,z,e,n++);
    }}
  };

  // Match the old collider rectangles using recognizable supplied objects.
  for(const [i,b] of (data.blockers||[]).entries()) {
    if(theme==='alley')fit('SET_ALLEY',['wand_shop_front','book_shop_front','potion_shop_front'][i%3],b,4.2);
    else if(theme==='train') {
      const count=Math.max(1,Math.round(b.w/2.2)),cell=b.w/count;
      for(let j=0;j<count;j++)fit('SET_TRAIN','bench',{x:b.x-b.w/2+cell*(j+.5),z:b.z,w:cell*.98,d:b.d},1.8,{rotation:b.z>d/2?Math.PI:0});
    } else if(theme==='classroom') {
      const count=Math.max(1,Math.round(b.d/2.5)),cell=b.d/count;
      for(let j=0;j<count;j++)fit('SET_CASTLE','classroom_desk',{x:b.x,z:b.z-b.d/2+cell*(j+.5),w:b.w,d:cell*.94},1.3);
    } else if(theme==='library') {
      const count=Math.max(1,Math.round(b.d/2)),cell=b.d/count;
      for(let j=0;j<count;j++)fit('SET_CASTLE','bookshelf',{x:b.x,z:b.z-b.d/2+cell*(j+.5),w:b.w,d:cell*.98},2.9,{rotation:Math.PI/2});
    } else if(theme==='garden') {
      if(b.w>b.d) {
        fit('SET_GREENHOUSE','repair_workbench',b,1.0);
        for(let j=0;j<Math.max(2,Math.floor(b.w/1.8));j++)add('SET_GREENHOUSE','herb_full',b.x-b.w/2+1+j*1.8,b.z,{y:1.0,scale:[.9,.9,.9],role:'blocker'});
      }else fit('SET_GREENHOUSE','supply_crate',b,1.6);
    } else if(theme==='forest') {
      fit('SET_FOREST',i===2?'fallen_wagon':'rocks',b,i===2?1.8:1.3);
    } else if(theme==='castle'&&b.d>b.w*2) {
      fit('SET_CASTLE','moving_stairs',b,2.5);
    } else if(theme==='bathroom'&&b.w>b.d*1.5) {
      fit('SET_CASTLE','washbasin_shattered',b,1.1);
    } else fit('SET_CASTLE',theme==='bathroom'&&i%2?'pillar_cracked':'pillar_intact',b,theme==='mirror'?3.8:3.1);
  }

  if(theme==='coast') {
    walls('SET_HOUSE');
    add('SET_HOUSE','window_module',w*.44,-.33,{scale:[1.1,1,1]});
    add('SET_HOUSE','fireplace',w*.73,-.66);
    // Furnished alcoves lie behind the collision boundary, keeping the letter
    // and Hagrid's approach exactly as authored in Chapter 1.
    add('SET_HOUSE','bed',-1.4,d*.65,{rotation:Math.PI/2,scale:[1.15,1.15,1.15]});
    add('SET_HOUSE','travel_trunk',-1.0,d*.65+2.1);
    add('SET_HOUSE','dining_table',w*.18,-1.2);
    add('SET_HOUSE','chair',w*.18-1.3,-1.1,{rotation:Math.PI/2});
  } else if(theme==='alley') {
    for(let x=4;x<w;x+=9)add('SET_ALLEY','streetlamp',x,d+.7,{scale:[1.1,1.1,1.1]});
    for(let x=5;x<w;x+=13)add('SET_ALLEY','wall_module',x,-.3,{scale:[5,1.3,1]});
    add('SET_ALLEY','wand_box_rack',7,-.45);
    add('SET_ALLEY','book_display',25,-.45);
  } else if(theme==='train') {
    walls('SET_TRAIN', 'wall_module',2.8);
    for(let x=3;x<w;x+=6)add('SET_TRAIN','compartment_window',x,-.27);
    add('SET_TRAIN','luggage_stack',-1,d-1,{scale:[1.3,1.3,1.3]});
    add('SET_TRAIN','snack_cart',w+1.0,d*.52,{rotation:Math.PI/2});
  } else if(theme==='garden') {
    // Glass panes follow the outer greenhouse edge; the path connections stay open.
    for(const e of boundary.filter(e=>e.side<0).slice(0,3)){
      const count=Math.ceil((e.end-e.start)/4),length=(e.end-e.start)/count;
      for(let i=0;i<count;i++){const mid=e.start+(i+.5)*length;add('SET_GREENHOUSE','greenhouse_wall',e.axis==='x'?e.edge-.3:mid,e.axis==='z'?e.edge-.3:mid,{rotation:e.axis==='x'?Math.PI/2:0,scale:[length/2.08,1,1]});}
    }
    alongEdges(9,2.6,(x,z,e,i)=>{if(i%2===0)add('SET_FOREST','oak_tree',x,z,{scale:[.9,.9,.9],rotation:i*.8});else add('SET_FOREST','fence',x,z,{rotation:e.axis==='x'?Math.PI/2:0,scale:[1.8,1,1]});});
    add('SET_HOUSE','window_module',w+1.2,8,{rotation:Math.PI/2});
  } else if(theme==='flight') {
    for(let x=5;x<w;x+=10){add('SET_PITCH','flag',x,-1,{rotation:.2});add('SET_PITCH','flag',x,d+1,{rotation:Math.PI});}
    for(let x=10;x<w-2;x+=16)add('SET_PITCH','spectator_stand',x,-2.4,{scale:[2,1.4,1.4]});
    add('SET_PITCH','takeoff_platform',data.spawn.x,data.spawn.z,{y:-.41,role:'ground'});
    add('SET_PITCH','landing_platform',data.exit.x,data.exit.z,{y:-.45,role:'ground'});
    add('SET_PITCH','broom_repair_bench',-1.3,d*.55,{rotation:Math.PI/2});
  } else if(theme==='forest') {
    alongEdges(7,2.7,(x,z,e,i)=>{
      const bare=i%3===0;add('SET_FOREST',bare?'bare_tree':'oak_tree',x,z,{rotation:i*.73,scale:bare?[1.2,1.2,1.2]:[1,1,1]});
      if(i%3===1)add('SET_FOREST','root_cluster',x,z,{rotation:i*.41,scale:[1.3,1.3,1.3]});
    });
    const start=environmentRegions(data)[0];
    add('SET_FOREST','transport_crate',start.x-3,start.z+start.d/2+1.1);
    add('SET_FOREST','spider_web',start.x+2,start.z+start.d/2+.8,{y:.4,rotation:Math.PI});
  } else if(theme==='mirror') {
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5,x=w/2+Math.sin(a)*(w/2+1.3),z=d/2+Math.cos(a)*(d/2+1.3);
      add('SET_CASTLE','pillar_intact',x,z,{scale:[1,1.25,1],rotation:a});
    }
  } else {
    walls('SET_CASTLE');
    if(theme==='classroom'||theme==='library') {
      for(let z=3;z<d-2;z+=6)add('SET_CASTLE','bookshelf',-.5,z,{rotation:Math.PI/2,scale:[1.4,1.15,1]});
      if(theme==='classroom')add('SET_CASTLE','lectern',w*.7,-.7);
    }
    if(theme==='castle'){
      for(const e of boundary.filter(e=>e.side<0).slice(0,3)){
        const mid=(e.start+e.end)/2;add('SET_CASTLE','portrait_frame',e.axis==='x'?e.edge-.08:mid,e.axis==='z'?e.edge-.08:mid,{y:1.1,rotation:e.axis==='x'?Math.PI/2:0});
      }
    }
    if(theme==='bathroom') {
      for(let z=4;z<d-2;z+=5)add('SET_CASTLE',z>15?'washbasin_shattered':'washbasin_intact',w+.9,z,{rotation:-Math.PI/2});
    }
    if(theme==='puzzle') {
      // Spare pieces border the final chamber; the interactable chess piece
      // and potion answers are owned by the entity presentation instead.
      const last=environmentRegions(data).at(-1);
      ['chess_rook','chess_knight','chess_bishop','chess_queen'].forEach((file,i)=>add('SET_CASTLE',file,last.x-last.w/2+1+i*2.5,last.z-last.d/2-1,{scale:[1.4,1.4,1.4]}));
    }
  }
  return out;
}

export function environmentAssetPaths(data) {
  return [...new Set(sceneEnvironmentPlacements(data).map(p=>`${p.pack}/v1/${p.file}`))];
}
