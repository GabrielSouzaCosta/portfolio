import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {story,endings,graph,createState,choose,rewind,forget,isOpen,endingsLabel,edgesOf,ART} from '../js/mangue.js';

const walk=(state,...ids)=>ids.reduce((s,id)=>choose(s,id),state);

test('every choice leads somewhere and every scene and ending can be reached from the margin',()=>{
  const reached=new Set();
  (function visit(id){if(reached.has(id))return;reached.add(id);for(const choice of story[id].choices||[]){assert.ok(story[choice.to],choice.to);visit(choice.to);}})('start');
  assert.deepEqual([...reached].sort(),Object.keys(story).sort());
  assert.equal(endings.length,5);
  for(const id of endings)assert.equal((story[id].choices||[]).length,0);
});

test('the hidden ending only opens for readers who read the letter first',()=>{
  const skipped=walk(createState(),'pescar','remar');
  const acender=story.farol.choices.find(choice=>choice.id==='acender');
  assert.equal(isOpen(skipped,acender),false);
  assert.equal(choose(skipped,'acender'),skipped);
  const read=walk(createState(),'ler','levar','remar','acender');
  assert.equal(read.node,'luz');
  assert.deepEqual(read.found,['luz']);
});

test('grown roots and found endings survive a rewind, and flags follow the path you rewound to',()=>{
  let state=walk(createState(),'pescar','remar','entregar');
  state=rewind(state,'start');
  state=walk(state,'ler','levar','remar');
  assert.equal(state.routes.farol.join('>'),'start>carta>lanterna>farol');
  const back=rewind(rewind(state,'start'),'farol');
  assert.ok(isOpen(back,story.farol.choices[1]));
  assert.deepEqual(back.found,['amizade']);
  assert.ok(back.grown.includes('start>carta'));
  assert.equal(rewind(back,'baile'),back);
});

test('a visitor branch joins the story as its own ending and can be pulled out again',()=>{
  const nodes=graph({from:'lanterna',label:'Seguir o caranguejo',text:'Ele leva você até um barco cheio de cartas.'});
  assert.ok(nodes.lanterna.choices.some(choice=>choice.custom));
  assert.equal(story.lanterna.choices.length,2);
  let state=walk(createState(),'pescar');
  state=choose(state,'seu',nodes);
  assert.equal(state.node,'seu');
  assert.equal(endingsLabel(state.found),'Só o seu final, por enquanto. Faltam 5.');
  assert.equal(endingsLabel([]),'Nenhum dos 5 finais, ainda.');
  state=forget(state,'seu');
  assert.equal(state.node,'lanterna');
  assert.ok(!state.grown.includes('lanterna>seu'));
  assert.equal(endingsLabel(['mare','seu']),'1 de 5 finais, mais o seu.');
});

test('knots sit between the trunk and the water, propagules on the water, all on the right page',()=>{
  for(const [id,node] of Object.entries(story)){
    const [x,y]=node.at;
    assert.ok(x>590&&x<ART.width-110,id);
    assert.ok(node.ending?y===478:y>=330&&y<470,id);
  }
  assert.equal(edgesOf(story).length,Object.values(story).reduce((n,node)=>n+(node.choices||[]).length,0));
});

test('the page has every hook the manuscript needs',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['mangue-title','folio-scene','folio-roots','folio-knots','folio-count','folio-turn','folio-leaf','folio-cat','folio-cat-line','mangue-scene-anchor'])assert.match(html,new RegExp(`id="${id}"`));
});
