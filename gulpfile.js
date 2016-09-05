var gulp            = require('gulp'),
	browserSync     = require('browser-sync').create(),
	del             = require('del'),
	cssnano         = require('gulp-cssnano'),
	uglify          = require('gulp-uglify'),
	rename          = require('gulp-rename'),
	concat          = require('gulp-concat'),
	imagemin        = require('gulp-imagemin'),
	pngquant        = require('imagemin-pngquant'),
	fileInclude     = require('gulp-file-include'),
	removeHtml      = require('gulp-remove-html'),
	gutil           = require('gulp-util'),
	cache           = require('gulp-cache'),
	ftp             = require('vinyl-ftp');
	postcss         = require('gulp-postcss');
	cssnext         = require('postcss-cssnext');
	colorShort      = require('postcss-color-short');
	short           = require('postcss-short');
	extend          = require('postcss-extend');
	mixins          = require('postcss-mixins');
	imports         = require('postcss-partial-import');
	svg             = require('postcss-svg-fragments');

// === Static Server + Watcher === //

gulp.task('serve', ['css'], function() {

	browserSync.init({
		server: "./app"
	});
	gulp.watch("app/header.css", ['headercss']);
	gulp.watch("app/assets/init/*.css", ['css']);
	gulp.watch("app/*.html").on('change', browserSync.reload);
	gulp.watch('app/assets/js/**/*.js', browserSync.reload);
});

// === CSS main task === //

gulp.task('css', ['headercss', 'fonts'], function () {
	var processors = [
			cssnext,
			colorShort,
			short,
			extend,
			mixins,
			imports,
			svg
	];
	return gulp.src(['./app/assets/init/main.css'])
		.pipe(postcss(processors))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(cssnano())
		.pipe(gulp.dest('./app/assets/final/'))
		.pipe(browserSync.stream());
});
gulp.task('headercss', function () {
	var processors = [
			cssnext,
			extend,
			mixins,
			imports,
			colorShort,
			short,
			svg
	];
	return gulp.src('./app/header.css')
		.pipe(postcss(processors))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(cssnano())
		.pipe(gulp.dest('app'))
		.pipe(browserSync.stream());
});
gulp.task('fonts', function () {
	return gulp.src('./app/assets/init/fonts.css')
	.pipe(rename({suffix: '.min', prefix : ''}))
	.pipe(gulp.dest('./app/assets/final/'))
	.pipe(browserSync.stream());
});

// === Libs Concat === //

gulp.task('libs', function() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		// 'app/libs/magnific-popup/magnific-popup.min.js'
		])
		.pipe(concat('libs.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('app/assets/js'));
});

// === Images Minify === //

gulp.task('imagemin', function() {
	return gulp.src('app/img/**/*')
		.pipe(cache(imagemin({
			interlaced: true,
			progressive: true,
			use: [pngquant()]
		})))
		.pipe(gulp.dest('dist/img'));
});

// === Include Header to HTML === //

gulp.task('buildhtml', function() {
  gulp.src(['app/*.html'])
	.pipe(fileInclude({
	  prefix: '@@'
	}))
	.pipe(removeHtml())
	.pipe(gulp.dest('dist/'));
});

// === Delete 'dist' folder === //

gulp.task('removedist', function() { return del.sync('dist'); });

// === Build 'dist' folder === //

gulp.task('build', ['removedist', 'buildhtml', 'imagemin', 'css', 'libs'], function() {

	var buildCss = gulp.src([
		'app/assets/final/fonts.min.css',
		'app/assets/final/main.min.css'
		]).pipe(gulp.dest('dist/css'));

	var buildFiles = gulp.src([
		'app/.htaccess'
	]).pipe(gulp.dest('dist'));

	var buildFonts = gulp.src('app/fonts/**/*').pipe(gulp.dest('dist/fonts'));

	var buildJs = gulp.src('app/assets/js/**/*').pipe(gulp.dest('dist/js'));

});

// === Deploy === //

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

// === Clear Cache === //

gulp.task('clearcache', function () { return cache.clearAll(); });

// === Default === //

gulp.task('default', ['serve']);
