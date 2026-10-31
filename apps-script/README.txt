# LUMOS 0.8.1 운영자 설치·업데이트 안내

일반 플레이어는 게임에서 아이디와 비밀번호만 입력합니다. 아래 작업은 게임을 운영하는 사람이 처음 한 번 수행합니다. GitHub에 파일을 올리는 것만으로 Google 저장 서버가 설치되지는 않습니다.

## 새로 설치하기

1. 본인 계정에 비공개 Google 스프레드시트를 만듭니다.
2. 해당 시트의 확장 프로그램 → Apps Script를 엽니다. 기존 편집기 코드를 Code.gs의 전체 내용으로 교체합니다. Code.txt도 내용이 정확히 같으므로 둘 중 하나만 사용합니다. 별도 라이브러리 설치는 필요 없습니다.
3. 프로젝트 설정 → 스크립트 속성에 RPG_SPREADSHEET_ID를 등록합니다. 값은 시트 URL의 /d/ 다음 ID입니다. 시트는 공개하지 않습니다.
4. 코드를 저장하고 함수 목록의 setupRpgSheets를 한 번 실행합니다. 필요한 권한을 승인합니다. Players, Saves, Backups, Sessions, AuthLimits 시트와 헤더가 만들어집니다.
5. benchmarkPasswordHash를 실행해 실제 Google 실행 환경에서 비밀번호 처리 시간을 확인합니다. 수초 이상 걸리거나 동시 접속이 많다면 아래 운영 범위를 확인하세요.
6. 배포 → 새 배포 → 웹 앱. 실행 주체는 본인, 접근 대상은 모든 사용자(비로그인 접근 포함)로 설정합니다. 조직 계정이 익명 웹 앱을 허용하지 않으면 해당 조직 정책에 맞는 별도 서버가 필요합니다.
7. /exec로 끝나는 웹 앱 URL을 게임의 cloud-config.js에서 endpoint 값에 한 번 입력합니다. 소스 ZIP에서는 dist/cloud-config.js입니다. allowEndpointOverride는 일반 배포에서 false로 둡니다.
8. 게임 파일을 GitHub Pages에 배포합니다. 일반 사용자는 URL 입력 없이 시작 화면의 회원가입·로그인을 사용합니다.
9. 실제 GitHub 게임 주소에서 두 개의 서로 다른 브라우저로 가입 → 저장 → 다른 기기 로그인 → 불러오기를 확인합니다. Google ContentService 리디렉션 응답을 실제 브라우저가 읽을 수 있어야 합니다. 응답을 못 읽는 환경에서 no-cors로 바꾸거나 저장 성공 표시를 강제로 넣지 마세요.

cloud-config.js의 예:

window.LUMOS_CLOUD_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/실제배포ID/exec',
  allowEndpointOverride: false
};

현재 제공 ZIP의 endpoint는 빈 값입니다. 운영자의 실제 배포 URL을 제공받지 않았기 때문입니다. 빈 상태에서는 비로그인 플레이가 가능하며, 온라인 기능에는 서버 준비 안내가 나옵니다. 실제 계정 정보나 비밀번호를 게임 설정 파일에 넣지 마세요.

## 0.8.0 이하에서 업데이트

1. 기존 게임의 진행을 JSON 파일로 내보냅니다. Google Sheets에서 파일 → 사본 만들기로 시트 전체를 복사합니다. 업데이트 전 백업 파일은 비공개로 유지합니다.
2. 기존 Apps Script 코드를 별도 파일로 보관한 뒤 새 Code.gs로 전체 교체합니다. 이미 직접 추가한 setupRpgSheets 등의 함수를 중복으로 남기지 않습니다.
3. RPG_SPREADSHEET_ID를 그대로 유지하고 setupRpgSheets를 실행합니다. 기존 Players의 앞 네 열과 플레이어 ID, Saves, Backups 데이터는 보존됩니다. 필요한 열·시트만 추가합니다. 재실행해도 계정이나 저장 행을 중복 생성하지 않습니다. 예상과 다른 헤더가 있으면 변경 전에 중단합니다.
4. 배포 → 배포 관리 → 기존 웹 앱 편집 → 새 버전으로 갱신합니다. 같은 배포 URL을 유지할 수 있습니다.
5. 새 게임 파일과 cloud-config.js를 함께 배포합니다. 기존 이용자는 MIGRATION.txt에 따라 이전 계정을 전환합니다.

초기화 함수는 밑줄 없는 setupRpgSheets입니다. 새 사용자를 위해 addConfiguredPlayer나 RPG_SETUP_PLAYER_ID/RPG_SETUP_TOKEN_HASH를 설정할 필요가 없습니다. 이전 설명의 직접 해시 계산·시트 행 등록 절차는 0.8.1 가입 과정에 사용하지 않습니다. 기존 해시는 대소문자를 무시해 검증하며, 대문자였다는 이유로 인증 실패를 설명하지 않습니다.

## 비밀번호 분실: 운영자 초기화

이메일 자동 인증은 없습니다. 운영자가 기존 연락 경로·신원 확인 등을 통해 계정 소유자를 직접 확인해야 합니다. 아이디만 안다는 이유로 초기화 코드를 제공하지 마세요.

1. 시트에 연결된 Apps Script 편집기에서 resetPlayerPassword를 실행합니다.
2. 대화창에 본인 확인을 마친 사용자의 아이디를 입력합니다.
3. 한 번 표시되는 초기화 코드를 해당 사용자에게 비공개로 전달합니다. 원문은 시트·로그에 저장하지 않습니다. 유효기간은 24시간이며 한 번 사용하면 폐기됩니다.
4. 사용자는 게임 → 로그인 → 비밀번호를 잊었어요에서 아이디·초기화 코드·새 비밀번호를 입력합니다.

초기화 발급 시 기존 비밀번호/복구키와 모든 로그인 세션을 무효화하지만 Saves/Backups는 변경하지 않습니다. 코드를 분실하면 운영자가 다시 발급합니다. 기기에 남은 진행은 로그인 후 선택하여 이어갈 수 있습니다. 저장 교체 전 사본은 게임 설정 → 기기 복구 사본에서 내려받을 수 있습니다. 정지된 계정(enabled=FALSE)은 초기화하지 않습니다.

## 저장·세션 운영

- 아이디: 영문/숫자/_/- 3~64자. 앞뒤 공백을 무시하고 소문자로 통일합니다. 기존 저장의 playerId 원문은 유지하고 loginId만 정규화합니다. 기존 대소문자 중복 계정은 자동 합치지 않고 ACCOUNT_CONFLICT로 중단합니다. 운영자가 백업 후 서로 다른 loginId를 지정하고 각 소유자에게 새 로그인 아이디를 안내해야 합니다.
- 비밀번호: Unicode 문자 기준 8~128자. 공백, 대소문자, Unicode 표현을 그대로 처리합니다. 잘라내거나 정규화하지 않습니다.
- 세션: 기본 24시간, 로그인 유지 선택 시 30일. 비밀번호 원문은 브라우저에 저장하지 않습니다. 세션 원문은 기기의 세션 저장소/로그인 유지 저장소에만 남고, 서버 Sessions에는 해시만 기록합니다. 기기 전체 데이터를 지우면 해당 기기의 오프라인 진행과 세션도 사라집니다.
- 로그아웃: 기기에서 즉시 해제합니다. 오프라인이면 서버 폐기 요청을 기기에 보관해 연결 복구 시 재전송합니다. 서버 폐기가 완료되기 전에는 만료 시각까지 세션이 유효할 수 있습니다.
- 비밀번호 변경/운영자 초기화: 인증 세대 번호를 올려 모든 이전 세션을 즉시 무효화합니다. 비밀번호 변경을 수행한 기기에는 새 세션을 발급합니다.
- 로그인·가입·전환 시도: 계정 버킷당 15분에 8회, 전체 분당 100회. 비밀번호 변경은 15분에 5회 제한합니다. 동시 작업은 ScriptLock으로 직렬화합니다. 제한 저장소는 1,025개 고정 버킷이어서 아이디를 바꿔도 무한히 커지지 않습니다. 버킷 충돌은 제한을 강화할 수 있습니다. 성공한 로그인도 시도 횟수에 포함되며, 로그인 성공으로 같은 버킷의 다른 계정 제한이 해제되지는 않습니다.
- Saves의 envelopeJson이 저장 원본입니다. revision과 requestId를 검증하며, 응답 유실 재시도도 한 번만 적용합니다. 충돌은 자동 덮어쓰지 않고 두 진행을 선택하게 합니다.
- Players·Sessions·AuthLimits의 헤더를 재정렬하거나 임의로 삭제하지 마세요. 시트에 비밀번호 원문을 넣지 마세요. 플레이어가 일반 화면에서 enabled나 내부 인증 필드를 설정할 일은 없습니다.
- backupRpgSheets는 운영자가 편집기에서 실행하는 추가 백업 함수입니다. Google Drive에 전체 스프레드시트 사본을 만듭니다.

## 암호 구현과 Apps Script의 범위

Apps Script에는 WebCrypto/SubtleCrypto가 없습니다. 직접 암호 함수를 고안하지 않고 @noble/hashes 2.4.0의 PBKDF2-HMAC-SHA256 구현을 빌드 시 Code.gs에 묶었습니다. 비밀번호마다 다른 salt와 600,000회 반복을 적용합니다. SHA-256 단독은 기존 고엔트로피 복구키 전환, 세션·초기화 코드 조회에만 사용합니다. 비밀번호 검증에는 사용하지 않습니다.

문자열은 Utilities.newBlob(...).getBytes()로 UTF-8 바이트로 바꾸어 TextEncoder가 없는 환경에서도 작동하도록 했습니다. salt·세션·초기화 코드는 Utilities.getUuid 두 개를 사용합니다. Google 문서는 이를 Java UUID.randomUUID와 동등한 방식으로 설명하며, Java 문서는 암호학적으로 강한 난수 생성기를 명시합니다.

소규모 게임 운영을 전제로 합니다. 실제 Google 실행 시간·동시 실행 한도·일일 할당량·CORS는 이 제공 환경에서 검증하지 않았습니다. benchmarkPasswordHash와 실제 배포 점검을 먼저 수행하세요. 접속량이 많거나 처리 시간이 과도하면 인증만 Node.js의 표준 scrypt/Argon2id 또는 관리형 인증 서비스로 옮기고, 검증된 서버 세션을 통해 Sheets 저장 API를 호출하는 구성을 권장합니다. 이 대안은 본 배포에 설치하거나 연결하지 않았습니다. 로그인 한도를 낮추기 위해 비밀번호 해싱 반복 수를 줄이지 마세요.

참고:
https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
https://github.com/paulmillr/noble-hashes
https://developers.google.com/apps-script/guides/v8-runtime
https://developers.google.com/apps-script/reference/utilities/utilities
https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/UUID.html#randomUUID()

## 개발·패키징

암호/서버 원본은 apps-script/src/입니다. npm run build가 Code.gs와 dist/apps-script/Code.gs, Code.txt, README.txt, MIGRATION.txt, PLAYER_GUIDE.txt를 자동 갱신합니다. Code.gs는 생성 결과이므로 수정은 src/에서 합니다. npm run package:downloads가 실행용·전체 소스 ZIP 모두에 코드와 안내를 포함합니다. 별도 온라인 CDN이나 추가 Apps Script 파일은 필요 없습니다.

검증 구분과 변경 사항은 동봉한 RELEASE_NOTES.txt와 VERIFICATION.txt를 참고하세요. 소스 ZIP에는 같은 내용의 docs/revisions/V081_RELEASE.md 및 docs/VERIFICATION_081.md도 포함합니다.
