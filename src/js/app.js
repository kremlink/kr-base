import {app} from './bf/base.js';

import {indexData} from './modules/index/index-d.js';
import {index} from './modules/index/index.js';

import {Toggle} from './bf/lib/toggle.js';
//------------------------
const modules=app.get('helpers.html').data('app').split(',');
//------------------------
app.init({
 mConfig:{
  index:indexData
 },
 plugins:[Toggle],
 settings:{}
});
//------------------------
index(app,modules);