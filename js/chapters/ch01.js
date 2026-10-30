const line = (speaker,text) => ({speaker,text});
const objective = (id,label,event,target,spell,hint) => ({id,label,event,...(target?{target}:{}),...(spell?{spell}:{}),count:1,hint});
const prop = (id,name,x,z,kind='book',extra={}) => ({id,type:'prop',kind,name,x,z,radius:.8,...extra});
const npc = (id,name,x,z,dialogue,extra={}) => ({id,type:'npc',kind:'wizard',name,x,z,radius:.8,dialogue,...extra});
const reward = (gold=0,items={},equipment=[],placementIds=[]) => ({gold,items,equipment,spells:[],placementIds});
const essential = ['S001','S002','S003','S005','S007','S026','S034','S035','S036','S038','S039'];
const scene = (id,name,theme,description,details) => ({id,name,theme,description,kicker:`CHAPTER I · ${id}`,width:36,depth:28,spawn:{x:7,z:22},entryDialogue:[],grantSpells:[],entities:[],blockers:[],objectives:[],reward:reward(),exit:{x:29,z:6},nextId:null,...details});

export const CHAPTER = {
  id:'ch01',title:'마법사의 돌',subtitle:'잉크로 시작해, 마법으로 완성하는 첫 번째 이야기',version:'0.2.0',
  scenes:[
    scene('1-01','폭풍 속의 초대','coast','폭풍이 몰아치는 바닷가. 당신 앞으로 도착한 한 통의 편지가 모든 것을 바꿉니다.',{
      nextId:'1-02',width:22,depth:18,layout:{kind:'hut',cameraSpan:21},spawn:{x:5,z:13},exit:{x:18,z:4},
      entryDialogue:[line('해리','또 그 편지야. 이번에는 정말 내 이름이 적혀 있어.'),line('해리','문밖에 누가 있나? 우선 편지부터 읽어 보자.')],
      entities:[
        prop('1-01.letter','봉인된 입학 편지',9,11,'letter',{interactLabel:'편지 읽기',dialogue:[line('편지','호그와트 마법학교에 입학하게 된 것을 축하합니다. 교재와 지팡이를 준비해 주세요.'),line('해리','마법학교라고? 누가 장난을 치는 건 아니겠지…')]}),
        npc('1-01.hagrid','하그리드',16,6,[line('하그리드','해리? 많이 컸구나. 난 하그리드야. 네 아버지와 어머니도 잘 알았지.'),line('하그리드','편지에 적힌 건 전부 사실이야. 넌 마법사고, 학교에서 기다리고 있어.')],{kind:'hagrid',conditions:['1-01.read-letter'],choices:[{id:'eager',label:'그럼 저도 마법을 배울 수 있어요?',flag:'ch01.firstReply',value:'eager',response:[line('하그리드','그럼! 처음에는 다들 실수해. 나도… 음, 그 얘긴 나중에 하자.'),line('하그리드','우선 지팡이를 사러 가자. 문 쪽으로 오렴.')]},{id:'unsure',label:'저는 평범한 사람인 줄 알았어요.',flag:'ch01.firstReply',value:'unsure',response:[line('하그리드','설명을 못 들었으니 그럴 만도 하지. 천천히 알아 가면 돼.'),line('하그리드','내가 함께 갈게. 문 쪽으로 오렴.')]}]})
      ],
      objectives:[objective('1-01.read-letter','입학 편지를 읽으세요','interact','1-01.letter',null,'탁자의 편지에 다가가 Enter를 누르세요.'),objective('1-01.meet-hagrid','하그리드와 이야기하세요','interact','1-01.hagrid',null,'편지를 읽은 뒤 문 가까이의 하그리드를 만나세요.')],reward:reward()
    }),
    scene('1-02','다이애건 골목의 첫 장보기','alley','지팡이, 교재, 작은 물약. 마법사로서의 첫 준비를 시작합니다.',{
      nextId:'1-03',width:48,depth:18,layout:{kind:'alley',cameraSpan:25},spawn:{x:4,z:13},exit:{x:44,z:6},
      entryDialogue:[line('하그리드','저 간판이 올리밴더스야. 네 첫 지팡이를 골라 보자. 생활비 150골드도 챙겨 뒀어.'),line('하그리드','서점과 약재상은 골목 안쪽에 있어. 물약을 꼭 사야 하는 건 아니니 너무 걱정하진 말고.')],
      entities:[
        npc('1-02.ollivander','올리밴더',12,11,[line('올리밴더','지팡이는 마법사를 선택하지. 이 지팡이를 들어 보게.'),line('올리밴더','좋아, 손끝이 따뜻해졌지? 잘 맞는다는 뜻이야. 소중히 쓰게.')],{kind:'shopkeeper',shopId:'SH01',reward:reward(150,{},['W001'],['PL_W001'])}),
        npc('1-02.bookseller','서점 주인',26,10,[line('서점 주인','필수 교재는 여기 있습니다. 빛을 켜는 주문은 lumos, 물체를 고치는 주문은 reparo예요.'),line('서점 주인','아직 외우지 않아도 괜찮습니다. 학교 수업에서 차근차근 배울 수 있어요.')],{kind:'shopkeeper',shopId:'SH02',conditions:['1-02.wand'],choices:[{id:'notes',label:'책에 메모를 해도 되나요?',flag:'ch01.bookReply',value:'notes',response:[line('서점 주인','물론이죠. 책도 자주 펼친 흔적이 남는 편이 좋답니다. 다만 빌린 책에는 안 돼요.')]},{id:'careful',label:'깨끗하게 읽고 잘 보관할게요.',flag:'ch01.bookReply',value:'careful',response:[line('서점 주인','좋은 마음이네요. 그래도 책장이 닳을 만큼 자주 읽어 주세요.')]}]}),
        npc('1-02.apothecary','약재상',39,8,[line('약재상','작은 회복 물약은 체력을 35, 마나 물약은 마나를 25 회복시켜요.'),line('약재상','마나는 잠시 주문을 쉬면 저절로 돌아옵니다. 필요한 만큼만 준비하세요.')],{kind:'shopkeeper',shopId:'SH03',conditions:['1-02.wand']})
      ],
      blockers:[{x:9,z:3,w:10,d:4},{x:25,z:3,w:10,d:4},{x:40,z:3,w:9,d:4}],
      objectives:[objective('1-02.wand','올리밴더에게 첫 지팡이를 받으세요','interact','1-02.ollivander'),objective('1-02.books','서점에서 교재를 확인하세요','interact','1-02.bookseller'),objective('1-02.potions','약재상에게 물약 설명을 들으세요','interact','1-02.apothecary')],reward:reward(0,{I001:1,I003:1})
    }),
    scene('1-03','기차에서 만난 친구들','train','붉은 기차가 북쪽으로 달립니다. 앞으로 함께할 친구들과 첫 마법 수업을 이야기합니다.',{
      nextId:'1-04',width:42,depth:12,layout:{kind:'train',cameraSpan:23},spawn:{x:4,z:8},exit:{x:38,z:6},
      entryDialogue:[line('론','여기 앉아도 돼? 다른 객실은 꽉 찼어.'),line('해리','물론이지. 창밖이 벌써 온통 들판이네.')],
      entities:[
        npc('1-03.ron','론',13,7,[line('론','빈자리 맞지? 나도 첫해야. 학교에서는 어떤 마법부터 배우고 싶어?')],{kind:'student',choices:[{id:'attack',label:'위험에 맞설 공격 마법',flag:'L01.interest',value:'attack',response:[line('론','멋지겠다. 난 네 뒤에서 응원할게. 너무 가까이 서진 않고!')]},{id:'ward',label:'친구를 지킬 수호 마법',flag:'L01.interest',value:'ward',response:[line('론','그럼 우리 같은 객실에 탄 건 잘된 일이네. 난 보호막이 꼭 필요할 것 같아.')]},{id:'utility',label:'문제를 풀어내는 생활 마법',flag:'L01.interest',value:'utility',response:[line('론','부러진 물건도 고칠 수 있겠네? 우리 집에 오면 연습할 건 많아.')]}]}),
        npc('1-03.hermione','헤르미온느',29,7,[line('헤르미온느','혹시 두꺼비 못 봤니? 네빌이 잃어버렸대.'),line('헤르미온느','참, 주문은 띄어쓰기 없이 쓰는 거야. 길어도 한 글자씩 정확하게. 학교에서 같이 연습하자.')],{kind:'student',conditions:['1-03.choose-interest'],dialogueVariants:[{flag:'L01.interest',equals:'attack',lines:[line('헤르미온느','공격 마법이 궁금하다고 들었어. 표적 뒤에 누가 있는지부터 확인하는 게 먼저야.'),line('헤르미온느','주문은 공백 없이, 한 글자씩 정확하게. 나중에 연습장에서 보여 줘.')]},{flag:'L01.interest',equals:'ward',lines:[line('헤르미온느','수호 마법부터 배우고 싶다고? 좋은 생각이야. 방어를 배워 두면 실수해도 덜 다치겠지.'),line('헤르미온느','긴 주문도 공백 없이 정확하게 쓰면 돼. 학교에서 같이 연습하자.')]},{flag:'L01.interest',equals:'utility',lines:[line('헤르미온느','생활 마법이 궁금하다고? 그럼 나중에 reparo부터 연습해 보자. 고칠 물건은 늘 생기니까.'),line('헤르미온느','긴 주문도 공백 없이 정확하게 쓰면 돼. 학교에서 같이 연습하자.')]}]})
      ],
      blockers:[{x:12,z:2.5,w:8,d:3},{x:28,z:2.5,w:8,d:3},{x:12,z:10.5,w:8,d:2},{x:28,z:10.5,w:8,d:2}],
      objectives:[objective('1-03.choose-interest','론에게 관심 있는 마법 분야를 말하세요','choice','1-03.ron'),objective('1-03.meet-hermione','헤르미온느와 주문 이야기를 나누세요','interact','1-03.hermione')],reward:reward(20,{I040:1,I064:1},[],['PL_I040','PL_I064'])
    }),
    scene('1-04','움직이는 성','castle','계단이 움직이는 성에서 기숙사와 교실을 찾고, 주인을 잃은 짐을 돌려줍니다.',{
      nextId:'1-05',width:40,depth:34,layout:{kind:'courtyard',cameraSpan:25,floorRegions:[{x:10,z:24,w:16,d:16},{x:20,z:21,w:12,d:8},{x:31,z:12,w:14,d:20}]},spawn:{x:7,z:27},exit:{x:35,z:4},
      entryDialogue:[line('안내자','따라오세요. 중앙 홀을 지나면 교실이, 왼쪽 통로를 오르면 기숙사가 있습니다.'),line('해리','잠깐, 계단 아래 가방이 남아 있어요. 이름표부터 볼게요.')],
      entities:[
        prop('1-04.trunk','잃어버린 가방',11,25,'chest',{consumeOnInteract:true,consumedVisual:'hidden',dialogue:[line('해리','기숙사 표식이 붙어 있네. 안내자에게 가져다 드리자.')],interactLabel:'가방 집기'}),
        prop('1-04.classroom-sign','교실 안내판',27,18,'sign',{dialogue:[line('안내판','마법 수업은 동쪽 교실에서 열립니다. 늦지 않도록 계단의 방향을 확인하세요.')],interactLabel:'교실 위치 확인'}),
        npc('1-04.guide','기숙사 안내자',32,7,[line('안내자','이 가방을 찾고 있었어요. 첫날부터 큰 도움을 주셨네요.'),line('안내자','이 매듭을 받아 주세요. 장비 가방에서 펜던트를 장착하면 최대 체력과 마나가 늘어납니다.')],{conditions:['1-04.trunk-found','1-04.classroom-found'],reward:reward(0,{},['P025'],['PL_P025']),choices:[{id:'lost',label:'사실 저도 길을 잃을 뻔했어요.',flag:'ch01.castleReply',value:'lost',response:[line('안내자','첫날에는 모두 그래요. 계단이 방향을 바꿔도 교실 표지판은 거짓말하지 않아요.')]},{id:'explore',label:'조금 더 둘러보고 싶어졌어요.',flag:'ch01.castleReply',value:'explore',response:[line('안내자','돌아올 길만 기억해 두세요. 그리고 닫힌 문에 코를 너무 가까이 대지는 마시고요.')]}]})
      ],blockers:[{x:7,z:19,w:2,d:2},{x:35,z:13,w:2,d:6}],
      objectives:[objective('1-04.trunk-found','계단 아래 분실물을 찾으세요','interact','1-04.trunk'),objective('1-04.classroom-found','교실 안내판을 확인하세요','interact','1-04.classroom-sign'),objective('1-04.delivered','기숙사 안내자에게 가방을 돌려주세요','interact','1-04.guide')],reward:reward(30)
    }),
    scene('1-05','첫 주문과 첫 실수','classroom','짧은 룬부터 긴 부양 주문까지. 이동하면서 입력하고, 필요한 순간에는 방어하세요.',{
      nextId:'1-06',width:32,depth:26,layout:{kind:'classroom',cameraSpan:24},spawn:{x:6,z:21},exit:{x:28,z:4},grantSpells:essential,
      entryDialogue:[line('플리트윅 교수','오늘 배운 주문을 직접 써 볼 차례군요. 주문서가 필요하면 잠깐 펼쳐 보세요. 서두를 필요 없습니다.'),line('플리트윅 교수','물체에 충분히 가까이 다가가야 주문이 닿습니다. 긴 주문을 쓰는 동안에도 화살표 이동과 Space 방어는 가능합니다.'),line('플리트윅 교수','연습 순서는 자유입니다. 틀린 주문은 Enter를 누르면 지워집니다. 다시 숨을 고르고 써 보세요.')],
      entities:[
        prop('1-05.lamp','꺼진 마법 등불',10,19,'lamp',{spell:'S034',interactLabel:'lumos로 불 밝히기'}),
        prop('1-05.broken','깨진 연습 장치',24,20,'machine',{spell:'S038',interactLabel:'reparo로 수리'}),
        prop('1-05.feather','황금 깃털',24,7,'feather',{spell:'S039',interactLabel:'wingardiumleviosa로 부양'}),
        {id:'1-05.dummy',type:'target',kind:'dummy',name:'연습 표적',x:10,z:7,radius:1,hp:50,objectiveOnly:true},
        npc('1-05.professor','플리트윅 교수',27,13,[line('플리트윅 교수','a는 빠른 비전 룬, incendio는 더 강한 화염 주문입니다. 마나가 모자라면 방어를 풀고 잠시 쉬세요.'),line('플리트윅 교수','Space는 계속 누르는 방어이고 protego는 별도의 보호막 주문입니다. 둘의 마나 소비를 비교해 보세요.')])
      ],
      blockers:[{x:17,z:12,w:3,d:10}],
      objectives:[objective('1-05.light','lumos로 등불을 밝히세요','cast','1-05.lamp','S034','등불 근처에서 lumos → Enter'),objective('1-05.repair','reparo로 장치를 고치세요','cast','1-05.broken','S038','장치 근처에서 reparo → Enter'),objective('1-05.levitate','깃털을 공중에 띄우세요','cast','1-05.feather','S039','깃털 근처에서 wingardiumleviosa → Enter'),objective('1-05.attack','연습 표적에 비전 룬을 쏘세요','cast','1-05.dummy','S001','표적 근처에서 a → Enter'),objective('1-05.shield','protego 보호막을 펼치세요','cast',null,'S026','protego → Enter')],reward:reward(45)
    }),
    scene('1-06','온실에서 오두막까지','garden','약초를 전달하고 수리공의 고장 난 장치를 고칩니다. 짧은 길에서도 마법이 쓸모를 보입니다.',{
      nextId:'1-07',width:48,depth:30,layout:{kind:'garden',cameraSpan:25,floorRegions:[{x:11,z:21,w:18,d:14},{x:25,z:20,w:14,d:8},{x:38,z:13,w:16,d:22}]},spawn:{x:5,z:24},exit:{x:44,z:4},
      entryDialogue:[line('스프라우트 교수','잎이 푸르게 핀 약초를 조금 따 주세요. 뿌리를 남기면 다시 자랍니다.'),line('스프라우트 교수','오두막 쪽 수리공에게 전해 주시겠어요? 물레도 멈췄다는데, 배운 수리 주문을 써 봐도 좋겠네요.')],
      entities:[
        prop('1-06.herbs','푸르게 자란 약초',12,21,'herbs',{consumeOnInteract:true,consumedVisual:'harvested',interactLabel:'약초 채집',dialogue:[line('해리','줄기 위쪽만 조금… 됐다. 뿌리는 그대로 두자.')]}),
        prop('1-06.machine','멈춘 물레 장치',36,17,'machine',{spell:'S038',conditions:['1-06.herbs'],dialogue:[line('장치','마모된 톱니가 어긋나 있습니다. reparo로 연결을 되돌릴 수 있습니다.')]}),
        npc('1-06.repairer','오두막 길의 수리공',40,7,[line('수리공','약초도 가져오고 톱니까지 맞춰 주셨군요. 이제 소음이 멎었어요.'),line('수리공','수선의 톱니와 기본 목재를 받아 주세요. 지팡이와 선택 주문은 여기서 더 살펴볼 수 있습니다.')],{kind:'shopkeeper',shopId:'SH04',conditions:['1-06.herbs','1-06.repaired'],reward:reward(35,{I031:2},['P026'],['PL_P026','PL_I031']),choices:[{id:'quiet',label:'이제 훨씬 조용하네요.',flag:'ch01.repairReply',value:'quiet',response:[line('수리공','그러게 말이야. 며칠 만에 새소리가 들리는군. 덕분에 살았어.')]},{id:'practice',label:'수업에서 연습한 보람이 있어요.',flag:'ch01.repairReply',value:'practice',response:[line('수리공','교수님께 자랑해도 되겠어. 이 톱니바퀴는 시험지보다 훨씬 고집이 셌거든.')]}]})
      ],blockers:[{x:10,z:17,w:8,d:2},{x:12,z:26,w:9,d:2},{x:43,z:13,w:2,d:6}],
      objectives:[objective('1-06.herbs','온실에서 약초를 채집하세요','interact','1-06.herbs'),objective('1-06.repaired','수리공의 장치를 reparo로 고치세요','cast','1-06.machine','S038'),objective('1-06.delivery','수리공에게 배달을 마치세요','interact','1-06.repairer')],reward:reward(25,{I001:1})
    }),
    scene('1-07','빗자루 위의 첫날','flight','낮은 높이에서 균형을 잡고 고리를 통과합니다. 마지막에는 작은 황금빛을 따라가세요.',{
      nextId:'1-08',width:58,depth:24,layout:{kind:'pitch',cameraSpan:29},spawn:{x:5,z:19},exit:{x:54,z:4},
      entryDialogue:[line('후치 부인','오늘은 첫 비행입니다. 화살표로 방향을 잡고 황금 고리의 중앙을 지나가세요.'),line('후치 부인','속도보다 안전한 경로가 먼저입니다. 모든 고리를 통과한 뒤 끝의 스니치에 다가가세요.')],
      entities:[
        {id:'1-07.ring1',type:'ring',kind:'flight-ring',name:'첫 번째 고리',x:15,z:17,radius:1.8},
        {id:'1-07.ring2',type:'ring',kind:'flight-ring',name:'두 번째 고리',x:29,z:8,radius:1.8,conditions:['1-07.ring1']},
        {id:'1-07.ring3',type:'ring',kind:'flight-ring',name:'세 번째 고리',x:41,z:16,radius:1.8,conditions:['1-07.ring2']},
        {id:'1-07.snitch',type:'ring',kind:'snitch',name:'황금 스니치',x:51,z:7,radius:1.5,conditions:['1-07.ring3']}
      ],objectives:[objective('1-07.ring1','첫 번째 고리를 통과하세요','flight','1-07.ring1'),objective('1-07.ring2','방향을 틀어 두 번째 고리를 통과하세요','flight','1-07.ring2'),objective('1-07.ring3','세 번째 고리를 통과하세요','flight','1-07.ring3'),objective('1-07.snitch','끝에 있는 스니치를 따라잡으세요','flight','1-07.snitch')],reward:reward(35,{I036:1},[],['PL_I036'])
    }),
    scene('1-08','할로윈의 소동','bathroom','친구가 화장실에 갇혀 있습니다. 트롤의 곤봉을 피하고 주변 물체를 이용하세요.',{
      nextId:'1-09',width:32,depth:30,layout:{kind:'washroom',cameraSpan:26},spawn:{x:6,z:25},exit:{x:27,z:4},
      entryDialogue:[line('론','트롤이 저 안에 있어! 헤르미온느를 먼저 확인하자.'),line('헤르미온느','곤봉을 띄워 봐! wingardiumleviosa를 쓰는 동안에도 움직일 수 있어.'),line('론','바닥이 붉게 번지면 달려! 저건 방패로 버틸 수가 없겠어!')],
      entities:[
        npc('1-08.hermione','헤르미온느',8,24,[line('헤르미온느','난 괜찮아. 트롤이 내려찍을 때 옆으로 빠져! 바닥의 곤봉에 부양 주문을 쓰면 큰 빈틈을 만들 수 있어.')],{kind:'student'}),
        {id:'MB1',type:'boss',kind:'troll',name:'산악 트롤',x:22,z:11,radius:1.6,hp:180,damage:26,speed:2.15,pattern:'troll',phaseCount:2,conditions:['1-08.friend']},
        prop('1-08.club','무거운 곤봉',17,17,'club',{spell:'S039',conditions:['1-08.friend'],interactLabel:'wingardiumleviosa',rearmWhileEnemyAlive:'MB1'})
      ],blockers:[{x:10,z:10,w:2,d:2},{x:26,z:20,w:2,d:2},{x:5,z:4,w:5,d:2}],
      objectives:[objective('1-08.friend','헤르미온느의 안전을 확인하세요','interact','1-08.hermione'),objective('1-08.club-lift','곤봉에 부양 주문을 사용하세요','cast','1-08.club','S039'),objective('1-08.troll','환경과 주문을 이용해 트롤을 제압하세요','kill','MB1',null,'곤봉 부양은 큰 피해를 줍니다. incendio와 a도 함께 사용하세요.')],reward:reward(80,{I001:1},['P013'],['PL_P013'])
    }),
    scene('1-09','눈 내린 학교','library','눈으로 고요해진 학교. 선물로 받은 망토를 걸치고 제한 구역의 기록을 조사합니다.',{
      nextId:'1-10',width:30,depth:40,layout:{kind:'library',cameraSpan:23},spawn:{x:5,z:34},exit:{x:24,z:5},grantSpells:['S037'],
      entryDialogue:[line('해리','누가 선물을 두고 갔지? 이름은 없고… 내 아버지 얘기가 적혀 있어.'),line('해리','도서관에서 봤던 자물쇠도 생각나네. alohomora를 써 볼 수 있겠어.')],
      entities:[
        prop('1-09.cloak','침대 위의 선물',8,32,'gift',{consumeOnInteract:true,consumedVisual:'hidden',dialogue:[line('메모','아버지가 남긴 물건이다. 현명하게 사용하렴.'),line('해리','손이 안 보여! 정말 투명해지는 망토였어.')],reward:reward(0,{I018:1},[],['PL_I018'])}),
        prop('1-09.lock','제한 구역의 자물쇠',14,24,'door',{spell:'S037',conditions:['1-09.cloak']}),
        prop('1-09.book','돌에 관한 오래된 기록',24,14,'book',{dialogue:[line('기록','영원한 생명에 관한 기록. 그리고 학교 깊은 곳으로 옮겨진 거울에 관한 짧은 문장.'),line('기록','거울은 욕망을 보여 주지만, 그 답을 주는 것은 아닙니다. 단서를 일지에 적었습니다.')],conditions:['1-09.unlocked']}),
        prop('1-09.mirror','복도의 작은 거울',14,7,'mirror',{spell:'S034',conditions:['1-09.recorded']})
      ],blockers:[{x:6,z:16,w:3,d:15},{x:22,z:28,w:3,d:9},{x:18,z:10,w:3,d:8}],
      objectives:[objective('1-09.cloak','침대 위의 선물을 확인하세요','interact','1-09.cloak'),objective('1-09.unlocked','alohomora로 자물쇠를 여세요','cast','1-09.lock','S037'),objective('1-09.recorded','오래된 기록에서 단서를 찾으세요','interact','1-09.book'),objective('1-09.mirror-light','lumos로 거울의 흔적을 살펴보세요','cast','1-09.mirror','S034')],reward:reward(35)
    }),
    scene('1-10','용을 보낸 뒤의 숲','forest','용을 안전하게 보낸 뒤, 숲에 남은 발자국을 따라 실종된 사람과 가방을 찾습니다.',{
      nextId:'1-11',width:48,depth:40,layout:{kind:'forest',cameraSpan:25,floorRegions:[{x:12,z:32,w:20,d:12},{x:24,z:24,w:16,d:14},{x:37,z:14,w:18,d:24}]},spawn:{x:6,z:34},exit:{x:43,z:4},
      entryDialogue:[line('하그리드','용의 이송은 무사히 끝났어. 그런데 숲길을 살피던 관리인이 돌아오지 않았군.'),line('하그리드','빛으로 발자국을 확인하고 가방을 찾아다 주자. 나무 사이를 지키는 생물은 조심하고.')],
      entities:[
        prop('1-10.tracks','희미한 발자국',14,31,'tracks',{spell:'S034'}),
        {id:'1-10.spider1',type:'enemy',kind:'spider',name:'숲 거미',x:24,z:24,radius:.8,hp:22,damage:8,speed:1.5,conditions:['1-10.tracks-lit']},
        {id:'1-10.spider2',type:'enemy',kind:'spider',name:'숲 거미',x:32,z:21,radius:.8,hp:22,damage:8,speed:1.3,conditions:['1-10.tracks-lit']},
        prop('1-10.bag','관리인의 가방',38,15,'chest',{consumeOnInteract:true,consumedVisual:'hidden',conditions:['1-10.spider1','1-10.spider2'],dialogue:[line('해리','이름표가 맞아. 가방 끈이 나뭇가지에 걸려 있었네. 이 빛나는 조각도 함께 돌려드리자.')],reward:reward(0,{I021:1},[],['PL_I021'])}),
        npc('1-10.keeper','길을 잃은 관리인',40,7,[line('관리인','불빛을 보고 여기까지 올 수 있었어요. 제 가방도 찾아 주셨군요.'),line('관리인','이 나침반을 받아 주세요. 다음에는 제가 다른 사람의 길잡이가 되겠습니다.')],{conditions:['1-10.bag-found'],reward:reward(20,{},['P019'],['PL_P019'])})
      ],blockers:[{x:8,z:28,w:3,d:2},{x:21,z:20,w:3,d:3},{x:43,z:21,w:2,d:5}],
      objectives:[objective('1-10.tracks-lit','lumos로 숲의 흔적을 밝히세요','cast','1-10.tracks','S034'),objective('1-10.spider1','가까운 숲 거미를 물리치세요','kill','1-10.spider1'),objective('1-10.spider2','안쪽 숲 거미를 물리치세요','kill','1-10.spider2'),objective('1-10.bag-found','쓰러진 수레 뒤의 가방을 찾으세요','interact','1-10.bag'),objective('1-10.rescued','관리인에게 가방을 돌려주세요','interact','1-10.keeper')],reward:reward(45,{I003:1})
    }),
    scene('1-11','돌을 지키는 장치들','puzzle','덩굴, 날아다니는 열쇠, 체스말, 물약. 지금까지 배운 것을 차례로 연결하세요.',{
      nextId:'1-12',width:52,depth:32,layout:{kind:'trials',cameraSpan:24,floorRegions:[{x:10,z:25,w:16,d:10},{x:20,z:24,w:8,d:6},{x:28,z:20,w:12,d:14},{x:36,z:17,w:8,d:6},{x:44,z:11,w:12,d:18}]},spawn:{x:5,z:26},exit:{x:48,z:4},
      entryDialogue:[line('헤르미온느','무작정 힘으로 밀어붙이지 마. 장치마다 반응하는 주문이 다를 거야.'),line('론','덩굴을 지나 열쇠를 잡고, 체스말을 옮기자. 마지막 물약은 병에 붙은 기록을 읽어야 해.')],
      entities:[
        prop('1-11.vines','길을 막은 덩굴',20,24,'vines',{spell:'S007',blocking:{w:2,d:6},interactLabel:'incendio로 덩굴 걷기'}),
        prop('1-11.key','날아다니는 은빛 열쇠',28,22,'key',{spell:'S036',conditions:['1-11.vines']}),
        prop('1-11.chess','마지막 흰색 체스말',43,17,'chess',{spell:'S039',conditions:['1-11.key'],interactLabel:'체스말을 안전한 칸으로 부양'}),
        prop('1-11.potions','세 병의 물약',45,7,'potions',{conditions:['1-11.chess'],dialogue:[line('병의 기록','금빛 병에는 독이 들었다. 돌아가는 물약은 푸른 병에 담겼다. 남은 한 병이 앞길의 불꽃을 잠재운다.'),line('헤르미온느','그림보다 기록을 믿자. 앞으로 가는 병이 어느 것인지 알겠지? 틀려도 다시 생각할 수 있어.')],choices:[{id:'red',label:'붉은 병을 고른다',flag:'1-11.potion',value:'red',response:[line('헤르미온느','맞아. 조금만 마셔. 나머지는 내가 돌아갈 때 쓸게.')]},{id:'gold',label:'금빛 병을 고른다',flag:'1-11.potion',value:'gold',response:[line('헤르미온느','잠깐! 그건 독이라고 적혀 있어. 병을 내려놓고 기록을 다시 보자.')]},{id:'blue',label:'푸른 병을 고른다',flag:'1-11.potion',value:'blue',response:[line('헤르미온느','그건 돌아가는 길이야. 우리는 앞의 불꽃을 지나야 하잖아. 다시 골라 보자.')]}]}),
        prop('1-11.crystal','체스방의 보상 받침대',47,14,'crystal',{conditions:['1-11.chess'],dialogue:[line('기록','체스판의 봉인이 풀리며 마력 결정과 작은 왕관이 모습을 드러냅니다.')],reward:reward(0,{I022:1},['P027'],['PL_I022','PL_P027'])})
      ],blockers:[{x:8,z:21,w:2,d:2},{x:24,z:15,w:2,d:2}],
      objectives:[objective('1-11.vines','incendio로 덩굴을 걷어 내세요','cast','1-11.vines','S007'),objective('1-11.key','accio로 은빛 열쇠를 잡으세요','cast','1-11.key','S036'),objective('1-11.chess','wingardiumleviosa로 체스말을 옮기세요','cast','1-11.chess','S039'),{...objective('1-11.potions','기록을 읽고 앞으로 가는 물약을 고르세요','choice','1-11.potions',null,'금빛은 독, 푸른색은 돌아가는 길입니다. 남은 병을 생각하세요.'),choice:'red'},objective('1-11.reward','체스방의 보상을 확인하세요','interact','1-11.crystal')],reward:reward(60)
    }),
    scene('1-12','거울 앞의 대결','mirror','돌을 탐내는 자와 돌을 지키려는 자. 거울 앞에서 첫해의 마지막 시험이 시작됩니다.',{
      nextId:'2-01',chapterEnd:true,width:40,depth:40,layout:{kind:'arena',boundary:'ellipse',cameraSpan:27},spawn:{x:12,z:31},exit:{x:20,z:4},grantSpells:essential,temporarySupplies:{SUP_B1_I001:2,SUP_B1_I003:2},
      entryDialogue:[line('퀴렐','여기까지 올 줄은 몰랐군. 하지만 거울이 내게 보여 주지 않는 것이 있어.'),line('퀴렐','그 결계에 손대지 마라. 거울은 내가 지킨다!'),line('해리','양쪽 장치가 마력을 보내고 있어. incendio로 끊어 보자.')],
      entities:[
        {id:'B1',type:'boss',kind:'quirrell',name:'퀴렐',x:22,z:17,radius:1,hp:320,damage:14,speed:1,pattern:'quirrell',phaseCount:3},
        prop('1-12.ward-left','왼쪽 그림자 결계',12,17,'ward',{spell:'S007'}),
        prop('1-12.ward-right','오른쪽 그림자 결계',29,19,'ward',{spell:'S007'}),
        prop('1-12.mirror','소망의 거울',20,6,'mirror',{conditions:['1-12.ward-left','1-12.ward-right','1-12.quirrell'],dialogue:[line('기록','거울 속의 당신은 돌을 사용할 생각 없이 지키고 있습니다. 손을 뻗자 작은 돌이 손바닥에 닿습니다.'),line('퀴렐','그 돌을 내놓아라!'),line('기록','마지막 접촉과 함께 빛이 번집니다. 다음 순간, 익숙한 목소리가 멀리서 들립니다.'),line('덤블도어','잘해 주었네. 자네가 지킨 것은 돌 하나만이 아니야. 이제 친구들이 기다리는 연회로 돌아가세.')],reward:reward(0,{I061:1},[],['PL_I061'])})
      ],blockers:[{x:10,z:25,w:2.4,d:2.4},{x:29,z:28,w:2.4,d:2.4},{x:10,z:10,w:2.4,d:2.4},{x:31,z:10,w:2.4,d:2.4}],
      objectives:[objective('1-12.ward-left','왼쪽 결계를 incendio로 해제하세요','cast','1-12.ward-left','S007'),objective('1-12.ward-right','오른쪽 결계를 incendio로 해제하세요','cast','1-12.ward-right','S007'),objective('1-12.quirrell','퀴렐의 세 단계 공격을 돌파하세요','kill','B1'),objective('1-12.stone','거울 앞에서 돌을 지키세요','interact','1-12.mirror')],reward:reward(150,{I001:2,I003:2})
    })
  ]
};

export default CHAPTER;
