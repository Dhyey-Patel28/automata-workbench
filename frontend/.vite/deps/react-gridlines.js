import {
  require_react
} from "./chunk-4BPZ7PBZ.js";
import {
  __commonJS
} from "./chunk-G3PMV62Z.js";

// node_modules/react-gridlines/build/index.js
var require_build = __commonJS({
  "node_modules/react-gridlines/build/index.js"(exports, module) {
    module.exports = (function(e) {
      var t = {};
      function r(n) {
        if (t[n]) return t[n].exports;
        var o = t[n] = { i: n, l: false, exports: {} };
        return e[n].call(o.exports, o, o.exports, r), o.l = true, o.exports;
      }
      return r.m = e, r.c = t, r.d = function(e2, t2, n) {
        r.o(e2, t2) || Object.defineProperty(e2, t2, { enumerable: true, get: n });
      }, r.r = function(e2) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e2, "__esModule", { value: true });
      }, r.t = function(e2, t2) {
        if (1 & t2 && (e2 = r(e2)), 8 & t2) return e2;
        if (4 & t2 && "object" == typeof e2 && e2 && e2.__esModule) return e2;
        var n = /* @__PURE__ */ Object.create(null);
        if (r.r(n), Object.defineProperty(n, "default", { enumerable: true, value: e2 }), 2 & t2 && "string" != typeof e2) for (var o in e2) r.d(n, o, (function(t3) {
          return e2[t3];
        }).bind(null, o));
        return n;
      }, r.n = function(e2) {
        var t2 = e2 && e2.__esModule ? function() {
          return e2.default;
        } : function() {
          return e2;
        };
        return r.d(t2, "a", t2), t2;
      }, r.o = function(e2, t2) {
        return Object.prototype.hasOwnProperty.call(e2, t2);
      }, r.p = "", r(r.s = 4);
    })([function(e, t, r) {
      e.exports = r(2)();
    }, function(e, t) {
      e.exports = require_react();
    }, function(e, t, r) {
      "use strict";
      var n = r(3);
      function o() {
      }
      function a() {
      }
      a.resetWarningCache = o, e.exports = function() {
        function e2(e3, t3, r3, o2, a2, i) {
          if (i !== n) {
            var c = new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");
            throw c.name = "Invariant Violation", c;
          }
        }
        function t2() {
          return e2;
        }
        e2.isRequired = e2;
        var r2 = { array: e2, bool: e2, func: e2, number: e2, object: e2, string: e2, symbol: e2, any: e2, arrayOf: t2, element: e2, elementType: e2, instanceOf: t2, node: e2, objectOf: t2, oneOf: t2, oneOfType: t2, shape: t2, exact: t2, checkPropTypes: a, resetWarningCache: o };
        return r2.PropTypes = r2, r2;
      };
    }, function(e, t, r) {
      "use strict";
      e.exports = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
    }, function(e, t, r) {
      "use strict";
      r.r(t);
      var n = r(1), o = r.n(n), a = r(0), i = r.n(a);
      const c = "function" == typeof btoa, l = "function" == typeof Buffer, u = ("function" == typeof TextDecoder && new TextDecoder(), "function" == typeof TextEncoder ? new TextEncoder() : void 0), f = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="], s = (((e2) => {
        let t2 = {};
        e2.forEach((e3, r2) => t2[e3] = r2);
      })(f), String.fromCharCode.bind(String)), d = ("function" == typeof Uint8Array.from && Uint8Array.from.bind(Uint8Array), (e2) => e2.replace(/[+\/]/g, (e3) => "+" == e3 ? "-" : "_").replace(/=+$/m, "")), p = (e2) => {
        let t2, r2, n2, o2, a2 = "";
        const i2 = e2.length % 3;
        for (let i3 = 0; i3 < e2.length; ) {
          if ((r2 = e2.charCodeAt(i3++)) > 255 || (n2 = e2.charCodeAt(i3++)) > 255 || (o2 = e2.charCodeAt(i3++)) > 255) throw new TypeError("invalid character found");
          t2 = r2 << 16 | n2 << 8 | o2, a2 += f[t2 >> 18 & 63] + f[t2 >> 12 & 63] + f[t2 >> 6 & 63] + f[63 & t2];
        }
        return i2 ? a2.slice(0, i2 - 3) + "===".substring(i2) : a2;
      }, h = c ? (e2) => btoa(e2) : l ? (e2) => Buffer.from(e2, "binary").toString("base64") : p, y = l ? (e2) => Buffer.from(e2).toString("base64") : (e2) => {
        let t2 = [];
        for (let r2 = 0, n2 = e2.length; r2 < n2; r2 += 4096) t2.push(s.apply(null, e2.subarray(r2, r2 + 4096)));
        return h(t2.join(""));
      }, g = (e2) => {
        if (e2.length < 2) return (t2 = e2.charCodeAt(0)) < 128 ? e2 : t2 < 2048 ? s(192 | t2 >>> 6) + s(128 | 63 & t2) : s(224 | t2 >>> 12 & 15) + s(128 | t2 >>> 6 & 63) + s(128 | 63 & t2);
        var t2 = 65536 + 1024 * (e2.charCodeAt(0) - 55296) + (e2.charCodeAt(1) - 56320);
        return s(240 | t2 >>> 18 & 7) + s(128 | t2 >>> 12 & 63) + s(128 | t2 >>> 6 & 63) + s(128 | 63 & t2);
      }, b = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g, v = (e2) => e2.replace(b, g), m = l ? (e2) => Buffer.from(e2, "utf8").toString("base64") : u ? (e2) => y(u.encode(e2)) : (e2) => h(v(e2)), A = (e2, t2 = false) => t2 ? d(m(e2)) : m(e2), O = A;
      var C = { "4A0": [4767.87, 6740.79], "2A0": [3370.39, 4767.87], A0: [2383.94, 3370.39], A1: [1683.78, 2383.94], A2: [1190.55, 1683.78], A3: [841.89, 1190.55], A4: [595.28, 841.89], A5: [419.53, 595.28], A6: [297.64, 419.53], A7: [209.76, 297.64], A8: [147.4, 209.76], A9: [104.88, 147.4], A10: [73.7, 104.88], B0: [2834.65, 4008.19], B1: [2004.09, 2834.65], B2: [1417.32, 2004.09], B3: [1000.63, 1417.32], B4: [708.66, 1000.63], B5: [498.9, 708.66], B6: [354.33, 498.9], B7: [249.45, 354.33], B8: [175.75, 249.45], B9: [124.72, 175.75], B10: [87.87, 124.72], C0: [2599.37, 3676.54], C1: [1836.85, 2599.37], C2: [1298.27, 1836.85], C3: [918.43, 1298.27], C4: [649.13, 918.43], C5: [459.21, 649.13], C6: [323.15, 459.21], C7: [229.61, 323.15], C8: [161.57, 229.61], C9: [113.39, 161.57], C10: [79.37, 113.39], RA0: [2437.8, 3458.27], RA1: [1729.13, 2437.8], RA2: [1218.9, 1729.13], RA3: [864.57, 1218.9], RA4: [609.45, 864.57], SRA0: [2551.18, 3628.35], SRA1: [1814.17, 2551.18], SRA2: [1275.59, 1814.17], SRA3: [907.09, 1275.59], SRA4: [637.8, 907.09], EXECUTIVE: [521.86, 756], FOLIO: [612, 936], LEGAL: [612, 1008], LETTER: [612, 792], TABLOID: [792, 1224] };
      function T(e2, t2, r2, n2) {
        var o2 = arguments.length > 4 && void 0 !== arguments[4] ? arguments[4] : 0, a2 = arguments.length > 5 && void 0 !== arguments[5] && arguments[5], i2 = a2 ? "<line x1='".concat(o2, "' y1='0' x2='").concat(o2, "' y2='").concat(e2, "'") : "<line x1='0' y1='".concat(o2, "' x2='").concat(e2, "' y2='").concat(o2, "'");
        return i2 += " style='stroke:".concat(t2, ";stroke-width:").concat(r2, ';stroke-dasharray="').concat(n2, `"' />`);
      }
      var S = function(e2, t2, r2, n2, o2, a2, i2, c2, l2, u2, f2, s2, d2) {
        var p2 = (function(e3, t3) {
          return e3 ? { width: 1 * e3[0] * t3, height: 1 * e3[1] * t3 } : null;
        })((function() {
          var e3 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "", t3 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "portrait", r3 = e3.toUpperCase();
          if (!C[r3]) return null;
          var n3 = C[r3];
          return "portrait" === t3.toLowerCase() ? n3 : [n3[1], n3[0]];
        })(s2, d2), f2);
        a2 *= f2, i2 *= f2;
        var h2 = (function(e3, t3, r3, n3, o3) {
          return T(t3, r3, n3, o3, 0, true) + T(e3, r3, n3, o3, 0, false);
        })(e2 *= f2, t2 *= f2, r2, n2, o2), y2 = "";
        if (a2 && i2) {
          for (var g2 = a2; g2 < e2; g2 += a2) y2 += T(t2, c2, l2, u2, g2, true);
          for (var b2 = i2; b2 < t2; b2 += i2) y2 += T(e2, c2, l2, u2, b2, false);
        }
        var v2 = (function(e3, t3, r3, n3) {
          return r3 ? '<defs>\n  <pattern id="Pattern" x="0" y="0" width="'.concat(e3, '" height="').concat(t3, '" patternUnits="userSpaceOnUse">\n    ').concat(n3, '\n  </pattern>\n</defs>\n<rect fill="url(#Pattern)" stroke="black" width="').concat(r3.width, '" height="').concat(r3.height, '"/>\n') : n3;
        })(e2, t2, p2, "".concat(h2).concat(y2)), m2 = p2 ? p2.width : e2, A2 = p2 ? p2.height : t2, S2 = "<svg xmlns='http://www.w3.org/2000/svg' width='".concat(m2, "' height='").concat(A2, "'>").concat(v2, "</svg>"), w2 = O(S2);
        return "url('data:image/svg+xml;base64,".concat(w2, "')");
      };
      function w() {
        return (w = Object.assign || function(e2) {
          for (var t2 = 1; t2 < arguments.length; t2++) {
            var r2 = arguments[t2];
            for (var n2 in r2) Object.prototype.hasOwnProperty.call(r2, n2) && (e2[n2] = r2[n2]);
          }
          return e2;
        }).apply(this, arguments);
      }
      function x(e2, t2) {
        return (function(e3) {
          if (Array.isArray(e3)) return e3;
        })(e2) || (function(e3, t3) {
          if ("undefined" == typeof Symbol || !(Symbol.iterator in Object(e3))) return;
          var r2 = [], n2 = true, o2 = false, a2 = void 0;
          try {
            for (var i2, c2 = e3[Symbol.iterator](); !(n2 = (i2 = c2.next()).done) && (r2.push(i2.value), !t3 || r2.length !== t3); n2 = true) ;
          } catch (e4) {
            o2 = true, a2 = e4;
          } finally {
            try {
              n2 || null == c2.return || c2.return();
            } finally {
              if (o2) throw a2;
            }
          }
          return r2;
        })(e2, t2) || (function(e3, t3) {
          if (!e3) return;
          if ("string" == typeof e3) return j(e3, t3);
          var r2 = Object.prototype.toString.call(e3).slice(8, -1);
          "Object" === r2 && e3.constructor && (r2 = e3.constructor.name);
          if ("Map" === r2 || "Set" === r2) return Array.from(e3);
          if ("Arguments" === r2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r2)) return j(e3, t3);
        })(e2, t2) || (function() {
          throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        })();
      }
      function j(e2, t2) {
        (null == t2 || t2 > e2.length) && (t2 = e2.length);
        for (var r2 = 0, n2 = new Array(t2); r2 < t2; r2++) n2[r2] = e2[r2];
        return n2;
      }
      function E(e2, t2) {
        if (null == e2) return {};
        var r2, n2, o2 = (function(e3, t3) {
          if (null == e3) return {};
          var r3, n3, o3 = {}, a3 = Object.keys(e3);
          for (n3 = 0; n3 < a3.length; n3++) r3 = a3[n3], t3.indexOf(r3) >= 0 || (o3[r3] = e3[r3]);
          return o3;
        })(e2, t2);
        if (Object.getOwnPropertySymbols) {
          var a2 = Object.getOwnPropertySymbols(e2);
          for (n2 = 0; n2 < a2.length; n2++) r2 = a2[n2], t2.indexOf(r2) >= 0 || Object.prototype.propertyIsEnumerable.call(e2, r2) && (o2[r2] = e2[r2]);
        }
        return o2;
      }
      var B = o.a.forwardRef((function(e2, t2) {
        var r2 = e2.component, a2 = void 0 === r2 ? "div" : r2, i2 = e2.className, c2 = e2.scale, l2 = void 0 === c2 ? 1 : c2, u2 = e2.cellWidth, f2 = void 0 === u2 ? 60 : u2, s2 = e2.cellHeight, d2 = e2.lineColor, p2 = void 0 === d2 ? "#ccc" : d2, h2 = e2.strokeWidth, y2 = void 0 === h2 ? 2 : h2, g2 = e2.dashArray, b2 = void 0 === g2 ? "0" : g2, v2 = e2.cellWidth2, m2 = e2.cellHeight2, A2 = e2.lineColor2, O2 = void 0 === A2 ? "#ddd" : A2, C2 = e2.strokeWidth2, T2 = void 0 === C2 ? 1 : C2, j2 = e2.dashArray2, B2 = void 0 === j2 ? "0" : j2, k = e2.format, R = e2.orientation, P = e2.children, W = E(e2, ["component", "className", "scale", "cellWidth", "cellHeight", "lineColor", "strokeWidth", "dashArray", "cellWidth2", "cellHeight2", "lineColor2", "strokeWidth2", "dashArray2", "format", "orientation", "children"]), _ = x(Object(n.useState)(""), 2), I = _[0], U = _[1], D = s2 || f2, F = m2 || v2, L = a2;
        return Object(n.useEffect)((function() {
          U(S(f2, D, p2, y2, b2, v2, F, O2, T2, B2, l2, k, R));
        }), [f2, D, p2, y2, b2, v2, F, O2, T2, B2, k, R, l2]), o.a.createElement(L, w({ className: i2, ref: t2, style: { backgroundImage: I } }, W), P);
      }));
      B.propTypes = { className: i.a.string, component: i.a.elementType, cellWidth: i.a.oneOfType([i.a.number, i.a.string]), cellHeight: i.a.oneOfType([i.a.number, i.a.string]), format: i.a.string, orientation: i.a.string, lineColor: i.a.string, strokeWidth: i.a.oneOfType([i.a.number, i.a.string]), dashArray: i.a.string, cellWidth2: i.a.oneOfType([i.a.number, i.a.string]), cellHeight2: i.a.oneOfType([i.a.number, i.a.string]), lineColor2: i.a.string, strokeWidth2: i.a.oneOfType([i.a.number, i.a.string]), scale: i.a.oneOfType([i.a.number, i.a.string]), dashArray2: i.a.string };
      t.default = B;
    }]);
  }
});
export default require_build();
//# sourceMappingURL=react-gridlines.js.map
