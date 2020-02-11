import {app} from '../../bf/base.js';

app.on('app:ready',(e,p)=>{
 if(p!=='index')
  return;

 app.set({data:'index.toggle',object:'Toggle'});
});