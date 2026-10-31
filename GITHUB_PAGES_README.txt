LUMOS 1–6챕터 v0.8.1

이 ZIP에는 1–6챕터 실행에 필요한 코드와 그림이 들어 있습니다.
기존 저장소를 업데이트할 때 같은 이름의 파일을 새 파일로 교체하세요.

이 ZIP의 압축을 푼 내용물 전체를 GitHub 저장소 최상단에 올리세요.
index.html, cloud-config.js, runtime/, assets/가 저장소 첫 화면에서 보여야 합니다.
Settings → Pages → Source: Deploy from a branch → main → /(root) → Save
배포가 끝나면 Visit site를 엽니다.
ZIP 자체만 올리거나 한 단계 바깥 폴더를 올리면 실행되지 않습니다.

로컬 실행: 압축을 푼 폴더에서 python -m http.server 8080
브라우저: http://localhost:8080/
index.html 더블클릭(file://)은 지원하지 않습니다.

기본 저장은 브라우저 안에 보관됩니다. 주소/브라우저를 옮길 때는
게임 설정의 저장 파일 내려받기·가져오기를 사용하세요.
Google Sheets 연결은 별도 Apps Script 배포가 필요합니다.
이 ZIP의 apps-script/ 폴더에 Code.gs, Code.txt, README.txt가 포함되어 있습니다.
Code.gs와 Code.txt는 내용이 같으므로 둘 중 하나를 열어 복사하면 됩니다.
설정 방법은 apps-script/README.txt를 참고하세요.
0.8.1 계정 기능을 위해 기존 웹 앱 배포를 새 버전으로 갱신하고 cloud-config.js에 URL을 설정하세요.
GitHub 업로드만으로 Apps Script 서버가 배포되지는 않습니다.
자세한 개발 안내는 source.zip의 docs/GITHUB_PAGES.md를 참고하세요.
