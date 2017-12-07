import { Flag, Register, Rom, RAM } from './RAM';
import { Convert } from './Common';

// TODO: Memory mirroring
// TODO: Check whether carry getting set right or not

export class Opcode {

    private static isNextPage(pc1: number, pc2: number) {
        let left: string = ('000' + pc1.toString(16)).slice(-4);
        let right: string = ('000' + pc2.toString(16)).slice(-4);
        return left.charAt(0) != right.charAt(0) || left.charAt(1) != right.charAt(1);
    };

    // BPL nnn
    public static 0x10() {
        if(Flag.N == 1) {
			Register.PC++;
			return 2;
		};

		let num: number = Convert.toInt8(Rom.data[++Register.PC]);

        return 3 + (this.isNextPage(Register.PC, Register.PC += num) ? 1 : 0);
    };

    // JMP nnnn
    public static 0x4C() {
        let low: number = Rom.data[++Register.PC];
        let high: number = Rom.data[++Register.PC];
        let address: number = ((high & 0xFF) << 8) | (low & 0xFF);

        Register.PC = address & 0xFF;
        Register.PC--;

        return 3;
    };

    // SEI
    public static 0x78() {
        Flag.I = 1;

        return 2;
    };

    // STY nn
    public static 0x84() {
        RAM.write(Rom.data[++Register.PC], Register.Y);
        return 3;
    };

    // STA nn
    public static 0x85() {
        RAM.write(Rom.data[++Register.PC], Register.A);
        return 3;
    };

    // STX nn
    public static 0x86() {
        RAM.write(Rom.data[++Register.PC], Register.X);
        return 3;
    };

    // DEY
    public static 0x88() {
        Register.Y = Convert.toUint8(Register.Y - 1);

        Flag.Z = (Register.Y == 0 ? 1 : 0);
        
        Flag.N = (Convert.toBin(Register.Y).charAt(0) == '1' ? 1 : 0);
        
        return 2;
    };
    
    // TXA
    public static 0x8A() {
        Register.A = Register.X;

        Flag.Z = (Register.A == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.A).charAt(0) == '1' ? 1 : 0);

        return 2;
    };

    // STA nnnn
    public static 0x8D() {
        let low: number = Rom.data[++Register.PC];
        let high: number = Rom.data[++Register.PC];
        let address: number = ((high & 0xff) << 8) | (low & 0xff);

        RAM.write(address, Register.A);

        return 4;
    };

    // STA nn, X
    public static 0x95() {
        RAM.write(Rom.data[++Register.PC] + Register.X, Register.A);
        return 4;
    };

    // TXS
    public static 0x9A() {
        Register.S = Register.X;

        return 2;
    };

    // LDY #nn
    public static 0xA0() {
        Register.Y = Rom.data[++Register.PC];
        
        Flag.Z = (Register.Y == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.Y).charAt(0) == '1' ? 1 : 0);

        return 2;
    };

    // LDX #nn
    public static 0xA2() {
        Register.X = Rom.data[++Register.PC];
        
        Flag.Z = (Register.X == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.X).charAt(0) == '1' ? 1 : 0);

        return 2;
    };
    
    // LDA nn
    public static 0xA5() {
        Register.A = RAM.read(Rom.data[++Register.PC]);

        Flag.Z = (Register.A == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.A).charAt(0) == '1' ? 1 : 0);

        return 3;
    };
    
    // LDX nn
    public static 0xA6() {
        Register.X = RAM.read(Rom.data[++Register.PC]);
        
        Flag.Z = (Register.X == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.X).charAt(0) == '1' ? 1 : 0);

        return 3;
    };

    // LDA #nn
    public static 0xA9() {
        Register.A = Rom.data[++Register.PC];
        
        Flag.Z = (Register.A == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.A).charAt(0) == '1' ? 1 : 0);

        return 2;
    };
    
    // TAX
    public static 0xAA() {
        Register.X = Register.A;
        
        Flag.Z = (Register.X == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.X).charAt(0) == '1' ? 1 : 0);

        return 2;
    };

    // LDA nnnn
    public static 0xAD() {
        let low: number = Rom.data[++Register.PC];
        let high: number = Rom.data[++Register.PC];
        let address: number = ((high & 0xFF) << 8) | (low & 0xFF);

        Register.A = RAM.read(address);
        
        Flag.Z = (Register.A == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.A).charAt(0) == '1' ? 1 : 0);

        return 4;
    };
    
    // LDA nnnn, X
    public static 0xBD() {
        let low: number = Rom.data[++Register.PC];
        let high: number = Rom.data[++Register.PC];
        let address: number = ((high & 0xFF) << 8) | (low & 0xFF);

        Register.A = RAM.read(address + Register.X);

        Flag.Z = (Register.A == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.A).charAt(0) == '1' ? 1 : 0);

        return 4 + (this.isNextPage(61440 + Register.PC, address + Register.X) ? 1 : 0);
    };
    
    // CPY #nn
    public static 0xC0() {
        let value: number = Rom.data[++Register.PC];
        let result: number = Convert.toInt8(Register.Y - value);
        
        Flag.Z = (result == 0 ? 1 : 0);

        Flag.N = (result < 0 ? 1 : 0);
        
        Flag.Z = (result >= 0 ? 1 : 0);

        return 2;
    };
    
    // DEC nn
    public static 0xC6() {
        let address: number = Rom.data[++Register.PC];
        let result: number = RAM.write(address, RAM.get(address) - 1);
        
        Flag.Z = (result == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(result).charAt(0) == '1' ? 1 : 0);

        return 5;
    };
    
    // INY
    public static 0xC8() {
        Register.Y = Convert.toUint8(Register.Y + 1);
        
        Flag.Z = (Register.Y == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.Y).charAt(0) == '1' ? 1 : 0);

        return 2;
    };

    // DEX
    public static 0xCA() {
        Register.X = Convert.toUint8(Register.X - 1);

        Flag.Z = (Register.X == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.X).charAt(0) == '1' ? 1 : 0);

        return 2;
    };

    // BNE
    public static 0xD0() {
        if(Flag.Z == 1) {
			Register.PC++;
			return 2;
		};

		let num: number = Convert.toInt8(Rom.data[++Register.PC]);

        return 3 + (this.isNextPage(Register.PC, Register.PC += num) ? 1 : 0);
    };

    // CLD
    public static 0xD8() {
        Flag.D = 0;

        return 2;
    };
    
    // CPX #nn
    public static 0xE0() {
        let value: number = Rom.data[++Register.PC];
        let result: number = Convert.toInt8(Register.X - value);

        Flag.Z = (result == 0 ? 1 : 0);

        Flag.N = (result < 0 ? 1 : 0);
        
        Flag.Z = (result >= 0 ? 1 : 0);

        return 2;
    };
    
    // INC nn
    public static 0xE6() {
        let address: number = Rom.data[++Register.PC];
        let result: number = RAM.write(address, RAM.get(address) + 1);

        Flag.Z = (result == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(result).charAt(0) == '1' ? 1 : 0);

        return 5;
    };

    // INX
    public static 0xE8() {
        Register.X = Convert.toUint8(Register.X + 1);
        
        Flag.Z = (Register.X == 0 ? 1 : 0);

        Flag.N = (Convert.toBin(Register.X).charAt(0) == '1' ? 1 : 0);

        return 2;
    };

    // No operator
    public static 0xEA() {
        return 2;
    };
};
