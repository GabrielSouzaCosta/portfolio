import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {regions,affordable,convert,formatPrice,countLabel,regionLine} from '../js/commission.js';

test('the default purse opens exactly the three lands shown in the design',()=>{
  assert.deepEqual(affordable(250).map(region=>region.id).sort(),['oleo','pixel','retrato']);
  assert.equal(countLabel(affordable(250).length),'Três terras cabem na tua bolsa.');
  assert.equal(affordable(49).length,0);assert.equal(countLabel(0),'Nenhuma terra cabe na tua bolsa.');
  assert.equal(affordable(700).length,regions.length);assert.equal(countLabel(regions.length),'Todas as terras cabem na tua bolsa.');
});

test('tolls are shown in the traveller currency',()=>{
  assert.equal(convert(220,'BRL'),220);assert.equal(convert(220,'USD'),40);assert.equal(convert(220,'EUR'),35);
  assert.match(formatPrice(220,'BRL'),/^R\$\s220$/);assert.match(formatPrice(220,'USD'),/US\$\s40/);
});

test('the knight tells what is left or what is missing',()=>{
  const retrato=regions.find(region=>region.id==='retrato'),livros=regions.find(region=>region.id==='livros');
  assert.match(regionLine(retrato,250,'BRL'),/Cabe na tua bolsa, e ainda sobram R\$\s30\./);
  assert.match(regionLine(livros,250,'BRL'),/Aqui há dragões: faltam R\$\s390 na tua bolsa\./);
});

test('every land has a pin and a standing spot on the map and the slider covers every toll',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const region of regions)assert.match(html,new RegExp(`data-region="${region.id}" data-stand="[\\d.]+,[\\d.]+"`));
  const [,min,max]=html.match(/id="purse-range" type="range" min="(\d+)" max="(\d+)"/);
  assert.ok(Number(min)<Math.min(...regions.map(region=>region.price)));
  assert.ok(Number(max)>=Math.max(...regions.map(region=>region.price)));
});
