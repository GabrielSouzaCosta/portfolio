"""Semente: an original compact orbital courier, built in Blender coordinates.
The nose points -Y. Shared modeling helpers are supplied by build.py.
"""
ivory=mat('Ship | ceramic ivory','E6DEBF',.39,.28)
edgepaint=mat('Ship | warm panel edges','BFB597',.45,.38)
petrol=mat('Ship | deep petrol frame','193B40',.36,.66)
shadow=mat('Ship | cockpit and recesses','102329',.57,.30)
metal=mat('Ship | titanium mechanics','738383',.3,.83)
copper=mat('Ship | anodized copper','C66B3A',.37,.66)
coral=mat('Ship | coral identification','BB563E',.42,.3)
rubber=mat('Ship | seals and grips','192021',.88,.04)
leather=mat('Ship | pilot saddle','724831',.79,.02)
glass=mat('Ship | petrol windscreen','417C83',.22,.36)
ion=mat('Ship | ion cores','79DFDC',.3,.24,2)
amber=mat('Ship | warm status lamps','FFBA5B',.34,.1,1.5)
paper=mat('Ship | navigation markings','F9EED1',.55,.2)
shiproot=bpy.data.objects.new('Goiaba_Scout',None);bpy.context.collection.objects.link(shiproot)

def sg(name):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=shiproot;return o
rotors={s:sg('EngineRotor_'+label) for s,label in [(-1,'L'),(1,'R')]}
fins={s:sg('VectorFin_'+label) for s,label in [(-1,'L'),(1,'R')]}
def own(o,parent=shiproot):o.parent=parent;return o
def sb(name,loc,scale,m,edge=.025,parent=shiproot):return own(block(name,loc,scale,m,group='ship',edge=edge),parent)
def so(name,loc,scale,m,segments=32):return own(ellipsoid(name,loc,scale,m,group='ship',segments=segments,rings=18))
def st(name,points,radius,m,sides=10,parent=shiproot):return own(tube(name,points,radius,m,group='ship',sides=sides),parent)
def plate(name,outline,z,depth,m,edge=.035,parent=shiproot):
 n=len(outline);vs=[(x,y,z-depth/2) for x,y in outline]+[(x,y,z+depth/2) for x,y in outline]
 fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 o=own(meshobj(name,vs,fs,m,group='ship',smooth=False),parent)
 return bevel(o,edge,3) if edge else o
def ring(name,center,radius,tube_radius,m,axis='Y',parent=shiproot):
 points=[]
 for i in range(65):
  t=math.tau*i/64
  points.append((center[0]+radius*math.cos(t),center[1]+(radius*math.sin(t) if axis=='Z' else 0),center[2]+(radius*math.sin(t) if axis=='Y' else 0)))
 return st(name,points,tube_radius,m,12,parent)
def cylinder(name,center,radius,depth,m,axis='Y',parent=shiproot,vertices=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=center)
 o=bpy.context.object
 if axis=='Y':o.rotation_euler.x=math.pi/2
 finish(o,name,m,group='ship');own(o,parent);return bevel(o,.012,2)
def label(name,text,loc,size,m,rotation=(0,0,0)):
 cu=bpy.data.curves.new(name,'FONT');cu.body=text;cu.size=size;cu.extrude=.0007;cu.align_x='CENTER'
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rotation;cu.materials.append(m)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');ship.append(o);own(o);return o
def loft(name,sections,m):
 # Elliptical cross-sections make a single smooth, rounded forebody.
 vs=[];fs=[];N=48
 for y,rx,rz,cz in sections:
  for i in range(N):
   t=math.tau*i/N;vs.append((rx*math.cos(t),y,cz+rz*math.sin(t)))
 for j in range(len(sections)-1):
  for i in range(N):a=j*N+i;b=j*N+(i+1)%N;fs.append((a,b,b+N,a+N))
 fs += [tuple(reversed(range(N))),tuple(range((len(sections)-1)*N,len(sections)*N))]
 o=own(meshobj(name,vs,fs,m,group='ship'));sub=o.modifiers.new('Flowing hull surface','SUBSURF');sub.levels=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sub.name);return o


def ribbon(name,cx,ya,yb,wa,wb,sample,m):
 vs=[];fs=[];N=32
 for j in range(N+1):
  t=j/N;y=ya+(yb-ya)*t;w=wa+(wb-wa)*t
  for dz in [-.012,.012]:
   for dx in [-w,w]:x=cx+dx;vs.append((x,y,sample(x,y)+dz))
 for j in range(N):
  a=j*4;b=a+4
  fs.extend([(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)])
 fs.extend([(0,1,3,2),(N*4,N*4+2,N*4+3,N*4+1)])
 return own(meshobj(name,vs,fs,m,group='ship'))

# A blunt seed-shaped nose flows into a compact machinery deck.
loft('Seed hull', [(-1.90,.03,.045,.33),(-1.82,.29,.11,.35),(-1.52,.53,.18,.37),(-1.08,.62,.235,.38),(-.55,.68,.23,.40),(.1,.70,.21,.39),(.65,.60,.17,.37),(1.06,.43,.10,.34),(1.12,.06,.05,.34)],petrol)
nose_shell=loft('Ivory forebody', [(-1.85,.045,.025,.405),(-1.72,.28,.07,.45),(-1.38,.48,.105,.52),(-.95,.56,.11,.57),(-.61,.52,.075,.59),(-.49,.38,.04,.58)],ivory)
bpy.context.view_layer.update();nose_tree=BVHTree.FromObject(nose_shell,bpy.context.evaluated_depsgraph_get())
def nose_height(x,y):
 hit,*_=nose_tree.ray_cast(Vector((x,y,2)),Vector((0,0,-1)))
 return (hit.z if hit else .57)+.022
ribbon('Central copper nose inlay',0,-1.73,-.63,.061,.09,nose_height,copper)
for s in [-1,1]:
 st('Forebody panel seam '+str(s),[(s*.11,-1.78,.43),(s*.37,-1.50,.555),(s*.50,-1.07,.636),(s*.49,-.72,.649)],.0085,shadow,8)
 st('Lower bow rim '+str(s),[(s*.09,-1.89,.31),(s*.34,-1.70,.27),(s*.56,-1.15,.24),(s*.65,-.48,.24)],.016,metal)
 for y in [-1.12,-1.00,-.88]:
  slot=sb('Inset cooling slit',(s*.39,y,.66),(.13,.034,.022),shadow,.009);slot.rotation_euler.z=s*.18
  sb('Cooling slit copper lip',(s*.39,y+.016,.671),(.105,.008,.011),copper,.002)
 so('Bow navigation lamp',(s*.31,-1.63,.477),(.044,.077,.022),amber)

# Crescent wings sweep forward around the nose; dark inset channels interrupt
# the broad ceramic skin, while the trailing structure stays mechanically open.
for s,labelname in [(-1,'L'),(1,'R')]:
 outline=[(s*.48,.56),(s*1.00,.86),(s*1.55,.69),(s*1.93,.20),(s*1.96,-.33),(s*1.73,-.95),(s*1.41,-1.36),(s*1.59,-.59),(s*1.47,-.16),(s*1.14,.10),(s*.54,-.03)]
 plate('Crescent load frame '+labelname,outline,.35,.15,petrol,.07)
 skin=[(s*.65,.52),(s*1.04,.69),(s*1.49,.53),(s*1.77,.17),(s*1.80,-.32),(s*1.62,-.80),(s*1.57,-.39),(s*1.36,-.02),(s*1.04,.20),(s*.67,.15)]
 plate('Crescent ceramic shell '+labelname,skin,.47,.092,ivory,.045)
 plate('Wing coral tip '+labelname,[(s*1.82,.10),(s*1.86,-.24),(s*1.68,-.76),(s*1.67,-.41),(s*1.57,-.12)],.47,.04,coral,.022)
 st('Wing leading edge '+labelname,[(s*1.43,-1.29,.39),(s*1.74,-.91,.42),(s*1.92,-.31,.43),(s*1.89,.18,.43)],.023,edgepaint)
 st('Wing service trunk '+labelname,[(s*.63,.38,.54),(s*.97,.47,.56),(s*1.39,.34,.56),(s*1.57,.04,.56)],.025,copper)
 for i in range(4):
  y=.12-i*.105;x=s*(1.47+i*.045)
  vent=sb('Wing heat exchange '+labelname+str(i),(x,y,.54),(.19,.036,.047),shadow,.007);vent.rotation_euler.z=-s*.60
  rail=sb('Heat exchange rib '+labelname+str(i),(x,y+.02,.565),(.17,.010,.013),metal,.003);rail.rotation_euler.z=-s*.60
 for x,y in [(s*.84,.50),(s*1.36,.46),(s*1.70,-.13)]:
  cylinder('Wing flush fastener',(x,y,.539),.025,.012,metal,axis='Z',vertices=12)
  sb('Fastener slot',(x,y,.547),(.025,.005,.006),shadow,.001)
 so('Wingtip position beacon '+labelname,(s*1.83,-.33,.53),(.045,.073,.028),ion if s<0 else amber)

# Twin annular drives: visible intake, recessed fan, thermal casing and exhaust.
for s,labelname in [(-1,'L'),(1,'R')]:
 x=s*.99;y=.44;z=.67
 engine=so('Engine continuous casing '+labelname,(x,y,z),(.40,.73,.36),petrol)
 enginepaint=vertexpaint(engine,'Ship | continuous engine enamel '+labelname,lambda p:blend(rgba('193B40'),rgba('E6DEBF'),smooth(.09,.13,p.z)))
 enginepaint.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.39
 enginepaint.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.38
 ribbon('Engine copper spine '+labelname,x,-.04,.87,.049,.070,lambda xx,yy: z+.36*math.sqrt(max(.02,1-((xx-x)/.40)**2-((yy-y)/.73)**2))+.018,copper)
 cylinder('Engine intake recess '+labelname,(x,-.22,z),.30,.075,shadow)
 ring('Engine intake lip '+labelname,(x,-.275,z),.30,.039,metal)
 ring('Engine intake inner ring '+labelname,(x,-.29,z),.243,.012,copper)
 cylinder('Engine fan hub '+labelname,(x,-.315,z),.072,.055,metal)
 for k in range(9):
  t=math.tau*k/9
  pts=[(x+.085*math.cos(t),-.325,z+.085*math.sin(t)),(x+.22*math.cos(t+.3),-.33,z+.22*math.sin(t+.3))]
  st('Intake stator '+labelname+str(k),pts,.014,petrol,6)
 for j in range(4):ring('Thermal casing band '+labelname+str(j),(x,.64+j*.11,z),.33-j*.008,.022,metal)
 cylinder('Exhaust dark chamber '+labelname,(x,1.01,z),.277,.17,shadow)
 ring('Exhaust copper collar '+labelname,(x,1.055,z),.276,.029,copper)
 ring('Exhaust luminous throat '+labelname,(x,1.09,z),.206,.023,ion)
 cylinder('Exhaust core '+labelname,(x,1.115,z),.087,.026,ion)
 rotors[s].location=(x,1.12,z)
 for k in range(7):
  t=math.tau*k/7
  # Rotor parts use local coordinates, so the runtime rotates around the nozzle.
  blade=st('Rotor vane '+labelname+str(k),[(.105*math.cos(t),0,.105*math.sin(t)),(.228*math.cos(t+.25),0,.228*math.sin(t+.25))],.011,metal,6,rotors[s])
 ring('Rotor keeper '+labelname,(0,0,0),.239,.008,metal,parent=rotors[s])
 # Exposed mounting cradle and flex hose explain how the drive meets the hull.
 st('Engine forward cradle '+labelname,[(s*.45,-.02,.42),(s*.80,-.04,.38),(x,-.01,.54)],.061,petrol)
 st('Engine coolant hose '+labelname,[(s*.49,.52,.59),(s*.60,.69,.82),(s*.72,.78,.86)],.030,rubber)
 for yy in [.67,.73]:ring('Coolant connector '+labelname,(s*.65,yy,.85),.040,.012,copper)
 fins[s].location=(s*1.29,.98,.76)
 plate('Vector paddle '+labelname,[(0,-.12),(s*.24,-.12),(s*.30,.36),(s*.05,.43)],.0,.050,petrol,.021,parent=fins[s])
 plate('Vector paddle inlay '+labelname,[(s*.05,-.07),(s*.18,-.07),(s*.23,.29),(s*.08,.31)],.031,.009,copper,.010,parent=fins[s])

# Cockpit tub and controls sit below the face; the low screen leaves the pilot
# visible at the small atlas scale. The collar, sill, seat and hardware are real.
so('Cockpit tub',(0,.10,.50),(.55,.68,.28),shadow)
so('Pilot saddle',(0,.18,.57),(.34,.36,.11),leather)
seat=sb('Saddle back',(0,.53,.86),(.57,.13,.57),leather,.10);seat.rotation_euler.x=-.16
for s in [-1,1]:
 st('Cockpit ceramic sill '+str(s),[(s*.36,-.46,.70),(s*.51,-.18,.79),(s*.52,.33,.77),(s*.36,.64,.71)],.060,ivory,12)
 st('Cockpit gasket '+str(s),[(s*.35,-.46,.731),(s*.47,-.18,.815),(s*.48,.33,.805),(s*.35,.64,.743)],.014,rubber)
 st('Pilot control '+str(s),[(s*.30,-.30,.71),(s*.26,-.27,.90),(s*.16,-.20,.91)],.024,metal)
 st('Control grip '+str(s),[(s*.25,-.27,.91),(s*.16,-.20,.92)],.034,rubber)
 so('Control lamp '+str(s),(s*.24,-.30,.84),(.017,.017,.022),amber)
windverts=[(-.40,-.48,.72),(.40,-.48,.72),(.34,-.42,1.00),(-.34,-.42,1.00),(-.40,-.455,.72),(.40,-.455,.72),(.34,-.395,1.00),(-.34,-.395,1.00)]
windfaces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
wind=own(meshobj('Curved low windscreen',windverts,windfaces,glass,group='ship'));bevel(wind,.025,3)
st('Windscreen metal bow',[(-.4,-.48,.72),(-.34,-.42,1.0),(0,-.42,1.01),(.34,-.42,1.0),(.4,-.48,.72)],.021,petrol)
st('Rear protective arch',[(-.42,.50,.76),(-.43,.57,1.12),(-.29,.62,1.33),(0,.64,1.38),(.29,.62,1.33),(.43,.57,1.12),(.42,.50,.76)],.025,metal,12)
sb('Recessed console',(0,-.37,.74),(.56,.20,.16),petrol,.025)
for i in range(5):sb('Console illuminated key',((i-2)*.065,-.408,.827),(.034,.024,.009),amber if i<2 else ion,.004)

# Limited asymmetry: one antenna mast and a removable cargo/service cassette.
sb('Service cassette',(-.60,.42,.89),(.24,.39,.26),coral,.035)
for yy in [.31,.51]:sb('Cassette locking strap',(-.60,yy,.92),(.255,.033,.28),petrol,.009)
st('Antenna mast',[(-.54,.64,.89),(-.60,.73,1.35),(-.59,.75,1.71)],.013,metal)
so('Antenna amber tip',(-.59,.75,1.72),(.025,.025,.036),amber)
ring('Starboard maintenance hatch',(.59,.35,.726),.096,.012,copper,axis='Z')
craftname=label('Craft identification','SEMENTE',(0,-1.12,.68),.064,paper)
bpy.context.view_layer.objects.active=craftname;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
for v in craftname.data.vertices:v.co.z=nose_height(v.co.x,v.co.y)+.015
label('Wing registration','01',(1.36,.24,.54),.115,petrol,rotation=(0,0,-.3))
# Raised crescent insignia on the bow, authored geometry rather than a decal.
crest=[]
for i in range(21):
 t=-.8+i/20*4.7;crest.append((-.22+.077*math.cos(t),-1.50+.077*math.sin(t),.595))
st('Goiaba crescent emblem',crest,.010,copper,8)
for i in range(3):so('Goiaba seed '+str(i),(-.19+i*.018,-1.51+i*.025,.601),(.011,.018,.004),paper,16)

# Two landing runners give the underside structure without a flat toy base.
for s in [-1,1]:
 st('Landing strut forward '+str(s),[(s*.40,-.73,.28),(s*.45,-.71,.115)],.025,metal)
 st('Landing strut rear '+str(s),[(s*.39,.56,.29),(s*.45,.59,.115)],.025,metal)
 st('Retracted landing runner '+str(s),[(s*.45,-.94,.15),(s*.45,-.76,.11),(s*.45,.56,.11),(s*.45,.74,.18)],.035,petrol)

# Batch static parts per material and animated parent to keep the browser cheap.
for parent in [shiproot,*rotors.values(),*fins.values()]:
 groups={}
 for o in list(bpy.data.objects):
  if o.parent==parent and o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
 for materialname,objects in groups.items():
  if len(objects)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=parent.name+' | '+materialname
ship=[o for o in bpy.data.objects if o.type=='MESH' and o.parent in [shiproot,*rotors.values(),*fins.values()]]
ship += [*rotors.values(),*fins.values()]
