/*by Alexander Kremlev*/
"use strict";

(function (factory) {
 'use strict';
 
 if(typeof define==='function'&&define.amd)
 {
  define(['jquery','base'],factory);
 }else
 {
  if('theApp' in window)
  {
   if(!theApp.lib)
    throw 'theApp.lib doesn\'t exist!';
    
   if(!theApp.lib['utils'])
    theApp.lib['utils']={};
   $.extend(theApp.lib['utils'],factory(jQuery,theApp));
  }
 }
}(function($,mgr){
 return {
  form:{
   validate:function(opts){
    var flag=true,
        check=opts.form?opts.form.find('input[type=text],input[type=password],textarea,select'):opts.check,
        ignore=opts.ignore?opts.ignore:function(){return false;},
        block=opts.block?opts.block:function(){return false;},
        error=opts.error?opts.error:function(){};

    check.each(function(){
     var obj=$(this),
         reg=obj.data('valid'),
         ph=obj.data('placeholder');
     
     if(obj.is('select'))
     {
      if(obj.find(':selected').is(':disabled')&&reg)
      {
       error(obj);
       flag=false;
      }
     }else
     {
      if(block(obj)||!ignore(obj)
       &&(reg&&!(new RegExp(reg)).test($.trim(this.value))
       ||reg&&ph&&ph==$.trim(this.value)
       ))
      {
       flag=false;
       error(obj);
      }
     }
    });
    
    if(flag&&opts.blockFlag&&opts.blockFlag['file'])
    {
     alert('Файл все еще в процессе загрузки');
     return false;
    }
    
    return flag;
   }
  },
  value:function(opts){
   var s=opts.obj.is('input,textarea,select')?'val':'text';

   if(opts.value==undefined)
    return opts.obj[s]();else
    opts.obj[s](opts.value);
  },
  declOfNum:function(n,arr){
   var cases=[2,0,1,1,1,2];

   return arr[(n%100>4&&n%100<20)?2:cases[(n%10<5)?n%10:5]];
  },
  formatNum:function(n){
   return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1 ');
  },
  toK:function(n){
   return (n>=1000000?(parseFloat((n/1000000).toFixed(0))+'KK'):(parseFloat((n/1000).toFixed(0))+'K'));
  }
 };
}));