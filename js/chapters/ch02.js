const L=(speaker,text)=>({speaker,text});
const O=(id,label,event,target,spell,hint)=>({id,label,event,...(target?{target}:{}),...(spell?{spell}:{}),count:1,...(hint?{hint}:{})});
const P=(id,name,x,z,kind='book',extra={})=>({id,type:'prop',kind,name,x,z,radius:.8,...extra});
const N=(id,name,x,z,dialogue,extra={})=>({id,type:'npc',kind:'wizard',name,x,z,radius:.75,dialogue,...extra});
const R=(gold=0,items={},equipment=[],spells=[])=>({gold,items,equipment,spells});
const basics=['S001','S002','S003','S005','S007','S026','S034','S035','S036','S037','S038','S039'];
const S=(id,name,theme,description,extra)=>({id,chapterId:'ch02',name,theme,description,kicker:`CHAPTER II · ${id}`,width:36,depth:28,spawn:{x:5,z:23},exit:{x:31,z:5},entryDialogue:[],entities:[],blockers:[],objectives:[],grantSpells:[],reward:R(),combat:{maxTelegraphs:3},nextId:`2-${String(Number(id.slice(2))+1).padStart(2,'0')}`,...extra});
function pack(prefix,label,points,kind,conditions=[],tuning={}){
 const units=points.map(([x,z],i)=>({id:`${prefix}.${i+1}`,type:'enemy',kind,pattern:kind,name:label,x,z,radius:kind==='pixie'?.5:.7,hp:kind==='duelist'?42:kind==='pixie'?24:36,damage:12,speed:kind==='pixie'?2.8:2.1,conditions:[...conditions],hiddenUntilAvailable:true,combat:{startDelay:1.2+i*.35,reactionDelay:.7,aggroRange:24,attackRange:17,...tuning}}));
 return{units,goals:units.map((u,i)=>O(`${u.id}.cleared`,`${label} 무리 제압 (${i+1}/${units.length})`,'kill',u.id)),ids:units.map(u=>`${u.id}.cleared`)};
}
const alleyA=pack('2-03.alley-a','골목의 픽시',[[12,12],[15,15],[18,10]],'pixie',['2-03.route']);
const alleyB=pack('2-03.alley-b','상자 속 독거미',[[27,11],[31,15],[34,10]],'venom-spider',alleyA.ids,{attackRange:14});
const duelA=pack('2-06.duel-a','결투 연습생',[[15,11],[20,9],[25,12]],'duelist',['2-06.disarm','2-06.dispel','2-06.stun'],{attackRange:18});
const duelB=pack('2-06.duel-b','합동 결투 연습생',[[13,8],[20,6],[28,8]],'duelist',duelA.ids,{startDelay:1.4,attackRange:20});
const gardenA=pack('2-07.pixie-a','온실의 픽시',[[17,21],[22,18],[25,23]],'pixie',['2-07.lesson']);
const gardenB=pack('2-07.pixie-b','온실의 픽시',[[31,15],[34,11],[38,17]],'pixie',gardenA.ids,{startDelay:1.1});
const archiveA=pack('2-08.archive-a','재료실의 독거미',[[13,25],[18,24],[14,19]],'venom-spider',['2-08.plan']);
const archiveB=pack('2-08.archive-b','선반의 독거미',[[24,13],[28,9],[22,7]],'venom-spider',archiveA.ids,{startDelay:1.1});
const sewerA=pack('2-09.sewer-a','배수로의 뱀',[[19,21],[23,23],[25,19],[28,23]],'serpent',['2-09.lesson']);
const sewerB=pack('2-09.sewer-b','배수로의 독거미',[[36,21],[40,18],[43,21],[38,24]],'venom-spider',sewerA.ids,{startDelay:1.1});
const forestA=pack('2-10.forest-a','달려드는 거미',[[17,29],[21,30],[20,36],[24,34]],'venom-spider',['2-10.testimony'],{aggroRange:23,attackRange:14});
const forestB=pack('2-10.forest-b','밀려오는 거미',[[8,26],[13,25],[19,25],[25,26],[25,38],[19,40],[11,39],[5,32]],'venom-spider',forestA.ids,{startDelay:1.6,aggroRange:28,attackRange:15});
const forestGoals=[...forestA.goals.map(o=>({...o,label:'달려드는 거미 4마리를 처치하세요',group:'2-10.first-wave',groupLabel:'달려드는 거미 처치',groupTotal:4,conditions:['2-10.testimony']})),...forestB.goals.map(o=>({...o,label:'밀려오는 거미 8마리를 처치하세요',group:'2-10.second-wave',groupLabel:'밀려오는 거미 처치',groupTotal:8,conditions:forestA.ids}))];
const searchA=pack('2-11.search-a','배관의 뱀',[[17,23],[22,25],[24,20]],'serpent',['2-11.witness']);
const searchB=pack('2-11.search-b','배관의 뱀',[[29,13],[34,12],[32,8]],'serpent',searchA.ids,{startDelay:1});
const chamberAdds=pack('2-12.guards','석문 틈의 뱀',[[12,16],[39,15],[12,25],[39,26]],'serpent',['2-12.gate'],{startDelay:1.8,aggroRange:24,attackRange:15});

export const CHAPTER={id:'ch02',title:'비밀의 방',subtitle:'돌벽 너머에서 들려온 목소리',version:'0.5.1',scenes:[
 S('2-01','도비의 경고','burrow','닫힌 방문 안에 낯선 손님이 있습니다. 편지와 경고를 확인하고 친구의 도움을 받으세요.',{
  width:24,depth:18,spawn:{x:5,z:13},exit:{x:20,z:4},layout:{kind:'bedroom'},grantSpells:basics,rest:true,
  entryDialogue:[L('해리','방학 내내 편지 한 통 없더니… 내 책상 앞에 누가 있잖아?'),L('도비','큰 소리 내시면 안 됩니다. 도비는 해리 포터를 도우러 왔습니다.')],
  entities:[
   N('2-01.dobby','도비',11,10,[L('도비','올해는 학교에 돌아가시면 안 됩니다. 벽 속에 아주 오래된 것이 깨어나려 합니다.'),L('해리','그걸 어떻게 알아? 그리고 친구들의 편지는 왜 네 손에 있어?'),L('도비','편지를 읽으면 돌아가고 싶어지실 테니까요… 죄송합니다.')],{kind:'dobby',choices:[{id:'letters',label:'편지는 돌려줘. 친구들이 걱정하고 있어.',flag:'ch02.dobbyReply',value:'letters',response:[L('도비','여기 있습니다. 한 장도 버리지는 않았습니다.')]},{id:'danger',label:'정말 돕고 싶다면 위험이 뭔지 말해 줘.',flag:'ch02.dobbyReply',value:'danger',response:[L('도비','도비가 말할 수 있는 건 여기까지입니다. 부탁드립니다, 조심해 주세요.')]}]}),
   P('2-01.letters','돌려받은 편지',15,12,'letter',{conditions:['2-01.warning'],consumeOnInteract:true,consumedVisual:'hidden',dialogue:[L('론의 편지','답장이 없어서 걱정했어. 오늘 밤 창문을 봐. 우리가 데리러 갈게.'),L('해리','론도 헤르미온느도 계속 편지를 보냈었구나.')]}),
   N('2-01.ron','론',20,6,[L('론','거기 있었구나! 창문을 열어. 아버지 차가 오래 떠 있을 수는 없어.'),L('해리','짐은 챙겼어. 도비라는 집요정이 학교에 돌아가지 말래.'),L('론','그 얘기는 타고 나서 듣자. 아래층이 깨기 전에!')],{kind:'student',conditions:['2-01.letters']})
  ],blockers:[{x:6,z:4,w:6,d:3},{x:16,z:3,w:4,d:2}],
  objectives:[O('2-01.warning','낯선 손님의 경고를 들으세요','interact','2-01.dobby'),O('2-01.letters','돌려받은 편지를 챙기세요','interact','2-01.letters'),O('2-01.escape','창가에서 론과 만나세요','interact','2-01.ron')],reward:R(20)
 }),
 S('2-02','버로의 생활','burrow','친구의 집에서 하루를 보냅니다. 수리와 정원 일을 마친 뒤 새 학기를 준비하세요.',{
  width:40,depth:28,spawn:{x:5,z:22},exit:{x:35,z:5},rest:true,layout:{kind:'burrow',floorRegions:[{x:12,z:18,w:20,d:16},{x:29,z:13,w:18,d:22}]},
  entryDialogue:[L('몰리','잘 왔구나, 해리. 식사는 식탁에 있어. 방학 동안 편히 지내렴.'),L('론','우리 집은 삐걱거리는 곳이 좀 많아. 몇 군데 고치면 엄마도 자동차 얘기를 덜 하실 거야.')],
  entities:[
   P('2-02.clock','멈춘 부엌 시계',10,15,'machine',{spell:'S038',interactLabel:'reparo로 시계 수리'}),
   P('2-02.herbs','정원의 약초',24,20,'herbs',{consumeOnInteract:true,consumedVisual:'harvested',dialogue:[L('해리','잎은 이만큼이면 되겠지. 뿌리는 남겨 두고…')],reward:R(0,{I030:2})}),
   N('2-02.ginny','지니',29,8,[L('지니','그… 시계가 다시 가네요. 저 바늘은 조금 느려도 괜찮아요.'),L('해리','다른 것도 고장 나면 말해 줘. 이번에는 시계가 먼저 소리 지르진 않을 거야.')],{conditions:['2-02.clock'],choices:[{id:'thanks',label:'방을 내줘서 고마워.',flag:'ch02.ginnyReply',value:'thanks',response:[L('지니','네! 아니, 천만에요. 론이 물건만 조금 치웠으면 더 넓었을 텐데…')]},{id:'school',label:'학교에 가면 같이 식사하자.',flag:'ch02.ginnyReply',value:'school',response:[L('지니','좋아요. 기차에서도… 아니, 학교에서요.')]}]}),
   N('2-02.molly','몰리',33,16,[L('몰리','시계도 고치고 약초도 가져왔구나. 이 응급 꾸러미와 펜던트를 받아 두렴.'),L('몰리','먹고 자는 건 신경 쓰지 마. 작업대에서 파는 건 밖에서 사 오는 재료뿐이란다.')],{shopId:'SH05',conditions:['2-02.clock','2-02.herbs','2-02.friend'],reward:R(60,{I029:2},['P010'])})
  ],blockers:[{x:13,z:21,w:5,d:2},{x:35,z:11,w:3,d:4}],
  objectives:[O('2-02.clock','멈춘 시계를 reparo로 고치세요','cast','2-02.clock','S038'),O('2-02.herbs','정원에서 약초를 거두세요','interact','2-02.herbs'),O('2-02.friend','지니와 이야기하세요','interact','2-02.ginny'),O('2-02.supplies','몰리에게 일을 마쳤다고 전하세요','interact','2-02.molly')],reward:R(30,{I001:1,I003:1})
 }),
 S('2-03','골목에서 사라진 길','alley','낯선 골목의 소동을 뚫고 큰길로 돌아가세요. 서점에는 새 학년 교재가 도착했습니다.',{
  width:56,depth:22,spawn:{x:4,z:17},exit:{x:52,z:5},layout:{kind:'alley'},
  entryDialogue:[L('해리','굴뚝에서 나온 곳이… 여긴 다이애건 골목이 아닌데.'),L('하그리드','해리! 거기서 움직이지 마라. 풀려난 녀석들이 상자 틈에 숨어 있어.'),L('하그리드','한 번에 몰리지 않게 골목 모서리를 이용해. 난 큰길 쪽 사람들을 물릴게.')],
  entities:[
   P('2-03.sign','부서진 골목 표지',7,16,'sign',{dialogue:[L('해리','화살표 끝에 서점 간판이 보여. 상자들을 지나 동쪽으로 나가면 되겠어.')]}),
   ...alleyA.units,...alleyB.units,
   N('2-03.bookseller','서점 주인',44,13,[L('서점 주인','그 소란을 지나왔군요. 새 교재는 준비됐습니다.'),L('서점 주인','강한 주문은 마나도 더 쓰죠. 작은 물약도 계속 팔고 있으니 필요에 맞춰 고르세요.')],{kind:'shopkeeper',shopId:'SH02',conditions:[...alleyB.ids],reward:R(70,{I025:2})}),
   N('2-03.apothecary','약재상',50,8,[L('약재상','옷에 거미줄이 잔뜩 붙었네요. 활력 물약 하나 챙겨 가세요.'),L('약재상','물건을 고르기 전에 가방을 확인해 보세요. 작년에 쓰던 장비도 그대로 쓸 수 있어요.')],{kind:'shopkeeper',shopId:'SH03',conditions:['2-03.books'],reward:R(0,{I008:1})})
  ],blockers:[{x:12,z:4,w:9,d:5},{x:26,z:4,w:10,d:5},{x:41,z:4,w:8,d:5},{x:21,z:18,w:4,d:3}],
  objectives:[O('2-03.route','골목 표지에서 큰길 방향을 확인하세요','interact','2-03.sign'),...alleyA.goals,...alleyB.goals,O('2-03.books','서점에서 새 교재를 받으세요','interact','2-03.bookseller'),O('2-03.medicine','약재상에서 준비를 마치세요','interact','2-03.apothecary')],reward:R(70,{I001:1,I003:1})
 }),
 S('2-04','하늘을 나는 자동차','flight','막힌 승강장을 뒤로하고 열차를 따라갑니다. 표식을 따라 굴뚝과 나뭇가지를 피해 가세요.',{
  width:68,depth:26,spawn:{x:5,z:20},exit:{x:63,z:6},layout:{kind:'flight',vehicle:'car'},
  entryDialogue:[L('론','차는 날 수 있어. 기차를 따라가면 학교에 닿을 거야.'),L('해리','론, 앞에 굴뚝! 왼쪽으로, 조금만!'),L('론','알았어! 밝은 표식 사이로 가자. 나뭇가지는 건드리지 말고!')],
  entities:[
   ...[[14,18],[27,7],[40,19],[54,8]].map(([x,z],i)=>({id:`2-04.ring${i+1}`,type:'ring',kind:'flight-ring',name:'열차의 진행 표식',x,z,radius:1.8,conditions:i?[`2-04.ring${i}`]:[]})),
   P('2-04.car','학교 앞에 멈춘 자동차',61,7,'car',{conditions:['2-04.ring4'],dialogue:[L('론','살았다… 잠깐, 차가 우리 짐을 뱉고 있어!'),L('해리','짐부터 주워. 문은 저절로 닫힐 것 같아.'),L('론','내 지팡이는 나중에 볼래. 지금 보면 더 속상할 것 같거든.')],reward:R(0,{I037:1})})
  ],blockers:[{x:21,z:14,w:4,d:8},{x:35,z:7,w:4,d:7},{x:48,z:20,w:3,d:7}],
  objectives:[...Array.from({length:4},(_,i)=>O(`2-04.ring${i+1}`,`열차를 따라 ${i+1}번째 표식을 통과하세요`,'flight',`2-04.ring${i+1}`)),O('2-04.arrival','자동차에서 짐을 챙기세요','interact','2-04.car')],reward:R(40,{I001:1})
 }),
 S('2-05','벽 속의 목소리','castle','돌벽 너머에서 들려온 소리. 석화 사건 주변의 세 단서를 드러내고 친구들과 비교하세요.',{
  width:44,depth:36,spawn:{x:6,z:29},exit:{x:38,z:5},rest:true,grantSpells:['S040','S004'],layout:{kind:'corridor',floorRegions:[{x:11,z:27,w:18,d:14},{x:25,z:24,w:14,d:8},{x:34,z:14,w:16,d:24}]},
  entryDialogue:[L('해리','또 들렸어. 이번에는 위쪽… 아니, 벽 안이야.'),L('헤르미온느','우리한테는 아무 소리도 안 들렸어. 우선 남아 있는 흔적부터 보자.'),L('헤르미온느','revelio를 써 봐. 눈에 안 띄던 선이나 자국이 드러날 수 있어.')],
  entities:[
   P('2-05.water','벽 아래의 젖은 자국',12,26,'tracks',{spell:'S040',interactLabel:'revelio로 물자국 조사'}),
   P('2-05.spiders','창가의 작은 발자국',29,23,'tracks',{spell:'S040',conditions:['2-05.water'],interactLabel:'revelio로 이동 흔적 조사'}),
   P('2-05.writing','돌벽에 남은 글자',36,13,'sign',{spell:'S040',conditions:['2-05.spiders'],interactLabel:'revelio로 글자 확인'}),
   N('2-05.hermione','헤르미온느',36,7,[L('헤르미온느','물자국은 화장실 쪽으로 이어지고, 거미들은 반대 방향으로 도망쳤어.'),L('론','그러니까 뭔가를 피해 달아났다는 거네. 거미가 무서워하는 게 있다니.'),L('헤르미온느','아직은 추측이야. 오늘은 결투 클럽부터 가자. 우리도 대비는 해야겠어.')],{kind:'student',conditions:['2-05.writing'],choices:[{id:'voice',label:'내가 들은 목소리도 기록해 두자.',flag:'ch02.investigationReply',value:'voice',response:[L('헤르미온느','그래. 들은 말 그대로 적어 줘. 나중에 다른 단서와 맞춰 볼게.')]},{id:'tracks',label:'거미들이 간 방향이 마음에 걸려.',flag:'ch02.investigationReply',value:'tracks',response:[L('론','방향만 적자. 지금 당장 따라가자는 건 아니지?')]}]})
  ],blockers:[{x:8,z:21,w:2,d:2},{x:29,z:11,w:2,d:5}],
  objectives:[O('2-05.water','revelio로 젖은 자국을 드러내세요','cast','2-05.water','S040'),O('2-05.spiders','작은 발자국의 방향을 확인하세요','cast','2-05.spiders','S040'),O('2-05.writing','벽의 글자를 조사하세요','cast','2-05.writing','S040'),O('2-05.compare','헤르미온느와 단서를 비교하세요','interact','2-05.hermione')],reward:R(45)
 }),
 S('2-06','결투 클럽','classroom','무장해제·기절·마법 해제를 배웁니다. 연습을 마치면 여러 상대의 공격을 함께 견뎌야 합니다.',{
  width:40,depth:32,spawn:{x:7,z:27},exit:{x:35,z:4},rest:true,grantSpells:['S011','S012','S029'],layout:{kind:'dueling'},temporarySupplies:{SUP_C2_DUEL_I001:2,SUP_C2_DUEL_I003:2},
  entryDialogue:[L('록하트','오늘은 서로 다치지 않고 상대의 주문을 멈추는 법을 배우겠습니다!'),L('스네이프','말보다 지팡이를 보도록. 무장해제는 expelliarmus. 기절 주문은 stupefy다.'),L('스네이프','강화 마법은 finiteincantatem으로 걷어 낸다. 세 표적을 끝내면 합동 연습을 시작하지.')],
  entities:[
   {id:'2-06.target-disarm',type:'target',kind:'dummy',name:'무장해제 연습 표적',x:10,z:23,hp:60,objectiveOnly:true},
   {id:'2-06.target-stun',type:'target',kind:'dummy',name:'기절 연습 표적',x:28,z:23,hp:60,objectiveOnly:true},
   P('2-06.ward','강화된 연습 결계',20,24,'ward',{spell:'S029',interactLabel:'finiteincantatem으로 강화 해제'}),
   ...duelA.units,...duelB.units,
   N('2-06.snape','스네이프',34,6,[L('스네이프','하나를 막았다고 멈추지 마라. 다른 지팡이는 아직 널 향하고 있다.'),L('스네이프','쉴 틈은 스스로 만들어야 한다. 오늘은 그 정도면 됐다.')],{conditions:duelB.ids,reward:R(60,{},['P005'])})
  ],blockers:[{x:5,z:15,w:2,d:9},{x:36,z:18,w:2,d:9}],
  objectives:[O('2-06.disarm','첫 표적에 expelliarmus를 맞히세요','cast','2-06.target-disarm','S011'),O('2-06.dispel','finiteincantatem으로 연습 결계를 해제하세요','cast','2-06.ward','S029'),O('2-06.stun','다른 표적에 stupefy를 맞히세요','cast','2-06.target-stun','S012'),...duelA.goals,...duelB.goals,O('2-06.review','스네이프의 평가를 들으세요','interact','2-06.snape')],reward:R(80,{I001:1,I003:1})
 }),
 S('2-07','온실의 해독법','garden','맨드레이크를 돌보고 정화 주문을 익힙니다. 풀려난 픽시들은 화분 사이에서 무리 지어 움직입니다.',{
  width:48,depth:32,spawn:{x:5,z:26},exit:{x:43,z:5},grantSpells:['S032'],layout:{kind:'greenhouse',floorRegions:[{x:13,z:23,w:22,d:14},{x:29,z:20,w:18,d:10},{x:38,z:12,w:16,d:20}]},
  entryDialogue:[L('스프라우트 교수','귀마개부터 단단히 쓰세요. 오늘은 맨드레이크의 상태를 살필 겁니다.'),L('스프라우트 교수','독에 닿았다면 purga로 정화하세요. 뿌리가 살아 있어야 회복약도 만들 수 있답니다.'),L('네빌','교수님, 저쪽 화분이 움직여요. 이번엔 뿌리가 아니라 픽시예요!')],
  entities:[
   P('2-07.mandrake','돌볼 맨드레이크',10,24,'mandrake',{consumeOnInteract:true,consumedVisual:'harvested',dialogue:[L('해리','흙을 조금 더 눌러 주고… 됐다. 소리가 덜 날 때 옮겨야겠어.')]}),
   N('2-07.teacher','스프라우트 교수',11,18,[L('스프라우트 교수','정화 연습까지 마쳤군요. 이번에는 어떤 방법으로 움직임을 제어할지 골라 보세요.'),L('스프라우트 교수','배우지 않은 주문도 나중에 교재로 익힐 수 있어요. 오늘은 하나를 손에 익히면 됩니다.')],{conditions:['2-07.mandrake','2-07.cleanse'],learningChoice:true,repeatDialogue:[L('스프라우트 교수','오늘 배운 주문을 먼저 써 보세요. 다른 심화 교재는 학기 말 정리 시간에도 살펴볼 수 있어요.')],choices:[{id:'frost',label:'glacius · 10 MP · 한 적을 잠시 얼리기',flag:'ch02.greenhouseStudy',value:'frost',reward:R(0,{},[],['S017']),response:[L('스프라우트 교수','얼어 있는 시간은 짧습니다. 다음 적에게서 거리를 벌리는 데 써 보세요.')]},{id:'roots',label:'radicavincula · 13 MP · 작은 무리를 속박하기',flag:'ch02.greenhouseStudy',value:'roots',reward:R(0,{},[],['S023']),response:[L('스프라우트 교수','여럿을 붙잡아도 날아오는 주문은 남아요. 발밑과 앞을 함께 보세요.')]},{id:'cut',label:'diffindo · 8 MP · 강한 절단 공격',flag:'ch02.greenhouseStudy',value:'cut',reward:R(0,{},[],['S009']),response:[L('스프라우트 교수','줄기를 자를 때처럼 방향이 중요해요. 친구가 있는 쪽으로 겨누지 마세요.')]}]}),
   ...gardenA.units,...gardenB.units,
   P('2-07.dew','온실의 이슬',41,7,'crystal',{conditions:gardenB.ids,consumeOnInteract:true,consumedVisual:'hidden',dialogue:[L('스프라우트 교수','화분이 더 깨지기 전에 막아 줬군요. 이 이슬과 펜던트를 챙기세요.'),L('해리','맨드레이크도 괜찮아 보여요. 회복약이 빨리 완성되면 좋겠어요.')],reward:R(0,{I023:1},['P030'])})
  ],blockers:[{x:14,z:29,w:10,d:2},{x:31,z:13,w:4,d:2},{x:43,z:18,w:2,d:5}],
  objectives:[O('2-07.mandrake','맨드레이크를 돌보세요','interact','2-07.mandrake'),O('2-07.cleanse','purga 정화 주문을 연습하세요','cast',null,'S032'),O('2-07.lesson','온실에서 심화 주문 하나를 배우세요','choice','2-07.teacher'),...gardenA.goals,...gardenB.goals,O('2-07.dew','교수에게 온실의 이슬을 받으세요','interact','2-07.dew')],reward:R(70,{I006:1})
 }),
 S('2-08','폴리주스 재료','library','닫힌 재료실을 조사하고 위장 물약을 준비합니다. 기록을 읽고 재료를 넣을 순서를 고르세요.',{
  width:34,depth:38,spawn:{x:5,z:33},exit:{x:29,z:5},layout:{kind:'storeroom'},
  entryDialogue:[L('헤르미온느','대화를 듣기만 하면 돼. 누가 뭘 알고 있는지 알아내자.'),L('론','그 물약을 정말 마셔야 해?'),L('헤르미온느','우선 재료부터. 서가 아래에 독거미가 있으니 빈손으로 들어가진 마.')],
  entities:[
   P('2-08.recipe','물약 조제 기록',8,31,'book',{dialogue:[L('조제 기록','말린 약초를 먼저 풀고, 매듭풀을 넣는다. 마지막 재료는 불을 줄인 뒤 한 방울.'),L('헤르미온느','이 순서야. 병 색깔도 적어 두자. 약초는 초록 병, 매듭풀은 갈색 병이네.')]}),
   ...archiveA.units,...archiveB.units,
   P('2-08.ingredient-one','말린 약초 병',8,18,'herbs',{conditions:archiveA.ids,consumeOnInteract:true,consumedVisual:'hidden',dialogue:[L('해리','초록 병이야. 마개는 아직 밀봉돼 있어.')]}),
   P('2-08.ingredient-two','매듭풀 병',27,6,'herbs',{conditions:archiveB.ids,consumeOnInteract:true,consumedVisual:'hidden',dialogue:[L('해리','갈색 병도 찾았어. 가마솥으로 돌아가자.')]}),
   P('2-08.cauldron','준비된 가마솥',25,30,'cauldron',{conditions:['2-08.herb','2-08.knotgrass'],dialogue:[L('헤르미온느','불은 준비됐어. 어느 병부터 넣을까?')],choices:[{id:'green',label:'초록 병 → 갈색 병 → 마지막 한 방울',flag:'ch02.recipe',value:'green',response:[L('헤르미온느','좋아. 색이 변했어. 하루치면 충분하겠지.')]},{id:'brown',label:'갈색 병 → 초록 병 → 마지막 한 방울',flag:'ch02.recipe',value:'brown',response:[L('헤르미온느','잠깐, 기록의 첫 재료는 말린 약초야. 병을 내려놓고 다시 보자.')]}]}),
   N('2-08.hermione','헤르미온느',29,32,[L('헤르미온느','우리 몫은 모두 나눴어. 이 베조아르도 가지고 가.'),L('론','맛에 대한 경고는 왜 마지막에 하는 거야?'),L('헤르미온느','아직 아무 말도 안 했거든.')],{kind:'student',conditions:['2-08.mix'],reward:R(0,{I017:1,I006:2})})
  ],blockers:[{x:7,z:9,w:3,d:10},{x:19,z:16,w:3,d:8}],
  objectives:[O('2-08.plan','조제 기록을 읽으세요','interact','2-08.recipe'),...archiveA.goals,...archiveB.goals,O('2-08.herb','말린 약초 병을 챙기세요','interact','2-08.ingredient-one'),O('2-08.knotgrass','매듭풀 병을 챙기세요','interact','2-08.ingredient-two'),{...O('2-08.mix','기록에 맞는 순서로 물약을 섞으세요','choice','2-08.cauldron',null,'말린 약초가 담긴 초록 병이 먼저입니다.'),choice:'green'},O('2-08.ready','위장 물약과 해독제를 받으세요','interact','2-08.hermione')],reward:R(60)
 }),
 S('2-09','지하 휴게실의 대화','sewer','위장한 채 들은 이야기와 일기장의 기억이 어긋납니다. 배수로 관리인을 찾아 지하 통로를 확인하세요.',{
  width:58,depth:32,spawn:{x:5,z:26},exit:{x:52,z:5},layout:{kind:'sewer',floorRegions:[{x:12,z:24,w:20,d:12},{x:29,z:22,w:20,d:10},{x:46,z:16,w:20,d:28}]},
  entryDialogue:[L('론','내 목소리도 달라졌어. 넌 웃지 마.'),L('해리','말을 적게 하자. 필요한 얘기만 듣고 나오면 돼.'),L('론','그건 자신 있어. 이 얼굴로 오래 있고 싶진 않거든.')],
  entities:[
   N('2-09.malfoy','말포이',10,22,[L('말포이','나도 누가 그랬는지는 몰라. 아버지는 이 얘기를 입 밖에 내지 말라고 하셨지.'),L('해리','그럼… 지난번에도 같은 일이 있었다는 건가?'),L('말포이','옛날에도 학교를 닫을 뻔했다던데. 너희는 그런 것도 못 들었냐?')],{kind:'student',storyItemChanges:{I017:'used'},choices:[{id:'past',label:'지난번에 무슨 일이 있었는데?',flag:'ch02.commonRoomReply',value:'past',response:[L('말포이','내가 그때 여기 있었겠어? 오래된 기록이나 찾아봐.')]},{id:'leave',label:'우린 먼저 가 볼게.',flag:'ch02.commonRoomReply',value:'leave',response:[L('말포이','어디로 가는데? …됐어. 빨리 다녀와.')]}]}),
   P('2-09.diary','물에 젖지 않는 일기장',15,26,'diary',{conditions:['2-09.rumour'],dialogue:[L('해리','물에 빠져 있었는데 페이지는 말라 있어. 잉크를 찍어도 그대로 사라지고…'),L('톰 리들','내 이름은 톰 리들. 너도 학교에서 일어난 일을 알고 싶니?'),L('해리','그 기억에는 하그리드가 있었어. 하지만 직접 만나 확인해야 해.')],reward:R(0,{I056:1})}),
   ...sewerA.units,...sewerB.units,
   P('2-09.valve','막힌 배수 밸브',43,17,'valve',{spells:['S038','S014'],conditions:sewerB.ids,interactLabel:'reparo 또는 aguamenti로 배수로 복구'}),
   N('2-09.keeper-lesson','수로 관리인',18,27,[L('수로 관리인','안쪽 밸브가 막혀 물길이 끊겼네. 저 관들은 학교 오래된 구역과 이어져 있지.'),L('수로 관리인','물 주문을 배울 생각인가? 아니면 밸브 수리에 쓸 재료를 챙기겠나? 물줄기로 밀어 내도 되고, reparo로 밸브를 고쳐도 되네.')],{kind:'shopkeeper',conditions:['2-09.diary'],hiddenAfter:['2-09.drain'],learningChoice:true,repeatDialogue:[L('수로 관리인','물 주문이나 수리 주문으로 밸브를 고쳐 주게. 통로 안의 뱀들도 조심하고.')],choices:[{id:'water',label:'aguamenti · 9 MP · 물줄기 주문을 배우겠습니다.',flag:'ch02.waterStudy',value:'water',reward:R(0,{},[],['S014']),response:[L('수로 관리인','줄기를 가늘게 만들고 조금씩 넓혀 보게. 낡은 관을 더 터뜨리면 곤란하니까.')]},{id:'repair',label:'수리 재료를 챙기겠습니다.',flag:'ch02.waterStudy',value:'repair',reward:R(0,{I031:3}),response:[L('수로 관리인','이 목재면 지팡이 손잡이를 손볼 수 있지. 물 주문은 마음이 바뀌면 다시 배우러 오게.')]}]}),
   N('2-09.keeper','수로 관리인',49,8,[L('수로 관리인','물길이 다시 트였군. 밸브 소리가 들려서 작업대 쪽으로 먼저 올라왔네. 약속한 물건들을 살펴보게.'),L('수로 관리인','더 오래된 관은 숲 아래까지 이어지지만, 그쪽은 요즘 거미들이 잔뜩 몰려 있네. 발밑을 잘 보게.')],{kind:'shopkeeper',shopId:'SH06',conditions:['2-09.drain'],hiddenUntilAvailable:true,reward:R(80)})
  ],blockers:[{x:26,z:19,w:2,d:2},{x:39,z:9,w:2,d:5},{x:51,z:23,w:3,d:5}],
  objectives:[O('2-09.rumour','위장한 채 소문을 확인하세요','interact','2-09.malfoy'),O('2-09.diary','일기장에 남은 기억을 살펴보세요','interact','2-09.diary'),O('2-09.lesson','관리인에게 배수로를 고치는 법을 배우세요','choice','2-09.keeper-lesson'),...sewerA.goals,...sewerB.goals,{...O('2-09.drain','reparo 또는 aguamenti로 배수로를 복구하세요','cast','2-09.valve'),spells:['S038','S014']},O('2-09.keeper','수로 관리인에게 통로를 물어보세요','interact','2-09.keeper')],reward:R(90,{I001:1,I003:1})
 }),
 S('2-10','거미를 따라서','forest','아라고그의 증언을 들은 뒤 몰려드는 거미들을 막아 냅니다. 숲길 끝에서 자동차의 엔진 소리가 들립니다.',{
  width:58,depth:44,spawn:{x:7,z:37},exit:{x:52,z:5},layout:{kind:'forest',floorRegions:[{x:15,z:33,w:26,d:18},{x:31,z:30,w:10,d:6},{x:39,z:25,w:10,d:18},{x:41,z:15,w:6,d:8},{x:46,z:8,w:20,d:12}]},temporarySupplies:{SUP_C2_FOREST_I001:2,SUP_C2_FOREST_I003:3,SUP_C2_FOREST_I006:2},
  entryDialogue:[L('론','거미를 따라가라니. 왜 하필 나비를 따라가라는 말은 없을까?'),L('해리','하그리드가 남긴 말이야. 적어도 누가 학교에 들어왔는지는 알 수 있겠지.'),L('론','저 뒤에서 엔진 소리 안 들려? 그 차가 아직 숲에 있나 봐.')],
  entities:[
   N('2-10.aragog','아라고그',14,34,[L('아라고그','하그리드는 나를 도왔다. 학교에서 목숨을 빼앗은 것은 내가 아니다.'),L('해리','그럼 무엇이었죠?'),L('아라고그','우리는 그 이름조차 입에 담지 않는다. 관을 따라 다니는, 태어날 때부터 우리의 적인 것.'),L('론','해리, 뒤쪽! 네 마리가 달려들어!'),L('해리','등을 맞대. 가까이 오는 것부터 막자!')],{kind:'spider'}),
   ...forestA.units,...forestB.units,
   P('2-10.web-one','첫 탈출로를 막은 수풀',30,30,'vines',{spell:'S007',blocking:{w:2,d:6},conditions:['2-10.flee'],interactLabel:'incendio로 수풀 태우기'}),
   P('2-10.web-two','자동차 쪽 길을 막은 수풀',41,15,'vines',{spell:'S007',blocking:{w:6,d:2},conditions:['2-10.web-one'],interactLabel:'incendio로 두 번째 수풀 태우기'}),
   P('2-10.car','기다리는 자동차',51,7,'car',{conditions:['2-10.web-two'],dialogue:[L('론','문 열렸어! 빨리 타!'),L('해리','론, 고개 숙여!'),L('론','다 탔어. 부탁이니까 이번엔 학교 쪽으로 가자!')],reward:R(0,{I031:3},['P028'])})
  ],blockers:[{x:8,z:28,w:3,d:4},{x:36,z:24,w:2,d:3},{x:49,z:10,w:2,d:2}],
  storyEvents:[{id:'2-10.escape-warning',conditions:forestB.ids,dialogue:[L('론','여덟 마리를 더 막았는데… 나무 위에도 있어. 계속 내려와!'),L('해리','수가 너무 많아. 여기서 더 싸우면 포위돼. 차까지 뛰자!'),L('론','오른쪽 길이 수풀로 막혔어!'),L('해리','incendio로 길을 열게. 거미들은 따라오지 못하게 잠깐만 묶어 둬!')]}],
  respawns:[{id:'2-10.pursuit',conditions:['2-10.flee'],until:['2-10.escape'],maxAlive:16,initialCount:12,interval:1.2,minPlayerDistance:5,spawnPoints:[...[4,8,12,16,20,24,27].flatMap(x=>[25,29,33,37,41].map(z=>({x,z}))),{x:35,z:31},{x:38,z:33},{x:42,z:32},{x:42,z:26},{x:36,z:20},{x:41,z:18},{x:39,z:12},{x:44,z:12},{x:53,z:12},{x:39,z:5},{x:45,z:4},{x:50,z:4},{x:54,z:7}],template:{type:'enemy',kind:'venom-spider',pattern:'venom-spider',name:'끝없이 밀려오는 거미',hp:36,damage:12,radius:.7,speed:2.3,combat:{aggroRange:30,attackRange:15,reactionDelay:.8}}}],
  progressMigrations:[{anyOf:['2-10.web-one','2-10.web-two','2-10.escape'],complete:[...forestA.ids,...forestB.ids,'2-10.flee']}],
  objectives:[O('2-10.testimony','아라고그에게 과거의 일을 물어보세요','interact','2-10.aragog'),...forestGoals,{...O('2-10.flee','론과 탈출할 길을 확인하세요','story','2-10.escape-warning'),conditions:forestB.ids},O('2-10.web-one','첫 탈출로의 수풀을 incendio로 태우세요','cast','2-10.web-one','S007','계속 몰려오는 거미와 오래 싸우지 마세요. 수풀을 태우고 열린 길로 뛰세요.'),O('2-10.web-two','자동차 쪽 수풀을 incendio로 태우세요','cast','2-10.web-two','S007'),O('2-10.escape','숲 끝의 자동차에 올라타세요','interact','2-10.car')],reward:R(100,{I001:2,I003:2})
 }),
 S('2-11','사라진 학생','bathroom','지니가 사라졌습니다. 머틀의 증언과 배관의 흔적을 맞춰 입구를 여세요.',{
  width:42,depth:34,spawn:{x:6,z:28},exit:{x:35,z:4},layout:{kind:'washroom'},rest:true,
  entryDialogue:[L('론','지니가 없어. 교수님들이 학생들을 기숙사로 돌려보내고 있어.'),L('헤르미온느의 쪽지','뱀의 왕. 눈을 직접 마주치지 말 것. 배관.'),L('해리','그 목소리가 벽 안에서 들린 이유야. 머틀에게 물어보자.')],
  entities:[
   N('2-11.myrtle','머틀',10,25,[L('머틀','큰 노란 눈을 봤어. 저 세면대 쪽에서. 다들 내 말은 제대로 듣지도 않았지.'),L('해리','이번엔 듣고 있어. 그때 물이 흐르는 소리도 났어?'),L('머틀','그랬을지도. 꼭 그곳을 열겠다면, 날 탓하지는 마.')],{kind:'myrtle'}),
   ...searchA.units,...searchB.units,
   P('2-11.pipe','뱀 문양이 새겨진 배관',28,8,'valve',{spell:'S040',conditions:searchB.ids,interactLabel:'revelio로 배관 연결 확인'}),
   P('2-11.supplies','병동에서 보낸 보급 상자',10,30,'chest',{conditions:['2-11.witness'],consumeOnInteract:true,consumedVisual:'hidden',dialogue:[L('론','회복 물약이야. 남겨 두신 걸 다 가져가진 말자. 필요한 만큼은 여기 있어.')],reward:R(0,{I001:2,I003:2,I006:2,I028:1})}),
   P('2-11.entrance','뱀 문양의 세면대',35,6,'door',{conditions:['2-11.pipe','2-11.supplies'],dialogue:[L('해리','열려라.'),L('론','…바닥이 내려가고 있어. 지니가 저 아래에 있다는 거지?'),L('해리','내가 먼저 갈게. 뒤에서 무슨 소리가 나면 바로 알려 줘.')],storyItemChanges:{I028:'used'}})
  ],blockers:[{x:13,z:15,w:3,d:5},{x:29,z:26,w:3,d:5},{x:35,z:19,w:2,d:4}],
  objectives:[O('2-11.witness','머틀의 증언을 들으세요','interact','2-11.myrtle'),...searchA.goals,...searchB.goals,O('2-11.pipe','revelio로 배관을 조사하세요','cast','2-11.pipe','S040'),O('2-11.supplies','마지막 보급과 열쇠를 챙기세요','interact','2-11.supplies'),O('2-11.entrance','세면대 아래 입구를 여세요','interact','2-11.entrance')],reward:R(60)
 }),
 S('2-12','비밀의 방','chamber','뱀 조각 아래 지니가 쓰러져 있습니다. 기둥으로 시선을 끊고, 돌진을 피한 뒤 드러난 빈틈을 노리세요.',{
  width:48,depth:40,spawn:{x:23,z:34},exit:{x:24,z:5},layout:{kind:'chamber',boundary:'ellipse'},grantSpells:['S032'],temporarySupplies:{SUP_B2_I001:3,SUP_B2_I003:3,SUP_B2_I006:2},combat:{maxTelegraphs:3},
  entryDialogue:[L('해리','지니! 내 말 들려?'),L('톰 리들','그 아이를 깨우려면 시간이 더 필요할 텐데. 네게 그럴 여유가 있을까?'),L('해리','저 기둥들 사이로 움직여야겠어. 눈을 마주치지 말고, 독에 닿으면 purga…')],
  entities:[
   P('2-12.gate','석문을 묶은 잔류 마법',24,29,'ward',{spell:'S029',interactLabel:'finiteincantatem으로 석문 봉인 해제'}),
   {id:'B2',type:'boss',kind:'basilisk',name:'바실리스크',x:26,z:12,radius:1.7,hp:560,damage:30,speed:2.35,pattern:'basilisk',phaseCount:3,conditions:['2-12.gate'],hiddenUntilAvailable:true,combat:{startDelay:1.6,aggroRange:40,attackRange:30}},
   ...chamberAdds.units,
   P('2-12.fang','바실리스크의 송곳니',27,12,'fang',{conditions:['2-12.basilisk'],hiddenUntilAvailable:true,consumeOnInteract:true,consumedVisual:'hidden',dialogue:[L('해리','부러진 송곳니가 남았어. 이 독이라면 일기장도…')],reward:R(0,{I053:1},['P029'])}),
   P('2-12.diary','지니 곁의 일기장',23,8,'diary',{conditions:['2-12.fang'],consumeOnInteract:true,consumedVisual:'hidden',dialogue:[L('톰 리들','그걸 내려놔.'),L('해리','지니에게서 떨어져!'),L('지니','해리… 내가 무슨 일을 한 거야?'),L('해리','지금은 일어나자. 론이 입구에서 기다리고 있어.')],storyItemChanges:{I056:'destroyed'}}),
   N('2-12.ginny','지니',25,7,[L('지니','일기장에 쓰면 누군가 내 말을 들어 줬어. 그러다 내가 뭘 했는지 기억이 안 났어.'),L('해리','일기장은 이제 없어. 천천히 얘기해도 돼. 우선 여기서 나가자.')],{conditions:['2-12.diary']})
  ],blockers:[{x:15,z:15,w:2.5,d:3},{x:35,z:15,w:2.5,d:3},{x:15,z:26,w:2.5,d:3},{x:35,z:26,w:2.5,d:3}],
  objectives:[O('2-12.gate','석문의 봉인을 finiteincantatem으로 해제하세요','cast','2-12.gate','S029'),...chamberAdds.goals,O('2-12.basilisk','기둥과 돌진의 빈틈을 이용해 바실리스크를 쓰러뜨리세요','kill','B2',null,'시선은 기둥 뒤로 피하고, 돌진 경로는 옆으로 벗어나세요. 독액 위에 머무르지 마세요.'),O('2-12.fang','부러진 송곳니를 챙기세요','interact','2-12.fang'),O('2-12.diary','송곳니로 일기장을 파괴하세요','interact','2-12.diary'),O('2-12.rescue','지니와 함께 출구로 향하세요','interact','2-12.ginny')],reward:R(200,{I001:2,I003:2})
 }),
 S('2-13','깨어난 학교','courtyard','석화가 풀린 친구들이 돌아왔습니다. 남은 이야기를 나누고 배운 주문과 장비를 정리하세요.',{
  width:38,depth:30,spawn:{x:7,z:24},exit:{x:31,z:5},rest:true,layout:{kind:'courtyard',floorRegions:[{x:19,z:20,w:34,d:16},{x:25,z:9,w:20,d:14}]},nextId:'3-01',chapterEnd:true,
  entryDialogue:[L('론','헤르미온느! 드디어 돌아왔구나.'),L('헤르미온느','둘이 해결했다며? 병동에 누워 있는 동안 할 얘기가 많이 쌓였어.'),L('해리','우리도 그래. 이번에는 차분히 앉아서 얘기하자.')],
  entities:[
   N('2-13.hermione','헤르미온느',12,21,[L('헤르미온느','배관이라는 쪽지는 봤어? 더 일찍 알려 줬으면 좋았을 텐데.'),L('해리','그 쪽지 덕분에 입구를 찾았어. 네가 알아낸 게 맞았어.')],{kind:'student',choices:[{id:'thanks',label:'돌아와 줘서 다행이야.',flag:'ch02.reunionReply',value:'thanks',response:[L('헤르미온느','나도. 다시 눈을 떴을 때 너희 목소리부터 들렸거든.')]},{id:'notes',label:'밀린 수업 노트는 같이 보자.',flag:'ch02.reunionReply',value:'notes',response:[L('헤르미온느','정말? 론이 적은 부분은 둘이 같이 해독해야 할지도 모르겠네.')]}]}),
   N('2-13.hagrid','하그리드',26,17,[L('하그리드','돌아오니 다들 멀쩡해서 얼마나 다행인지 모르겠다.'),L('해리','거미들은 조금… 많았어요.'),L('하그리드','그랬냐? 음. 다음에는 내가 먼저 얘기해 두마.')],{kind:'hagrid',conditions:['2-13.reunion']}),
   N('2-13.teacher','스프라우트 교수',29,8,[L('스프라우트 교수','맨드레이크가 제 몫을 했어요. 돌봐 준 학생들 덕분이지요.'),L('스프라우트 교수','배우지 않은 심화 주문은 여기서 더 살펴보세요. 오늘은 서둘러 떠날 일이 없답니다.')],{shopId:'SH05',conditions:['2-13.hagrid'],reward:R(100,{I064:2},['P016'])})
  ],blockers:[{x:19,z:18,w:3,d:3},{x:32,z:22,w:4,d:2}],
  objectives:[O('2-13.reunion','돌아온 헤르미온느와 이야기하세요','interact','2-13.hermione'),O('2-13.hagrid','하그리드의 귀환을 맞으세요','interact','2-13.hagrid'),O('2-13.study','교수에게 회복 소식을 듣고 수업을 정리하세요','interact','2-13.teacher')],reward:R(100),completionDialogue:[L('론','기차에서 먹을 건 내가 챙길게. 해리, 이번에는 자동차 말고 기차로 가는 거다.'),L('헤르미온느','그건 부탁할 일이 아니라 당연한 거야.'),L('해리','알았어. 셋이 앉을 자리부터 맡자.')]
 })
]};
export default CHAPTER;
