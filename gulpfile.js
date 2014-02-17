var gulp = require("gulp"),
    browserify = require("gulp-browserify"),
    jshint = require("gulp-jshint");

gulp.task("hint", function () {
  gulp.src("./src/pingpong.js")
    .pipe(jshint())
    .pipe(jshint.reporter("default"));
});

gulp.task("build", function () {
  gulp.src("./src/pingpong.js")
      .pipe(browserify())
      .pipe(gulp.dest("./build"));
});

gulp.task("default", function () {
  gulp.start("hint");
  gulp.start("build");
  gulp.watch("src/**/*.js", ["hint", "build"]);
});
