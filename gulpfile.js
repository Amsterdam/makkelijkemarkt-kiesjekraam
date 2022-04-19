const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const minifyCSS = require('gulp-clean-css');
const paths = {
    style: ['src/scss/**/*.scss'],
    cssMin: 'dist/style/',
};

gulp.task('build', () =>
    gulp
        .src(paths.style)
        .pipe(sass())
        .pipe(minifyCSS())
        .pipe(gulp.dest(paths.cssMin)),
);

gulp.task('watch', () =>
    gulp.watch(paths.style).on('change', () =>
        gulp
            .src(paths.style)
            .pipe(sass().on('error', sass.logError))
            .pipe(minifyCSS())
            .pipe(gulp.dest(paths.cssMin)),
    ),
);
