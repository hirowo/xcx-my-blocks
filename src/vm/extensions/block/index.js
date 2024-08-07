import BlockType from '../../extension-support/block-type';
import ArgumentType from '../../extension-support/argument-type';
import Cast from '../../util/cast';
import log from '../../util/log';
import translations from './translations.json';
import blockIcon from './block-icon.png';

//const SerialPort = require('serialport');

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
    }

    async startSerial() {
        try {
            console.log("INFO: 接続が確立しました");
            this.stopFlag = false;
            this.port = await navigator.serial.requestPort();
            await this.port.open({
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: "none",
                bufferSize: 255,
                flowControl: "none"
            });
        } catch (error) {
            console.log("ERROR: ポートが開けません");
            console.log(error);
        }
    }

    async stopSerial() {
        try {
            this.stopFlag = true;
            if (this.port) {
                await this.port.close();
                console.log("INFO: 接続を切断しました");
                this.port = null;
            }
        } catch (error) {
            console.log("ERROR: ポートを閉じることができません");
            console.log(error);
        }
    }   
    
    async WriteSerial() {
        if (this.port && this.port.writable) {
            try {
                const writer = this.port.writable.getWriter();
                const data = new TextEncoder().encode("Hello, World!");
                await writer.write(data);
                writer.releaseLock();
                console.log("INFO: データが送信されました");
            } catch (error) {
                console.log("ERROR: データ送信に失敗しました");
                console.log(error);
            }
        } else {
            console.log("ERROR: ポートが開かれていません");
        }
    }

    connectSerial() {
        console.log('Connected!');
        this.startSerial();
    }

    disconnectSerial() {
        console.log('Disconnected');
        this.stopSerial();
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
                    opcode: 'connectSerial',
                    blockType: BlockType.COMMAND,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'connectSerial',
                        default: 'connectSerial240703 [SCRIPT]',
                        description: 'execute javascript for example'
                    }),
                    func: 'connectSerial',
                },
                {
                    opcode: 'disconnectSerial',
                    blockType: BlockType.COMMAND,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'disconnectSerial',
                        default: 'disconnectSerial',
                        description: 'execute javascript for example'
                    }),
                    func: 'disconnectSerial',
                },
                {
                    opcode: 'WriteSerial',
                    blockType: BlockType.COMMAND,
                    blockAllThreads: false,
                    text: formatMessage({
                        id: 'wSerial',
                        default: 'writeSerial',
                        description: 'execute javascript for example'
                    }),
                    func: 'WriteSerial',
                }
            ],
        };
    }
}

export {ExtensionBlocks as default, ExtensionBlocks as blockClass};
