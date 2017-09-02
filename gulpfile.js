var gulp            = require('gulp'),             // core
	browserSync     = require('browser-sync'),     // refresh
	del             = require('del'),              // delete files or folders
	cssnano         = require('gulp-cssnano'),     // minify css
	uglify          = require('gulp-uglify'),      // minify js
	imagemin        = require('gulp-imagemin'),    // minify images
	rename          = require('gulp-rename'),      // rename files
	concat          = require('gulp-concat'),      // concat files
	gutil           = require('gulp-util'),        // utils for plugins
	cache           = require('gulp-cache'),       // clear cache or else
	// plumber         = require('gulp-plumber'),     // error handler
	sourcemaps      = require('gulp-sourcemaps'),  // sourcemaps
	ftp             = require('vinyl-ftp'),        // upload files FTP
	// последний precss не фурычит с последним postcss (16.08.17)
	precss          = require('precss'),           // sass-like syntax
	postcss         = require('gulp-postcss'),     // postcss core
	cssnext         = require('postcss-cssnext'),  // css4 syntax
	short           = require('postcss-short');    // shorthand css properties

gulp.task('common-js', function() {
	return gulp.src([
		'app/js/common.js',
		])
	.pipe(concat('common.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('app/js'));
});

gulp.task('js', ['common-js'], function() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/js/common.min.js', // Всегда в конце
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Минимизировать весь js (на выбор)
	.pipe(gulp.dest('app/js'))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app'
		},
	});
});

gulp.task('css', function () {
	var processors = [
			precss,
			cssnext,
			short,
	];
	return gulp.src(['./app/init/main.css'])
		.pipe(postcss(processors))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(cssnano())
		.pipe(gulp.dest('./app/css/'))
		.pipe(browserSync.stream());
});

gulp.task('watch', ['css', 'js', 'browser-sync'], function() {
	gulp.watch('app/init/**/*.css', ['css']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/*.html', browserSync.reload);
});

gulp.task('imagemin', function() {
	return gulp.src('app/img/**/*')
	.pipe(cache(imagemin()))
	.pipe(gulp.dest('dist/img'));
});

gulp.task('build', ['removedist', 'imagemin', 'css', 'js'], function() {

	var buildFiles = gulp.src([
		'app/*.html',
		'app/.htaccess',
		]).pipe(gulp.dest('dist'));

	var buildCss = gulp.src([
		'app/css/main.min.css',
		]).pipe(gulp.dest('dist/css'));

	var buildJs = gulp.src([
		'app/js/scripts.min.js',
		]).pipe(gulp.dest('dist/js'));

	var buildFonts = gulp.src([
		'app/fonts/**/*',
		]).pipe(gulp.dest('dist/fonts'));

});

gulp.task('deploy', function() {

	var conn = ftp.create({
		host:      'hostname.com',
		user:      'username',
		password:  'userpassword',
		parallel:  10,
		log: gutil.log
	});

	var globs = [
	'dist/**',
	'dist/.htaccess',
	];
	return gulp.src(globs, {buffer: false})
	.pipe(conn.dest('/path/to/folder/on/server'));

});

gulp.task('removedist', function() { return del.sync('dist'); });
gulp.task('clearcache', function () { return cache.clearAll(); });

gulp.task('default', ['watch']);
