require('path');

module.exports = {
    mode: 'development',
    entry: './dist/js/script.js',
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: 'script.min.js',
    },
    watch: true,
};
