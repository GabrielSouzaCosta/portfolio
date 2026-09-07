"""Morfeu v04: compact illustrated proportions and a softer facial expression.
All geometry is authored locally in Blender. The photograph guides anatomy and
coat placement; the portfolio sprite guides expression and square catchlights.
"""
import bpy, math, json, os
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parent
ASSETS=P.parents[2]/'assets/models'
CLAY=os.environ.get('MORFEU_STAGE')=='clay'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.fps=24;scene.frame_end=144
COLORS={'cream':'FFF9F0','orange':'D67525','cap':'D97829','stripe':'9E491C','ink':'493426','pupil':'241C18','pink':'EBA392','gold':'C8BD59','ivory':'DDD8C6','hull':'ECE6D5','teal':'243D42','metal':'535E60','rust':'C25C30','blue':'81DEEF'}
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
import bmesh
from mathutils.bvhtree import BVHTree
# Fuse anatomical masses into clean continuous surfaces. The remesh is a smooth
# surface operation; no voxel/block appearance is retained in the final model.
def fused(name,objects,voxel=.018,ratio=.38,bone='body'):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=objects[0];o.name=name
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 rem=o.modifiers.new('Continuous sculpt surface','REMESH');rem.mode='VOXEL';rem.voxel_size=voxel;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
 sm=o.modifiers.new('Anatomical transitions','SMOOTH');sm.factor=.68;sm.iterations=11;bpy.ops.object.modifier_apply(modifier=sm.name)
 dec=o.modifiers.new('Web surface budget','DECIMATE');dec.ratio=ratio;bpy.ops.object.modifier_apply(modifier=dec.name)
 o.data.materials.clear();o.data.materials.append(cream)
 for p in o.data.polygons:p.use_smooth=True
 return o

def mass(name,loc,scale):return ellipsoid(name,loc,scale,cream,group='sculpt',segments=40,rings=28)
def limbmass(name,a,b,r1,r2):
 a=Vector(a);b=Vector(b);mid=(a+b)/2;o=mass(name,mid,(r1,r2,(b-a).length*.7));o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
# Adult-cat seated proportions: forelimbs beneath chest, pelvis set behind chest,
# folded stifle/hock, narrow distal limbs and discrete weight-bearing toes.
# A smooth ring loft defines the whole trunk; no stacked thoracic/abdominal balls.
sections=[(.16,.29,.18,.20),(.35,.30,.36,.32),(.61,.28,.40,.355),(.86,.19,.355,.325),(1.12,.10,.325,.30),(1.39,.015,.298,.277),(1.62,-.045,.26,.239),(1.86,-.045,.205,.207),(2.015,-.025,.155,.165)]
vs=[];fs=[];n=48
for j in range(len(sections)-1):
 p0=sections[max(0,j-1)];p1=sections[j];p2=sections[j+1];p3=sections[min(len(sections)-1,j+2)]
 for step in range(8):
  t=step/8
  z,cy,rx,ry=[.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t) for k in range(4)]
  for k in range(n):ang=math.tau*k/n;vs.append((rx*math.cos(ang),cy+ry*math.sin(ang),z))
rings=len(vs)//n
for j in range(rings-1):
 for k in range(n):a=j*n+k;b=j*n+(k+1)%n;fs.append((a,b,b+n,a+n))
fs.extend([tuple(reversed(range(n))),tuple((rings-1)*n+k for k in range(n))])
trunk=meshobj('Unified thorax lumbar pelvis',vs,fs,cream,group='sculpt')
body_masses=[trunk]
for s,label in [(-1,'L'),(1,'R')]:
 shoulder=(s*.255,-.02,1.56);elbow=(s*.285,-.18,.99);wrist=(s*.265,-.34,.27)
 arm=tube('Continuous foreleg '+label,[(s*.145,.08,1.69),(s*.240,-.09,1.29),(s*.282,-.18,1.02),(s*.271,-.275,.62),(s*.265,-.35,.265),(s*.265,-.42,.13)],[.125,.115,.108,.100,.089,.120],cream,group='sculpt',sides=20)
 body_masses += [mass('Armpit transition '+label,(s*.18,-.08,1.07),(.075,.075,.18)),arm,mass('Forepaw '+label,(s*.265,-.423,.112),(.145,.180,.115))]
 for k in range(4):body_masses.append(mass('Foretoe '+label+str(k),(s*.265+(k-1.5)*.058,-.545+abs(k-1.5)*.013,.086),(.048,.055,.061)))
 body_masses += [mass('Folded thigh '+label,(s*.300,.27,.69),(.205,.29,.40)),limbmass('Folded calf '+label,(s*.385,.015,.50),(s*.413,.30,.215),.093,.105),limbmass('Hind metatarsus '+label,(s*.413,.30,.215),(s*.451,.016,.108),.088,.095),mass('Hind paw '+label,(s*.451,-.006,.101),(.12,.204,.087))]
 for k in range(4):body_masses.append(mass('Hindtoe '+label+str(k),(s*.451+(k-1.5)*.051,-.176+abs(k-1.5)*.013,.073),(.039,.055,.047)))
body=fused('Morfeu | continuous torso and four legs',body_masses,.017,.32)
# Relax only the concave chest/foreleg junctions; preserve paws and silhouette.
junction=body.vertex_groups.new(name='Temporary chest surface relaxation')
for v in body.data.vertices:
 x,y,z=v.co
 weight=math.exp(-2*(((abs(x)-.19)/.17)**2+((y+.15)/.28)**2+((z-1.13)/.33)**2))
 junction.add([v.index],weight,'REPLACE')
relax=body.modifiers.new('Continuous inner foreleg transitions','SMOOTH');relax.vertex_group=junction.name;relax.factor=.85;relax.iterations=70
bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=relax.name);body.vertex_groups.remove(body.vertex_groups['Temporary chest surface relaxation'])
# Skull is a tapered feline head, not a ball. Whisker pads and chin blend into it.
head_masses=[mass('Cranium',(0,.02,2.30),(.55,.395,.405)),mass('Occiput',(0,.13,2.20),(.40,.345,.36)),mass('Jaw',(0,-.09,2.105),(.385,.31,.24)),mass('Nasal bridge',(0,-.285,2.19),(.13,.225,.22)),mass('Chin',(0,-.348,1.989),(.164,.177,.092))]
for s in [-1,1]:head_masses += [mass('Cheek',(s*.255,-.08,2.16),(.31,.31,.218)),mass('Whisker pad',(s*.108,-.369,2.061),(.182,.179,.12))]
head=fused('Morfeu | cheekbones muzzle and skull',head_masses,.0125,.40,bone='head')
# Paint only the patches supported by the photograph; unseen side is interpreted.
white=rgba('FFF9F0');ginger=rgba('CE691F');gingerlight=rgba('DC7B2A');darkginger=rgba('9C491D')
def blend(a,b,t):return tuple(a[k]*(1-t)+b[k]*t for k in range(4))
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def headcolor(p):
 x,y,z=p
 # Orange crown and ear-side patches with a white blaze that widens at the nose.
 width=.078+max(0,2.50-z)*.24
 front=smooth(.07,-.14,y)
 blaze=(1-smooth(width-.025,width+.018,abs(x+.015)))*front
 lower=1-smooth(2.11,2.19,z)
 amount=(1-max(blaze,lower))
 # Subtle tabby lines embedded into the ginger cap; no sticker-like zigzags.
 stripes=0
 for sx in [-.29,-.19,.22,.34]:
  curve=sx+.025*math.sin((z-2.2)*14)
  stripes=max(stripes,(1-smooth(.012,.030,abs(x-curve)))*smooth(2.29,2.34,z)*(1-smooth(2.53,2.6,z))*front)
 base=blend(gingerlight,darkginger,stripes*.65)
 return blend(white,base,amount)
def bodycolor(p):
 x,y,z=p
 a=(x/.46)**2+((y-.20)/.34)**2+((z-1.40)/.255)**2
 b=((x+.035)/.67)**2+((y-.31)/.46)**2+((z-.65)/.38)**2
 patch=max(1-smooth(.78,1.05,a),1-smooth(.65,1.30,b))
 gap=abs(z-(1.075+.14*x+.018*math.sin(x*5)))
 patch*=smooth(.005,.10,y)*smooth(.29,.4,z)
 markings=(.5+.5*math.cos(39*z+7*x+2*math.sin(10*y)))**6
 return blend(white,blend(ginger,darkginger,markings*.24),patch)
def vertexpaint(o,name,sample):
 o.data.materials.clear();m=mat(name,'cream',.83);n=m.node_tree.nodes.new('ShaderNodeVertexColor');n.layer_name='Fur';m.node_tree.links.new(n.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);o.data.materials.append(m)
 attr=o.data.color_attributes.new(name='Fur',type='FLOAT_COLOR',domain='POINT')
 for v in o.data.vertices:attr.data[v.index].color=sample(v.co)
 return m
vertexpaint(head,'Morfeu | ginger cap and white blaze',headcolor)
vertexpaint(body,'Morfeu | white coat with localized ginger patches',bodycolor)
catparts=[body,head];assignments={body.name:'body',head.name:'head'}
# Thin cupped ears are built into roots on the skull. Both faces have real depth.
for s,label in [(-1,'L'),(1,'R')]:
 vs=[];fs=[];sections=[(2.51,.17,.105),(2.66,.166,.077),(2.87,.098,.045),(3.025,.009,.009)]
 for z,rx,ry in sections:
  cx=s*(.362+(z-2.51)*.21)
  for k in range(20):t=2*math.pi*k/20;vs.append((cx+rx*math.cos(t),.028+ry*math.sin(t),z))
 for j in range(3):
  for k in range(20):a=j*20+k;b=j*20+(k+1)%20;fs.append((a,b,b+20,a+20))
 fs.extend([tuple(reversed(range(20))),tuple(range(60,80))])
 ear=meshobj('Ear '+label,vs,fs,orange,bone='ear.'+label);sub=ear.modifiers.new('Soft ear surface','SUBSURF');sub.levels=2;bpy.context.view_layer.objects.active=ear;bpy.ops.object.modifier_apply(modifier=sub.name)
 bpy.context.view_layer.update();tree=BVHTree.FromObject(ear,bpy.context.evaluated_depsgraph_get());vs=[];fs=[];ids={};R=16
 for j in range(R+1):
  t=j/R;z=2.64+.287*t;center=s*(.362+(z-2.51)*.21);half=.10*(1-t)+.002
  for i in range(R-j+1):
   u=i/max(1,R-j);x=center+(u*2-1)*half;hit,*_=tree.ray_cast(Vector((x,-1,z)),Vector((0,1,0)));y=hit.y-.003 if hit else -.06;ids[(j,i)]=len(vs);vs.append((x,y,z))
 for j in range(R):
  for i in range(R-j):
   fs.append((ids[j,i],ids[j,i+1],ids[j+1,i]))
   if i<R-j-1:fs.append((ids[j,i+1],ids[j+1,i+1],ids[j+1,i]))
 meshobj('Ear interior '+label,vs,fs,pink,bone='ear.'+label)
# Orbital surfaces are sampled from the actual head. Iris surfaces sit on the
# socket, with a shallow cornea and a fine contour rather than stacked discs.
bpy.context.view_layer.update();headtree=BVHTree.FromObject(head,bpy.context.evaluated_depsgraph_get())
def skin_y(x,z):
 hit,*_=headtree.ray_cast(Vector((x,-2,z)),Vector((0,1,0)))
 return hit.y if hit else -.2
EYE_W=.178;EYE_H=.148;EYE_Z=2.29
lids=[]
# Smooth eye texture: a broad pupil, olive-gold iris and two deliberate catches.
IW=256;IH=256;pixels=[]
for j in range(IH):
 v=(j+.5)/IH
 for i in range(IW):
  u=(i+.5)/IW;dx=(u-.5)*2;dz=(v-.5)*2;r=math.sqrt(dx*dx+dz*dz);t=math.atan2(dz,dx)
  q=((u-.483)/.305)**2+((v-.543)/.354)**2
  c=blend(rgba('B9B46A'),rgba('777F43'),.40+.055*math.sin(t*38))
  c=blend(c,(.36,.31,.12,1),smooth(.83,.98,r)*.54)
  c=blend(rgba('191C18'),c,smooth(.97,1.035,q))
  c=blend(c,(.22,.18,.10,1),smooth(.962,.995,r))
  if (.315<u<.465 and .658<v<.818) or (.662<u<.713 and .281<v<.338):c=(1,.988,.949,1)
  pixels.extend(c)
tex=bpy.data.images.new('Morfeu olive eyes and sprite catches',IW,IH);tex.pixels=pixels;tex.filepath_raw=str(P/'morfeu-eyes.png');tex.file_format='PNG';tex.save();tex.pack()
eye_material=mat('Morfeu | inset olive golden eyes','gold',.47)
bs=eye_material.node_tree.nodes.get('Principled BSDF');bs.inputs['Specular IOR Level'].default_value=.13;bs.inputs['Coat Weight'].default_value=.035
nt=eye_material.node_tree.nodes.new('ShaderNodeTexImage');nt.image=tex;nt.interpolation='Linear';eye_material.node_tree.links.new(nt.outputs['Color'],bs.inputs['Base Color'])
for s,label in [(-1,'L'),(1,'R')]:
 cx=s*.268
 # Fit one smooth corneal patch to five anatomical socket samples. This removes
 # small remesh irregularities from the optical surface without raising a disc.
 y0=skin_y(cx,EYE_Z)-.008
 yl=skin_y(cx-EYE_W,EYE_Z)-.008;yr=skin_y(cx+EYE_W,EYE_Z)-.008
 yt=skin_y(cx,EYE_Z+EYE_H)-.008;yb=skin_y(cx,EYE_Z-EYE_H)-.008
 ax=(yr-yl)/(2*EYE_W);az=(yt-yb)/(2*EYE_H)
 qx=((yr+yl)/2-y0)/(EYE_W*EYE_W);qz=((yt+yb)/2-y0)/(EYE_H*EYE_H)
 def point(dx,dz,extra=0):
  x=cx+dx;z=EYE_Z+dz+s*.035*dx
  return (x,y0+ax*dx+az*dz+qx*dx*dx+qz*dz*dz-extra,z)
 # Sculpt the orbital neighborhood onto the same smooth optical curvature.
 # This removes the small nasal/cheek ridges from the seam shared by skin/lids.
 for vertex in head.data.vertices:
  dx=vertex.co.x-cx;dz=vertex.co.z-EYE_Z-s*.035*dx
  radius=math.sqrt((dx/EYE_W)**2+(dz/EYE_H)**2)
  if vertex.co.y<0 and radius<1.65:
   weight=1-smooth(1.17,1.65,radius)
   target=point(dx,dz)[1]+.008
   vertex.co.y=vertex.co.y*(1-weight)+target*weight
 head.data.update()
 vs=[];fs=[];uvs=[];N=80;R=22
 for j in range(R+1):
  r=j/R
  for i in range(N+1):
   t=math.tau*i/N;dx=EYE_W*r*math.cos(t);dz=EYE_H*r*math.copysign(abs(math.sin(t))**1.3,math.sin(t))
   optical=Vector(point(dx,dz));optical.y+=.016
   vs.append(optical);uvs.append((.5+dx/(2*EYE_W),.5+dz/(2*EYE_H)))
 for j in range(R):
  for i in range(N):a=j*(N+1)+i;fs.append((a,a+N+1,a+N+2,a+1))
 # Carve the matching shallow orbital opening, so facial skin cannot cover the
 # iris. The socket stops behind the lens and does not drill through the skull.
 ring=[]
 for i in range(80):
  t=math.tau*i/80;dx=EYE_W*math.cos(t);dz=EYE_H*math.copysign(abs(math.sin(t))**1.3,math.sin(t));x,y,z=point(dx,dz)
  ring.append((x,y+.05,z))
 cutverts=[(x,-1.5,z) for x,y,z in ring]+ring
 cutfaces=[tuple(reversed(range(80))),tuple(range(80,160))]+[(i,(i+1)%80,(i+1)%80+80,i+80) for i in range(80)]
 cutter=meshobj('Temporary eye socket',cutverts,cutfaces,cream,group='sculpt',smooth=False)
 # Boolean meshes must have consistent outward normals.
 bm=bmesh.new();bm.from_mesh(cutter.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(cutter.data);bm.free()
 mod=head.modifiers.new('Inset orbital opening '+label,'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.context.view_layer.objects.active=head;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 eye=meshobj('Eye surface '+label,vs,fs,eye_material,bone='head');uvlayer=eye.data.uv_layers.new(name='Iris UV')
 for poly in eye.data.polygons:
  for li in poly.loop_indices:uvlayer.data[li].uv=uvs[eye.data.loops[li].vertex_index]
 # Upper and lower lids have real morph targets which cover an unchanged eye.
 for upper in [True,False]:
  vs=[];closed=[];fs=[];NX=36
  rows=[0,.15,.30,.45,.60,.75,.88,.955,.985,1];NY=len(rows)-1
  for j,v in enumerate(rows):
   for i in range(NX+1):
    u=i/NX*2-1;dx=EYE_W*u;edge=EYE_H*max(0,1-u*u)**.65*(1 if upper else -1)
    # Both poses share an outer rim seated UNDER the original head skin.
    # The visible resting margin overlaps the iris instead of exposing a socket.
    outerdx=dx*1.10
    outerz=edge+(.024 if upper else -.024)*math.sqrt(max(0,1-u*u))
    innerz=edge*(.86 if upper else .96)+(-.004 if upper else .003)*math.sqrt(max(0,1-u*u))
    openz=outerz*(1-v)+innerz*v
    op=Vector(point(outerdx*(1-v)+dx*v,openz,.004))
    clz=outerz*(1-v)+(-.022*math.sqrt(max(0,1-u*u)))*v
    cp=Vector(point(outerdx*(1-v)+dx*v,clz,.004))
    # Lids and the surrounding head share the analytic orbital surface.
    # Recess the optical patch, keep the lid flush, and bury only the outer rim.
    for co in [op,cp]:
     ddx=co.x-cx;ddz=co.z-EYE_Z-s*.035*ddx
     radius=math.sqrt((ddx/EYE_W)**2+(ddz/EYE_H)**2)
     co.y=point(ddx,ddz)[1]+.008-.0015+.0065*smooth(1.015,1.12,radius)
    vs.append(op);closed.append(cp)
  for j in range(NY):
   for i in range(NX):a=j*(NX+1)+i;fs.append((a,a+1,a+NX+2,a+NX+1))
  lid=meshobj('Lid '+label+(' upper' if upper else ' lower'),vs,fs,cream,bone='head');vertexpaint(lid,'Lid fur '+label+str(upper),headcolor)
  # Sample fur in the closed pose so opening-strip colors are not stretched
  # into vertical bands across the full eyelid when it blinks.
  fur=lid.data.color_attributes['Fur']
  for i,co in enumerate(closed):
   color=headcolor(co)
   if i//(NX+1)==NY:color=blend(color,rgba('765850'),.72)
   fur.data[i].color=color
  lid.shape_key_add(name='Basis');key=lid.shape_key_add(name='Blink')
  for i,co in enumerate(closed):key.data[i].co=co
  for frame,value in [(1,0),(49,0),(52,1),(55,0),(145,0)]:key.value=value;key.keyframe_insert('value',frame=frame)
  lids.append(lid)
# Small nose, recessed mouth and fine pale whiskers. No separate muzzle balls.
nose=meshobj('Nose | soft triangular leather',[(-.068,-.55,2.102),(.068,-.55,2.102),(0,-.573,2.049),(-.054,-.515,2.091),(.054,-.515,2.091),(0,-.525,2.057)],[(0,2,1),(0,1,4,3),(1,2,5,4),(2,0,3,5)],pink,bone='head');bevel(nose,.014,3)
mouthmat=mat('Morfeu | subtle mouth','765850',.8)
tube('Philtrum',[(0,-.557,2.055),(0,-.56,2.022)],.006,mouthmat)
for s,label in [(-1,'L'),(1,'R')]:
 tube('Mouth cleft '+label,[(0,-.56,2.022),(s*.048,-.55,2.005),(s*.094,-.521,2.016)],.005,mouthmat)
 for k in range(2):
  start=(s*(.224+k*.01),-.4,2.062-k*.032)
  tube('Whisker '+label+str(k),[start,(s*.43,-.42,2.09-k*.06),(s*(.62-k*.025),-.34,2.13-k*.087)], [.0048,.0033,.0008],cream,bone='head',sides=6)
# Tail starts on the pelvis at the midline, exits rearwards and curls to the side.
tailpoints=[]
for i in range(49):
 t=i/48
 tailpoints.append((.75*math.sin(t*math.pi*.64),.59+.25*math.sin(t*math.pi)-.48*t*t,.72-.31*math.sin(t*math.pi)+.51*t*t))
tail=tube('Tail | pelvic root and flexible chain',tailpoints,[.090*(1-.56*(i/48)**2) for i in range(49)],cream,bone='tail.01',sides=14)
def tailcolor(p):
 x,y,z=p;amount=1-smooth(1.10,1.18,z);band=(.5+.5*math.cos(24*z+5*x))**5
 return blend(white,blend(ginger,darkginger,band*.42),amount)
vertexpaint(tail,'Morfeu | tail inferred from sprite',tailcolor)
ellipsoid('Tail rounded tip',tailpoints[-1],(.039,.039,.039),cream,bone='tail.04',segments=16,rings=10)
# Anatomical armature with continuous weights on the merged torso/limbs.
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Morfeu_Rig';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0])
bones={'root':((0,0,0),(0,0,.2),None),'pelvis':((0,.32,.4),(0,.23,.85),'root'),'body':((0,.23,.85),(0,.045,1.55),'pelvis'),'neck':((0,.045,1.55),(0,-.045,1.92),'body'),'head':((0,-.045,1.92),(0,.02,2.47),'neck')}
for k in range(4):bones['tail.'+str(k+1).zfill(2)]=(tailpoints[k*12],tailpoints[min(48,(k+1)*12)],'pelvis' if k==0 else 'tail.'+str(k).zfill(2))
for s,label in [(-1,'L'),(1,'R')]:
 bones.update({'ear.'+label:((s*.37,.025,2.56),(s*.47,.025,2.98),'head'),'upper_arm.'+label:((s*.255,-.02,1.56),(s*.285,-.18,.99),'body'),'forearm.'+label:((s*.285,-.18,.99),(s*.265,-.34,.27),'upper_arm.'+label),'paw.'+label:((s*.265,-.34,.27),(s*.265,-.52,.11),'forearm.'+label),'thigh.'+label:((s*.28,.33,.67),(s*.39,-.005,.53),'pelvis'),'shin.'+label:((s*.39,-.005,.53),(s*.425,.335,.22),'thigh.'+label),'hock.'+label:((s*.425,.335,.22),(s*.46,-.06,.12),'shin.'+label)})
for name,(a,b,parent) in bones.items():
 eb=rig.data.edit_bones.new(name);eb.head=a;eb.tail=b
 if parent:eb.parent=rig.data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True

def segment_distance(p,a,b):
 a=Vector(a);v=Vector(b)-a;t=max(0,min(1,(p-a).dot(v)/v.length_squared));return (p-a-v*t).length
for o in catparts:
 bn=assignments.get(o.name,'head');groups={}
 if o==body:
  candidates=[k for k in bones if k not in ['root','head'] and not k.startswith(('tail','ear'))]
  for k in candidates:groups[k]=o.vertex_groups.new(name=k)
  for v in o.data.vertices:
   p=v.co;ws=[]
   for k in candidates:
    # Anatomical radii favor the correct chain and restrict cross-leg influence.
    if k.endswith('.L') and p.x>.02:continue
    if k.endswith('.R') and p.x<-.02:continue
    d=segment_distance(p,*bones[k][:2]);radius=.32 if k in ['body','pelvis'] else .20 if k=='neck' else .09
    w=math.exp(-4*(d/radius)**2)
    if k in ['body','pelvis','neck'] and p.z<.48:w*=.005
    if k=='body' and p.y<-.16 and p.z<1.3:w*=.015
    ws.append((k,w))
   ws=sorted(ws,key=lambda kv:kv[1],reverse=True)[:4];total=sum(w for k,w in ws)
   if total<1e-15:ws=[(min(candidates,key=lambda k:segment_distance(p,*bones[k][:2])),1)];total=1
   for k,w in ws:groups[k].add([v.index],w/total,'REPLACE')
 elif o==tail:
  for k in range(4):groups[k]=o.vertex_groups.new(name='tail.'+str(k+1).zfill(2))
  for v in o.data.vertices:
   row=v.index//14;t=min(1,row/48);q=t*3;a=min(2,int(q));f=q-a
   groups[a].add([v.index],1-f,'REPLACE');groups[a+1].add([v.index],f,'REPLACE')
 else:
  g=o.vertex_groups.new(name=bn);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
 mod=o.modifiers.new('Skeletal deformation','ARMATURE');mod.object=rig;o.parent=rig
def character_shape(co):
 x,y,z=co
 if z<=.22:nz=z*1.15
 elif z<=1.90:nz=.253+(z-.22)*.52
 else:nz=1.1266+(z-1.90)*.93
 # Short neck is tucked into a wider chest, not stretched into a stalk.
 width=1.22 if z<1.5 else 1.22-.08*smooth(1.5,1.95,z)
 return Vector((x*width,y*(1.12 if z<1.75 else 1),nz))
def tail_center(t):
 return character_shape(tailpoints[round(t*48)])+Vector((0,-.06*(1-t)**4,.50*t*t))
for o in catparts:
 matrix=o.matrix_basis.copy()
 if o==tail:
  centers=[tail_center(j/48) for j in range(49)]
  previous=None
  for row,center in enumerate(centers):
   t=row/48
   tangent=(centers[min(48,row+1)]-centers[max(0,row-1)]).normalized()
   if previous is None:axis=tangent.cross(Vector((0,0,1))).normalized()
   else:axis=(previous-tangent*previous.dot(tangent)).normalized()
   cross=tangent.cross(axis).normalized();previous=axis
   radius=.078*(1-.50*t*t)
   for k in range(14):o.data.vertices[row*14+k].co=center+radius*(axis*math.cos(math.tau*k/14)+cross*math.sin(math.tau*k/14))
  o.matrix_basis.identity();o.data.update();continue
 if o.name=='Tail rounded tip':
  for v in o.data.vertices:v.co=tail_center(1)+(matrix@v.co-Vector(tailpoints[-1]))
  o.matrix_basis.identity();o.data.update();continue
 if o.data.shape_keys:
  for key in o.data.shape_keys.key_blocks:
   for v in key.data:v.co=character_shape(matrix@v.co)
 else:
  for v in o.data.vertices:v.co=character_shape(matrix@v.co)
 o.matrix_basis.identity()
 o.data.update()
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
for b in rig.data.edit_bones:
 if b.name.startswith('tail.'):
  k=int(b.name.split('.')[1])-1;b.head=tail_center(k/4);b.tail=tail_center((k+1)/4)
 else:b.head=character_shape(b.head);b.tail=character_shape(b.tail)
bpy.ops.object.mode_set(mode='OBJECT')

for b in rig.pose.bones:b.rotation_mode='XYZ'
for frame in [1,37,73,109,145]:
 t=(frame-1)/144*math.tau
 b=rig.pose.bones['body'];b.scale=(1+.006*math.sin(t),1+.007*math.sin(t),1+.006*math.sin(t));b.keyframe_insert('scale',frame=frame)
 b=rig.pose.bones['head'];b.rotation_euler=(.012*math.sin(t),.10*math.sin(t),.022*math.sin(t));b.keyframe_insert('rotation_euler',frame=frame)
 for k in range(4):
  b=rig.pose.bones['tail.'+str(k+1).zfill(2)];b.rotation_euler=(.018*math.sin(t+k*.4),.023*math.sin(t+k*.4),.085*math.sin(t+k*.4));b.keyframe_insert('rotation_euler',frame=frame)
for label in ['L','R']:
 b=rig.pose.bones['ear.'+label]
 for frame,value in [(1,0),(91,0),(96,.08 if label=='L' else -.06),(104,0),(145,0)]:b.rotation_euler.z=value;b.keyframe_insert('rotation_euler',frame=frame)
# Same named NLA track merges armature and eyelid actions into one glTF clip.
animated=[rig]+[o.data.shape_keys for o in lids]
for owner in animated:
 ad=owner.animation_data;act=ad.action;track=ad.nla_tracks.new();track.name='Morfeu_Idle';track.strips.new('Morfeu_Idle',1,act);ad.action=None
scene.frame_set(1)
# Reuse the completed scout, keeping this revision focused on Morfeu.
with bpy.data.libraries.load(str(P.parent/'v02/morfeu-scout-rigged.blend'),link=False) as (src,dst):dst.objects=src.objects
shiproot=next(o for o in dst.objects if o and o.name.startswith('Goiaba_Scout'))
ship=[o for o in dst.objects if o and o.parent==shiproot]
keep={shiproot,*ship}
for o in dst.objects:
 if not o:continue
 if o in keep:bpy.context.collection.objects.link(o);o.hide_set(False);o.hide_render=True
 else:bpy.data.objects.remove(o,do_unlink=True)
shiproot.hide_render=False
# Drop old unused materials/images from library append on save, without touching
# any input source. The provided photograph is not embedded or published.
for db in list(bpy.data.materials):
 if db.users==0:bpy.data.materials.remove(db)
def export(filename,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.hide_set(False);o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(ASSETS/filename),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_def_bones=True)
if not CLAY:export('morfeu-rigged-v04.glb',[rig]+catparts)
rig.scale=(.52,)*3;rig.location=(0,.22,.59)
if not CLAY:export('morfeu-scout-v04.glb',[rig]+catparts+[shiproot]+ship)
rig.scale=(1,)*3;rig.location=(0,0,0)
for o in ship:o.hide_render=True;o.hide_set(True)
# Neutral lighting, saturated ginger midtones and soft contact shadows.
scene.render.engine='CYCLES';scene.cycles.samples=16 if CLAY else 32;scene.cycles.use_denoising=True
scene.render.resolution_x=720 if CLAY else 1000;scene.render.resolution_y=720 if CLAY else 1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.2
world=bpy.data.worlds.new('Morfeu neutral studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.14,.17,.19,1);world.node_tree.nodes['Background'].inputs[1].default_value=.3;scene.world=world
floor=mat('Studio ground','273741',.94);block('Studio ground',(0,0,-.056),(200,200,.1),floor,group='studio',edge=0)
def aim(o,point):o.rotation_euler=(Vector(point)-o.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size,color in [('Key',(-3,-4,6),470,4,(1,.96,.9)),('Fill',(4,-2,4),240,3,(.8,.9,1)),('Rim',(0,4,6),650,3,(1,.96,.88))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color;aim(o,(0,0,1.5))
bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.75;scene.camera=cam
if CLAY:
 clay=mat('Clay silhouette study','A9ADB0',.8)
 eyeclay=mat('Clay dark eyes','292E32',.5)
 for o in catparts:
  o.data.materials.clear();o.data.materials.append(eyeclay if o.name.startswith('Eye surface') else clay)
views=[('portrait',(3.1,-7,2.4)),('front',(0,-8,1.9)),('side',(7,-.7,2.1)),('rear',(4,7,2.4))]
for name,loc in (views[:3:2] if CLAY else views):
 cam.location=loc;aim(cam,(0,0,1.07));scene.render.filepath=str(P/'previews'/f"{'clay' if CLAY else 'morfeu'}-{name}.png");bpy.ops.render.render(write_still=True)
if CLAY:
 bpy.ops.wm.save_as_mainfile(filepath=str(P/'morfeu-clay.blend'))
 raise SystemExit(0)
# Inspect an actual closed-lid frame without changing or squashing the eyeballs.
scene.frame_set(52);cam.location=(0,-8,1.9);aim(cam,(0,0,1.07));scene.render.filepath=str(P/'previews/morfeu-blink.png');bpy.ops.render.render(write_still=True);scene.frame_set(1)
rig.scale=(.52,)*3;rig.location=(0,.22,.59)
for o in ship:o.hide_render=False;o.hide_set(False)
cam.data.ortho_scale=6.75;cam.location=(4.8,-7,5.6);aim(cam,(0,-.18,.7));scene.render.filepath=str(P/'previews/morfeu-scout.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(P/'morfeu-stylized-rigged.blend'))
(P/'stats.json').write_text(json.dumps({'rig_bones':len(bones),'cat_objects':len(catparts),'ship_objects':len(ship),'blink':'upper and lower eyelid morphs, stable eyeballs','body':'continuous remeshed torso and limbs, blended skeletal weights','reference':'user photo and original portfolio sprite'},indent=2))
