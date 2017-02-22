(function(factory){
  factory(jQuery,theApp);
}(function($,mgr){
 'use strict';

 mgr.overrideData();

 $(function(){
  mgr.trigger('app:ready',[mgr.get('shared.modules')]);
 });
}));