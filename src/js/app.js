import {base} from './bf/base.js';

import * as index from './modules/index/index.js';

import {Toggle} from './bf/lib/toggle.js';
//------------------------
const modules=base.get('helpers.html').data('app').split(',');
//------------------------
base.init({
 mConfig:{
  index:index.data
 },
 plugins:[Toggle],
 settings:{}
});
//------------------------
index.init(base,modules);