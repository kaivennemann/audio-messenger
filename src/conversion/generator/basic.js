export class Basic 
{

    SCHEMA_FILE = './src/conversion/schema/basic.json'
    START_SYMBOL = '~'

    constructor(alphabet, minHz = 400,  maxHz = 8000, bands = 50) 
    {
        this.alphabet = alphabet;

        if (this.alphabet.includes(this.START_SYMBOL)) {
            throw new Error('Alphabet start symbol clash')
        }
        this.alphabet.push(this.START_SYMBOL)

        this.minHz = minHz;
        this.maxHz = maxHz;
        this.bands = bands;
    

        // Create valid freque
        this.valid_hz = [];

        for (let i = 0; i < bands; i++) {
            // Equal spacing across range
            this.valid_hz.push(
                minHz + Math.floor(
                    (maxHz - minHz)  * (i / bands)
                )
            )
        }

        // Assign symbols frequency
        const symbolCount = this.alphabet.length;
        const soundsPerSymbol = Math.ceil(symbolCount / bands)

        this.frequencyMap = this.alphabet.reduceRight((ret, cur, index) => {
            ret[cur] = [];

            let v = index

            for (let i = 0; i < soundsPerSymbol; i++) {
                ret[cur].push(this.valid_hz[v % bands])

                v = Math.floor(v / bands);
            }

            return ret
        }, {})
        
    }

    produceJson() {
        const data = {
            alphabet: this.alphabet,
            valid_hz: this.valid_hz,
            start: this.START_SYMBOL,
            frequencyMap: this.frequencyMap
        }

        return JSON.stringify(data);
    }
    

}