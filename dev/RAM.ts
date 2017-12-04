import { PIA } from './PIA';
import { CPU } from './CPU';
import { Convert } from './Common';

export class Register {
	public static A: number = 0; // Accumulator
	public static P: number = 0; // Processor Counter
	public static PC: number = 0; // Program Counter
	public static S: number = 0; // Stack Pointer
	public static X: number = 0; // Index Register X
	public static Y: number = 0; // Index Register Y
};

export class Flag {
	public static B: number = 0; // Break flag
	public static C: number = 0; // Carry
	public static D: number = 1; // Decimal mode
	public static I: number = 0; // Interrupt disable bit
	public static N: number = 0; // Negative/Sign
	public static V: number = 0; // Overflow
	public static Z: number = 0; // Zero
};

export class RAM {
	public static memory: Uint8Array = new Uint8Array(65536);
	
	public static get(address: number) {
		return this.memory[address];
	};
	
	public static read(address: number) {
		let value: number = this.memory[address];
		
		if(this[address] !== undefined) {
			this[address]();
		};	
		
		return value;
	};
	
	public static readRom(rom: Uint8Array) {
		this.reset();
		
		this.memory[0x284] = (Math.random() * 255) >> 0;
		this.memory[0x294] = (Math.random() * 255) >> 0;
		this.memory[0x295] = (Math.random() * 255) >> 0;
		this.memory[0x296] = (Math.random() * 255) >> 0;
		this.memory[0x297] = (Math.random() * 255) >> 0;
		
		this.memory.set(rom, 61440);
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
	
	// WSYNC write
	private static 0x02() {
		CPU.lock();
	};
	
	// INSTAT read
	private static 0x285() {
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');
		bits[1] = '0';
		this.memory[0x285] = parseInt(bits.join(''), 2)
	};
	
	// TIM1T write
	private static 0x294(value: number) {
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		PIA.setTimer(0x294);
		
		return value;
	};
	
	// TIM8T write
	private static 0x295(value: number) {
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		PIA.setTimer(0x295);
		
		return value;
	};
	
	// TIM64T write
	private static 0x296(value: number) {
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		PIA.setTimer(0x296);
		
		return value;
	};
	
	// TIM1024T write
	private static 0x297(value: number) {
		let bits: Array<string> = Convert.toBin(this.memory[0x285]).split('');

		value = new Uint8Array([value - 1])[0];
		bits[0] = '0';
		PIA.setTimer(0x297);
		
		return value;
	};
};

export class Rom {
	public static data: Uint8Array = null;
	public static size: number = 0;
};
