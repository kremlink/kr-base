var gulp=require('gulp'),
 del=require('del'),
 zip=require('gulp-zip'),
 dl=require('gulp-download'),
 unzip=require('gulp-unzip');

gulp.task('ini',function(){
 var folder='kr-base-master',
 url='https://github.com/kremlink/kr-base/archive/master.zip',
 stream=dl(url)
  .pipe(unzip())
  .pipe(gulp.dest('./'));
 
 stream.on('end',function(e){
  var stream=gulp.src(folder+'/**/*',{dot:true})
   .pipe(gulp.dest('./'));
   
   stream.on('end',function(e){
    del(folder);
    del('.gitignore');
   });
 });
});