const ambientFiles={galaxy:'galaxy-cabin',cindra:'cindra-hearth',commissionmatch:'commissionmatch-atelier',mangue:'mangue-water-leaves'};
/** Decode the authored files only after consent. Tokens prevent late loads from reviving old audio. */
export class StudioAudio {
  constructor(){this.enabled=false;this.world='galaxy';this.context=null;this.master=null;this.cache=new Map();this.ambient=null;this.sources=new Set();this.generation=0;}
  async initialize(){
    if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('Áudio indisponível neste navegador.');this.context=new Context();this.master=this.context.createGain();this.master.gain.value=.35;this.master.connect(this.context.destination);}
    if(this.context.state==='suspended')await this.context.resume();
  }
  async buffer(name){if(!this.cache.has(name)){const job=fetch(new URL(`../assets/audio/${name}.mp3`,import.meta.url)).then(response=>{if(!response.ok)throw new Error('Falha ao carregar áudio');return response.arrayBuffer();}).then(data=>this.context.decodeAudioData(data));this.cache.set(name,job);job.catch(()=>this.cache.delete(name));}return this.cache.get(name);}
  async setEnabled(enabled){
    this.enabled=enabled;this.generation++;
    if(!enabled){this.stop();return false;}
    try{await this.initialize();if(this.enabled&&!document.hidden){this.master.gain.setValueAtTime(.35,this.context.currentTime);await this.setWorld(this.world);}return this.enabled;}catch{this.enabled=false;this.stop();return false;}
  }
  async setWorld(world){
    this.world=world;const generation=++this.generation;if(!this.enabled||document.hidden)return;
    try{const buffer=await this.buffer(ambientFiles[world]||ambientFiles.galaxy);if(generation!==this.generation||!this.enabled||document.hidden)return;
      const old=this.ambient,now=this.context.currentTime;const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.master);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+.7);source.start();this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};this.ambient={source,gain};
      if(old){old.gain.gain.cancelScheduledValues(now);old.gain.gain.setValueAtTime(old.gain.gain.value,now);old.gain.gain.linearRampToValueAtTime(0,now+.7);try{old.source.stop(now+.72);}catch{}}
    }catch{/* A missing sound never blocks exploration. */}
  }
  async effect(name,{rate=1}={}){if(!this.enabled||document.hidden||!this.context)return;const generation=this.generation;try{const buffer=await this.buffer(name);if(!this.enabled||document.hidden||generation!==this.generation)return;const source=this.context.createBufferSource();source.buffer=buffer;source.playbackRate.value=rate;source.connect(this.master);this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();};source.start();}catch{}}
  stop(){if(this.master)this.master.gain.setValueAtTime(0,this.context.currentTime);for(const source of this.sources){try{source.stop();}catch{}}this.sources.clear();this.ambient=null;}
  async visibility(){this.generation++;if(document.hidden){this.stop();if(this.context?.state==='running')await this.context.suspend();}else if(this.enabled){try{await this.initialize();this.master.gain.setValueAtTime(.35,this.context.currentTime);await this.setWorld(this.world);}catch{}}}
}
