(function (factory) {
 'use strict';

 factory(jQuery,theApp);
}(function($,mgr){
 mgr.set({dest:'iniBBClasses',object:{}});

 mgr.getBBClass=function(s){
  var obj=this.get(s);

  if(!obj)
   throw new Error('No BB Class Found: '+s);

  if(!this.iniBBClasses[s])
  {
   mgr.unset('objects.'+s);
   obj=this.set({dest:'objects.'+s,object:obj()});
   this.iniBBClasses[s]=true;
  }

  return obj;
 };
}));