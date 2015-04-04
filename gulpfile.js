var gulp = require('gulp'),
  $ = require('gulp-load-plugins')(),
  del = require('del'),
  config = require('./gulpconfig');

var SRC = 'src',
  DST = 'build';

var server;


function clean(done) {
  return del(DST, done);
}

function compile() {
  return gulp.src(SRC + '/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.sourcemaps.write())
    .pipe($.frep(config))
    .pipe(gulp.dest(DST))
}

function watch() {
  gulp.watch(SRC + '/*.js', gulp.series(compile, restartServer));
}

function startServer(done) {
  var path = './' + DST + '/server';
  delete require.cache[require.resolve(path)];
  server = require(path)();
  server.start(done);
}

function restartServer(done) {
  if (server) {
    server.stop(function(err) {
      if (err) {
        done(err);
      }
      startServer(done);
    });
  } else {
    done();
  }
}


gulp.task('clean', clean);

gulp.task('build', gulp.series(clean, compile));

gulp.task('serve', gulp.series('build', gulp.parallel(watch, startServer)));

gulp.task('default', gulp.series('build'));
