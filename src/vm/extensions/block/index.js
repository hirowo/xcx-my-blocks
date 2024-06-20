import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import log from '../../util/log';
import translations from './translations.json';
import blockIcon from './block-icon.png';

const SerialPort = require('serialport');

class SerialExtension {
    constructor(runtime) {
        this.runtime = runtime;
        this.selectedPort = null;
    }

    getInfo() {
        return {
            id: 'serialExtension',
            name: 'Serial Extension',
            blocks: [
                {
                    opcode: 'selectPort',
                    blockType: BlockType.COMMAND,
                    text: 'select port [PORT]',
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'ports'
                        }
                    }
                },
                {
                    opcode: 'sendToPort',
                    blockType: BlockType.COMMAND,
                    text: 'send [MESSAGE] to port',
                    arguments: {
                        MESSAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello, world!'
                        }
                    }
                }
            ],
            menus: {
                ports: this.getPortsMenu()
            }
        };
    }

    async getPortsMenu() {
        const ports = await SerialPort.list();
        return ports.map(port => ({
            text: port.path,
            value: port.path
        }));
    }

    selectPort(args) {
        if (this.selectedPort && this.selectedPort.isOpen) {
            this.selectedPort.close(() => {
                console.log('Port closed:', this.selectedPort.path);
            });
        }
        this.selectedPort = new SerialPort(args.PORT, { baudRate: 9600 });
        this.selectedPort.on('open', () => {
            console.log('Port opened:', args.PORT);
        });
        this.selectedPort.on('error', (err) => {
            console.error('Error opening port:', err.message);
        });
    }

    sendToPort(args) {
        if (this.selectedPort && this.selectedPort.isOpen) {
            this.selectedPort.write(args.MESSAGE, (err) => {
                if (err) {
                    console.error('Error sending message:', err.message);
                } else {
                    console.log('Message sent:', args.MESSAGE);
                }
            });
        } else {
            console.error('Port not selected or not open');
        }
    }
}

export default SerialExtension;
