// Canonical chapter-one and chapter-two IDs. Numeric source values are retained where defined.
// Unpriced items remain null; only the named prototype shop offers set new prices.
export const SPELLS = [
  {id:'S001',input:'a',name:'비전 룬',mana:1,cooldown:.4,damage:5,kind:'projectile',color:'#b8a4ff',range:14,description:'빠른 비전탄. 짧은 입력으로 빈틈을 공략합니다.'},
  {id:'S002',input:'f',name:'불씨 룬',mana:1,cooldown:.4,damage:3,kind:'fire',color:'#ff9a62',range:12,burnDamage:1,burnDuration:2,description:'작은 불씨. 덩굴과 불붙일 물체에도 사용합니다.'},
  {id:'S003',input:'i',name:'냉기 룬',mana:1,cooldown:.4,damage:3,kind:'projectile',color:'#82dcff',range:14,slow:.15,slowDuration:1,description:'가벼운 냉기탄으로 일반 적의 움직임을 늦춥니다.'},
  {id:'S005',input:'p',name:'밀침 룬',mana:1,cooldown:.4,damage:2,kind:'projectile',color:'#f4dea6',range:12,knockback:.8,description:'약한 충격으로 적과 작은 물체를 밀어냅니다.'},
  {id:'S006',input:'s',name:'장막 룬',mana:1,cooldown:3,damage:0,kind:'shield',color:'#8ecbbd',range:8,shield:5,duration:1,description:'1초 동안 피해 5를 흡수하는 작은 장막.'},
  {id:'S007',input:'incendio',name:'인센디오',mana:8,cooldown:3,damage:24,kind:'fire',color:'#ffac66',range:9,burnDamage:2,burnDuration:3,description:'가까운 곳에 화염을 내보냅니다. 덩굴·그림자 결계에도 효과가 있습니다.'},
  {id:'S019',input:'petrificustotalus',name:'페트리피쿠스 토탈루스',mana:17,cooldown:16,damage:0,kind:'projectile',color:'#d1dcff',range:13,stun:4,description:'일반 적을 최대 4초 결박합니다. 보스에게는 짧은 제어만 적용됩니다.'},
  {id:'S026',input:'protego',name:'프로테고',mana:7,cooldown:8,damage:0,kind:'shield',color:'#73c9be',range:8,shield:30,duration:4,description:'4초간 피해 30을 흡수하는 보호막. Space 유지 방어와 별개입니다.'},
  {id:'S034',input:'lumos',name:'루모스',mana:5,cooldown:1,damage:0,kind:'light',color:'#fff1bf',range:11,description:'지팡이에 빛을 켜고 어두운 기록과 흔적을 살펴봅니다.'},
  {id:'S035',input:'nox',name:'녹스',mana:0,cooldown:.5,damage:0,kind:'light',color:'#78859b',range:11,description:'루모스의 빛을 끕니다.'},
  {id:'S036',input:'accio',name:'아씨오',mana:5,cooldown:2,damage:0,kind:'levitate',color:'#9fe2d9',range:12,description:'허용된 열쇠와 작은 물체를 가까이 끌어옵니다.'},
  {id:'S037',input:'alohomora',name:'알로호모라',mana:9,cooldown:2,damage:0,kind:'unlock',color:'#e9cc82',range:8,description:'열 수 있는 자물쇠를 해제합니다.'},
  {id:'S038',input:'reparo',name:'레파로',mana:6,cooldown:3,damage:0,kind:'repair',color:'#a1d5b7',range:9,description:'망가진 장치와 물체를 수리합니다.'},
  {id:'S039',input:'wingardiumleviosa',name:'윙가르디움 레비오사',mana:17,cooldown:3,damage:0,kind:'levitate',color:'#b8e4ff',range:11,description:'깃털·체스말·곤봉 등 지정된 물체를 공중으로 띄웁니다.'},
  {id:'S004',input:'v',name:'번개 룬',mana:1,cooldown:.4,damage:4,kind:'projectile',element:'lightning',color:'#d3e8ff',range:16,projectileSpeed:22,description:'빠른 번개 투사체. 피해 4.'},
  {id:'S009',input:'diffindo',name:'디핀도',mana:8,cooldown:4,damage:35,kind:'projectile',element:'slash',color:'#e5eddb',range:15,description:'직선 절단 피해 35. 지정된 덩굴과 장애물을 잘라냅니다.'},
  {id:'S011',input:'expelliarmus',name:'엑스펠리아르무스',mana:12,cooldown:6,damage:14,kind:'projectile',color:'#ffb09a',range:14,disarm:3,description:'피해 14와 지팡이를 든 일반 적 무장해제 3초. 해당 적의 마법 공격 준비를 끊습니다.'},
  {id:'S012',input:'stupefy',name:'스투페파이',mana:7,cooldown:6,damage:16,kind:'projectile',color:'#ed9d91',range:14,stun:1.5,description:'피해 16과 일반 적 기절 1.5초. 반복 제어와 보스에는 저항이 적용됩니다.'},
  {id:'S014',input:'aguamenti',name:'아구아멘티',mana:9,cooldown:3,damage:12,kind:'water',element:'water',color:'#80d8ee',range:13,wet:5,description:'물줄기 피해 12와 젖음 5초. 지정된 배수 장치를 작동시킵니다.'},
  {id:'S015',input:'fulgur',name:'풀구르',mana:6,cooldown:2.5,damage:28,kind:'projectile',element:'lightning',color:'#e0d1ff',range:15,description:'번개 피해 28. 젖은 적에게 추가 피해를 줍니다.'},
  {id:'S017',input:'glacius',name:'글라시우스',mana:10,cooldown:9,damage:0,kind:'projectile',element:'ice',color:'#a3e8f5',range:13,freeze:2,description:'일반 적을 2초간 얼립니다. 반복 제어와 보스에는 저항이 적용됩니다.'},
  {id:'S023',input:'radicavincula',name:'라디카 빈쿨라',mana:13,cooldown:12,damage:0,kind:'root',color:'#a9ce7a',range:12,root:2,areaRadius:2.2,description:'명중 지점 주변의 일반 적을 뿌리로 2초간 속박합니다. 보스에는 제어 저항이 적용됩니다.'},
  {id:'S029',input:'finiteincantatem',name:'피니테 인칸타템',mana:16,cooldown:10,damage:0,kind:'dispel',color:'#f0d6a5',range:12,description:'해제할 수 있는 마법 공격과 장치를 해제합니다. 물리 공격은 취소하지 못합니다.'},
  {id:'S032',input:'purga',name:'푸르가',mana:5,cooldown:8,damage:0,kind:'cleanse',color:'#b4edaa',range:10,description:'자신의 일반 중독을 제거하거나 지정된 해독 과제를 해결합니다.'},
  {id:'S040',input:'revelio',name:'레벨리오',mana:7,cooldown:8,damage:0,kind:'reveal',color:'#f3df9c',range:12,duration:8,description:'주변의 숨은 단서를 8초간 드러내고 조사 장치의 흔적을 확인합니다.'},

  {id:'S008',input:'confringo',name:'콘프링고',mana:9,cooldown:8,damage:45,kind:'fire',element:'fire',areaRadius:2.6,color:'#ffa567',range:16,description:'폭발 피해 45. 명중 지점 반경 2.6T의 적을 함께 공격합니다.'},
  {id:'S010',input:'reducto',name:'리덕토',mana:7,cooldown:5,damage:50,kind:'projectile',element:'impact',color:'#8dd9ed',range:16,description:'충격 피해 50. 지정된 미궁 장애물을 부숩니다.'},
  {id:'S013',input:'bombarda',name:'봄바르다',mana:12,cooldown:10,damage:60,kind:'projectile',element:'impact',areaRadius:3,color:'#ffc176',range:15,description:'반경 3T에 폭발 피해 60.'},
  {id:'S016',input:'glacieshasta',name:'글라키에스 하스타',mana:12,cooldown:5,damage:42,kind:'projectile',element:'ice',slow:.3,slowDuration:3,color:'#c6efff',range:16,description:'얼음창 피해 42. 이동을 3초간 30% 늦춥니다.'},
  {id:'S018',input:'impedimenta',name:'임페디멘타',mana:11,cooldown:8,damage:0,kind:'projectile',slow:.5,slowDuration:6,color:'#b3bcff',range:15,description:'일반 적을 6초간 50% 둔화합니다. 보스는 제어 면역입니다.'},
  {id:'S020',input:'incarcerous',name:'인카서러스',mana:11,cooldown:10,damage:0,kind:'projectile',root:3,color:'#c6a67b',range:14,description:'밧줄로 일반 적을 3초간 묶습니다.'},
  {id:'S021',input:'confundo',name:'컨펀도',mana:8,cooldown:12,damage:0,kind:'projectile',confuse:4,color:'#e0b2ef',range:14,description:'일반 적의 준비 중인 공격을 끊고 4초간 공격을 막습니다.'},
  {id:'S025',input:'ventusorbis',name:'벤투스 오르비스',mana:11,cooldown:10,damage:8,kind:'projectile',element:'wind',areaRadius:4,vortex:3,color:'#b5eadb',range:14,description:'3초간 반경 4T의 가벼운 적을 모으는 회오리. 보스는 끌려오지 않습니다.'},
  {id:'S028',input:'expectopatronum',name:'익스펙토 패트로눔',mana:30,cooldown:30,damage:0,kind:'patronus',duration:10,color:'#dcf8ff',range:13,description:'10초간 수호령. 주변 디멘터를 밀어내고 공포를 해제·예방합니다. 수호점도 점화합니다.'},
  {id:'S030',input:'episkey',name:'에피스키',mana:7,cooldown:15,damage:0,kind:'heal',heal:25,charges:1,color:'#b5ebbe',range:10,description:'체력 25 회복. 치유 횟수 1 소비. 휴식 장소에서 6회로 회복됩니다.'},
  {id:'S031',input:'sanavita',name:'사나 비타',mana:16,cooldown:30,damage:0,kind:'heal',heal:50,healDuration:5,charges:2,color:'#a8e5bf',range:10,description:'5초간 체력 50 회복. 치유 횟수 2 소비. 휴식 장소에서 회복됩니다.'},
  {id:'S042',input:'vestigialux',name:'베스티기아 룩스',mana:11,cooldown:6,damage:0,kind:'reveal',duration:12,color:'#e6cf83',range:15,description:'빛으로 조사 흔적과 지정된 경로를 드러냅니다.'},
  {id:'S043',input:'avis',name:'아비스',mana:12,cooldown:16,damage:0,kind:'summon',duration:12,color:'#eac97e',range:14,description:'12초간 새 3마리. 각 새는 일반 적 탄환을 한 번 막으며 oppugno로 발사할 수 있습니다.'},
  {id:'S044',input:'oppugno',name:'오푸그노',mana:7,cooldown:5,damage:20,kind:'birds',color:'#f8db91',range:16,description:'소환된 새를 전부 발사합니다. 새 한 마리당 피해 20. avis가 먼저 필요합니다.'},
  {id:'S057',input:'riddikulus',name:'리디큘러스',mana:10,cooldown:6,damage:0,kind:'transform',color:'#f2b7de',range:10,description:'선택한 우스운 모습으로 보가트 형상을 바꿉니다.'},
  {id:'S058',input:'arrestomomentum',name:'아레스토 모멘텀',mana:15,cooldown:12,damage:0,kind:'projectile',slow:.6,slowDuration:4,color:'#b3dded',range:14,description:'일반 적을 4초간 60% 둔화하고 지정된 낙하 장치를 멈춥니다.'},
  {id:'S059',input:'impervius',name:'임페르비우스',mana:9,cooldown:10,damage:0,kind:'weather',duration:20,color:'#b8e2eb',range:10,description:'20초간 빗속 비행의 돌풍 피해를 절반으로 줄입니다.'},
  {id:'S060',input:'sonorus',name:'소노루스',mana:7,cooldown:8,damage:0,kind:'sound',color:'#e5c280',range:12,description:'소리 장치와 유인 장치를 작동시킵니다.'},
  {id:'S061',input:'quietus',name:'콰이어투스',mana:0,cooldown:.5,damage:0,kind:'sound',color:'#b0c9cc',range:12,description:'소리 증폭을 끄고 지정된 소리 퍼즐을 마무리합니다.'},
  {id:'S062',input:'dissendium',name:'디센디움',mana:10,cooldown:2,damage:0,kind:'unlock',color:'#d5c79e',range:9,description:'외눈 마녀상의 비밀 통로를 엽니다.'},
  {id:'S067',input:'viaaeris',name:'비아 아에리스',mana:8,cooldown:12,damage:10,kind:'projectile',element:'wind',knockback:3,color:'#b5e7e5',range:14,description:'바람으로 일반 적을 밀거나 지정된 기류 장치를 조정합니다.'},
  {id:'S022',input:'silencio',name:'실렌시오',mana:8,cooldown:12,damage:0,kind:'projectile',silence:3,color:'#c9b9f0',range:15,description:'일반 마법사의 주문 준비를 끊고 3초 침묵. 보스는 0.4초, 이후 10초 저항.'},
  {id:'S024',input:'umbraancora',name:'움브라 앙코라',mana:11,cooldown:12,damage:0,kind:'projectile',anchor:5,color:'#ad96d6',range:16,description:'5초간 대응 가능한 적의 순간이동을 막습니다. 스네이프는 면역입니다.'},
  {id:'S027',input:'protegototalum',name:'프로테고 토탈룸',mana:28,cooldown:30,damage:0,kind:'advanced',effect:'zone',duration:6,shield:80,color:'#86d9df',range:12,description:'시전 위치 반경 5T 안에서 공유하는 보호막 80, 6초. 범위 밖에서는 보호받지 않습니다.'},
  {id:'S033',input:'speculumaegis',name:'스페쿨룸 이지스',mana:20,cooldown:18,damage:0,kind:'advanced',effect:'reflect',duration:3,color:'#c9f5ff',range:12,description:'3초 안에 닿는 일반 적 투사체 1개를 반사합니다. 바닥·치명적 저주에는 적용되지 않습니다.'},
  {id:'S041',input:'colloportus',name:'콜로포터스',mana:11,cooldown:10,damage:0,kind:'unlock',color:'#bea68c',range:9,description:'지정된 문을 잠그거나 추격 경로의 장치를 닫습니다.'},
  {id:'S045',input:'custoslapideus',name:'쿠스토스 라피데우스',mana:28,cooldown:30,damage:0,kind:'advanced',effect:'guardian',duration:20,color:'#cec9a7',range:13,description:'20초 돌 수호자. 가까운 일반 적의 조준을 유도하고 2초마다 피해 12. 동시에 하나.'},
  {id:'S046',input:'speculumgemina',name:'스페쿨룸 게미나',mana:14,cooldown:16,damage:0,kind:'advanced',effect:'decoy',duration:6,color:'#9ec0e8',range:13,description:'6초간 일반 적이 조준하는 분신을 남깁니다. 보스는 속지 않습니다.'},
  {id:'S047',input:'fulgurcatena',name:'풀구르 카테나',mana:24,cooldown:10,damage:40,kind:'advanced',effect:'chain',element:'lightning',color:'#d8dbff',range:16,description:'시야가 이어지는 최대 3명에게 번개 피해 40·30·20. 적 사이 6T 이내.'},
  {id:'S048',input:'glaciorbis',name:'글라키 오르비스',mana:20,cooldown:14,damage:35,kind:'projectile',element:'ice',freeze:1.5,areaRadius:4.5,color:'#b1e9ff',range:16,description:'반경 4.5T 냉기 피해 35와 일반 적 빙결 1.5초.'},
  {id:'S049',input:'ignisdraconis',name:'이그니스 드라코니스',mana:26,cooldown:18,damage:60,kind:'fire',element:'fire',areaRadius:5,burnDamage:6,burnDuration:3,color:'#ffa16c',range:16,description:'반경 5T 화염 피해 60과 3초간 초당 화상 6. 인페리 재기 방지.'},
  {id:'S050',input:'astralnova',name:'아스트랄 노바',mana:30,cooldown:25,damage:90,kind:'advanced',effect:'nova',element:'arcane',color:'#e6cbff',range:16,description:'목표 지점에 1초 뒤 비전 폭발 90, 반경 4T. 준비 중에도 이동 가능.'},
  {id:'S052',input:'letthestarsanswermycall',name:'별빛의 응답',mana:46,cooldown:50,damage:45,kind:'advanced',effect:'stars',element:'arcane',color:'#fff0c3',range:18,description:'지정 위치 반경 5T에 0.8초 간격으로 별빛 3회, 각각 피해 45.'},
  {id:'S053',input:'sectumsempra',name:'섹튬셈프라',mana:18,cooldown:15,damage:40,kind:'projectile',element:'curse',bleed:6,bleedDuration:4,color:'#e899a0',range:16,description:'피해 40과 4초간 출혈 6. 인페리는 출혈 면역. 선택 연구이며 진행 필수 아님.'},
  {id:'S054',input:'crucio',name:'크루시오',mana:18,cooldown:20,damage:15,kind:'projectile',element:'curse',curse:6,curseDuration:4,color:'#cf96d2',range:15,description:'저주 피해 15와 4초간 지속 피해 6, 적 공격 피해 15% 감소. 보스 저항 적용.'},
  {id:'S055',input:'imperio',name:'임페리오',mana:28,cooldown:45,damage:0,kind:'projectile',element:'curse',charm:8,color:'#b7d8a4',range:15,description:'일반 적 1명을 8초간 전향. 주변 적에게 1.2초마다 피해 14. 보스·인페리 면역.'},
  {id:'S064',input:'homenumrevelio',name:'호메눔 레벨리오',mana:14,cooldown:8,damage:0,kind:'reveal',duration:10,color:'#e2dca9',range:14,description:'주변 인물과 지정된 숨은 방문자의 흔적을 밝힙니다.'},
  {id:'S065',input:'muffliato',name:'머플리아토',mana:9,cooldown:15,damage:0,kind:'advanced',effect:'stealth',duration:8,color:'#a3b6d5',range:12,description:'8초 동안 7T 밖 일반 적의 접근·공격을 억제합니다. 가까운 적과 보스는 계속 경계합니다.'},
  {id:'S068',input:'lumenmemoriae',name:'루멘 메모리아이',mana:13,cooldown:5,damage:0,kind:'reveal',duration:10,color:'#e2cf9c',range:14,description:'지정된 기억 속 연결점과 사라진 기록을 드러냅니다.'},

];

export const ITEMS = {
  I001:{id:'I001',name:'소형 회복 물약',kind:'consumable',description:'체력 35 회복. 물약 공용 재사용 대기 10초.',price:25,hp:35},
  I003:{id:'I003',name:'소형 마나 물약',kind:'consumable',description:'마나 25 회복. 물약 공용 재사용 대기 10초.',price:35,mana:25},
  I016:{id:'I016',name:'룬 분필',kind:'material',description:'방문 경로를 기록할 수 있는 탐험 도구. 세부 지도 기능은 추후 연결됩니다.',price:20},
  I018:{id:'I018',name:'투명 망토',kind:'quest',description:'제한 구역을 조사할 때 사용하는 이야기 도구. 판매할 수 없습니다.',price:null},
  I021:{id:'I021',name:'생명 정수',kind:'material',description:'최초 수집 시 최대 체력 +5. 배치별 1회, 기본 한도 10개.',price:null,permanentHp:5,collectionLimit:10},
  I022:{id:'I022',name:'마력 결정',kind:'material',description:'최초 수집 시 최대 마나 +5. 배치별 1회, 기본 한도 8개.',price:null,permanentMana:5,collectionLimit:8},
  I025:{id:'I025',name:'주문서 낱장',kind:'material',description:'주문 연구용 기록. 연구 조합은 추후 연결됩니다.',price:40},
  I026:{id:'I026',name:'펜던트 파편',kind:'material',description:'펜던트 복원과 강화에 쓰는 재료.',price:45},
  I027:{id:'I027',name:'지팡이 연마제',kind:'material',description:'지팡이 강화를 위한 재료. 공방 강화는 추후 연결됩니다.',price:60},
  I030:{id:'I030',name:'말린 마법약초 묶음',kind:'material',description:'물약 조제와 약초 배달에 사용하는 재료.',price:20},
  I031:{id:'I031',name:'기본 지팡이 목재',kind:'material',description:'지팡이 초기 강화·제작에 사용하는 목재.',price:30},
  I036:{id:'I036',name:'빗자루 정비 키트',kind:'material',description:'비행 훈련을 마쳤다는 기록과 정비 재료.',price:40},
  I040:{id:'I040',name:'호그와트 승차권',kind:'quest',description:'학교로 향했던 첫 기차 여행의 기록.',price:null},
  I061:{id:'I061',name:'마법사의 돌',kind:'quest',description:'거울의 방에서 지켜 낸 돌. 이후 처리는 이야기에서 이루어집니다.',price:null},
  I064:{id:'I064',name:'선택 수련권',kind:'material',description:'선택 수업을 위한 수련권. 교환 수업은 후속 구현에서 연결됩니다.',price:null},
  P001:{id:'P001',name:'붉은 잉걸 펜던트',kind:'pendant',description:'화염 주문 피해 +20%.',price:null,fireMultiplier:1.2},
  P012:{id:'P012',name:'룬 각인 펜던트',kind:'pendant',description:'한 글자 공격 주문 피해 +25%.',price:null,runeMultiplier:1.25},
  P013:{id:'P013',name:'철갑 매듭',kind:'pendant',description:'유지 방어의 초당 마나 소비 -25%.',price:null,guardCostMultiplier:.75},
  P019:{id:'P019',name:'길잡이 나침반',kind:'pendant',description:'숲에서 되찾은 나침반. 숨은 보상 방향 표시 기능은 후속 구현 대상입니다.',price:null},
  P025:{id:'P025',name:'첫걸음의 매듭',kind:'pendant',description:'최대 체력 +10, 최대 마나 +5.',price:null,maxHp:10,maxMana:5},
  P026:{id:'P026',name:'수선의 톱니',kind:'pendant',description:'탐험 주문의 마나 비용 -15%.',price:null,explorationCostMultiplier:.85},
  P027:{id:'P027',name:'체스말 왕관',kind:'pendant',description:'전투 시작 시 보호막 15. 같은 전투에서 반복 발동하지 않습니다.',price:null,startShield:15},
  W001:{id:'W001',name:'견습생의 지팡이',kind:'wand',description:'첫 번째 지팡이. 최대 마나 +10.',price:null,maxMana:10},
  W002:{id:'W002',name:'물푸레나무 균형 지팡이',kind:'wand',description:'최대 마나 +12, 초당 마나 회복 +0.5.',price:null,maxMana:12,manaRegen:.5},
  W017:{id:'W017',name:'소나무 생활 지팡이',kind:'wand',description:'탐험 주문 비용 -20%, 최대 마나 +8.',price:null,maxMana:8,explorationCostMultiplier:.8},
  I006:{id:'I006',name:'베조아르',kind:'consumable',description:'일반 중독을 제거하고 10초간 중독을 예방합니다. 물약 공용 재사용 대기 10초.',price:55,cleansePoison:true,poisonImmunity:10},
  I008:{id:'I008',name:'활력 물약',kind:'consumable',description:'15초간 이동 속도 +20%. 물약 공용 재사용 대기 10초.',price:50,moveMultiplier:1.2,duration:15},
  I017:{id:'I017',name:'폴리주스 물약',kind:'quest',description:'지하 휴게실 잠입을 위한 임무용 위장 물약. 필요한 분량은 무료로 확보합니다.',price:null},
  I023:{id:'I023',name:'샘물의 이슬',kind:'material',description:'최초 수집 시 초당 마나 회복 +0.2. 배치별 1회, 기본 한도 5개.',price:null,permanentManaRegen:.2,collectionLimit:5},
  I028:{id:'I028',name:'봉인된 열쇠',kind:'quest',description:'지정된 이야기의 봉인을 여는 열쇠. 판매·폐기할 수 없습니다.',price:null},
  I029:{id:'I029',name:'약초 응급 꾸러미',kind:'consumable',description:'전투 밖에서 체력 25 회복. 물약 공용 재사용 대기 10초.',price:35,hp:25,outOfCombat:true},
  I037:{id:'I037',name:'비행 안정제',kind:'material',description:'자동차 비행을 마치고 받은 정비 물자. 별도 충돌 흔들림 완화 효과는 후속 구현 대상입니다.',price:50},
  I053:{id:'I053',name:'바실리스크의 송곳니',kind:'quest',description:'바실리스크에게서 확보한 송곳니. 지정된 일기장 파괴에 사용합니다.',price:null},
  I056:{id:'I056',name:'톰 리들의 일기장',kind:'quest',description:'기억을 보여 주는 수상한 일기장. 조사와 파괴 상태를 이야기 기록에 남깁니다.',price:null},
  P002:{id:'P002',name:'눈결정 펜던트',kind:'pendant',description:'빙결 지속 시간 +25%. 반복 제어와 보스 저항은 유지됩니다.',price:null,freezeDurationMultiplier:1.25},
  P005:{id:'P005',name:'은빛 결투사',kind:'pendant',description:'엑스펠리아르무스·스투페파이 재사용 대기 -20%.',price:null,duelCooldownMultiplier:.8},
  P009:{id:'P009',name:'청월석 펜던트',kind:'pendant',description:'최대 마나 +20.',price:null,maxMana:20},
  P010:{id:'P010',name:'샘물 펜던트',kind:'pendant',description:'초당 마나 회복 +1.2.',price:null,manaRegen:1.2},
  P016:{id:'P016',name:'생명나무 펜던트',kind:'pendant',description:'최대 체력 +25.',price:null,maxHp:25},
  P020:{id:'P020',name:'니플러 부적',kind:'pendant',description:'적 처치 금화 +15%. 임무 보상과 상점 거래에는 적용되지 않습니다.',price:null,enemyGoldMultiplier:1.15},
  P028:{id:'P028',name:'거미줄 브로치',kind:'pendant',description:'뿌리 속박 지속 시간 +20%. 반복 제어와 보스 저항은 유지됩니다.',price:null,rootDurationMultiplier:1.2},
  P029:{id:'P029',name:'뱀눈 펜던트',kind:'pendant',description:'일반 중독 지속 시간 -50%. 이야기 속 석화 저주에는 적용되지 않습니다.',price:null,poisonDurationMultiplier:.5},
  P030:{id:'P030',name:'온실의 이슬',kind:'pendant',description:'회복 물약의 체력 회복량 +15%.',price:null,potionHealMultiplier:1.15},
  W005:{id:'W005',name:'단풍나무 화염 지팡이',kind:'wand',description:'화염 피해 +25%, 화염 주문 마나 비용 +10%.',price:null,fireMultiplier:1.25,fireCostMultiplier:1.1},
  W009:{id:'W009',name:'서어나무 결투 지팡이',kind:'wand',description:'엑스펠리아르무스·스투페파이 재사용 대기 -15%.',price:null,duelCooldownMultiplier:.85},
  W018:{id:'W018',name:'수로 관리인의 지팡이',kind:'wand',description:'물 주문 마나 비용 -20%, 젖음 지속 시간 +1초.',price:null,waterCostMultiplier:.8,wetDurationBonus:1},

  I002:{id:'I002',name:'대형 회복 물약',kind:'consumable',description:'체력 70 회복. 물약 공용 대기 10초.',price:70,hp:70},
  I004:{id:'I004',name:'대형 마나 물약',kind:'consumable',description:'마나 55 회복. 물약 공용 대기 10초.',price:90,mana:55},
  I007:{id:'I007',name:'초콜릿',kind:'consumable',description:'전투 밖에서 체력 15 회복, 공포 해제.',price:15,hp:15,outOfCombat:true,cleanseFear:true},
  I009:{id:'I009',name:'수호 물약',kind:'consumable',description:'10초간 피해 30 보호막.',price:100,shield:30,duration:10},
  I010:{id:'I010',name:'명상 물약',kind:'consumable',description:'20초간 자연 마나 회복 +50%.',price:120,regenMultiplier:1.5,duration:20},
  I019:{id:'I019',name:'호그와트 비밀지도',kind:'quest',description:'외눈 마녀상으로 이어지는 통로의 단서.',price:null},
  I020:{id:'I020',name:'포트키',kind:'quest',description:'월드컵 야영지로 향하는 임무용 이동 도구.',price:null},
  I038:{id:'I038',name:'아가미풀',kind:'quest',description:'호수 시험에서 산소 60, 수영 속도 +15%. 공기 방울로 산소를 보충합니다.',price:null},
  I039:{id:'I039',name:'공기방울 호흡구',kind:'quest',description:'호수 시험에서 산소 90. 공기 방울로 산소를 보충합니다.',price:null},
  I041:{id:'I041',name:'타임터너',kind:'quest',description:'정해진 과거 사건에서 벅빅과 시리우스를 구출하는 임무 도구.',price:null},
  I060:{id:'I060',name:'기억의 실타래',kind:'quest',description:'일치하지 않는 증언을 비교한 조사 기록.',price:null},
  I062:{id:'I062',name:'황금알',kind:'quest',description:'물속에서 드러나는 호수 시험의 단서.',price:null},
  I063:{id:'I063',name:'트라이위저드 컵',kind:'quest',description:'미궁의 목표이자 묘지에서 학교로 돌아갈 귀환 수단.',price:null},
  P004:{id:'P004',name:'오색 프리즘',kind:'pendant',description:'직전과 다른 계열의 공격 주문 피해 +15%.',price:null,comboMultiplier:1.15},
  P011:{id:'P011',name:'고요의 종',kind:'pendant',description:'마나 자연 회복 대기 -0.5초. 최소 1초.',price:null,regenDelayReduction:.5},
  P015:{id:'P015',name:'불사조 펜던트',kind:'pendant',description:'사망 시 체력 35%로 한 번 부활. 휴식 장소에 새로 도착하면 충전됩니다. 재장착으로 충전되지 않습니다.',price:null,charges:1,revive:.35},
  P022:{id:'P022',name:'시간의 모래',kind:'pendant',description:'F3·F4·F5 중 장착 슬롯 키: 18 MP, 대기 75초. 3초간 적 투사체 속도 65% 감소.',price:null,active:'slow-projectiles',activeMana:18,activeCooldown:75},
  P031:{id:'P031',name:'늑대달 펜던트',kind:'pendant',description:'체력 50% 이하에서 이동 속도 +10%.',price:null,lowHpMoveMultiplier:1.1},
  P032:{id:'P032',name:'추적자의 은별',kind:'pendant',description:'revelio·vestigialux가 켜진 동안 표적의 주요 저항을 표시합니다.',price:null,revealResistance:true},
  P033:{id:'P033',name:'바람깃 펜던트',kind:'pendant',description:'지상 이동 속도 +5%, 비행 환경 피해 -20%.',price:null,moveMultiplier:1.05,flightDamageMultiplier:.8},
  P034:{id:'P034',name:'용비늘 인장',kind:'pendant',description:'받는 화염 피해 -20%.',price:null,fireResistance:.8},
  P035:{id:'P035',name:'호수의 진주',kind:'pendant',description:'적에게 부여하는 젖음 +2초, 받는 냉기 피해 -15%.',price:null,wetDurationBonus:2,iceResistance:.85},
  P036:{id:'P036',name:'미궁의 실',kind:'pendant',description:'환경 함정 피해 -20%. 방문한 통로의 바닥에 작은 금빛 표식을 남깁니다.',price:null,trapDamageMultiplier:.8,trail:true},
  W003:{id:'W003',name:'버드나무 치유 지팡이',kind:'wand',description:'치유 주문 회복량 +20%, 초당 체력 회복 +0.8 (전투 밖).',price:null,healMultiplier:1.2,healthRegen:.8},
  W004:{id:'W004',name:'호랑가시나무 수호 지팡이',kind:'wand',description:'보호막 효과 +25%, 최대 마나 +10.',price:null,shieldMultiplier:1.25,maxMana:10},
  W006:{id:'W006',name:'자작나무 서리 지팡이',kind:'wand',description:'냉기 피해 +20%, 둔화 지속시간 +20%.',price:null,iceMultiplier:1.2,slowDurationMultiplier:1.2},
  W007:{id:'W007',name:'느릅나무 천둥 지팡이',kind:'wand',description:'번개 피해 +20%.',price:null,lightningMultiplier:1.2},
  W008:{id:'W008',name:'포도나무 연계 지팡이',kind:'wand',description:'직전과 다른 계열의 공격 주문 피해 +12%.',price:null,comboMultiplier:1.12},
  W019:{id:'W019',name:'패트로누스의 가지',kind:'wand',description:'패트로누스 지속시간 +20%, 재사용 대기 -10%.',price:null,patronusDurationMultiplier:1.2,patronusCooldownMultiplier:.9},
  I011:{id:'I011',name:'펠릭스 펠리시스',kind:'quest',description:'슬러그혼의 기억을 얻는 임무에서 무료로 지급·사용되는 행운 물약.',price:null},
  I012:{id:'I012',name:'혈마나 앰풀',kind:'consumable',mana:35,hpCost:20,description:'체력 20을 소비해 마나 35 회복. 체력 20 이하 사용 불가.',price:160},
  I013:{id:'I013',name:'즉석 암흑 가루',kind:'consumable',stealth:8,description:'8초간 7T 밖 일반 적의 경계를 억제합니다. 가까운 적과 보스는 제외.',price:90},
  I014:{id:'I014',name:'유인 폭죽',kind:'consumable',decoy:6,description:'현재 위치에 6초간 일반 적의 조준을 끄는 소리 표식을 남깁니다.',price:65},
  I035:{id:'I035',name:'봉인용 밀랍',kind:'quest',description:'위험한 물품을 봉인하는 임무 물자. 필수분은 무료입니다.',price:null},
  I045:{id:'I045',name:'양면 거울 조각',kind:'quest',description:'시리우스가 남긴 연락용 거울. 장착 펜던트와는 별도입니다.',price:null},
  I057:{id:'I057',name:'가짜 로켓',kind:'quest',description:'동굴에서 가져온 로켓 안의 R.A.B. 기록.',price:null},
  I058:{id:'I058',name:'저주받은 오팔 목걸이',kind:'quest',description:'봉인해서 운반하는 사건 물품. 장착할 수 없습니다.',price:null},
  P006:{id:'P006',name:'별문자 펜던트',kind:'pendant',longCostMultiplier:.85,description:'15글자 이상 주문 마나 비용 -15%.',price:null},
  P007:{id:'P007',name:'메아리 수정',kind:'pendant',active:'echo',activeMana:12,activeCooldown:35,description:'슬롯 F3~F5: 12 MP·대기 35초. 다음 단일 투사체의 피해 35% 추가탄. 추가 상태 이상 없음.',price:null},
  P008:{id:'P008',name:'검은 가시',kind:'pendant',curseMultiplier:1.2,healReceivedMultiplier:.85,description:'저주 피해 +20%, 받는 치유량 -15%.',price:null},
  P014:{id:'P014',name:'거울 조각',kind:'pendant',reflectMultiplier:1.4,description:'정밀 방어와 거울 주문의 반사 피해 +40%.',price:null},
  P021:{id:'P021',name:'치유사의 매듭',kind:'pendant',healingChargeBonus:1,description:'휴식 시 치유 횟수 한도 +1. 장착을 반복해도 남은 횟수는 늘지 않습니다.',price:null},
  P037:{id:'P037',name:'불사조 기사단 표식',kind:'pendant',cleanseProtection:true,description:'중독 정화 성공 후 4초간 받는 피해 -15%. 발동 간격 10초.',price:null},
  P038:{id:'P038',name:'비밀수업 코인',kind:'pendant',comboRefund:true,description:'서로 다른 공격 주문 3개가 적중하면 마나 3 환급. 발동 간격 12초.',price:null},
  P039:{id:'P039',name:'반쪽 왕자의 책갈피',kind:'pendant',mediumCostMultiplier:.9,mediumPowerMultiplier:1.08,description:'8~14글자 주문의 마나 비용 -10%, 직접 피해 +8%.',price:null},
  W010:{id:'W010',name:'흑단 관통 지팡이',kind:'wand',pierce:1,description:'단일 투사체가 적 하나를 추가 관통. 두 번째 피해 60%.',price:null},
  W011:{id:'W011',name:'쌍갈래 지팡이',kind:'wand',splitShot:true,description:'단일 투사체를 두 발로 분할. 각각 피해 60%, 추가 상태 이상은 첫 탄만.',price:null},
  W012:{id:'W012',name:'결계 수호자의 지팡이',kind:'wand',parryBoost:true,description:'정밀 방어 후 다음 공격 피해 +35%. 발동 간격 8초.',price:null},
  W014:{id:'W014',name:'주목 저주 지팡이',kind:'wand',curseMultiplier:1.25,healReceivedMultiplier:.85,description:'저주 피해 +25%, 받는 치유량 -15%.',price:null},

};

export const SHOPS = {
  SH01:{id:'SH01',name:'올리밴더스',description:'첫 지팡이는 무료입니다. 새 지팡이는 학교 주변 수리대에서 살펴보세요.',offers:[]},
  SH02:{id:'SH02',name:'플러리시 앤 블러츠',description:'필수 주문은 학교 수업에서 무료로 배웁니다. 두 번째 학년에는 선택 교재와 주문 제작 장비를 주문할 수 있습니다.',offers:[
    {id:'SH02.ch02.S004',spellId:'S004',price:60,stock:1,minChapter:2},
    {id:'SH02.ch02.S015',spellId:'S015',price:130,stock:1,minChapter:2},
    {id:'SH02.ch02.W005',itemId:'W005',price:270,stock:1,minChapter:2},
    {id:'SH02.ch02.W009',itemId:'W009',price:310,stock:1,minChapter:2},
    {id:'SH02.ch02.P009',itemId:'P009',price:200,stock:1,minChapter:2},
    {id:'SH02.ch02.P020',itemId:'P020',price:160,stock:1,minChapter:2}
  ]},
  SH03:{id:'SH03',name:'다이애건 약재상',description:'기초 물약 가격은 다음 챕터에서도 유지됩니다.',offers:[
    {id:'SH03.I001.basic',itemId:'I001',price:25,stock:null},
    {id:'SH03.I003.basic',itemId:'I003',price:35,stock:null},
    {id:'SH03.ch02.I006',itemId:'I006',price:55,stock:null,minChapter:2},
    {id:'SH03.ch02.I008',itemId:'I008',price:50,stock:null,minChapter:2}
  ]},
  SH04:{id:'SH04',name:'오두막 길의 수리대',description:'수리 의뢰를 마친 뒤 장비와 기초 물자를 점검하세요.',offers:[
    {id:'SH04.I001.basic',itemId:'I001',price:25,stock:null},
    {id:'SH04.I003.basic',itemId:'I003',price:35,stock:null},
    {id:'SH04.W002',itemId:'W002',price:180,stock:1},
    {id:'SH04.W017',itemId:'W017',price:150,stock:1},
    {id:'SH04.P012',itemId:'P012',price:120,stock:1},
    {id:'SH04.S006',spellId:'S006',price:40,stock:1},
    {id:'SH04.S019',spellId:'S019',price:90,stock:1}
  ]},
  SH05:{id:'SH05',name:'버로의 공동 작업대',description:'가족의 숙식과 필수 물자는 무료입니다. 외부에서 들여온 재료와 선택 장비의 비용만 받습니다.',offers:[
    {id:'SH05.I001.basic',itemId:'I001',price:25,stock:null},
    {id:'SH05.I003.basic',itemId:'I003',price:35,stock:null},
    {id:'SH05.I029',itemId:'I029',price:35,stock:null},
    {id:'SH05.I006',itemId:'I006',price:55,stock:null},
    {id:'SH05.I008',itemId:'I008',price:50,stock:null},
    {id:'SH05.P010',itemId:'P010',price:220,stock:1},
    {id:'SH05.P009',itemId:'P009',price:200,stock:1},
    {id:'SH05.W009',itemId:'W009',price:310,stock:1},
    {id:'SH05.S009',spellId:'S009',price:120,stock:1,minScene:'2-07'},
    {id:'SH05.S017',spellId:'S017',price:120,stock:1,minScene:'2-07'},
    {id:'SH05.S023',spellId:'S023',price:140,stock:1,minScene:'2-07'},
    {id:'SH05.P002',itemId:'P002',price:190,stock:1,minScene:'2-07'},
    {id:'SH05.P016',itemId:'P016',price:260,stock:1,minScene:'2-13'}
  ]},
  SH06:{id:'SH06',name:'수로 관리인의 집',description:'배수로를 복구한 뒤 물 주문 교재와 특화 장비를 살펴보세요. 기초 물약도 같은 가격으로 보급합니다.',offers:[
    {id:'SH06.I001.basic',itemId:'I001',price:25,stock:null},
    {id:'SH06.I003.basic',itemId:'I003',price:35,stock:null},
    {id:'SH06.I006',itemId:'I006',price:55,stock:null},
    {id:'SH06.I008',itemId:'I008',price:50,stock:null},
    {id:'SH06.S014',spellId:'S014',price:150,stock:1},
    {id:'SH06.W018',itemId:'W018',price:300,stock:1},
    {id:'SH06.P030',itemId:'P030',price:240,stock:1},
    {id:'SH06.P002',itemId:'P002',price:190,stock:1},
    {id:'SH06.S009',spellId:'S009',price:120,stock:1},
    {id:'SH06.S017',spellId:'S017',price:120,stock:1},
    {id:'SH06.S023',spellId:'S023',price:140,stock:1}
  ]}
};


const supplies=(id)=>[{id:`${id}.I001`,itemId:'I001',price:25,stock:null},{id:`${id}.I003`,itemId:'I003',price:35,stock:null},{id:`${id}.I002`,itemId:'I002',price:70,stock:null},{id:`${id}.I004`,itemId:'I004',price:90,stock:null}];
const stock=(id,entries)=>entries.map(([catalogId,price,minChapter=3])=>({id:`${id}.${catalogId}`,itemId:catalogId.startsWith('S')?undefined:catalogId,spellId:catalogId.startsWith('S')?catalogId:undefined,price,stock:1,minChapter}));
SHOPS.SH07={id:'SH07',name:'호그스미드 약초사의 집',description:'기초 물약 가격은 그대로입니다. 놓친 선택 수업도 여기에서 배울 수 있습니다.',offers:[...supplies('SH07'),...stock('SH07',[['S030',200],['S016',240],['S018',220],['S025',250],['S020',230],['S042',200],['S058',260],['S067',220],['P011',390],['W003',470]])]};
SHOPS.SH08={id:'SH08',name:'허니듀크',description:'긴 겨울 외출에는 초콜릿을 챙기세요.',offers:[...supplies('SH08'),{id:'SH08.I007',itemId:'I007',price:15,stock:null}]};
SHOPS.SH09={id:'SH09',name:'호그스미드 수리공',description:'마력 특성에 맞는 완성 지팡이를 고릅니다.',offers:[...supplies('SH09'),...stock('SH09',[['W004',520],['W006',540],['W007',560],['W019',620],['P031',350]])]};
SHOPS.SH11={id:'SH11',name:'월드컵 순회 장터 · 대회 교환회',description:'야영지 이후 학교의 연락원이 같은 재고를 이어받습니다.',offers:[...supplies('SH11'),...stock('SH11',[['S008',340,4],['S013',400,4],['S021',320,4],['S031',420,4],['S043',280,4],['S044',180,4],['W008',780,4],['P004',640,4],['P034',680,4]]),{id:'SH11.I009',itemId:'I009',price:100,stock:null,minChapter:4},{id:'SH11.I010',itemId:'I010',price:120,stock:null,minChapter:4}]};

// Both the shop UI and purchase validation use the same progression gate.
export function offerAvailable(offer,save) {
  const current=save?.cursor?.subchapterId||'1-01';
  const chapter=Number(current.split('-')[0]);
  if(offer.minChapter&&chapter<offer.minChapter)return false;
  if(offer.minScene){
    const [needChapter,needScene]=offer.minScene.split('-').map(Number);
    const [currentChapter,currentScene]=current.split('-').map(Number);
    if(currentChapter<needChapter||(currentChapter===needChapter&&currentScene<needScene))return false;
  }
  return (offer.conditions||[]).every(id=>save.progress.completedObjectiveIds.includes(id));
}

export const SPELL_BY_ID = Object.fromEntries(SPELLS.map(spell => [spell.id,spell]));

SHOPS.SH12={id:'SH12',name:'위즐리 장난감 거래',description:'시험 판매에서 정식 상점으로 이어지는 재고. 기초 물약 가격은 유지됩니다.',offers:[...supplies('SH12'),{id:'SH12.I013',itemId:'I013',price:90,stock:null,minChapter:5},{id:'SH12.I014',itemId:'I014',price:65,stock:null,minChapter:5},...stock('SH12',[['S046',450,5],['W011',950,5],['P007',720,5]])]};
SHOPS.SH13={id:'SH13',name:'성 뭉고 병원 앞 약재상',description:'병원 치료와 별개인 보급 상점입니다.',offers:[...supplies('SH13'),...stock('SH13',[['S031',420,5],['P021',600,5]]),{id:'SH13.I012',itemId:'I012',price:160,stock:null,minChapter:6}]};
SHOPS.SH09.offers.push(...stock('SH09',[['W011',950,5],['W010',1100,6],['W012',1050,5],['P006',720,6],['P014',760,5]]));
SHOPS.SH02.offers.push(...stock('SH02',[['S022',360,5],['S041',300,5],['S027',520,5],['S033',500,5],['S045',560,5],['S046',450,5],['S047',540,5],['S048',520,5],['S049',680,6],['S050',740,6],['S052',860,6],['S024',550,6],['S065',430,6]]));
