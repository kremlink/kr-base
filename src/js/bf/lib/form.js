/*!by Alexander Kremlev*/

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
   theApp.set({data:'lib.Form',object:factory(jQuery,theApp),lib:false});
  }
 }
}(function($,mgr){
 mgr.extend(Form);

 function Form(){
  "use strict";

  this.options={
   inputs:':input',
   sendingClass:'sending',
   shownClass:'shown',
   hiddenClass:'hidden',
   initEvent:'init',
   sendingEvent:'sending',
   sentEvent:'sent',
   failEvent:'fail',
   ajax:true,
   url:null,//if undef -> opts.form has to be <form action="url">
   type:'GET',
   captcha:{
    url:null,
    sendingClass:'captcha-sending',
    sentEvent:'captcha-sent'
   },
   captchaUrl:null,
   funcs:{
    validate:function(){return true;},
    error:function(type){
     switch(type){
      case 'sending':alert('В процессе отправки...');break;
      case 'captcha':alert('Неверная каптча!');break;
     }
    },
    addData:function(){
     return [];
    }
   }
  };

  this.props={
   form:null,//init
   loader:null,
   sender:null,//init
   shown:null,//init
   sent:null,//init
   sending:false,
   captcha:{
    input:null,//init
    img:null,//init
    ajax:null,
    correct:false
   },
   blockFlag:{},
   ajax:null,
   caller:null,
   hasFile:false
  };
 }
 //-----------------
 $.extend(Form.prototype,{
  init:function(opts){
   var self=this;

   self.options=$.extend(true,self.options,opts);

   self.props=$.extend(true,self.props,{
    form:$(opts.form),
    sender:$(opts.sender),
    shown:$(opts.shown),
    sent:$(opts.sent),
    captcha:{
     input:opts.captchaUrl?$(opts.captcha.input):null,
     img:opts.captchaUrl?$(opts.captcha.img):null
    }
   });

   self.prepare();
  },
  prepare:function(){
   var self=this;

   if(!self.options.url)
    self.options.url=self.props.form.attr('action');

   if(!self.options.loader)
    self.props.loader=self.props.form;

   self.trigger(self.options.initEvent,[{
    form:self.props.form,
    sender:self.props.sender,
    inputs:self.options.inputs
   }]);

   if(!self.options.ajax)
   {
    self.whenForm();
   }else
   {
    if(self.props.form.is('form'))
    {
     self.whenForm();
    }else
    {
     self.props.sender.on('click',function(e){
      self.props.caller=$(this);
      self.send({validate:true});

      e.preventDefault();
     });
    }
   }
  },
  whenForm:function(){
   var self=this;

   self.props.form.on('submit',function(){
    return self.send({validate:true});
   });

   self.props.sender.on('click',function(e){
    self.props.caller=$(this);
    self.props.form.submit();

    e.preventDefault();
   });
  },
  show:function(){
   var self=this;

   self.props.shown.removeClass(self.options.hiddenClass);
   self.props.sent.removeClass(self.options.shownClass);
  },
  blockSending:function(value){
   var self=this;

   self.props.blockFlag[value]=true;
  },
  unblockSending:function(value){
   var self=this;

   delete self.props.blockFlag[value];
  },
  prepareData:function(){
   var self=this,
    inps=self.props.form.find(self.options.inputs),
    add=self.options.funcs.addData.apply(self),
    fd,
    i;

   if(inps.filter(':file').length)
   {
    self.props.hasFile=true;
    self.options.type='POST';
    fd=new FormData();
    inps.each(function(){
     var obj=$(this);

     fd.append(obj.attr('name'),obj.is(':file')?obj[0].files[0]:obj.val());
    });

    for(i=0;i<add.length;i++)
     fd.append(add[i].name,add[i].value);
   }else
   {
    fd=self.props.form.find(self.options.inputs).serializeArray();
    for(i=0;i<add.length;i++)
     fd.push(add[i]);
   }

   return fd;
  },
  send:function(opts){
   var self=this,
       f=false;

   if(self.props.sending)
   {
    self.options.funcs.error('sending');

    return false;
   }

   if((opts.validate&&self.options.funcs.validate.apply(self,[{
    form:self.props.form,
    sender:self.props.sender,
    blockFlag:self.props.blockFlag
   }])||!opts.validate)&&$.isEmptyObject(self.props.blockFlag))
   {
    if(opts.caller)
     self.props.caller=opts.caller;
    if(self.options.captcha.url&&!self.props.captcha.correct)
    {
     self.props.sending=true;
     self.captchaAjax();
    }else
    {
     if(!self.options.ajax)
     {
      self.trigger(self.options.sendingEvent,[{form:self.props.form}]);
      f=true;
     }else
     {
      self.props.sending=true;
      self.trigger(self.options.sendingEvent,[{form:self.props.form}]);
      self.formAjax();
     }
    }
   }

   return f;
  },
  captchaAjax:function(){
   var self=this;

   self.props.loader.addClass(self.options.captcha.sendingClass);
   self.props.captcha.ajax=$.ajax({
    url:self.options.captcha.url,
    data:self.props.captcha.input.serialize(),
    dataType:'json',
    success:function(r){
     self.props.sending=false;
     self.props.loader.addClass(self.options.captcha.sendingClass);
     if(r.correct)
     {
      self.props.captcha.correct=true;
      self.trigger(self.options.captcha.sentEvent);
      self.send({validate:true});
     }else
     {
      self.props.captcha.img.attr('src',r.src);
      self.options.funcs.error('captcha');
     }
    },
    error:function(){
     self.props.sending=false;
     self.props.loader.addClass(self.options.captcha.sendingClass);
     self.trigger(self.options.failEvent,[{
      captcha:true
     }]);
    }
   });
  },
  formAjax:function(){
   var self=this,
    inps,
    d={};

   if(self.props.hasFile)
   {
    d.dataType='json';
    d.contentType=false;
    d.processData=false;
   }

   self.props.loader.addClass(self.options.sendingClass);
   inps=self.prepareData();
   self.props.ajax=$.ajax($.extend({
    url:self.options.url,
    type:self.options.type,
    data:inps,
    success:function(r){
     self.props.shown.addClass(self.options.hiddenClass);
     self.props.sent.addClass(self.options.shownClass);
     self.trigger(self.options.sentEvent,[{
      req:r,
      sender:self.props.sender,
      sent:self.props.sent,
      inputs:inps,
      form:self.props.form
     }]);
     self.props.sending=false;
     self.props.loader.removeClass(self.options.sendingClass);
    },
    error:function(){
     self.props.sending=false;
     self.props.loader.removeClass(self.options.sendingClass);
     self.trigger(self.options.failEvent,[{
      captcha:true
     }]);
    },
    xhr:function(){
     var myXhr=$.ajaxSettings.xhr();

     myXhr.upload.addEventListener('progress',function(e){
      self.progress(e);
     },false);

     return myXhr;
    }
   },d));
  },
  progress:function(e){
   var self=this;

   self.trigger('progress',[{
    persentage:parseInt(e.loaded/e.total*100,10)+'%'
   }]);
  }
 });
  
 return Form;
}));