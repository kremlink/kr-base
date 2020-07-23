import {app} from './bf/base.js';

import * as index from './modules/index/index.js';

import {Toggle} from './bf/lib/toggle.js';
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
 index.init(app,modules);
});