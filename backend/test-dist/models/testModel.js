"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestModel = void 0;
// Test model file to check TypeScript compilation
var TestModel = /** @class */ (function () {
    function TestModel(id, name) {
        this.id = id;
        this.name = name;
    }
    TestModel.prototype.greet = function () {
        return "Hello, ".concat(this.name, "!");
    };
    return TestModel;
}());
exports.TestModel = TestModel;
