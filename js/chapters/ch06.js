import {L,R,choice,talk as T,cast as C,wave as W,ring as F,hold as H,defeat as K,makeScene} from './chapter-tools.js';
const S=(n,name,theme,options,steps)=>makeScene(6,n,name,theme,options,steps);
const D=(...lines)=>lines.map(([speaker,text])=>L(speaker,text));
const lakePoints=[[15,29],[20,33],[25,28],[30,33],[36,29],[42,32],[47,27],[53,30],[18,19],[27,15],[39,17],[49,18]];
const lakeWave=(id,n)=>W(id,'호수의 인페리','inferius',lakePoints.slice(0,n),{hp:104,damage:26,speed:2.8,combat:{sequence:['grasp','claw'],preferredRange:2.2,attackRange:10,aggroRange:44,startDelay:2.2,activationDelay:2}});
export const CHAPTER={id:'ch06',title:'혼혈 왕자',subtitle:'기억 속에 남은 이름',version:'0.7.0',scenes:[
 S(1,'늦여름의 방문','headquarters',{width:38,depth:32,rest:true,grantSpells:['S038']},[
  T('headmaster','덤블도어',10,24,D(['덤블도어','오늘은 함께 방문할 사람이 있네. 자네가 오면 이야기가 조금 수월해질 것 같아서 말이지.']),{kind:'dumbledore',hiddenAfter:['6-01.chair']}),
  C('repair','reparo로 어지러진 응접실을 복구하세요',22,20,'S038','machine'),
  T('chair','유난히 큰 안락의자',27,14,D(['해리','교수님, 이 의자는 왜 숨을 쉬어요?'],['슬러그혼','좋아, 좋아. 들켰군. 손님한테 보일 집 꼴이 아니지?']),{kind:'slughorn'}),
  T('invite','문가의 슬러그혼',18,7,D(['슬러그혼','자네 어머니도 내가 가르쳤지. 아주 재능 있는 학생이었어.']),{kind:'slughorn',choices:[choice('mother','어머니는 어떤 학생이었나요?','슬러그혼은 잠시 말을 멈추더니, 차를 한 잔 더 따랐다.'),choice('school','학교에 돌아오시면 좋겠어요.','돌아갈 자리가 아직 있을지 모르겠군. 자네 말은 생각해 보지.',{speaker:'슬러그혼'})],reward:R(180)})
 ]),
 S(2,'빛바랜 다이애건 골목','street',{width:64,depth:28,rest:true,blockers:[{x:22,z:7,w:14,d:7},{x:45,z:22,w:14,d:7}]},[
  T('closed','닫힌 올리밴더스',11,21,D(['론','문이 닫혔어. 안에 먼지가 잔뜩 쌓였네.'],['해리','가게를 비웠다는 안내문도 없어.']),{kind:'gate'}),
  T('order','완성되지 않은 주문서',27,18,D(['상인','남은 수리 의뢰는 저희가 받을 겁니다. 연락처를 챙겨 가세요.']),{kind:'letter',consumeOnInteract:true,shopId:'SH09'}),
  T('twins','위즐리 형제의 가게',43,11,D(['조지','우리 가게까지 조용할 필요는 없잖아?'],['프레드','암흑 가루는 가까운 적에게는 안 통해. 설명서도 꼭 읽어!']),{shopId:'SH12',reward:R(220,{I013:2,I014:2})}),
  T('draco','옆 골목의 말포이',57,6,D(['헤르미온느','해리, 왜 갑자기 멈춰?'],['해리','말포이가 혼자 녹턴 앨리로 들어갔어.']),{kind:'draco',hiddenAfter:['6-02.draco']})
 ]),
 S(3,'골목의 뒤를 따라서','street',{width:30,depth:56,spawn:{x:6,z:49},exit:{x:24,z:5},grantSpells:['S064'],blockers:[{x:8,z:32,w:8,d:10},{x:24,z:17,w:8,d:9}]},[
  T('listen','창문 밑의 론',12,45,D(['론','여기서 들릴까?'],['헤르미온느','유리를 건드리지 마. 소리 나.']),{kind:'student'}),
  C('trace','homenumrevelio로 가게 안의 기척을 살피세요',20,36,'S064','vanishing-cabinet'),
  T('notes','들려오는 거래',20,26,D(['드레이코','고쳐야 해. 작동하는 쪽은 여기 두고.'],['해리','물건 두 개가 연결되어 있다는 말인가?']),{kind:'book',choices:[choice('record','장식장의 모양을 적어 둔다.','손잡이와 테두리의 무늬를 빠르게 그렸다.',{flag:'ch06.cabinetClue',value:'shape'}),choice('listen','어디로 보내는지 더 들어 본다.','행선지는 들리지 않았다. 대신 수리 부품의 이름을 기억했다.',{flag:'ch06.cabinetClue',value:'parts'})]}),
  T('withdraw','돌아갈 길',16,8,D(['헤르미온느','이만 돌아가자. 그쪽으로 따라가면 우리가 보일 거야.'],['해리','학교에서 저 장식장을 보면 바로 알 수 있을 거야.']),{kind:'sign',reward:R(120)})
 ]),
 S(4,'책장 속의 다른 필기','classroom',{width:42,depth:34,rest:true,grantSpells:['S014','S007']},[
  T('book','낡은 마법약 교재',10,27,D(['해리','인쇄된 설명 위에 다른 글씨가 가득해. 콩을 자르지 말고 으깨라고?']),{kind:'book',reward:R(0,{},['P039'])}),
  C('water','aguamenti로 솥의 물을 맞추세요',22,23,'S014','ritual-basin'),
  C('heat','incendio로 약한 불을 붙이세요',29,15,'S007','brazier'),
  T('result','슬러그혼',25,7,D(['슬러그혼','훌륭해! 어머니의 솜씨를 닮았구나.'],['헤르미온느','네 책에는 대체 뭐라고 적혀 있는 거야?']),{kind:'slughorn',choices:[choice('show','책의 필기를 보여 준다.','필기 주인이 누군지는 확인해야 해. 전부 믿지는 마.',{speaker:'헤르미온느'}),choice('later','수업 끝나면 같이 보자.','좋아. 혼자 위험한 걸 실험하지는 말고.',{speaker:'헤르미온느'})]})
 ]),
 S(5,'슬러그 클럽의 초대','castle',{width:46,depth:30,rest:true},[
  T('party','슬러그혼',11,23,D(['슬러그혼','어려운 시기에도 서로 아는 사람이 있다는 건 도움이 되지. 자, 어떤 분야에 흥미가 있나?']),{kind:'slughorn',choices:[choice('fire','넓은 화염 · ignisdraconis','큰 불꽃일수록 주변을 확인하게. 눈앞의 상대만 보는 버릇은 좋지 않아.',{speaker:'슬러그혼',reward:R(0,{},[],['S049'])}),choice('guardian','돌 수호자 · custoslapideus','혼자 움직이는 것보다 든든하겠군. 오래 붙잡아 둘 수는 없다는 걸 기억하게.',{speaker:'슬러그혼',reward:R(0,{},[],['S045'])}),choice('heal','지속 치유 · sanavita','회복할 시간을 버는 것도 실력이야.',{speaker:'슬러그혼',reward:R(0,{},[],['S031'])})]}),
  T('guest','네빌',27,18,D(['네빌','여기 음식은 훌륭한데, 뭘 얘기해야 할지 모르겠어.'],['해리','온실 얘기는? 넌 거기서 무슨 일이 있는지 다 알잖아.']),{kind:'neville'}),
  T('memory','슬러그혼의 오래된 사진',37,9,D(['해리','사진 속 학생은 낯익은 미소를 짓고 있었다. 펜시브에서 본 얼굴이다.']),{kind:'book',reward:R(150)})
 ]),
 S(6,'퀴디치 주장의 하루','flight',{width:74,depth:42,spawn:{x:6,z:32},exit:{x:67,z:7},rest:true},[
  T('team','론',11,32,D(['론','주장님, 오늘도 엄격하게 뽑을 거야?'],['해리','친구라고 봐주면 다른 애들이 바로 알걸.']),{kind:'student',choices:[choice('steady','천천히, 첫 공부터 막아 봐.','론은 숨을 한 번 길게 내쉬고 골대 쪽으로 날아갔다.'),choice('joke','공 대신 내 얼굴이라고 생각해.','그럼 너무 세게 칠지도 몰라.',{speaker:'론'})]}),
  F('ring1',20,28),F('ring2',33,14),F('ring3',46,30),F('ring4',59,17),F('ring5',66,8),
  T('result','훈련을 마친 동료들',66,7,D(['지니','처음엔 삐걱거려도 마지막에는 맞았잖아.'],['해리','다음에는 공을 받기 전에 서로 불러 줘.']),{kind:'student',reward:R(180)})
 ]),
 S(7,'호그스미드의 목걸이','village',{width:52,depth:34,grantSpells:['S029'],temporarySupplies:{SUP_I002:2},blockers:[{x:17,z:10,w:10,d:7},{x:38,z:25,w:9,d:7}]},[
  T('alarm','눈길의 비명',12,27,D(['학생','케이티가 갑자기 공중으로 올라갔어!'],['해리','소포에서 손 떼! 아무도 목걸이를 만지지 마.']),{kind:'student'}),
  C('seal','finiteincantatem으로 목걸이의 기운을 누르세요',25,22,'S029','locket'),
  T('wrap','천으로 감싼 오팔 목걸이',32,16,D(['해리','손에 닿지 않도록 천 끝을 묶었다. 봉투에는 보낸 사람 이름이 없었다.']),{kind:'locket',consumeOnInteract:true,reward:R(0,{I058:1})}),
  H('escort','하그리드가 올 때까지 4초 곁을 지키세요',40,12,4,{holdRadius:4}),
  T('hagrid','하그리드',45,6,D(['하그리드','내가 데려가마. 그 물건은 교수님께 드리고, 너희도 바로 돌아가라.']),{kind:'hagrid',storyItemChanges:{I058:'used'},reward:R(120)})
 ]),
 S(8,'과거를 보는 수업','observatory',{width:46,depth:42,rest:true,grantSpells:['S068'],blockers:[{x:23,z:22,w:5,d:5}]},[
  T('lesson','덤블도어',10,34,D(['덤블도어','이번에는 싸우는 법보다 알아보는 법을 배울 걸세. 어떤 선택을 했는지 보게.']),{kind:'dumbledore',hiddenAfter:['6-08.link2']}),
  C('link1','lumenmemoriae로 고아원의 기억을 밝히세요',17,28,'S068','crystal'),
  C('link2','lumenmemoriae로 두 번째 기억을 연결하세요',32,19,'S068','prophecy-orb'),
  T('stars','기억 사이의 별문자',34,10,D(['덤블도어','긴 주문은 서두를수록 틀리기 쉽지. 손이 익을 때까지 안전한 곳에서 연습하게.']),{kind:'book',choices:[choice('nova','집중 폭발 · astralnova','한 지점을 정해 힘을 모으는 쪽을 택했다.',{reward:R(0,{},[],['S050'])}),choice('stars','연속 낙하 · letthestarsanswermycall','같은 위치에 빛이 세 번 모이는 순서를 적어 두었다.',{reward:R(0,{},[],['S052'])})],reward:R(200,{},['P006'])}),
  T('missing','덤블도어',20,7,D(['덤블도어','마지막으로 필요한 기억을 슬러그혼이 가지고 있네. 다만, 자네가 직접 얻어야 할 것 같구나.']),{kind:'dumbledore'})
 ]),
 S(9,'숨겨진 주문 연구','library',{width:38,depth:38,rest:true,grantSpells:['S065'],blockers:[{x:11,z:18,w:5,d:10},{x:27,z:18,w:5,d:10}]},[
  T('notes','책 여백의 주문들',18,30,D(['헤르미온느','무슨 효과인지도 모르는 주문이잖아. 그냥 시전해 보면 안 돼.'],['해리','필기 주인은 사용법까지 적어 놨어. 일부러 숨긴 것 같아.']),{kind:'book',choices:[choice('research','별도로 연구한다 · 선택 저주 3종','효과와 부작용을 옮겨 적고, 원본을 따로 보관했다.',{flag:'ch06.research',value:'research',reward:R(0,{},['P008','W014'],['S053','S054','S055'])}),choice('record','이름만 기록하고 사용하지 않는다.','주문 이름 옆에 물음표를 적었다. 지금은 확인된 주문으로 충분하다.',{flag:'ch06.research',value:'record',reward:R(120)}),choice('seal','책의 위험한 페이지를 봉한다.','접은 종이 사이에 표식을 끼웠다. 다시 열려면 한번 더 생각하게 될 것이다.',{flag:'ch06.research',value:'seal',reward:R(0,{I002:2})})]}),
  C('quiet','muffliato로 책상 주변의 소리를 낮추세요',19,19,'S065','book'),
  T('leave','헤르미온느',19,7,D(['헤르미온느','몰라서 조심하는 건 겁먹는 것과 달라.'],['해리','알아. 이 책 주인이 누군지는 계속 찾아볼게.']),{kind:'student'})
 ]),
 S(10,'고쳐지지 않는 장식장','night-castle',{width:56,depth:34,grantSpells:['S024','S040'],blockers:[{x:19,z:12,w:6,d:10},{x:37,z:25,w:10,d:6}]},[
  C('trace','revelio로 바닥의 수리 흔적을 살피세요',13,27,'S040','letter'),
  T('cabinet','틈이 벌어진 장식장',29,20,D(['해리','골목에서 본 것과 같은 무늬야. 안쪽에서는 바람이 불어오는데 벽 뒤에는 아무것도 없어.']),{kind:'vanishing-cabinet',dialogueVariants:[{flag:'ch06.cabinetClue',equals:'parts',lines:D(['해리','그때 들었던 부품 이름이 여기 상자에도 적혀 있어. 같은 장치를 고치는 거야.'])}]}),
  C('anchor','umbraancora로 전이 흔적을 고정하세요',43,14,'S024','crystal'),
  T('withdraw','복도 끝의 발소리',49,7,D(['해리','발소리가 가까워진다. 지금 안으로 들어가면 막힐 수 있어.']),{kind:'sign',reward:R(150)})
 ]),
 S(11,'깨진 침묵','castle',{width:42,depth:36,rest:true,temporarySupplies:{SUP_I002:2,SUP_I004:3},blockers:[{x:13,z:17,w:3,d:4},{x:30,z:17,w:3,d:4}]},[
  T('start','드레이코',13,28,D(['드레이코','너는 아무것도 몰라. 계속 따라다니지 마!'],['해리','그 장식장으로 누구를 들이려는 거야?']),{kind:'draco',hiddenAfter:['6-11.start']}),
  K('duel','드레이코',25,10,'draco',{type:'boss',hp:430,radius:.7,speed:2.6,combat:{sequence:['duel','disarm','volley','burst'],attackRange:25,aggroRange:40,preferredRange:9,projectileSpeed:12,startDelay:2},label:'드레이코의 공격을 막고 결투를 끝내세요'}),
  T('snape','스네이프',25,18,D(['스네이프','지팡이를 내려라, 포터. 복도로 나가 있어.'],['해리','먼저 주문을 쓴 건…'],['스네이프','지금은 변명할 때가 아니다.']),{kind:'snape',dialogueVariants:[{flag:'ch06.duel.forbidden',equals:true,lines:D(['스네이프','그 주문을 어디서 배웠지?'],['해리','이런 결과가 될 줄은…'],['스네이프','모르는 주문을 사람에게 시험한 대가다. 물러서라.'])}]}),
  T('book','닫힌 책',35,7,D(['해리','책을 펼치려다 손을 멈췄다. 여백에 적힌 이름도, 오늘 들은 목소리도 머릿속에서 떠나지 않는다.']),{kind:'book',reward:R(100)})
 ]),
 S(12,'행운의 저녁','garden',{width:54,depth:38,rest:true},[
  T('felix','작은 행운 물약',11,30,D(['헤르미온느','교장 선생님이 부탁하신 기억, 오늘은 받을 수 있겠어?'],['해리','한 가지 해 볼 방법이 있어.']),{kind:'trunk',consumeOnInteract:true,reward:R(0,{I011:1})}),
  T('drink','온실 앞 갈림길',24,25,D(['해리','차가운 물약이 목을 지나갔다. 서둘러 교무실로 갈 생각이 사라졌다. 먼저 하그리드에게 가고 싶어졌다.']),{kind:'sign',storyItemChanges:{I011:'used'}}),
  T('hagrid','하그리드',36,18,D(['하그리드','와 줬구나. 오늘은 집이 너무 조용해서 말이야.'],['슬러그혼','친구를 보내는 자리에 혼자 있게 할 수는 없지.']),{kind:'hagrid'}),
  T('memory','슬러그혼',44,10,D(['슬러그혼','내가 그 아이에게 그런 말을 해 주지만 않았어도…']),{kind:'slughorn',choices:[choice('mother','어머니가 왜 죽어야 했는지 알고 싶어요.','미안하네. 자네 어머니 이름 뒤에 더는 숨지 않겠어.',{speaker:'슬러그혼',flag:'ch06.memoryApproach',value:'mother'}),choice('future','그 사람이 다시는 같은 일을 못 하게 도와주세요.','과거를 바꾸지는 못해도, 감추는 건 그만둘 수 있겠지.',{speaker:'슬러그혼',flag:'ch06.memoryApproach',value:'future',reward:R(80)})]}),
  T('bottle','은빛 기억이 든 병',46,6,D(['해리','병을 기울이자 흐릿했던 목소리가 또렷해졌다. 이번에는 빈 곳이 없다.']),{kind:'crystal',consumeOnInteract:true,reward:R(150)})
 ]),
 S(13,'나뉜 영혼','observatory',{width:36,depth:36,rest:true,grantSpells:['S068']},[
  C('memory','lumenmemoriae로 진짜 기억을 재생하세요',13,28,'S068','ritual-basin'),
  T('answer','덤블도어',25,21,D(['덤블도어','호크룩스. 영혼의 일부를 다른 곳에 숨겨 죽음을 피하려는 시도라네.'],['해리','일기장은 단순한 기억이 아니었군요.']),{kind:'dumbledore',choices:[choice('objects','그런 물건이 더 있다는 거죠?','그렇네. 평범한 물건을 무작정 뒤질 수는 없지. 그가 중요하게 여긴 것을 찾아야 하네.',{speaker:'덤블도어'}),choice('destroy','전부 없애면 끝낼 수 있나요?','남겨 둔 길을 하나씩 끊는 것이지. 쉬운 일은 아닐 걸세.',{speaker:'덤블도어'})]}),
  T('map','해안의 기록',22,11,D(['해리','지도에는 마을 이름도 길도 없다. 절벽에 표시된 작은 점 하나뿐이다.']),{kind:'book'}),
  T('prepare','덤블도어',11,6,D(['덤블도어','떠나기 전에 필요한 것을 챙기게. 밖에서는 내 지시를 따라 주겠다고 약속하고.']),{kind:'dumbledore',reward:R(180)})
 ]),
 S(14,'떠나기 전의 정비','classroom',{width:52,depth:32,rest:true,grantSpells:['S007','S049','S027','S014','S010'],entryDialogue:D(['헤르미온느','인페리는 불을 두려워한대. 불을 크게 다루는 주문도 같이 연습해.'],['해리','준비를 마치면 교장실로 갈게.'])},[
  T('supply','학교 보급 연락원',11,24,D(['연락원','해안으로 간다면 젖지 않게 포장해 드릴게요. 장비도 지금 바꿔 두세요.']),{kind:'shopkeeper',shopId:'SH13',reward:R(350,{I002:4,I004:5})}),
  C('fire','ignisdraconis로 연습 표적을 태우세요',25,23,'S049','target'),
  C('ward','protegototalum으로 쉼터를 보호하세요',38,16,'S027','patronus-ward'),
  T('ron','론과 헤르미온느',43,7,D(['론','말포이는 우리가 살펴볼게.'],['헤르미온느','돌아오면 바로 알려 줘. 기다리고 있을 테니까.']),{kind:'student'})
 ]),
 S(15,'해안의 문','coast',{width:68,depth:38,spawn:{x:6,z:30},exit:{x:61,z:6},grantSpells:['S068','S007','S038'],layout:{kind:'coast',floorRegions:[{x:17,z:29,w:28,d:14},{x:34,z:25,w:12,d:10},{x:45,z:18,w:18,d:22},{x:56,z:7,w:20,d:10}]}},[
  T('cliff','덤블도어',13,29,D(['덤블도어','사람이 다니기에는 불편한 길이군. 바로 그래서 이곳을 골랐을 테지.']),{kind:'dumbledore',hiddenAfter:['6-15.trace']}),
  C('trace','lumenmemoriae로 절벽의 흔적을 찾으세요',26,28,'S068','crystal'),
  C('brush','incendio로 젖은 덤불을 걷어 내세요',34,25,'S007','brush',{blocking:{w:2,d:10},hiddenUntilAvailable:false}),
  C('bridge','reparo로 끊어진 발판을 이으세요',45,15,'S038','machine'),
  T('door','동굴 입구의 덤블도어',57,7,D(['해리','교수님, 문에 손을 대지 마세요.'],['덤블도어','입장료를 요구하는 모양이네. 소란을 피울 필요는 없겠지.']),{kind:'dumbledore'})
 ]),
 S(16,'검은 호수','cave',{layout:{kind:'cave',floorRegions:[{x:33,z:25,w:52,d:22},{x:16,z:33,w:24,d:12},{x:49,z:32,w:20,d:12},{x:33,z:13,w:26,d:16},{x:52,z:9,w:20,d:12}]},width:66,depth:46,spawn:{x:7,z:37},exit:{x:58,z:7},rest:true,grantSpells:['S007','S049','S027'],temporarySupplies:{SUP_I002:5,SUP_I004:6},blockers:[{x:22,z:23,w:4,d:4},{x:43,z:23,w:4,d:4}],encounter:{bossId:'MB6',endObjectives:['6-16.boat'],phases:[['6-16.watch1'],['6-16.watch2']],progress:['6-16.watch1','6-16.watch2','6-16.watch3'],label:'호수의 포위'},entities:[{id:'MB6',type:'boss',kind:'dumbledore',name:'검은 호수 · 불빛을 지키세요',x:32,z:11,hp:1,invulnerable:true,radius:.8,speed:0,conditions:['6-16.start'],hiddenUntilAvailable:true,hiddenAfter:['6-16.boat'],combat:{attackRange:0,aggroRange:0}}],entryDialogue:D(['덤블도어','내가 부탁해도 멈추지 말게. 이 약을 모두 마셔야 하네.'],['해리','알겠어요. 교수님 곁에 있을게요.'])},[
  T('start','의식의 대야',12,36,D(['해리','물이 아니야. 잔에 담자 녹색 빛이 손끝에 비쳤다.'],['덤블도어','시작하게.']),{kind:'ritual-basin'}),
  C('fire1','incendio로 서쪽 화로에 불을 붙이세요',16,27,'S007','brazier'),
  lakeWave('rise1',8),
  H('watch1','첫 잔을 마실 동안 3초 곁을 지키세요',29,20,3,{kind:'ritual-basin',holdRadius:4}),
  C('fire2','incendio로 동쪽 화로에 불을 붙이세요',48,26,'S007','brazier'),
  lakeWave('rise2',10),
  H('watch2','두 번째 잔을 마실 동안 4초 곁을 지키세요',34,19,4,{kind:'ritual-basin',holdRadius:4}),
  C('fire3','incendio로 돌아갈 길의 화로를 밝히세요',33,9,'S007','brazier'),
  lakeWave('rise3',12),
  H('watch3','마지막 잔을 마실 동안 5초 곁을 지키세요',33,15,5,{kind:'ritual-basin',holdRadius:4}),
  T('locket','대야 밑의 로켓',36,12,D(['해리','찾았어요. 이제 여기서 나가요.'],['덤블도어','조금만 물을…']),{kind:'locket',consumeOnInteract:true,reward:R(0,{I057:1})}),
  T('boat','불길 너머의 배',58,7,D(['해리','호수에서 손이 올라왔다. 교수님의 지팡이 끝에서 번진 불이 그 손들을 밀어냈다.'],['덤블도어','괜찮네. 자네가 여기 있으니.']),{kind:'gate',reward:R(300)})
 ]),
 S(17,'천문탑의 밤','night-castle',{width:50,depth:54,spawn:{x:7,z:46},exit:{x:43,z:6},grantSpells:['S010'],temporarySupplies:{SUP_I002:3,SUP_I004:4},blockers:[{x:14,z:28,w:5,d:12},{x:35,z:18,w:6,d:8}],entryDialogue:D(['해리','탑 위에 어둠의 표식이 있어요.'],['덤블도어','스네이프 교수를 불러 주게. 서둘러.'])},[
  W('corridor','성에 들어온 침입자','death-eater',[[15,42],[21,39],[28,43],[35,38],[27,32],[39,33],[21,24],[30,25]],{hp:120,damage:27,combat:{sequence:['hex','volley','disarm'],projectileSpeed:12.5}}),
  C('rubble','reducto로 계단 앞 잔해를 부수세요',40,23,'S010','machine'),
  T('tower','천문탑의 문',40,13,D(['드레이코','전 해야 해요. 안 그러면…'],['덤블도어','아직 다른 선택이 있네. 그들을 기다릴 필요는 없지.']),{kind:'gate'}),
  T('night','탑 위의 불빛',30,8,D(['해리','몸이 움직이지 않았다. 계단에서 검은 망토가 올라오는 동안에도.'],['덤블도어','세베루스…'],['해리','초록빛이 사라지자, 묶여 있던 다리가 풀렸다. 난간 너머에는 아무도 없었다.']),{kind:'crystal'}),
  T('chase','열린 계단',43,6,D(['해리','스네이프가 성문 쪽으로 가고 있어. 멈춰!']),{kind:'sign'})
 ]),
 S(18,'성 밖의 추격','night-castle',{width:74,depth:46,spawn:{x:7,z:37},exit:{x:69,z:7},rest:true,nextId:null,chapterEnd:true,grantSpells:['S010','S033'],temporarySupplies:{SUP_I002:4,SUP_I004:5},layout:{kind:'night-castle',floorRegions:[{x:12,z:36,w:20,d:14},{x:27,z:34,w:12,d:10},{x:38,z:25,w:18,d:22},{x:49,z:18,w:12,d:10},{x:58,z:10,w:16,d:14},{x:68,z:8,w:10,d:10}]},encounter:{bossId:'B6',phasePositions:[null,{x:35,z:25},{x:57,z:7}],endObjectives:['6-18.gate3'],phases:[['6-18.gate1'],['6-18.gate2']],progress:['6-18.gate1','6-18.gate2','6-18.gate3'],label:'열린 퇴로'},entities:[{id:'B6',type:'boss',kind:'snape',name:'스네이프 · 퇴로를 여세요',x:14,z:31,hp:1,invulnerable:true,radius:.8,speed:3.5,conditions:['6-18.start'],hiddenUntilAvailable:true,hiddenAfter:['6-18.gate3'],combat:{sequence:['volley','hex','burst'],phaseSequences:[['duel','volley'],['volley','hex','darkfire'],['volley','darkfire','hex']],attackRange:35,aggroRange:70,preferredRange:8,projectileSpeed:13,activationDelay:2}}],entryDialogue:D(['스네이프','무작정 주문부터 외우는 버릇을 아직도 못 버렸군.'],['해리','정면에서는 주문이 전부 막혀. 길을 열면서 따라가야 해.'])},[
  T('start','성문 밖의 흔적',10,38,D(['해리','길을 막은 결계는 부술 수 있어. 공격 예고를 피하면서 세 구간을 통과하자.']),{kind:'sign'}),
  W('rear','성문 앞의 추격자','death-eater',[[9,32],[14,34],[19,30],[18,39],[13,40],[7,40]],{hp:108,damage:26,combat:{sequence:['duel','disarm'],projectileSpeed:12}}),
  K('gate1','첫 번째 퇴로 결계',25,34,'ward-gate',{type:'target',hp:120,blocking:{w:2,d:10},hiddenUntilAvailable:false,label:'첫 번째 결계를 부수세요 · 내구도 120'}),
  W('middle','돌계단의 추격자','duelist-elite',[[33,28],[38,32],[43,29],[34,21],[39,18],[44,20],[39,25],[44,15]],{hp:118,damage:28,combat:{sequence:['volley','disarm','hex'],projectileSpeed:13}}),
  K('gate2','두 번째 퇴로 결계',48,18,'ward-gate',{type:'target',hp:120,blocking:{w:2,d:10},hiddenUntilAvailable:false,label:'두 번째 결계를 부수세요 · 내구도 120'}),
  C('reflect','speculumaegis로 마지막 길의 반사점을 켜세요',57,10,'S033','crystal'),
  K('gate3','세 번째 퇴로 결계',65,10,'ward-gate',{type:'target',hp:120,blocking:{w:2,d:14},hiddenUntilAvailable:false,label:'마지막 결계를 부수세요 · 내구도 120'}),
  T('reveal','멀어지는 검은 망토',69,8,D(['스네이프','내 주문을 내게 쓰려 했나, 포터? 내가 혼혈 왕자다.'],['해리','책의 필기가 떠올랐다. 망토가 어둠 속으로 사라질 때까지 발이 움직이지 않았다.']),{kind:'book'}),
  T('locket','로켓 안의 쪽지',68,6,D(['해리','로켓 안에는 이름 대신 세 글자가 적혀 있었다. R.A.B. 우리가 찾으러 갔던 것은 이미 누군가 가져갔다.']),{kind:'locket'}),
  T('friends','호숫가의 론과 헤르미온느',67,4,D(['해리','다음에는 학교로 돌아오지 못할지도 몰라. 남은 것들을 찾아야 해.'],['론','그럼 어디로 가야 하는지부터 알아보자.'],['헤르미온느','네 가방만 챙길 생각은 하지 마. 우리 것도 있으니까.']),{kind:'student',reward:R(350,{I002:3,I004:3})})
 ])
]};
// Keep relocated speakers singular in the world, including reloads after a conversation.
CHAPTER.scenes[0].entities.find(e=>e.id==='6-01.chair').hiddenAfter=['6-01.invite'];
CHAPTER.scenes[12].entities.find(e=>e.id==='6-13.answer').hiddenAfter=['6-13.map'];
export default CHAPTER;
