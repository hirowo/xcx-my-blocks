const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');

class Scratch3WebSerialMonitor {
    constructor (runtime) {
        this.runtime = runtime;
        this.stopFlag = false;
    }

    getInfo () {
        return {
            id: 'webserialmonitor',
            name: 'Simple Test for Web Serial API',
            blocks: [
                {
                    opcode: 'connectSerial',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'disconnectSerial',
                    blockType: BlockType.COMMAND
                }
            ],
            menus: {
            }
        };
    }

    async startSerial() {
        try {
            console.log("INFO: 接続が確立しました");
            this.stopFlag = false;
            const port = await navigator.serial.requestPort();
            await port.open({
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: "none",
                bufferSize: 255,
                //👇設定ポイント①
                flowControl: "hardware"
            });
            while (port.readable) {
                const reader = port.readable.getReader();
                try {
                    while (!this.stopFlag) {
                        const { value, done } = await reader.read();
                        if (done) {
                            console.log("INFO: 読込モード終了");
                            break;
                        }
                        //👇生データはバイナリなので、ユニコード文字へデコード
                        const inputValue = new TextDecoder().decode(value);
                        console.log(inputValue);
                        //👇ついでに生のバイナリ(Uint8Arrayインスタンス)も表示
                        console.log(value);
                    }
                } catch (error) {
                    console.log("ERROR: 読み出し失敗");
                    console.log(error);
                } finally {
                    reader.releaseLock();
                    await port.close();
                    console.log("INFO: 接続を切断しました");
                }
            }
        } catch (error) {
            console.log("ERRORR: ポートが開けません");
            console.log(error);
        }
    }

    stopSerial() {
        this.stopFlag = true;
    }

    connectSerial() {
        console.log('Connected!');
        this.startSerial();
    }

    disconnectSerial() {
        console.log('Disconnected');
        this.stopSerial();
    }
}

module.exports = Scratch3WebSerialMonitor;