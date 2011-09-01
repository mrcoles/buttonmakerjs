
$(function() {

    /*! From mustache.js - See http://mustache.github.com/ for more info. */
    $.htmlEscape = function(s) {
        s = String(s === null ? "" : s);
        return s.replace(/&(?!\w+;)|["'<>\\]/g, function(s) {
            switch(s) {
              case "&": return "&amp;";
              case "\\": return "\\\\";
              case '"': return '&quot;';
              case "'": return '&#39;';
              case "<": return "&lt;";
              case ">": return "&gt;";
            default: return s;
            }
        });
    };

    window.loadState = function(state) {
        $.each(state, function(k, v) {
            $('#id_' + k).val(v);
        });
        $('#id_color').trigger('change');
    };

    var hardcoded = {
        border_size: 1,
        font_size: 13
    };

    var didChange = false;
    function addUnload() {
        window.onbeforeunload = function() {
            return 'You have made changes to this page, are you sure you want to close this window?';
        };
    }

    function change(evt, initialize) {
        var state = {};

        if (!initialize && !didChange) {
            didChange = true;
            addUnload();
        }

        $('form').find(':input').each(function() {
            var $this = $(this), val;
            initialize && $this.val($this.data('default'));

            val = $.trim($.htmlEscape($this.val() || $this.data('default')));
            if ($this.hasClass('color') && (val.length == 3 || val.length == 6) && val.substring(0, 1) != '#') val = '#' + val;
            if (/^\d+$/.test(val)) val = parseInt(val);

            state[this.name] = val;
        });

        var height = state.grid_height - 2*hardcoded.border_size - 2*state.margin_top;

        var gradient = makeGradients(height, state.top_color, state.bottom_color, state.top_color_hover, state.bottom_color_hover);
        var dataURL = gradient.toDataURL('image/png');
        var img = document.getElementById('gradient-image')
            || $('<img>', {id: 'gradient-image'}).appendTo('#gradient-home').get(0);
        img.src = dataURL;
        img.width = 100;
        img.height = gradient.height;

        var rebuild = ('/* buttonmaker state: javascript:loadState({'
                       + $.map(state, function(v, k) { return k + ': "' + $.htmlEscape(v) + '"'; }).join(', ')
                       + '}) */');

        var styles = [
            rebuild,
            '',
            'button,',
            'a.button {',
            '    display: -moz-inline-box;',
            '    display: inline-block;',
            '    position: relative;',
            '    margin: ' + state.margin_top + 'px 0;',
            '    padding: 0 12px;',
            '    border: ' + hardcoded.border_size + 'px solid ' + state.border_color + ';',
            '    height: ' + height + 'px;',
            '    *height: ' + (height + 2) + 'px; /* ie6&7 hack */',
            '    width: auto; /* ie fix for double paddings on button... */',
            '    overflow: visible; /* ie fix for double paddings on button... */',
	        '    font-family: helvetica,arial,sans-serif;',
            '    font-size: ' + hardcoded.font_size + 'px;',
            '    line-height: ' + height + 'px;',
            '    text-align: center;',
            '    color: ' + state.color + ';',
            '    text-decoration: none;',
            '    white-space: nowrap;',
            '    cursor: pointer;',
            '    vertical-align: middle;',
            '    background: ' + state.bottom_color + ' url(' + dataURL + ') scroll repeat-x 0 0;',
            '    background: -moz-linear-gradient(center top, ' + state.top_color + ' 0%, ' + state.bottom_color + ' 100%) repeat-x 0 0;',
            '    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, ' + state.top_color + '), color-stop(100%, ' + state.bottom_color + ')) repeat-x 0 0;',
            '    background: linear-gradient(top, ' + state.top_color + ' 0%, ' + state.bottom_color + ' 100%);',
            '    -moz-border-radius: ' + state.border_radius + 'px;',
            '    -webkit-border-radius: ' + state.border_radius + 'px;',
            '    border-radius: ' + state.border_radius + 'px;',
            '    -khtml-box-sizing: content-box;',
            '    -webkit-box-sizing: content-box;',
            '    -moz-box-sizing: content-box;',
            '    box-sizing: content-box;',
            '    -khtml-appearance: none;',
            '    -moz-appearance: none;',
            '}',
            '',
            '/* fix firefox bugs with button inner padding and line-height */',
            'button::-moz-focus-inner {',
            '    padding: 0;',
            '    border: 0;',
            '}',
            '>button {',
            '        padding-top: 1px;',
            '        height: ' + (height - 1) + 'px;',
            '        line-height: ' + (height - 1) + 'px;',
            '}',
            '',
            'button:hover,',
            'button:focus,',
            'a.button:hover,',
            'a.button:focus {',
            (state.border_color_hover && state.border_color_hover != state.border_color
             ? 'border-color: ' + state.border_color_hover + ';'
             : null)
        ];

        if (state.bottom_color_hover == state.top_color_hover) {
            styles.push(
                '    background: ' + state.bottom_color_hover + ';'
            );
        } else {
            styles.push(
                '    background-color: ' + state.bottom_color + ';',
                '    background-position: repeat-x 0 -26px;',
                '    background: -moz-linear-gradient(center top, ' + state.top_color_hover + ' 0%, ' + state.bottom_color_hover + ' 100%) repeat-x 0 0;',
                '    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, ' + state.top_color_hover + '), color-stop(100%, ' + state.bottom_color_hover + ')) repeat-x 0 0;',
                '    background: linear-gradient(top, ' + state.top_color_hover + ' 0%, ' + state.bottom_color_hover + ' 100%);'
            );
        }

        styles.push(
            '}'
        );

        styles = $.grep(styles, function(x, i) { return x !== null; }).join('\n');

        $('#code').val(styles);

        $('style#customcss').remove();
        $('<style/>', {
            id: 'customcss',
            html: styles
        }).appendTo('head');
    }

    change(null, true);

    $('form').find(':input').change(change);

    //
    // grid stuff
    //
    function doGrid() {
        var height = parseInt($('#id_grid_height').val()),
            width = 100,
            canvas = document.getElementById('grid-canvas') || $('<canvas>', {id: 'grid-canvas'}).appendTo('body').get(0),
            ctx = canvas.getContext('2d');

        if (isNaN(height)) height = 36;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = .5; // not sure why the line keeps being so thick...
        ctx.beginPath();
        ctx.moveTo(-1, height);
        ctx.lineTo(width + 1, height);
        ctx.closePath();
        ctx.stroke();

        var src = canvas.toDataURL('image/png');

        $('#buttons').css({
            backgroundImage: 'url(' + src + ')',
            backgroundPosition: '0 19px',
            backgroundRepeat: 'repeat'
        });
    }

    $('#id_grid_height').change(doGrid);

    doGrid();

    //
    // gradient images
    //

    function makeGradients(height) {
        var canvas = document.getElementById('gradient-canvas') ||
            $('<canvas>', {id: 'gradient-canvas'}).appendTo('body').get(0),
            ctx = canvas.getContext('2d'),
            width = 1,
            colors = [],
            i, len, num_sections, top, bottom, gradient;

        for (i=1, len=arguments.length; i<len; i++)
            colors.push(arguments[i]);

        num_sections = Math.floor((colors.length) / 2);

        canvas.width = width;
        canvas.height = height * num_sections;

        ctx.clearRect(0, 0, width, height * num_sections);

        for (i=0; i<num_sections; i++) {
            top = i * height;
            bottom = (i+1) * height;
            gradient = ctx.createLinearGradient(0, top, 0, bottom);
            gradient.addColorStop(0, colors[i*2]);
            gradient.addColorStop(1, colors[i*2+1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, top, width, bottom);
        }

        return canvas;
    }

});
