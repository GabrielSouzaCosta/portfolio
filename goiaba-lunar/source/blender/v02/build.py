"""Morfeu v02: complete sculpted volumes, a skeletal rig and exportable motion.
All geometry is authored locally in Blender. The portfolio sprite owns the colors,
face markings and expression; its flat silhouette is not extruded.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
ASSETS=P.parents[2]/'assets/models'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.fps=24;scene.frame_end=144
COLORS={'cream':'FFF4DC','orange':'ED973F','cap':'F1A34B','stripe':'BD622E','ink':'493426','pupil':'241C18','pink':'EBA392','gold':'D9A84E','ivory':'DDD8C6','hull':'ECE6D5','teal':'243D42','metal':'535E60','rust':'C25C30','blue':'81DEEF'}
def rgba(hex):
 a=[int(hex[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in a)+(1,)
def mat(name,col,rough=.55,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=rgba(COLORS.get(col,col));m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=m.diffuse_color;bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if emission:bs.inputs['Emission Color'].default_value=m.diffuse_color;bs.inputs['Emission Strength'].default_value=emission
 return m
cream=mat('Morfeu | warm white fur','cream',.8);orange=mat('Morfeu | orange fur','orange',.78);stripe=mat('Morfeu | tabby markings','stripe',.78);ink=mat('Morfeu | eye rim','ink',.62);pupil=mat('Morfeu | deep brown eyes','pupil',.19);gold=mat('Morfeu | amber irises','gold',.35);pink=mat('Morfeu | rose nose and ears','pink',.7);highlight=mat('Morfeu | pixel catchlights','FFFDF4',.3)
catparts=[];assignments={};ship=[]
def meshobj(name,verts,faces,material,group='cat',bone='body',smooth=True):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material)
 for p in me.polygons:p.use_smooth=smooth
 if group=='cat':catparts.append(o);assignments[o.name]=bone
 elif group=='ship':ship.append(o)
 return o

def finish(o,name,material,bone='body',group='cat',smooth=True):
 o.name=name;o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=smooth
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if group=='cat':catparts.append(o);assignments[o.name]=bone
 elif group=='ship':ship.append(o)
 return o

def ellipsoid(name,loc,scale,material,bone='body',segments=32,rings=20,group='cat'):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc)
 o=bpy.context.object;o.scale=scale;return finish(o,name,material,bone,group)

def bevel(o,width=.025,segments=3):
 mod=o.modifiers.new('Crafted soft edge','BEVEL');mod.width=width;mod.segments=segments
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return o

def block(name,loc,scale,material,bone='body',group='cat',edge=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;finish(o,name,material,bone,group,False)
 if edge:bevel(o,edge)
 return o

def tube(name,points,radius,material,bone='head',group='cat',sides=8):
 # Tube with parallel vertical ring basis; all authored paths avoid vertical tangents.
 verts=[];faces=[]
 for j,p in enumerate(points):
  t=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(j-1,0)]);t.normalize();a=t.cross(Vector((0,0,1)))
  if a.length<.01:a=t.cross(Vector((0,1,0)))
  a.normalize();b=t.cross(a).normalized()
  r=radius if isinstance(radius,(float,int)) else radius[j]
  for k in range(sides):verts.append(Vector(p)+r*(a*math.cos(2*math.pi*k/sides)+b*math.sin(2*math.pi*k/sides)))
 for j in range(len(points)-1):
  for k in range(sides):a=j*sides+k;b=j*sides+(k+1)%sides;faces.append((a,b,b+sides,a+sides))
 faces.extend([tuple(reversed(range(sides))),tuple((len(points)-1)*sides+k for k in range(sides))])
 return meshobj(name,verts,faces,material,group,bone)
# A curved head with its own UV topology. The texture follows the entire skull.
verts=[];uv=[];faces=[];N=64;M=40
for j in range(M+1):
 v=j/M;phi=math.pi*v
 for i in range(N+1):
  u=i/N;t=2*math.pi*(u-.5);q=math.sin(phi);cheek=1+.09*math.exp(-((v-.61)/.17)**2)
  verts.append((.77*math.sin(t)*q*cheek,-.59*math.cos(t)*q,1.91+.66*math.cos(phi)));uv.append((u,1-v))
for j in range(M):
 for i in range(N):a=j*(N+1)+i;faces.append((a,a+N+1,a+N+2,a+1))
head=meshobj('Head | continuous rounded skull',verts,faces,orange,bone='head');layer=head.data.uv_layers.new(name='Fur UV')
for p in head.data.polygons:
 for li in p.loop_indices:layer.data[li].uv=uv[head.data.loops[li].vertex_index]
# Hand-authored, nearest-sampled texels retain a restrained pixel-art edge on fur.
W=128;H=64;pixels=[]
for j in range(H):
 v=1-(j+.5)/H;phi=math.pi*v
 for i in range(W):
  t=2*math.pi*((i+.5)/W-.5);x=math.sin(t)*math.sin(phi);z=math.cos(phi);front=math.cos(t)
  col='cap'
  if z<-.22:col='cream'
  if front>.15 and (z<-.06 or (abs(x+.025)<(.095+.28*max(0,.45-z)) and z<.91)):col='cream'
  # Forehead tabby accents and stripes continue onto the temples and back.
  if col!='cream' and .37<z<.76 and (abs(x+.31)<.04 or abs(x-.34)<.035 or abs(x-.48)<.025):col='stripe'
  if abs(x)>.7 and ((-.02<z<.07) or (.21<z<.29)):col='stripe'
  if front<-.1 and .18<z<.83 and (abs(math.sin(t*5))<.2):col='stripe'
  c=COLORS[col];pixels.extend([int(c[k:k+2],16)/255 for k in (0,2,4)]+[1])
tex=bpy.data.images.new('Morfeu fur | 128px tabby palette',W,H);tex.pixels=pixels;tex.filepath_raw=str(P/'morfeu-fur.png');tex.file_format='PNG';tex.save();tex.pack()
fur=orange.copy();fur.name='Morfeu | pixel painted curved fur';nt=fur.node_tree.nodes.new('ShaderNodeTexImage');nt.image=tex;nt.interpolation='Closest';fur.node_tree.links.new(nt.outputs['Color'],fur.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);head.data.materials.clear();head.data.materials.append(fur)
# Body has substantial depth, a pear-shaped torso and separate bent haunches.
ellipsoid('Body | seated pear',(0,.065,.89),(.43,.34,.63),orange)
ellipsoid('Chest | cream bib',(0,-.235,1.01),(.315,.16,.47),cream)
for s,label in [(-1,'L'),(1,'R')]:
 ellipsoid('Haunch '+label,(s*.34,.12,.44),(.27,.3,.36),orange,bone='hip.'+label)
 ellipsoid('Hind paw '+label,(s*.35,-.1,.17),(.23,.34,.16),cream,bone='foot.'+label)
 arm=ellipsoid('Foreleg '+label,(s*.22,-.235,.61),(.135,.14,.41),cream,bone='arm.'+label);arm.rotation_euler.y=s*-.07
 ellipsoid('Front paw '+label,(s*.215,-.31,.2),(.165,.24,.15),cream,bone='paw.'+label)
 for d in [-1,1]:tube('Toe seam '+label+str(d),[(s*.215+d*.05,-.522,.19),(s*.215+d*.05,-.528,.235)],.008,pink,bone='paw.'+label,sides=6)
 # Soft sculpted ears, broad at root and smoothly tapered to a pointed apex.
 earverts=[];earfaces=[]
 sections=[(2.23,.26,.19),(2.41,.245,.145),(2.67,.145,.10),(2.92,.018,.018)]
 for z,rx,ry in sections:
  cx=s*(.5+(z-2.23)*.16)
  for k in range(12):a=2*math.pi*k/12;earverts.append((cx+rx*math.cos(a),-.015+ry*math.sin(a),z))
 for j in range(3):
  for k in range(12):a=j*12+k;b=j*12+(k+1)%12;earfaces.append((a,b,b+12,a+12))
 earfaces.extend([tuple(reversed(range(12))),tuple(range(36,48))])
 ear=meshobj('Ear '+label,earverts,earfaces,orange,bone='ear.'+label)
 sub=ear.modifiers.new('Soft ear contour','SUBSURF');sub.levels=1;bpy.context.view_layer.objects.active=ear;bpy.ops.object.modifier_apply(modifier=sub.name)
 # Sample the actual subdivided ear surface, then offset a curved pink patch
 # a fraction outward. This prevents orange intersections and floating plates.
 from mathutils.bvhtree import BVHTree
 depsgraph=bpy.context.evaluated_depsgraph_get();bpy.context.view_layer.update()
 tree=BVHTree.FromObject(ear,depsgraph)
 patchverts=[];patchfaces=[];rows=12;indices={}
 for j in range(rows+1):
  t=j/rows;z=2.43+.335*t;center=s*(.5+(z-2.23)*.16);half=.155*(1-t)+.003
  for i in range(rows-j+1):
   u=i/max(1,rows-j);x=center+(u*2-1)*half
   hit,normal,idx,distance=tree.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
   y=hit.y-.003 if hit else -.06
   indices[(j,i)]=len(patchverts);patchverts.append((x,y,z))
 for j in range(rows):
  for i in range(rows-j):
   patchfaces.append((indices[(j,i)],indices[(j,i+1)],indices[(j+1,i)]))
   if i<rows-j-1:patchfaces.append((indices[(j,i+1)],indices[(j+1,i+1)],indices[(j+1,i)]))
 meshobj('Ear velvet '+label,patchverts,patchfaces,pink,bone='ear.'+label)
 # Large round eyes follow the reference expression, with a real domed cornea.
 cx=s*.315;cz=1.985
 ellipsoid('Eye rim '+label,(cx,-.525,cz),(.273,.085,.3),ink,bone='eye.'+label)
 ellipsoid('Amber iris '+label,(cx,-.592,cz),(.231,.075,.254),gold,bone='eye.'+label)
 ellipsoid('Pupil '+label,(cx+s*.018,-.652,cz+.014),(.167,.04,.213),pupil,bone='eye.'+label)
 block('Square catchlight '+label,(cx-.052,-.693,cz+.102),(.074,.01,.083),highlight,bone='eye.'+label,edge=.008)
 block('Small catchlight '+label,(cx+.062,-.69,cz-.094),(.028,.009,.029),highlight,bone='eye.'+label,edge=.004)
 # Muzzle lobes bridge into the skull and project naturally in side view.
 ellipsoid('Muzzle '+label,(s*.138,-.557,1.678),(.22,.135,.16),cream,bone='head')
 ellipsoid('Cheek tint '+label,(s*.52,-.438,1.736),(.09,.018,.035),pink,bone='head')
 for k in range(2):
  tube('Whisker '+label+str(k),[(s*.43,-.48,1.7-k*.067),(s*.65,-.47,1.735-k*.11),(s*.9,-.42,1.77-k*.15)], [.012,.009,.003],ink,bone='head',sides=6)
nose=meshobj('Nose | rounded triangle',[(-.092,-.697,1.747),(.092,-.697,1.747),(0,-.72,1.668),(-.07,-.626,1.737),(.07,-.626,1.737),(0,-.65,1.683)],[(0,2,1),(0,1,4,3),(1,2,5,4),(2,0,3,5)],pink,bone='head');bevel(nose,.021,4)
tube('Smile left',[(0,-.683,1.668),(0,-.684,1.634),(-.06,-.681,1.607),(-.11,-.665,1.632)],.012,ink)
tube('Smile right',[(0,-.683,1.668),(0,-.684,1.634),(.06,-.681,1.607),(.11,-.665,1.632)],.012,ink)
# Tail is one curved mesh with blended weights across a three-bone chain.
tailpoints=[]
for i in range(33):
 t=i/32;tailpoints.append((.27+.68*math.sin(t*math.pi*.7),.26+.13*math.sin(t*math.pi),.34+1.05*t-.12*math.sin(t*math.pi)))
tail=tube('Tail | deformable curved mesh',tailpoints,[.105*(1-.48*(i/32)**4) for i in range(33)],orange,bone='tail.01',sides=12)
tail.data.materials.append(cream);tail.data.materials.append(stripe)
for p in tail.data.polygons:
 z=sum(tail.data.vertices[i].co.z for i in p.vertices)/len(p.vertices)
 if z>1.19:p.material_index=1
 elif .69<z<.78 or .99<z<1.07:p.material_index=2
ellipsoid('Tail | soft white tip',tailpoints[-1],(.057,.057,.057),cream,bone='tail.03',segments=20,rings=12)
# A proper armature is included in both GLBs and the editable Blender scene.
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Morfeu_Rig';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
bones={
 'root':((0,0,0),(0,0,.25),None),'body':((0,0,.4),(0,0,1.26),'root'),'head':((0,0,1.36),(0,0,2.14),'body'),
 'tail.01':(tailpoints[0],tailpoints[11],'body'),'tail.02':(tailpoints[11],tailpoints[22],'tail.01'),'tail.03':(tailpoints[22],tailpoints[32],'tail.02')}
for s,label in [(-1,'L'),(1,'R')]:
 bones.update({'ear.'+label:((s*.5,0,2.3),(s*.6,0,2.82),'head'),'eye.'+label:((s*.315,-.55,1.985),(s*.315,-.55,2.2),'head'),'arm.'+label:((s*.22,-.15,1.05),(s*.22,-.23,.4),'body'),'paw.'+label:((s*.22,-.23,.4),(s*.22,-.3,.17),'arm.'+label),'hip.'+label:((s*.27,.12,.7),(s*.35,.08,.35),'body'),'foot.'+label:((s*.35,.08,.35),(s*.35,-.13,.14),'hip.'+label)})
for name,(a,b,parent) in bones.items():
 eb=rig.data.edit_bones.new(name);eb.head=a;eb.tail=b
 if parent:eb.parent=rig.data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
for o in catparts:
 group=o.vertex_groups.new(name=assignments[o.name]);group.add(list(range(len(o.data.vertices))),1,'REPLACE')
 if o==tail:
  for bn in ['tail.02','tail.03']:o.vertex_groups.new(name=bn)
  for v in o.data.vertices:
   t=max(0,min(1,(v.co.z-.34)/1.05));q=t*2;a=min(1,int(q));f=q-a
   for k,bn in enumerate(['tail.01','tail.02','tail.03']):o.vertex_groups[bn].add([v.index],(1-f if k==a else f if k==a+1 else 0),'REPLACE')
 mod=o.modifiers.new('Morfeu skeletal deformation','ARMATURE');mod.object=rig;o.parent=rig
# Export a calm idle: breathing, head curiosity, one blink and a small ear twitch.
for b in rig.pose.bones:b.rotation_mode='XYZ'
for frame in [1,37,73,109,145]:
 t=(frame-1)/144*math.tau
 body=rig.pose.bones['body'];body.scale=(1+.009*math.sin(t),1+.012*math.sin(t),1+.009*math.sin(t));body.keyframe_insert('scale',frame=frame)
 h=rig.pose.bones['head'];h.rotation_euler=(.015*math.sin(t),.1*math.sin(t),.028*math.sin(t));h.keyframe_insert('rotation_euler',frame=frame)
 for k,bn in enumerate(['tail.01','tail.02','tail.03']):
  b=rig.pose.bones[bn];b.rotation_euler=(.04*math.sin(t+k*.6),.045*math.sin(t+k*.6),.11*math.sin(t+k*.6));b.keyframe_insert('rotation_euler',frame=frame)
for label in ['L','R']:
 b=rig.pose.bones['eye.'+label]
 for frame,value in [(1,1),(49,1),(52,.045),(55,1),(145,1)]:b.scale=(1,value,1);b.keyframe_insert('scale',frame=frame)
 b=rig.pose.bones['ear.'+label]
 for frame,value in [(1,0),(86,0),(90,.14 if label=='L' else -.07),(97,0),(145,0)]:b.rotation_euler.z=value;b.keyframe_insert('rotation_euler',frame=frame)
rig.animation_data.action.name='Morfeu | breathe, look, blink and tail'
scene.frame_set(1)
# The starfighter is authored from tapered hull sections, swept wings and nacelles.
hull=mat('Ship | porcelain alloy','hull',.36,.42);ivory=mat('Ship | warm panel edges','ivory',.4,.5);rust=mat('Ship | terracotta markings','rust',.43,.32);teal=mat('Ship | cockpit and recesses','teal',.4,.38);metal=mat('Ship | titanium mechanics','metal',.32,.7);engine=mat('Ship | ion cores','blue',.27,.3,3);glass=mat('Ship | petrol windscreen','285C67',.14,.55)
def loft(name,sections,material):
 vs=[];fs=[]
 # Octagonal cross-sections perpendicular to flight direction, the nose is -Y.
 for y,w,z,hh in sections:
  for x,h in [(-.72,-1),(.72,-1),(1,-.52),(1,.4),(.68,1),(-.68,1),(-1,.4),(-1,-.52)]:vs.append((x*w,y,z+h*hh))
 for j in range(len(sections)-1):
  for k in range(8):a=j*8+k;b=j*8+(k+1)%8;fs.append((a,b,b+8,a+8))
 fs.extend([tuple(reversed(range(8))),tuple((len(sections)-1)*8+k for k in range(8))]);o=meshobj(name,vs,fs,material,'ship',smooth=False);bevel(o,.025,3);return o
loft('Hull | long tapered keel',[(-2.5,.025,.29,.035),(-2.15,.2,.3,.11),(-1.3,.42,.32,.18),(-.45,.65,.34,.2),(.75,.66,.34,.21),(1.6,.39,.34,.16)],hull)
# Separate cockpit walls create a true open cavity around the pilot.
for s in [-1,1]:
 loft('Cockpit side rail '+str(s),[(-.75,.12,.58,.045),(-.34,.12,.63,.07),(.85,.12,.64,.08),(1.23,.10,.61,.05)],ivory)
 o=ship[-1];o.location.x=s*.49
block('Cockpit floor',(0,.35,.55),(.78,1.3,.1),teal,group='ship',edge=.08)
seat=block('Pilot seat',(0,.78,.79),(.56,.18,.54),teal,group='ship',edge=.085);seat.rotation_euler.x=.15
block('Seat cushion',(0,.41,.65),(.5,.58,.09),metal,group='ship',edge=.04)
# Faceted wraparound windscreen, lower than the face, and its narrow structural rim.
windverts=[(-.42,-.48,.62),(.42,-.48,.62),(.39,-.24,.95),(-.39,-.24,.95),(-.48,.06,.63),(-.4,.1,.97),(.48,.06,.63),(.4,.1,.97)]
meshobj('Windscreen | wraparound teal glass',windverts,[(0,1,2,3),(0,3,5,4),(1,6,7,2)],glass,'ship',smooth=False)
tube('Windscreen upper frame',[(-.4,.1,.97),(-.39,-.24,.95),(.39,-.24,.95),(.4,.1,.97)],.018,metal,group='ship')
# Swept, tapered wings have planform geometry and real airfoil thickness.
for s,label in [(-1,'port'),(1,'starboard')]:
 outline=[(.52,-.55),(1.1,-.33),(2.62,.66),(2.78,1.36),(1.42,.88),(.56,.94)]
 vs=[(s*x,y,.39+z) for z in [-.045,.045] for x,y in outline];n=len(outline)
 fs=[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 wing=meshobj('Wing | swept '+label,vs,fs,hull,'ship',smooth=False);bevel(wing,.03,3)
 # Inlaid panel, stripe and exposed root mechanics follow the wing sweep.
 panel=[(1.11,-.14),(2.49,.71),(2.6,1.17),(1.43,.73)]
 meshobj('Wing recessed panel '+label,[(s*x,y,.444) for x,y in panel],[(0,1,2,3)],ivory,'ship',smooth=False)
 meshobj('Wing orange insignia '+label,[(s*x,y,.449) for x,y in [(1.6,.13),(1.77,.24),(1.99,.91),(1.82,.85)]],[(0,1,2,3)],rust,'ship',smooth=False)
 tube('Wing seam '+label,[(s*.73,.76,.449),(s*1.45,.7,.449),(s*2.54,1.2,.449)],.007,teal,group='ship',sides=5)
 # Engine lathe along Y, with an octagonal nacelle and layered recessed nozzle.
 def cylinder(name,loc,radius,depth,material,vertices=32):
  bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc,rotation=(math.pi/2,0,0));o=bpy.context.object;finish(o,name,material,group='ship');bevel(o,.018,2);return o
 ex=s*1.46
 cylinder('Engine main nacelle '+label,(ex,.67,.48),.235,1.76,ivory)
 cylinder('Engine intake ring '+label,(ex,-.235,.48),.245,.12,metal)
 cylinder('Engine intake darkness '+label,(ex,-.301,.48),.185,.02,teal)
 cylinder('Engine central cone '+label,(ex,-.32,.48),.09,.065,metal)
 for k in range(5):cylinder('Engine cooling rib '+label+str(k),(ex,1.15+k*.085,.48),.24,.035,metal)
 cylinder('Engine exhaust rim '+label,(ex,1.63,.48),.24,.13,teal)
 cylinder('Engine luminous core '+label,(ex,1.704,.48),.181,.025,engine)
 cylinder('Engine nozzle center '+label,(ex,1.724,.48),.07,.032,metal)
 block('Nacelle orange line '+label,(ex,.57,.713),(.105,1.28,.018),rust,group='ship',edge=.01)
 # Slim wingtip probe and a swept dorsal stabilizer.
 cylinder('Wingtip probe '+label,(s*2.56,.69,.45),.037,.91,metal,12)
 finvs=[(s*.59,.89,.49),(s*.59,1.49,.49),(s*.59,1.38,1.2),(s*.59,1.1,1.05)]
 fin=meshobj('Tail fin '+label,finvs,[(0,1,2,3)],hull,'ship',smooth=False);sol=fin.modifiers.new('Fin thickness','SOLIDIFY');sol.thickness=.06;bpy.context.view_layer.objects.active=fin;bpy.ops.object.modifier_apply(modifier=sol.name);bevel(fin,.025,3)
 meshobj('Fin orange badge '+label,[(s*.627,1.21,.91),(s*.627,1.41,1.03),(s*.627,1.38,1.14),(s*.627,1.18,1)],[(0,1,2,3)],rust,'ship',smooth=False)
 for k in range(3):block('Rear radiator '+label+str(k),(s*(.18+k*.095),1.15,.523),(.042,.41,.025),teal,group='ship',edge=.01)
# Long orange racing stripe emphasizes the needle nose.
meshobj('Nose | terracotta inset',[(x,y,z) for x,y,z in [(-.032,-2.2,.423),(.032,-2.2,.423),(.091,-.82,.559),(-.091,-.82,.559)]],[(0,1,2,3)],rust,'ship',smooth=False)
for s in [-1,1]:
 tube('Nose engraved seam '+str(s),[(s*.09,-2.02,.445),(s*.23,-1.26,.526),(s*.29,-.89,.548)],.006,teal,group='ship',sides=5)
block('Instrument binnacle',(0,-.21,.72),(.55,.16,.19),teal,group='ship',edge=.035)
for s in [-1,0,1]:block('Instrument light '+str(s),(s*.13,-.118,.786),(.07,.015,.022),engine,group='ship',edge=.004)
# Export selections keep studio lights and floor out of the web model.
shiproot=bpy.data.objects.new('Goiaba_Scout',None);bpy.context.collection.objects.link(shiproot)
for o in ship:o.parent=shiproot;o.hide_render=True;o.hide_set(True)
def export(filename,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.hide_set(False);o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(ASSETS/filename),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_def_bones=True)
export('morfeu-rigged-v02.glb',[rig]+catparts)
rig.scale=(.48,)*3;rig.location=(0,.25,.59)
export('morfeu-scout-v02.glb',[rig]+catparts+[shiproot]+ship)
rig.scale=(1,)*3;rig.location=(0,0,0)
for o in ship:o.hide_render=True;o.hide_set(True)
# Neutral studio presentation, chosen to show curvature and contact shadows.
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Warm slate studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.19,.23,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35;scene.world=world
floor=mat('Studio floor','293740',.92)
block('Studio ground',(0,0,-.055),(200,200,.1),floor,group='studio',edge=0)
def aim(o,point):o.rotation_euler=(Vector(point)-o.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size,color in [('Large warm key',(-3,-4,6),600,4,(1,.86,.7)),('Cool fill',(4,-2,4),380,3,(.65,.8,1)),('Rim',(.5,4,6),850,3,(1,.9,.7))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color;aim(o,(0,0,1.3))
bpy.ops.object.camera_add(location=(4,-7,3.4));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=3.9;cam.data.lens=55;scene.camera=cam
for name,loc in [('portrait',(3.6,-7,3.15)),('front',(0,-8,2.3)),('rear',(4.3,6,3.2))]:
 cam.location=loc;aim(cam,(0,0,1.42));scene.render.filepath=str(P/'previews'/f'morfeu-{name}.png');bpy.ops.render.render(write_still=True)
rig.scale=(.48,)*3;rig.location=(0,.25,.59)
for o in ship:o.hide_set(False);o.hide_render=False
cam.data.ortho_scale=6.75;cam.location=(4.8,-7,5.6);aim(cam,(0,-.18,.7));scene.render.filepath=str(P/'previews/morfeu-scout.png');bpy.ops.render.render(write_still=True)
# Save on a clean rig rest pose, with the rig available in the outliner.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'morfeu-scout-rigged.blend'))
(P/'stats.json').write_text(json.dumps({'rig_bones':len(bones),'cat_objects':len(catparts),'ship_objects':len(ship),'animation_frames':144,'fps':24,'texture':'128×64, nearest sampled','stage':'v02 complete volumes with skeletal animation'},indent=2))
