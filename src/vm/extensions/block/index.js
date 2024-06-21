import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import log from '../../util/log';
import translations from './translations.json';
import blockIcon from './block-icon.png';
const SerialPort = require('serialport');

/**
 * Formatter which is used for translation.
 * This will be replaced which is used in the runtime.
 * @param {object} messageData - format-message object
 * @returns {string} - message for the locale
 */
let formatMessage = messageData => messageData.default;

/**
 * Setup format-message for this extension.
 */
const setupTranslations = () => {
    const localeSetup = formatMessage.setup();
    if (localeSetup && localeSetup.translations[localeSetup.locale]) {
        Object.assign(
            localeSetup.translations[localeSetup.locale],
            translations[localeSetup.locale]
        );
    }
};

const EXTENSION_ID = 'myXtension';

/**
 * URL to get this extension as a module.
 * When it was loaded as a module, 'extensionURL' will be replaced a URL which is retrieved from.
 * @type {string}
 */
let extensionURL = 'https://hirowo.github.io/xcx-my-extension/dist/myXtension.mjs';

/**
 * Scratch 3.0 blocks for example of Xcratch.
 */
class ExtensionBlocks {
    /**
     * A translation object which is used in this class.
     * @param {FormatObject} formatter - translation object
     */
    static set formatMessage (formatter) {
        formatMessage = formatter;
        if (formatMessage) setupTranslations();
    }

    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return formatMessage({
            id: 'myXtension.name',
            default: 'My Extension',
            description: 'name of the extension'
        });
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return EXTENSION_ID;
    }

    /**
     * URL to get this extension.
     * @type {string}
     */
    static get extensionURL () {
        return extensionURL;
    }

    /**
     * Set URL to get this extension.
     * The extensionURL will be changed to the URL of the loading server.
     * @param {string} url - URL
     */
    static set extensionURL (url) {
        extensionURL = url;
    }

    /**
     * Construct a set of blocks for My Extension.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        if (runtime.formatMessage) {
            // Replace 'formatMessage' to a formatter which is used in the runtime.
            formatMessage = runtime.formatMessage;
        }

        // 追加部分
        this.runtime.on('PROJECT_STOP_ALL', () => {
            this.resetAudio();
        });
        this.resetAudio();
    }

    resetAudio() {
        if (this.audioCtx) {
            this.audioCtx.close();
        }
        this.audioCtx = new AudioContext();
    }

    playTone (args) {
        const oscillator = this.audioCtx.createOscillator();
        oscillator.connect(this.audioCtx.destination);
        oscillator.type = args.TYPE;
        oscillator.frequency.value = Cast.toNumber(args.FREQ);
        oscillator.start();
        return new Promise(resolve => {
            setTimeout(() => {
                oscillator.stop();
                resolve();
            }, Cast.toNumber(args.DUR) * 1000);
        });
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

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        setupTranslations();
        return {
            id: ExtensionBlocks.EXTENSION_ID,
            name: ExtensionBlocks.EXTENSION_NAME,
            extensionURL: ExtensionBlocks.extensionURL,
            blockIconURI: blockIcon,
            showStatusButton: false,
            blocks: [
                {
                    opcode: 'playTone',
                    blockType: BlockType.COMMAND,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'myBlocks.playTone',
                        default: 'hogehoge [SCRIPT]',
                        description: 'execute javascript for example'
                    }),
                    func: 'playTone',
                    arguments: {
                        FREQ: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 440
                        },
                        TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'waveTypeMenu'
                        },
                        DUR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'selectPort',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'serialExtension.selectPort',
                        default: 'select port [PORT]',
                        description: 'Select a serial port'
                    }),
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
                    text: formatMessage({
                        id: 'serialExtension.sendToPort',
                        default: 'send [MESSAGE] to port',
                        description: 'Send a message to the selected serial port'
                    }),
                    arguments: {
                        MESSAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello, world!'
                        }
                    }
                }
            ],
            menus: {
                waveTypeMenu: {
                    acceptReporters: false,
                    items: ['sine', 'square', 'sawtooth', 'triangle']
                },
                ports: {
                    acceptReporters: false,
                    items: this.getPortsMenu()
                }
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
}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
