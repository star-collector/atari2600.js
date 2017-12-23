import { Convert } from './Common';
import { RAM } from './RAM';
import { CPU } from './CPU';

// TODO: String to number for colors

export class TIA {
    private static colorPalette: Map<any, any> = new Map([
        ['0000000','#000000'],
        ['0000001','#1A1A1A'],
        ['0000010','#393939'],
        ['0000011','#5B5B5B'],
        ['0000100','#7E7E7E'],
        ['0000101','#A2A2A2'],
        ['0000110','#C7C7C7'],
        ['0000111','#EDEDED'],

        ['0001000','#190200'],
        ['0001001','#3A1F00'],
        ['0001010','#5D4100'],
        ['0001011','#826400'],
        ['0001100','#A78800'],
        ['0001101','#CCAD00'],
        ['0001110','#F2D219'],
        ['0001111','#FEFA40'],

        ['0010000','#370000'],
        ['0010001','#5E0800'],
        ['0010010','#832700'],
        ['0010011','#A94900'],
        ['0010100','#CF6C00'],
        ['0010101','#F58F17'],
        ['0010110','#FEB438'],
        ['0010111','#FEDF6F'],

        ['0011000','#470000'],
        ['0011001','#730000'],
        ['0011010','#981300'],
        ['0011011','#BE3216'],
        ['0011100','#E45335'],
        ['0011101','#FE7657'],
        ['0011110','#FE9C81'],
        ['0011111','#FEC6BB'],

        ['0100000','#440008'],
        ['0100001','#6F001F'],
        ['0100010','#960640'],
        ['0100011','#BB2462'],
        ['0100100','#E14585'],
        ['0100101','#FE67AA'],
        ['0100110','#FE8CD6'],
        ['0100111','#FEB7F6'],

        ['0101000','#2D004A'],
        ['0101001','#570067'],
        ['0101010','#7D058C'],
        ['0101011','#A122B1'],
        ['0101100','#C743D7'],
        ['0101101','#ED65FE'],
        ['0101110','#FE8AF6'],
        ['0101111','#FEB5F7'],

        ['0110000','#0D0082'],
        ['0110001','#3300A2'],
        ['0110010','#550FC9'],
        ['0110011','#782DF0'],
        ['0110100','#9C4EFE'],
        ['0110101','#C372FE'],
        ['0110110','#EB98FE'],
        ['0110111','#FEC0F9'],

        ['0111000','#000091'],
        ['0111001','#0A05BD'],
        ['0111010','#2822E4'],
        ['0111011','#4842FE'],
        ['0111100','#6B64FE'],
        ['0111101','#908AFE'],
        ['0111110','#B7B0FE'],
        ['0111111','#DFD8FE'],

        ['1000000','#000072'],
        ['1000001','#001CAB'],
        ['1000010','#033CD6'],
        ['1000011','#205EFD'],
        ['1000100','#4081FE'],
        ['1000101','#64A6FE'],
        ['1000110','#89CEFE'],
        ['1000111','#B0F6FE'],

        ['1001000','#00103A'],
        ['1001001','#00316E'],
        ['1001010','#0055A2'],
        ['1001011','#0579C8'],
        ['1001100','#239DEE'],
        ['1001101','#44C2FE'],
        ['1001110','#68E9FE'],
        ['1001111','#8FFEFE'],

        ['1010000','#001F02'],
        ['1010001','#004326'],
        ['1010010','#006957'],
        ['1010011','#008D7A'],
        ['1010100','#1BB19E'],
        ['1010101','#3BD7C3'],
        ['1010110','#5DFEE9'],
        ['1010111','#86FEFE'],

        ['1011000','#002403'],
        ['1011001','#004A05'],
        ['1011010','#00700C'],
        ['1011011','#09952B'],
        ['1011100','#28BA4C'],
        ['1011101','#49E06E'],
        ['1011110','#6CFE92'],
        ['1011111','#97FEB5'],

        ['1100000','#002102'],
        ['1100001','#004604'],
        ['1100010','#086B00'],
        ['1100011','#289000'],
        ['1100100','#49B509'],
        ['1100101','#6BDB28'],
        ['1100110','#8FFE49'],
        ['1100111','#BBFE69'],

        ['1101000','#001501'],
        ['1101001','#103600'],
        ['1101010','#305900'],
        ['1101011','#537E00'],
        ['1101100','#76A300'],
        ['1101101','#9AC800'],
        ['1101110','#BFEE1E'],
        ['1101111','#E8FE3E'],

        ['1110000','#1A0200'],
        ['1110001','#3B1F00'],
        ['1110010','#5E4100'],
        ['1110011','#836400'],
        ['1110100','#A88800'],
        ['1110101','#CEAD00'],
        ['1110110','#F4D218'],
        ['1110111','#FEFA40'],

        ['1111000','#380000'],
        ['1111001','#5F0800'],
        ['1111010','#842700'],
        ['1111011','#AA4900'],
        ['1111100','#D06B00'],
        ['1111101','#F68F18'],
        ['1111110','#FEB439'],
        ['1111111','#FEDF70']
    ]);

    private static _bk: Array<number> = [0, 0, 0];

    private static _canvas: any = null;

    private static _ctx: any = null;

    private static _colup0: Array<number> = [0, 0, 0];

    private static _colup1: Array<number> = [0, 0, 0];

    private static _colupf: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

    private static _grp0: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

    private static _grp1: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

	private static _imageData: any = null;

    private static _expectNewFrame: boolean = false;

    private static _nusiz0: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

    private static _nusiz1: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

    private static _reflect: boolean = false;

    private static _pf: Array<number> = [0, 0, 0];

    private static _pf0: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

    private static _pf1: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

    private static _pf2: Array<string> = ['0', '0', '0', '0', '0', '0', '0', '0'];

    private static _scoreMode: boolean = false

    public static color(val: string) {
        return this.colorPalette.get(val.slice(0, -1));
    };

    public static get canvas() {
        return this._canvas;
    };

    public static set canvas(canvas: any) {
        this._canvas = canvas;

        this.canvas.width = 160;

        this.canvas.height = 192;

        this.ctx = canvas.getContext('2d');

        this.ctx.fillStyle = '#000';

        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    };

    public static get bk() {
        return this._bk;
    };

    public static set bk(bk: Array<number>) {
        this._bk = bk;
    };

    public static get colupf() {
        return this._colupf;
    };

    public static set colupf(colupf: Array<string>) {
        this._colupf = colupf;
    };

    public static get colup0() {
        return this._colup0;
    };

    public static set colup0(colup0: Array<number>) {
        this._colup0 = colup0;
    };

    public static get colup1() {
        return this._colup1;
    };

    public static set colup1(colup1: Array<number>) {
        this._colup1 = colup1;
    };

    public static get ctx() {
        return this._ctx;
    };

    public static set ctx(ctx: any) {
        this._ctx = ctx;
    };

    public static get expectNewFrame() {
        return this._expectNewFrame;
    };

    public static set expectNewFrame(expectNewFrame: boolean) {
        this._expectNewFrame = expectNewFrame;
    };

    public static get grp0() {
        return this._grp0;
    };

    public static set grp0(grp0: Array<string>) {
        this._grp0 = grp0;
    };

    public static get grp1() {
        return this._grp1;
    };

    public static set grp1(grp1: Array<string>) {
        this._grp1 = grp1;
    };

    public static get imageData() {
        return this._imageData;
    };

    public static set imageData(imageData: any) {
        this._imageData = imageData;
    };

    public static get nusiz0() {
        return this._nusiz0;
    };

    public static set nusiz0(nusiz0: Array<string>) {
        this._nusiz0 = nusiz0;
    };

    public static get nusiz1() {
        return this._nusiz1;
    };

    public static set nusiz1(nusiz1: Array<string>) {
        this._nusiz1 = nusiz1;
    };

    public static get reflect() {
        return this._reflect;
    };

    public static set reflect(reflect: boolean) {
        this._reflect = reflect;
    };

    public static get pf0() {
        return this._pf0;
    };

    public static set pf0(pf0: Array<string>) {
        this._pf0 = pf0;
    };

    public static get pf() {
        return this._pf;
    };

    public static set pf(pf: Array<number>) {
        this._pf = pf;
    };

    public static get pf1() {
        return this._pf1;
    };

    public static set pf1(pf1: Array<string>) {
        this._pf1 = pf1;
    };

    public static get pf2() {
        return this._pf2;
    };

    public static set pf2(pf2: Array<string>) {
        this._pf2 = pf2;
    };

    public static get scoreMode() {
        return this._scoreMode;
    };

    public static set scoreMode(scoreMode: boolean) {
        this._scoreMode = scoreMode;
    };

    public static nextFrame() {
        return new Promise((resolve: Function) => {
            for(let scanline = 1; scanline <= 3; scanline++) {
                for(let clock = 0; clock < 228; clock += 3) {
                    CPU.pulse();
                };

                CPU.unlock();
            };

            for(let scanline = 1; scanline <= 37; scanline++) {
                for(let clock = 0; clock < 228; clock += 3) {
                    CPU.pulse();
                };

                CPU.unlock();
            };


            for(let scanline = 1; scanline <= 192; scanline++) {
                for(let clock = 0; clock < 68; clock += 3) {
                    CPU.pulse();
                };

                let counter: number = 2;
                for(let clock = 0; clock < 160; clock += 1) {
                    this.imageData = this.setPixel(this.imageData, this.canvas.width, this.canvas.height, scanline, clock);

                    if(counter > 2) {
                        counter = 0;
                        CPU.pulse();
                    };

                    counter++;
                };

                CPU.unlock();
            };

            this.ctx.putImageData(this.imageData, 0, 0);

            for(let scanline = 1; scanline <= 30; scanline++) {
                for(let clock = 0; clock < 228; clock += 3) {
                    CPU.pulse();
                };

                CPU.unlock();
            };

            this.expectNewFrame = false;

            resolve(true);
        });
    };

    public static setPixel(imageData: any, w: number, h: number, scanline: number, clock: number) {
        let c: Array<number> = this.bk;

        if(clock <= 16) {
            for(let i = 4; i <= 16; i += 4) {
                if(clock <= i) {
                    if(this.pf0[4 + (i / 4) - 1] == '1') {
                        c = (this.scoreMode ? this.colup0 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 16 && clock <= 48) {
            for(let i = 20; i <= 48; i += 4) {
                if(clock <= i) {
                    if(this.pf1[7 - (i / 4 - 5)] == '1') {
                        c = (this.scoreMode ? this.colup0 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 48 && clock <= 80) {
            for(let i = 52; i <= 80; i += 4) {
                if(clock <= i) {
                    if(this.pf2[0 + (i / 4 - 13)] == '1') {
                        c = (this.scoreMode ? this.colup0 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 80 && clock <= 96 && !this.reflect) { // REF = 0
            for(let i = 84; i <= 96; i += 4) {
                if(clock <= i) {
                    if(this.pf0[4 + (i / 4) - 21] == '1') {
                        c = (this.scoreMode ? this.colup1 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 96 && clock <= 128 && !this.reflect) {
            for(let i = 100; i <= 128; i += 4) {
                if(clock <= i) {
                    if(this.pf1[7 - (i / 4 - 25)] == '1') {
                        c = (this.scoreMode ? this.colup1 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 128 && clock <= 160 && !this.reflect) {
            for(let i = 132; i <= 160; i += 4) {
                if(clock <= i) {
                    if(this.pf2[0 + (i / 4 - 33)] == '1') {
                        c = (this.scoreMode ? this.colup1 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 80 && clock <= 112 && this.reflect) { // REF = 1
            for(let i = 84; i <= 112; i += 4) {
                if(clock <= i) {
                    if(this.pf2[7 - (i / 4 - 21)] == '1') {
                        c = (this.scoreMode ? this.colup1 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 112 && clock <= 144 && this.reflect) {
            for(let i = 116; i <= 144; i += 4) {
                if(clock <= i) {
                    if(this.pf1[0 + (i / 4 - 29)] == '1') {
                        c = (this.scoreMode ? this.colup1 : this.pf);
                    };
                    break;
                };
            };
        } else if(clock > 144 && clock <= 160 && this.reflect) {
            for(let i = 148; i <= 160; i += 4) {
                if(clock <= i) {
                    if(this.pf0[7 - (i / 4 - 37)] == '1') {
                        c = (this.scoreMode ? this.colup1 : this.pf);
                    };
                    break;
                };
            };
        };

        if(this.grp0[(8 + clock) % 8] == '1') {
            c = this.colup0;
        };

        let pixelindex = (scanline * w + clock) << 2;
        imageData.data[pixelindex] = c[0];
        imageData.data[pixelindex + 1] = c[1];
        imageData.data[pixelindex + 2] = c[2];

        return imageData;
    };

    public static toHex(hex: string) {
        let c: any = [];
        hex = hex.replace('#','');
        c[0] = parseInt(hex.substring(0, 2), 16);
        c[1] = parseInt(hex.substring(2, 4), 16);
        c[2] = parseInt(hex.substring(4, 6), 16);
        return c;
    };
};
