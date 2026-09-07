"""Build the first Morfeu voxel study from the portfolio's original sprite.
Run: /Applications/Blender.app/Contents/MacOS/Blender -b --python this_file.py
Original SVG is extracted unchanged except for hidden animation states.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene

def paint(name, color, metallic=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.82;p.inputs['Metallic'].default_value=metallic
 return m

def srgb(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
palette={}
def color_material(rgb):
 key=tuple(round(v*255) for v in rgb)
 if key not in palette: palette[key]=paint('Sprite #'+''.join(f'{v:02x}' for v in key),tuple(srgb(v/255) for v in key))
 return palette[key]
img=bpy.data.images.load(str(ROOT/'morfeu-reference.png'));w,h=img.size;px=list(img.pixels)
vox={}; S=.025
# Z follows the original drawing; Y gives the drawing an actual rounded volume.
for z in range(h):
 for x in range(w):
  i=(z*w+x)*4
  if px[i+3]<.9:continue
  row=h-1-z
  head=row<62;tail=x>75 and row>48
  center=42 if head else 46
  depth= max(3, int((15 if head else 12)*(max(.12,1-((x-center)/(39 if head else 27))**2))**.5))
  if tail:depth=3
  front=-depth
  rgb=tuple(px[i:i+3]);frontmat=color_material(rgb)
  for y in range(front,depth):
   # Frontmost voxel retains the exact sprite color; sides and back follow tabby fur.
   side=(.929,.592,.247)
   if not head and x<52 and not tail:side=(1,.957,.863)
   if (head and row in range(22,28) and y>3) or (tail and row in range(70,75)):side=(.741,.384,.18)
   vox[(x,y,z)] = frontmat if y==front else color_material(side)
verts=[];faces=[];mats=[];lookup={}; materials=list(palette.values());mi={m.name:i for i,m in enumerate(materials)}
dirs=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),((-1,0,0),[(0,1,0),(0,0,0),(0,0,1),(0,1,1)]),((0,1,0),[(1,1,0),(0,1,0),(0,1,1),(1,1,1)]),((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),((0,0,-1),[(0,1,0),(1,1,0),(1,0,0),(0,0,0)])]
for (x,y,z),mat in vox.items():
 for (dx,dy,dz),corners in dirs:
  if (x+dx,y+dy,z+dz) in vox:continue
  face=[]
  for a,b,c in corners:
   key=(x+a,y+b,z+c)
   if key not in lookup:lookup[key]=len(verts);verts.append(((key[0]-48)*S,key[1]*S,key[2]*S))
   face.append(lookup[key])
  faces.append(face);mats.append(mi[mat.name])
mesh=bpy.data.meshes.new('Morfeu voxel surface — internal faces removed');mesh.from_pydata(verts,[],faces);mesh.update()
cat=bpy.data.objects.new('Morfeu • original sprite in volume',mesh);bpy.context.collection.objects.link(cat)
for m in materials:mesh.materials.append(m)
for p,i in zip(mesh.polygons,mats):p.material_index=i
cat['source']='Portfolio index.html .morfeu-sprite';cat['stage']='Voxel silhouette study; back and sides are inferred, not approved reference.'
# Ship is a separate editable asset. Open cockpit keeps the face readable.
cream=paint('Ship · warm ivory',(.72,.67,.54),.2);dark=paint('Ship · ink',(.055,.065,.082),.3);orange=paint('Ship · burnt orange',(.65,.16,.04),.2);blue=paint('Engine · ice',(.25,.75,.9),.1)
ship=[]
def box(name,loc,scale,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);ship.append(o);return o
box('Fuselage',(0,0,.45),(1.3,2.4,.48),cream)
box('Cockpit dark interior',(0,-.12,.72),(.91,1.05,.13),dark)
box('Nose orange stripe',(0,-1,.71),(.24,.42,.04),orange)
for sign in [-1,1]:
 box('Wing', (sign*1.2,.3,.4),(1.25,.85,.14),cream)
 box('Wing stripe',(sign*1.3,.3,.49),(.23,.85,.04),orange)
 box('Engine housing',(sign*1.92,.15,.47),(.25,1.75,.3),dark)
 box('Engine ivory shell',(sign*1.92,.02,.52),(.3,1.15,.26),cream)
 box('Engine exhaust',(sign*1.92,1.04,.47),(.19,.05,.19),blue)
 box('Cockpit rim',(sign*.55,-.08,.79),(.13,1.4,.18),cream)
box('Cockpit rear',(0,.61,.9),(1.2,.17,.36),dark)
for o in ship:o.hide_render=True;o.hide_set(True)
# Export isolated cat and ship+pilot. Blender glTF converts Z-up to Y-up.
def export(name,objs):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.hide_set(False);o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0]
 bpy.ops.export_scene.gltf(filepath=str(ROOT.parent.parent/'assets/models'/name),export_format='GLB',use_selection=True,export_animations=False)
export('morfeu-voxel-v01.glb',[cat])
cat.scale=(.45,)*3;cat.location=(0,-.16,.68)
export('morfeu-ship-v01.glb',[cat]+ship)
cat.scale=(1,)*3;cat.location=(0,0,0)
for o in ship:o.hide_render=True;o.hide_set(True)
world=bpy.data.worlds.new('Studio navy');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.045,.055,.08,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65;scene.world=world
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
def aim(o,point):o.rotation_euler=(Vector(point)-o.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size in [('Key',(-3,-5,7),450,5),('Fill',(4,-2,4),220,4),('Rim',(1,4,5),350,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;aim(o,(0,0,1.3))
bpy.ops.object.camera_add(location=(0,-8,1.35));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=3.15;scene.camera=cam
for name,loc in [('front',(0,-8,1.35)),('three-quarter',(4,-8,3.2)),('back',(4,8,3.2))]:
 cam.location=loc;aim(cam,(0,0,1.35));scene.render.filepath=str(ROOT/'previews'/f'morfeu-{name}.png');bpy.ops.render.render(write_still=True)
cat.scale=(.45,)*3;cat.location=(0,-.16,.68)
for o in ship:o.hide_render=False;o.hide_set(False)
cam.data.ortho_scale=5.5;cam.location=(4,-7,5);aim(cam,(0,0,.8));scene.render.filepath=str(ROOT/'previews/morfeu-ship.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'morfeu-ship-v01.blend'))
(ROOT/'stats.json').write_text(json.dumps({'cat_vertices':len(verts),'cat_triangles':len(faces)*2,'materials':len(materials),'reference':'original portfolio SVG','stage':'v01 study'},indent=2))
