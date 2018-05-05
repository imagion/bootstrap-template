var gulp        = require('gulp'), // core
	browsersync   = require('browser-sync'), // refresh
  sass          = require('gulp-sass'), // sass syntax
  rename        = require('gulp-rename'), // rename files
  autoprefixer  = require('gulp-autoprefixer'), // autoprefixer
  cleancss      = require('gulp-clean-css'), // optimize css
  uglify        = require('gulp-uglify'), // minify js
  concat        = require('gulp-concat'), // concat files
  notify        = require("gulp-notify"), // notify
  plumber       = require('gulp-plumber'), // error handler
  sourcemaps    = require('gulp-sourcemaps'), // sourcemaps
	rsync         = require('gulp-rsync'); // deploy site

gulp.task('browser-sync', function() {
	browsersync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		// open: false,
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
});

gulp.task('styles', function () {
	return gulp.src('app/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'expand' }).on("error", notify.onError()))
		.pipe(rename({suffix: '.min', prefix : ''}))
    .pipe(autoprefixer(['last 15 versions']))
    .pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
    .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('app/css/'))
		.pipe(browsersync.reload({stream: true}))
});

gulp.task('javascript', function() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/js/common.js']) // Always at the end
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Mifify js (opt.)
	.pipe(gulp.dest('app/js'))
	.pipe(browsersync.reload({stream: true}));
});

gulp.task('rsync', function() {
	return gulp.src('dist/**')
	.pipe(rsync({
		root: 'dist/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Скрытые файлы, которые необходимо включить в деплой
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}));
});

gulp.task('watch', ['styles', 'javascript', 'browser-sync'], function() {
	gulp.watch('app/scss/**/*.scss', ['styles']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['javascript']);
	gulp.watch('app/*.html', browsersync.reload);
});

gulp.task('default', ['watch']);
