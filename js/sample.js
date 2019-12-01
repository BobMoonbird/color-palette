var ColorType = {
    "Background": ["backgroundColor", "stickerBackgroundColor"],
    "Border": ["borderColor"],
    "Text": ["textColor"],
}

var allWidgets = [];
var selectedWidgetsInfo = null;
var selectedElem = null;
var widgetColors = new Map();
var colorTypes = Object.getOwnPropertyNames(ColorType);

class Color {
    constructor(value, type) {
        this.value = value;
        this.type = type;
    }
}

class WidgetColor {
    constructor(widget, color) {
        this.widget = widget;
        this.color = color;
    }
}

function getBoardContainer() {
    return document.getElementById("board-colors")
}

function getPalletteContainer() {
    return document.getElementById("pallette-colors")
}

function updateColorList(widgets) {
    allWidgets = widgets;
    selectColor(null);
    widgetColors.clear();
    clearColorList();
    if (allWidgets.length == 0) return;
    // map color.value -> listOf(WidgetColor)
    addWidgetColors(allWidgets);
    for (var colorValue of getSortedBoardColors()) {
        createBoardColor(getBoardContainer(), colorValue);
    }
}

function clearColorList() {
    getBoardContainer().innerHTML = '';
}

function addWidgetColors(widgets) {
    widgets.forEach((widget) => {
        var colors = getAllColorsFromWidget(widget);
        colors.forEach((color) => {
            var list = [];
            if (widgetColors.has(color.value)) {
                list = widgetColors.get(color.value);
            }
            list.push(new WidgetColor(widget, color));
            widgetColors.set(color.value, list);
        });
    });
}

function getAllColorsFromWidget(widget) {
    var colors = [];
    colorTypes.forEach((typeName) => {
        ColorType[typeName].forEach((attributeName) => {
            var style = widget["style"]
            if (style != null) {
                var colorValue = style[attributeName];
                if (colorValue != null) {
                    colors.push(new Color(colorValue, attributeName));
                }
            }
        });
    });
    return colors;
}

function rgbToHex(color) {
    if (color.charAt(0) == 'r') {
        color = color.replace('rgb(', '').replace(')', '').split(',');
        var r = parseInt(color[0], 10).toString(16);
        var g = parseInt(color[1], 10).toString(16);
        var b = parseInt(color[2], 10).toString(16);
        r = r.length == 1 ? '0' + r : r;
        g = g.length == 1 ? '0' + g : g;
        b = b.length == 1 ? '0' + b : b;
        return '#' + r + g + b;
    }
    return color;
}

function createBoardColor(container, colorValue) {
    const elem = document.createElement("div");
    elem.classList.add("color");
    elem.classList.add("selectable");
    elem.style.backgroundColor = colorValue;
    if (colorValue == "transparent") {
        elem.style.background = "url(images/checkers.png)"
    }
    elem.dataset.backgroundColor = colorValue;
    elem.onclick = function() {
        selectColor(elem);
    }
    container.appendChild(elem);
}

function selectColor(elem) {
    if (selectedElem == elem) return;
    if (selectedElem != null) {
        selectedElem.classList.remove("selected");
    }
    if (elem != null) {
        elem.classList.add("selected");
    }
    selectedElem = elem
}

function onPaintPressed(colorElem) {
    var newColorValue = colorElem.dataset.backgroundColor;
    var widgets = [];
    if (selectedElem != null) {
        widgets = widgetColors.get(selectedElem.dataset["backgroundColor"]);
        reColor(widgets, newColorValue, true, false);
    } else if (selectedWidgetsInfo != null && selectedWidgetsInfo.length > 0) {
        selectedWidgetsInfo.forEach((widgetInfo) => {
            var widget = allWidgets.find((e, i, arr) => {
                return e.id == widgetInfo.id
            });
            if (widget != null) {
                getAllColorsFromWidget(widget).forEach((color) => {
                    widgets.push(new WidgetColor(widget, color));
                });
            }
        })
        reColor(widgets, newColorValue, true, false);
    }
}

function reColor(widgets, newColorValue, updateAfter, optimize) {
    var updatedWidgets = []
    if (widgets != null && widgets.length > 0) {
        var changeBackground = optimize || isChecked("backgroundCheckbox");
        var changeBorder = optimize || isChecked("borderCheckbox");
        var changeText = optimize || isChecked("textCheckbox");
        widgets.forEach((widgetColor) => {
            var widget = widgetColor.widget
            var color = widgetColor.color
            if (changeBackground) {
                var attributes = ColorType["Background"]
                if (attributes.indexOf(color.type) >= 0) {
                    widget.style[color.type] = newColorValue;
                    updatedWidgets.push(widget);
                }
            }
            if (changeBorder) {
                var attributes = ColorType["Border"]
                if (attributes.indexOf(color.type) >= 0) {
                    widget.style[color.type] = newColorValue;
                    updatedWidgets.push(widget);
                }
            }
            if (changeText) {
                var attributes = ColorType["Text"]
                if (attributes.indexOf(color.type) >= 0) {
                    widget.style[color.type] = newColorValue;
                    updatedWidgets.push(widget);
                }
            }
        });
    }
    if (updateAfter == true) {
        return miro.board.widgets
            .update(updatedWidgets)
            .then(() => {
                miro.board.widgets.get().then(updateColorList)
            });
    } else {
        return miro.board.widgets.update(updatedWidgets)
    }
}

function isChecked(id) {
    return document.getElementById(id).checked == true;
}

function init() {
    var pallette = getPalletteContainer();
    for (var i = 0; i < pallette.childNodes.length; i++) {
        const node = pallette.childNodes[i].nextSibling;
        if (node != null && node.className == "color") {
            node.dataset.backgroundColor = node.style.backgroundColor;
            node.onclick = function() {
                onPaintPressed(node);
            }
        }
    }
    var optimizeButton = document.getElementById("optimizeButton");
    optimizeButton.onclick = optimizeBoardColors;
}

function optimizeBoardColors() {
    var boardWidgets = getSortedBoardWidgets().map((e) => {
        var hex = e[0];
        return {
            hex: hex,
            hsv: hex2hsv(hex),
            widgets: e[1]
        }
    });
    if (boardWidgets.length == 0) return;
    // color => list of WidgetColors
    var converts = new Map();
    var lastColor = boardWidgets[0];
    for (var i = 1; i < boardWidgets.length; ++i) {
        var color = boardWidgets[i];
        if (colorsAlmostEqual(lastColor.hsv, color.hsv)) {
            var list = [];
            if (converts.has(lastColor.hex)) {
                list = converts.get(lastColor.hex);
            }
            list.push(...color.widgets);
            converts.set(lastColor.hex, list);
        } else {
            lastColor = color;
        }
    }
    var updatePromise = null
    Array.from(converts.keys()).forEach((newColor) => {
        var widgets = converts.get(newColor)
        updatePromise = reColor(widgets, newColor, false, true);
    });
    if (updatePromise != null) {
        updatePromise.then(() => {
            miro.board.widgets.get().then(updateColorList)
        });
    }
}

function colorsAlmostEqual(hsv1, hsv2) {
    var maxHueDiff = 0.10;
    var maxSatDiff = 0.50;
    var maxValDiff = 0.15;
    return (Math.abs(hsv1.h - hsv2.h) <= 360 * maxHueDiff) &&
        (Math.abs(hsv1.s - hsv2.s) <= 100 * maxSatDiff) &&
        (Math.abs(hsv1.v - hsv2.v) <= 100 * maxValDiff)
}

function getSortedBoardColors() {
    return Array.from(widgetColors.keys())
        .sort((a, b) => {
            var r = getColorValue(a) - getColorValue(b)
            if (r > 0) return 1;
            if (r < 0) return -1;
            return 0;
        })
}

function getSortedBoardWidgets() {
    return Array.from(widgetColors.entries())
        .sort((e1, e2) => {
            var r = getColorValue(e1[0]) - getColorValue(e2[0])
            if (r > 0) return 1;
            if (r < 0) return -1;
            return 0;
        })
}

function hex2hsv(hex) {
    var rgb = hex2rgb(hex)
    return rgb2hsv(rgb.r, rgb.g, rgb.b);
}

function hex2rgb(hex) {
    var r = "0x" + hex.substr(1, 2);
    var g = "0x" + hex.substr(3, 2);
    var b = "0x" + hex.substr(5, 2);
    return { r: r, g: g, b: b }
}

function getColorValue(hexColor) {
    var hsv = hex2hsv(hexColor);
    return hsv.h * 50 + hsv.v * 5 + hsv.s;
}

function rgb2hsv(r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
        diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: percentRoundFn(s * 100),
        v: percentRoundFn(v * 100)
    };
}

miro.onReady(() => {
    selectedWidgetsInfo = null;
    miro.addListener('SELECTION_UPDATED', (e) => {
        selectedWidgetsInfo = e.data;
        miro.board.widgets.get().then(updateColorList);
    });
    miro.board.widgets.get().then(updateColorList);
})

document.addEventListener("DOMContentLoaded", function(event) {
    init();
});