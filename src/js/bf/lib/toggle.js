/*!by Alexander Kremlev*/

//in delegated mode only a sole popup permitted! (or no popup at all)
//there should be only one active caller in delegated or sole popup mode! there can be exceptions though
export class Toggle{
 constructor(){
  this.options={
   activeClass:'active',
   activeOverlayClass:'active',
   disabledClass:'disabled',
   initEvent:'init',
   showEvent:'show',
   showOnceEvent:'showOnce',
   hideEvent:'hide',
   hideAllEvent:'hideAll',
   keydown:'keydown.toggle',
   click:'click.toggle',
   active:[],
   ignore:'',
   esc:false,
   alone:false,
   aloneFlag:false,//make 1 or callers.length fake pop(s) for all callers when no pops provided; true means 1
   toggle:false,
   hideClick:false,
   activeClick:false
  };

  this.props={
   delegateCallers:null,//init
   pops:null,//init
   overlay:null,//init
   shown:[],
   shownOnce:[],
   oldIndex:-1,
   oldCaller:null,
   activeCaller:null,
   activePop:null,
   doc:$(document),
   win:$(window),
   tabIndex:-1,
   delegateContainer:null,
   callers:null,
   closers:null,//init
   onePop:null,
   delegateNoPop:null//delegate callers + no pop
  };
 }
}
//-----------------
$.extend(Toggle.prototype,{
 init:function(){
  var self=this;

  self.options=$.extend(true,self.options,self.data.options);

  self.props=$.extend(true,self.props,{
   delegateCallers:$.isPlainObject(self.data.callers),
   pops:$(self.data.pops),
   closers:$(self.data.closers),
   overlay:$(self.data.overlay)
  });

  self.prepare();
 },
 prepare:function(){
  var self=this;

  if(self.options.hideClick)
   self.options.hideClick=$(self.options.hideClick);

  self.props.delegateContainer=self.props.delegateCallers?$(self.data.callers.container):null;
  self.props.callers=self.props.delegateCallers?null:$(self.data.callers);
  if(!self.props.pops.length)
  {
   if(self.options.alone&&self.options.aloneFlag)
   {
    self.props.pops=$('<div/>');
   }else
   {
    if(self.props.delegateCallers)
    {
     self.props.delegateNoPop=true;
    }else
    {
     for(var i=0;i<self.props.callers.length;i++)
      self.props.pops=self.props.pops.length?self.props.pops.add($('<div/>')):$('<div/>');
    }
   }
  }

  self.props.onePop=self.props.pops.length===1
   ||!self.props.delegateCallers&&self.props.pops.length>self.props.callers.length;

  self.setCallers();
  self.setClosers();
  self.closingWays();
  self.trigger(self.options.initEvent,[{
   pops:self.props.pops,
   callers:self.props.callers,
   overlay:self.props.overlay,
   activeCaller:self.props.activeCaller,
   activeClass:self.options.activeClass,
   tabIndex:self.props.tabIndex
  }]);
  self.setActive();
 },
 destroy:function(){
  var self=this;

  if(self.options.hideClick)
   self.options.hideClick.off(self.options.click);
  if(self.options.esc)
   self.props.doc.off(self.options.keydown);
  self.props.overlay.off(self.options.click);
  if(self.props.delegateCallers)
   self.props.delegateContainer.off(self.options.click);else
   self.props.callers.off(self.options.click);
  self.props.closers.off(self.options.click);
  self.off();
 },
 getData:function(){
  var self=this;

  return {
   tabIndex:self.props.tabIndex,
   shown:self.props.shown,
   activeCaller:self.props.activeCaller,
   oldCaller:self.props.oldCaller,
   oldIndex:self.props.oldIndex,
   activePop:self.props.activePop,
   callers:self.props.callers,
   pops:self.props.pops,
   activeClass:self.options.activeClass,
   callersSelector:self.props.delegateCallers?self.data.callers.selector:null,
   delegateContainer:self.props.delegateContainer
  }
 },
 closingWays:function(){
  var self=this;

  if(self.options.esc)
  {
   self.props.doc.on(self.options.keydown,function(e){
    if(e.which===27)
     self.hideAll();
   });
  }

  self.props.overlay.on(self.options.click,function(){
   self.hideAll();
  });

  if(self.options.hideClick)
  {
   self.options.hideClick.on(self.options.click,function(e){
    var target=$(e.target);

    if(!target.closest(self.props.delegateCallers?self.data.callers.selector:self.props.callers).length&&!target.closest(self.props.pops).length)
     self.hideAll();
   });
  }
 },
 setCallers:function(){
  var self=this;

  if(self.props.delegateCallers)
  {
   self.props.delegateContainer.on(self.options.click,self.data.callers.selector,function(e){
    var obj=$(this);

    if(!$(e.target).closest(self.options.ignore).length)
    {
     self.show({
      caller:obj,
      settingActive:false,
      activeClick:obj.hasClass(self.options.activeClass),
      blockedClick:obj.hasClass(self.options.disabledClass)
     });

     e.preventDefault();
    }
   });
  }else
  {
   self.props.callers.each(function(i){
    var obj=$(this);

    self.props.shown[i]=0;
    obj.on(self.options.click,function(e){
     if(!$(e.target).closest(self.options.ignore).length)
     {
      self.show({
       index:i,
       caller:obj,
       settingActive:false,
       activeClick:obj.hasClass(self.options.activeClass),
       blockedClick:obj.hasClass(self.options.disabledClass)
      });

      e.preventDefault();
     }
    });
   });
  }
 },
 setClosers:function(){
  var self=this;

  self.props.closers.each(function(i){
   $(this).on(self.options.click,function(e){
    self.hide({index:i});

    e.preventDefault();
   });
  });
 },
 show:function(opts){
  var self=this,
   i=self.props.onePop?0:opts.index;

  if(i<0||i>self.props.pops.length-1&&!self.props.delegateCallers||opts.blockedClick||!self.options.toggle&&!self.options.activeClick&&opts.activeClick)
   return;

  if(!opts.settingActive&&self.options.toggle&&opts.activeClick)
  {
   self.props.tabIndex=-1;
   if(self.props.delegateNoPop)
    self.props.activeCaller=opts.caller;
   if(self.props.delegateCallers)
    self.hide({caller:opts.caller});else
    self.hide({index:i});
   return;
  }
  if(!opts.settingActive&&~self.props.tabIndex&&!self.props.onePop&&self.options.alone)
   self.hide({index:self.props.tabIndex});
  if(self.props.onePop&&self.props.activePop)
  {
   self.props.activePop.removeClass(self.options.activeClass);
   self.props.activeCaller.removeClass(self.options.activeClass);
  }

  self.props.shown[i]=1;

  self.props.tabIndex=!self.props.delegateCallers?(!self.props.onePop?i:opts.index):-1;

  self.props.pops.eq(i).addClass(self.options.activeClass);
  if(self.options.alone||self.props.onePop)
   self.props.activePop=self.props.pops.eq(i);

  if(self.props.delegateCallers)//delegated
  {
   self.props.activeCaller=opts.caller;
   self.props.activeCaller.addClass(self.options.activeClass);
  }else
  {
   if(self.props.onePop)
   {
    self.props.activeCaller=self.props.callers.eq(opts.index);
    self.props.activeCaller.addClass(self.options.activeClass);
   }else
   {
    if(self.options.alone)
     self.props.activeCaller=self.props.callers.eq(i);
    self.props.callers.eq(i).addClass(self.options.activeClass);
   }
  }

  setTimeout(function(){
   self.props.overlay.show().addClass(self.options.activeOverlayClass);
  },0);//firefox transition fix

  self.trigger(self.options.showEvent,[{
   pop:self.props.pops.eq(i),
   caller:self.props.activeCaller,
   oldCaller:self.props.oldCaller,
   popIndex:i,
   callerIndex:opts.index,
   oldIndex:self.props.oldIndex,
   shown:self.props.shown,
   shownOnce:self.props.shownOnce,
   settingActive:opts.settingActive,
   activeClick:opts.activeClick,
   activeClass:self.options.activeClass,
   callers:self.props.callers,
   callersSelector:self.props.delegateCallers?self.data.callers.selector:null,
   delegateContainer:self.props.delegateContainer,
   overlay:self.props.overlay,
   data:opts.data
  }]);

  self.props.shownOnce[i]=true;

  self.props.oldIndex=opts.index;
  self.props.oldCaller=self.props.activeCaller;
 },
 hide:function(opts){
  var self=this,
   callerIndex=self.props.tabIndex,
   caller=opts?(self.props.delegateCallers?opts.caller:self.props.callers.eq(opts.index)):null;

  var i=self.props.onePop?0:opts.index;

  if(!self.props.delegateNoPop&&(!self.props.shown[i]||i<0||i>self.props.pops.length-1))
   return;

  self.props.shown[i]=0;

  self.props.pops.eq(i).removeClass(self.options.activeClass);

  if(self.props.onePop||self.props.delegateNoPop)
  {
   (opts.caller?opts.caller:self.props.activeCaller).removeClass(self.options.activeClass);
   self.props.activePop=null;
   self.props.activeCaller=null;
  }else
  {
   if(self.options.alone)
    self.props.activeCaller=null;
   self.props.callers.eq(i).removeClass(self.options.activeClass);
   self.props.tabIndex=-1;
  }

  self.props.overlay.removeClass(self.options.activeOverlayClass);

  self.trigger(self.options.hideEvent,[{
   pop:self.props.pops.eq(i),
   caller:caller,
   callerIndex:callerIndex,
   shown:self.props.shown,
   popIndex:i,
   overlay:self.props.overlay,
   activeClass:self.options.activeClass,
   callers:self.props.callers,
   callersSelector:self.props.delegateCallers?self.data.callers.selector:null,
   delegateContainer:self.props.delegateContainer,
   data:opts.data
  }]);
 },
 hideAll:function(opts){
  var self=this;

  self.trigger(self.options.hideAllEvent,[{
   shown:self.props.shown,
   activeClass:self.options.activeClass,
   callers:self.props.callers,
   data:opts
  }]);

  self.props.pops.each(function(i){
   if(self.props.shown[i])
    self.hide({index:i,data:{hideAll:true}});
  });
 },
 block:function(opts){
  var self=this;

  if(self.props.delegateCallers)
   opts.caller.addClass(self.options.disabledClass);else
   self.props.callers.eq(opts.index).addClass(self.options.disabledClass);
 },
 unblock:function(opts){
  var self=this;

  if(self.props.delegateCallers)
   opts.caller.removeClass(self.options.disabledClass);else
   self.props.callers.eq(opts.index).removeClass(self.options.disabledClass);
 },
 setActive:function(){
  var self=this,
   callers=self.props.delegateCallers?
    self.props.delegateContainer.find(self.data.callers.selector):
    self.props.callers;

  if(!self.options.active.length)
  {
   callers.each(function(i){
    var obj=$(this);

    if(obj.hasClass(self.options.activeClass))
     self.show({index:i,caller:obj,settingActive:true});
   });
  }else
  {
   if(!self.props.delegateCallers)
   {
    for(var i=0;i<self.options.active.length;i++)
     self.show({index:i,caller:callers.eq(self.options.active[i])});
   }
  }
 }
});
