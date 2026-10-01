import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {residents,GRID,SHIP,HOME,walkDuration,residentLine,visitedLabel,bubblePlacement} from '../js/cindra.js';

test('Ember, the eight caretakers and six deck characters live in the valley',()=>{
  const companions=residents.filter(resident=>resident.kind==='companion').map(resident=>resident.id).sort();
  assert.deepEqual(companions,['bramble','ember','fern','kernel','loom','mote','pip','thistle','wisp']);
  const cards=residents.filter(resident=>resident.kind==='card');
  assert.equal(cards.length,6);
  // Only cards that exist in Series 1.
  const catalog=['C1-RW-03','C1-IN-01','C1-CH-01','C1-IN-11','C1-RW-04','C1-CH-02'];
  for(const card of cards)assert.ok(catalog.includes(card.role.replace('Carta ','')),card.id);
  assert.equal(new Set(residents.map(resident=>resident.id)).size,residents.length);
});

test('everyone stands inside the valley and has art on disk',async()=>{
  for(const resident of [...residents,{id:'ship',x:SHIP.x,y:SHIP.y,stand:HOME}]){
    for(const [x,y] of [[resident.x,resident.y],resident.stand]){
      assert.ok(x>0&&x<GRID.width&&y>0&&y<GRID.height,`${resident.id} at ${x},${y}`);
    }
    await stat(new URL(`../assets/drawn/cindra/${resident.id}.png`,import.meta.url));
  }
});

test('walks take longer for longer paths, within a calm range',()=>{
  assert.equal(walkDuration([0,0],[0,0]),500);
  assert.ok(walkDuration([0,0],[100,0])<walkDuration([0,0],[200,0]));
  assert.equal(walkDuration([0,0],[700,380]),2400);
});

test('companions cycle through their lines and the count reads naturally',()=>{
  const pip=residents.find(resident=>resident.id==='pip');
  assert.equal(residentLine(pip,0),'Oi! Quer avançar em algumas tarefas?');
  assert.equal(residentLine(pip,3),residentLine(pip,0));
  assert.match(visitedLabel(0),/Ninguém visitado ainda/);
  assert.equal(visitedLabel(3),`Você conheceu 3 de ${residents.length} moradores.`);
  assert.match(visitedLabel(residents.length),/todos os/);
});

test('bubbles drop below near the sky and hug the valley edges',()=>{
  const find=id=>residents.find(resident=>resident.id===id);
  assert.deepEqual(bubblePlacement(find('wisp')),{below:true,side:'right'});
  assert.deepEqual(bubblePlacement(find('fern')),{below:false,side:'left'});
  assert.deepEqual(bubblePlacement(find('thistle')),{below:false,side:'center'});
  assert.deepEqual(bubblePlacement(find('nimb')),{below:true,side:'right'});
});

test('the section has the valley art, its title and a live bubble',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/src="assets\/art\/cindra-valley\.png" width="704" height="384"/);
  assert.match(html,/id="cindra-title"[^>]*>O Vale dos Cantinhos</);
  assert.match(html,/id="valley-bubble" aria-live="polite"/);
});
