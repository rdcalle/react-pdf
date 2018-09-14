'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var _objectWithoutProperties = _interopDefault(require('babel-runtime/helpers/objectWithoutProperties'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _possibleConstructorReturn = _interopDefault(require('babel-runtime/helpers/possibleConstructorReturn'));
var _inherits = _interopDefault(require('babel-runtime/helpers/inherits'));
var React = require('react');
var React__default = _interopDefault(React);
var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _Promise = _interopDefault(require('babel-runtime/core-js/promise'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var ReactFiberReconciler = _interopDefault(require('react-reconciler'));
var emptyObject = _interopDefault(require('fbjs/lib/emptyObject'));
var PDFDocument = require('@react-pdf/pdfkit');
var PDFDocument__default = _interopDefault(PDFDocument);
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var _Object$keys = _interopDefault(require('babel-runtime/core-js/object/keys'));
var isUrl = _interopDefault(require('is-url'));
var fontkit = _interopDefault(require('@react-pdf/fontkit'));
var fetch = _interopDefault(require('isomorphic-fetch'));
var _Array$from = _interopDefault(require('babel-runtime/core-js/array/from'));
var emojiRegex = _interopDefault(require('emoji-regex'));
var textkitCore = require('@react-pdf/textkit-core');
var scriptItemizer = _interopDefault(require('@react-pdf/script-itemizer'));
var justificationEngine = _interopDefault(require('@textkit/justification-engine'));
var textDecorationEngine = _interopDefault(require('@textkit/text-decoration-engine'));
var lineFragmentGenerator = _interopDefault(require('@textkit/line-fragment-generator'));
var _getIterator = _interopDefault(require('babel-runtime/core-js/get-iterator'));
var createLinebreaker = _interopDefault(require('@textkit/linebreaker'));
var english = _interopDefault(require('hyphenation.en-us'));
var Hypher = _interopDefault(require('hypher'));
var _JSON$stringify = _interopDefault(require('babel-runtime/core-js/json/stringify'));
var _typeof = _interopDefault(require('babel-runtime/helpers/typeof'));
var PNG = _interopDefault(require('@react-pdf/png-js'));
var _Object$assign = _interopDefault(require('babel-runtime/core-js/object/assign'));
var warning = _interopDefault(require('fbjs/lib/warning'));
var Yoga = _interopDefault(require('yoga-layout'));
var toPairsIn = _interopDefault(require('lodash.topairsin'));
var isFunction = _interopDefault(require('lodash.isfunction'));
var upperFirst = _interopDefault(require('lodash.upperfirst'));
var pick = _interopDefault(require('lodash.pick'));
var merge = _interopDefault(require('lodash.merge'));
var matchMedia = _interopDefault(require('media-engine'));
var createPDFRenderer = _interopDefault(require('@textkit/pdf-renderer'));
var BlobStream = _interopDefault(require('blob-stream'));

var inheritedProperties = ['color', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'textAlign', 'visibility', 'wordSpacing'];

var flatStyles = function flatStyles(stylesArray) {
  return stylesArray.reduce(function (acc, style) {
    return _extends({}, acc, style);
  }, {});
};

var standardFonts = ['Courier', 'Courier-Bold', 'Courier-Oblique', 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Times-Roman', 'Times-Bold', 'Times-Italic'];

var Buffer = require('buffer/').Buffer;

var fetchFont = function fetchFont(src) {
  return fetch(src).then(function (response) {
    if (response.buffer) {
      return response.buffer();
    }
    return response.arrayBuffer();
  }).then(function (arrayBuffer) {
    return Buffer.from(arrayBuffer);
  });
};

var fonts = {};
var emojiSource = void 0;
var hyphenationCallback = void 0;

var register = function register(src, _ref) {
  var family = _ref.family,
      otherOptions = _objectWithoutProperties(_ref, ['family']);

  fonts[family] = _extends({
    src: src,
    loaded: false,
    loading: false,
    data: null
  }, otherOptions);
};

var registerHyphenationCallback = function registerHyphenationCallback(callback) {
  hyphenationCallback = callback;
};

var registerEmojiSource = function registerEmojiSource(_ref2) {
  var url = _ref2.url,
      _ref2$format = _ref2.format,
      format = _ref2$format === undefined ? 'png' : _ref2$format;

  emojiSource = { url: url, format: format };
};

var getRegisteredFonts = function getRegisteredFonts() {
  return _Object$keys(fonts);
};

var getFont = function getFont(family) {
  return fonts[family];
};

var getEmojiSource = function getEmojiSource() {
  return emojiSource;
};

var getHyphenationCallback = function getHyphenationCallback() {
  return hyphenationCallback;
};

var load = function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(fontFamily, doc) {
    var font, data;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            font = fonts[fontFamily];

            // We cache the font to avoid fetching it many time

            if (!(font && !font.data && !font.loading)) {
              _context.next = 11;
              break;
            }

            font.loading = true;

            if (!isUrl(font.src)) {
              _context.next = 10;
              break;
            }

            _context.next = 6;
            return fetchFont(font.src);

          case 6:
            data = _context.sent;

            font.data = fontkit.create(data);
            _context.next = 11;
            break;

          case 10:
            font.data = fontkit.openSync(font.src);

          case 11:

            // If the font wasn't added to the document yet (aka. loaded), we do.
            // This prevents calling `registerFont` many times for the same font.
            // Fonts loaded state will be resetted after document is closed.
            if (font && !font.loaded) {
              font.loaded = true;
              doc.registerFont(fontFamily, font.data);
            }

            if (!(!font && !standardFonts.includes(fontFamily))) {
              _context.next = 14;
              break;
            }

            throw new Error('Font family not registered: ' + fontFamily + '. Please register it calling Font.register() method.');

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function load(_x, _x2) {
    return _ref3.apply(this, arguments);
  };
}();

var reset = function reset() {
  for (var font in fonts) {
    if (fonts.hasOwnProperty(font)) {
      fonts[font].loaded = false;
    }
  }
};

var clear = function clear() {
  fonts = {};
};

var Font = {
  register: register,
  getEmojiSource: getEmojiSource,
  getRegisteredFonts: getRegisteredFonts,
  registerEmojiSource: registerEmojiSource,
  registerHyphenationCallback: registerHyphenationCallback,
  getHyphenationCallback: getHyphenationCallback,
  getFont: getFont,
  load: load,
  clear: clear,
  reset: reset
};

var StandardFont = function () {
  function StandardFont(src) {
    _classCallCheck(this, StandardFont);

    this.name = src;
    this.src = PDFDocument.PDFFont.open(null, src);
    this.glyphs = {};
  }

  StandardFont.prototype.layout = function layout(str) {
    var _this = this;

    var _src$encode = this.src.encode(str),
        encoded = _src$encode[0],
        positions = _src$encode[1];

    return {
      positions: positions,
      stringIndices: positions.map(function (_, i) {
        return i;
      }),
      glyphs: encoded.map(function (g, i) {
        var glyph = _this.getGlyph(parseInt(g, 16));
        glyph.advanceWidth = positions[i].advanceWidth;
        return glyph;
      })
    };
  };

  StandardFont.prototype.glyphForCodePoint = function glyphForCodePoint(codePoint) {
    var glyph = this.getGlyph(codePoint);
    glyph.advanceWidth = 400;
    return glyph;
  };

  StandardFont.prototype.getGlyph = function getGlyph(id) {
    if (!this.glyphs[id]) {
      this.glyphs[id] = this.src.font.characterToGlyph(id);
    }

    return {
      id: id,
      _font: this.src,
      name: this.glyphs[id]
    };
  };

  StandardFont.prototype.hasGlyphForCodePoint = function hasGlyphForCodePoint(codePoint) {
    return this.src.font.characterToGlyph(codePoint) !== '.notdef';
  };

  _createClass(StandardFont, [{
    key: 'ascent',
    get: function get() {
      return this.src.ascender;
    }
  }, {
    key: 'descent',
    get: function get() {
      return this.src.descender;
    }
  }, {
    key: 'lineGap',
    get: function get() {
      return this.src.lineGap;
    }
  }, {
    key: 'unitsPerEm',
    get: function get() {
      return 1000;
    }
  }]);

  return StandardFont;
}();

var fontSubstitutionEngine = (function () {
  return function (_ref) {
    var Run = _ref.Run;
    return function () {
      function FontSubstitutionEngine() {
        _classCallCheck(this, FontSubstitutionEngine);

        this.fallbackFontInstance = null;
      }

      FontSubstitutionEngine.prototype.getRuns = function getRuns(string, runs) {
        var res = [];
        var lastFont = null;
        var lastIndex = 0;
        var index = 0;

        for (var _iterator = runs, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
          var _ref2;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref2 = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref2 = _i.value;
          }

          var run = _ref2;

          var defaultFont = void 0;

          if (typeof run.attributes.font === 'string') {
            defaultFont = new StandardFont(run.attributes.font);
          } else {
            defaultFont = run.attributes.font;
          }

          if (string.length === 0) {
            res.push(new Run(0, 0, { font: defaultFont }));
            break;
          }

          for (var _iterator2 = string.slice(run.start, run.end), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
            var _ref3;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref3 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref3 = _i2.value;
            }

            var char = _ref3;

            var codePoint = char.codePointAt();
            var font = defaultFont;

            // If the default font does not have a glyph
            // and the fallback font does, we use it
            if (!defaultFont.hasGlyphForCodePoint(codePoint) && this.fallbackFont.hasGlyphForCodePoint(codePoint)) {
              font = this.fallbackFont;
            }

            if (font !== lastFont) {
              if (lastFont) {
                res.push(new Run(lastIndex, index, { font: lastFont }));
              }

              lastFont = font;
              lastIndex = index;
            }

            index += char.length;
          }
        }

        if (lastIndex < string.length) {
          res.push(new Run(lastIndex, string.length, { font: lastFont }));
        }

        return res;
      };

      _createClass(FontSubstitutionEngine, [{
        key: 'fallbackFont',
        get: function get() {
          if (!this.fallbackFontInstance) {
            this.fallbackFontInstance = new StandardFont('Helvetica');
          }

          return this.fallbackFontInstance;
        }
      }]);

      return FontSubstitutionEngine;
    }();
  };
});

var Node = function () {
  function Node(data) {
    _classCallCheck(this, Node);

    this.prev = null;
    this.next = null;
    this.data = data;
  }

  Node.prototype.toString = function toString() {
    return this.data.toString();
  };

  return Node;
}();

var LinkedList = function () {
  function LinkedList() {
    _classCallCheck(this, LinkedList);

    this.head = null;
    this.tail = null;
    this.listSize = 0;
  }

  LinkedList.prototype.isLinked = function isLinked(node) {
    return !(node && node.prev === null && node.next === null && this.tail !== node && this.head !== node || this.isEmpty());
  };

  LinkedList.prototype.size = function size() {
    return this.listSize;
  };

  LinkedList.prototype.isEmpty = function isEmpty() {
    return this.listSize === 0;
  };

  LinkedList.prototype.first = function first() {
    return this.head;
  };

  LinkedList.prototype.last = function last() {
    return this.last;
  };

  LinkedList.prototype.toString = function toString() {
    return this.toArray().toString();
  };

  LinkedList.prototype.toArray = function toArray() {
    var node = this.head;
    var result = [];

    while (node !== null) {
      result.push(node);
      node = node.next;
    }
    return result;
  };

  LinkedList.prototype.forEach = function forEach(fun) {
    var node = this.head;

    while (node !== null) {
      fun(node);
      node = node.next;
    }
  };

  LinkedList.prototype.contains = function contains(n) {
    var node = this.head;

    if (!this.isLinked(n)) {
      return false;
    }
    while (node !== null) {
      if (node === n) {
        return true;
      }
      node = node.next;
    }
    return false;
  };

  LinkedList.prototype.at = function at(i) {
    var node = this.head;
    var index = 0;

    if (i >= this.listLength || i < 0) {
      return null;
    }

    while (node !== null) {
      if (i === index) {
        return node;
      }
      node = node.next;
      index += 1;
    }
    return null;
  };

  LinkedList.prototype.insertAfter = function insertAfter(node, newNode) {
    if (!this.isLinked(node)) {
      return this;
    }
    newNode.prev = node;
    newNode.next = node.next;
    if (node.next === null) {
      this.tail = newNode;
    } else {
      node.next.prev = newNode;
    }
    node.next = newNode;
    this.listSize += 1;
    return this;
  };

  LinkedList.prototype.insertBefore = function insertBefore(node, newNode) {
    if (!this.isLinked(node)) {
      return this;
    }
    newNode.prev = node.prev;
    newNode.next = node;
    if (node.prev === null) {
      this.head = newNode;
    } else {
      node.prev.next = newNode;
    }
    node.prev = newNode;
    this.listSize += 1;
    return this;
  };

  LinkedList.prototype.push = function push(node) {
    if (this.head === null) {
      this.unshift(node);
    } else {
      this.insertAfter(this.tail, node);
    }
    return this;
  };

  LinkedList.prototype.unshift = function unshift(node) {
    if (this.head === null) {
      this.head = node;
      this.tail = node;
      node.prev = null;
      node.next = null;
      this.listSize += 1;
    } else {
      this.insertBefore(this.head, node);
    }
    return this;
  };

  LinkedList.prototype.remove = function remove(node) {
    if (!this.isLinked(node)) {
      return this;
    }
    if (node.prev === null) {
      this.head = node.next;
    } else {
      node.prev.next = node.next;
    }
    if (node.next === null) {
      this.tail = node.prev;
    } else {
      node.next.prev = node.prev;
    }
    this.listSize -= 1;
    return this;
  };

  LinkedList.prototype.pop = function pop() {
    var node = this.tail;
    this.tail.prev.next = null;
    this.tail = this.tail.prev;
    this.listSize -= 1;
    node.prev = null;
    node.next = null;
    return node;
  };

  LinkedList.prototype.shift = function shift() {
    var node = this.head;
    this.head.next.prev = null;
    this.head = this.head.next;
    this.listSize -= 1;
    node.prev = null;
    node.next = null;
    return node;
  };

  return LinkedList;
}();

LinkedList.Node = Node;

/**
 * @preserve Knuth and Plass line breaking algorithm in JavaScript
 *
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * All rights reserved.
 */
var linebreak = function linebreak(nodes, lines, settings) {
  var options = {
    demerits: {
      line: settings && settings.demerits && settings.demerits.line || 10,
      flagged: settings && settings.demerits && settings.demerits.flagged || 100,
      fitness: settings && settings.demerits && settings.demerits.fitness || 3000
    },
    tolerance: settings && settings.tolerance || 3
  };
  var activeNodes = new LinkedList();
  var sum = {
    width: 0,
    stretch: 0,
    shrink: 0
  };
  var lineLengths = lines;
  var breaks = [];
  var tmp = {
    data: {
      demerits: Infinity
    }
  };

  function breakpoint(position, demerits, ratio, line, fitnessClass, totals, previous) {
    return {
      position: position,
      demerits: demerits,
      ratio: ratio,
      line: line,
      fitnessClass: fitnessClass,
      totals: totals || {
        width: 0,
        stretch: 0,
        shrink: 0
      },
      previous: previous
    };
  }

  function computeCost(start, end, active, currentLine) {
    var width = sum.width - active.totals.width;
    var stretch = 0;
    var shrink = 0;
    // If the current line index is within the list of linelengths, use it, otherwise use
    // the last line length of the list.
    var lineLength = currentLine < lineLengths.length ? lineLengths[currentLine - 1] : lineLengths[lineLengths.length - 1];

    if (nodes[end].type === 'penalty') {
      width += nodes[end].width;
    }

    if (width < lineLength) {
      // Calculate the stretch ratio
      stretch = sum.stretch - active.totals.stretch;

      if (stretch > 0) {
        return (lineLength - width) / stretch;
      }

      return linebreak.infinity;
    } else if (width > lineLength) {
      // Calculate the shrink ratio
      shrink = sum.shrink - active.totals.shrink;

      if (shrink > 0) {
        return (lineLength - width) / shrink;
      }

      return linebreak.infinity;
    }

    // perfect match
    return 0;
  }

  // Add width, stretch and shrink values from the current
  // break point up to the next box or forced penalty.
  function computeSum(breakPointIndex) {
    var result = {
      width: sum.width,
      stretch: sum.stretch,
      shrink: sum.shrink
    };

    for (var i = breakPointIndex; i < nodes.length; i += 1) {
      if (nodes[i].type === 'glue') {
        result.width += nodes[i].width;
        result.stretch += nodes[i].stretch;
        result.shrink += nodes[i].shrink;
      } else if (nodes[i].type === 'box' || nodes[i].type === 'penalty' && nodes[i].penalty === -linebreak.infinity && i > breakPointIndex) {
        break;
      }
    }
    return result;
  }

  // The main loop of the algorithm
  function mainLoop(node, index, nodes) {
    var active = activeNodes.first();
    var next = null;
    var ratio = 0;
    var demerits = 0;
    var candidates = [];
    var badness = void 0;
    var currentLine = 0;
    var tmpSum = void 0;
    var currentClass = 0;
    var fitnessClass = void 0;
    var candidate = void 0;
    var newNode = void 0;

    // The inner loop iterates through all the active nodes with line < currentLine and then
    // breaks out to insert the new active node candidates before looking at the next active
    // nodes for the next lines. The result of this is that the active node list is always
    // sorted by line number.
    while (active !== null) {
      candidates = [{
        demerits: Infinity
      }, {
        demerits: Infinity
      }, {
        demerits: Infinity
      }, {
        demerits: Infinity
      }];

      // Iterate through the linked list of active nodes to find new potential active nodes
      // and deactivate current active nodes.
      while (active !== null) {
        next = active.next;
        currentLine = active.data.line + 1;
        ratio = computeCost(active.data.position, index, active.data, currentLine);

        // Deactive nodes when the distance between the current active node and the
        // current node becomes too large (i.e. it exceeds the stretch limit and the stretch
        // ratio becomes negative) or when the current node is a forced break (i.e. the end
        // of the paragraph when we want to remove all active nodes, but possibly have a final
        // candidate active node---if the paragraph can be set using the given tolerance value.)
        if (ratio < -1 || node.type === 'penalty' && node.penalty === -linebreak.infinity) {
          activeNodes.remove(active);
        }

        // If the ratio is within the valid range of -1 <= ratio <= tolerance calculate the
        // total demerits and record a candidate active node.
        if (ratio >= -1 && ratio <= options.tolerance) {
          badness = 100 * Math.pow(Math.abs(ratio), 3);

          // Positive penalty
          if (node.type === 'penalty' && node.penalty >= 0) {
            demerits = Math.pow(options.demerits.line + badness, 2) + Math.pow(node.penalty, 2);
            // Negative penalty but not a forced break
          } else if (node.type === 'penalty' && node.penalty !== -linebreak.infinity) {
            demerits = Math.pow(options.demerits.line + badness, 2) - Math.pow(node.penalty, 2);
            // All other cases
          } else {
            demerits = Math.pow(options.demerits.line + badness, 2);
          }

          if (node.type === 'penalty' && nodes[active.data.position].type === 'penalty') {
            demerits += options.demerits.flagged * node.flagged * nodes[active.data.position].flagged;
          }

          // Calculate the fitness class for this candidate active node.
          if (ratio < -0.5) {
            currentClass = 0;
          } else if (ratio <= 0.5) {
            currentClass = 1;
          } else if (ratio <= 1) {
            currentClass = 2;
          } else {
            currentClass = 3;
          }

          // Add a fitness penalty to the demerits if the fitness classes of two adjacent lines
          // differ too much.
          if (Math.abs(currentClass - active.data.fitnessClass) > 1) {
            demerits += options.demerits.fitness;
          }

          // Add the total demerits of the active node to get the total demerits of this candidate node.
          demerits += active.data.demerits;

          // Only store the best candidate for each fitness class
          if (demerits < candidates[currentClass].demerits) {
            candidates[currentClass] = {
              active: active,
              demerits: demerits,
              ratio: ratio
            };
          }
        }

        active = next;

        // Stop iterating through active nodes to insert new candidate active nodes in the active list
        // before moving on to the active nodes for the next line.
        // TODO: The Knuth and Plass paper suggests a conditional for currentLine < j0. This means paragraphs
        // with identical line lengths will not be sorted by line number. Find out if that is a desirable outcome.
        // For now I left this out, as it only adds minimal overhead to the algorithm and keeping the active node
        // list sorted has a higher priority.
        if (active !== null && active.data.line >= currentLine) {
          break;
        }
      }

      tmpSum = computeSum(index);

      for (fitnessClass = 0; fitnessClass < candidates.length; fitnessClass += 1) {
        candidate = candidates[fitnessClass];

        if (candidate.demerits < Infinity) {
          newNode = new LinkedList.Node(breakpoint(index, candidate.demerits, candidate.ratio, candidate.active.data.line + 1, fitnessClass, tmpSum, candidate.active));
          if (active !== null) {
            activeNodes.insertBefore(active, newNode);
          } else {
            activeNodes.push(newNode);
          }
        }
      }
    }
  }

  // Add an active node for the start of the paragraph.
  activeNodes.push(new LinkedList.Node(breakpoint(0, 0, 0, 0, 0, undefined, null)));

  nodes.forEach(function (node, index, nodes) {
    if (node.type === 'box') {
      sum.width += node.width;
    } else if (node.type === 'glue') {
      if (index > 0 && nodes[index - 1].type === 'box') {
        mainLoop(node, index, nodes);
      }
      sum.width += node.width;
      sum.stretch += node.stretch;
      sum.shrink += node.shrink;
    } else if (node.type === 'penalty' && node.penalty !== linebreak.infinity) {
      mainLoop(node, index, nodes);
    }
  });

  if (activeNodes.size() !== 0) {
    // Find the best active node (the one with the least total demerits.)
    activeNodes.forEach(function (node) {
      if (node.data.demerits < tmp.data.demerits) {
        tmp = node;
      }
    });

    while (tmp !== null) {
      breaks.push({
        position: tmp.data.position,
        ratio: tmp.data.ratio
      });
      tmp = tmp.data.previous;
    }
    return breaks.reverse();
  }
  return [];
};

linebreak.infinity = 10000;

linebreak.glue = function (width, stretch, shrink) {
  return {
    type: 'glue',
    width: width,
    stretch: stretch,
    shrink: shrink
  };
};

linebreak.box = function (width, value) {
  var hyphenated = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  return {
    type: 'box',
    width: width,
    value: value,
    hyphenated: hyphenated
  };
};

linebreak.penalty = function (width, penalty, flagged) {
  return {
    type: 'penalty',
    width: width,
    penalty: penalty,
    flagged: flagged
  };
};

var SOFT_HYPHEN_HEX = '\xAD';
var NO_BREAK_SPACE_DECIMAL = 160;

var getWords = function getWords(glyphString) {
  var words = [];
  var start = glyphString.start;

  var lastIndex = 0;

  for (var _iterator = glyphString, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
    var _ref2;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref2 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref2 = _i.value;
    }

    var _ref = _ref2;
    var index = _ref.index;

    var codePoint = glyphString.codePointAtGlyphIndex(index);

    // Not break words in no-break-spaces
    if (codePoint === NO_BREAK_SPACE_DECIMAL) {
      continue;
    }

    if (glyphString.isWhiteSpace(index - start)) {
      var _word = glyphString.slice(lastIndex, index - start);

      if (_word.length > 0) {
        words.push(_word);
      }

      lastIndex = index - start + 1;
    }
  }

  if (lastIndex < glyphString.end) {
    var word = glyphString.slice(lastIndex, glyphString.end - glyphString.start);
    words.push(word);
  }

  return words;
};

var h = new Hypher(english);
var hyphenateString = function hyphenateString(string) {
  if (string.includes(SOFT_HYPHEN_HEX)) {
    return string.split(SOFT_HYPHEN_HEX);
  }

  return h.hyphenate(string);
};

var hyphenateWord = function hyphenateWord(glyphString) {
  var hyphenated = hyphenateString(glyphString.string);

  var index = 0;
  var parts = hyphenated.map(function (part) {
    var res = glyphString.slice(index, index + part.length);
    index += part.length;
    return res;
  });

  return parts;
};

var hyphenate = function hyphenate(words) {
  return words.map(function (word) {
    return hyphenateWord(word);
  });
};

var formatter = function formatter(measureText, textAlign, callback) {
  var spaceWidth = measureText(' ');
  var hyphenWidth = measureText('-');
  var hyphenPenalty = !textAlign || textAlign === 'justify' ? 100 : 600;
  var opts = {
    width: 3,
    stretch: 6,
    shrink: 9
  };

  return function (glyphString) {
    var nodes = [];
    var words = getWords(glyphString);
    var spaceStretch = spaceWidth * opts.width / opts.stretch;
    var spaceShrink = spaceWidth * opts.width / opts.shrink;
    var hyphenationCallback = callback || hyphenate;
    var hyphenatedWords = hyphenationCallback(words, glyphString);

    hyphenatedWords.forEach(function (word, index, array) {
      if (word.length > 1) {
        word.forEach(function (part, partIndex, partArray) {
          var isLastPart = partIndex === word.length - 1;

          nodes.push(linebreak.box(measureText(part), part, !isLastPart));

          if (partIndex !== partArray.length - 1) {
            nodes.push(linebreak.penalty(hyphenWidth, hyphenPenalty, 1));
          }
        });
      } else {
        nodes.push(linebreak.box(measureText(word[0]), word[0]));
      }
      if (index === array.length - 1) {
        nodes.push(linebreak.glue(0, linebreak.infinity, 0));
        nodes.push(linebreak.penalty(0, -linebreak.infinity, 1));
      } else {
        nodes.push(linebreak.glue(spaceWidth, spaceStretch, spaceShrink));
      }
    });

    return nodes;
  };
};

var HYPHEN = 0x002d;
var TOLERANCE_LIMIT = 40;

var lineBreaker = (function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      hyphenationCallback = _ref.hyphenationCallback;

  return function (Textkit) {
    var TextkitLinebreaker = createLinebreaker()(Textkit);
    var fallbackLinebreaker = new TextkitLinebreaker();

    return function () {
      function KPLineBreaker(tolerance) {
        _classCallCheck(this, KPLineBreaker);

        this.tolerance = tolerance || 4;
      }

      KPLineBreaker.prototype.suggestLineBreak = function suggestLineBreak(glyphString, width, paragraphStyle) {
        var tolerance = this.tolerance;
        var measuredWidth = this.measureWidth(glyphString);
        var nodes = formatter(measuredWidth, paragraphStyle.align, hyphenationCallback)(glyphString);
        var breaks = [];

        // Try again with a higher tolerance if the line breaking failed.
        while (breaks.length === 0 && tolerance < TOLERANCE_LIMIT) {
          breaks = linebreak(nodes, [width], { tolerance: tolerance });
          tolerance += 2;
        }

        // Fallback to textkit default's linebreaking algorithm if K&P fails
        if (breaks.length === 0) {
          var fallback = fallbackLinebreaker.suggestLineBreak(glyphString, width, paragraphStyle);
          if (fallback) return fallback;

          // If fallback didn't worked, we split workd based on width
          var index = glyphString.glyphIndexAtOffset(width) - 1;
          glyphString.insertGlyph(index, HYPHEN);
          return { position: index + 1 };
        }

        if (!breaks[1]) {
          return { position: glyphString.end };
        }

        var breakNode = this.findBreakNode(nodes, breaks[1].position);
        var breakIndex = breakNode.value.end - glyphString.start;

        if (breakNode.hyphenated) {
          glyphString.insertGlyph(breakIndex, HYPHEN);
          return { position: breakIndex + 1 };
        }

        // We kep the blank space at the end of the line to avoid justification issues
        var offset = glyphString.isWhiteSpace(breakIndex) ? 1 : 0;
        return { position: breakIndex + offset };
      };

      KPLineBreaker.prototype.measureWidth = function measureWidth(glyphString) {
        var _glyphString$glyphRun = glyphString.glyphRuns[0].attributes,
            font = _glyphString$glyphRun.font,
            fontSize = _glyphString$glyphRun.fontSize;


        return function (word) {
          if (typeof word === 'string') {
            var scale = fontSize / font.unitsPerEm;
            return font.layout(word).positions[0].xAdvance * scale;
          }

          return word.advanceWidth;
        };
      };

      KPLineBreaker.prototype.findBreakNode = function findBreakNode(nodes, position) {
        var index = position - 1;

        while (!nodes[index].value) {
          index -= 1;
        }

        return nodes[index];
      };

      return KPLineBreaker;
    }();
  };
});

// justificationEngine values
var shrinkWhitespaceFactor = { before: -0.5, after: -0.5 };

var LayoutEngine$1 = function (_BaseLayoutEngine) {
  _inherits(LayoutEngine$$1, _BaseLayoutEngine);

  function LayoutEngine$$1(_ref) {
    var hyphenationCallback = _ref.hyphenationCallback;

    _classCallCheck(this, LayoutEngine$$1);

    var engines = {
      scriptItemizer: scriptItemizer(),
      decorationEngine: textDecorationEngine(),
      lineFragmentGenerator: lineFragmentGenerator(),
      fontSubstitutionEngine: fontSubstitutionEngine(),
      lineBreaker: lineBreaker({ hyphenationCallback: hyphenationCallback }),
      justificationEngine: justificationEngine({ shrinkWhitespaceFactor: shrinkWhitespaceFactor })
    };

    return _possibleConstructorReturn(this, _BaseLayoutEngine.call(this, engines));
  }

  return LayoutEngine$$1;
}(textkitCore.LayoutEngine);

// Extracted from https://github.com/devongovett/pdfkit/blob/master/lib/image/jpeg.coffee

var MARKERS = [0xffc0, 0xffc1, 0xffc2, 0xffc3, 0xffc5, 0xffc6, 0xffc7, 0xffc8, 0xffc9, 0xffca, 0xffcb, 0xffcc, 0xffcd, 0xffce, 0xffcf];

var JPEG = function JPEG(data) {
  _classCallCheck(this, JPEG);

  this.data = null;
  this.width = null;
  this.height = null;

  this.data = data;

  if (data.readUInt16BE(0) !== 0xffd8) {
    throw new Error('SOI not found in JPEG');
  }

  var marker = void 0;
  var pos = 2;

  while (pos < data.length) {
    marker = data.readUInt16BE(pos);
    pos += 2;
    if (MARKERS.includes(marker)) {
      break;
    }
    pos += data.readUInt16BE(pos);
  }

  if (!MARKERS.includes(marker)) {
    throw new Error('Invalid JPEG.');
  }

  pos += 3;
  this.height = data.readUInt16BE(pos);

  pos += 2;
  this.width = data.readUInt16BE(pos);
};

var Buffer$1 = require('buffer/').Buffer;

function getImage(body, extension) {
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return new JPEG(body);
    case 'png':
      return new PNG(body);
    default:
      return null;
  }
}

var fetchImage = function fetchImage(src) {
  if ((typeof src === 'undefined' ? 'undefined' : _typeof(src)) === 'object') {
    if (src.data && src.format) {
      // Local file given
      return new _Promise(function (resolve, reject) {
        return resolve(getImage(src.data, src.format));
      });
    }
    throw new Error('Invalid data given for local file: ' + _JSON$stringify(src));
  }

  return fetch(src).then(function (response) {
    if (response.buffer) {
      return response.buffer();
    }
    return response.arrayBuffer();
  }).then(function (arrayBuffer) {
    if (arrayBuffer.constructor.name === 'Buffer') {
      return arrayBuffer;
    }
    return Buffer$1.from(arrayBuffer);
  }).then(function (body) {
    var isPng = body[0] === 137 && body[1] === 80 && body[2] === 78 && body[3] === 71 && body[4] === 13 && body[5] === 10 && body[6] === 26 && body[7] === 10;

    var isJpg = body[0] === 255 && body[1] === 216 && body[2] === 255;

    var extension = '';
    if (isPng) {
      extension = 'png';
    } else if (isJpg) {
      extension = 'jpg';
    } else {
      throw new Error('Not valid image extension');
    }

    return getImage(body, extension);
  }).catch(function () {
    throw new Error('Couldn\'t fetch image: ' + src);
  });
};

/* eslint-disable no-cond-assign */
// Caches emoji images data
var emojis = {};
var regex = emojiRegex();

var reflect = function reflect(promise) {
  return function () {
    return promise.apply(undefined, arguments).then(function (v) {
      return v;
    }, function (e) {
      return e;
    });
  };
};

var fetchEmojiImage = reflect(fetchImage);

var getCodePoints = function getCodePoints(string) {
  return _Array$from(string).map(function (char) {
    return char.codePointAt(0).toString(16);
  }).join('-');
};

var buildEmojiUrl = function buildEmojiUrl(emoji) {
  var _Font$getEmojiSource = Font.getEmojiSource(),
      url = _Font$getEmojiSource.url,
      format = _Font$getEmojiSource.format;

  return '' + url + getCodePoints(emoji) + '.' + format;
};

var fetchEmojis = function fetchEmojis(string) {
  var emojiSource = Font.getEmojiSource();

  if (!emojiSource || !emojiSource.url) return [];

  var promises = [];

  var match = void 0;

  var _loop = function _loop() {
    var emoji = match[0];

    if (!emojis[emoji] || emojis[emoji].loading) {
      var emojiUrl = buildEmojiUrl(emoji);

      emojis[emoji] = { loading: true };

      promises.push(fetchEmojiImage(emojiUrl).then(function (image) {
        emojis[emoji].loading = false;
        emojis[emoji].data = image.data;
      }));
    }
  };

  while (match = regex.exec(string)) {
    _loop();
  }

  return promises;
};

var embedEmojis = function embedEmojis(fragments) {
  var result = [];

  for (var i = 0; i < fragments.length; i++) {
    var fragment = fragments[i];

    var match = void 0;
    var lastIndex = 0;

    while (match = regex.exec(fragment.string)) {
      var index = match.index;
      var _emoji = match[0];
      var emojiSize = fragment.attributes.fontSize;
      var chunk = fragment.string.slice(lastIndex, index + match[0].length);

      // If emoji image was found, we create a new fragment with the
      // correct attachment and object substitution character;
      if (emojis[_emoji] && emojis[_emoji].data) {
        result.push({
          string: chunk.replace(match, textkitCore.Attachment.CHARACTER),
          attributes: _extends({}, fragment.attributes, {
            attachment: new textkitCore.Attachment(emojiSize, emojiSize, {
              yOffset: Math.floor(emojiSize * 0.1),
              image: emojis[_emoji].data
            })
          })
        });
      } else {
        // If no emoji data, we just replace the emoji with a nodef char
        result.push({
          string: chunk.replace(match, String.fromCharCode(0)),
          attributes: fragment.attributes
        });
      }

      lastIndex = index + _emoji.length;
    }

    if (lastIndex < fragment.string.length) {
      result.push({
        string: fragment.string.slice(lastIndex),
        attributes: fragment.attributes
      });
    }
  }

  return result;
};

var Document$2 = function () {
  function Document(root, props) {
    _classCallCheck(this, Document);

    this.root = root;
    this.props = props;
    this.children = [];
  }

  Document.prototype.appendChild = function appendChild(child) {
    child.parent = this;
    child.previousPage = this.children[this.children.length - 1];
    this.children.push(child);
  };

  Document.prototype.removeChild = function removeChild(child) {
    var i = this.children.indexOf(child);
    child.parent = null;

    if (this.children[i + 1]) {
      this.children[i + 1].previousPage = this.children[i].previousPage;
    }

    this.children.slice(i, 1);
  };

  Document.prototype.addMetaData = function addMetaData() {
    var _props = this.props,
        title = _props.title,
        author = _props.author,
        subject = _props.subject,
        keywords = _props.keywords,
        creator = _props.creator,
        producer = _props.producer;

    // The object keys need to start with a capital letter by the PDF spec

    if (title) {
      this.root.info.Title = title;
    }
    if (author) {
      this.root.info.Author = author;
    }
    if (subject) {
      this.root.info.Subject = subject;
    }
    if (keywords) {
      this.root.info.Keywords = keywords;
    }

    this.root.info.Creator = creator || 'react-pdf';
    this.root.info.Producer = producer || 'react-pdf';
  };

  Document.prototype.loadFonts = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var promises, listToExplore, node;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              promises = [];
              listToExplore = this.children.slice(0);


              while (listToExplore.length > 0) {
                node = listToExplore.shift();


                if (node.style && node.style.fontFamily) {
                  promises.push(Font.load(node.style.fontFamily, this.root));
                }

                if (node.children) {
                  node.children.forEach(function (childNode) {
                    listToExplore.push(childNode);
                  });
                }
              }

              _context.next = 5;
              return _Promise.all(promises);

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function loadFonts() {
      return _ref.apply(this, arguments);
    }

    return loadFonts;
  }();

  Document.prototype.loadEmojis = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var promises, listToExplore, node;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              promises = [];
              listToExplore = this.children.slice(0);


              while (listToExplore.length > 0) {
                node = listToExplore.shift();


                if (typeof node === 'string') {
                  promises.push.apply(promises, fetchEmojis(node));
                } else if (node.children) {
                  node.children.forEach(function (childNode) {
                    listToExplore.push(childNode);
                  });
                }
              }

              _context2.next = 5;
              return _Promise.all(promises);

            case 5:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function loadEmojis() {
      return _ref2.apply(this, arguments);
    }

    return loadEmojis;
  }();

  Document.prototype.loadImages = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
      var promises, listToExplore, node;
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              promises = [];
              listToExplore = this.children.slice(0);


              while (listToExplore.length > 0) {
                node = listToExplore.shift();


                if (node.name === 'Image') {
                  promises.push(node.fetch());
                }

                if (node.children) {
                  node.children.forEach(function (childNode) {
                    listToExplore.push(childNode);
                  });
                }
              }

              _context3.next = 5;
              return _Promise.all(promises);

            case 5:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function loadImages() {
      return _ref3.apply(this, arguments);
    }

    return loadImages;
  }();

  Document.prototype.loadAssets = function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _Promise.all([this.loadFonts(), this.loadImages()]);

            case 2:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function loadAssets() {
      return _ref4.apply(this, arguments);
    }

    return loadAssets;
  }();

  Document.prototype.applyProps = function applyProps() {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].applyProps();
    }
  };

  Document.prototype.wrapChildren = function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
      var i;
      return _regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              i = 0;

            case 1:
              if (!(i < this.children.length)) {
                _context5.next = 7;
                break;
              }

              _context5.next = 4;
              return this.children[i].wrapPage();

            case 4:
              i++;
              _context5.next = 1;
              break;

            case 7:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function wrapChildren() {
      return _ref5.apply(this, arguments);
    }

    return wrapChildren;
  }();

  Document.prototype.renderChildren = function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6() {
      var i;
      return _regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              i = 0;

            case 1:
              if (!(i < this.children.length)) {
                _context6.next = 7;
                break;
              }

              _context6.next = 4;
              return this.children[i].render();

            case 4:
              i++;
              _context6.next = 1;
              break;

            case 7:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function renderChildren() {
      return _ref6.apply(this, arguments);
    }

    return renderChildren;
  }();

  Document.prototype.render = function () {
    var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7() {
      return _regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.prev = 0;

              this.addMetaData();
              this.applyProps();
              _context7.next = 5;
              return this.loadEmojis();

            case 5:
              _context7.next = 7;
              return this.loadAssets();

            case 7:
              _context7.next = 9;
              return this.wrapChildren();

            case 9:
              _context7.next = 11;
              return this.renderChildren();

            case 11:
              this.root.end();
              Font.reset();
              _context7.next = 18;
              break;

            case 15:
              _context7.prev = 15;
              _context7.t0 = _context7['catch'](0);
              throw _context7.t0;

            case 18:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, this, [[0, 15]]);
    }));

    function render() {
      return _ref7.apply(this, arguments);
    }

    return render;
  }();

  _createClass(Document, [{
    key: 'name',
    get: function get() {
      return 'Document';
    }
  }, {
    key: 'pageCount',
    get: function get() {
      return this.children.reduce(function (acc, page) {
        return acc + page.subpagesCount;
      }, 0);
    }
  }]);

  return Document;
}();

Document$2.defaultProps = {
  author: null,
  keywords: null,
  subject: null,
  title: null
};

var ALMOST_ZERO = 0.000001;

var Node$1 = function () {
  function Node(root, props) {
    _classCallCheck(this, Node);

    this._top = null;
    this._left = null;
    this._width = null;
    this._heigth = null;
    this._padding = {};
    this._margin = {};

    this.layout = Yoga.Node.createDefault();
  }

  Node.prototype.reset = function reset() {
    this.top = null;
    this.left = null;
    this.width = null;
    this.height = null;
    this.padding = {};
    this.margin = {};
  };

  _createClass(Node, [{
    key: 'top',
    get: function get() {
      if (!this._top) {
        this._top = this.layout.getComputedLayout().top - this.marginTop;
      }

      return this._top;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._top = value;
    }
  }, {
    key: 'left',
    get: function get() {
      if (!this._left) {
        this._left = this.layout.getComputedLayout().left - this.marginLeft;
      }

      return this._left;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._left = value;
    }
  }, {
    key: 'width',
    get: function get() {
      if (!this._width) {
        this._width = this.layout.getComputedLayout().width + this.marginLeft + this.marginRight;
      }

      return this._width;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._width = value;
    }
  }, {
    key: 'height',
    get: function get() {
      if (!this._heigth) {
        this._heigth = this.layout.getComputedLayout().height + this.marginTop + this.marginBottom;
      }

      return this._heigth;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._heigth = value;
    }
  }, {
    key: 'paddingTop',
    get: function get() {
      if (!this._padding.top) {
        this._padding.top = this.layout.getComputedPadding(Yoga.EDGE_TOP);
      }

      return this._padding.top;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._padding.top = value;
    }
  }, {
    key: 'paddingRight',
    get: function get() {
      if (!this._padding.right) {
        this._padding.right = this.layout.getComputedPadding(Yoga.EDGE_RIGHT);
      }

      return this._padding.right;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._padding.right = value;
    }
  }, {
    key: 'paddingBottom',
    get: function get() {
      if (!this._padding.bottom) {
        this._padding.bottom = this.layout.getComputedPadding(Yoga.EDGE_BOTTOM);
      }

      return this._padding.bottom;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._padding.bottom = value;
    }
  }, {
    key: 'paddingLeft',
    get: function get() {
      if (!this._padding.left) {
        this._padding.left = this.layout.getComputedPadding(Yoga.EDGE_LEFT);
      }

      return this._padding.left;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._padding.left = value;
    }
  }, {
    key: 'marginTop',
    get: function get() {
      if (!this._margin.top) {
        this._margin.top = this.layout.getComputedMargin(Yoga.EDGE_TOP);
      }

      return this._margin.top;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._margin.top = value;
    }
  }, {
    key: 'marginRight',
    get: function get() {
      if (!this._margin.right) {
        this._margin.right = this.layout.getComputedMargin(Yoga.EDGE_RIGHT);
      }

      return this._margin.right;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._margin.right = value;
    }
  }, {
    key: 'marginBottom',
    get: function get() {
      if (!this._margin.bottom) {
        this._margin.bottom = this.layout.getComputedMargin(Yoga.EDGE_BOTTOM);
      }

      return this._margin.bottom;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._margin.bottom = value;
    }
  }, {
    key: 'marginLeft',
    get: function get() {
      if (!this._margin.left) {
        this._margin.left = this.layout.getComputedMargin(Yoga.EDGE_LEFT);
      }

      return this._margin.left;
    },
    set: function set(value) {
      if (value === 0) {
        value = ALMOST_ZERO;
      }

      this._margin.left = value;
    }
  }, {
    key: 'padding',
    get: function get() {
      return {
        top: this.paddingTop,
        right: this.paddingRight,
        bottom: this.paddingBottom,
        left: this.paddingLeft
      };
    },
    set: function set(value) {
      this._padding = value;
    }
  }, {
    key: 'margin',
    get: function get() {
      return {
        top: this.marginTop,
        right: this.marginRight,
        bottom: this.marginBottom,
        left: this.marginLeft
      };
    },
    set: function set(value) {
      this._margin = value;
    }
  }]);

  return Node;
}();

var yogaValue = function yogaValue(prop, value) {
  var isAlignType = function isAlignType(prop) {
    return prop === 'alignItems' || prop === 'alignContent' || prop === 'alignSelf';
  };

  switch (value) {
    case 'auto':
      if (prop === 'alignSelf') {
        return Yoga.ALIGN_AUTO;
      }
      break;
    case 'flex':
      return Yoga.DISPLAY_FLEX;
    case 'none':
      return Yoga.DISPLAY_NONE;
    case 'row':
      return Yoga.FLEX_DIRECTION_ROW;
    case 'row-reverse':
      return Yoga.FLEX_DIRECTION_ROW_REVERSE;
    case 'column':
      return Yoga.FLEX_DIRECTION_COLUMN;
    case 'column-reverse':
      return Yoga.FLEX_DIRECTION_COLUMN_REVERSE;
    case 'stretch':
      return Yoga.ALIGN_STRETCH;
    case 'baseline':
      return Yoga.ALIGN_BASELINE;
    case 'space-around':
      if (prop === 'justifyContent') {
        return Yoga.JUSTIFY_SPACE_AROUND;
      } else if (isAlignType(prop)) {
        return Yoga.ALIGN_SPACE_AROUND;
      }
      break;
    case 'space-between':
      if (prop === 'justifyContent') {
        return Yoga.JUSTIFY_SPACE_BETWEEN;
      } else if (isAlignType(prop)) {
        return Yoga.ALIGN_SPACE_BETWEEN;
      }
      break;
    case 'around':
      return Yoga.JUSTIFY_SPACE_AROUND;
    case 'between':
      return Yoga.JUSTIFY_SPACE_BETWEEN;
    case 'wrap':
      return Yoga.WRAP_WRAP;
    case 'wrap-reverse':
      return Yoga.WRAP_WRAP_REVERSE;
    case 'nowrap':
      return Yoga.WRAP_NO_WRAP;
    case 'flex-start':
      if (prop === 'justifyContent') {
        return Yoga.JUSTIFY_FLEX_START;
      } else if (isAlignType(prop)) {
        return Yoga.ALIGN_FLEX_START;
      }
      break;
    case 'flex-end':
      if (prop === 'justifyContent') {
        return Yoga.JUSTIFY_FLEX_END;
      } else if (isAlignType(prop)) {
        return Yoga.ALIGN_FLEX_END;
      }
      break;
    case 'center':
      if (prop === 'justifyContent') {
        return Yoga.JUSTIFY_CENTER;
      } else if (isAlignType(prop)) {
        return Yoga.ALIGN_CENTER;
      }
      break;
    default:
      return value;
  }
};

var hasOwnProperty = Object.prototype.hasOwnProperty;

var styleShortHands = {
  margin: {
    marginTop: true,
    marginRight: true,
    marginBottom: true,
    marginLeft: true
  },
  marginHorizontal: {
    marginLeft: true,
    marginRight: true
  },
  marginVertical: {
    marginTop: true,
    marginBottom: true
  },
  padding: {
    paddingTop: true,
    paddingRight: true,
    paddingBottom: true,
    paddingLeft: true
  },
  paddingHorizontal: {
    paddingLeft: true,
    paddingRight: true
  },
  paddingVertical: {
    paddingTop: true,
    paddingBottom: true
  },
  border: {
    borderTopColor: true,
    borderTopStyle: true,
    borderTopWidth: true,
    borderRightColor: true,
    borderRightStyle: true,
    borderRightWidth: true,
    borderBottomColor: true,
    borderBottomStyle: true,
    borderBottomWidth: true,
    borderLeftColor: true,
    borderLeftStyle: true,
    borderLeftWidth: true
  },
  borderTop: {
    borderTopColor: true,
    borderTopStyle: true,
    borderTopWidth: true
  },
  borderRight: {
    borderRightColor: true,
    borderRightStyle: true,
    borderRightWidth: true
  },
  borderBottom: {
    borderBottomColor: true,
    borderBottomStyle: true,
    borderBottomWidth: true
  },
  borderLeft: {
    borderLeftColor: true,
    borderLeftStyle: true,
    borderLeftWidth: true
  },
  borderColor: {
    borderTopColor: true,
    borderRightColor: true,
    borderBottomColor: true,
    borderLeftColor: true
  },
  borderRadius: {
    borderTopLeftRadius: true,
    borderTopRightRadius: true,
    borderBottomRightRadius: true,
    borderBottomLeftRadius: true
  },
  borderStyle: {
    borderTopStyle: true,
    borderRightStyle: true,
    borderBottomStyle: true,
    borderLeftStyle: true
  },
  borderWidth: {
    borderTopWidth: true,
    borderRightWidth: true,
    borderBottomWidth: true,
    borderLeftWidth: true
  }
};

// Expand the shorthand properties to isolate every declaration from the others.
var expandStyles = function expandStyles(style) {
  if (!style) return style;

  var propsArray = _Object$keys(style);
  var resolvedStyle = {};

  for (var i = 0; i < propsArray.length; i++) {
    var key = propsArray[i];
    var value = style[key];

    switch (key) {
      case 'display':
      case 'flex':
      case 'flexDirection':
      case 'flexWrap':
      case 'flexFlow':
      case 'flexGrow':
      case 'flexShrink':
      case 'flexBasis':
      case 'justifyContent':
      case 'alignSelf':
      case 'alignItems':
      case 'alignContent':
      case 'order':
        resolvedStyle[key] = yogaValue(key, value);
        break;
      case 'textAlignVertical':
        resolvedStyle.verticalAlign = value === 'center' ? 'middle' : value;
        break;
      case 'margin':
      case 'marginHorizontal':
      case 'marginVertical':
      case 'padding':
      case 'paddingHorizontal':
      case 'paddingVertical':
      case 'border':
      case 'borderTop':
      case 'borderRight':
      case 'borderBottom':
      case 'borderLeft':
      case 'borderColor':
      case 'borderRadius':
      case 'borderStyle':
      case 'borderWidth':
        {
          var expandedProps = styleShortHands[key];
          for (var propName in expandedProps) {
            if (hasOwnProperty.call(expandedProps, propName)) {
              resolvedStyle[propName] = value;
            }
          }
        }
        break;
      default:
        resolvedStyle[key] = value;
        break;
    }
  }

  return resolvedStyle;
};

var matchBorderShorthand = function matchBorderShorthand(value) {
  return value.match(/(\d+)px?\s(\S+)\s(\S+)/);
};

// Transforms shorthand border values to correct value
var processBorders = function processBorders(style) {
  var propsArray = _Object$keys(style);
  var resolvedStyle = {};

  for (var i = 0; i < propsArray.length; i++) {
    var key = propsArray[i];
    var value = style[key];

    if (typeof value === 'string' && key.match(/border/)) {
      var match = matchBorderShorthand(value);

      if (match) {
        if (key.match(/.Color/)) {
          resolvedStyle[key] = match[3];
        } else if (key.match(/.Style/)) {
          resolvedStyle[key] = match[2];
        } else if (key.match(/.Width/)) {
          resolvedStyle[key] = match[1];
        } else {
          throw new Error('StyleSheet: Invalid \'' + value + '\' for \'' + key + '\'');
        }
      } else {
        resolvedStyle[key] = value;
      }
    } else {
      resolvedStyle[key] = value;
    }
  }

  return resolvedStyle;
};

var transformStyles = function transformStyles(style) {
  return processBorders(expandStyles(style));
};

var create = function create(styles) {
  return styles;
};

var flatten = function flatten(input) {
  if (!Array.isArray(input)) {
    input = [input];
  }

  var result = input.reduce(function (acc, style) {
    if (style) {
      _Object$keys(style).forEach(function (key) {
        if (style[key] !== null || style[key] !== undefined) {
          acc[key] = style[key];
        }
      });
    }

    return acc;
  }, {});

  return result;
};

var resolveMediaQueries = function resolveMediaQueries(input, container) {
  var result = _Object$keys(input).reduce(function (acc, key) {
    var _extends2;

    if (/@media/.test(key)) {
      var _matchMedia;

      return _extends({}, acc, matchMedia((_matchMedia = {}, _matchMedia[key] = input[key], _matchMedia), container));
    }

    return _extends({}, acc, (_extends2 = {}, _extends2[key] = input[key], _extends2));
  }, {});

  return result;
};

var resolve = function resolve(styles, container) {
  if (!styles) {
    return null;
  }

  styles = flatten(styles);
  styles = resolveMediaQueries(styles, container);

  return transformStyles(styles);
};

var absoluteFillObject = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
};

var StyleSheet = {
  hairlineWidth: 1,
  create: create,
  resolve: resolve,
  flatten: flatten,
  absoluteFillObject: absoluteFillObject
};

var Debug = {
  debugText: function debugText(layout) {
    this.root.fontSize(4);
    this.root.opacity(1);
    this.root.fillColor('black');
    this.root.text(layout.width + ' x ' + layout.height, layout.left, Math.max(layout.top - 4, 0));
  },
  debugContent: function debugContent(layout, margin, padding) {
    this.root.fillColor('#a1c6e7');
    this.root.opacity(0.5);
    this.root.rect(layout.left + padding.left + margin.left, layout.top + padding.top + margin.top, layout.width - padding.left - padding.right - margin.left - margin.right, layout.height - padding.top - padding.bottom - margin.top - margin.bottom).fill();
  },
  debugPadding: function debugPadding(layout, margin, padding) {
    this.root.fillColor('#c4deb9');
    this.root.opacity(0.5);

    // Padding top
    this.root.rect(layout.left + margin.left + padding.left, layout.top + margin.top, layout.width - padding.right - padding.left - margin.left - margin.right, padding.top).fill();

    // Padding left
    this.root.rect(layout.left + margin.left, layout.top + margin.top, padding.left, layout.height - margin.top - margin.bottom).fill();

    // Padding right
    this.root.rect(layout.left + layout.width - padding.right - margin.right, layout.top + margin.top, padding.right, layout.height - margin.top - margin.bottom).fill();

    // Padding bottom
    this.root.rect(layout.left + padding.left + margin.left, layout.top + layout.height - padding.bottom - margin.bottom, layout.width - padding.right - padding.left - margin.left - margin.right, padding.bottom).fill();
  },
  debugMargin: function debugMargin(layout, margin) {
    this.root.fillColor('#f8cca1');
    this.root.opacity(0.5);

    // Margin top
    this.root.rect(layout.left + margin.left, layout.top, layout.width - margin.left - margin.right, margin.top).fill();

    // Margin left
    this.root.rect(layout.left, layout.top, margin.left, layout.height).fill();

    // Margin right
    this.root.rect(layout.left + layout.width - margin.right, layout.top, margin.right, layout.height).fill();

    // Margin bottom
    this.root.rect(layout.left + margin.left, layout.top + layout.height - margin.bottom, layout.width - margin.left - margin.right, margin.bottom).fill();
  },
  debug: function debug() {
    var layout = this.getAbsoluteLayout();
    var padding = this.padding;
    var margin = this.margin;

    this.root.save();

    this.debugContent(layout, margin, padding);
    this.debugPadding(layout, margin, padding);
    this.debugMargin(layout, margin);
    this.debugText(layout);

    this.root.restore();
  }
};

var Borders = {
  traceBorder: function traceBorder(style, width) {
    switch (style) {
      case 'dashed':
        this.root.dash(width * 2, { space: width * 1.2 }).stroke();
        break;
      case 'dotted':
        this.root.dash(width, { space: width * 1.2 }).stroke();
        break;
      default:
        this.root.stroke();
    }
  },
  drawHorizontalBorder: function drawHorizontalBorder(p1, p2, r1, r2, width, color, style) {
    if (width <= 0) return;

    this.root.lineWidth(width).moveTo(p1[0], p1[1] + r1).quadraticCurveTo(p1[0], p1[1], p1[0] + r1, p1[1]).lineTo(p2[0] - r2, p2[1]).quadraticCurveTo(p2[0], p2[1], p2[0], p2[1] + r2).strokeColor(color);

    this.traceBorder(style, width);
  },
  drawVerticalBorder: function drawVerticalBorder(p1, p2, r1, r2, width, color, style) {
    if (width <= 0) return;

    this.root.lineWidth(width).moveTo(p1[0] + r1, p1[1]).quadraticCurveTo(p1[0], p1[1], p1[0], p1[1] - r1).lineTo(p2[0], p2[1] + r2).quadraticCurveTo(p2[0], p2[1], p2[0] + r2, p2[1]).strokeColor(color);

    this.traceBorder(style, width);
  },
  drawBorders: function drawBorders() {
    var margin = this.margin;

    var _getAbsoluteLayout = this.getAbsoluteLayout(),
        left = _getAbsoluteLayout.left,
        top = _getAbsoluteLayout.top,
        width = _getAbsoluteLayout.width,
        height = _getAbsoluteLayout.height;

    var _getComputedStyles = this.getComputedStyles(),
        _getComputedStyles$bo = _getComputedStyles.borderTopWidth,
        borderTopWidth = _getComputedStyles$bo === undefined ? 0 : _getComputedStyles$bo,
        _getComputedStyles$bo2 = _getComputedStyles.borderRightWidth,
        borderRightWidth = _getComputedStyles$bo2 === undefined ? 0 : _getComputedStyles$bo2,
        _getComputedStyles$bo3 = _getComputedStyles.borderBottomWidth,
        borderBottomWidth = _getComputedStyles$bo3 === undefined ? 0 : _getComputedStyles$bo3,
        _getComputedStyles$bo4 = _getComputedStyles.borderLeftWidth,
        borderLeftWidth = _getComputedStyles$bo4 === undefined ? 0 : _getComputedStyles$bo4,
        _getComputedStyles$bo5 = _getComputedStyles.borderTopLeftRadius,
        borderTopLeftRadius = _getComputedStyles$bo5 === undefined ? 0 : _getComputedStyles$bo5,
        _getComputedStyles$bo6 = _getComputedStyles.borderTopRightRadius,
        borderTopRightRadius = _getComputedStyles$bo6 === undefined ? 0 : _getComputedStyles$bo6,
        _getComputedStyles$bo7 = _getComputedStyles.borderBottomRightRadius,
        borderBottomRightRadius = _getComputedStyles$bo7 === undefined ? 0 : _getComputedStyles$bo7,
        _getComputedStyles$bo8 = _getComputedStyles.borderBottomLeftRadius,
        borderBottomLeftRadius = _getComputedStyles$bo8 === undefined ? 0 : _getComputedStyles$bo8,
        _getComputedStyles$bo9 = _getComputedStyles.borderTopColor,
        borderTopColor = _getComputedStyles$bo9 === undefined ? 'black' : _getComputedStyles$bo9,
        _getComputedStyles$bo10 = _getComputedStyles.borderRightColor,
        borderRightColor = _getComputedStyles$bo10 === undefined ? 'black' : _getComputedStyles$bo10,
        _getComputedStyles$bo11 = _getComputedStyles.borderBottomColor,
        borderBottomColor = _getComputedStyles$bo11 === undefined ? 'black' : _getComputedStyles$bo11,
        _getComputedStyles$bo12 = _getComputedStyles.borderLeftColor,
        borderLeftColor = _getComputedStyles$bo12 === undefined ? 'black' : _getComputedStyles$bo12,
        _getComputedStyles$bo13 = _getComputedStyles.borderTopStyle,
        borderTopStyle = _getComputedStyles$bo13 === undefined ? 'solid' : _getComputedStyles$bo13,
        _getComputedStyles$bo14 = _getComputedStyles.borderRightStyle,
        borderRightStyle = _getComputedStyles$bo14 === undefined ? 'solid' : _getComputedStyles$bo14,
        _getComputedStyles$bo15 = _getComputedStyles.borderBottomStyle,
        borderBottomStyle = _getComputedStyles$bo15 === undefined ? 'solid' : _getComputedStyles$bo15,
        _getComputedStyles$bo16 = _getComputedStyles.borderLeftStyle,
        borderLeftStyle = _getComputedStyles$bo16 === undefined ? 'solid' : _getComputedStyles$bo16;

    // Save current graphics stack


    this.root.save();

    // border top
    this.drawHorizontalBorder([left + margin.left + (borderTopLeftRadius > 0 ? borderTopWidth / 2 : 0), top + margin.top + borderTopWidth / 2], [left + width - margin.right - (borderTopRightRadius > 0 ? borderTopWidth / 2 : 0), top + margin.top + borderTopWidth / 2], borderTopLeftRadius, borderTopRightRadius, borderTopWidth, borderTopColor, borderTopStyle);

    // border right
    this.drawVerticalBorder([left + width - margin.right - borderRightWidth / 2, top + margin.top + (borderTopRightRadius > 0 ? borderRightWidth / 2 : 0)], [left + width - margin.right - borderRightWidth / 2, top + height - margin.bottom - (borderBottomRightRadius > 0 ? borderRightWidth / 2 : 0)], -borderTopRightRadius, -borderBottomRightRadius, borderRightWidth, borderRightColor, borderRightStyle);

    // border bottom
    this.drawHorizontalBorder([left + width - margin.right - (borderBottomRightRadius > 0 ? borderBottomWidth / 2 : 0), top + height - margin.bottom - borderBottomWidth / 2], [left + margin.left + (borderBottomLeftRadius > 0 ? borderBottomWidth / 2 : 0), top + height - margin.bottom - borderBottomWidth / 2], -borderBottomRightRadius, -borderBottomLeftRadius, borderBottomWidth, borderBottomColor, borderBottomStyle);

    // border left
    this.drawVerticalBorder([left + margin.left + borderLeftWidth / 2, top + height - margin.bottom - (borderBottomLeftRadius > 0 ? borderLeftWidth / 2 : 0)], [left + margin.left + borderLeftWidth / 2, top + margin.top + (borderTopLeftRadius > 0 ? borderLeftWidth / 2 : 0)], borderBottomLeftRadius, borderTopLeftRadius, borderLeftWidth, borderLeftColor, borderLeftStyle);

    // Restore graphics stack to avoid side effects
    this.root.restore();
  }
};

var PERCENT = /^(\d+)?%$/g;

var Base = function (_Node) {
  _inherits(Base, _Node);

  function Base(root, props) {
    _classCallCheck(this, Base);

    var _this = _possibleConstructorReturn(this, _Node.call(this));

    _this.root = root;
    _this.parent = null;
    _this.children = [];

    _this.props = merge({}, _this.constructor.defaultProps, Base.defaultProps, props);

    warning(!_this.props.styles, '"styles" prop passed instead of "style" prop');

    _this.layout = Yoga.Node.createDefault();
    _this.canBeSplitted = false;
    return _this;
  }

  Base.prototype.appendChild = function appendChild(child) {
    if (child) {
      child.parent = this;
      this.children.push(child);
      this.layout.insertChild(child.layout, this.layout.getChildCount());
    }
  };

  Base.prototype.removeChild = function removeChild(child) {
    var index = this.children.indexOf(child);

    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
      this.layout.removeChild(child.layout);
    }
  };

  Base.prototype.moveTo = function moveTo(parent) {
    this.reset();
    this.parent.removeChild(this);
    parent.appendChild(this);
  };

  Base.prototype.applyProps = function applyProps() {
    var _this2 = this;

    var _page = this.page,
        size = _page.size,
        orientation = _page.orientation;


    this.style = this.style || StyleSheet.resolve(this.props.style, {
      width: size[0],
      height: size[1],
      orientation: orientation
    });

    toPairsIn(this.style).map(function (_ref) {
      var attribute = _ref[0],
          value = _ref[1];

      _this2.applyStyle(attribute, value);
    });

    this.children.forEach(function (child) {
      if (child.applyProps) {
        child.applyProps();
      }
    });
  };

  Base.prototype.setDimension = function setDimension(attr, value) {
    var fixedMethod = 'set' + upperFirst(attr);
    var percentMethod = fixedMethod + 'Percent';
    var isPercent = PERCENT.exec(value);

    if (isPercent) {
      this.layout[percentMethod](parseInt(isPercent[1], 10));
    } else {
      this.layout[fixedMethod](value);
    }
  };

  Base.prototype.setPosition = function setPosition(edge, value) {
    var isPercent = PERCENT.exec(value);

    if (isPercent) {
      this.layout.setPositionPercent(edge, parseInt(isPercent[1], 10));
    } else {
      this.layout.setPosition(edge, value);
    }
  };

  Base.prototype.applyStyle = function applyStyle(attribute, value) {
    var setter = 'set' + upperFirst(attribute);

    switch (attribute) {
      case 'marginTop':
        this.layout.setMargin(Yoga.EDGE_TOP, this.marginTop || value);
        break;
      case 'marginRight':
        this.layout.setMargin(Yoga.EDGE_RIGHT, this.marginRight || value);
        break;
      case 'marginBottom':
        this.layout.setMargin(Yoga.EDGE_BOTTOM, this.marginBottom || value);
        break;
      case 'marginLeft':
        this.layout.setMargin(Yoga.EDGE_LEFT, this.marginLeft || value);
        break;
      case 'paddingTop':
        this.layout.setPadding(Yoga.EDGE_TOP, this.paddingTop || value);
        break;
      case 'paddingRight':
        this.layout.setPadding(Yoga.EDGE_RIGHT, this.paddingRight || value);
        break;
      case 'paddingBottom':
        this.layout.setPadding(Yoga.EDGE_BOTTOM, this.paddingBottom || value);
        break;
      case 'paddingLeft':
        this.layout.setPadding(Yoga.EDGE_LEFT, this.paddingLeft || value);
        break;
      case 'borderTopWidth':
        this.layout.setBorder(Yoga.EDGE_TOP, value);
        break;
      case 'borderRightWidth':
        this.layout.setBorder(Yoga.EDGE_RIGHT, value);
        break;
      case 'borderBottomWidth':
        this.layout.setBorder(Yoga.EDGE_BOTTOM, value);
        break;
      case 'borderLeftWidth':
        this.layout.setBorder(Yoga.EDGE_LEFT, value);
        break;
      case 'position':
        this.layout.setPositionType(value === 'absolute' ? Yoga.POSITION_TYPE_ABSOLUTE : Yoga.POSITION_TYPE_RELATIVE);
        break;
      case 'top':
        this.setPosition(Yoga.EDGE_TOP, this.top || value);
        break;
      case 'right':
        this.setPosition(Yoga.EDGE_RIGHT, this.right || value);
        break;
      case 'bottom':
        this.setPosition(Yoga.EDGE_BOTTOM, this.bottom || value);
        break;
      case 'left':
        this.setPosition(Yoga.EDGE_LEFT, this.left || value);
        break;
      case 'width':
        this.setDimension(attribute, this[attribute] - this.marginLeft - this.marginRight || value);
        break;
      case 'height':
        this.setDimension(attribute, this[attribute] - this.marginTop - this.marginBottom || value);
        break;
      case 'minHeight':
      case 'maxHeight':
      case 'minWidth':
      case 'maxWidth':
        this.setDimension(attribute, value);
        break;
      default:
        if (isFunction(this.layout[setter])) {
          this.layout[setter](value);
        }
    }
  };

  Base.prototype.isAbsolute = function isAbsolute() {
    return this.props.style.position === 'absolute';
  };

  Base.prototype.isEmpty = function isEmpty() {
    return this.children.length === 0;
  };

  Base.prototype.recalculateLayout = function recalculateLayout() {
    this.children.forEach(function (child) {
      return child.recalculateLayout();
    });
  };

  Base.prototype.getAbsoluteLayout = function getAbsoluteLayout() {
    var parentMargin = this.parent.margin || { left: 0, top: 0 };
    var parentLayout = this.parent.getAbsoluteLayout ? this.parent.getAbsoluteLayout() : { left: 0, top: 0 };

    return {
      left: this.left + parentMargin.left + parentLayout.left,
      top: this.top + parentMargin.top + parentLayout.top,
      height: this.height,
      width: this.width
    };
  };

  Base.prototype.getWidth = function getWidth() {
    return this.layout.getComputedWidth() + this.layout.getComputedMargin(Yoga.EDGE_LEFT) + this.layout.getComputedMargin(Yoga.EDGE_RIGTH) - this.layout.getComputedPadding(Yoga.EDGE_LEFT) - this.layout.getComputedPadding(Yoga.EDGE_RIGTH);
  };

  Base.prototype.getHeight = function getHeight() {
    return this.layout.getComputedHeight() + this.layout.getComputedMargin(Yoga.EDGE_TOP) + this.layout.getComputedMargin(Yoga.EDGE_BOTTOM) - this.layout.getComputedPadding(Yoga.EDGE_TOP) - this.layout.getComputedPadding(Yoga.EDGE_BOTTOM);
  };

  Base.prototype.getComputedStyles = function getComputedStyles() {
    var element = this.parent;
    var inheritedStyles = {};

    while (element && element.parent) {
      inheritedStyles = _extends({}, element.parent.style, element.style, inheritedStyles);
      element = element.parent;
    }

    return _extends({}, pick(inheritedStyles, inheritedProperties), this.style);
  };

  Base.prototype.drawBackgroundColor = function drawBackgroundColor() {
    var margin = this.margin;

    var _getAbsoluteLayout = this.getAbsoluteLayout(),
        left = _getAbsoluteLayout.left,
        top = _getAbsoluteLayout.top,
        width = _getAbsoluteLayout.width,
        height = _getAbsoluteLayout.height;

    var styles = this.getComputedStyles();

    // We can't set individual radius for each corner on PDF, so we get the higher
    var borderRadius = Math.max(styles.borderTopLeftRadius, styles.borderTopRightRadius, styles.borderBottomRightRadius, styles.borderBottomLeftRadius) || 0;

    if (styles.backgroundColor) {
      this.root.fillColor(styles.backgroundColor).roundedRect(left + margin.left, top + margin.top, width - margin.left - margin.right, height - margin.top - margin.bottom, borderRadius).fill();
    }
  };

  Base.prototype.wrapHeight = function wrapHeight(height) {
    return Math.min(height, this.height);
  };

  Base.prototype.clone = function clone() {
    var clone = new this.constructor(this.root, this.props);

    clone.width = this.width;
    clone.style = this.style;
    clone.parent = this.parent;
    clone.height = this.height;
    clone.margin = this.margin;
    clone.padding = this.padding;

    return clone;
  };

  Base.prototype.renderChildren = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(page) {
      var absoluteChilds, nonAbsoluteChilds, i, _i;

      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              absoluteChilds = this.children.filter(function (child) {
                return child.isAbsolute();
              });
              nonAbsoluteChilds = this.children.filter(function (child) {
                return !child.isAbsolute();
              });
              i = 0;

            case 3:
              if (!(i < nonAbsoluteChilds.length)) {
                _context.next = 9;
                break;
              }

              _context.next = 6;
              return nonAbsoluteChilds[i].render(page);

            case 6:
              i++;
              _context.next = 3;
              break;

            case 9:
              _i = 0;

            case 10:
              if (!(_i < absoluteChilds.length)) {
                _context.next = 16;
                break;
              }

              _context.next = 13;
              return absoluteChilds[_i].render(page);

            case 13:
              _i++;
              _context.next = 10;
              break;

            case 16:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function renderChildren(_x) {
      return _ref2.apply(this, arguments);
    }

    return renderChildren;
  }();

  _createClass(Base, [{
    key: 'page',
    get: function get() {
      return this.parent.page;
    }
  }]);

  return Base;
}(Node$1);

Base.defaultProps = {
  style: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0
  },
  minPresenceAhead: 0
};


_Object$assign(Base.prototype, Debug);
_Object$assign(Base.prototype, Borders);

var SubPage = function (_Base) {
  _inherits(SubPage, _Base);

  function SubPage(root, props, number) {
    _classCallCheck(this, SubPage);

    var _this = _possibleConstructorReturn(this, _Base.call(this, root, props));

    _this._number = number;
    return _this;
  }

  SubPage.prototype.resetMargins = function resetMargins() {
    if (!!this.style.marginTop || !!this.style.marginBottom || !!this.style.marginLeft || !!this.style.marginRight) {
      warning(false, 'Margin values are not allowed on Page element. Use padding instead.');

      this.style.marginTop = 0;
      this.style.marginBottom = 0;
      this.style.marginLeft = 0;
      this.style.marginRight = 0;
    }
  };

  SubPage.prototype.applyProps = function applyProps() {
    _Base.prototype.applyProps.call(this);
    this.resetMargins();

    if (this.props.size) {
      var size = this.size;

      if (this.props.orientation === 'landscape') {
        this.layout.setWidth(size[1]);
        this.layout.setHeight(size[0]);
      } else {
        this.layout.setWidth(size[0]);
        this.layout.setHeight(size[1]);
      }
    }
  };

  SubPage.prototype.recalculateLayout = function recalculateLayout() {
    _Base.prototype.recalculateLayout.call(this);
    this.layout.calculateLayout();
  };

  SubPage.prototype.isEmpty = function isEmpty() {
    var nonFixedChilds = this.children.filter(function (child) {
      return !child.props.fixed;
    });
    if (nonFixedChilds.length === 0) {
      return true;
    }

    return nonFixedChilds.every(function (child) {
      return child.isEmpty();
    });
  };

  SubPage.prototype.wrap = function wrap(height) {
    this.layout.calculateLayout();

    var nextPageElements = [];
    var result = this.clone();

    result._number = this._number + 1;

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      var _child$props = child.props,
          fixed = _child$props.fixed,
          wrap = _child$props.wrap,
          minPresenceAhead = _child$props.minPresenceAhead;


      var isElementOutside = height < child.top;
      var childBottom = child.top + child.height - this.paddingTop;
      var shouldElementSplit = height < childBottom;

      if (fixed) {
        var fixedElement = child.clone();
        fixedElement.children = child.children;
        result.appendChild(fixedElement);
      } else if (isElementOutside) {
        nextPageElements.push(child);
      } else if (child.props.break) {
        child.props.break = false;
        nextPageElements.push.apply(nextPageElements, this.children.slice(i));
        break;
      } else if (minPresenceAhead) {
        var childIndex = 1;
        var presenceAhead = 0;
        var nextChild = this.children[i + childIndex];
        var isElementInside = height > nextChild.top;

        while (nextChild && isElementInside) {
          isElementInside = height > nextChild.top;
          presenceAhead += nextChild.wrapHeight(height - nextChild.top - this.marginTop);
          nextChild = this.children[i + childIndex++];
        }

        if (presenceAhead < minPresenceAhead) {
          nextPageElements.push.apply(nextPageElements, this.children.slice(i));
          break;
        }
      } else if (shouldElementSplit) {
        var remainingHeight = height - child.top + this.paddingTop;

        if (!wrap) {
          nextPageElements.push(child);
        } else {
          result.appendChild(child.splice(remainingHeight, height));
        }
      }
    }

    nextPageElements.forEach(function (child) {
      return child.moveTo(result);
    });
    result.applyProps();

    return result;
  };

  SubPage.prototype.callChildFunctions = function callChildFunctions() {
    var listToExplore = this.children.slice(0);

    while (listToExplore.length > 0) {
      var node = listToExplore.shift();
      var pageCount = this.page.document.pageCount;


      if (node.renderCallback) {
        var callResult = node.renderCallback({
          totalPages: pageCount,
          pageNumber: this.number
        });

        node.renderCallback = null;
        node.children = [callResult];
        continue;
      }

      if (node.children) {
        listToExplore.push.apply(listToExplore, node.children);
      }
    }
  };

  SubPage.prototype.layoutFixedElements = function layoutFixedElements() {
    this.reset();
    this.recalculateLayout();

    this.children.forEach(function (child) {
      if (child.props.fixed) {
        child.reset();
      }
    });
  };

  SubPage.prototype.render = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(page) {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              this.root.addPage({
                size: this.size,
                layout: this.props.orientation,
                margin: 0
              });

              this.callChildFunctions();
              this.layoutFixedElements();

              if (this.style.backgroundColor) {
                this.root.fillColor(this.style.backgroundColor).rect(0, 0, this.root.page.width, this.root.page.height).fill();
              }

              if (this.props.debug) {
                this.debug();
              }

              _context.next = 7;
              return this.renderChildren(page);

            case 7:

              this.page.renderRuler();

            case 8:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function render(_x) {
      return _ref.apply(this, arguments);
    }

    return render;
  }();

  _createClass(SubPage, [{
    key: 'name',
    get: function get() {
      return 'SubPage';
    }
  }, {
    key: 'page',
    get: function get() {
      return this.parent;
    }
  }, {
    key: 'size',
    get: function get() {
      return this.parent.size;
    }
  }, {
    key: 'style',
    get: function get() {
      return this.parent.style;
    },
    set: function set(style) {
      return style;
    }
  }, {
    key: 'number',
    get: function get() {
      return this._number + this.page.numberOffset;
    }
  }]);

  return SubPage;
}(Base);

var sizes = {
  '4A0': [4767.87, 6740.79],
  '2A0': [3370.39, 4767.87],
  A0: [2383.94, 3370.39],
  A1: [1683.78, 2383.94],
  A2: [1190.55, 1683.78],
  A3: [841.89, 1190.55],
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  A6: [297.64, 419.53],
  A7: [209.76, 297.64],
  A8: [147.4, 209.76],
  A9: [104.88, 147.4],
  A10: [73.7, 104.88],
  B0: [2834.65, 4008.19],
  B1: [2004.09, 2834.65],
  B2: [1417.32, 2004.09],
  B3: [1000.63, 1417.32],
  B4: [708.66, 1000.63],
  B5: [498.9, 708.66],
  B6: [354.33, 498.9],
  B7: [249.45, 354.33],
  B8: [175.75, 249.45],
  B9: [124.72, 175.75],
  B10: [87.87, 124.72],
  C0: [2599.37, 3676.54],
  C1: [1836.85, 2599.37],
  C2: [1298.27, 1836.85],
  C3: [918.43, 1298.27],
  C4: [649.13, 918.43],
  C5: [459.21, 649.13],
  C6: [323.15, 459.21],
  C7: [229.61, 323.15],
  C8: [161.57, 229.61],
  C9: [113.39, 161.57],
  C10: [79.37, 113.39],
  RA0: [2437.8, 3458.27],
  RA1: [1729.13, 2437.8],
  RA2: [1218.9, 1729.13],
  RA3: [864.57, 1218.9],
  RA4: [609.45, 864.57],
  SRA0: [2551.18, 3628.35],
  SRA1: [1814.17, 2551.18],
  SRA2: [1275.59, 1814.17],
  SRA3: [907.09, 1275.59],
  SRA4: [637.8, 907.09],
  EXECUTIVE: [521.86, 756.0],
  FOLIO: [612.0, 936.0],
  LEGAL: [612.0, 1008.0],
  LETTER: [612.0, 792.0],
  TABLOID: [792.0, 1224.0]
};

var RULER_WIDTH = 13;
var RULER_COLOR = 'white';
var RULER_FONT_SIZE = 5;
var DEFAULT_RULER_STEPS = 50;
var LINE_WIDTH = 0.5;
var LINE_COLOR = 'gray';
var GRID_COLOR = '#ababab';

var range = function range(max, steps) {
  return _Array$from({ length: Math.ceil(max / steps) }, function (_, i) {
    return i * steps;
  });
};

var matchPercentage = function matchPercentage(value) {
  var match = value.match(/(\d+\.?\d*)%/);
  if (match) {
    return 100 / parseFloat(match[1], 10);
  }

  return null;
};

var Ruler = {
  getRulerWidth: function getRulerWidth() {
    return RULER_WIDTH;
  },
  hasHorizontalRuler: function hasHorizontalRuler() {
    return this.props.ruler || this.props.horizontalRuler;
  },
  hasVerticalRuler: function hasVerticalRuler() {
    return this.props.ruler || this.props.verticalRuler;
  },
  getHorizontalSteps: function getHorizontalSteps() {
    var value = this.props.horizontalRulerSteps || this.props.rulerSteps || DEFAULT_RULER_STEPS;

    if (typeof value === 'string') {
      var percentage = matchPercentage(value);
      if (percentage) {
        var width = this.width - (this.hasVerticalRuler() ? RULER_WIDTH : 0);
        return width / percentage;
      }
      throw new Error('Page: Invalid horizontal steps value');
    }

    return value;
  },
  getVerticalSteps: function getVerticalSteps() {
    var value = this.props.verticalRulerSteps || this.props.rulerSteps || DEFAULT_RULER_STEPS;

    if (typeof value === 'string') {
      var percentage = matchPercentage(value);
      if (percentage) {
        var height = this.height - (this.hasHorizontalRuler() ? RULER_WIDTH : 0);
        return height / percentage;
      }
      throw new Error('Page: Invalid horizontal steps value');
    }

    return value;
  },
  renderRuler: function renderRuler() {
    this.root.save().lineWidth(LINE_WIDTH).fontSize(RULER_FONT_SIZE).opacity(1);

    if (this.hasHorizontalRuler()) {
      this.drawHorizontalRuler();
    }

    if (this.hasVerticalRuler()) {
      this.drawVerticalRuler();
    }

    if (this.hasHorizontalRuler() && this.hasVerticalRuler()) {
      this.root.rect(0, 0, RULER_WIDTH - LINE_WIDTH, RULER_WIDTH - LINE_WIDTH).fill(RULER_COLOR);
    }

    this.root.restore();
  },
  drawHorizontalRuler: function drawHorizontalRuler() {
    var _this = this;

    var offset = this.hasVerticalRuler() ? RULER_WIDTH : 0;

    this.root.rect(offset, 0, this.width, RULER_WIDTH).fill(RULER_COLOR).moveTo(this.hasVerticalRuler() ? RULER_WIDTH : 0, RULER_WIDTH).lineTo(this.width, RULER_WIDTH).stroke(LINE_COLOR);

    var hRange = range(this.width, this.getHorizontalSteps());

    hRange.map(function (step) {
      _this.root.moveTo(offset + step, 0).lineTo(offset + step, RULER_WIDTH).stroke(LINE_COLOR).fillColor('black').text('' + Math.round(step), offset + step + 1, 1);
    });

    hRange.map(function (step) {
      if (step !== 0) {
        _this.root.moveTo(offset + step, RULER_WIDTH).lineTo(offset + step, _this.height).stroke(GRID_COLOR);
      }
    });
  },
  drawVerticalRuler: function drawVerticalRuler() {
    var _this2 = this;

    var offset = this.hasHorizontalRuler() ? RULER_WIDTH : 0;

    this.root.rect(0, offset, RULER_WIDTH, this.height).fill(RULER_COLOR).moveTo(RULER_WIDTH, this.hasHorizontalRuler() ? RULER_WIDTH : 0).lineTo(RULER_WIDTH, this.height).stroke(LINE_COLOR);

    var vRange = range(this.height, this.getVerticalSteps());

    vRange.map(function (step) {
      _this2.root.moveTo(0, offset + step).lineTo(RULER_WIDTH, offset + step).stroke(LINE_COLOR).fillColor('black').text('' + Math.round(step), 1, offset + step + 1);
    });

    vRange.map(function (step) {
      if (step !== 0) {
        _this2.root.moveTo(RULER_WIDTH, offset + step).lineTo(_this2.width, offset + step).stroke(GRID_COLOR);
      }
    });
  }
};

var Page$1 = function () {
  function Page(root, props) {
    _classCallCheck(this, Page);

    this.root = root;
    this.parent = null;
    this.props = _extends({}, Page.defaultProps, props);
    this.previousPage = null;
    this.children = [];
    this._size = null;

    this.addInitialSubpage();
  }

  Page.prototype.applyProps = function applyProps() {
    this.style = StyleSheet.resolve(this.props.style);

    // Add some padding if ruler present, so we can see the whole page inside it
    var rulerWidth = this.getRulerWidth();
    var _style = this.style,
        _style$paddingTop = _style.paddingTop,
        paddingTop = _style$paddingTop === undefined ? 0 : _style$paddingTop,
        _style$paddingLeft = _style.paddingLeft,
        paddingLeft = _style$paddingLeft === undefined ? 0 : _style$paddingLeft;


    if (this.hasHorizontalRuler()) {
      this.style.paddingTop = paddingTop + rulerWidth;
    }

    if (this.hasVerticalRuler()) {
      this.style.paddingLeft = paddingLeft + rulerWidth;
    }

    // Apply props to page childrens
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].applyProps();
    }
  };

  Page.prototype.addInitialSubpage = function addInitialSubpage() {
    var newSubpage = new SubPage(this.root, this.props, 1);
    newSubpage.parent = this;

    this.children.push(newSubpage);
  };

  Page.prototype.appendChild = function appendChild(child) {
    this.children[0].appendChild(child);
  };

  Page.prototype.removeChild = function removeChild(child) {
    this.children[0].removeChild(child);
  };

  Page.prototype.wrapPage = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var _style2, _style2$paddingTop, paddingTop, _style2$paddingBottom, paddingBottom, height, nextSubpage;

      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _style2 = this.style, _style2$paddingTop = _style2.paddingTop, paddingTop = _style2$paddingTop === undefined ? 0 : _style2$paddingTop, _style2$paddingBottom = _style2.paddingBottom, paddingBottom = _style2$paddingBottom === undefined ? 0 : _style2$paddingBottom;
              height = this.height - paddingTop - paddingBottom;
              nextSubpage = this.initialSubpage.wrap(height);


              while (this.props.wrap && !nextSubpage.isEmpty()) {
                this.children.push(nextSubpage);
                nextSubpage = nextSubpage.wrap(height);
              }

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function wrapPage() {
      return _ref.apply(this, arguments);
    }

    return wrapPage;
  }();

  Page.prototype.render = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var i;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              i = 0;

            case 1:
              if (!(i < this.children.length)) {
                _context2.next = 7;
                break;
              }

              _context2.next = 4;
              return this.children[i].render(this);

            case 4:
              i++;
              _context2.next = 1;
              break;

            case 7:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function render() {
      return _ref2.apply(this, arguments);
    }

    return render;
  }();

  _createClass(Page, [{
    key: 'name',
    get: function get() {
      return 'Page';
    }
  }, {
    key: 'document',
    get: function get() {
      return this.parent;
    }
  }, {
    key: 'orientation',
    get: function get() {
      return this.props.orientation;
    }
  }, {
    key: 'initialSubpage',
    get: function get() {
      return this.children[0];
    }
  }, {
    key: 'subpagesCount',
    get: function get() {
      return this.children.length;
    }
  }, {
    key: 'numberOffset',
    get: function get() {
      var result = 0;
      var page = this.previousPage;

      while (page) {
        result += page.subpagesCount;
        page = page.previousPage;
      }

      return result;
    }
  }, {
    key: 'width',
    get: function get() {
      return this.size[0];
    }
  }, {
    key: 'height',
    get: function get() {
      return this.size[1];
    }
  }, {
    key: 'padding',
    get: function get() {
      return {
        top: this.style.paddingTop || 0,
        right: this.style.paddingRight || 0,
        bottom: this.style.paddingBottom || 0,
        left: this.style.paddingLeft || 0
      };
    }
  }, {
    key: 'size',
    get: function get() {
      if (this._size) {
        return this._size;
      }

      var size = this.props.size;

      // Calculate size

      if (typeof size === 'string') {
        this._size = sizes[size.toUpperCase()];
      } else if (Array.isArray(size)) {
        this._size = size;
      } else if ((typeof size === 'undefined' ? 'undefined' : _typeof(size)) === 'object' && size.width && size.height) {
        this._size = [size.width, size.height];
      } else {
        throw new Error('Invalid Page size: ' + size);
      }

      // Adjust size for ruler
      if (this.hasHorizontalRuler()) {
        this._size[0] += this.getRulerWidth();
      }

      if (this.hasVerticalRuler()) {
        this._size[1] += this.getRulerWidth();
      }

      return this._size;
    }
  }]);

  return Page;
}();

Page$1.defaultProps = {
  size: 'A4',
  orientation: 'portrait',
  style: {},
  wrap: false
};


_Object$assign(Page$1.prototype, Ruler);

var View$1 = function (_Base) {
  _inherits(View, _Base);

  function View() {
    _classCallCheck(this, View);

    return _possibleConstructorReturn(this, _Base.apply(this, arguments));
  }

  View.prototype.isEmpty = function isEmpty() {
    if (this.children.length === 0) {
      return false;
    }

    return this.children.every(function (child) {
      return child.isEmpty();
    });
  };

  View.prototype.wrapHeight = function wrapHeight(height) {
    var wrap = this.props.wrap;


    if (!wrap && height < this.height) {
      return 0;
    }

    var result = 0;
    for (var i = 0; i < this.children.length; i++) {
      if (this.children.height > height) {
        break;
      }

      result += this.children.height;
    }
    return result;
  };

  View.prototype.splice = function splice(wrapHeight, pageHeight) {
    var nextViewElements = [];
    var result = this.clone();

    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      var _child$props = child.props,
          fixed = _child$props.fixed,
          wrap = _child$props.wrap,
          minPresenceAhead = _child$props.minPresenceAhead;

      var isElementOutside = wrapHeight < child.top;
      var shouldElementSplit = wrapHeight < child.top + child.height;

      if (isElementOutside) {
        nextViewElements.push(child);
      } else if (fixed) {
        var fixedElement = child.clone();
        fixedElement.children = child.children;
        result.appendChild(fixedElement);
      } else if (child.props.break) {
        child.props.break = false;
        nextViewElements.push.apply(nextViewElements, this.children.slice(i));
        break;
      } else if (minPresenceAhead) {
        var childIndex = 1;
        var presenceAhead = 0;
        var nextChild = this.children[i + childIndex];
        var isElementInside = wrapHeight > nextChild.top;

        while (nextChild && isElementInside) {
          isElementInside = wrapHeight > nextChild.top;
          presenceAhead += nextChild.wrapHeight(wrapHeight - nextChild.top - this.marginTop);
          nextChild = this.children[i + childIndex++];
        }

        if (presenceAhead < minPresenceAhead) {
          nextViewElements.push.apply(nextViewElements, this.children.slice(i));
          break;
        }
      } else if (shouldElementSplit) {
        var remainingHeight = wrapHeight - child.top - this.marginTop;

        if (!wrap) {
          nextViewElements.push(child);
        } else {
          result.appendChild(child.splice(remainingHeight, pageHeight));
        }
      }
    }

    nextViewElements.forEach(function (child) {
      return child.moveTo(result);
    });

    // If the View has fixed height, we calculate the new element heights.
    // If not, we set it up as NaN and use Yoga calculated heights as fallback.
    var h = this.style.height ? wrapHeight : NaN;

    result.marginTop = 0;
    result.paddingTop = 0;
    result.height = this.height - h;
    this.marginBottom = 0;
    this.paddingBottom = 0;
    this.height = h;

    return result;
  };

  View.prototype.render = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(page) {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              this.drawBackgroundColor();
              this.drawBorders();

              if (this.props.debug) {
                this.debug();
              }

              _context.next = 5;
              return this.renderChildren(page);

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function render(_x) {
      return _ref.apply(this, arguments);
    }

    return render;
  }();

  _createClass(View, [{
    key: 'name',
    get: function get() {
      return 'View';
    }
  }]);

  return View;
}(Base);

View$1.defaultProps = {
  style: {},
  wrap: true
};

var IGNORABLE_CODEPOINTS = [8232, // LINE_SEPARATOR
8233];

var buildSubsetForFont = function buildSubsetForFont(font) {
  return IGNORABLE_CODEPOINTS.reduce(function (acc, codePoint) {
    if (font.hasGlyphForCodePoint && font.hasGlyphForCodePoint(codePoint)) {
      return acc;
    }
    return [].concat(acc, [String.fromCharCode(codePoint)]);
  }, []);
};

var ignoreChars = function ignoreChars(fragments) {
  return fragments.map(function (fragment) {
    var charSubset = buildSubsetForFont(fragment.attributes.font);
    var subsetRegex = new RegExp(charSubset.join('|'));

    return {
      string: fragment.string.replace(subsetRegex, ''),
      attributes: fragment.attributes
    };
  });
};

// Global layout engine
// It's created dynamically because it may accept a custom hyphenation callback
var LAYOUT_ENGINE = void 0;
var INFINITY = 99999;

// TODO: Import and pass Textkit as a whole
var PDFRenderer$2 = createPDFRenderer({ Rect: textkitCore.Rect });

var TextEngine = function () {
  function TextEngine(element) {
    _classCallCheck(this, TextEngine);

    this.element = element;
    this._container = null;
    this.start = 0;
    this.end = 0;
    this.computed = false;
    this.preprocessors = [ignoreChars, embedEmojis];
  }

  TextEngine.prototype.lineIndexAtHeight = function lineIndexAtHeight(height) {
    var counter = 0;
    for (var i = 0; i < this.lines.length; i++) {
      var line = this.lines[i];

      if (counter + line.height > height) {
        return i;
      }

      counter += line.height;
    }

    return this.lines.length;
  };

  TextEngine.prototype.heightAtLineIndex = function heightAtLineIndex(index) {
    var counter = 0;

    for (var i = 0; i <= index; i++) {
      var line = this.lines[i];
      counter += line.height;
    }

    return counter;
  };

  TextEngine.prototype.splice = function splice(height) {
    var result = this.clone();
    var index = this.lineIndexAtHeight(height);

    result.start = index;
    result.end = this.end;
    this.end = index;

    return result;
  };

  TextEngine.prototype.clone = function clone() {
    var result = new TextEngine(this.element);
    result.computed = this.computed;
    result._container = this._container;
    return result;
  };

  TextEngine.prototype.transformText = function transformText(text, transformation) {
    switch (transformation) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return upperFirst(text);
      default:
        return text;
    }
  };

  TextEngine.prototype.layout = function layout(width, dirty) {
    if (this.computed) return;
    var path = new textkitCore.Path().rect(0, 0, width, INFINITY);
    var container = new textkitCore.Container(path);
    var string = textkitCore.AttributedString.fromFragments(this.attributedString).trim();

    // Do the actual text layout
    this.layoutEngine.layout(string, [container]);

    // Get the total amount of rendered lines
    var linesCount = container.blocks.reduce(function (acc, block) {
      return acc + block.lines.length;
    }, 0);

    this.computed = true;
    this._container = container;
    this.end = linesCount + 1;
  };

  TextEngine.prototype.render = function render() {
    var margin = this.element.margin;
    var padding = this.element.padding;

    var _element$getAbsoluteL = this.element.getAbsoluteLayout(),
        top = _element$getAbsoluteL.top,
        left = _element$getAbsoluteL.left;

    // We translate lines based on Yoga container


    var initialX = this.lines[0] ? this.lines[0].rect.y : 0;

    this.lines.forEach(function (line) {
      line.rect.x += left + margin.left + padding.left;
      line.rect.y += top + margin.top + padding.top - initialX;
    });

    var renderer = new PDFRenderer$2(this.element.root, {
      outlineLines: false
    });
    renderer.render(this.container);
  };

  _createClass(TextEngine, [{
    key: 'container',
    get: function get() {
      var lines = this._container.blocks.reduce(function (acc, block) {
        return [].concat(acc, block.lines);
      }, []);

      return _extends({}, this._container, {
        blocks: [{ lines: lines.splice(this.start, this.end) }]
      });
    }
  }, {
    key: 'layoutEngine',
    get: function get() {
      if (!LAYOUT_ENGINE) {
        LAYOUT_ENGINE = new LayoutEngine$1({
          hyphenationCallback: Font.getHyphenationCallback()
        });
      }

      return LAYOUT_ENGINE;
    }
  }, {
    key: 'lines',
    get: function get() {
      if (!this.container) {
        return [];
      }

      return this.container.blocks.reduce(function (acc, block) {
        return [].concat(acc, block.lines);
      }, []);
    }
  }, {
    key: 'height',
    get: function get() {
      if (!this._container) {
        return -1;
      }

      return this.lines.reduce(function (acc, line) {
        return acc + line.height;
      }, 0);
    }
  }, {
    key: 'width',
    get: function get() {
      if (!this._container) {
        return -1;
      }

      return Math.max.apply(Math, this.lines.map(function (line) {
        return line.advanceWidth;
      }));
    }
  }, {
    key: 'attributedString',
    get: function get() {
      var _this = this;

      var fragments = [];

      var _element$getComputedS = this.element.getComputedStyles(),
          _element$getComputedS2 = _element$getComputedS.color,
          color = _element$getComputedS2 === undefined ? 'black' : _element$getComputedS2,
          _element$getComputedS3 = _element$getComputedS.fontFamily,
          fontFamily = _element$getComputedS3 === undefined ? 'Helvetica' : _element$getComputedS3,
          _element$getComputedS4 = _element$getComputedS.fontSize,
          fontSize = _element$getComputedS4 === undefined ? 18 : _element$getComputedS4,
          _element$getComputedS5 = _element$getComputedS.textAlign,
          textAlign = _element$getComputedS5 === undefined ? 'left' : _element$getComputedS5,
          position = _element$getComputedS.position,
          top = _element$getComputedS.top,
          bottom = _element$getComputedS.bottom,
          align = _element$getComputedS.align,
          lineHeight = _element$getComputedS.lineHeight,
          textDecoration = _element$getComputedS.textDecoration,
          textDecorationColor = _element$getComputedS.textDecorationColor,
          textDecorationStyle = _element$getComputedS.textDecorationStyle,
          textTransform = _element$getComputedS.textTransform;

      warning(!align, '"align" style prop will be deprecated on future versions. Please use "textAlign" instead in Text node');

      this.element.children.forEach(function (child) {
        if (typeof child === 'string') {
          var obj = Font.getFont(fontFamily);
          var font = obj ? obj.data : fontFamily;
          var string = _this.transformText(child, textTransform);

          fragments.push({
            string: string,
            attributes: {
              font: font,
              color: color,
              fontSize: fontSize,
              align: textAlign,
              link: _this.element.src,
              underlineStyle: textDecorationStyle,
              underline: textDecoration === 'underline',
              underlineColor: textDecorationColor || color,
              lineHeight: lineHeight ? lineHeight * fontSize : null,
              yOffset: position === 'relative' ? -top || bottom || 0 : null
            }
          });
        } else {
          if (child.engine) {
            var _fragments;

            (_fragments = fragments).push.apply(_fragments, child.engine.attributedString);
          }
        }
      });

      for (var _iterator = this.preprocessors, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var preprocessor = _ref;

        fragments = preprocessor(fragments);
      }

      return fragments;
    }
  }]);

  return TextEngine;
}();

var WIDOW_THREASHOLD = 20;

var Text$1 = function (_Base) {
  _inherits(Text, _Base);

  function Text(root, props) {
    _classCallCheck(this, Text);

    var _this = _possibleConstructorReturn(this, _Base.call(this, root, props));

    _this.engine = new TextEngine(_this);
    _this.layout.setMeasureFunc(_this.measureText.bind(_this));
    _this.renderCallback = props.render;
    return _this;
  }

  Text.prototype.appendChild = function appendChild(child) {
    if (typeof child === 'string') {
      this.children.push(child);
    } else {
      child.parent = this;
      this.children.push(child);
    }
  };

  Text.prototype.removeChild = function removeChild(child) {
    this.children = null;
  };

  Text.prototype.measureText = function measureText(width, widthMode, height, heightMode) {
    // If the text has functions inside, we don't measure dimentions right away,
    // but we keep this until all functions are resolved after the layout stage.
    if (this.renderCallback) {
      return {};
    }

    if (widthMode === Yoga.MEASURE_MODE_EXACTLY) {
      this.engine.layout(width);

      return {
        height: this.style.flexGrow ? NaN : this.engine.height
      };
    }

    if (widthMode === Yoga.MEASURE_MODE_AT_MOST || heightMode === Yoga.MEASURE_MODE_AT_MOST) {
      this.engine.layout(width);

      return {
        height: this.engine.height,
        width: Math.min(width, this.engine.width)
      };
    }

    return {};
  };

  Text.prototype.getComputedStyles = function getComputedStyles() {
    var styles = _Base.prototype.getComputedStyles.call(this);

    // For Text, we also inherit relative positioning because this is how
    // we define text yOffset, which should be applied for inline childs also
    if (this.parent.name === 'Text' && this.parent.style.position === 'relative') {
      styles.top = styles.top || this.parent.style.top;
      styles.bottom = styles.bottom || this.parent.style.bottom;
      styles.position = styles.position || 'relative';
    }

    return styles;
  };

  Text.prototype.recalculateLayout = function recalculateLayout() {
    this.layout.markDirty();
  };

  Text.prototype.isEmpty = function isEmpty() {
    return this.engine.lines.length === 0;
  };

  Text.prototype.hasOrphans = function hasOrphans(linesQuantity, slicedLines) {
    return slicedLines === 1 && linesQuantity !== 1;
  };

  Text.prototype.hasWidows = function hasWidows(linesQuantity, slicedLines) {
    return linesQuantity !== 1 && linesQuantity - slicedLines === 1 && linesQuantity < WIDOW_THREASHOLD;
  };

  Text.prototype.wrapHeight = function wrapHeight(height) {
    var _props = this.props,
        orphans = _props.orphans,
        widows = _props.widows;

    var linesQuantity = this.engine.lines.length;
    var sliceHeight = height - this.marginTop - this.paddingTop;
    var slicedLines = this.engine.lineIndexAtHeight(sliceHeight);

    var wrapHeight = height;

    if (linesQuantity < orphans) {
      wrapHeight = height;
    } else if (slicedLines < orphans || linesQuantity < orphans + widows) {
      wrapHeight = 0;
    } else if (linesQuantity === orphans + widows) {
      wrapHeight = this.engine.heightAtLineIndex(orphans - 1);
    } else if (linesQuantity - slicedLines < widows) {
      wrapHeight = height - this.engine.heightAtLineIndex(widows - 1);
    }

    return Math.min(wrapHeight, this.height);
  };

  Text.prototype.splice = function splice(height) {
    var wrapHeight = this.wrapHeight(height);
    var engine = this.engine.splice(wrapHeight);
    var result = this.clone();

    result.marginTop = 0;
    result.paddingTop = 0;
    result.width = this.width;
    result.marginBottom = this.marginBottom;
    result.engine = engine;
    result.engine.element = result;
    result.height = engine.height + this.paddingBottom + this.marginBottom;

    this.marginBottom = 0;
    this.paddingBottom = 0;
    this.height = height;

    return result;
  };

  Text.prototype.render = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(page) {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              this.drawBackgroundColor();
              this.drawBorders();

              // Calculate text layout if needed
              // This can happen if measureText was not called by Yoga
              if (!this.engine.computed) {
                this.engine.layout(this.width - this.margin.left - this.margin.right - this.padding.left - this.padding.right);
              }

              if (this.props.debug) {
                this.debug();
              }

              this.engine.render();

            case 5:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function render(_x) {
      return _ref.apply(this, arguments);
    }

    return render;
  }();

  _createClass(Text, [{
    key: 'name',
    get: function get() {
      return 'Text';
    }
  }, {
    key: 'src',
    get: function get() {
      return null;
    }
  }]);

  return Text;
}(Base);

Text$1.defaultProps = {
  wrap: true,
  widows: 2,
  orphans: 2
};

var PROTOCOL_REGEXP = /^(http|https|ftp|ftps|mailto)\:\/\//i;

var Link$1 = function (_Text) {
  _inherits(Link, _Text);

  function Link() {
    _classCallCheck(this, Link);

    return _possibleConstructorReturn(this, _Text.apply(this, arguments));
  }

  _createClass(Link, [{
    key: 'name',
    get: function get() {
      return 'Link';
    }
  }, {
    key: 'src',
    get: function get() {
      var src = this.props.src;


      if (typeof src === 'string' && !src.match(PROTOCOL_REGEXP)) {
        src = 'http://' + src;
      }

      return src;
    }
  }]);

  return Link;
}(Text$1);

Link$1.defaultProps = {
  style: {
    color: 'blue',
    textDecoration: 'underline'
  }
};

var SAFETY_HEIGHT = 10;

// We manage two bounding boxes in this class:
//  - Yoga node: Image bounding box. Adjust based on image and page size
//  - Image node: Real image container. In most cases equals Yoga node, except if image is bigger than page

var Image$1 = function (_Base) {
  _inherits(Image, _Base);

  function Image(root, props) {
    _classCallCheck(this, Image);

    var _this = _possibleConstructorReturn(this, _Base.call(this, root, props));

    _this.image = null;
    _this.layout.setMeasureFunc(_this.measureImage.bind(_this));
    return _this;
  }

  Image.prototype.shouldGrow = function shouldGrow() {
    return !!this.getComputedStyles().flexGrow;
  };

  Image.prototype.measureImage = function measureImage(width, widthMode, height, heightMode) {
    var imageMargin = this.margin;
    var pagePadding = this.page.padding;
    var pageArea = this.page.height - pagePadding.top - pagePadding.bottom - imageMargin.top - imageMargin.bottom - SAFETY_HEIGHT;

    if (widthMode === Yoga.MEASURE_MODE_EXACTLY && heightMode === Yoga.MEASURE_MODE_UNDEFINED) {
      var scaledHeight = width / this.ratio;
      return { height: Math.min(pageArea, scaledHeight) };
    }

    if (heightMode === Yoga.MEASURE_MODE_EXACTLY && (widthMode === Yoga.MEASURE_MODE_AT_MOST || widthMode === Yoga.MEASURE_MODE_UNDEFINED)) {
      return { width: Math.min(height * this.ratio, width) };
    }

    if (widthMode === Yoga.MEASURE_MODE_EXACTLY && heightMode === Yoga.MEASURE_MODE_AT_MOST) {
      var _scaledHeight = width / this.ratio;
      return { height: Math.min(height, pageArea, _scaledHeight) };
    }

    if (widthMode === Yoga.MEASURE_MODE_AT_MOST && heightMode === Yoga.MEASURE_MODE_AT_MOST) {
      var imageWidth = Math.min(this.image.width, width);

      return {
        width: imageWidth,
        height: imageWidth / this.ratio
      };
    }

    return { height: height, width: width };
  };

  Image.prototype.isEmpty = function isEmpty() {
    return false;
  };

  Image.prototype.fetch = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return fetchImage(this.props.src);

            case 3:
              this.image = _context.sent;
              _context.next = 10;
              break;

            case 6:
              _context.prev = 6;
              _context.t0 = _context['catch'](0);

              this.image = { width: 0, height: 0 };
              console.warn(_context.t0.message);

            case 10:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[0, 6]]);
    }));

    function fetch$$1() {
      return _ref.apply(this, arguments);
    }

    return fetch$$1;
  }();

  Image.prototype.render = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var margin, padding, _getAbsoluteLayout, left, top, containerWidth, containerHeight, imageWidth, xOffset;

      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              margin = this.margin;
              padding = this.padding;
              _getAbsoluteLayout = this.getAbsoluteLayout(), left = _getAbsoluteLayout.left, top = _getAbsoluteLayout.top;


              this.drawBackgroundColor();
              this.drawBorders();

              if (this.props.debug) {
                this.debug();
              }

              if (this.image.data) {
                // Inner offset between yoga node and image box
                // Makes image centered inside Yoga node
                containerWidth = this.width - margin.right - margin.left;
                containerHeight = this.height - margin.top - margin.bottom;
                imageWidth = Math.min(containerHeight * this.ratio, containerWidth);
                xOffset = Math.max((containerWidth - imageWidth) / 2, 0);


                this.root.image(this.image.data, left + padding.left + margin.left + xOffset, top + padding.top + margin.top, {
                  width: imageWidth - padding.left - padding.right,
                  height: containerHeight - padding.top - padding.bottom
                });
              }

            case 7:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function render() {
      return _ref2.apply(this, arguments);
    }

    return render;
  }();

  _createClass(Image, [{
    key: 'name',
    get: function get() {
      return 'Image';
    }
  }, {
    key: 'ratio',
    get: function get() {
      return this.image.data ? this.image.width / this.image.height : 1;
    }
  }]);

  return Image;
}(Base);

Image$1.defaultProps = {
  wrap: false
};

function createElement(type, props, root) {
  var instance = void 0;

  switch (type) {
    case 'ROOT':
      instance = new PDFDocument__default({ autoFirstPage: false });
      break;
    case 'DOCUMENT':
      instance = new Document$2(root, props);
      break;
    case 'PAGE':
      instance = new Page$1(root, props);
      break;
    case 'TEXT':
      instance = new Text$1(root, props);
      break;
    case 'LINK':
      instance = new Link$1(root, props);
      break;
    case 'IMAGE':
      instance = new Image$1(root, props);
      break;
    case 'VIEW':
      instance = new View$1(root, props);
      break;
    default:
      instance = undefined;
  }

  return instance;
}

var PDFRenderer = ReactFiberReconciler({
  appendInitialChild: function appendInitialChild(parentInstance, child) {
    if (parentInstance.appendChild) {
      parentInstance.appendChild(child);
    } else {
      parentInstance.document = child;
    }
  },
  createInstance: function createInstance(type, props, internalInstanceHandle) {
    return createElement(type, props, internalInstanceHandle);
  },
  createTextInstance: function createTextInstance(text, rootContainerInstance, internalInstanceHandle) {
    return text;
  },
  finalizeInitialChildren: function finalizeInitialChildren(domElement, type, props) {
    return false;
  },
  getPublicInstance: function getPublicInstance(instance) {
    return instance;
  },
  prepareForCommit: function prepareForCommit() {
    // Noop
  },
  prepareUpdate: function prepareUpdate(domElement, type, oldProps, newProps) {
    return true;
  },
  resetAfterCommit: function resetAfterCommit() {
    // Noop
  },
  resetTextContent: function resetTextContent(domElement) {
    // Noop
  },
  getRootHostContext: function getRootHostContext() {
    return emptyObject;
  },
  getChildHostContext: function getChildHostContext() {
    return emptyObject;
  },
  shouldSetTextContent: function shouldSetTextContent(type, props) {
    return false;
  },


  now: function now() {},

  useSyncScheduling: true,

  mutation: {
    appendChild: function appendChild(parentInstance, child) {
      if (parentInstance.appendChild) {
        parentInstance.appendChild(child);
      } else {
        parentInstance.document = child;
      }
    },
    appendChildToContainer: function appendChildToContainer(parentInstance, child) {
      if (parentInstance.appendChild) {
        parentInstance.appendChild(child);
      } else {
        parentInstance.document = child;
      }
    },
    insertBefore: function insertBefore(parentInstance, child, beforeChild) {
      // noob
    },
    insertInContainerBefore: function insertInContainerBefore(parentInstance, child, beforeChild) {
      // noob
    },
    removeChild: function removeChild(parentInstance, child) {
      parentInstance.removeChild(child);
    },
    removeChildFromContainer: function removeChildFromContainer(parentInstance, child) {
      if (parentInstance.removeChild) {
        parentInstance.removeChild(child);
      }
    },
    commitTextUpdate: function commitTextUpdate(textInstance, oldText, newText) {
      textInstance = newText;
    },
    commitMount: function commitMount(instance, type, newProps) {
      // Noop
    },
    commitUpdate: function commitUpdate(instance, updatePayload, type, oldProps, newProps) {
      // noop
    }
  }
});

var View = 'VIEW';
var Text = 'TEXT';
var Link = 'LINK';
var Page = 'PAGE';
var Image = 'IMAGE';
var Document$1 = 'DOCUMENT';

var pdf = function pdf(input) {
  var toBlob = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var stream;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return input.document.render();

            case 2:
              stream = input.pipe(BlobStream());
              return _context.abrupt('return', new _Promise(function (resolve, reject) {
                stream.on('finish', function () {
                  var blob = stream.toBlob('application/pdf');

                  if (input.document.props.onRender) {
                    input.document.props.onRender({ blob: blob });
                  }

                  resolve(blob);
                });

                stream.on('error', reject);
              }));

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function toBlob() {
      return _ref.apply(this, arguments);
    };
  }();

  var toBuffer = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return input.document.render();

            case 2:

              if (input.document.props.onRender) {
                input.document.props.onRender();
              }

              return _context2.abrupt('return', input);

            case 4:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function toBuffer() {
      return _ref2.apply(this, arguments);
    };
  }();

  var toString = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
      var result, render;
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              result = '';
              render = input.document.render();
              return _context3.abrupt('return', new _Promise(function (resolve) {
                render.on('data', function (buffer) {
                  result += buffer;
                });

                render.on('end', function () {
                  if (input.document.props.onRender) {
                    input.document.props.onRender({ string: result });
                  }

                  resolve(result);
                });
              }));

            case 3:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    return function toString() {
      return _ref3.apply(this, arguments);
    };
  }();

  return {
    toBuffer: toBuffer,
    toBlob: toBlob,
    toString: toString
  };
};

/* eslint-disable no-unused-vars */
var Document$$1 = function (_Component) {
  _inherits(Document$$1, _Component);

  function Document$$1(props) {
    _classCallCheck(this, Document$$1);

    var _this = _possibleConstructorReturn(this, _Component.call(this, props));

    _this.container = createElement('ROOT');


    _this.state = {
      document: undefined
    };
    return _this;
  }

  Document$$1.prototype.componentDidMount = function componentDidMount() {
    var _this2 = this;

    this.mountNode = PDFRenderer.createContainer(this.container);

    // Omit some props

    var _props = this.props,
        height = _props.height,
        width = _props.width,
        children = _props.children,
        filename = _props.filename,
        props = _objectWithoutProperties(_props, ['height', 'width', 'children', 'filename']);

    PDFRenderer.updateContainer(React__default.createElement(
      Document$1,
      props,
      this.props.children
    ), this.mountNode, this);

    pdf(this.container).toBlob().then(function (blob) {
      if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, filename || 'print.pdf');
      } else {
        _this2.embed.src = URL.createObjectURL(blob);
      }
    });
  };

  Document$$1.prototype.componentDidUpdate = function componentDidUpdate() {
    // Omit some props
    var _props2 = this.props,
        height = _props2.height,
        width = _props2.width,
        children = _props2.children,
        props = _objectWithoutProperties(_props2, ['height', 'width', 'children']);

    PDFRenderer.updateContainer(React__default.createElement(
      Document$1,
      props,
      this.props.children
    ), this.mountNode, this);
  };

  Document$$1.prototype.componentWillUnmount = function componentWillUnmount() {
    PDFRenderer.updateContainer(null, this.mountNode, this);
  };

  Document$$1.prototype.render = function render() {
    var _this3 = this;

    var _props3 = this.props,
        className = _props3.className,
        _props3$width = _props3.width,
        width = _props3$width === undefined ? null : _props3$width,
        _props3$height = _props3.height,
        height = _props3$height === undefined ? null : _props3$height,
        style = _props3.style;


    return React__default.createElement('iframe', {
      className: className,
      ref: function ref(container) {
        _this3.embed = container;
      },
      style: Array.isArray(style) ? _extends({ width: width, height: height }, flatStyles(style)) : _extends({ width: width, height: height }, style)
    });
  };

  return Document$$1;
}(React.Component);

Document$$1.displayName = 'Document';
Document$$1.defaultProps = { style: {} };

var dom = {
  pdf: pdf,
  View: View,
  Text: Text,
  Link: Link,
  Page: Page,
  Font: Font,
  Image: Image,
  Document: Document$$1,
  StyleSheet: StyleSheet,
  PDFRenderer: PDFRenderer,
  createElement: createElement
};

exports.Document = Document$$1;
exports['default'] = dom;
exports.pdf = pdf;
exports.View = View;
exports.Text = Text;
exports.Link = Link;
exports.Page = Page;
exports.Font = Font;
exports.Image = Image;
exports.StyleSheet = StyleSheet;
exports.PDFRenderer = PDFRenderer;
exports.createElement = createElement;
//# sourceMappingURL=react-pdf.browser.cjs.js.map
