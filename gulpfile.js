var gulp=require('gulp'),
 cleanCSS=require('gulp-clean-css'),
 uglify=require('gulp-uglify'),
 rename=require('gulp-rename'),
 concat=require('gulp-concat'),
 spritesmith=require('gulp.spritesmith'),
 fs=require('fs'),
 path=require('path'),
 glob=require('glob'),
 flatmap=require('gulp-flatmap'),
 fileinclude=require('gulp-file-include'),
 del=require('del'),
 buffer=require('vinyl-buffer'),
 open=require('open'),
 zip=require('gulp-zip'),
 dl=require('gulp-download'),
 unzip=require('gulp-unzip'),
 svgmin=require('gulp-svgmin'),
 cheerio=require('gulp-cheerio'),
 svgstore=require('gulp-svgstore');
 
 flag='src',//flag='src' or flag='dest'
 options={
  url:'https://github.com/kremlink/kr-base/archive/master.zip',
  src:{
   html:{
    src:'src/_dev/html/*.html',
    scripts:'src/_dev/html/components/src.html'
   },
   js:{
    src:'src/js/**/*.js',
    baseStr:'src\\\\',
    min:[
     'src/js/lib/underscore.js',
     'src/js/lib/!(_*|underscore|jquery).js',
     'src/js/lib/*/[^_]*.js',
     'src/js/bf/base.js',
     'src/js/bf/base-bb.js',
     'src/js/bf/lib/[^_]*.js',
     'src/js/aggregator.js',
     'src/js/modules/**/[^_]*-d.js',
     'src/js/modules/**/[^_]*-m.js',
     'src/js/modules/**/[^_]*-c.js',
     'src/js/modules/**/[^_]*-v.js',
     'src/js/modules/**/[^_]*-r.js',
     'src/js/modules/**/[^_]*-cmp.js',
     'src/js/modules/**/!(_*|*-d|*-m|*-c|*-v|*-r|*-cmp).js',
     'src/js/app-data.js',
     'src/js/router.js',
     'src/js/app.js'
    ]
   },
   css:{
    src:'src/css/*',
    min:'src/css/style.css',
    data:'src/_dev/scss/**/*.*',
    base:'src/_dev/scss/',
    baseStr:'src\\_dev\\scss\\',
     include:{
     all:'src/_dev/scss/!(core|base)/',
     components:'src/_dev/scss/components/',
     partials:'src/_dev/scss/partials/',
     sprites:'src/_dev/scss/sprites/'
    },
    allName:'_all.scss'
   },
   imgs:{
    src:'src/images/**/*.*',
	spriteBits:'src/_dev/sprites/',
    base:'src/images/',
    spriteProc:'src/_dev/scss/sprites',
	svgSpriteBits:'src/_dev/svgSprites/',
	svgBase:'src/_dev/html/components/'
   },
   fonts:'src/fonts/**/*.*'
  },
  dest:{
   html:flag+'/',
   js:{
    src:flag+'/js/',
    min:'built.min.js'
   },
   css:flag+'/css/',
   img:'dest/images/',
   fonts:'dest/fonts/'
  },
  watch:{
   html:'src/_dev/html/**/*.*',
   js:'src/js/**/*.js',
   css:'src/css/*.css',
   img:'src/images/**/*.*',
   fonts:'src/fonts/**/*.*'
  },
  clean:'dest',
  paths:{//TODO:add more
   base:'G:/Sashino/PapkaSasha/z-o-t/template/html5-template/new-lib',
   open:{
    slider:'/NEW/slider-carousel/all-main.js'
   },
   lib:{
    slider:'/NEW/slider-carousel/slider.js',
    carousel:'/NEW/slider-carousel/carousel.js',
    img:'/utils/imagesloaded.js'
   },
   dest:'src/js'
  },
  zip:{
   src:['src/*'],
   srcOnly:['src/!(.idea|_dev)'],
   dest:'./'
  }
 };

function getArg(key){
 var index=process.argv.indexOf(key),
     next=process.argv[index+1];

 return (index<0)?null:(!next||next[0]==="-")?true:next;
}

function sassAll(e){
 var name=options.src.css.allName,
     a=(typeof e==='string'?e:null)||getArg('--p');
 
 if(!(a in options.src.css.include))
  a='all';
 
 glob(options.src.css.include[a]+name,function(error,files){
  files.forEach(function(allFile){
   var directory,
       partials;

   //fs.writeFileSync(allFile,'/** Import autocollected by gulp **/\n\n');
   fs.writeFileSync(allFile,'');

   directory=path.dirname(allFile);
   partials=fs.readdirSync(directory).filter(function(file){
    return (
     file!==name&&
      path.basename(file).substring(0,1)==='_'&&
      path.extname(file)==='.scss'
     );
   });

   partials.forEach(function(partial){
	var s=fs.readFileSync(directory+'/'+partial,'utf8');
	
	if(!~s.indexOf('@ignore'))
     fs.appendFileSync(allFile,'@import \''+path.basename(partial,path.extname(partial)).substring(1)+'\';\n');
   });
  });
 });
}

function data(){
 return gulp.src(options.src.css.data)
  .pipe(flatmap(function(stream,file){
   var p=file.path,
       sb=p.substring(p.indexOf(options.src.css.baseStr)+options.src.css.baseStr.length),
	   s=String(file.contents);
    
	if((!~s.indexOf('@ignore')))
	{
	 file.contents=new Buffer(s.replace(/@include exports\S+/,'@include exports("@path:'+sb+'"){/*@path:'+sb+'*/')
     .replace(/\/\*@path\S*\//,'/*@path:'+sb+'*/'));
	}
    
   return stream;
  }))
  .pipe(gulp.dest(options.src.css.base));
}

function unignore(all){
 var stream=gulp.src(options.src.css.data)
  .pipe(flatmap(function(stream,file){
   var s=String(file.contents);
    
   file.contents=new Buffer(s.replace(/@ignore/,''));
    
   return stream;
  }))
  .pipe(gulp.dest(options.src.css.base));
  
  stream.on('end',function(){
   all();
  });
  
  return stream;
}

function jsAdd(){//e.type=changed|added|deleted
 var scripts='';
 
 options.src.js.min.forEach(function(f){
   glob.sync(f).forEach(function(f1){
    scripts+='<script src="'+f1.substring(f1.indexOf(options.src.js.baseStr)+options.src.js.baseStr.length)+'"></script>\n';
   });
  });
  
  fs.writeFileSync(options.src.html.scripts,scripts);
}

gulp.task('watch',function(){
  gulp.watch(options.watch.html,['html']);
  
  if(flag==='dest')
  {
   gulp.watch(options.watch.css,['css']);
   gulp.watch(options.watch.js,['js']);
   gulp.watch(options.watch.img,['img']);
   gulp.watch(options.watch.fonts,['fonts']);
  }
});

gulp.task('dest',['html','css','img','js','fonts']);

gulp.task('clean',function(cb){
 del(options.clean,cb);
});

gulp.task('js-add',jsAdd);

gulp.task('s-data',data);
gulp.task('s-all',sassAll);
gulp.task('s-add',function(){
 sassAll();
 data();
});
gulp.task('s-all',sassAll);
gulp.task('s-unign',function(){
 return unignore(sassAll);
});

gulp.task('fonts',function(){
 if(flag==='dest')
 {
  return gulp.src(options.src.fonts)
   .pipe(gulp.dest(options.dest.fonts));
 }
});

gulp.task('html',function(){
 return gulp.src(options.src.html.src)
  .pipe(fileinclude())
  .pipe(gulp.dest(options.dest.html));
});

gulp.task('css',function(){
 if(flag==='dest')
 {
  return gulp.src(options.src.css.src)
   .pipe(gulp.dest(options.dest.css));
 }
});

gulp.task('css-min',function(){
 return gulp.src(options.src.css.min)
  .pipe(rename({suffix:'.min'}))
  .pipe(cleanCSS())
  .pipe(gulp.dest(options.dest.css));
});

gulp.task('js',function(){
 if(flag==='dest')
 {
  return gulp.src(options.src.js.src)
   .pipe(gulp.dest(options.dest.js.src));
 }
});

gulp.task('js-min',function(){
 return gulp.src(options.src.js.min)
  .pipe(concat(options.dest.js.min))
  .pipe(uglify({preserveComments:'some'/*,output : {beautify : true}*/}))
  .pipe(gulp.dest(options.dest.js.src));
});

gulp.task('open',function(){
 var a=getArg('--p');
 
 if(a)
  open(options.paths.base+options.paths.open[a],"notepad++");else
  console.log('Nothing to open');
});

gulp.task('lib',function(){
 var a=getArg('--p'),
  p;
 
 if(a)
 {
  p=options.paths.lib[a];
  return gulp.src(options.paths.base+p)
   .pipe(gulp.dest(options.paths.dest+(~p.indexOf('/utils')?'/lib':'/bf/lib')))
   .on('end',function(e){
    jsAdd();
   });
 }else
 {
  console.log('No file to get specified');
 }
});

gulp.task('zip',function(){
 var a=getArg('--p')||'',
  today=new Date(),dd=today.getDate(),mm=today.getMonth()+1,yyyy=today.getFullYear();
 
 return gulp.src(options.zip[a?'srcOnly':'src'],{dot:true})
  .pipe(zip(((dd<10?'0'+dd:dd)+'.'+(mm<10?'0'+mm:mm)+'.'+yyyy)+'.zip'))
  .pipe(gulp.dest(options.zip.dest));
});

gulp.task('ini',function(){
 var folder='kr-base-master',
 stream=dl(options.url)
  .pipe(unzip())
  .pipe(gulp.dest('./'));
 
 stream.on('end',function(e){
  var stream=gulp.src(folder+'/**/*',{dot:true})
   .pipe(gulp.dest('./'));
   
   stream.on('end',function(e){
    del(folder);
    del('.gitignore');
	del('gulpfile-ini.js');
   });
 });
});

gulp.task('img',function(){
 if(flag==='dest')
 {
  return gulp.src(options.src.imgs.src)
   .pipe(gulp.dest(options.dest.img));
 }
});

gulp.task('ssprite',function(){
 var a=getArg('--p')||'shared';
 
 return gulp.src(options.src.imgs.svgSpriteBits+a+'-sprite/*.svg')
 .pipe(svgmin(function(file){
  var prefix=path.basename(file.relative,path.extname(file.relative));
  
  return {
   js2svg:{
    pretty:true
   },
   plugins:[{
    cleanupIDs:{
     prefix:prefix+'-',
     minify:true
    }
   }]
  }
  }))
 .pipe(cheerio({
  run:function($,file){
   if(!/^no-/.test(file.relative))
   {
	$('[fill]').removeAttr('fill');
    $('[style]').removeAttr('style');
    $('[class]').removeAttr('class');
    $('style,title').remove();
   }

   $('#Слой_2,#svg-export').removeAttr('id');
  },
  parserOptions:{xmlMode:true}
 }))
 .pipe(rename({prefix:'icon-'+a+'-'}))
 .pipe(svgstore({inlineSvg:true}))
 .pipe(gulp.dest(options.src.imgs.svgBase));
});

gulp.task('sprite',function(){
 var a=getArg('--p')||'shared';
 
 return gulp.src(options.src.imgs.spriteBits+a+'-sprite/*.png')
  .pipe(spritesmith({
   imgName:a+'-sprite.png',
   cssName:'_'+a+'.scss',
   padding:10,
   algorithm:'top-down',
   cssTemplate:'tmpl.mustache'
  }))
  .pipe(buffer())
  .pipe(flatmap(function(stream,file){
   var dest;

   if(path.extname(file.path)==='.scss')
   {
    file.contents=new Buffer(String(file.contents).replace('.png','').replace(/,(?=[^,]*$)/, ''));
    dest=options.src.imgs.spriteProc;
   }else
   {
    dest=options.src.imgs.base;
   }

   return stream.pipe(gulp.dest(dest));
  }))
  .on('end',function(e){
   sassAll('sprites');
  });
});