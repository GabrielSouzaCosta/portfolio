import test from 'node:test';
import assert from 'node:assert/strict';
import {story,createStoryState,chooseStory,routeFromHash} from '../js/story.js';

test('both choices lead to distinct complete stories without mutating previous state',()=>{
  const initial=createStoryState();const opened=chooseStory(initial,'open');const carried=chooseStory(initial,'carry');
  assert.deepEqual(initial,{node:'start',visited:['start'],opened:false});
  const light=chooseStory(opened,'plant'),letter=chooseStory(carried,'join');
  assert.equal(light.node,'light');assert.equal(light.opened,true);assert.equal(letter.node,'letter');assert.equal(letter.opened,false);
  assert.deepEqual(light.visited,['start','opened','light']);assert.deepEqual(letter.visited,['start','carried','letter']);
  assert.equal(story[light.node].choices.length,0);assert.equal(story[letter.node].choices.length,0);
});
test('invalid or stale choices cannot jump to another branch',()=>{
  const initial=createStoryState(),opened=chooseStory(initial,'open');
  assert.equal(chooseStory(initial,'plant'),initial);assert.equal(chooseStory(opened,'carry'),opened);
});
test('every story node is reachable and every target exists',()=>{
  const reached=new Set();function walk(id){if(reached.has(id))return;reached.add(id);for(const choice of story[id].choices){assert.ok(story[choice.to]);walk(choice.to);}}walk('start');assert.equal(reached.size,Object.keys(story).length);
});
test('routes permit product deep links and recover from unknown hashes',()=>{
  for(const world of ['cindra','commissionmatch','mangue'])assert.equal(routeFromHash('#'+world),world);
  for(const hash of ['','#galaxia','#unknown','#historia','#Cindra'])assert.equal(routeFromHash(hash),'galaxy');
});
