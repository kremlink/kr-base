/*!
 * Basic FW v2.6
 *
 * Copyright 2013-2016, Aleksander Kremlev
 * http://www.joint-group.ru
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
*/
(function(factory,src){
 'use strict';

  var mgr,sm=src.theApp;

  if(typeof define==='function'&&define.amd)
  {
   define(['jquery'],function($){
    mgr=factory($);
    
    if(sm)
    {
     $.extend(true,mgr.settings,sm.settings);
     $.extend(true,mgr.shared,sm.shared);
     $.extend(true,mgr._core,{override:sm.data});
     mgr.data={};
    }
    
    return mgr;
   });
  }else
  {
   mgr=factory($);
   if(sm)
   {
    $.extend(true,mgr.settings,sm.settings);
    $.extend(true,mgr.shared,sm.shared);
    $.extend(true,mgr._core,{override:sm.data});
    mgr.data={};
   }

   src.theApp=mgr;
  }
}(function($){
 var Manager=function(){
  this.settings={
   imgPath:'images/',
    splitBy:'.',
    notify:{
    noData:true,//no data provided
     overrideData:true//override with set and setObject(s)
   }
  };

  this.shared={};//for different user data
  this.objects={};//newly created objects go here
  this.lib={};//modules
  this.data={};//initial data for objects
  this.helpers={
   win:$(window),
    doc:$(document),
    html:$('html')
  };
 };

 $.extend(Manager.prototype,{
  _core:{
   override:{},
   what:function(st){
    var sp=this.settings.splitBy,
     reg='(^objects\\'+sp+')|(^data\\'+sp+')|(^lib\\'+sp+')|(^shared\\'+sp+')|(^utils\\'+sp+')';

    return (st.match(new RegExp(reg))?st:'objects'+sp+st).split(sp);
   },
   getDestination:function(opts){
    var arr=opts.s.split(this.settings.splitBy),
     l=arr.length,
     tmp=this,
     name=arr[l-1];

    if(l>1)
    {
     for(var i=0;i<l-1;i++)
     {
      if(!tmp.hasOwnProperty(arr[i]))
       tmp[arr[i]]={};

      tmp=tmp[arr[i]];
     }
    }

    if(this.settings.notify.overrideData&&tmp[name]&&(!opts.collection||opts.collection&&!tmp[name].length))
     console.log('Overridden: '+opts.s);

    return {tmp:tmp,name:name};
   }
  }
 });

 $.extend(Manager.prototype,{
  overrideData:function(data){
   var d=data?data:this._core.override,
    t;

   for(var x in d)
   {
    if(d.hasOwnProperty(x))
    {
     t=this.get('data'+this.settings.splitBy+x);
     if(!t)
      t=this.set({dest:'data'+this.settings.splitBy+x,object:{}});
     $.extend(true,t,d[x]);
    }
   }
  },
  toggleNotifications:function(obj){
   $.extend(this.settings.notify,obj);
  },
  get:function(st){
   var arr=this._core.what.bind(this)(st),
    l=arr.length,
    tmp=this;

   for(var i=0;i<l;i++)
   {
    if(tmp.hasOwnProperty(arr[i]))
    {
     tmp=tmp[arr[i]];
    }else
    {
     if(arr[0]=='lib')
      throw new Error('[FW] Lib function not found:'+st);else
      return null;
    }
   }

   return tmp;
  },
  unset:function(st,destr){
   var ovr=this.settings.overrideData,
    dest,
    destroy=function(obj){
     if(obj[destr]&&$.type(dest.tmp[obj[destr]])=='function')
      obj[destr]();
    };

   destr=destr||'destroy';
   this.toggleNotifications({overrideData:false});
   dest=this._core.getDestination.bind(this)({s:st});
   this.toggleNotifications({overrideData:ovr});

   if($.type(dest.tmp[dest.name])=='array')
   {
    for(var i=0;i<dest.tmp[dest.name].length;i++)
     destroy(dest.tmp[dest.name][i]);
   }else
   {
    destroy(dest.tmp[dest.name]);
   }

   delete dest.tmp[dest.name];
  },
  set:function(opts){
   var sp=this.settings.splitBy,
    data,
    obj,
    Tmp,
    dest,
    defOpts,
    defArr=[
     {name:'data',value:''},
     {name:'object',value:''},
     {name:'extra',value:null},
     {name:'on',value:{}},
     {name:'call',value:false},
     {name:'set',value:true},
     {name:'lib',value:true},
     {name:'collection',value:false},
     {name:'notify',value:true},
     {name:'constr',value:false},
     {name:'dest',value:''}
    ],
    own;

   defOpts=Object.create(null);
   own=Object.create(null);

   for(var i=0;i<defArr.length;i++)
    defOpts[defArr[i].name]=defArr[i].value;

   for(var x in opts)
   {
    if(opts.hasOwnProperty(x))
     own[x]=opts[x];
   }

   if($.type(own.data)=='string'&&!own.dest)
    own.dest=own.data;

   if(own.constr)
    own.call=true;

   if(own.call||$.type(own.object)!='string')
   {
    own.lib=false;
    if(!('set' in own)&&!own.dest)
     own.set=false;
   }

   if(!own.object)
    throw new Error('[FW] Nothing to set');

   own=$.extend(defOpts,own);

   data=(function(){
    var d;

    if($.type(own.data)=='string')
    {
     d=this.get('data'+sp+own.data);
     return own.call||own.lib?this.utils.jq({mgr:this,obj:$.extend(true,{},d)}):d;
    }else
    {
     return own.data;
    }
   }).bind(this)();

   if(!own.lib)
   {
    if($.type(own.object)=='function'&&own.call)
    {
     var t={
      data:data,
      extra:own.extra,
      name:own.data
     };

     if(own.constr)
      obj=new own.object(t);else
      obj=own.object(t);
    }else
    {
     obj=own.object;
    }
   }else
   {
    Tmp=this.get('lib.'+own.object);
    if(!Tmp)
     throw new Error('[FW] No function found ('+own.object+')');
    if(!own.dest)
     throw new Error('[FW] Destination not set ('+own.object+')');

    if(!own.collection&&!data)
     throw new Error('[FW] No data provided ('+own.object+': '+own.data+')');

    obj=new Tmp();
    obj.init(this.utils.init.call(obj,$.extend(
     true,
     {mgr:this},
     data,
     {on_:own.on},
     {path_:own.dest},
     own.extra
    )));
   }

   if(own.set)
   {
    var ovr=this.settings.overrideData;

    if(!own.notify)
     this.toggleNotifications({overrideData:false});
    dest=this._core.getDestination.bind(this)({
     s:(own.lib?'objects'+sp:'')+own.dest,
     collection:own.collection
    });
    this.toggleNotifications({overrideData:ovr});

    if(!own.collection)
    {
     dest.tmp[dest.name]=obj;
    }else
    {
     if(!dest.tmp[dest.name]||$.type(dest.tmp[dest.name])!='array')
      dest.tmp[dest.name]=[obj];else
      dest.tmp[dest.name].push(obj);
    }
   }

   return obj;
  }
 });

 $.extend(Manager.prototype,{
  Base:function(opts){//abstract; prototype is added below

  }
 });

 $.extend(Manager.prototype,{
  extend:function(Child,Parent){
   var F=function(){};

   Parent=Parent||this.Base;

   F.prototype=Parent.prototype;
   Child.prototype=new F();
   Child.prototype.constructor=Child;
   Child.parent=Parent.prototype;
  }
 });

 $.extend(Manager.prototype,{
  utils:{
   init:function(opts){
    this._inner={
     PATH:opts.path_,
     extra:$.extend(true,{},opts.extra_)
    };

    for(var x in opts.on_)
    {
     if(opts.on_.hasOwnProperty(x))
      this.on(x,opts.on_[x]);
    }

    opts.mgr.utils.jq({mgr:opts.mgr,obj:this._inner.extra,$:true});

    delete opts.path_;
    delete opts.on_;
    delete opts.extra_;

    return opts;
   },
   extendData:function(opts){
    var d={};

    if(opts.field in opts.obj&&!opts.ignore)
     throw new Error('[FW] Data to extend already has field "'+opts.field+'"');

    d[opts.field]=opts.data;
    $.extend(true,opts.obj,d);
   },
   jq:function(opts){
    var utils=opts.mgr.utils,
     obj=opts.obj;

    if($.isPlainObject(obj))
    {
     for(var x in obj)
     {
      if(obj.hasOwnProperty(x)&&utils.type(x)=='jq')
      {
       utils.jqTypes({
        obj:obj,
        val:opts.$?x:utils.jqTest({obj:obj,val:x}),
        $:opts.$});
      }
     }
    }

    if($.type(obj)=='array')
    {
     for(var i=0;i<obj.length;i++)
      utils.jqTypes({
       obj:obj,
       val:i,
       $:opts.$
      });
    }

    return obj;
   },
   jqTest:function(opts){
    var s=opts.val.slice(1);

    opts.obj[s]=opts.obj[opts.val];
    delete opts.obj[opts.val];

    return s;
   },
   jqTypes:function(opts){
    var obj=opts.obj,
     s=opts.val;

    if($.type(obj[s])=='array'||$.isPlainObject(obj[s]))
     opts.mgr.utils.jq({obj:obj[s],$:opts.$});

    if($.type(obj[s])=='string')
     obj[s]=$(obj[s]);
   },
   type:function(obj){
    return /^\$/.test(obj)?'jq':$.type(obj);
   },
   browser:(function(){
    var ua=navigator.userAgent;

    return {
     ancient:!window.addEventListener,
     old:!window.File,
     modern:window.addEventListener&&window.File,
     apple:ua.match(/Version\/[\d\.]+.*Safari/)||ua.match(/(iPad|iPhone|iPod)/g),
     ie:~navigator.userAgent.indexOf("MSIE ")||navigator.userAgent.match(/Trident.*rv\:11\./),
     touch:'ontouchstart' in window||navigator.maxTouchPoints>0||navigator.msMaxTouchPoints>0
    };
   })()
  }
 });

 var Events={
  on:function(s,f){
   $(this).on(s,f);
  },
  off:function(s,f){
   $(this).off(s,f);
  },
  trigger:function(s,p){
   $(this).triggerHandler(s,p);
  }
 };

 if(Events)
 {
  //add pubsub to Manager
  $.extend(Manager.prototype,Events);
  //add events to base object
  $.extend(Manager.prototype.Base.prototype,Events,{
   method:function(s,p){
    if(!this[s])
     throw new Error('[FW] No such method ('+s+') of '+this.getInner('PATH'));
    return this[s](p);
   },
   getInner:function(s){
    return this._inner[s];
   },
   getOpts:function(){
    return this.options;
   },
   getProps:function(){
    return this.props;
   }
  });
 }
 
 return new Manager();
},this));