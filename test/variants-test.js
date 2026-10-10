var assert = require('assert');
var fs = require('fs');
var path = require('path');
var JSDOM = require('jsdom').JSDOM;
var root = path.join(__dirname, '..');

function check(suffixes, minified) {
    var dom = new JSDOM('<div id="map4"></div><div id="map5"></div>', {runScripts: 'outside-only'});
    var window = dom.window;
    // jsdom has no Canvas renderer. Exercise initialization and DOM/event isolation.
    window.HTMLCanvasElement.prototype.getContext = function() {
        return new Proxy({measureText: function(text) { return {width: String(text).length * 7}; }}, {
            get: function(target, key) { return key in target ? target[key] : function() {}; }
        });
    };
    function load(file) { window.eval(fs.readFileSync(path.join(root, file), 'utf8')); }
    load('lib/d3.js');
    load('lib/d3.geo.projection.js');
    suffixes.forEach(function(suffix) { load('celestial' + suffix + (minified ? '.min' : '') + '.js'); });
    // Leave network requests pending; this test doesn't verify sky rendering.
    window.d3.json = function() {};
    ['4th', '5th'].forEach(function(suffix) {
        if (suffixes.indexOf(suffix) === -1) return;
        var celestial = window['Celestial' + suffix];
        var prefix = 'cel' + suffix + '_';
        var number = suffix.charAt(0);
        assert.strictEqual(celestial.iId, prefix);
        celestial.display({
            container: 'map' + number, width: Number(number) * 100,
            interactive: false, controls: true, form: false, location: true,
            lines: {graticule: {
                major: {latitudeLine: 15, longitudeLine: 360},
                minor: {latitudeLine: 15, longitudeLine: 10},
                majorExtend: [[-180, -90], [180, 90]]
            }}
        });
        assert.strictEqual(celestial.metrics().width, Number(number) * 100);
        ['width', 'lines', 'loc', 'error', 'cal', 'celestial-form', 'celestial-date', 'celestial-zoomin'].forEach(function(id) {
            assert.ok(window.document.getElementById(prefix + id), prefix + id);
        });
        assert.ok(window.d3.select(window.document).on('mousedown.' + prefix));
        // Clicking a calendar day must parse its prefixed ID correctly.
        var day = window.document.querySelector('#' + prefix + 'cal [id]');
        assert.ok(day);
        day.dispatchEvent(new window.MouseEvent('click', {bubbles: true}));
        assert.ok(isFinite(celestial.date().valueOf()));
        assert.strictEqual(window.d3.time.format('%Y-%m-%d')(celestial.date()), day.id.slice(prefix.length));
        celestial.add({type: 'raw', callback: function() {}});
        assert.strictEqual(celestial.data.length, 1);
    });
    if (suffixes.indexOf('4th') !== -1 && suffixes.indexOf('5th') !== -1) {
        assert.notStrictEqual(window.Celestial4th.settings(), window.Celestial5th.settings());
        assert.notStrictEqual(window.Celestial4th.data, window.Celestial5th.data);
        window.Celestial4th.clear();
        assert.strictEqual(window.Celestial5th.data.length, 1);
        assert.strictEqual(window.Celestial5th.metrics().width, 500);
    }
    var ids = new Set();
    window.document.querySelectorAll('[id]').forEach(function(node) {
        assert.ok(!ids.has(node.id), 'Duplicate ID: ' + node.id);
        ids.add(node.id);
    });
    dom.window.close();
}

[false, true].forEach(function(minified) {
    check(['4th'], minified);
    check(['5th'], minified);
    check(['', '2nd', '3rd', '4th', '5th'], minified);
});
console.log('Variant initialization, calendar and isolation checks passed (source and minified).');
