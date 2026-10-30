import { ITEMS } from './catalog.js';

// Keep the three visible positions tied to instance IDs, including empty slots.
// Two pendants of the same catalog type must never look like the same item.
export function pendantView(save, selectedSlot=0) {
  const selected=Number.isInteger(selectedSlot)&&selectedSlot>=0&&selectedSlot<3?selectedSlot:0;
  const owned=save.inventory.equipment.filter(e=>ITEMS[e.catalogId]?.kind==='pendant');
  const slots=Array.from({length:3},(_,slot)=>{
    const instance=owned.find(e=>e.instanceId===save.loadout.pendantInstanceIds[slot])||null;
    return {slot,instance,item:instance?ITEMS[instance.catalogId]:null,selected:slot===selected};
  });
  return {selected,slots,equippedCount:slots.filter(s=>s.instance).length,
    owned:owned.map(instance=>({instance,item:ITEMS[instance.catalogId],equippedSlot:slots.findIndex(s=>s.instance?.instanceId===instance.instanceId)}))};
}

export const BOOK_TABS=Object.freeze(['spells','inventory','pendants']);
export function adjacentBookTab(current,step) {
  const start=Math.max(0,BOOK_TABS.indexOf(current));
  return BOOK_TABS[(start+Math.sign(step)+BOOK_TABS.length)%BOOK_TABS.length];
}
