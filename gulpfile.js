var gulp=require('gulp'),
 minifycss=require('gulp-minify-css'),
 uglify=require('gulp-uglify'),
 rename=require('gulp-rename'),
 concat=require('gulp-concat'),
 spritesmith=require('gulp.spritesmith'),
 fs=require('fs'),
 path=require('path'),
 glob=require('glob'),
 foreach=require('gulp-foreach'),
 fileinclude=require('gulp-file-include'),
 del=require('del'),
 buffer = require('vinyl-buffer');
 
 flag='src',//flag='src' or flag='dest'
 options={
  src:{
   html:{
    src:'src/html/*.html',
    scripts:'src/html/components/src.html'
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
    data:'src/scss/**/*.*',
    base:'src/scss/',
    baseStr:'src\\scss\\',
     include:{
     all:'src/scss/!(core|base)/',
     components:'src/scss/components/',
     partials:'src/scss/partials/',
     sprites:'src/scss/sprites/'
    },
    allName:'_all.scss'
   },
   imgs:{
    src:'src/images/**/*.*',
    base:'src/images/',
    spriteProc:'src/scss/sprites'
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
   html:'src/html/**/*.html',
   js:'src/js/**/*.js',
   css:'src/css/*.scss',
   img:'src/images/**/*.*',
   fonts:'src/fonts/**/*.*'
  },
  clean:'dest'
 };

function getArg(key){
 var index=process.argv.indexOf(key),
     next=process.argv[index+1];

 return (index<0)?null:(!next||next[0]==="-")?true:next;
}

function sassAll(e){
 var name=options.src.css.allName,
     a=(typeof e=='string'?e:null)||getArg('--p');
 
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
    fs.appendFileSync(allFile,'@import \''+path.basename(partial,path.extname(partial)).substring(1)+'\';\n');
   });
  });
 });
}

function data(){
 return gulp.src(options.src.css.data)
  .pipe(foreach(function(stream,file){
   var p=file.path,
       sb=p.substring(p.indexOf(options.src.css.baseStr)+options.src.css.baseStr.length);
    
    file.contents=new Buffer(String(file.contents)
    .replace(/@include exports\(.*\)\{(\/\*.*\*\/)*/,'@include exports("@path:'+sb+'"){/*@path:'+sb+'*/')
    .replace(/\/\*@path.*\*\//,'/*@path:'+sb+'*/'));
   return stream;
  }))
  .pipe(gulp.dest(options.src.css.base));
}

function jsAdd(e){//e.type=changed|added|deleted
 var scripts='';
 
 if(typeof e=='function'||e.type=='added'||e.type=='deleted'||e.type=='renamed')
 {
  options.src.js.min.forEach(function(f){
   glob.sync(f).forEach(function(f1){
    scripts+='<script src="'+f1.substring(f1.indexOf(options.src.js.baseStr)+options.src.js.baseStr.length)+'"></script>\n';
   });
  });
  
  fs.writeFileSync(options.src.html.scripts,scripts);
 }
}

gulp.task('watch',function(){
  gulp.watch(options.watch.html,['html']);
  gulp.watch(options.src.js.min,jsAdd);
  
  if(flag=='dest')
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

gulp.task('fonts',function(){
 if(flag=='dest')
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
 if(flag=='dest')
 {
  return gulp.src(options.src.css.src)
   .pipe(gulp.dest(options.dest.css));
 }
});

gulp.task('css-min',function(){
 return gulp.src(options.src.css.min)
  .pipe(rename({suffix:'.min'}))
  .pipe(minifycss())
  .pipe(gulp.dest(options.dest.css));
});

gulp.task('js',function(){
 if(flag=='dest')
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

gulp.task('img',function(){
 if(flag=='dest')
 {
  return gulp.src(options.src.img.src)
   .pipe(gulp.dest(options.dest.img));
 }
});

gulp.task('sprite',function(){
 var a=getArg('--p')||'shared';
 
 return gulp.src(options.src.imgs.base+a+'-sprite/*.png')
  .pipe(spritesmith({
   imgName:a+'-sprite.png',
   cssName:'_'+a+'.scss',
   padding:10,
   algorithm:'top-down',
   cssTemplate:'tmpl.mustache'
  }))
  .pipe(buffer())
  .pipe(foreach(function(stream,file){
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