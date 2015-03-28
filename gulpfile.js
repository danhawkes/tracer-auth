var gulp = require('gulp'),
  $ = require('gulp-load-plugins')(),
  del = require('del'),
  minimist = require('minimist');

var SRC = 'src',
  DST = 'build';

var server;

var args = minimist(process.argv.slice(2), {
  strings: ['env'],
  default: {
    'env': 'prod'
  }
});

var config = {
  'ENV_DB_PROTOCOL': {
    'dev': 'http',
    'prod': 'https'
  },
  'ENV_DB_PORT': {
    'dev': 5984,
    'prod': 5984
  },
  'ENV_DB_HOST': {
    'dev': 'localhost',
    'prod': 'tracer-db.arcs.co'
  }
};


function clean(done) {
  return del(DST, done);
}

function compile() {
  return gulp.src(SRC + '/*.js')
    .pipe($.renvy(config, args.env))
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
