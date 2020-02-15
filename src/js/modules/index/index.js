export {data} from './index-d.js';

export function init(app,modules){
 if(!~modules.indexOf('index'))
  return;

 app.set({data:'index.toggle',object:'Toggle'});
}