// Small campaign index. Story data is fetched only when that chapter is opened.
export const CHAPTER_INDEX = Object.freeze([
  {id:'ch01',number:1,title:'마법사의 돌',first:'1-01',last:'1-12',next:'ch02'},
  {id:'ch02',number:2,title:'비밀의 방',first:'2-01',last:'2-13',next:'ch03'},
  {id:'ch03',number:3,title:'아즈카반의 죄수',first:'3-01',last:'3-14',next:'ch04'},
  {id:'ch04',number:4,title:'불의 잔',first:'4-01',last:'4-16',next:'ch05'},
  {id:'ch05',number:5,title:'불사조 기사단',first:'5-01',last:'5-16',next:'ch06'},
  {id:'ch06',number:6,title:'혼혈 왕자',first:'6-01',last:'6-18',next:null}
]);
const loaders = {
  ch01: () => import('./ch01.js'),
  ch02: () => import('./ch02.js'),
  ch03: () => import('./ch03.js'),
  ch04: () => import('./ch04.js'),
  ch05: () => import('./ch05.js'),
  ch06: () => import('./ch06.js')
};
export function chapterInfo(id) { return CHAPTER_INDEX.find(c=>c.id===id) || null; }
export function chapterIdForScene(id) {
  const match=/^([1-6])-(\d{2})$/.exec(id || '');
  if(!match)return null;
  const meta=CHAPTER_INDEX[Number(match[1])-1], n=Number(match[2]);
  return n>=1&&n<=Number(meta.last.split('-')[1])?meta.id:null;
}
export async function loadChapter(id) {
  if(!loaders[id])throw new Error('아직 열리지 않은 챕터입니다.');
  const module=await loaders[id]();
  if(module.CHAPTER?.id!==id)throw new Error('챕터 자료가 일치하지 않습니다.');
  return module.CHAPTER;
}
export async function loadScene(id) {
  const chapterId=chapterIdForScene(id);
  if(!chapterId)throw new Error('지원하지 않는 장소입니다.');
  const chapter=await loadChapter(chapterId), scene=chapter.scenes.find(s=>s.id===id);
  if(!scene)throw new Error('장소 자료를 불러오지 못했습니다.');
  return scene;
}
export function resumeSceneId(save) {
  const meta=chapterInfo(save.cursor.chapterId);
  if(!meta||chapterIdForScene(save.cursor.subchapterId)!==meta.id)throw new Error('저장의 챕터와 장소가 일치하지 않습니다.');
  // v0.4 ended at 1-12. Its completed save can now cross the same boundary.
  if(meta.next&&save.cursor.subchapterId===meta.last&&save.progress.completedChapterIds.includes(meta.id))return chapterInfo(meta.next).first;
  return save.cursor.subchapterId;
}
