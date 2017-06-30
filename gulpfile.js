/**
 * Created by rdshoep on 16/1/4.
 */
'use strict';

let gulp = require('gulp');
let rimraf = require('rimraf');
let runSequence = require('run-sequence').use(gulp);

let webpack = require("webpack");
gulp.task('js:compile', function (callback) {
  let myConfig = Object.create(require("./webpack.config.js"));
  // run webpack
  webpack(
    // configuration
    myConfig
    , function (err, stats) {
      // if(err) throw new gutil.PluginError("webpack", err);
      // gutil.log("[webpack]", stats.toString({
      //	 // output options
      // }));
      callback();
    });
});

gulp.task('copy', function () {
  return gulp.src(['resources/*'])
    .pipe(gulp.dest('dist/'));
});

gulp.task('clean', function (cb) {
  rimraf('dist/', cb);
})

gulp.task('build', function (cb) {
  runSequence(
    ['clean']
    , ['copy', 'js:compile']
    , cb);
})

gulp.task('default', ['build']);