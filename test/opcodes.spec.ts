import {} from 'mocha';
import {} from 'chai';

import { Opcode } from '../dev/Opcode';
import { Flag, Register, Rom } from '../dev/RAM';

describe("Opcode", () => {
    beforeEach(() => {
        Flag.D = 0;
        Flag.I = 0;
        Flag.N = 0;
        Flag.Z = 0;
        Register.PC = 0;
        Register.S = 0;
        Register.X = 0;
        Rom.data = new Int8Array([]);
    });

    it("(0x78) should set interrupt disable bit", () => {
        Opcode[0x78]();
        chai.assert.strictEqual(Flag.I, 1);
    });
    
    it("(0x9A) should set register S to be equal register X", () => {
        Register.X = 0xAA;
        Opcode[0x9A]();
        chai.assert.strictEqual(Register.S, Register.X);
    });
    
    it("(0xA2) should set register X to nn, change N and Z flags", () => {
        Rom.data = new Int8Array([0xA2, 0xff, 0]);
        Flag.Z = 1;
        
        Opcode[0xA2]();
        chai.assert.strictEqual(Register.X, Rom.data[1]);
        chai.assert.strictEqual(Flag.N, 1);
        chai.assert.strictEqual(Flag.Z, 0);
        
        Opcode[0xA2]();
        chai.assert.strictEqual(Register.X, Rom.data[2]);
        chai.assert.strictEqual(Flag.N, 0);
        chai.assert.strictEqual(Flag.Z, 1);
    });
    
    it("(0xA9) should set register A to nn, change N and Z flags", () => {
        Rom.data = new Int8Array([0xA9, 0xff, 0]);
        Flag.Z = 1;
        
        Opcode[0xA9]();
        chai.assert.strictEqual(Register.A, Rom.data[1]);
        chai.assert.strictEqual(Flag.N, 1);
        chai.assert.strictEqual(Flag.Z, 0);
        
        Opcode[0xA9]();
        chai.assert.strictEqual(Register.A, Rom.data[2]);
        chai.assert.strictEqual(Flag.N, 0);
        chai.assert.strictEqual(Flag.Z, 1);
    });
    
    it("(0xD8) should clear decimal mode", () => {
        Flag.D = 1;
        Opcode[0xD8]();
        chai.assert.strictEqual(Flag.D, 0);
    });
});