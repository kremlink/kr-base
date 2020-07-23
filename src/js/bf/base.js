/*!
 * Basic FW v3.0
 *
 * Copyright 2013-2020, Aleksander Kremlev
 * http://www.joint-group.ru
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
*/
import {config} from '../config.js';

class Base{
 constructor(){
  this._splitBy='.';

  this.settings={
   imgPath:'images/'
  };

  this.setSettings={
   data:'',
   object:'',
   add:null,
   on:{},
   call:false,
   set:true,
   lib:true,
   collection:false,
   notify:true,
   constr:false,
   dest:'',
   off:false
  };

  this.objects={};
  this.lib={};
  this.data={};
  this.helpers={
   win:$(window),
   doc:$(document),
   html:$('html')
  };
  this._notifyOverride=true;
 }

 _what(st){
  let sp=this._splitBy,
   reg='(^objects\\'+sp+')|(^helpers\\'+sp+')|(^data$)|(^data\\'+sp+')|(^lib\\'+sp+')|(^utils\\'+sp+')';

  return (st.match(new RegExp(reg))?st:'objects'+sp+st).split(sp);
 }

 _getDestination(opts){
  let arr=opts.s.split(this._splitBy),
   l=arr.length,
   tmp=this,
   name=arr[l-1];

  if(l>1)
  {
   for(let i=0;i<l-1;i++)
   {
    if(!tmp.hasOwnProperty(arr[i]))
     tmp[arr[i]]={};

    tmp=tmp[arr[i]];
   }
  }

  if(this._notifyOverride&&tmp[name]&&(!opts.collection||opts.collection&&!tmp[name].length))
   console.log('Overridden: '+opts.s);

  return {tmp:tmp,name:name};
 }

 _objInit({obj,data}){
  obj.data=data;

  for(let [x,y] of Object.entries(data.on_))
   obj.on(x,y);

  this._jq(obj.data.extra);
  delete data.on_;
 }

 _jqType(obj)
 {
  return /^\$/.test(obj)?'jq':$.type(obj);
 }

 _jq(obj){
  if(Array.isArray(obj))
  {
   for(let i=0;i<obj.length;i++)
    this._jqTypes(obj[i]);
  }else
  {
   if($.isPlainObject(obj))
   {
    for(let x of Object.keys(obj))
    {
     if(this._jqType(x)==='jq')
     {
      if($.type(obj[x])==='string')
       obj[x]=$(obj[x]);
      this._jqTypes(obj[x]);
     }
    }
   }
  }

  return obj;
 }

 _jqTypes(obj){
  if(Array.isArray(obj)||$.isPlainObject(obj))
   this._jq(obj);
 }

 overrideData(data={}){
  let t;

  for(let [x,y] of Object.entries(data))
  {
   t=this.get('data'+this._splitBy+x);
   if(!t)
    t=this.set({dest:'data'+this._splitBy+x,object:{}});
   $.extend(true,t,y);
  }
 }

 init({plugins,settings={}}){
  Object.assign(this.settings,settings);

  plugins.forEach((name)=>{
   if(typeof(name)==='function')
   {
    this.set({dest:'lib.'+name.name,object:name});
    Object.assign(name.prototype,events,{
     get(s='',p={}){
      if(!this[s])
       throw new Error('[FW] No such field or method "'+s+'" in '+this.data.path_);
      return typeof this[s]==='function'?this[s](p):this[s];
     }
    });
   }else
   {
    this.set({dest:'lib.'+name.name,object:name.object});
   }
  });
 }

 configure(data){
  for(let [x,y] of Object.entries(data))
  {
   this.extendData({
    obj:this.get('data'),
    field:x,
    data:y,
    ignore:true
   });
  }

  this.overrideData(config);

  return this.get('data');
 }

 extendData({field,obj,data,ignore=false}){
  if(field in obj&&!ignore)
   throw new Error('[FW] Data to extend already has field "'+field+'"');

  $.extend(true,obj,{[field]:data});
 }

 toggleNotifications(f=true){
  this._notifyOverride=f;
 }

 get(st=''){
  let arr=this._what(st),
   l=arr.length,
   tmp=this;

  for(let i=0;i<l;i++)
  {
   if(tmp.hasOwnProperty(arr[i]))
   {
    tmp=tmp[arr[i]];
   }else
   {
    if(arr[0]==='lib')
     throw new Error('[FW] Lib function not found:'+st);else
     return null;
   }
  }

  return tmp;
 }

 unset(st='',destr=''){
  let ovr=this._notifyOverride,
   dest,
   destroy=function(obj){
    if(obj[destr]&&typeof dest.tmp[obj[destr]]==='function')
     obj[destr]();
   };

  destr=destr||'destroy';
  this.toggleNotifications(false);
  dest=this._getDestination({s:st});
  this.toggleNotifications(ovr);

  if($.type(dest.tmp[dest.name])==='array')
  {
   for(let i=0;i<dest.tmp[dest.name].length;i++)
    destroy(dest.tmp[dest.name][i]);
  }else
  {
   destroy(dest.tmp[dest.name]);
  }

  delete dest.tmp[dest.name];
 }

 set(opts){//opts:setSettings
  let sp=this._splitBy,
   data,
   obj,
   Tmp,
   dest,
   own={};

  for(let x of Object.keys(opts))
   own[x]=opts[x];

  if(typeof own.data==='string'&&!own.dest)
   own.dest=own.data;

  if(own.constr)
   own.call=true;

  if(own.call||typeof own.object!=='string')
  {
   own.lib=false;
   if(own.call||!('set' in own)&&!own.dest)
    own.set=false;
  }

  if(own.object===undefined)
   throw new Error('[FW] Nothing to set');

  own=Object.assign({},this.setSettings,own);

  data=(()=>{
   let d;

   if($.type(own.data)==='string')
   {
    d=this.get('data'+sp+own.data);
    return own.call||own.lib?this._jq($.extend(true,{},d)):d;
   }else
   {
    return own.data;
   }
  })();

  if(data&&data.off)//don't set
   return;

  if(!own.lib)
  {
   if(typeof own.object==='function'&&own.call)
   {
    let t={
     data:data,
     name:own.data
    };

    if(own.add)
     t.extra=own.add;

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
   if(!own.dest&&own.set)
    throw new Error('[FW] Destination not set ('+own.object+')');

   if(!own.collection&&!data)
    throw new Error('[FW] No data provided ('+own.object+': '+own.data+')');

   obj=new Tmp();
   this._objInit({obj:obj,data:$.extend(true,data,
     {on_:own.on,set_:own.data,path_:own.dest},
     own.add)});
   obj.init();
  }

  if(own.set)
  {
   let ovr=this._notifyOverride;

   if(!own.notify)
    this.toggleNotifications(false);
   dest=this._getDestination({
    s:(own.lib?'objects'+sp:'')+own.dest,
    collection:own.collection
   });
   this.toggleNotifications(ovr);

   if(!own.collection)
   {
    dest.tmp[dest.name]=obj;
   }else
   {
    if(!dest.tmp[dest.name]||$.type(dest.tmp[dest.name])!=='array')
     dest.tmp[dest.name]=[obj];else
     dest.tmp[dest.name].push(obj);
   }
  }

  return obj;
 }
}

let events={
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

Object.assign(Base.prototype,events);

export const app=new Base();