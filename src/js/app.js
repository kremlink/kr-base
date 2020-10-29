import {app} from './bf/base.js';

import * as index from './modules/index-page/view.js';

import {Toggle} from './bf/lib/toggle.js';
//import {utils} from './bf/lib/utils.js';//or add it to app as follows
//------------------------
const modules=app.get('helpers.html').data('app').split(',');
//------------------------
app.init({
 plugins:[Toggle],
 //plugins:[{object:utils,name:'utils'}],
 settings:{}
});
//------------------------
$(()=>{
 if(~modules.indexOf('index'))
  index.init();
});