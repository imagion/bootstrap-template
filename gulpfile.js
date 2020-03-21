const { series, parallel, dest, src, watch } = require('gulp');
const browserSync       = require('browser-sync').create();
const scss              = require('gulp-sass');
const babel 						= require('gulp-babel');
const autoprefixer 			= require('gulp-autoprefixer');
const cleancss 					= require('gulp-clean-css');
const uglify 						= require('gulp-uglify-es').default;
const concat 						= require('gulp-concat');
const plumber 					= require('gulp-plumber');
const postcss 					= require('gulp-postcss');
const postcssPresetEnv 	= require('postcss-preset-env');
const postcssShort 			= require('postcss-short');
const rename 						= require('gulp-rename');
const imagemin 					= require('gulp-imagemin');
const newer 						= require('gulp-newer');
const del 							= require('del');
const rsync 						= require('gulp-rsync');

let baseDir = 'app'; // Base dir path without «/» at the end
let online = true; // If «false» - Browsersync will work offline without internet connection
let preprocessor = 'scss'; // Preprocessor (sass, scss, less, styl)
let fileswatch = 'html,htm,txt,json,md,woff2'; // List of files extensions for watching & hard reload (comma separated)
let imageswatch = 'jpg,jpeg,png,webp,svg'; // List of images extensions for watching & compression (comma separated)

let paths = {

	scripts: {
		src: [
			baseDir + '/assets/vendor/jquery-3.3.1/dist/jquery.min.js',
			baseDir + '/assets/js/main.js'
		],
		dest: baseDir + '/assets/js',
	},

	styles: {
		src: baseDir + '/assets/' + preprocessor + '/main.*',
		dest: baseDir + '/assets/css',
	},

	images: {
		src: baseDir + '/assets/images/src/**/*',
		dest: baseDir + '/assets/images/dest',
	},

	deploy: {
		hostname: 'username@yousite.com', // Deploy hostname
		destination: 'yousite/public_html/', // Deploy destination
		include: [ /* '*.htaccess' */ ], // Included files to deploy
		exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excluded files from deploy
	},

	cssOutputName: 'app.min.css',
	jsOutputName: 'app.min.js',

}

function browserSync(cb) {
	browsersync.init({
		server: { baseDir: baseDir + '/' },
		open: false,
		notify: false,
		online: online
	});
	cb();
}

function js(cb) {
	return src(paths.scripts.src)
	.pipe(plumber())
	.pipe(concat('paths.jsOutputName'))
	.pipe(babel({ "presets": ["@babel/preset-env"]}))
	.pipe(uglify())
	.pipe(dest(paths.scripts.dest))
	.pipe(browserSync.stream())
	cb();
}

function css(cb) {
	return src(paths.styles.src)
	.pipe(plumber())
	.pipe(sass({ outputStyle: 'expand' }).on('error', sass.logError))
	.pipe(postCSS([
		postcssPresetEnv({ stage: 2 }),
		postcssShort({ skip: 'x' }),
	]))
	.pipe(concat('paths.cssOutputName'))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: 'autoplace'}))
	.pipe(cleanCSS( {level: { 2: { specialComments: 0 } } }))
	.pipe(dest(paths.styles.dest))
	.pipe(browserSync.stream())
	cb();
}

function images() {
	return src(paths.images.src)
	.pipe(newer(paths.images.dest))
	.pipe(imagemin())
	.pipe(dest(paths.images.dest))
}

function cleanimg() {
	return del('' + paths.images.dest + '/**/*', { force: true })
}

function deploy(cb) {
	return src(baseDir + '/')
	.pipe(rsync({
		root: baseDir + '/',
		hostname: paths.deploy.hostname,
		destination: paths.deploy.destination,
		include: paths.deploy.include,
		exclude: paths.deploy.exclude,
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
	cb();
}

function watcher(cb) {
	watch(baseDir + '/**/' + preprocessor + '/**/*', parallel('css'));
	watch(baseDir + '/**/*.{' + imageswatch + '}', parallel('images'));
	watch([baseDir + '/**/*.js', '!' + paths.scripts.dest + '/*.min.js'], parallel('js'));
	watch(baseDir + '/**/*.{' + fileswatch + '}').on('change', browserSync.reload);
	cb();
}

exports.browsersync = browsersync;
exports.assets 			= series(cleanimg, styles, scripts, images);
exports.css 				= css;
exports.js 					= js;
exports.images 			= images;
exports.deploy 			= deploy;
exports.default 		= parallel(css, js, browserSync, watcher);
