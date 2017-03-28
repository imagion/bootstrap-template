var gulp            = require('gulp'),
	browserSync     = require('browser-sync'),
	del             = require('del'),
	cssnano         = require('gulp-cssnano'),
	uglify          = require('gulp-uglify'),
	rename          = require('gulp-rename'),
	concat          = require('gulp-concat'),
	imagemin        = require('gulp-imagemin'),
	notify          = require("gulp-notify");
	gutil           = require('gulp-util'),
	cache           = require('gulp-cache'),
	ftp             = require('vinyl-ftp'),

	precss          = require('precss'),
	postcss         = require('gulp-postcss'),
	cssnext         = require('postcss-cssnext'),
	fontMagician    = require('postcss-font-magician'),
	short           = require('postcss-short'),
	extend          = require('postcss-extend'),
	mixins          = require('postcss-mixins'),
	imports         = require('postcss-partial-import');

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
		notify: false,
		// tunnel: true,
		// tunnel: "projectmane", //Demonstration page: http://projectmane.localtunnel.me
	});
});

gulp.task('css', function () {
	var processors = [
			precss,
			cssnext,
			fontMagician({
				variants: {
							'Roboto': {
								'400': [],
								'700': []
							}
						},
						formats: 'woff ttf eot',
						hosted: ['app/fonts/Roboto']
			}),
			short,
			extend,
			mixins,
			imports
	];
	return gulp.src(['./app/init/main.css'])
		.pipe(postcss(processors))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(cssnano())
		.pipe(gulp.dest('./app/css/'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('watch', ['css', 'js', 'browser-sync'], function() {
	gulp.watch('app/sass/**/*.sass', ['sass']);
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
