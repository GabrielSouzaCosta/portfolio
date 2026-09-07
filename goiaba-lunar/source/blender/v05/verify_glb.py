"""Check the exported rig, morph animation, buffers and normalized skin weights."""
from pathlib import Path
import struct,json,math
P=Path(__file__).resolve().parent
report=[]
for p in (P.parents[2]/'assets/models').glob('*v05.glb'):
 raw=p.read_bytes();magic,version,total=struct.unpack_from('<III',raw);assert magic==0x46546c67 and version==2 and total==len(raw)
 n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);b=raw[28+n:]
 def values(ai):
  a=d['accessors'][ai];v=d['bufferViews'][a['bufferView']];t={5120:'b',5121:'B',5122:'h',5123:'H',5125:'I',5126:'f'}[a['componentType']];k={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];sz=struct.calcsize(t)*k;stride=v.get('byteStride',sz);start=v.get('byteOffset',0)+a.get('byteOffset',0)
  return [struct.unpack_from('<'+t*k,b,start+i*stride) for i in range(a['count'])]
 assert len(d.get('skins',[]))==1 and len(d['skins'][0]['joints'])==23
 weighted=0;triangles=0
 for mesh in d['meshes']:
  for prim in mesh['primitives']:
   for val in values(prim['attributes']['POSITION']):assert all(math.isfinite(v) for v in val)
   triangles+=d['accessors'][prim['indices']]['count']//3
   if 'WEIGHTS_0' in prim['attributes']:
    ws=values(prim['attributes']['WEIGHTS_0']);js=values(prim['attributes']['JOINTS_0']);weighted+=len(ws)
    assert all(abs(sum(w)-1)<1e-4 for w in ws)
    assert all(max(j)<23 for j in js)
 assert len(d['animations'])==1
 morph_channels=0
 for a in d['animations']:
  morph_channels+=sum(c['target']['path']=='weights' for c in a['channels'])
  for s in a['samplers']:
   times=[v[0] for v in values(s['input'])];assert all(x<y for x,y in zip(times,times[1:]));assert all(math.isfinite(v) for row in values(s['output']) for v in row)
 assert morph_channels==4
 report.append({'file':p.name,'bytes':len(raw),'bones':23,'animation_clips':1,'eyelid_channels':morph_channels,'weighted_vertices':weighted,'triangles':triangles,'checks':'finite mesh/animation values; normalized weights; valid joint indices; increasing key times; all four eyelid morph channels'})
(P/'export-checks.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
