(function (factory) {
 'use strict';

 factory(jQuery,theApp);
}(function($,mgr){
 mgr.utils.extendData({
  obj:mgr.data,
  field:'all',
  data:{
   smth:3
  }
 });
 
 return mgr.data;
}));