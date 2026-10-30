# 챕터 1 효과 연결

`effect_runtime.mjs`는 외부 라이브러리 없이 실행되는 ES 모듈입니다. 6계열의 투사체·적중·잔류 18조합과 먼지·안개·눈·비·물결 5종의 입자 위치·색·크기·불투명도를 계산합니다. `drawEffect2D()`는 Canvas 2D용 어댑터이며, Three.js 등에서는 반환된 입자 데이터를 직접 사용할 수 있습니다.

```js
import { createMagicEffect, sampleMagicEffect, drawEffect2D } from './effect_runtime.mjs';
const effect = createMagicEffect('fire', 'impact', {
  origin: [3, 0.2, 5], seed: 123, large: true, scale: 2,
});
const particles = sampleMagicEffect(effect, elapsedSinceImpact);
drawEffect2D(worldContext, particles, projectWorldToScreen);
```

큰 효과는 128px급 출력용 절차적 도형·입자 변형이며, `impact_large_sheet.png`가 제공된 팩에서는 그 128×128 프레임 시트도 사용할 수 있습니다. `runtime_effects.json`의 실제 파일 참조를 따르세요. 기존 64×64 시트는 유지하며 `impactFrame()`으로 12fps 프레임을 선택할 수 있습니다. 투사체 속도, 적중 판정, 화상 시간, 방어막 지속시간은 반드시 게임 데이터에서 가져옵니다. 효과의 시각적 길이가 피해 타이밍을 결정하지 않습니다.

`sampleEnvironment(kind, time, {density: 0})`는 빈 배열을 반환합니다. 저사양/접근성 설정에서 밀도를 낮출 수 있습니다. 입자 전체를 월드 레이어에 그리고 공격 예고, 입력창, 대화창은 그 위에 그립니다. 환경 안개는 낮은 불투명도로 제한하며 눈·비는 외부/창밖 구역에만 배치합니다.

## 보스 예고와 판정

`../../UI_TELEGRAPH/v1/telegraph_runtime.mjs`의 `buildAttackGeometry()`가 반환하는 **동일한 삼각형 데이터**를 `drawTelegraph2D()`와 `hitTest()`가 사용합니다. 좌표는 `[x,z]`, 방향은 라디안이며 0은 동쪽(+X), π/2는 남쪽(+Z)입니다.

```js
const geometry = buildAttackGeometry('B1-2', {
  center: bossGroundPosition,
  innerRadius: configuredFireRingInnerRadius,
  safeGapCenter: safeExitAngle,
});
const phase = attackPhase('B1-2', elapsed, configuredActiveDuration);
drawTelegraph2D(worldContext, geometry, projectWorldToScreen, phase);
const collided = hitTest(geometry, playerGroundPosition, playerCollisionRadius, phase);
```

화염 고리 외반경 5T와 안전 틈 90°, 그림자선 2개 중 한 번에 1개 활성, 트롤 강타 2.5T·휩쓸기 4T 반원, 퀴렐 투사체 폭 0.7T·피해 14를 원본에서 유지했습니다. 고리 안쪽 반경, 그림자선 경로/폭, 돌진 폭, 발동 지속시간은 원본에 구체 값이 없어 호출자가 명시해야 합니다. 예고 시간에 피해 판정을 실행하면 `false`를 반환합니다. 한 공격의 중복 피해 방지·쿨타임·피해량 적용은 게임 전투 시스템의 책임입니다.

B1-1의 `start`와 `end`는 충돌 검사용으로 만들 때 **현재 시뮬레이션 스텝에서 투사체가 이동한 이전/현재 위치**를 전달합니다. 전체 비행 경로를 한순간에 피해를 주는 광선으로 사용하면 안 됩니다. 전체 조준 경로를 경고로 그리는 경우 `active:false`로만 표시합니다.

파일/단위 검사는 통과했지만 기존 게임 장면에 연결한 플레이 검수는 남아 있습니다.
