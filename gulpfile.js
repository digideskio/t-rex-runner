var gulp = require('gulp');
var browserify = require('gulp-browserify');

var errorHandler = function (error) {
    console.error(error.message);
    this.emit('end');
}

gulp.task('watch', function () {
    var watcher = gulp.watch('src/**/*.js', ['browserify']);
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});

// Basic usage
gulp.task('browserify', function() {
    // Single entry point to browserify
    gulp.src('src/app.js')
        .pipe(browserify({
          insertGlobals : false,
          debug : !gulp.env.production
        }))
        .on('error', errorHandler)
        .pipe(gulp.dest('./public/js'))
});