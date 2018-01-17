import { Flag, Register, RAM } from './RAM';
import { Convert } from './Common';

// TODO: Memory mirroring
// TODO: Decimal mode for ABD/SBC

export class Opcode {

    private static isNextPage(pc1: number, pc2: number) {
        let left: string = ('000' + pc1.toString(16)).slice(-4);
        let right: string = ('000' + pc2.toString(16)).slice(-4);
        return left.charAt(0) != right.charAt(0) || left.charAt(1) != right.charAt(1);
    };
    
    private static isZero(value: number) {
        return (value == 0 ? 1 : 0)
    };
    
    private static isNegative(value: number) {
        return (Convert.toInt8(value) < 0 ? 1 : 0);
    };

    private static ADC(value: number) {
        let old: number = Register.A;

        let result: number = null;

        if(Flag.D) {
            result = Convert.toDecBCD(Register.A) + Flag.C + Convert.toDecBCD(value);
            Flag.C = (result > 99 ? 1 : 0);
        } else {
            result = Register.A + Flag.C + value;
            Flag.C = (result > 0xFF ? 1 : 0);
        };

        Register.A = Convert.toUint8(result);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        Flag.V = ((~(old ^ RAM.get(Register.PC)) & (old ^ Register.A) & 0x80) == Register.A ? 1 : 0);
    };

    private static AND(value: number) {
        Register.A = Register.A & value;

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);
    };

    private static CMP(name: string, value: number) {
        Flag.Z = (Register[name] == value ? 1 : 0);

        Flag.N = (Register[name] < value ? 1 : 0);

        Flag.C = (Register[name] >= value ? 1 : 0);
    };

    private static CJMP(name: string, value: boolean) {
        if(Flag[name] == value) {
            Register.PC++;
            return 2;
        };

        let num: number = Convert.toInt8(RAM.get(++Register.PC));

        return 3 + (this.isNextPage(Register.PC, Register.PC += num) ? 1 : 0);
    };

    private static ORA(value: number) {
        Register.A = Register.A | value;

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);
    };

    private static POP() {
        Register.S = (Register.S + 1) & 0xFF;

        return RAM.get(Register.S);
    };

    private static PUSH(value: number) {
        RAM.set(Register.S, value);

        Register.S = (Register.S - 1) & 0xFF;
    };

    private static WORD() {
        let low: number = RAM.get(++Register.PC);
        let high: number = RAM.get(++Register.PC);
        return ((high & 0xFF) << 8) | (low & 0xFF);
    };

    // BRK
    public static 0x00() {
        Flag.B = 1;
        
        let flags: number = parseInt('' + Flag.N + Flag.V + Flag.U + Flag.B + Flag.D + Flag.I + Flag.Z + Flag.C, 2);
        
        Flag.I = 1;

        this.PUSH((Register.PC + 1) >> 8);

        this.PUSH(Register.PC + 1);

        this.PUSH(flags);
        
        Register.PC = RAM.read(0xFFFE);

        return 7;
    };

    // ORA (nn, X)
    public static 0x01() {
        this.ORA(RAM.read(RAM.read(RAM.get(++Register.PC) + Register.X)));

        return 6;
    };

    // NOP
    public static 0x04() {
        Register.PC++;
        return 3;
    };

    // ORA nn
    public static 0x05() {
        this.ORA(RAM.read(RAM.get(++Register.PC)));

        return 3;
    };
    
    // PHP
    public static 0x08() {
        let flags: number = parseInt('' + Flag.N + Flag.V + 1 + 1 + Flag.D + Flag.I + Flag.Z + Flag.C, 2);
        
        this.PUSH(flags);

        return 3;
    };

    // ORA #nn
    public static 0x09() {
        this.ORA(RAM.get(++Register.PC));

        return 2;
    };

    // ASL A
    public static 0x0A() {
        let carry: string = Convert.toBin(Register.A).charAt(0);

        Register.A = Convert.toUint8(Register.A << 1);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        Flag.C = parseInt(carry);

        return 2;
    };
    
    // ORA nnnn
    public static 0x0D() {
        let address: number = this.WORD();

        this.ORA(RAM.read(address));

        return 4  + (this.isNextPage(Register.PC, address) ? 1 : 0);
    };

    // BPL nnn
    public static 0x10() {
        return this.CJMP('N', true);
    };

    // ASL nn, X
    public static 0x16() {
        let address: number = RAM.get(++Register.PC) + Register.X;

        let value: number = RAM.read(address);

        let carry: string = Convert.toBin(value).charAt(0);

        value = Convert.toUint8(value << 1);

        RAM.write(address, value);

        Flag.Z = this.isZero(value);

        Flag.N = this.isNegative(value);

        Flag.C = parseInt(carry);

        return 6;
    };

    // CLC
    public static 0x18() {
        Flag.C = 0;

        return 2;
    };

    // ORA nnnn, Y
    public static 0x19() {
        let address: number = this.WORD();

        this.ORA(RAM.read(address + Register.Y));

        return 4  + (this.isNextPage(Register.PC, address + Register.Y) ? 1 : 0);
    };
    
    // NOP
    public static 0x1C() {    
        return 4  + (this.isNextPage(Register.PC, this.WORD() + Register.X) ? 1 : 0);
    };
    
    // ORA nnnn, X
    public static 0x1D() {
        let address: number = this.WORD();

        this.ORA(RAM.read(address + Register.X));

        return 4  + (this.isNextPage(Register.PC, address + Register.X) ? 1 : 0);
    };

    // JSR nnnn
    public static 0x20() {
        let address: number = this.WORD();

        this.PUSH((Register.PC - 1) >> 8);
        this.PUSH(Register.PC - 1);
        Register.PC = address - 1;

        return 6;
    };

    // BIT nn
    public static 0x24() {
        let value: number = RAM.read(RAM.get(++Register.PC));

        let bin: string = Convert.toBin(value);

        Flag.Z = this.isZero(Register.A & value);

        Flag.N = (bin.charAt(0) == '1' ? 1 : 0);

        Flag.V = (bin.charAt(1) == '1' ? 1 : 0);

        return 3;
    };

    // AND nn
    public static 0x25() {
        this.AND(RAM.read(RAM.get(++Register.PC)));

        return 3;
    };

    // ROL nn
    public static 0x26() {
        let address: number = RAM.get(++Register.PC);

        let value: number = RAM.read(address);

        let carry: string = Convert.toBin(value).charAt(0);

        value = Convert.toUint8(value << 1);

        let rotated: string = Convert.toBin(value).slice(0, -1) + Flag.C.toString();

        value = Convert.toUint8(parseInt(rotated, 2));

        RAM.write(address, value);

        Flag.Z = this.isZero(value);

        Flag.N = this.isNegative(value);

        Flag.C = parseInt(carry);

        return 5;
    };

    // AND #nn
    public static 0x29() {
        this.AND(RAM.get(++Register.PC));

        return 2;
    };

    // ROL A
    public static 0x2A() {

        let value: number = Register.A;

        let carry: string = Convert.toBin(value).charAt(0);

        value = Convert.toUint8(value << 1);

        let rotated: string = Convert.toBin(value).slice(0, -1) + Flag.C.toString();

        value = Convert.toUint8(parseInt(rotated, 2));

        Register.A = value;

        Flag.Z = this.isZero(value);

        Flag.N = this.isNegative(value);

        Flag.C = parseInt(carry);

        return 2;
    };

    // BIT nnnn
    public static 0x2C() {
        let value: number = RAM.read(this.WORD());

        let bin: string = Convert.toBin(value);

        Flag.Z = this.isZero(Register.A & value);

        Flag.N = (bin.charAt(0) == '1' ? 1 : 0);

        Flag.V = (bin.charAt(1) == '1' ? 1 : 0);

        return 4;
    };

    // BMI nnn
    public static 0x30() {
        return this.CJMP('N', false);
    };

    // ROL nn, X
    public static 0x36() {
        let address: number = RAM.get(++Register.PC) + Register.X;

        let value: number = RAM.read(address);

        let carry: string = Convert.toBin(value).charAt(0);

        value = Convert.toUint8(value << 1);

        let rotated: string = Convert.toBin(value).slice(0, -1) + Flag.C.toString();

        value = Convert.toUint8(parseInt(rotated, 2));

        RAM.write(address, value);

        Flag.Z = this.isZero(value);

        Flag.N = this.isNegative(value);

        Flag.C = parseInt(carry);

        return 6;
    };

    // SEC
    public static 0x38() {
        Flag.C = 1;

        return 2;
    };

    // AND nnnn, Y
    public static 0x39() {
        let address: number = this.WORD();

        this.AND(RAM.read(address + Register.Y));

        return 4  + (this.isNextPage(Register.PC, address + Register.Y) ? 1 : 0);
    };
    
    // NOP
    public static 0x3C() {    
        return this[0x1C]();
    };

    // AND nnnn, X
    public static 0x3D() {
        let address: number = this.WORD();

        this.AND(RAM.read(address + Register.X));

        return 4  + (this.isNextPage(Register.PC, address + Register.X) ? 1 : 0);
    };

    // NOP
    public static 0x44() {
        return this[0x04]();
    };

    // EOR nn
    public static 0x45() {
        Register.A = Register.A ^ RAM.read(RAM.get(++Register.PC));

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 3;
    };

    // LSR nn
    public static 0x46() {
        let address: number = RAM.get(++Register.PC);

        let value: number = RAM.read(address);

        let carry: string = Convert.toBin(value).charAt(7);

        value = Convert.toUint8(value >>> 1);

        RAM.write(address, value);

        Flag.Z = 0;

        Flag.N = this.isNegative(value);

        Flag.C = parseInt(carry);

        return 5;
    };

    // PHA
    public static 0x48() {
        this.PUSH(Register.A);

        return 3;
    };

    // EOR #nn
    public static 0x49() {
        Register.A = Register.A ^ RAM.get(++Register.PC);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 2;
    };

    // LSR A
    public static 0x4A() {
        let carry: string = Convert.toBin(Register.A).charAt(7);

        Register.A = Convert.toUint8(Register.A >>> 1);

        Flag.Z = 0;

        Flag.N = this.isNegative(Register.A);

        Flag.C = parseInt(carry);

        return 2;
    };

    // JMP nnnn
    public static 0x4C() {
        let address: number = this.WORD();

        Register.PC = address - 1;

        return 3;
    };
    
    // BVC nnn 
    public static 0x50() {
        return this.CJMP('V', true);
    };

    // LSR nn, X
    public static 0x56() {
        let address: number = RAM.get(++Register.PC) + Register.X;
        let value: number = RAM.read(address);
        let carry: string = Convert.toBin(value).charAt(7);

        value = Convert.toUint8(value >>> 1);

        RAM.write(address, value);

        Flag.Z = 0;

        Flag.N = this.isNegative(value);

        Flag.C = parseInt(carry);

        return 6;
    };

    // CLI
    public static 0x58() {
        Flag.I = 0;

        return 2;
    };
    
    // NOP
    public static 0x5C() {    
        return this[0x1C]();
    };

    // RTS
    public static 0x60() {

        Register.PC = this.POP() + 1;
        Register.PC += this.POP() << 8;

        return 6;
    };

    // NOP
    public static 0x64() {
        return this[0x04]();
    };

    // ADC nn
    public static 0x65() {
        this.ADC(RAM.read(RAM.get(++Register.PC)));

        return 3;
    };

    // ROR nn
    public static 0x66() {

        let address: number = RAM.get(++Register.PC);

        let addressValue: number = RAM.read(address);

        let carry: string = Convert.toBin(addressValue).charAt(7);

        let value = Convert.toUint8(addressValue >>> 1);

        let rotated: string = Flag.C.toString() + Convert.toBin(value).substring(1);

        RAM.write(address, parseInt(rotated, 2));

        Flag.Z = this.isZero(RAM.get(address));

        Flag.N = this.isNegative(RAM.get(address));

        Flag.C = parseInt(carry);

        return 5;
    };

    // PLA
    public static 0x68() {
        Register.A = this.POP();

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 4;
    };

    // ADC #nn
    public static 0x69() {
        this.ADC(RAM.get(++Register.PC));

        return 2;
    };

    // ROR A
    public static 0x6A() {
        let carry: string = Convert.toBin(Register.A).charAt(7);

        let value = Convert.toUint8(Register.A >>> 1);

        let rotated: string = Flag.C.toString() + Convert.toBin(value).substring(1);

        Register.A = Convert.toUint8(parseInt(rotated, 2));

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        Flag.C = parseInt(carry);

        return 2;
    };
    
    // BVS nnn 
    public static 0x70() {
        return this.CJMP('V', false);
    };

    // ADC nn, X
    public static 0x75() {
        this.ADC(RAM.read(RAM.get(++Register.PC) + Register.X));

        return 4;
    };

    // ROR nn, X
    public static 0x76() {
        let address: number = RAM.get(++Register.PC) + Register.X;

        let value: number = RAM.read(address);

        let carry: string = Convert.toBin(value).charAt(7);

        value = Convert.toUint8(value >>> 1);

        let rotated: string = Flag.C.toString() + Convert.toBin(value).substring(1);

        value = Convert.toUint8(parseInt(rotated, 2));

        RAM.write(address, value);

        Flag.Z = this.isZero(value);

        Flag.N = this.isNegative(value);

        Flag.C = parseInt(carry);

        return 6;
    };

    // SEI
    public static 0x78() {
        Flag.I = 1;

        return 2;
    };

    // ADC nnnn, Y
    public static 0x79() {
        let address: number = this.WORD();
        this.ADC(RAM.read(address + Register.Y));

        return 4  + (this.isNextPage(Register.PC, address + Register.Y) ? 1 : 0);
    };
    
    // NOP
    public static 0x7C() {    
        return this[0x1C]();
    };

    // ADC nnnn, X
    public static 0x7D() {
        let address: number = this.WORD();
        this.ADC(RAM.read(address + Register.X));

        return 4  + (this.isNextPage(Register.PC, address + Register.X) ? 1 : 0);
    };

    // STY nn
    public static 0x84() {
        RAM.write(RAM.get(++Register.PC), Register.Y);
        return 3;
    };

    // STA nn
    public static 0x85() {
        RAM.write(RAM.get(++Register.PC), Register.A);
        return 3;
    };

    // STX nn
    public static 0x86() {
        RAM.write(RAM.get(++Register.PC), Register.X);
        return 3;
    };

    // DEY
    public static 0x88() {
        Register.Y = Convert.toUint8(Register.Y - 1);

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 2;
    };

    // TXA
    public static 0x8A() {
        Register.A = Register.X;

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 2;
    };

    // STY nnnn
    public static 0x8C() {
        let address: number = this.WORD();
        RAM.write(address, Register.Y);

        return 4;
    };

    // STA nnnn
    public static 0x8D() {
        let address: number = this.WORD();
        RAM.write(address, Register.A);

        return 4;
    };

    // STX nnnn
    public static 0x8E() {
        let address: number = this.WORD();
        RAM.write(address, Register.X);

        return 4;
    };

    // BCC/BLT nnn
    public static 0x90() {
        return this.CJMP('C', true);
    };

    // STY nn, X
    public static 0x94() {
        RAM.write(RAM.get(++Register.PC) + Register.X, Register.Y);
        return 4;
    };

    // STA nn, X
    public static 0x95() {
        RAM.write(RAM.get(++Register.PC) + Register.X, Register.A);
        return 4;
    };

    // STY nn, X
    public static 0x96() {
        RAM.write(RAM.get(++Register.PC) + Register.Y, Register.X);
        return 4;
    };

    // TYA
    public static 0x98() {
        Register.A = Register.Y;

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 2;
    };

    // STA nnnn, Y
    public static 0x99() {
        RAM.write(this.WORD() + Register.Y, Register.A);

        return 5;
    };

    // TXS
    public static 0x9A() {
        Register.S = Register.X;

        return 2;
    };

    // LDY #nn
    public static 0xA0() {
        Register.Y = RAM.get(++Register.PC);

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 2;
    };

    // LDX #nn
    public static 0xA2() {
        Register.X = RAM.get(++Register.PC);

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 2;
    };

    // LDY nn
    public static 0xA4() {
        Register.Y = RAM.read(RAM.get(++Register.PC));

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 3;
    };

    // LDA nn
    public static 0xA5() {
        Register.A = RAM.read(RAM.get(++Register.PC));

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 3;
    };

    // LDX nn
    public static 0xA6() {
        Register.X = RAM.read(RAM.get(++Register.PC));

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 3;
    };

    // TAY
    public static 0xA8() {
        Register.Y = Register.A;

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 2;
    };

    // LDA #nn
    public static 0xA9() {
        Register.A = RAM.get(++Register.PC);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 2;
    };

    // TAX
    public static 0xAA() {
        Register.X = Register.A;

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 2;
    };

    // LDY nnnn
    public static 0xAC() {
        Register.Y = RAM.read(this.WORD());

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 4;
    };

    // LDA nnnn
    public static 0xAD() {
        Register.A = RAM.read(this.WORD());

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 4;
    };

    // LDX nnnn
    public static 0xAE() {
        Register.X = RAM.read(this.WORD());

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 4;
    };

    // BCS/BGE nnn
    public static 0xB0() {
        return this.CJMP('C', false);
    };

    // LDA (nn), Y
    public static 0xB1() {
        let address: number = RAM.read(RAM.get(++Register.PC)) + Register.Y;

        Register.A = RAM.read(address);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 5 + (this.isNextPage(Register.PC, address) ? 1 : 0);
    };

    // LAX (nn),Y
    private static 0xB3() {
        let address: number = RAM.read(RAM.get(++Register.PC)) + Register.Y;

        Register.A = Register.X = RAM.read(address);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 5 + (this.isNextPage(Register.PC, address) ? 1 : 0);
    };

    // LDY nn, X
    public static 0xB4() {
        Register.Y = RAM.read(RAM.get(++Register.PC) + Register.X);

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 4;
    };

    // LDA nn, X
    public static 0xB5() {
        Register.A = RAM.read(RAM.get(++Register.PC) + Register.X);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 4;
    };

    // LDX nn, Y
    public static 0xB6() {
        Register.X = RAM.read(RAM.get(++Register.PC) + Register.Y);

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 4;
    };

    // CLV
    public static 0xB8() {
        Flag.V = 0;

        return 2;
    };

    // LDA nnnn, Y
    public static 0xB9() {
        let address: number = this.WORD();
        
        Register.A = RAM.read(address + Register.Y);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 4 + (this.isNextPage(Register.PC, address + Register.Y) ? 1 : 0);
    };

    // TSX
    public static 0xBA() {
        Register.X = Register.S;

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 2;
    };

    // LDY nnnn, X
    public static 0xBC() {
        let address: number = this.WORD();
        
        Register.Y = RAM.read(address + Register.X);

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 4 + (this.isNextPage(Register.PC, address + Register.X) ? 1 : 0);
    };

    // LDA nnnn, X
    public static 0xBD() {
        let address: number = this.WORD();
        
        Register.A = RAM.read(address + Register.X);

        Flag.Z = this.isZero(Register.A);

        Flag.N = this.isNegative(Register.A);

        return 4 + (this.isNextPage(Register.PC, address + Register.X) ? 1 : 0);
    };

    // LDX nnnn, Y
    public static 0xBE() {
        let address: number = this.WORD();
        Register.X = RAM.read(address + Register.Y);

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 4 + (this.isNextPage(Register.PC, address + Register.Y) ? 1 : 0);
    };

    // CPY #nn
    public static 0xC0() {
        this.CMP('Y', RAM.get(++Register.PC));

        return 2;
    };

    // CPY nn
    public static 0xC4() {
        this.CMP('Y', RAM.read(RAM.get(++Register.PC)));

        return 3;
    };

    // CMP nn
    public static 0xC5() {
        this.CMP('A', RAM.read(RAM.get(++Register.PC)));

        return 3;
    };

    // DEC nn
    public static 0xC6() {
        let address: number = RAM.get(++Register.PC);
        
        let result: number = RAM.write(address, RAM.get(address) - 1);

        Flag.Z = this.isZero(result);

        Flag.N = this.isNegative(result);

        return 5;
    };

    // INY
    public static 0xC8() {
        Register.Y = Convert.toUint8(Register.Y + 1);

        Flag.Z = this.isZero(Register.Y);

        Flag.N = this.isNegative(Register.Y);

        return 2;
    };

    // CMP #nn
    public static 0xC9() {
        let value: number = RAM.get(++Register.PC);

        Flag.Z = (Register.A == value ? 1 : 0);

        Flag.N = (Register.A < value ? 1 : 0);

        Flag.C = (Register.A >= value ? 1 : 0);

        return 2;
    };

    // DEX
    public static 0xCA() {
        Register.X = Convert.toUint8(Register.X - 1);

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 2;
    };

    // BNE
    public static 0xD0() {
        return this.CJMP('Z', true);
    };

    // CMP nn, X
    public static 0xD5() {
        this.CMP('A', RAM.read(RAM.get(++Register.PC) + Register.X));

        return 4;
    };

    // DEC nn, X
    public static 0xD6() {
        let address: number = RAM.get(++Register.PC);
        
        let result: number = RAM.write(address + Register.X, RAM.get(address + Register.X) - 1);

        Flag.Z = this.isZero(result);

        Flag.N = this.isNegative(result);

        return 6;
    };

    // CLD
    public static 0xD8() {
        Flag.D = 0;

        return 2;
    };

    // CMP nnnn, Y
    public static 0xD9() {
        let address: number = this.WORD();

        this.CMP('A', RAM.read(address + Register.Y));

        return 4  + (this.isNextPage(Register.PC, address + Register.Y) ? 1 : 0);
    };
    
    // NOP
    public static 0xDC() {    
        return this[0x1C]();
    };

    // CMP nnnn, X
    public static 0xDD() {
        let address: number = this.WORD();

        this.CMP('A', RAM.read(address + Register.X));

        return 4  + (this.isNextPage(Register.PC, address + Register.X) ? 1 : 0);
    };

    // CPX #nn
    public static 0xE0() {
        this.CMP('X', RAM.get(++Register.PC));

        return 2;
    };

    // CPX nn
    public static 0xE4() {
        this.CMP('X', RAM.read(RAM.get(++Register.PC)));

        return 3;
    };

    // SBC nn
    public static 0xE5() {
        this.ADC(~RAM.read(RAM.get(++Register.PC)));

        return 3;
    };

    // INC nn
    public static 0xE6() {
        let address: number = RAM.get(++Register.PC);
        
        let result: number = RAM.write(address, RAM.get(address) + 1);

        Flag.Z = this.isZero(result);

        Flag.N = this.isNegative(result);

        return 5;
    };

    // INX
    public static 0xE8() {
        Register.X = Convert.toUint8(Register.X + 1);

        Flag.Z = this.isZero(Register.X);

        Flag.N = this.isNegative(Register.X);

        return 2;
    };

    // SBC #nn
    public static 0xE9() {
        this.ADC(~RAM.get(++Register.PC));

        return 2;
    };

    // NOP
    public static 0xEA() {
        return 2;
    };

    // CPX nnnn
    public static 0xEC() {
        this.CMP('X', RAM.read(this.WORD()));

        return 4;
    };

    // BEQ/BZS nnn
    public static 0xF0() {
        return this.CJMP('Z', false);
    };

    // SBC nn, X
    public static 0xF5() {
        this.ADC(~RAM.read(RAM.get(++Register.PC) + Register.X));

        return 4;
    };

    // SED
    public static 0xF8() {
        Flag.D = 1;

        return 2;
    };
    
    // NOP
    public static 0xFC() {    
        return this[0x1C]();
    };
};
