import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFromHash} from '../js/story.js';

test('routes permit product deep links and recover from unknown hashes',()=>{
  for(const world of ['cindra','commissionmatch','mangue'])assert.equal(routeFromHash('#'+world),world);
  for(const hash of ['','#galaxia','#unknown','#historia','#Cindra'])assert.equal(routeFromHash(hash),'galaxy');
});
