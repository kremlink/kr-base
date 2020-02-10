import {app} from '../../bf/base.js';

 app.extendData({
  obj:app.get('data'),
  field:'index',
  data:{
   toggle:{
    callers:document,
    options:{
     toggle:true
    }
   }
  }
 });