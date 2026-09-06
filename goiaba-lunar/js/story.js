export const story = Object.freeze({
  start:{chapter:'À margem',title:'Uma carta espera por você.',paragraphs:['A maré recua devagar. Entre duas raízes, um envelope cor de areia balança preso a um fio.','Do outro lado do mangue, o farol acende. No papel, apenas uma frase: “Antes que a noite chegue.”'],choices:[{id:'open',label:'Abrir a carta',to:'opened'},{id:'carry',label:'Levá-la ao farol',to:'carried'}]},
  opened:{chapter:'A mensagem',title:'Nem toda luz vem do farol.',paragraphs:['Dentro do envelope há uma semente e um bilhete: “Minha amiga sempre encontra o caminho pelas árvores. Plante onde a maré não alcança.”','Você reconhece uma clareira mais adiante. Ainda há um pouco de sol entre as folhas.'],choices:[{id:'plant',label:'Plantar a semente na clareira',to:'light'}]},
  carried:{chapter:'Do outro lado',title:'Alguém ainda está esperando.',paragraphs:['A guardiã abre a porta antes da primeira batida. Ao ver o envelope, sorri como quem reconhece uma voz.','“Ela se lembra.” Lá dentro, duas xícaras já esperam na mesa. A guardiã pede que você a acompanhe até a margem.'],choices:[{id:'join',label:'Acompanhar a guardiã',to:'letter'}]},
  light:{chapter:'Final · Uma nova luz',title:'Um caminho começa a nascer.',paragraphs:['Você cobre a semente com terra úmida. Por um instante, uma luz pequena percorre suas raízes — como uma estrela aprendendo a ficar.','Quando a noite chega, alguém na outra margem vê o brilho. E encontra o caminho de casa.'],choices:[]},
  letter:{chapter:'Final · Uma velha amizade',title:'Há histórias que atravessam a maré.',paragraphs:['Na margem, uma mulher de botas enlameadas acena. A guardiã corre para abraçá-la. Há anos elas deixam cartas entre aquelas raízes.','Você volta pelo mesmo caminho. O mangue parece diferente, agora que conhece uma de suas histórias.'],choices:[]}
});
export function createStoryState(){return {node:'start',visited:['start'],opened:false};}
export function chooseStory(state,choiceId){
  const choice=story[state.node]?.choices.find(item=>item.id===choiceId);
  if(!choice) return state;
  return {node:choice.to,visited:[...state.visited,choice.to],opened:state.opened||choice.to==='opened'};
}
export function routeFromHash(hash){const route=hash.replace(/^#/,'');return ['cindra','commissionmatch','mangue'].includes(route)?route:'galaxy';}
