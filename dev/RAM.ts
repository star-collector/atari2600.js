import { PIA } from './PIA';
import { CPU } from './CPU';
import { Convert } from './Common';
import { TIA } from './TIA';

export class Register {
	public static A: number = 0; // Accumulator
	public static PC: number = 0xF000; // Program Counter
	public static S: number = 0xFF; // Stack Pointer
	public static X: number = 0; // Index Register X
	public static Y: number = 0; // Index Register Y
};

export class Flag {
	public static B: number = 0; // Break flag
	public static C: number = 0; // Carry
	public static D: number = 0; // Decimal mode
	public static I: number = 0; // Interrupt disable bit
	public static N: number = 0; // Negative/Sign
	public static V: number = 0; // Overflow
	public static Z: number = 0; // Zero
	public static U: number = 0; // Unused flag
};

export class RAM {
	public static memory: Uint8Array = new Uint8Array(65536);

	public static swchaW: number = 0x00;

	public static swchaR: number = 0xFF;

	public static swchbW: number = 0x00;

	public static swchbR: number = 0x3F;

	public static get(address: number) {
		return this.memory[address];
	};

	public static read(address: number) {
		let value: number = this.memory[address];

		if(this[address] !== undefined) {
			value = this[address]();
		};

		return value;
	};

	public static readRom(rom: Uint8Array) {
		let romSize = rom.length;
		let original: Uint8Array = rom;

		for(let i = romSize; i < 0x1000; i += romSize) {
			let old: Uint8Array = rom;
			rom = new Uint8Array(i + romSize);
			rom.set(old, 0);
			rom.set(original, i);
		};

		this.reset();

		this.memory = new Uint8Array(61440 + rom.length);

		for(let i = 0x1000; i < 0xFFFF; i += 0x2000) {
			this.memory.set(rom, i);
		};

		// Reset vector
		Register.PC = ((this.memory[0xFFFD] & 0xFF) << 8) | (this.memory[0xFFFC] & 0xFF);
	};

	public static reset() {
		this.memory = new Uint8Array(65536);
	};

	public static set(address: number, value: number) {
		this.memory[address] = value;

		return this.memory[address];
	};

	public static write(address: number, value: number) {
		if(this[address] !== undefined) {
			value = this[address](value);
		};

		this.memory[address] = value;

		return this.memory[address];
	};

	// VSYNC write
	private static 0x00(value: number) {
		if(value === undefined) return this.memory[0x00];
		if(!(RAM.get(0x00) & 0x02) && (value & 0x02)) {
			TIA.scanline = 0;
		};
		return value;
	};

	// WSYNC write
	private static 0x02(value: number) {
		if(value === undefined) return this.memory[0x02];
		CPU.lock();
		return value;
	};

	// NUSIZ0 write
	private static 0x04(value: number) {
		if(value === undefined) return this.memory[0x04];
		let nusiz: Array<string> = Convert.toBin(value).split('');
		let playerValue: number = parseInt(nusiz[5] + nusiz[6] + nusiz[7], 2);

		TIA.p0.pixelRange = TIA.getPixelRange(playerValue);
		TIA.p0.size = (playerValue == 5 || playerValue == 7 ? playerValue % 5 + 2 : 1);
		TIA.m0.size = Math.pow(2, 2 * parseInt(nusiz[2]) + parseInt(nusiz[3]));
		return value;
	};

	// NUSIZ1 write
	private static 0x05(value: number) {
		if(value === undefined) return this.memory[0x05];
		let nusiz: Array<string> = Convert.toBin(value).split('');
		let playerValue: number = parseInt(nusiz[5] + nusiz[6] + nusiz[7], 2);

		TIA.p1.pixelRange = TIA.getPixelRange(playerValue);
		TIA.p1.size = (playerValue == 5 || playerValue == 7 ? playerValue % 5 + 2 : 1);
		TIA.m1.size = Math.pow(2, 2 * parseInt(nusiz[2]) + parseInt(nusiz[3]));
		return value;
	};

	// COLUP0 write
	private static 0x06(value: number) {
		if(value === undefined) return this.memory[0x06];
		TIA.pf.colup0 = TIA.p0.colup = TIA.m0.colup = TIA.colorPalette.get(value & 0xFE);
		return value;
	};

	// COLUP1 write
	private static 0x07(value: number) {
		if(value === undefined) return this.memory[0x07];
		TIA.pf.colup1 = TIA.p1.colup = TIA.m1.colup = TIA.colorPalette.get(value & 0xFE);
		return value;
	};

	// COLUPF write
	private static 0x08(value: number) {
		if(value === undefined) return this.memory[0x08];
		TIA.pf.colupf = TIA.ball.colupf = TIA.colorPalette.get(value & 0xFE);
		return value;
	};

	// COLUBK write
	private static 0x09(value: number) {
		if(value === undefined) return this.memory[0x09];
		TIA.bk.colubk = TIA.colorPalette.get(value & 0xFE);
		return value;
	};

	// CTRLPF write
	private static 0x0A(value: number) {
		if(value === undefined) return this.memory[0x0A];
		let ctrlpf: Array<string> = Convert.toBin(value).split('');

		TIA.pf.ctrlpf = ctrlpf;
		TIA.pf.reflect = (ctrlpf[7] == '1');
		TIA.pf.scoreMode = (ctrlpf[6] == '1' && ctrlpf[5] == '0');
		TIA.pfp = (ctrlpf[5] == '1');
		TIA.ball.size = Math.pow(2, 2 * parseInt(ctrlpf[2]) + parseInt(ctrlpf[3]));
		return value;
	};

	// REFP0 write
	private static 0x0B(value: number) {
		if(value === undefined) return this.memory[0x0B];
		TIA.p0.refp = ((value & 0x08) > 0);
		return value;
	};

	// REFP1 write
	private static 0x0C(value: number) {
		if(value === undefined) return this.memory[0x0C];
		TIA.p1.refp = ((value & 0x08) > 0);
		return value;
	};

	// PF0 write
	private static 0x0D(value: number) {
		if(value === undefined) return this.memory[0x0D];
		TIA.pf.pf0 = Convert.toBin(value).split('').reverse();
		return value;
	};

	// PF1 write
	private static 0x0E(value: number) {
		if(value === undefined) return this.memory[0x0E];
		TIA.pf.pf1 = Convert.toBin(value).split('').reverse();
		return value;
	};

	// PF2 write
	private static 0x0F(value: number) {
		if(value === undefined) return this.memory[0x0F];
		TIA.pf.pf2 = Convert.toBin(value).split('').reverse();
		return value;
	};

	// RESP0 write
	private static 0x10(value: number) {
		if(value === undefined) return this.memory[0x10];
		TIA.p0.position = (TIA.clock <= 68 ? 3 : TIA.clock - 61);
		return value;
	};

	// RESP1 write
	private static 0x11(value: number) {
		if(value === undefined) return this.memory[0x11];
		TIA.p1.position = (TIA.clock <= 68 ? 3 : TIA.clock - 61);
		return value;
	};

	// RESM0 write
	private static 0x12(value: number) {
		if(value === undefined) return this.memory[0x12];
		TIA.m0.position = (TIA.clock <= 68 ? 2 : TIA.clock - 68);
		return value;
	};

	// RESM1 write
	private static 0x13(value: number) {
		if(value === undefined) return this.memory[0x13];
		TIA.m1.position = (TIA.clock <= 68 ? 2 : TIA.clock - 68);
		return value;
	};

	// RESBL write
	private static 0x14(value: number) {
		if(value === undefined) return this.memory[0x14];
		TIA.ball.position = (TIA.clock <= 68 ? 2 : TIA.clock - 68);
		return value;
	};

	// GRP0 write
	private static 0x1B(value: number) {
		if(value === undefined) return this.memory[0x1B];
		TIA.p1.prevGrp = TIA.p1.grp;
		TIA.p0.grp = Convert.toBin(value).split('');
		return value;
	};

	// GRP1 write
	private static 0x1C(value: number) {
		if(value === undefined) return this.memory[0x1C];
		TIA.p0.prevGrp = TIA.p0.grp;
		TIA.ball.prevEnabl = TIA.ball.enabl;
		TIA.p1.grp = Convert.toBin(value).split('');
		return value;
	};

	// ENAM0 write
	private static 0x1D(value: number) {
		if(value === undefined) return this.memory[0x1D];
		TIA.m0.enam = ((value & 0x02) > 0);
		return value;
	};

	// ENAM1 write
	private static 0x1E(value: number) {
		if(value === undefined) return this.memory[0x1E];
		TIA.m1.enam = ((value & 0x02) > 0);
		return value;
	};

	// ENABL write
	private static 0x1F(value: number) {
		if(value === undefined) return this.memory[0x1F];
		TIA.ball.enabl = ((value & 0x02) > 0);
		return value;
	};

	// HMP0 write
	private static 0x20(value: number) {
		if(value === undefined) return this.memory[0x20];
		let bit: Array<string> = Convert.toBin(value).split('');
		TIA.p0.hmp = parseInt(bit[1] + bit[2] + bit[3], 2) - (bit[0] == '1' ? 8 : 0);
		return value;
	};

	// HMP1 write
	private static 0x21(value: number) {
		if(value === undefined) return this.memory[0x21];
		let bit: Array<string> = Convert.toBin(value).split('');
		TIA.p1.hmp = parseInt(bit[1] + bit[2] + bit[3], 2) - (bit[0] == '1' ? 8 : 0);
		return value;
	};

	// HMM0 write
	private static 0x22(value: number) {
		if(value === undefined) return this.memory[0x22];
		let bit: Array<string> = Convert.toBin(value).split('');
		TIA.m0.hmm = parseInt(bit[1] + bit[2] + bit[3], 2) - (bit[0] == '1' ? 8 : 0);
		return value;
	};

	// HMM1 write
	private static 0x23(value: number) {
		if(value === undefined) return this.memory[0x23];
		let bit: Array<string> = Convert.toBin(value).split('');
		TIA.m1.hmm = parseInt(bit[1] + bit[2] + bit[3], 2) - (bit[0] == '1' ? 8 : 0);
		return value;
	};

	// HMBL write
	private static 0x24(value: number) {
		if(value === undefined) return this.memory[0x24];
		let bit: Array<string> = Convert.toBin(value).split('');
		TIA.ball.hmbl = parseInt(bit[1] + bit[2] + bit[3], 2) - (bit[0] == '1' ? 8 : 0);
		return value;
	};

	// VDELP0 write
	private static 0x25(value: number) {
		if(value === undefined) return this.memory[0x25];
		TIA.p0.vdelp = ((value & 0x01) > 0);
		return value;
	};

	// VDELP1 write
	private static 0x26(value: number) {
		if(value === undefined) return this.memory[0x26];
		TIA.p1.vdelp = ((value & 0x01) > 0);
		return value;
	};

	// VDELBL write
	private static 0x27(value: number) {
		if(value === undefined) return this.memory[0x27];
		TIA.ball.vdelbl = ((value & 0x01) > 0);
		return value;
	};

	// HMOVE write
	private static 0x2A(value: number) {
		if(value === undefined) return this.memory[0x2A];

		TIA.p0.position = (TIA.p0.position - TIA.p0.hmp) % 160;
		TIA.p1.position = (TIA.p1.position - TIA.p1.hmp) % 160;
		TIA.m0.position = (TIA.m0.position - TIA.m0.hmm) % 160;
		TIA.m1.position = (TIA.m1.position - TIA.m1.hmm) % 160;
		TIA.ball.position = (TIA.ball.position - TIA.ball.hmbl) % 160;

		return value;
	};

	// HMCLR write
	private static 0x2B(value: number) {
		if(value === undefined) return this.memory[0x2B];
		this.memory[0x20] = this.memory[0x21] = this.memory[0x22] = this.memory[0x23] = this.memory[0x24] = 0;
		TIA.p0.hmp = TIA.p1.hmp = TIA.m0.hmm = TIA.m1.hmm = TIA.ball.hmbl = 0;
		return value;
	};
	
	// CXCLR write
	private static 0x2C(value: number) {
		if(value === undefined) return this.memory[0x2C];
		this.memory[0x30] = this.memory[0x31] = this.memory[0x32] = this.memory[0x33] = this.memory[0x34] = this.memory[0x35] = this.memory[0x36] = this.memory[0x37] = 0;
		return value;
	};

	// SWCHA read/write
	private static 0x280(value: number) {
		if(value) {
			this.swchaW = value;
			return value;
		};

		let swacnt: Array<string> = Convert.toBin(this.memory[0x281]).split('');
		let bin: Array<string> = Convert.toBin(this.swchaW).split('');
		let result = Convert.toBin(this.swchaR).split('');

		for(let i = 0; i < 8; i++) {
			if(swacnt[i] == '1') {
				result[i] = bin[i];
			};
		};

		return parseInt(result.join(''), 2);
	};

	// SWCHB read/write
	private static 0x282(value: number) {
		if(value) {
			this.swchbW = value;
			return value;
		};

		let swbcnt: Array<string> = Convert.toBin(this.memory[0x283]).split('');
		let bin: Array<string> = Convert.toBin(this.swchbW).split('');
		let result = Convert.toBin(this.swchbR).split('');

		for(let i = 0; i < 8; i++) {
			if(swbcnt[i] == '1') {
				result[i] = bin[i];
			};
		};

		return parseInt(result.join(''), 2);
	};

	// INTIM read
	private static 0x284() {
		if(!PIA.timer) {
			PIA.timer = PIA.prevTimer || 0x296;
			PIA.cycle = PIA.timerIntervals[PIA.prevTimer || 0x296];
		};

		return this.memory[0x284];
	};

	// INSTAT read
	private static 0x285() {
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');
		bits[1] = '0';
		this.memory[0x285] = parseInt(bits.join(''), 2)
		return this.memory[0x285];
	};

	// TIM1T write
	private static 0x294(value: number) {
		if(value === undefined) return this.memory[0x294];
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		this.memory[0x294] = value;
		PIA.setTimer(0x294);

		return value;
	};

	// TIM8T write
	private static 0x295(value: number) {
		if(value === undefined) return this.memory[0x295];
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		this.memory[0x295] = value;
		PIA.setTimer(0x295);

		return value;
	};

	// TIM64T write
	private static 0x296(value: number) {
		if(value === undefined) return this.memory[0x296];
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		this.memory[0x296] = value;
		PIA.setTimer(0x296);

		return value;
	};

	// TIM1024T write
	private static 0x297(value: number) {
		if(value === undefined) return this.memory[0x297];
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		this.memory[0x297] = value;
		PIA.setTimer(0x297);

		return value;
	};
};
