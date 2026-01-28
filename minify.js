var UglifyJS = require('uglify-js');
var fs = require('fs');
var path = require('path');

var files = ['celestial.js', 'celestial2nd.js', 'celestial3rd.js'];

files.forEach(function(file) {
    var filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.error('Plik nie istnieje: ' + file);
        return;
    }

    var minFile = file.replace('.js', '.min.js');
    var minPath = path.join(__dirname, minFile);

    console.log('Minifikuję ' + file + ' -> ' + minFile + '...');

    try {
        var result = UglifyJS.minify(filePath);
        if (result.error) {
            console.error('Błąd podczas minifikacji ' + file + ':', result.error);
        } else {
            fs.writeFileSync(minPath, result.code);
            console.log('Sukces: ' + minFile);
        }
    } catch (e) {
        console.error('Wyjątek podczas minifikacji ' + file + ':', e);
    }
});
