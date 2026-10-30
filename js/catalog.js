// Canonical chapter-one IDs. Numeric source values are retained where defined.
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
  {id:'S039',input:'wingardiumleviosa',name:'윙가르디움 레비오사',mana:17,cooldown:3,damage:0,kind:'levitate',color:'#b8e4ff',range:11,description:'깃털·체스말·곤봉 등 지정된 물체를 공중으로 띄웁니다.'}
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
  W017:{id:'W017',name:'소나무 생활 지팡이',kind:'wand',description:'탐험 주문 비용 -20%, 최대 마나 +8.',price:null,maxMana:8,explorationCostMultiplier:.8}
};

export const SHOPS = {
  SH01:{id:'SH01',name:'올리밴더스',description:'첫 지팡이는 무료입니다. 새 지팡이는 학교 주변 수리대에서 살펴보세요.',offers:[]},
  SH02:{id:'SH02',name:'플러리시 앤 블러츠',description:'필수 주문은 학교 수업에서 무료로 배웁니다. 선택 교재는 수리대의 연락 주문을 이용하세요.',offers:[]},
  SH03:{id:'SH03',name:'다이애건 약재상',description:'기초 물약 가격은 다음 챕터에서도 유지됩니다.',offers:[
    {id:'SH03.I001.basic',itemId:'I001',price:25,stock:null},
    {id:'SH03.I003.basic',itemId:'I003',price:35,stock:null}
  ]},
  SH04:{id:'SH04',name:'오두막 길의 수리대',description:'수리 의뢰를 마친 뒤 장비와 기초 물자를 점검하세요.',offers:[
    {id:'SH04.I001.basic',itemId:'I001',price:25,stock:null},
    {id:'SH04.I003.basic',itemId:'I003',price:35,stock:null},
    {id:'SH04.W002',itemId:'W002',price:180,stock:1},
    {id:'SH04.W017',itemId:'W017',price:150,stock:1},
    {id:'SH04.P012',itemId:'P012',price:120,stock:1},
    {id:'SH04.S006',spellId:'S006',price:40,stock:1},
    {id:'SH04.S019',spellId:'S019',price:90,stock:1}
  ]}
};

export const SPELL_BY_ID = Object.fromEntries(SPELLS.map(spell => [spell.id,spell]));
