// Keep the application-specific fixes in 3rd; make.js builds only the base library.
var fs = require('fs');
var path = require('path');
var UglifyJS = require('uglify-js');
var template = fs.readFileSync(path.join(__dirname, 'celestial3rd.js'), 'utf8');

// Complete DOM isolation where the older copies still use shared IDs/selectors.
template = template.replace(/\.attr\("id", "([^"]+)"\)/g, '.attr("id", Celestial3rd.iId+"$1")')
    .replace(/\.attr\("for", /g, '.attr("for", Celestial3rd.iId+')
    .replace(/Celestial3rd.iId\+"label-propername"\)\.attr/g, 'Celestial3rd.iId+"label-"+fld).attr')
    .replace('"div#general"', '"div#"+Celestial3rd.iId+"general"')
    .replace('d3.select("#location")', 'd3.select("#"+Celestial3rd.iId+"location")')
    .replace('d3.select(Celestial3rd.iId+"#location")', 'd3.select("#"+Celestial3rd.iId+"location")')
    .replace('d3.select("#" + which)', 'd3.select("#" + Celestial3rd.iId + which)')
    .replace('d3.select("#" + fld)', 'd3.select("#" + Celestial3rd.iId + fld)')
    .replace('d3.select(document).on("mousedown",', 'd3.select(document).on("mousedown."+Celestial3rd.iId,')
    .replace('if (this.id && this.id.search(/^\\d/) !== -1) {\n      date = dateFormat.parse(this.id);',
        'var id = (this.id || "").replace(Celestial3rd.iId, "");\n    if (id.search(/^\\d/) !== -1) {\n      date = dateFormat.parse(id);');

['4th', '5th'].forEach(function(suffix) {
    var filename = path.join(__dirname, 'celestial' + suffix + '.js');
    // The existing 3rd prefix really is cel3nd_ (a historical typo).
    var source = template.replace(/Celestial3rd/g, 'Celestial' + suffix)
        .replace(/cel3nd_/g, 'cel' + suffix + '_');
    var result = UglifyJS.minify(source, {fromString: true});
    if (result.error) throw result.error;
    fs.writeFileSync(filename, source);
    fs.writeFileSync(filename.replace(/\.js$/, '.min.js'), result.code);
    console.log('Generated celestial' + suffix + '.js and celestial' + suffix + '.min.js');
});
