import _Promise from 'babel-runtime/core-js/promise';
import fs from 'fs';
import path from 'path';
import ReactFiberReconciler from 'react-reconciler';
import emptyObject from 'fbjs/lib/emptyObject';
import PDFDocument, { PDFFont } from '@react-pdf/pdfkit';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _extends from 'babel-runtime/helpers/extends';
import _objectWithoutProperties from 'babel-runtime/helpers/objectWithoutProperties';
import isUrl from 'is-url';
import fontkit from '@react-pdf/fontkit';
import fetch from 'isomorphic-fetch';
import _Array$from from 'babel-runtime/core-js/array/from';
import emojiRegex from 'emoji-regex';
import { Attachment, AttributedString, Container, LayoutEngine, Path, Rect } from '@react-pdf/textkit-core';
import scriptItemizer from '@react-pdf/script-itemizer';
import justificationEngine from '@textkit/justification-engine';
import textDecorationEngine from '@textkit/text-decoration-engine';
import lineFragmentGenerator from '@textkit/line-fragment-generator';
import createLinebreaker from '@textkit/linebreaker';
import english from 'hyphenation.en-us';
import Hypher from 'hypher';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import PNG from '@react-pdf/png-js';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import warning from 'fbjs/lib/warning';
import Yoga from 'yoga-layout';
import toPairsIn from 'lodash.topairsin';
import isFunction from 'lodash.isfunction';
import upperFirst from 'lodash.upperfirst';
import pick from 'lodash.pick';
import merge from 'lodash.merge';
import matchMedia from 'media-engine';
import createPDFRenderer from '@textkit/pdf-renderer';
import BlobStream from 'blob-stream';

var standardFonts = ['Courier', 'Courier-Bold', 'Courier-Oblique', 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Times-Roman', 'Times-Bold', 'Times-Italic'];

const Buffer = require('buffer/').Buffer;

const fetchFont = src => {
  return fetch(src).then(response => {
    if (response.buffer) {
      return response.buffer();
    }
    return response.arrayBuffer();
  }).then(arrayBuffer => Buffer.from(arrayBuffer));
};

let fonts = {};
let emojiSource;
let hyphenationCallback;

const register = (src, _ref) => {
  let { family } = _ref,
      otherOptions = _objectWithoutProperties(_ref, ['family']);

  fonts[family] = _extends({
    src,
    loaded: false,
    loading: false,
    data: null
  }, otherOptions);
};

const registerHyphenationCallback = callback => {
  hyphenationCallback = callback;
};

const registerEmojiSource = ({ url, format = 'png' }) => {
  emojiSource = { url, format };
};

const getRegisteredFonts = () => _Object$keys(fonts);

const getFont = family => fonts[family];

const getEmojiSource = () => emojiSource;

const getHyphenationCallback = () => hyphenationCallback;

const load = async function (fontFamily, doc) {
  const font = fonts[fontFamily];

  // We cache the font to avoid fetching it many time
  if (font && !font.data && !font.loading) {
    font.loading = true;

    if (isUrl(font.src)) {
      const data = await fetchFont(font.src);
      font.data = fontkit.create(data);
    } else {
      font.data = fontkit.openSync(font.src);
    }
  }

  // If the font wasn't added to the document yet (aka. loaded), we do.
  // This prevents calling `registerFont` many times for the same font.
  // Fonts loaded state will be resetted after document is closed.
  if (font && !font.loaded) {
    font.loaded = true;
    doc.registerFont(fontFamily, font.data);
  }

  if (!font && !standardFonts.includes(fontFamily)) {
    throw new Error(`Font family not registered: ${fontFamily}. Please register it calling Font.register() method.`);
  }
};

const reset = function () {
  for (const font in fonts) {
    if (fonts.hasOwnProperty(font)) {
      fonts[font].loaded = false;
    }
  }
};

const clear = function () {
  fonts = {};
};

var Font = {
  register,
  getEmojiSource,
  getRegisteredFonts,
  registerEmojiSource,
  registerHyphenationCallback,
  getHyphenationCallback,
  getFont,
  load,
  clear,
  reset
};

class StandardFont {
  constructor(src) {
    this.name = src;
    this.src = PDFFont.open(null, src);
    this.glyphs = {};
  }

  layout(str) {
    const [encoded, positions] = this.src.encode(str);

    return {
      positions,
      stringIndices: positions.map((_, i) => i),
      glyphs: encoded.map((g, i) => {
        const glyph = this.getGlyph(parseInt(g, 16));
        glyph.advanceWidth = positions[i].advanceWidth;
        return glyph;
      })
    };
  }

  glyphForCodePoint(codePoint) {
    const glyph = this.getGlyph(codePoint);
    glyph.advanceWidth = 400;
    return glyph;
  }

  getGlyph(id) {
    if (!this.glyphs[id]) {
      this.glyphs[id] = this.src.font.characterToGlyph(id);
    }

    return {
      id,
      _font: this.src,
      name: this.glyphs[id]
    };
  }

  hasGlyphForCodePoint(codePoint) {
    return this.src.font.characterToGlyph(codePoint) !== '.notdef';
  }

  get ascent() {
    return this.src.ascender;
  }

  get descent() {
    return this.src.descender;
  }

  get lineGap() {
    return this.src.lineGap;
  }

  get unitsPerEm() {
    return 1000;
  }
}

var fontSubstitutionEngine = (() => ({ Run }) => class FontSubstitutionEngine {
  constructor() {
    this.fallbackFontInstance = null;
  }

  get fallbackFont() {
    if (!this.fallbackFontInstance) {
      this.fallbackFontInstance = new StandardFont('Helvetica');
    }

    return this.fallbackFontInstance;
  }

  getRuns(string, runs) {
    const res = [];
    let lastFont = null;
    let lastIndex = 0;
    let index = 0;

    for (const run of runs) {
      let defaultFont;

      if (typeof run.attributes.font === 'string') {
        defaultFont = new StandardFont(run.attributes.font);
      } else {
        defaultFont = run.attributes.font;
      }

      if (string.length === 0) {
        res.push(new Run(0, 0, { font: defaultFont }));
        break;
      }

      for (const char of string.slice(run.start, run.end)) {
        const codePoint = char.codePointAt();
        let font = defaultFont;

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
  }
});

class Node {
  constructor(data) {
    this.prev = null;
    this.next = null;
    this.data = data;
  }

  toString() {
    return this.data.toString();
  }
}

class LinkedList {

  constructor() {
    this.head = null;
    this.tail = null;
    this.listSize = 0;
  }

  isLinked(node) {
    return !(node && node.prev === null && node.next === null && this.tail !== node && this.head !== node || this.isEmpty());
  }

  size() {
    return this.listSize;
  }

  isEmpty() {
    return this.listSize === 0;
  }

  first() {
    return this.head;
  }

  last() {
    return this.last;
  }

  toString() {
    return this.toArray().toString();
  }

  toArray() {
    let node = this.head;
    const result = [];

    while (node !== null) {
      result.push(node);
      node = node.next;
    }
    return result;
  }

  forEach(fun) {
    let node = this.head;

    while (node !== null) {
      fun(node);
      node = node.next;
    }
  }

  contains(n) {
    let node = this.head;

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
  }

  at(i) {
    let node = this.head;
    let index = 0;

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
  }

  insertAfter(node, newNode) {
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
  }

  insertBefore(node, newNode) {
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
  }

  push(node) {
    if (this.head === null) {
      this.unshift(node);
    } else {
      this.insertAfter(this.tail, node);
    }
    return this;
  }

  unshift(node) {
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
  }

  remove(node) {
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
  }

  pop() {
    const node = this.tail;
    this.tail.prev.next = null;
    this.tail = this.tail.prev;
    this.listSize -= 1;
    node.prev = null;
    node.next = null;
    return node;
  }

  shift() {
    const node = this.head;
    this.head.next.prev = null;
    this.head = this.head.next;
    this.listSize -= 1;
    node.prev = null;
    node.next = null;
    return node;
  }
}

LinkedList.Node = Node;

/**
 * @preserve Knuth and Plass line breaking algorithm in JavaScript
 *
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * All rights reserved.
 */
const linebreak = (nodes, lines, settings) => {
  const options = {
    demerits: {
      line: settings && settings.demerits && settings.demerits.line || 10,
      flagged: settings && settings.demerits && settings.demerits.flagged || 100,
      fitness: settings && settings.demerits && settings.demerits.fitness || 3000
    },
    tolerance: settings && settings.tolerance || 3
  };
  const activeNodes = new LinkedList();
  const sum = {
    width: 0,
    stretch: 0,
    shrink: 0
  };
  const lineLengths = lines;
  const breaks = [];
  let tmp = {
    data: {
      demerits: Infinity
    }
  };

  function breakpoint(position, demerits, ratio, line, fitnessClass, totals, previous) {
    return {
      position,
      demerits,
      ratio,
      line,
      fitnessClass,
      totals: totals || {
        width: 0,
        stretch: 0,
        shrink: 0
      },
      previous
    };
  }

  function computeCost(start, end, active, currentLine) {
    let width = sum.width - active.totals.width;
    let stretch = 0;
    let shrink = 0;
    // If the current line index is within the list of linelengths, use it, otherwise use
    // the last line length of the list.
    const lineLength = currentLine < lineLengths.length ? lineLengths[currentLine - 1] : lineLengths[lineLengths.length - 1];

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
    const result = {
      width: sum.width,
      stretch: sum.stretch,
      shrink: sum.shrink
    };

    for (let i = breakPointIndex; i < nodes.length; i += 1) {
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
    let active = activeNodes.first();
    let next = null;
    let ratio = 0;
    let demerits = 0;
    let candidates = [];
    let badness;
    let currentLine = 0;
    let tmpSum;
    let currentClass = 0;
    let fitnessClass;
    let candidate;
    let newNode;

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
              active,
              demerits,
              ratio
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

  nodes.forEach((node, index, nodes) => {
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
    activeNodes.forEach(node => {
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

linebreak.glue = (width, stretch, shrink) => ({
  type: 'glue',
  width,
  stretch,
  shrink
});

linebreak.box = (width, value, hyphenated = false) => ({
  type: 'box',
  width,
  value,
  hyphenated
});

linebreak.penalty = (width, penalty, flagged) => ({
  type: 'penalty',
  width,
  penalty,
  flagged
});

const SOFT_HYPHEN_HEX = '\u00ad';
const NO_BREAK_SPACE_DECIMAL = 160;

const getWords = glyphString => {
  const words = [];
  const { start } = glyphString;
  let lastIndex = 0;

  for (const _ref of glyphString) {
    const { index } = _ref;

    const codePoint = glyphString.codePointAtGlyphIndex(index);

    // Not break words in no-break-spaces
    if (codePoint === NO_BREAK_SPACE_DECIMAL) {
      continue;
    }

    if (glyphString.isWhiteSpace(index - start)) {
      const word = glyphString.slice(lastIndex, index - start);

      if (word.length > 0) {
        words.push(word);
      }

      lastIndex = index - start + 1;
    }
  }

  if (lastIndex < glyphString.end) {
    const word = glyphString.slice(lastIndex, glyphString.end - glyphString.start);
    words.push(word);
  }

  return words;
};

const h = new Hypher(english);
const hyphenateString = string => {
  if (string.includes(SOFT_HYPHEN_HEX)) {
    return string.split(SOFT_HYPHEN_HEX);
  }

  return h.hyphenate(string);
};

const hyphenateWord = glyphString => {
  const hyphenated = hyphenateString(glyphString.string);

  let index = 0;
  const parts = hyphenated.map(part => {
    const res = glyphString.slice(index, index + part.length);
    index += part.length;
    return res;
  });

  return parts;
};

const hyphenate = words => words.map(word => hyphenateWord(word));

const formatter = (measureText, textAlign, callback) => {
  const spaceWidth = measureText(' ');
  const hyphenWidth = measureText('-');
  const hyphenPenalty = !textAlign || textAlign === 'justify' ? 100 : 600;
  const opts = {
    width: 3,
    stretch: 6,
    shrink: 9
  };

  return glyphString => {
    const nodes = [];
    const words = getWords(glyphString);
    const spaceStretch = spaceWidth * opts.width / opts.stretch;
    const spaceShrink = spaceWidth * opts.width / opts.shrink;
    const hyphenationCallback = callback || hyphenate;
    const hyphenatedWords = hyphenationCallback(words, glyphString);

    hyphenatedWords.forEach((word, index, array) => {
      if (word.length > 1) {
        word.forEach((part, partIndex, partArray) => {
          const isLastPart = partIndex === word.length - 1;

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

const HYPHEN = 0x002d;
const TOLERANCE_LIMIT = 40;

var lineBreaker = (({ hyphenationCallback } = {}) => Textkit => {
  const TextkitLinebreaker = createLinebreaker()(Textkit);
  const fallbackLinebreaker = new TextkitLinebreaker();

  return class KPLineBreaker {
    constructor(tolerance) {
      this.tolerance = tolerance || 4;
    }

    suggestLineBreak(glyphString, width, paragraphStyle) {
      let tolerance = this.tolerance;
      const measuredWidth = this.measureWidth(glyphString);
      const nodes = formatter(measuredWidth, paragraphStyle.align, hyphenationCallback)(glyphString);
      let breaks = [];

      // Try again with a higher tolerance if the line breaking failed.
      while (breaks.length === 0 && tolerance < TOLERANCE_LIMIT) {
        breaks = linebreak(nodes, [width], { tolerance });
        tolerance += 2;
      }

      // Fallback to textkit default's linebreaking algorithm if K&P fails
      if (breaks.length === 0) {
        const fallback = fallbackLinebreaker.suggestLineBreak(glyphString, width, paragraphStyle);
        if (fallback) return fallback;

        // If fallback didn't worked, we split workd based on width
        const index = glyphString.glyphIndexAtOffset(width) - 1;
        glyphString.insertGlyph(index, HYPHEN);
        return { position: index + 1 };
      }

      if (!breaks[1]) {
        return { position: glyphString.end };
      }

      const breakNode = this.findBreakNode(nodes, breaks[1].position);
      const breakIndex = breakNode.value.end - glyphString.start;

      if (breakNode.hyphenated) {
        glyphString.insertGlyph(breakIndex, HYPHEN);
        return { position: breakIndex + 1 };
      }

      // We kep the blank space at the end of the line to avoid justification issues
      const offset = glyphString.isWhiteSpace(breakIndex) ? 1 : 0;
      return { position: breakIndex + offset };
    }

    measureWidth(glyphString) {
      const { font, fontSize } = glyphString.glyphRuns[0].attributes;

      return word => {
        if (typeof word === 'string') {
          const scale = fontSize / font.unitsPerEm;
          return font.layout(word).positions[0].xAdvance * scale;
        }

        return word.advanceWidth;
      };
    }

    findBreakNode(nodes, position) {
      let index = position - 1;

      while (!nodes[index].value) {
        index -= 1;
      }

      return nodes[index];
    }
  };
});

// justificationEngine values
const shrinkWhitespaceFactor = { before: -0.5, after: -0.5 };

class LayoutEngine$1 extends LayoutEngine {
  constructor({ hyphenationCallback }) {
    const engines = {
      scriptItemizer: scriptItemizer(),
      decorationEngine: textDecorationEngine(),
      lineFragmentGenerator: lineFragmentGenerator(),
      fontSubstitutionEngine: fontSubstitutionEngine(),
      lineBreaker: lineBreaker({ hyphenationCallback }),
      justificationEngine: justificationEngine({ shrinkWhitespaceFactor })
    };

    super(engines);
  }
}

// Extracted from https://github.com/devongovett/pdfkit/blob/master/lib/image/jpeg.coffee

const MARKERS = [0xffc0, 0xffc1, 0xffc2, 0xffc3, 0xffc5, 0xffc6, 0xffc7, 0xffc8, 0xffc9, 0xffca, 0xffcb, 0xffcc, 0xffcd, 0xffce, 0xffcf];

class JPEG {

  constructor(data) {
    this.data = null;
    this.width = null;
    this.height = null;

    this.data = data;

    if (data.readUInt16BE(0) !== 0xffd8) {
      throw new Error('SOI not found in JPEG');
    }

    let marker;
    let pos = 2;

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
  }
}

const Buffer$1 = require('buffer/').Buffer;

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

const fetchImage = src => {
  if (typeof src === 'object') {
    if (src.data && src.format) {
      // Local file given
      return new _Promise((resolve, reject) => resolve(getImage(src.data, src.format)));
    }
    throw new Error(`Invalid data given for local file: ${_JSON$stringify(src)}`);
  }

  return fetch(src).then(response => {
    if (response.buffer) {
      return response.buffer();
    }
    return response.arrayBuffer();
  }).then(arrayBuffer => {
    if (arrayBuffer.constructor.name === 'Buffer') {
      return arrayBuffer;
    }
    return Buffer$1.from(arrayBuffer);
  }).then(body => {
    const isPng = body[0] === 137 && body[1] === 80 && body[2] === 78 && body[3] === 71 && body[4] === 13 && body[5] === 10 && body[6] === 26 && body[7] === 10;

    const isJpg = body[0] === 255 && body[1] === 216 && body[2] === 255;

    let extension = '';
    if (isPng) {
      extension = 'png';
    } else if (isJpg) {
      extension = 'jpg';
    } else {
      throw new Error('Not valid image extension');
    }

    return getImage(body, extension);
  }).catch(() => {
    throw new Error(`Couldn't fetch image: ${src}`);
  });
};

/* eslint-disable no-cond-assign */
// Caches emoji images data
const emojis = {};
const regex = emojiRegex();

const reflect = promise => (...args) => promise(...args).then(v => v, e => e);

const fetchEmojiImage = reflect(fetchImage);

const getCodePoints = string => _Array$from(string).map(char => char.codePointAt(0).toString(16)).join('-');

const buildEmojiUrl = emoji => {
  const { url, format } = Font.getEmojiSource();
  return `${url}${getCodePoints(emoji)}.${format}`;
};

const fetchEmojis = string => {
  const emojiSource = Font.getEmojiSource();

  if (!emojiSource || !emojiSource.url) return [];

  const promises = [];

  let match;
  while (match = regex.exec(string)) {
    const emoji = match[0];

    if (!emojis[emoji] || emojis[emoji].loading) {
      const emojiUrl = buildEmojiUrl(emoji);

      emojis[emoji] = { loading: true };

      promises.push(fetchEmojiImage(emojiUrl).then(image => {
        emojis[emoji].loading = false;
        emojis[emoji].data = image.data;
      }));
    }
  }

  return promises;
};

const embedEmojis = fragments => {
  const result = [];

  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i];

    let match;
    let lastIndex = 0;

    while (match = regex.exec(fragment.string)) {
      const index = match.index;
      const emoji = match[0];
      const emojiSize = fragment.attributes.fontSize;
      const chunk = fragment.string.slice(lastIndex, index + match[0].length);

      // If emoji image was found, we create a new fragment with the
      // correct attachment and object substitution character;
      if (emojis[emoji] && emojis[emoji].data) {
        result.push({
          string: chunk.replace(match, Attachment.CHARACTER),
          attributes: _extends({}, fragment.attributes, {
            attachment: new Attachment(emojiSize, emojiSize, {
              yOffset: Math.floor(emojiSize * 0.1),
              image: emojis[emoji].data
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

      lastIndex = index + emoji.length;
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

class Document$1 {

  constructor(root, props) {
    this.root = root;
    this.props = props;
    this.children = [];
  }

  get name() {
    return 'Document';
  }

  get pageCount() {
    return this.children.reduce((acc, page) => acc + page.subpagesCount, 0);
  }

  appendChild(child) {
    child.parent = this;
    child.previousPage = this.children[this.children.length - 1];
    this.children.push(child);
  }

  removeChild(child) {
    const i = this.children.indexOf(child);
    child.parent = null;

    if (this.children[i + 1]) {
      this.children[i + 1].previousPage = this.children[i].previousPage;
    }

    this.children.slice(i, 1);
  }

  addMetaData() {
    const { title, author, subject, keywords, creator, producer } = this.props;

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
  }

  async loadFonts() {
    const promises = [];
    const listToExplore = this.children.slice(0);

    while (listToExplore.length > 0) {
      const node = listToExplore.shift();

      if (node.style && node.style.fontFamily) {
        promises.push(Font.load(node.style.fontFamily, this.root));
      }

      if (node.children) {
        node.children.forEach(childNode => {
          listToExplore.push(childNode);
        });
      }
    }

    await _Promise.all(promises);
  }

  async loadEmojis() {
    const promises = [];
    const listToExplore = this.children.slice(0);

    while (listToExplore.length > 0) {
      const node = listToExplore.shift();

      if (typeof node === 'string') {
        promises.push(...fetchEmojis(node));
      } else if (node.children) {
        node.children.forEach(childNode => {
          listToExplore.push(childNode);
        });
      }
    }

    await _Promise.all(promises);
  }

  async loadImages() {
    const promises = [];
    const listToExplore = this.children.slice(0);

    while (listToExplore.length > 0) {
      const node = listToExplore.shift();

      if (node.name === 'Image') {
        promises.push(node.fetch());
      }

      if (node.children) {
        node.children.forEach(childNode => {
          listToExplore.push(childNode);
        });
      }
    }

    await _Promise.all(promises);
  }

  async loadAssets() {
    await _Promise.all([this.loadFonts(), this.loadImages()]);
  }

  applyProps() {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].applyProps();
    }
  }

  async wrapChildren() {
    for (let i = 0; i < this.children.length; i++) {
      await this.children[i].wrapPage();
    }
  }

  async renderChildren() {
    for (let i = 0; i < this.children.length; i++) {
      await this.children[i].render();
    }
  }

  async render() {
    try {
      this.addMetaData();
      this.applyProps();
      await this.loadEmojis();
      await this.loadAssets();
      await this.wrapChildren();
      await this.renderChildren();
      this.root.end();
      Font.reset();
    } catch (e) {
      throw e;
    }
  }
}

Document$1.defaultProps = {
  author: null,
  keywords: null,
  subject: null,
  title: null
};

const ALMOST_ZERO = 0.000001;

class Node$1 {
  constructor(root, props) {
    this._top = null;
    this._left = null;
    this._width = null;
    this._heigth = null;
    this._padding = {};
    this._margin = {};

    this.layout = Yoga.Node.createDefault();
  }

  get top() {
    if (!this._top) {
      this._top = this.layout.getComputedLayout().top - this.marginTop;
    }

    return this._top;
  }

  get left() {
    if (!this._left) {
      this._left = this.layout.getComputedLayout().left - this.marginLeft;
    }

    return this._left;
  }

  get width() {
    if (!this._width) {
      this._width = this.layout.getComputedLayout().width + this.marginLeft + this.marginRight;
    }

    return this._width;
  }

  get height() {
    if (!this._heigth) {
      this._heigth = this.layout.getComputedLayout().height + this.marginTop + this.marginBottom;
    }

    return this._heigth;
  }

  get paddingTop() {
    if (!this._padding.top) {
      this._padding.top = this.layout.getComputedPadding(Yoga.EDGE_TOP);
    }

    return this._padding.top;
  }

  get paddingRight() {
    if (!this._padding.right) {
      this._padding.right = this.layout.getComputedPadding(Yoga.EDGE_RIGHT);
    }

    return this._padding.right;
  }

  get paddingBottom() {
    if (!this._padding.bottom) {
      this._padding.bottom = this.layout.getComputedPadding(Yoga.EDGE_BOTTOM);
    }

    return this._padding.bottom;
  }

  get paddingLeft() {
    if (!this._padding.left) {
      this._padding.left = this.layout.getComputedPadding(Yoga.EDGE_LEFT);
    }

    return this._padding.left;
  }

  get marginTop() {
    if (!this._margin.top) {
      this._margin.top = this.layout.getComputedMargin(Yoga.EDGE_TOP);
    }

    return this._margin.top;
  }

  get marginRight() {
    if (!this._margin.right) {
      this._margin.right = this.layout.getComputedMargin(Yoga.EDGE_RIGHT);
    }

    return this._margin.right;
  }

  get marginBottom() {
    if (!this._margin.bottom) {
      this._margin.bottom = this.layout.getComputedMargin(Yoga.EDGE_BOTTOM);
    }

    return this._margin.bottom;
  }

  get marginLeft() {
    if (!this._margin.left) {
      this._margin.left = this.layout.getComputedMargin(Yoga.EDGE_LEFT);
    }

    return this._margin.left;
  }

  get padding() {
    return {
      top: this.paddingTop,
      right: this.paddingRight,
      bottom: this.paddingBottom,
      left: this.paddingLeft
    };
  }

  get margin() {
    return {
      top: this.marginTop,
      right: this.marginRight,
      bottom: this.marginBottom,
      left: this.marginLeft
    };
  }

  set top(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._top = value;
  }

  set left(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._left = value;
  }

  set width(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._width = value;
  }

  set height(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._heigth = value;
  }

  set paddingTop(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._padding.top = value;
  }

  set paddingRight(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._padding.right = value;
  }

  set paddingBottom(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._padding.bottom = value;
  }

  set paddingLeft(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._padding.left = value;
  }

  set marginTop(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._margin.top = value;
  }

  set marginRight(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._margin.right = value;
  }

  set marginBottom(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._margin.bottom = value;
  }

  set marginLeft(value) {
    if (value === 0) {
      value = ALMOST_ZERO;
    }

    this._margin.left = value;
  }

  set padding(value) {
    this._padding = value;
  }

  set margin(value) {
    this._margin = value;
  }

  reset() {
    this.top = null;
    this.left = null;
    this.width = null;
    this.height = null;
    this.padding = {};
    this.margin = {};
  }
}

const yogaValue = (prop, value) => {
  const isAlignType = prop => prop === 'alignItems' || prop === 'alignContent' || prop === 'alignSelf';

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

const hasOwnProperty = Object.prototype.hasOwnProperty;

const styleShortHands = {
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
const expandStyles = style => {
  if (!style) return style;

  const propsArray = _Object$keys(style);
  const resolvedStyle = {};

  for (let i = 0; i < propsArray.length; i++) {
    const key = propsArray[i];
    const value = style[key];

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
          const expandedProps = styleShortHands[key];
          for (const propName in expandedProps) {
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

const matchBorderShorthand = value => value.match(/(\d+)px?\s(\S+)\s(\S+)/);

// Transforms shorthand border values to correct value
const processBorders = style => {
  const propsArray = _Object$keys(style);
  const resolvedStyle = {};

  for (let i = 0; i < propsArray.length; i++) {
    const key = propsArray[i];
    const value = style[key];

    if (typeof value === 'string' && key.match(/border/)) {
      const match = matchBorderShorthand(value);

      if (match) {
        if (key.match(/.Color/)) {
          resolvedStyle[key] = match[3];
        } else if (key.match(/.Style/)) {
          resolvedStyle[key] = match[2];
        } else if (key.match(/.Width/)) {
          resolvedStyle[key] = match[1];
        } else {
          throw new Error(`StyleSheet: Invalid '${value}' for '${key}'`);
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

const transformStyles = style => {
  return processBorders(expandStyles(style));
};

const create = styles => styles;

const flatten = input => {
  if (!Array.isArray(input)) {
    input = [input];
  }

  const result = input.reduce((acc, style) => {
    if (style) {
      _Object$keys(style).forEach(key => {
        if (style[key] !== null || style[key] !== undefined) {
          acc[key] = style[key];
        }
      });
    }

    return acc;
  }, {});

  return result;
};

const resolveMediaQueries = (input, container) => {
  const result = _Object$keys(input).reduce((acc, key) => {
    if (/@media/.test(key)) {
      return _extends({}, acc, matchMedia({ [key]: input[key] }, container));
    }

    return _extends({}, acc, { [key]: input[key] });
  }, {});

  return result;
};

const resolve = (styles, container) => {
  if (!styles) {
    return null;
  }

  styles = flatten(styles);
  styles = resolveMediaQueries(styles, container);

  return transformStyles(styles);
};

const absoluteFillObject = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
};

var StyleSheet = {
  hairlineWidth: 1,
  create,
  resolve,
  flatten,
  absoluteFillObject
};

const Debug = {
  debugText(layout) {
    this.root.fontSize(4);
    this.root.opacity(1);
    this.root.fillColor('black');
    this.root.text(`${layout.width} x ${layout.height}`, layout.left, Math.max(layout.top - 4, 0));
  },
  debugContent(layout, margin, padding) {
    this.root.fillColor('#a1c6e7');
    this.root.opacity(0.5);
    this.root.rect(layout.left + padding.left + margin.left, layout.top + padding.top + margin.top, layout.width - padding.left - padding.right - margin.left - margin.right, layout.height - padding.top - padding.bottom - margin.top - margin.bottom).fill();
  },
  debugPadding(layout, margin, padding) {
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
  debugMargin(layout, margin) {
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
  debug() {
    const layout = this.getAbsoluteLayout();
    const padding = this.padding;
    const margin = this.margin;

    this.root.save();

    this.debugContent(layout, margin, padding);
    this.debugPadding(layout, margin, padding);
    this.debugMargin(layout, margin);
    this.debugText(layout);

    this.root.restore();
  }
};

const Borders = {
  traceBorder(style, width) {
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
  drawHorizontalBorder(p1, p2, r1, r2, width, color, style) {
    if (width <= 0) return;

    this.root.lineWidth(width).moveTo(p1[0], p1[1] + r1).quadraticCurveTo(p1[0], p1[1], p1[0] + r1, p1[1]).lineTo(p2[0] - r2, p2[1]).quadraticCurveTo(p2[0], p2[1], p2[0], p2[1] + r2).strokeColor(color);

    this.traceBorder(style, width);
  },
  drawVerticalBorder(p1, p2, r1, r2, width, color, style) {
    if (width <= 0) return;

    this.root.lineWidth(width).moveTo(p1[0] + r1, p1[1]).quadraticCurveTo(p1[0], p1[1], p1[0], p1[1] - r1).lineTo(p2[0], p2[1] + r2).quadraticCurveTo(p2[0], p2[1], p2[0] + r2, p2[1]).strokeColor(color);

    this.traceBorder(style, width);
  },
  drawBorders() {
    const margin = this.margin;
    const { left, top, width, height } = this.getAbsoluteLayout();

    const {
      borderTopWidth = 0,
      borderRightWidth = 0,
      borderBottomWidth = 0,
      borderLeftWidth = 0,
      borderTopLeftRadius = 0,
      borderTopRightRadius = 0,
      borderBottomRightRadius = 0,
      borderBottomLeftRadius = 0,
      borderTopColor = 'black',
      borderRightColor = 'black',
      borderBottomColor = 'black',
      borderLeftColor = 'black',
      borderTopStyle = 'solid',
      borderRightStyle = 'solid',
      borderBottomStyle = 'solid',
      borderLeftStyle = 'solid'
    } = this.getComputedStyles();

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

const inheritedProperties = ['color', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'textAlign', 'visibility', 'wordSpacing'];

const PERCENT = /^(\d+)?%$/g;

class Base extends Node$1 {

  constructor(root, props) {
    super();

    this.root = root;
    this.parent = null;
    this.children = [];

    this.props = merge({}, this.constructor.defaultProps, Base.defaultProps, props);

    warning(!this.props.styles, '"styles" prop passed instead of "style" prop');

    this.layout = Yoga.Node.createDefault();
    this.canBeSplitted = false;
  }

  get page() {
    return this.parent.page;
  }

  appendChild(child) {
    if (child) {
      child.parent = this;
      this.children.push(child);
      this.layout.insertChild(child.layout, this.layout.getChildCount());
    }
  }

  removeChild(child) {
    const index = this.children.indexOf(child);

    if (index !== -1) {
      child.parent = null;
      this.children.splice(index, 1);
      this.layout.removeChild(child.layout);
    }
  }

  moveTo(parent) {
    this.reset();
    this.parent.removeChild(this);
    parent.appendChild(this);
  }

  applyProps() {
    const { size, orientation } = this.page;

    this.style = this.style || StyleSheet.resolve(this.props.style, {
      width: size[0],
      height: size[1],
      orientation: orientation
    });

    toPairsIn(this.style).map(([attribute, value]) => {
      this.applyStyle(attribute, value);
    });

    this.children.forEach(child => {
      if (child.applyProps) {
        child.applyProps();
      }
    });
  }

  setDimension(attr, value) {
    const fixedMethod = `set${upperFirst(attr)}`;
    const percentMethod = `${fixedMethod}Percent`;
    const isPercent = PERCENT.exec(value);

    if (isPercent) {
      this.layout[percentMethod](parseInt(isPercent[1], 10));
    } else {
      this.layout[fixedMethod](value);
    }
  }

  setPosition(edge, value) {
    const isPercent = PERCENT.exec(value);

    if (isPercent) {
      this.layout.setPositionPercent(edge, parseInt(isPercent[1], 10));
    } else {
      this.layout.setPosition(edge, value);
    }
  }

  applyStyle(attribute, value) {
    const setter = `set${upperFirst(attribute)}`;

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
  }

  isAbsolute() {
    return this.props.style.position === 'absolute';
  }

  isEmpty() {
    return this.children.length === 0;
  }

  recalculateLayout() {
    this.children.forEach(child => child.recalculateLayout());
  }

  getAbsoluteLayout() {
    const parentMargin = this.parent.margin || { left: 0, top: 0 };
    const parentLayout = this.parent.getAbsoluteLayout ? this.parent.getAbsoluteLayout() : { left: 0, top: 0 };

    return {
      left: this.left + parentMargin.left + parentLayout.left,
      top: this.top + parentMargin.top + parentLayout.top,
      height: this.height,
      width: this.width
    };
  }

  getWidth() {
    return this.layout.getComputedWidth() + this.layout.getComputedMargin(Yoga.EDGE_LEFT) + this.layout.getComputedMargin(Yoga.EDGE_RIGTH) - this.layout.getComputedPadding(Yoga.EDGE_LEFT) - this.layout.getComputedPadding(Yoga.EDGE_RIGTH);
  }

  getHeight() {
    return this.layout.getComputedHeight() + this.layout.getComputedMargin(Yoga.EDGE_TOP) + this.layout.getComputedMargin(Yoga.EDGE_BOTTOM) - this.layout.getComputedPadding(Yoga.EDGE_TOP) - this.layout.getComputedPadding(Yoga.EDGE_BOTTOM);
  }

  getComputedStyles() {
    let element = this.parent;
    let inheritedStyles = {};

    while (element && element.parent) {
      inheritedStyles = _extends({}, element.parent.style, element.style, inheritedStyles);
      element = element.parent;
    }

    return _extends({}, pick(inheritedStyles, inheritedProperties), this.style);
  }

  drawBackgroundColor() {
    const margin = this.margin;
    const { left, top, width, height } = this.getAbsoluteLayout();
    const styles = this.getComputedStyles();

    // We can't set individual radius for each corner on PDF, so we get the higher
    const borderRadius = Math.max(styles.borderTopLeftRadius, styles.borderTopRightRadius, styles.borderBottomRightRadius, styles.borderBottomLeftRadius) || 0;

    if (styles.backgroundColor) {
      this.root.fillColor(styles.backgroundColor).roundedRect(left + margin.left, top + margin.top, width - margin.left - margin.right, height - margin.top - margin.bottom, borderRadius).fill();
    }
  }

  wrapHeight(height) {
    return Math.min(height, this.height);
  }

  clone() {
    const clone = new this.constructor(this.root, this.props);

    clone.width = this.width;
    clone.style = this.style;
    clone.parent = this.parent;
    clone.height = this.height;
    clone.margin = this.margin;
    clone.padding = this.padding;

    return clone;
  }

  async renderChildren(page) {
    const absoluteChilds = this.children.filter(child => child.isAbsolute());
    const nonAbsoluteChilds = this.children.filter(child => !child.isAbsolute());

    for (let i = 0; i < nonAbsoluteChilds.length; i++) {
      await nonAbsoluteChilds[i].render(page);
    }

    for (let i = 0; i < absoluteChilds.length; i++) {
      await absoluteChilds[i].render(page);
    }
  }
}

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

class SubPage extends Base {
  constructor(root, props, number) {
    super(root, props);

    this._number = number;
  }

  get name() {
    return 'SubPage';
  }

  get page() {
    return this.parent;
  }

  get size() {
    return this.parent.size;
  }

  get style() {
    return this.parent.style;
  }

  set style(style) {
    return style;
  }

  get number() {
    return this._number + this.page.numberOffset;
  }

  resetMargins() {
    if (!!this.style.marginTop || !!this.style.marginBottom || !!this.style.marginLeft || !!this.style.marginRight) {
      warning(false, 'Margin values are not allowed on Page element. Use padding instead.');

      this.style.marginTop = 0;
      this.style.marginBottom = 0;
      this.style.marginLeft = 0;
      this.style.marginRight = 0;
    }
  }

  applyProps() {
    super.applyProps();
    this.resetMargins();

    if (this.props.size) {
      const size = this.size;

      if (this.props.orientation === 'landscape') {
        this.layout.setWidth(size[1]);
        this.layout.setHeight(size[0]);
      } else {
        this.layout.setWidth(size[0]);
        this.layout.setHeight(size[1]);
      }
    }
  }

  recalculateLayout() {
    super.recalculateLayout();
    this.layout.calculateLayout();
  }

  isEmpty() {
    const nonFixedChilds = this.children.filter(child => !child.props.fixed);
    if (nonFixedChilds.length === 0) {
      return true;
    }

    return nonFixedChilds.every(child => child.isEmpty());
  }

  wrap(height) {
    this.layout.calculateLayout();

    const nextPageElements = [];
    const result = this.clone();

    result._number = this._number + 1;

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const { fixed, wrap, minPresenceAhead } = child.props;

      const isElementOutside = height < child.top;
      const childBottom = child.top + child.height - this.paddingTop;
      const shouldElementSplit = height < childBottom;

      if (fixed) {
        const fixedElement = child.clone();
        fixedElement.children = child.children;
        result.appendChild(fixedElement);
      } else if (isElementOutside) {
        nextPageElements.push(child);
      } else if (child.props.break) {
        child.props.break = false;
        nextPageElements.push(...this.children.slice(i));
        break;
      } else if (minPresenceAhead) {
        let childIndex = 1;
        let presenceAhead = 0;
        let nextChild = this.children[i + childIndex];
        let isElementInside = height > nextChild.top;

        while (nextChild && isElementInside) {
          isElementInside = height > nextChild.top;
          presenceAhead += nextChild.wrapHeight(height - nextChild.top - this.marginTop);
          nextChild = this.children[i + childIndex++];
        }

        if (presenceAhead < minPresenceAhead) {
          nextPageElements.push(...this.children.slice(i));
          break;
        }
      } else if (shouldElementSplit) {
        const remainingHeight = height - child.top + this.paddingTop;

        if (!wrap) {
          nextPageElements.push(child);
        } else {
          result.appendChild(child.splice(remainingHeight, height));
        }
      }
    }

    nextPageElements.forEach(child => child.moveTo(result));
    result.applyProps();

    return result;
  }

  callChildFunctions() {
    const listToExplore = this.children.slice(0);

    while (listToExplore.length > 0) {
      const node = listToExplore.shift();
      const { pageCount } = this.page.document;

      if (node.renderCallback) {
        const callResult = node.renderCallback({
          totalPages: pageCount,
          pageNumber: this.number
        });

        node.renderCallback = null;
        node.children = [callResult];
        continue;
      }

      if (node.children) {
        listToExplore.push(...node.children);
      }
    }
  }

  layoutFixedElements() {
    this.reset();
    this.recalculateLayout();

    this.children.forEach(child => {
      if (child.props.fixed) {
        child.reset();
      }
    });
  }

  async render(page) {
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

    await this.renderChildren(page);

    this.page.renderRuler();
  }
}

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

const RULER_WIDTH = 13;
const RULER_COLOR = 'white';
const RULER_FONT_SIZE = 5;
const DEFAULT_RULER_STEPS = 50;
const LINE_WIDTH = 0.5;
const LINE_COLOR = 'gray';
const GRID_COLOR = '#ababab';

const range = (max, steps) => _Array$from({ length: Math.ceil(max / steps) }, (_, i) => i * steps);

const matchPercentage = value => {
  const match = value.match(/(\d+\.?\d*)%/);
  if (match) {
    return 100 / parseFloat(match[1], 10);
  }

  return null;
};

const Ruler = {
  getRulerWidth() {
    return RULER_WIDTH;
  },
  hasHorizontalRuler() {
    return this.props.ruler || this.props.horizontalRuler;
  },
  hasVerticalRuler() {
    return this.props.ruler || this.props.verticalRuler;
  },
  getHorizontalSteps() {
    const value = this.props.horizontalRulerSteps || this.props.rulerSteps || DEFAULT_RULER_STEPS;

    if (typeof value === 'string') {
      const percentage = matchPercentage(value);
      if (percentage) {
        const width = this.width - (this.hasVerticalRuler() ? RULER_WIDTH : 0);
        return width / percentage;
      }
      throw new Error('Page: Invalid horizontal steps value');
    }

    return value;
  },
  getVerticalSteps() {
    const value = this.props.verticalRulerSteps || this.props.rulerSteps || DEFAULT_RULER_STEPS;

    if (typeof value === 'string') {
      const percentage = matchPercentage(value);
      if (percentage) {
        const height = this.height - (this.hasHorizontalRuler() ? RULER_WIDTH : 0);
        return height / percentage;
      }
      throw new Error('Page: Invalid horizontal steps value');
    }

    return value;
  },
  renderRuler() {
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
  drawHorizontalRuler() {
    const offset = this.hasVerticalRuler() ? RULER_WIDTH : 0;

    this.root.rect(offset, 0, this.width, RULER_WIDTH).fill(RULER_COLOR).moveTo(this.hasVerticalRuler() ? RULER_WIDTH : 0, RULER_WIDTH).lineTo(this.width, RULER_WIDTH).stroke(LINE_COLOR);

    const hRange = range(this.width, this.getHorizontalSteps());

    hRange.map(step => {
      this.root.moveTo(offset + step, 0).lineTo(offset + step, RULER_WIDTH).stroke(LINE_COLOR).fillColor('black').text(`${Math.round(step)}`, offset + step + 1, 1);
    });

    hRange.map(step => {
      if (step !== 0) {
        this.root.moveTo(offset + step, RULER_WIDTH).lineTo(offset + step, this.height).stroke(GRID_COLOR);
      }
    });
  },
  drawVerticalRuler() {
    const offset = this.hasHorizontalRuler() ? RULER_WIDTH : 0;

    this.root.rect(0, offset, RULER_WIDTH, this.height).fill(RULER_COLOR).moveTo(RULER_WIDTH, this.hasHorizontalRuler() ? RULER_WIDTH : 0).lineTo(RULER_WIDTH, this.height).stroke(LINE_COLOR);

    const vRange = range(this.height, this.getVerticalSteps());

    vRange.map(step => {
      this.root.moveTo(0, offset + step).lineTo(RULER_WIDTH, offset + step).stroke(LINE_COLOR).fillColor('black').text(`${Math.round(step)}`, 1, offset + step + 1);
    });

    vRange.map(step => {
      if (step !== 0) {
        this.root.moveTo(RULER_WIDTH, offset + step).lineTo(this.width, offset + step).stroke(GRID_COLOR);
      }
    });
  }
};

class Page$1 {

  constructor(root, props) {
    this.root = root;
    this.parent = null;
    this.props = _extends({}, Page$1.defaultProps, props);
    this.previousPage = null;
    this.children = [];
    this._size = null;

    this.addInitialSubpage();
  }

  get name() {
    return 'Page';
  }

  get document() {
    return this.parent;
  }

  get orientation() {
    return this.props.orientation;
  }

  get initialSubpage() {
    return this.children[0];
  }

  get subpagesCount() {
    return this.children.length;
  }

  get numberOffset() {
    let result = 0;
    let page = this.previousPage;

    while (page) {
      result += page.subpagesCount;
      page = page.previousPage;
    }

    return result;
  }

  get width() {
    return this.size[0];
  }

  get height() {
    return this.size[1];
  }

  get padding() {
    return {
      top: this.style.paddingTop || 0,
      right: this.style.paddingRight || 0,
      bottom: this.style.paddingBottom || 0,
      left: this.style.paddingLeft || 0
    };
  }

  get size() {
    if (this._size) {
      return this._size;
    }

    const { size } = this.props;

    // Calculate size
    if (typeof size === 'string') {
      this._size = sizes[size.toUpperCase()];
    } else if (Array.isArray(size)) {
      this._size = size;
    } else if (typeof size === 'object' && size.width && size.height) {
      this._size = [size.width, size.height];
    } else {
      throw new Error(`Invalid Page size: ${size}`);
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

  applyProps() {
    this.style = StyleSheet.resolve(this.props.style);

    // Add some padding if ruler present, so we can see the whole page inside it
    const rulerWidth = this.getRulerWidth();
    const { paddingTop = 0, paddingLeft = 0 } = this.style;

    if (this.hasHorizontalRuler()) {
      this.style.paddingTop = paddingTop + rulerWidth;
    }

    if (this.hasVerticalRuler()) {
      this.style.paddingLeft = paddingLeft + rulerWidth;
    }

    // Apply props to page childrens
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].applyProps();
    }
  }

  addInitialSubpage() {
    const newSubpage = new SubPage(this.root, this.props, 1);
    newSubpage.parent = this;

    this.children.push(newSubpage);
  }

  appendChild(child) {
    this.children[0].appendChild(child);
  }

  removeChild(child) {
    this.children[0].removeChild(child);
  }

  async wrapPage() {
    const { paddingTop = 0, paddingBottom = 0 } = this.style;
    const height = this.height - paddingTop - paddingBottom;
    let nextSubpage = this.initialSubpage.wrap(height);

    while (this.props.wrap && !nextSubpage.isEmpty()) {
      this.children.push(nextSubpage);
      nextSubpage = nextSubpage.wrap(height);
    }
  }

  async render() {
    for (let i = 0; i < this.children.length; i++) {
      await this.children[i].render(this);
    }
  }
}

Page$1.defaultProps = {
  size: 'A4',
  orientation: 'portrait',
  style: {},
  wrap: false
};
_Object$assign(Page$1.prototype, Ruler);

class View$1 extends Base {

  get name() {
    return 'View';
  }

  isEmpty() {
    if (this.children.length === 0) {
      return false;
    }

    return this.children.every(child => child.isEmpty());
  }

  wrapHeight(height) {
    const { wrap } = this.props;

    if (!wrap && height < this.height) {
      return 0;
    }

    let result = 0;
    for (let i = 0; i < this.children.length; i++) {
      if (this.children.height > height) {
        break;
      }

      result += this.children.height;
    }
    return result;
  }

  splice(wrapHeight, pageHeight) {
    const nextViewElements = [];
    const result = this.clone();

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const { fixed, wrap, minPresenceAhead } = child.props;
      const isElementOutside = wrapHeight < child.top;
      const shouldElementSplit = wrapHeight < child.top + child.height;

      if (isElementOutside) {
        nextViewElements.push(child);
      } else if (fixed) {
        const fixedElement = child.clone();
        fixedElement.children = child.children;
        result.appendChild(fixedElement);
      } else if (child.props.break) {
        child.props.break = false;
        nextViewElements.push(...this.children.slice(i));
        break;
      } else if (minPresenceAhead) {
        let childIndex = 1;
        let presenceAhead = 0;
        let nextChild = this.children[i + childIndex];
        let isElementInside = wrapHeight > nextChild.top;

        while (nextChild && isElementInside) {
          isElementInside = wrapHeight > nextChild.top;
          presenceAhead += nextChild.wrapHeight(wrapHeight - nextChild.top - this.marginTop);
          nextChild = this.children[i + childIndex++];
        }

        if (presenceAhead < minPresenceAhead) {
          nextViewElements.push(...this.children.slice(i));
          break;
        }
      } else if (shouldElementSplit) {
        const remainingHeight = wrapHeight - child.top - this.marginTop;

        if (!wrap) {
          nextViewElements.push(child);
        } else {
          result.appendChild(child.splice(remainingHeight, pageHeight));
        }
      }
    }

    nextViewElements.forEach(child => child.moveTo(result));

    // If the View has fixed height, we calculate the new element heights.
    // If not, we set it up as NaN and use Yoga calculated heights as fallback.
    const h = this.style.height ? wrapHeight : NaN;

    result.marginTop = 0;
    result.paddingTop = 0;
    result.height = this.height - h;
    this.marginBottom = 0;
    this.paddingBottom = 0;
    this.height = h;

    return result;
  }

  async render(page) {
    this.drawBackgroundColor();
    this.drawBorders();

    if (this.props.debug) {
      this.debug();
    }

    await this.renderChildren(page);
  }
}

View$1.defaultProps = {
  style: {},
  wrap: true
};

const IGNORABLE_CODEPOINTS = [8232, // LINE_SEPARATOR
8233];

const buildSubsetForFont = font => IGNORABLE_CODEPOINTS.reduce((acc, codePoint) => {
  if (font.hasGlyphForCodePoint && font.hasGlyphForCodePoint(codePoint)) {
    return acc;
  }
  return [...acc, String.fromCharCode(codePoint)];
}, []);

const ignoreChars = fragments => fragments.map(fragment => {
  const charSubset = buildSubsetForFont(fragment.attributes.font);
  const subsetRegex = new RegExp(charSubset.join('|'));

  return {
    string: fragment.string.replace(subsetRegex, ''),
    attributes: fragment.attributes
  };
});

// Global layout engine
// It's created dynamically because it may accept a custom hyphenation callback
let LAYOUT_ENGINE;
const INFINITY = 99999;

// TODO: Import and pass Textkit as a whole
const PDFRenderer$2 = createPDFRenderer({ Rect });

class TextEngine {
  constructor(element) {
    this.element = element;
    this._container = null;
    this.start = 0;
    this.end = 0;
    this.computed = false;
    this.preprocessors = [ignoreChars, embedEmojis];
  }

  get container() {
    const lines = this._container.blocks.reduce((acc, block) => [...acc, ...block.lines], []);

    return _extends({}, this._container, {
      blocks: [{ lines: lines.splice(this.start, this.end) }]
    });
  }

  get layoutEngine() {
    if (!LAYOUT_ENGINE) {
      LAYOUT_ENGINE = new LayoutEngine$1({
        hyphenationCallback: Font.getHyphenationCallback()
      });
    }

    return LAYOUT_ENGINE;
  }

  get lines() {
    if (!this.container) {
      return [];
    }

    return this.container.blocks.reduce((acc, block) => [...acc, ...block.lines], []);
  }

  get height() {
    if (!this._container) {
      return -1;
    }

    return this.lines.reduce((acc, line) => acc + line.height, 0);
  }

  get width() {
    if (!this._container) {
      return -1;
    }

    return Math.max(...this.lines.map(line => line.advanceWidth));
  }

  get attributedString() {
    let fragments = [];
    const {
      color = 'black',
      fontFamily = 'Helvetica',
      fontSize = 18,
      textAlign = 'left',
      position,
      top,
      bottom,
      align,
      lineHeight,
      textDecoration,
      textDecorationColor,
      textDecorationStyle,
      textTransform
    } = this.element.getComputedStyles();

    warning(!align, '"align" style prop will be deprecated on future versions. Please use "textAlign" instead in Text node');

    this.element.children.forEach(child => {
      if (typeof child === 'string') {
        const obj = Font.getFont(fontFamily);
        const font = obj ? obj.data : fontFamily;
        const string = this.transformText(child, textTransform);

        fragments.push({
          string,
          attributes: {
            font,
            color,
            fontSize,
            align: textAlign,
            link: this.element.src,
            underlineStyle: textDecorationStyle,
            underline: textDecoration === 'underline',
            underlineColor: textDecorationColor || color,
            lineHeight: lineHeight ? lineHeight * fontSize : null,
            yOffset: position === 'relative' ? -top || bottom || 0 : null
          }
        });
      } else {
        if (child.engine) {
          fragments.push(...child.engine.attributedString);
        }
      }
    });

    for (const preprocessor of this.preprocessors) {
      fragments = preprocessor(fragments);
    }

    return fragments;
  }

  lineIndexAtHeight(height) {
    let counter = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];

      if (counter + line.height > height) {
        return i;
      }

      counter += line.height;
    }

    return this.lines.length;
  }

  heightAtLineIndex(index) {
    let counter = 0;

    for (let i = 0; i <= index; i++) {
      const line = this.lines[i];
      counter += line.height;
    }

    return counter;
  }

  splice(height) {
    const result = this.clone();
    const index = this.lineIndexAtHeight(height);

    result.start = index;
    result.end = this.end;
    this.end = index;

    return result;
  }

  clone() {
    const result = new TextEngine(this.element);
    result.computed = this.computed;
    result._container = this._container;
    return result;
  }

  transformText(text, transformation) {
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
  }

  layout(width, dirty) {
    if (this.computed) return;
    const path$$1 = new Path().rect(0, 0, width, INFINITY);
    const container = new Container(path$$1);
    const string = AttributedString.fromFragments(this.attributedString).trim();

    // Do the actual text layout
    this.layoutEngine.layout(string, [container]);

    // Get the total amount of rendered lines
    const linesCount = container.blocks.reduce((acc, block) => acc + block.lines.length, 0);

    this.computed = true;
    this._container = container;
    this.end = linesCount + 1;
  }

  render() {
    const margin = this.element.margin;
    const padding = this.element.padding;
    const { top, left } = this.element.getAbsoluteLayout();

    // We translate lines based on Yoga container
    const initialX = this.lines[0] ? this.lines[0].rect.y : 0;

    this.lines.forEach(line => {
      line.rect.x += left + margin.left + padding.left;
      line.rect.y += top + margin.top + padding.top - initialX;
    });

    const renderer = new PDFRenderer$2(this.element.root, {
      outlineLines: false
    });
    renderer.render(this.container);
  }
}

const WIDOW_THREASHOLD = 20;

class Text$1 extends Base {

  constructor(root, props) {
    super(root, props);

    this.engine = new TextEngine(this);
    this.layout.setMeasureFunc(this.measureText.bind(this));
    this.renderCallback = props.render;
  }

  get name() {
    return 'Text';
  }

  get src() {
    return null;
  }

  appendChild(child) {
    if (typeof child === 'string') {
      this.children.push(child);
    } else {
      child.parent = this;
      this.children.push(child);
    }
  }

  removeChild(child) {
    this.children = null;
  }

  measureText(width, widthMode, height, heightMode) {
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
  }

  getComputedStyles() {
    const styles = super.getComputedStyles();

    // For Text, we also inherit relative positioning because this is how
    // we define text yOffset, which should be applied for inline childs also
    if (this.parent.name === 'Text' && this.parent.style.position === 'relative') {
      styles.top = styles.top || this.parent.style.top;
      styles.bottom = styles.bottom || this.parent.style.bottom;
      styles.position = styles.position || 'relative';
    }

    return styles;
  }

  recalculateLayout() {
    this.layout.markDirty();
  }

  isEmpty() {
    return this.engine.lines.length === 0;
  }

  hasOrphans(linesQuantity, slicedLines) {
    return slicedLines === 1 && linesQuantity !== 1;
  }

  hasWidows(linesQuantity, slicedLines) {
    return linesQuantity !== 1 && linesQuantity - slicedLines === 1 && linesQuantity < WIDOW_THREASHOLD;
  }

  wrapHeight(height) {
    const { orphans, widows } = this.props;
    const linesQuantity = this.engine.lines.length;
    const sliceHeight = height - this.marginTop - this.paddingTop;
    const slicedLines = this.engine.lineIndexAtHeight(sliceHeight);

    let wrapHeight = height;

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
  }

  splice(height) {
    const wrapHeight = this.wrapHeight(height);
    const engine = this.engine.splice(wrapHeight);
    const result = this.clone();

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
  }

  async render(page) {
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
  }
}

Text$1.defaultProps = {
  wrap: true,
  widows: 2,
  orphans: 2
};

const PROTOCOL_REGEXP = /^(http|https|ftp|ftps|mailto)\:\/\//i;

class Link$1 extends Text$1 {

  get name() {
    return 'Link';
  }

  get src() {
    let { src } = this.props;

    if (typeof src === 'string' && !src.match(PROTOCOL_REGEXP)) {
      src = `http://${src}`;
    }

    return src;
  }
}

Link$1.defaultProps = {
  style: {
    color: 'blue',
    textDecoration: 'underline'
  }
};

const SAFETY_HEIGHT = 10;

// We manage two bounding boxes in this class:
//  - Yoga node: Image bounding box. Adjust based on image and page size
//  - Image node: Real image container. In most cases equals Yoga node, except if image is bigger than page
class Image$1 extends Base {

  constructor(root, props) {
    super(root, props);

    this.image = null;
    this.layout.setMeasureFunc(this.measureImage.bind(this));
  }

  get name() {
    return 'Image';
  }

  shouldGrow() {
    return !!this.getComputedStyles().flexGrow;
  }

  measureImage(width, widthMode, height, heightMode) {
    const imageMargin = this.margin;
    const pagePadding = this.page.padding;
    const pageArea = this.page.height - pagePadding.top - pagePadding.bottom - imageMargin.top - imageMargin.bottom - SAFETY_HEIGHT;

    if (widthMode === Yoga.MEASURE_MODE_EXACTLY && heightMode === Yoga.MEASURE_MODE_UNDEFINED) {
      const scaledHeight = width / this.ratio;
      return { height: Math.min(pageArea, scaledHeight) };
    }

    if (heightMode === Yoga.MEASURE_MODE_EXACTLY && (widthMode === Yoga.MEASURE_MODE_AT_MOST || widthMode === Yoga.MEASURE_MODE_UNDEFINED)) {
      return { width: Math.min(height * this.ratio, width) };
    }

    if (widthMode === Yoga.MEASURE_MODE_EXACTLY && heightMode === Yoga.MEASURE_MODE_AT_MOST) {
      const scaledHeight = width / this.ratio;
      return { height: Math.min(height, pageArea, scaledHeight) };
    }

    if (widthMode === Yoga.MEASURE_MODE_AT_MOST && heightMode === Yoga.MEASURE_MODE_AT_MOST) {
      const imageWidth = Math.min(this.image.width, width);

      return {
        width: imageWidth,
        height: imageWidth / this.ratio
      };
    }

    return { height, width };
  }

  isEmpty() {
    return false;
  }

  get ratio() {
    return this.image.data ? this.image.width / this.image.height : 1;
  }

  async fetch() {
    try {
      this.image = await fetchImage(this.props.src);
    } catch (e) {
      this.image = { width: 0, height: 0 };
      console.warn(e.message);
    }
  }

  async render() {
    const margin = this.margin;
    const padding = this.padding;
    const { left, top } = this.getAbsoluteLayout();

    this.drawBackgroundColor();
    this.drawBorders();

    if (this.props.debug) {
      this.debug();
    }

    if (this.image.data) {
      // Inner offset between yoga node and image box
      // Makes image centered inside Yoga node
      const containerWidth = this.width - margin.right - margin.left;
      const containerHeight = this.height - margin.top - margin.bottom;
      const imageWidth = Math.min(containerHeight * this.ratio, containerWidth);
      const xOffset = Math.max((containerWidth - imageWidth) / 2, 0);

      this.root.image(this.image.data, left + padding.left + margin.left + xOffset, top + padding.top + margin.top, {
        width: imageWidth - padding.left - padding.right,
        height: containerHeight - padding.top - padding.bottom
      });
    }
  }
}

Image$1.defaultProps = {
  wrap: false
};

function createElement(type, props, root) {
  let instance;

  switch (type) {
    case 'ROOT':
      instance = new PDFDocument({ autoFirstPage: false });
      break;
    case 'DOCUMENT':
      instance = new Document$1(root, props);
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

const PDFRenderer = ReactFiberReconciler({
  appendInitialChild(parentInstance, child) {
    if (parentInstance.appendChild) {
      parentInstance.appendChild(child);
    } else {
      parentInstance.document = child;
    }
  },

  createInstance(type, props, internalInstanceHandle) {
    return createElement(type, props, internalInstanceHandle);
  },

  createTextInstance(text, rootContainerInstance, internalInstanceHandle) {
    return text;
  },

  finalizeInitialChildren(domElement, type, props) {
    return false;
  },

  getPublicInstance(instance) {
    return instance;
  },

  prepareForCommit() {
    // Noop
  },

  prepareUpdate(domElement, type, oldProps, newProps) {
    return true;
  },

  resetAfterCommit() {
    // Noop
  },

  resetTextContent(domElement) {
    // Noop
  },

  getRootHostContext() {
    return emptyObject;
  },

  getChildHostContext() {
    return emptyObject;
  },

  shouldSetTextContent(type, props) {
    return false;
  },

  now: () => {},

  useSyncScheduling: true,

  mutation: {
    appendChild(parentInstance, child) {
      if (parentInstance.appendChild) {
        parentInstance.appendChild(child);
      } else {
        parentInstance.document = child;
      }
    },

    appendChildToContainer(parentInstance, child) {
      if (parentInstance.appendChild) {
        parentInstance.appendChild(child);
      } else {
        parentInstance.document = child;
      }
    },

    insertBefore(parentInstance, child, beforeChild) {
      // noob
    },

    insertInContainerBefore(parentInstance, child, beforeChild) {
      // noob
    },

    removeChild(parentInstance, child) {
      parentInstance.removeChild(child);
    },

    removeChildFromContainer(parentInstance, child) {
      if (parentInstance.removeChild) {
        parentInstance.removeChild(child);
      }
    },

    commitTextUpdate(textInstance, oldText, newText) {
      textInstance = newText;
    },

    commitMount(instance, type, newProps) {
      // Noop
    },

    commitUpdate(instance, updatePayload, type, oldProps, newProps) {
      // noop
    }
  }
});

const View = 'VIEW';
const Text = 'TEXT';
const Link = 'LINK';
const Page = 'PAGE';
const Image = 'IMAGE';
const Document = 'DOCUMENT';

const pdf = input => {
  async function toBlob() {
    await input.document.render();

    const stream = input.pipe(BlobStream());

    return new _Promise((resolve, reject) => {
      stream.on('finish', () => {
        const blob = stream.toBlob('application/pdf');

        if (input.document.props.onRender) {
          input.document.props.onRender({ blob });
        }

        resolve(blob);
      });

      stream.on('error', reject);
    });
  }

  async function toBuffer() {
    await input.document.render();

    if (input.document.props.onRender) {
      input.document.props.onRender();
    }

    return input;
  }

  async function toString() {
    let result = '';
    const render = input.document.render();

    return new _Promise(resolve => {
      render.on('data', function (buffer) {
        result += buffer;
      });

      render.on('end', function () {
        if (input.document.props.onRender) {
          input.document.props.onRender({ string: result });
        }

        resolve(result);
      });
    });
  }

  return {
    toBuffer,
    toBlob,
    toString
  };
};

const renderToStream = async function (element) {
  const container = createElement('ROOT');
  const node = PDFRenderer.createContainer(container);

  PDFRenderer.updateContainer(element, node, null);

  return pdf(container).toBuffer();
};

const renderToFile = async function (element, filePath, callback) {
  const output = await renderToStream(element);
  const stream = fs.createWriteStream(filePath);
  output.pipe(stream);

  await new _Promise((resolve, reject) => {
    stream.on('finish', () => {
      if (callback) {
        callback(output, filePath);
      }
      resolve(output);

      console.log(`📝  PDF successfully exported on ${path.resolve(filePath)}`);
    });
    stream.on('error', reject);
  });
};

const render = function (element, filePath, callback) {
  return renderToFile(element, filePath, callback);
};

var node = {
  pdf,
  View,
  Text,
  Link,
  Page,
  Font,
  Image,
  Document,
  StyleSheet,
  PDFRenderer,
  createElement,
  renderToStream,
  renderToFile,
  render
};

export { PDFRenderer, View, Text, Link, Page, Font, Image, Document, StyleSheet, createElement, pdf };
export default node;
//# sourceMappingURL=react-pdf.es.js.map
