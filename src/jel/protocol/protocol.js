/* eslint-disable */
import $protobuf from "protobufjs";

const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const protocol = $root.protocol = (() => {

    const protocol = {};

    protocol.Geometry = (function() {

        function Geometry(properties) {
            this.position = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Geometry.prototype.position = $util.emptyArray;
        Geometry.prototype.color = $util.newBuffer([]);
        Geometry.prototype.uv = $util.newBuffer([]);
        Geometry.prototype.normal = $util.newBuffer([]);

        Geometry.create = function create(properties) {
            return new Geometry(properties);
        };

        Geometry.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.position != null && message.position.length) {
                writer.uint32(10).fork();
                for (let i = 0; i < message.position.length; ++i)
                    writer.float(message.position[i]);
                writer.ldelim();
            }
            if (message.color != null && Object.hasOwnProperty.call(message, "color"))
                writer.uint32(18).bytes(message.color);
            if (message.uv != null && Object.hasOwnProperty.call(message, "uv"))
                writer.uint32(26).bytes(message.uv);
            if (message.normal != null && Object.hasOwnProperty.call(message, "normal"))
                writer.uint32(34).bytes(message.normal);
            return writer;
        };

        Geometry.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        Geometry.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Geometry();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.position && message.position.length))
                        message.position = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.position.push(reader.float());
                    } else
                        message.position.push(reader.float());
                    break;
                case 2:
                    message.color = reader.bytes();
                    break;
                case 3:
                    message.uv = reader.bytes();
                    break;
                case 4:
                    message.normal = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        Geometry.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        Geometry.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.position != null && message.hasOwnProperty("position")) {
                if (!Array.isArray(message.position))
                    return "position: array expected";
                for (let i = 0; i < message.position.length; ++i)
                    if (typeof message.position[i] !== "number")
                        return "position: number[] expected";
            }
            if (message.color != null && message.hasOwnProperty("color"))
                if (!(message.color && typeof message.color.length === "number" || $util.isString(message.color)))
                    return "color: buffer expected";
            if (message.uv != null && message.hasOwnProperty("uv"))
                if (!(message.uv && typeof message.uv.length === "number" || $util.isString(message.uv)))
                    return "uv: buffer expected";
            if (message.normal != null && message.hasOwnProperty("normal"))
                if (!(message.normal && typeof message.normal.length === "number" || $util.isString(message.normal)))
                    return "normal: buffer expected";
            return null;
        };

        Geometry.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Geometry)
                return object;
            let message = new $root.protocol.Geometry();
            if (object.position) {
                if (!Array.isArray(object.position))
                    throw TypeError(".protocol.Geometry.position: array expected");
                message.position = [];
                for (let i = 0; i < object.position.length; ++i)
                    message.position[i] = Number(object.position[i]);
            }
            if (object.color != null)
                if (typeof object.color === "string")
                    $util.base64.decode(object.color, message.color = $util.newBuffer($util.base64.length(object.color)), 0);
                else if (object.color.length)
                    message.color = object.color;
            if (object.uv != null)
                if (typeof object.uv === "string")
                    $util.base64.decode(object.uv, message.uv = $util.newBuffer($util.base64.length(object.uv)), 0);
                else if (object.uv.length)
                    message.uv = object.uv;
            if (object.normal != null)
                if (typeof object.normal === "string")
                    $util.base64.decode(object.normal, message.normal = $util.newBuffer($util.base64.length(object.normal)), 0);
                else if (object.normal.length)
                    message.normal = object.normal;
            return message;
        };

        Geometry.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.position = [];
            if (options.defaults) {
                if (options.bytes === String)
                    object.color = "";
                else {
                    object.color = [];
                    if (options.bytes !== Array)
                        object.color = $util.newBuffer(object.color);
                }
                if (options.bytes === String)
                    object.uv = "";
                else {
                    object.uv = [];
                    if (options.bytes !== Array)
                        object.uv = $util.newBuffer(object.uv);
                }
                if (options.bytes === String)
                    object.normal = "";
                else {
                    object.normal = [];
                    if (options.bytes !== Array)
                        object.normal = $util.newBuffer(object.normal);
                }
            }
            if (message.position && message.position.length) {
                object.position = [];
                for (let j = 0; j < message.position.length; ++j)
                    object.position[j] = options.json && !isFinite(message.position[j]) ? String(message.position[j]) : message.position[j];
            }
            if (message.color != null && message.hasOwnProperty("color"))
                object.color = options.bytes === String ? $util.base64.encode(message.color, 0, message.color.length) : options.bytes === Array ? Array.prototype.slice.call(message.color) : message.color;
            if (message.uv != null && message.hasOwnProperty("uv"))
                object.uv = options.bytes === String ? $util.base64.encode(message.uv, 0, message.uv.length) : options.bytes === Array ? Array.prototype.slice.call(message.uv) : message.uv;
            if (message.normal != null && message.hasOwnProperty("normal"))
                object.normal = options.bytes === String ? $util.base64.encode(message.normal, 0, message.normal.length) : options.bytes === Array ? Array.prototype.slice.call(message.normal) : message.normal;
            return object;
        };

        Geometry.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Geometry;
    })();

    protocol.NavGeometry = (function() {

        function NavGeometry(properties) {
            this.position = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        NavGeometry.prototype.position = $util.emptyArray;
        NavGeometry.prototype.index = $util.newBuffer([]);

        NavGeometry.create = function create(properties) {
            return new NavGeometry(properties);
        };

        NavGeometry.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.position != null && message.position.length) {
                writer.uint32(10).fork();
                for (let i = 0; i < message.position.length; ++i)
                    writer.float(message.position[i]);
                writer.ldelim();
            }
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                writer.uint32(18).bytes(message.index);
            return writer;
        };

        NavGeometry.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        NavGeometry.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.NavGeometry();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.position && message.position.length))
                        message.position = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.position.push(reader.float());
                    } else
                        message.position.push(reader.float());
                    break;
                case 2:
                    message.index = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        NavGeometry.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        NavGeometry.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.position != null && message.hasOwnProperty("position")) {
                if (!Array.isArray(message.position))
                    return "position: array expected";
                for (let i = 0; i < message.position.length; ++i)
                    if (typeof message.position[i] !== "number")
                        return "position: number[] expected";
            }
            if (message.index != null && message.hasOwnProperty("index"))
                if (!(message.index && typeof message.index.length === "number" || $util.isString(message.index)))
                    return "index: buffer expected";
            return null;
        };

        NavGeometry.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.NavGeometry)
                return object;
            let message = new $root.protocol.NavGeometry();
            if (object.position) {
                if (!Array.isArray(object.position))
                    throw TypeError(".protocol.NavGeometry.position: array expected");
                message.position = [];
                for (let i = 0; i < object.position.length; ++i)
                    message.position[i] = Number(object.position[i]);
            }
            if (object.index != null)
                if (typeof object.index === "string")
                    $util.base64.decode(object.index, message.index = $util.newBuffer($util.base64.length(object.index)), 0);
                else if (object.index.length)
                    message.index = object.index;
            return message;
        };

        NavGeometry.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.position = [];
            if (options.defaults)
                if (options.bytes === String)
                    object.index = "";
                else {
                    object.index = [];
                    if (options.bytes !== Array)
                        object.index = $util.newBuffer(object.index);
                }
            if (message.position && message.position.length) {
                object.position = [];
                for (let j = 0; j < message.position.length; ++j)
                    object.position[j] = options.json && !isFinite(message.position[j]) ? String(message.position[j]) : message.position[j];
            }
            if (message.index != null && message.hasOwnProperty("index"))
                object.index = options.bytes === String ? $util.base64.encode(message.index, 0, message.index.length) : options.bytes === Array ? Array.prototype.slice.call(message.index) : message.index;
            return object;
        };

        NavGeometry.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return NavGeometry;
    })();

    protocol.Mesh = (function() {

        function Mesh(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Mesh.prototype.opaque = null;
        Mesh.prototype.transparent = null;
        Mesh.prototype.nav = null;

        Mesh.create = function create(properties) {
            return new Mesh(properties);
        };

        Mesh.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.opaque != null && Object.hasOwnProperty.call(message, "opaque"))
                $root.protocol.Geometry.encode(message.opaque, writer.uint32(10).fork()).ldelim();
            if (message.transparent != null && Object.hasOwnProperty.call(message, "transparent"))
                $root.protocol.Geometry.encode(message.transparent, writer.uint32(18).fork()).ldelim();
            if (message.nav != null && Object.hasOwnProperty.call(message, "nav"))
                $root.protocol.NavGeometry.encode(message.nav, writer.uint32(26).fork()).ldelim();
            return writer;
        };

        Mesh.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        Mesh.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Mesh();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.opaque = $root.protocol.Geometry.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.transparent = $root.protocol.Geometry.decode(reader, reader.uint32());
                    break;
                case 3:
                    message.nav = $root.protocol.NavGeometry.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        Mesh.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        Mesh.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.opaque != null && message.hasOwnProperty("opaque")) {
                let error = $root.protocol.Geometry.verify(message.opaque);
                if (error)
                    return "opaque." + error;
            }
            if (message.transparent != null && message.hasOwnProperty("transparent")) {
                let error = $root.protocol.Geometry.verify(message.transparent);
                if (error)
                    return "transparent." + error;
            }
            if (message.nav != null && message.hasOwnProperty("nav")) {
                let error = $root.protocol.NavGeometry.verify(message.nav);
                if (error)
                    return "nav." + error;
            }
            return null;
        };

        Mesh.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Mesh)
                return object;
            let message = new $root.protocol.Mesh();
            if (object.opaque != null) {
                if (typeof object.opaque !== "object")
                    throw TypeError(".protocol.Mesh.opaque: object expected");
                message.opaque = $root.protocol.Geometry.fromObject(object.opaque);
            }
            if (object.transparent != null) {
                if (typeof object.transparent !== "object")
                    throw TypeError(".protocol.Mesh.transparent: object expected");
                message.transparent = $root.protocol.Geometry.fromObject(object.transparent);
            }
            if (object.nav != null) {
                if (typeof object.nav !== "object")
                    throw TypeError(".protocol.Mesh.nav: object expected");
                message.nav = $root.protocol.NavGeometry.fromObject(object.nav);
            }
            return message;
        };

        Mesh.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.opaque = null;
                object.transparent = null;
                object.nav = null;
            }
            if (message.opaque != null && message.hasOwnProperty("opaque"))
                object.opaque = $root.protocol.Geometry.toObject(message.opaque, options);
            if (message.transparent != null && message.hasOwnProperty("transparent"))
                object.transparent = $root.protocol.Geometry.toObject(message.transparent, options);
            if (message.nav != null && message.hasOwnProperty("nav"))
                object.nav = $root.protocol.NavGeometry.toObject(message.nav, options);
            return object;
        };

        Mesh.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Mesh;
    })();

    protocol.Feature = (function() {

        function Feature(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Feature.prototype.types = 0;
        Feature.prototype.x = 0;
        Feature.prototype.y = 0;
        Feature.prototype.z = 0;

        Feature.create = function create(properties) {
            return new Feature(properties);
        };

        Feature.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.types != null && Object.hasOwnProperty.call(message, "types"))
                writer.uint32(8).int32(message.types);
            if (message.x != null && Object.hasOwnProperty.call(message, "x"))
                writer.uint32(16).int32(message.x);
            if (message.y != null && Object.hasOwnProperty.call(message, "y"))
                writer.uint32(24).int32(message.y);
            if (message.z != null && Object.hasOwnProperty.call(message, "z"))
                writer.uint32(32).int32(message.z);
            return writer;
        };

        Feature.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        Feature.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Feature();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.types = reader.int32();
                    break;
                case 2:
                    message.x = reader.int32();
                    break;
                case 3:
                    message.y = reader.int32();
                    break;
                case 4:
                    message.z = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        Feature.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        Feature.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.types != null && message.hasOwnProperty("types"))
                if (!$util.isInteger(message.types))
                    return "types: integer expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (!$util.isInteger(message.x))
                    return "x: integer expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (!$util.isInteger(message.y))
                    return "y: integer expected";
            if (message.z != null && message.hasOwnProperty("z"))
                if (!$util.isInteger(message.z))
                    return "z: integer expected";
            return null;
        };

        Feature.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Feature)
                return object;
            let message = new $root.protocol.Feature();
            if (object.types != null)
                message.types = object.types | 0;
            if (object.x != null)
                message.x = object.x | 0;
            if (object.y != null)
                message.y = object.y | 0;
            if (object.z != null)
                message.z = object.z | 0;
            return message;
        };

        Feature.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults) {
                object.types = 0;
                object.x = 0;
                object.y = 0;
                object.z = 0;
            }
            if (message.types != null && message.hasOwnProperty("types"))
                object.types = message.types;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = message.y;
            if (message.z != null && message.hasOwnProperty("z"))
                object.z = message.z;
            return object;
        };

        Feature.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Feature;
    })();

    protocol.Chunk = (function() {

        function Chunk(properties) {
            this.meshes = [];
            this.features = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Chunk.prototype.x = 0;
        Chunk.prototype.z = 0;
        Chunk.prototype.height = 0;
        Chunk.prototype.meshes = $util.emptyArray;
        Chunk.prototype.features = $util.emptyArray;

        Chunk.create = function create(properties) {
            return new Chunk(properties);
        };

        Chunk.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.x != null && Object.hasOwnProperty.call(message, "x"))
                writer.uint32(8).int32(message.x);
            if (message.z != null && Object.hasOwnProperty.call(message, "z"))
                writer.uint32(16).int32(message.z);
            if (message.height != null && Object.hasOwnProperty.call(message, "height"))
                writer.uint32(24).int32(message.height);
            if (message.meshes != null && message.meshes.length)
                for (let i = 0; i < message.meshes.length; ++i)
                    $root.protocol.Mesh.encode(message.meshes[i], writer.uint32(34).fork()).ldelim();
            if (message.features != null && message.features.length)
                for (let i = 0; i < message.features.length; ++i)
                    $root.protocol.Feature.encode(message.features[i], writer.uint32(42).fork()).ldelim();
            return writer;
        };

        Chunk.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        Chunk.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Chunk();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.x = reader.int32();
                    break;
                case 2:
                    message.z = reader.int32();
                    break;
                case 3:
                    message.height = reader.int32();
                    break;
                case 4:
                    if (!(message.meshes && message.meshes.length))
                        message.meshes = [];
                    message.meshes.push($root.protocol.Mesh.decode(reader, reader.uint32()));
                    break;
                case 5:
                    if (!(message.features && message.features.length))
                        message.features = [];
                    message.features.push($root.protocol.Feature.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        Chunk.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        Chunk.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (!$util.isInteger(message.x))
                    return "x: integer expected";
            if (message.z != null && message.hasOwnProperty("z"))
                if (!$util.isInteger(message.z))
                    return "z: integer expected";
            if (message.height != null && message.hasOwnProperty("height"))
                if (!$util.isInteger(message.height))
                    return "height: integer expected";
            if (message.meshes != null && message.hasOwnProperty("meshes")) {
                if (!Array.isArray(message.meshes))
                    return "meshes: array expected";
                for (let i = 0; i < message.meshes.length; ++i) {
                    let error = $root.protocol.Mesh.verify(message.meshes[i]);
                    if (error)
                        return "meshes." + error;
                }
            }
            if (message.features != null && message.hasOwnProperty("features")) {
                if (!Array.isArray(message.features))
                    return "features: array expected";
                for (let i = 0; i < message.features.length; ++i) {
                    let error = $root.protocol.Feature.verify(message.features[i]);
                    if (error)
                        return "features." + error;
                }
            }
            return null;
        };

        Chunk.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Chunk)
                return object;
            let message = new $root.protocol.Chunk();
            if (object.x != null)
                message.x = object.x | 0;
            if (object.z != null)
                message.z = object.z | 0;
            if (object.height != null)
                message.height = object.height | 0;
            if (object.meshes) {
                if (!Array.isArray(object.meshes))
                    throw TypeError(".protocol.Chunk.meshes: array expected");
                message.meshes = [];
                for (let i = 0; i < object.meshes.length; ++i) {
                    if (typeof object.meshes[i] !== "object")
                        throw TypeError(".protocol.Chunk.meshes: object expected");
                    message.meshes[i] = $root.protocol.Mesh.fromObject(object.meshes[i]);
                }
            }
            if (object.features) {
                if (!Array.isArray(object.features))
                    throw TypeError(".protocol.Chunk.features: array expected");
                message.features = [];
                for (let i = 0; i < object.features.length; ++i) {
                    if (typeof object.features[i] !== "object")
                        throw TypeError(".protocol.Chunk.features: object expected");
                    message.features[i] = $root.protocol.Feature.fromObject(object.features[i]);
                }
            }
            return message;
        };

        Chunk.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults) {
                object.meshes = [];
                object.features = [];
            }
            if (options.defaults) {
                object.x = 0;
                object.z = 0;
                object.height = 0;
            }
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = message.x;
            if (message.z != null && message.hasOwnProperty("z"))
                object.z = message.z;
            if (message.height != null && message.hasOwnProperty("height"))
                object.height = message.height;
            if (message.meshes && message.meshes.length) {
                object.meshes = [];
                for (let j = 0; j < message.meshes.length; ++j)
                    object.meshes[j] = $root.protocol.Mesh.toObject(message.meshes[j], options);
            }
            if (message.features && message.features.length) {
                object.features = [];
                for (let j = 0; j < message.features.length; ++j)
                    object.features[j] = $root.protocol.Feature.toObject(message.features[j], options);
            }
            return object;
        };

        Chunk.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Chunk;
    })();

    protocol.Chunks = (function() {

        function Chunks(properties) {
            this.chunks = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        Chunks.prototype.chunks = $util.emptyArray;

        Chunks.create = function create(properties) {
            return new Chunks(properties);
        };

        Chunks.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.chunks != null && message.chunks.length)
                for (let i = 0; i < message.chunks.length; ++i)
                    $root.protocol.Chunk.encode(message.chunks[i], writer.uint32(10).fork()).ldelim();
            return writer;
        };

        Chunks.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        Chunks.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.protocol.Chunks();
            while (reader.pos < end) {
                let tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.chunks && message.chunks.length))
                        message.chunks = [];
                    message.chunks.push($root.protocol.Chunk.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        Chunks.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        Chunks.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.chunks != null && message.hasOwnProperty("chunks")) {
                if (!Array.isArray(message.chunks))
                    return "chunks: array expected";
                for (let i = 0; i < message.chunks.length; ++i) {
                    let error = $root.protocol.Chunk.verify(message.chunks[i]);
                    if (error)
                        return "chunks." + error;
                }
            }
            return null;
        };

        Chunks.fromObject = function fromObject(object) {
            if (object instanceof $root.protocol.Chunks)
                return object;
            let message = new $root.protocol.Chunks();
            if (object.chunks) {
                if (!Array.isArray(object.chunks))
                    throw TypeError(".protocol.Chunks.chunks: array expected");
                message.chunks = [];
                for (let i = 0; i < object.chunks.length; ++i) {
                    if (typeof object.chunks[i] !== "object")
                        throw TypeError(".protocol.Chunks.chunks: object expected");
                    message.chunks[i] = $root.protocol.Chunk.fromObject(object.chunks[i]);
                }
            }
            return message;
        };

        Chunks.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.arrays || options.defaults)
                object.chunks = [];
            if (message.chunks && message.chunks.length) {
                object.chunks = [];
                for (let j = 0; j < message.chunks.length; ++j)
                    object.chunks[j] = $root.protocol.Chunk.toObject(message.chunks[j], options);
            }
            return object;
        };

        Chunks.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Chunks;
    })();

    return protocol;
})();

export { $root as default };
