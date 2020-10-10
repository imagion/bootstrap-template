const { series, parallel, dest, src, watch } = require('gulp');
const browserSync       = require('browser-sync').create();
const sass              = require('gulp-sass');
const babel             = require('gulp-babel');
const autoprefixer      = require('gulp-autoprefixer');
const cleancss          = require('gulp-clean-css');
const uglify            = require('gulp-uglify-es').default;
const concat            = require('gulp-concat');
const plumber           = require('gulp-plumber');
const postcss           = require('gulp-postcss');
const postcssPresetEnv  = require('postcss-preset-env');
const postcssShort      = require('postcss-short');
const imagemin          = require('gulp-imagemin');
const newer             = require('gulp-newer');
const del               = require('del');
const rsync             = require('gulp-rsync');

let baseDir = 'app'; // Base dir path without «/» at the end
let online = true; // If «false» - Browsersync will work offline without internet connection
let preprocessor = 'scss'; // Preprocessor (sass, scss, less, styl)
let fileswatch = 'html,htm,txt,json,md,woff2'; // List of files extensions for watching & hard reload (comma separated)
let imageswatch = 'jpg,jpeg,png,webp,svg'; // List of images extensions for watching & compression (comma separated)

let paths = {

    scripts: {
        src: [
            baseDir + '/vendor/jquery/dist/jquery.min.js',
            baseDir + '/vendor/slick-1.8.1/slick/slick.min.js',
            baseDir + '/js/main.js'
        ],
        dest: baseDir + '/js',
        OutputName: 'app.min.js',
    },

    styles: {
        src: baseDir + '/' + preprocessor + '/app.*',
        dest: baseDir + '/css',
        OutputName: 'app.min.css',
    },

    images: {
        src: baseDir + '/images/src/**/*',
        dest: baseDir + '/images/dest',
    },

    deploy: {
        hostname: 'username@yousite.com', // Deploy hostname
        destination: 'yousite/public_html/', // Deploy destination
        include: [ /* '*.htaccess' */ ], // Included files to deploy
        exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excluded files from deploy
    },

}

function browsersync(cb) {
    browserSync.init({
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
    .pipe(concat(paths.scripts.OutputName))
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
        .pipe(postcss([
            postcssPresetEnv({ stage: 2 }),
            postcssShort({ skip: 'x' }),
        ]))
        .pipe(concat(paths.styles.OutputName))
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: 'autoplace'}))
        .pipe(cleancss( {level: { 2: { specialComments: 0 } } }))
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
exports.assets      = series(cleanimg, css, js, images);
exports.css         = css;
exports.js          = js;
exports.images      = images;
exports.cleanimg    = cleanimg;
exports.deploy      = deploy;
exports.default     = parallel(images, css, js, browsersync, watcher);
